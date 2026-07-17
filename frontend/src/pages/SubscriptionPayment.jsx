import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsBank, BsCreditCard, BsPhone, BsShieldCheck } from "react-icons/bs";
import api, { API_BASE_URL } from "../api/axiosConfig";

const STORAGE_KEY = "developmentSubscriptionPayment";

function SubscriptionPayment() {
  const navigate = useNavigate();
  const payment = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }, []);
  const [method, setMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState({ upiApp: "", upiId: "", cardName: "", cardNumber: "", expiry: "", cvv: "", bank: "", accountNumber: "", ifsc: "" });
  const finalizedRef = useRef(false);
  const hasEnteredDetails = Object.values(details).some((value) => String(value).trim());

  const updateDetail = (event) => setDetails((current) => ({
    ...current,
    [event.target.name]: event.target.value,
  }));

  useEffect(() => {
    if (!payment) return undefined;
    const handlePageExit = () => {
      if (finalizedRef.current) return;
      const token = localStorage.getItem("token");
      fetch(`${API_BASE_URL}/subscriptions/payments/${hasEnteredDetails ? "fail" : "abandon"}`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentReference: payment.paymentReference, ...(hasEnteredDetails ? { failureReason: "Checkout exited after payment details were entered" } : {}) }),
      }).catch(() => {});
    };
    window.addEventListener("pagehide", handlePageExit);
    return () => window.removeEventListener("pagehide", handlePageExit);
  }, [payment, hasEnteredDetails]);

  const completePayment = async () => {
    if (!payment) return;
    const validationMessage = validatePaymentDetails(method, details);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    try {
      setProcessing(true);
      setMessage("");
      await api.post("/subscriptions/payments/verify", {
        paymentReference: payment.paymentReference,
        gatewayOrderId: payment.gatewayOrderId,
        gatewayPaymentId: `DEV-${method}-${Date.now()}`,
        gatewaySignature: "BACKROOMS-DEV-PAYMENT-SUCCESS",
      });
      finalizedRef.current = true;
      sessionStorage.removeItem(STORAGE_KEY);
      navigate("/subscription", {
        replace: true,
        state: { paymentCompleted: true },
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Payment could not be completed.");
    } finally {
      setProcessing(false);
    }
  };

  const leaveCheckout = async () => {
    if (!payment) return navigate("/subscription");
    try {
      setProcessing(true);
      await api.post(`/subscriptions/payments/${hasEnteredDetails ? "fail" : "abandon"}`, {
        paymentReference: payment.paymentReference,
        ...(hasEnteredDetails ? { failureReason: "Checkout exited after payment details were entered" } : {}),
      });
      finalizedRef.current = true;
      sessionStorage.removeItem(STORAGE_KEY);
      navigate("/subscription", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to cancel payment.");
      setProcessing(false);
    }
  };

  if (!payment) {
    return (
      <main className="container py-5 text-center">
        <h2>No pending payment</h2>
        <p className="text-muted">Choose a subscription plan before opening checkout.</p>
        <Link className="btn btn-primary" to="/subscription">View plans</Link>
      </main>
    );
  }

  return (
    <main className="subscription-checkout-page" style={{ minHeight: "100vh", background: "#f4f6fb", padding: "48px 20px" }}>
      <div className="subscription-checkout-container container" style={{ maxWidth: 980 }}>
        <button type="button" className="btn btn-link text-decoration-none p-0" onClick={leaveCheckout} disabled={processing}>← Back to plans</button>
        <div className="subscription-checkout-grid row g-4 mt-2">
          <section className="col-lg-7">
            <div className="subscription-checkout-methods bg-white rounded-4 shadow-sm p-4">
              <span className="text-primary fw-semibold">DEVELOPMENT CHECKOUT</span>
              <h1 className="h3 fw-bold mt-2">Choose payment method</h1>
              <p className="text-muted">Select how you want to simulate this payment.</p>
              <PaymentMethod active={method === "UPI"} icon={<BsPhone />} title="UPI" detail="Google Pay, PhonePe or Paytm" onClick={() => setMethod("UPI")} />
              <PaymentMethod active={method === "CARD"} icon={<BsCreditCard />} title="Debit / Credit Card" detail="Visa, Mastercard or RuPay" onClick={() => setMethod("CARD")} />
              <PaymentMethod active={method === "NET_BANKING"} icon={<BsBank />} title="Net Banking" detail="Pay using a bank account" onClick={() => setMethod("NET_BANKING")} />
              <PaymentDetails method={method} details={details} onChange={updateDetail} />
              {message && <div className="alert alert-danger mt-3 mb-0">{message}</div>}
            </div>
          </section>
          <aside className="col-lg-5">
            <div className="subscription-checkout-summary bg-white rounded-4 shadow-sm p-4">
              <div className="d-flex align-items-center gap-2 text-success mb-3"><BsShieldCheck /><strong>Secure demo payment</strong></div>
              <h2 className="h4 fw-bold">{payment.planName}</h2>
              <div className="d-flex justify-content-between border-bottom py-3"><span>Billing</span><strong>{label(payment.billingCycle)}</strong></div>
              {payment.prorated && (
                <>
                  <div className="d-flex justify-content-between border-bottom py-3"><span>Remaining-period value</span><strong>{money(payment.grossAmount)}</strong></div>
                  <div className="d-flex justify-content-between border-bottom py-3 text-success"><span>Unused plan credit</span><strong>− {money(payment.creditAmount)}</strong></div>
                  <div className="d-flex justify-content-between border-bottom py-3"><span>New access until</span><strong>{formatDate(payment.accessEndAt)}</strong></div>
                </>
              )}
              <div className="d-flex justify-content-between border-bottom py-3"><span>Reference</span><small className="text-end ms-3">{payment.paymentReference}</small></div>
              <div className="d-flex justify-content-between align-items-center py-4"><strong>Total</strong><strong className="fs-3">{money(payment.amount)}</strong></div>
              <button className="btn btn-primary w-100 py-3" onClick={completePayment} disabled={processing}>
                {processing ? "Processing..." : `Pay ${money(payment.amount)}`}
              </button>
              <button className="btn btn-link text-secondary w-100 mt-2" onClick={leaveCheckout} disabled={processing}>Exit checkout</button>
              <p className="small text-muted text-center mb-0 mt-2">No real money is charged in development mode.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PaymentDetails({ method, details, onChange }) {
  if (method === "UPI") {
    return <div className="subscription-payment-details border rounded-3 p-3 mb-3 bg-light">
      <label className="form-label fw-semibold">UPI application</label>
      <select className="form-select mb-3" name="upiApp" value={details.upiApp} onChange={onChange}>
        <option value="">Select UPI application</option><option>Google Pay</option><option>PhonePe</option><option>Paytm</option><option>BHIM</option>
      </select>
      <label className="form-label fw-semibold">UPI ID</label>
      <input className="form-control" name="upiId" value={details.upiId} onChange={onChange} placeholder="name@bank" />
    </div>;
  }
  if (method === "CARD") {
    return <div className="subscription-payment-details border rounded-3 p-3 mb-3 bg-light">
      <label className="form-label fw-semibold">Name on card</label>
      <input className="form-control mb-3" name="cardName" value={details.cardName} onChange={onChange} placeholder="Card holder name" />
      <label className="form-label fw-semibold">Card number</label>
      <input className="form-control mb-3" name="cardNumber" inputMode="numeric" maxLength="19" value={details.cardNumber} onChange={onChange} placeholder="1234 5678 9012 3456" />
      <div className="row g-3"><div className="col-7"><label className="form-label fw-semibold">Expiry</label><input className="form-control" name="expiry" value={details.expiry} onChange={onChange} placeholder="MM/YY" maxLength="5" /></div><div className="col-5"><label className="form-label fw-semibold">CVV</label><input className="form-control" name="cvv" type="password" inputMode="numeric" value={details.cvv} onChange={onChange} placeholder="123" maxLength="4" /></div></div>
    </div>;
  }
  return <div className="subscription-payment-details border rounded-3 p-3 mb-3 bg-light">
    <label className="form-label fw-semibold">Bank</label>
    <select className="form-select mb-3" name="bank" value={details.bank} onChange={onChange}><option value="">Select bank</option><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Indian Bank</option></select>
    <label className="form-label fw-semibold">Account number</label>
    <input className="form-control mb-3" name="accountNumber" inputMode="numeric" value={details.accountNumber} onChange={onChange} placeholder="Enter account number" />
    <label className="form-label fw-semibold">IFSC code</label>
    <input className="form-control text-uppercase" name="ifsc" value={details.ifsc} onChange={onChange} placeholder="SBIN0001234" maxLength="11" />
  </div>;
}

function validatePaymentDetails(method, details) {
  if (method === "UPI" && (!details.upiApp || !/^[\w.-]+@[\w.-]+$/.test(details.upiId))) return "Select a UPI application and enter a valid UPI ID.";
  if (method === "CARD" && (!details.cardName.trim() || details.cardNumber.replace(/\D/g, "").length < 12 || !/^\d{2}\/\d{2}$/.test(details.expiry) || !/^\d{3,4}$/.test(details.cvv))) return "Enter valid card holder, card number, expiry and CVV details.";
  if (method === "NET_BANKING" && (!details.bank || details.accountNumber.replace(/\D/g, "").length < 8 || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(details.ifsc))) return "Select a bank and enter a valid account number and IFSC code.";
  return "";
}

function PaymentMethod({ active, icon, title, detail, onClick }) {
  return (
    <button type="button" onClick={onClick} className="subscription-payment-method w-100 text-start p-3 mb-3 rounded-3" style={{ border: `1px solid ${active ? "#4f46e5" : "#dfe3eb"}`, background: active ? "#eef2ff" : "white" }}>
      <span className="d-flex align-items-center gap-3"><span className="fs-4 text-primary">{icon}</span><span><strong className="d-block">{title}</strong><small className="text-muted">{detail}</small></span></span>
    </button>
  );
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
}

function label(value) {
  return String(value || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export default SubscriptionPayment;
