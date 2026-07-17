import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BsArrowRight,
  BsArrowLeft,
  BsCheck2,
  BsClockHistory,
  BsCreditCard,
  BsDownload,
  BsExclamationCircle,
  BsLightningCharge,
  BsReceipt,
  BsShieldCheck,
  BsXLg,
} from "react-icons/bs";
import AdminNavbar from "../components/Navbar/AdminNavbar";
import api from "../api/axiosConfig";
import "../styles/Admin.css";

const PLAN_ORDER = { STANDARD: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
const PLAN_ACCENTS = {
  STANDARD: "#2563eb",
  PROFESSIONAL: "#7c3aed",
  ENTERPRISE: "#12085c",
};

function AdminSubscription() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [trialAvailable, setTrialAvailable] = useState(false);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      api.get("/subscriptions/plans"),
      api.get("/subscriptions/current"),
      api.get("/subscriptions/payments"),
      api.get("/subscriptions/trial/eligibility"),
    ]);

    if (results[0].status === "fulfilled") {
      setPlans(Array.isArray(results[0].value.data) ? results[0].value.data : []);
    }
    if (results[1].status === "fulfilled") {
      setSubscription(results[1].value.data || null);
    }
    if (results[2].status === "fulfilled") {
      setPayments(
        Array.isArray(results[2].value.data) ? results[2].value.data : []
      );
    }
    if (results[3].status === "fulfilled") {
      setTrialAvailable(Boolean(results[3].value.data?.available));
    }
    if (results.some((result) => result.status === "rejected")) {
      setMessage({
        type: "error",
        text: "Some subscription details could not be loaded. Please refresh.",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.active !== false),
    [plans]
  );

  const startPayment = async (plan) => {
    try {
      setProcessingPlan(plan.code);
      setMessage({ type: "", text: "" });
      const response = await api.post("/subscriptions/payments/initiate", {
        planCode: plan.code,
        billingCycle,
      });
      sessionStorage.setItem(
        "developmentSubscriptionPayment",
        JSON.stringify({ ...response.data, planName: plan.displayName })
      );
      navigate("/subscription/payment");
    } catch (error) {
      setMessage({
        type: "error",
        text: apiError(error, "Unable to initiate the development payment."),
      });
    } finally {
      setProcessingPlan("");
    }
  };

  const activateTrial = async () => {
    try {
      setProcessingPlan("FREE_TRIAL");
      setMessage({ type: "", text: "" });
      await api.post("/subscriptions/trial/activate");
      navigate("/admin", { replace: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: apiError(error, "Unable to activate the free trial."),
      });
      await loadData();
    } finally {
      setProcessingPlan("");
    }
  };

  const cancelRenewal = async () => {
    try {
      await api.post("/subscriptions/current/cancel-renewal");
      await loadData();
      setMessage({
        type: "success",
        text: "Renewal cancelled. Access remains available until expiry.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: apiError(error, "Unable to cancel renewal."),
      });
    }
  };

  const discardPendingPayment = async (paymentReference) => {
    try {
      setProcessingPlan("DISCARD_PENDING");
      await api.post("/subscriptions/payments/abandon", { paymentReference });
      sessionStorage.removeItem("developmentSubscriptionPayment");
      await loadData();
      setMessage({ type: "success", text: "The unfinished checkout was cleared. You can select a plan again." });
    } catch (error) {
      setMessage({ type: "error", text: apiError(error, "Unable to clear the pending checkout.") });
    } finally {
      setProcessingPlan("");
    }
  };

  const openReceipt = async (paymentReference) => {
    try {
      setReceiptLoading(paymentReference);
      const response = await api.get(
        "/subscriptions/payments/" + paymentReference + "/receipt"
      );
      setReceipt(response.data);
    } catch (error) {
      setMessage({
        type: "error",
        text: apiError(error, "Unable to load the payment receipt."),
      });
    } finally {
      setReceiptLoading("");
    }
  };

  return (
    <div className="subscription-standalone-shell">
      <div className="subscription-standalone-navbar">
        <AdminNavbar />
      </div>
      <main className="subscription-standalone-main">
        <div className="subscription-page">
        <header className="subscription-page-header">
          <div className="subscription-page-heading-group">
            <button
              type="button"
              className="subscription-back-button"
              onClick={() => navigate("/admin")}
              aria-label="Back to admin dashboard"
              title="Back to admin dashboard"
            >
              <BsArrowLeft />
            </button>
            <div>
            <span className="subscription-eyebrow">Plans & billing</span>
            <h1>Portal Subscription</h1>
            <p>Review your access, compare plans and manage development payments.</p>
            </div>
          </div>
          <div className="subscription-cycle-toggle">
            <button
              className={billingCycle === "MONTHLY" ? "active" : ""}
              onClick={() => setBillingCycle("MONTHLY")}
            >
              Monthly
            </button>
            <button
              className={billingCycle === "YEARLY" ? "active" : ""}
              onClick={() => setBillingCycle("YEARLY")}
            >
              Yearly <small>Save more</small>
            </button>
          </div>
        </header>

        {message.text && (
          <div className={"subscription-alert " + message.type}>
            {message.type === "success" ? <BsCheck2 /> : <BsExclamationCircle />}
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage({ type: "", text: "" })}
            >
              <BsXLg />
            </button>
          </div>
        )}

        {loading ? (
          <SubscriptionLoader />
        ) : (
          <>
            <CurrentSubscription
              subscription={subscription}
              onCancelRenewal={cancelRenewal}
            />

            <section className="subscription-plan-section">
              <div className="subscription-section-heading">
                <div>
                  <span>Choose your access</span>
                  <h2>Plans built for every event team</h2>
                </div>
                <p>Training payments only. No real money is charged.</p>
              </div>

              <div className="subscription-plan-grid">
                {trialAvailable && (
                  <TrialPlanCard
                    processing={processingPlan === "FREE_TRIAL"}
                    onSelect={activateTrial}
                  />
                )}
                {activePlans.map((plan) => (
                  <PlanCard
                    key={plan.code}
                    plan={plan}
                    subscription={subscription}
                    billingCycle={billingCycle}
                    processing={processingPlan === plan.code}
                    onSelect={() => startPayment(plan)}
                  />
                ))}
              </div>
            </section>

            <PaymentHistory
              payments={payments}
              receiptLoading={receiptLoading}
              onReceipt={openReceipt}
              onDiscard={discardPendingPayment}
              discarding={processingPlan === "DISCARD_PENDING"}
            />
          </>
        )}
        </div>
      </main>

      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

function CurrentSubscription({ subscription, onCancelRenewal }) {
  if (!subscription) {
    return (
      <section className="subscription-current-card empty">
        <div className="subscription-current-icon"><BsShieldCheck /></div>
        <div>
          <span>Current access</span>
          <h2>No active subscription</h2>
          <p>Select a plan below to continue managing your portal.</p>
        </div>
      </section>
    );
  }

  const progress = Math.max(
    0,
    Math.min(100, ((subscription.daysRemaining || 0) / 30) * 100)
  );
  const daysRemaining = Number(subscription.daysRemaining || 0);
  const isExpired = subscription.status === "EXPIRED";
  const expiresSoon = !isExpired && daysRemaining <= 5;

  return (
    <section className="subscription-current-card">
      <div className="subscription-current-main">
        <div className="subscription-current-icon"><BsShieldCheck /></div>
        <div>
          <span>Current plan</span>
          <div className="subscription-current-title">
            <h2>{subscription.planName}</h2>
            <b className={String(subscription.status || "").toLowerCase()}>
              {formatLabel(subscription.status)}
            </b>
          </div>
          <p>
            {isExpired
              ? `Your ${subscription.planName} plan has expired. Renew it below to restore access.`
              : subscription.trial
              ? `Your Standard trial is active until ${formatDate(subscription.endDate)}.`
              : formatLabel(subscription.billingCycle) + " billing access is active."}
          </p>
        </div>
      </div>

      {(expiresSoon || isExpired) && (
        <div className={`subscription-expiry-alert ${isExpired ? "expired" : "warning"}`}>
          <BsExclamationCircle />
          <div>
            <strong>{isExpired ? "Plan expired" : "Plan expires soon"}</strong>
            <span>
              {isExpired
                ? `Renew ${subscription.planName} or choose another plan.`
                : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} remaining · expires ${formatDate(subscription.endDate)}`}
            </span>
          </div>
        </div>
      )}

      <div className="subscription-current-metrics">
        <div>
          <span>Days remaining</span>
          <strong>{subscription.daysRemaining ?? 0}</strong>
          <div className="subscription-progress">
            <i style={{ width: progress + "%" }} />
          </div>
        </div>
        <div><span>Started</span><strong>{formatDate(subscription.startDate)}</strong></div>
        <div><span>Access until</span><strong>{formatDate(subscription.endDate)}</strong></div>
      </div>

      {subscription.nextPlanName && (
        <div className="subscription-scheduled-change">
          <BsClockHistory />
          <div>
            <span>Scheduled next plan</span>
            <strong>
              {subscription.nextPlanName + " · " +
                formatLabel(subscription.nextBillingCycle)}
            </strong>
            <small>Begins {formatDate(subscription.nextPlanStartsAt)}</small>
          </div>
        </div>
      )}

      {subscription.autoRenew && (
        <button
          type="button"
          className="subscription-cancel-renewal"
          onClick={onCancelRenewal}
        >
          Cancel renewal
        </button>
      )}
    </section>
  );
}

function TrialPlanCard({ processing, onSelect }) {
  return (
    <article className="subscription-plan-card free-trial" style={{ "--plan-accent": "#059669" }}>
      <div className="subscription-plan-top">
        <span>Free Trial</span>
        <div className="subscription-plan-symbol"><BsClockHistory /></div>
      </div>
      <p>Explore the Standard plan before deciding whether to purchase.</p>
      <div className="subscription-price"><strong>₹0</strong><span>/trial</span></div>
      <small className="subscription-monthly-equivalent">No payment details required</small>
      <ul>
        <li><BsCheck2 /> 2 days of Standard access</li>
        <li><BsCheck2 /> One free trial per portal</li>
        <li><BsCheck2 /> 3 active events</li>
        <li><BsCheck2 /> 10 portal users</li>
        <li><BsCheck2 /> Upgrade to any paid plan at any time</li>
      </ul>
      <button type="button" onClick={onSelect} disabled={processing}>
        {processing ? "Activating trial..." : "Start Free Trial"}
        {!processing && <BsArrowRight />}
      </button>
    </article>
  );
}

function PlanCard({ plan, subscription, billingCycle, processing, onSelect }) {
  const currentCode = subscription?.planCode;
  const isCurrent = currentCode === plan.code;
  const scheduled = subscription?.nextPlanCode === plan.code;
  const price = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
  const action = getPlanAction(
    currentCode,
    plan.code,
    isCurrent,
    scheduled,
    subscription?.status === "EXPIRED",
    Number(subscription?.daysRemaining || 0),
    plan.displayName,
    billingCycle,
    subscription?.billingCycle
  );
  const features = [
    limitText(plan.maxActiveEvents, "active events"),
    limitText(plan.maxPortalUsers, "portal users"),
    limitText(plan.maxRegistrationsPerEvent, "registrations per event"),
    limitText(plan.maxOrganizers, "organizers"),
    plan.customBranding ? "Custom portal branding" : "Standard branding",
    plan.advancedReports ? "Advanced reports" : "Essential reports",
  ];

  return (
    <article
      className={
        "subscription-plan-card " +
        String(plan.code || "").toLowerCase() +
        (plan.code === "PROFESSIONAL" ? " recommended" : "")
      }
      style={{ "--plan-accent": PLAN_ACCENTS[plan.code] || "#7c3aed" }}
    >
      {plan.code === "PROFESSIONAL" && (
        <span className="subscription-recommended">Most popular</span>
      )}
      <div className="subscription-plan-top">
        <span>{plan.displayName}</span>
        <div className="subscription-plan-symbol">
          {plan.code === "ENTERPRISE" ? <BsLightningCharge /> : <BsShieldCheck />}
        </div>
      </div>
      <p>{plan.description}</p>
      <div className="subscription-price">
        <strong>{money(price)}</strong>
        <span>/{billingCycle === "YEARLY" ? "year" : "month"}</span>
      </div>
      {billingCycle === "YEARLY" && (
        <small className="subscription-monthly-equivalent">
          About {money(Number(price || 0) / 12)} per month
        </small>
      )}
      <ul>
        {features.map((feature) => (
          <li key={feature}><BsCheck2 /> {feature}</li>
        ))}
      </ul>
      <button type="button" onClick={onSelect} disabled={processing || action.disabled}>
        {processing ? "Starting payment..." : action.label}
        {!processing && !action.disabled && <BsArrowRight />}
      </button>
    </article>
  );
}

function PaymentHistory({ payments, receiptLoading, onReceipt, onDiscard, discarding }) {
  return (
    <section className="subscription-history-card">
      <div className="subscription-section-heading">
        <div>
          <span>Billing activity</span>
          <h2>Development payment history</h2>
        </div>
        <BsReceipt />
      </div>
      <div className="table-responsive">
        <table className="subscription-payment-table">
          <thead>
            <tr>
              <th>Reference</th><th>Plan</th><th>Billing</th><th>Amount</th>
              <th>Status</th><th>Date</th><th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.paymentId || payment.paymentReference}>
                <td>
                  <strong>{payment.paymentReference}</strong>
                  <small>{payment.invoiceNumber || "Invoice not issued"}</small>
                </td>
                <td>{payment.planName}</td>
                <td>{formatLabel(payment.billingCycle)}</td>
                <td>{money(payment.amount)}</td>
                <td>
                  <span className={"subscription-payment-status " +
                    String(payment.status || "").toLowerCase()}>
                    {formatLabel(payment.status)}
                  </span>
                </td>
                <td>{formatDate(payment.paidAt || payment.createdAt)}</td>
                <td>
                  {payment.status === "PENDING" ? (
                    <button type="button" className="subscription-receipt-button"
                      onClick={() => onDiscard(payment.paymentReference)} disabled={discarding}>
                      <BsXLg /> {discarding ? "Clearing..." : "Discard"}
                    </button>
                  ) : ["SUCCESS", "REFUNDED"].includes(payment.status) ? (
                    <button
                      type="button"
                      className="subscription-receipt-button"
                      onClick={() => onReceipt(payment.paymentReference)}
                      disabled={receiptLoading === payment.paymentReference}
                    >
                      <BsReceipt />
                      {receiptLoading === payment.paymentReference ? "Loading..." : "View"}
                    </button>
                  ) : <span>—</span>}
                </td>
              </tr>
            ))}
            {!payments.length && (
              <tr>
                <td colSpan="7">
                  <div className="subscription-empty-history">
                    <BsCreditCard />
                    <strong>No development payments yet</strong>
                    <span>Your payment activity will appear here.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReceiptModal({ receipt, onClose }) {
  return (
    <div className="subscription-modal-backdrop" onClick={onClose}>
      <div className="subscription-receipt-modal" onClick={(event) => event.stopPropagation()}>
        <div className="subscription-receipt-head">
          <div><span>BackRooms · Subscription receipt</span><h2>{receipt.invoiceNumber}</h2></div>
          <button type="button" onClick={onClose}><BsXLg /></button>
        </div>
        <div className="subscription-receipt-company">
          <div><span>Billed to</span><strong>{receipt.portalName}</strong><small>{receipt.ownerEmail}</small></div>
          <div><span>Issued</span><strong>{formatDate(receipt.invoiceIssuedAt)}</strong><small>{receipt.portalCode}</small></div>
        </div>
        <div className="subscription-receipt-line">
          <div><strong>{receipt.planName} plan</strong><span>{formatLabel(receipt.billingCycle)} subscription</span></div>
          <strong>{money(receipt.amount)}</strong>
        </div>
        <div className="subscription-receipt-total">
          <span>Total paid</span><strong>{money(receipt.amount)}</strong>
        </div>
        <div className="subscription-receipt-meta">
          <span>Payment reference</span><strong>{receipt.paymentReference}</strong>
          <span>Payment status</span><strong>{formatLabel(receipt.paymentStatus)}</strong>
          <span>Access period</span>
          <strong>{formatDate(receipt.subscriptionStartDate)} – {formatDate(receipt.subscriptionEndDate)}</strong>
        </div>
        <button type="button" className="subscription-print-receipt" onClick={() => window.print()}>
          <BsDownload /> Print receipt
        </button>
      </div>
    </div>
  );
}

function SubscriptionLoader() {
  return <div className="subscription-loader"><span /><strong>Loading subscription details...</strong></div>;
}

function getPlanAction(
  currentCode,
  targetCode,
  isCurrent,
  scheduled,
  isExpired,
  daysRemaining,
  planName,
  selectedBillingCycle,
  currentBillingCycle
) {
  if (scheduled) return { label: "Scheduled", disabled: true };
  if (!currentCode) return { label: `Choose ${planName}`, disabled: false };
  if (isExpired) {
    return {
      label: isCurrent ? `Renew ${planName}` : `Choose ${planName}`,
      disabled: false,
    };
  }
  if (isCurrent) {
    if (selectedBillingCycle !== currentBillingCycle) {
      return {
        label: selectedBillingCycle === "YEARLY"
          ? `Add 1 year to ${planName}`
          : `Add 1 month to ${planName}`,
        disabled: false,
      };
    }
    if (daysRemaining <= 5) {
      return { label: `Renew ${planName}`, disabled: false };
    }
    if (targetCode === "ENTERPRISE") {
      return { label: "Extend ProMax", disabled: false };
    }
    return { label: "Current plan", disabled: true };
  }
  return PLAN_ORDER[targetCode] > PLAN_ORDER[currentCode]
    ? { label: `Upgrade to ${planName}`, disabled: false }
    : { label: `Downgrade to ${planName} at expiry`, disabled: false };
}

function limitText(value, label) {
  return Number(value) === -1 ? "Unlimited " + label : (value || 0) + " " + label;
}

function formatLabel(value) {
  if (!value) return "Not available";
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function apiError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.error || fallback;
}

export default AdminSubscription;
