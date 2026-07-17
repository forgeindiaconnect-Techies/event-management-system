import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import { getDefaultBanner } from "../../utils/bannerUtils";
import logo from "../../assets/images/fic-logo.png";
import UserProfileMenu from "../../components/Public/UserProfileMenu";
import {
  BsCalendarEvent,
  BsGeoAlt,
  BsCreditCard,
  BsPhone,
  BsBank,
  BsArrowRight,
  BsShieldCheck,
} from "react-icons/bs";

function PublicPayment() {
  const { id, registrationId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [details, setDetails] = useState({ upiApp: "", upiId: "", cardName: "", cardNumber: "", expiry: "", cvv: "", bank: "", accountNumber: "", ifsc: "" });
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState("NOT_STARTED");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [id, registrationId]);

  const loadData = async () => {
    try {
      const eventRes = await api.get(`/events/public/${id}`);
      const regRes = await api.get(`/registrations/${registrationId}`);

      setEvent(eventRes.data);
      setRegistration(regRes.data);
      setPaymentState(regRes.data.paymentStatus || "NOT_STARTED");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load payment details.");
    }
  };

  const handlePayment = async () => {
    const validationMessage = validatePaymentDetails(paymentMethod, details);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    let paymentStarted = false;
    try {
      setLoading(true);
      setMessage("");

      const selectedMethod =
  paymentMethod === "UPI"
    ? `${details.upiApp} (UPI)`
    : paymentMethod === "CARD"
    ? "Debit / Credit Card"
    : "Net Banking";

      setPaymentState("PENDING");
      const startedRegistration = await api.put(
        `/registrations/${registrationId}/payment/start`,
        { paymentMethod: selectedMethod }
      );
      paymentStarted = true;
      setRegistration(startedRegistration.data);

      const paidRegistration = await api.put(`/registrations/${registrationId}/mark-paid`, {
        paymentMethod: selectedMethod,
      });
      setRegistration(paidRegistration.data);
      setPaymentState("PAID");

      navigate(`/public/ticket/${registrationId}`);
    } catch (error) {
      console.log(error);
      try {
        if (paymentStarted) {
          const failedRegistration = await api.put(`/registrations/${registrationId}/mark-failed`);
          setRegistration(failedRegistration.data);
        }
      } catch (statusError) {
        console.log(statusError);
      }
      setPaymentState("FAILED");
      setMessage(error.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (message && !event) {
    return <div className="container py-5 text-danger">{message}</div>;
  }

  if (!event || !registration) {
    return <div className="container py-5">Loading payment...</div>;
  }

  const participant = registration.participant;
  const banner = event.bannerUrl || getDefaultBanner(event.eventType);
  const quantity = Number(registration.ticketQuantity || 1);
  const ticketClassPrice = Number(registration.ticketClass?.price || 0);
  const amount = Number(registration.totalAmount || (ticketClassPrice * quantity) || event.ticketPrice || 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <nav
        className="public-flow-navbar d-flex justify-content-between align-items-center px-5"
        style={{ height: "68px", background: "#030712", color: "#fff" }}
      >
        <Link
          to="/"
          className="d-flex align-items-center gap-3 text-white text-decoration-none"
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#fff",
              overflow: "hidden",
              padding: "4px",
            }}
          >
            <img
              src={event.portal?.logoUrl || logo}
              alt={event.portal?.portalName || "FIC Events"}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <strong style={{ fontSize: "22px" }}>
            {event.portal?.portalName || "FIC Events"}
          </strong>
        </Link>

        <div className="public-flow-navbar-actions d-flex align-items-center gap-4">
          <Link to="/find-events" className="public-nav-link text-white text-decoration-none">
            Find Events
          </Link>
          <UserProfileMenu dark />
        </div>
      </nav>

      <main className="public-flow-main container py-5">
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="bg-white rounded-4 shadow-sm overflow-hidden">
              <img
                src={banner}
                alt={event.eventName}
                style={{
                  width: "100%",
                  height: "230px",
                  objectFit: "cover",
                }}
              />

              <div className="p-4">
                <span className="badge bg-primary mb-3">
                  {event.eventType || "EVENT"}
                </span>

                <h2 className="fw-bold mb-3">{event.eventName}</h2>

                <p className="text-muted">
                  <BsCalendarEvent className="me-2" />
                  {formatDate(event.startDateTime)}
                </p>

                <p className="text-muted mb-0">
                  <BsGeoAlt className="me-2" />
                  {event.venue || "Online"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-4 shadow-sm p-4 mt-4">
              <h4 className="fw-bold mb-3">Participant Details</h4>

              <InfoRow
                label="Name"
                value={`${participant?.firstName || ""} ${
                  participant?.lastName || ""
                }`}
              />

              <InfoRow label="Email" value={participant?.email} />
              <InfoRow label="Phone" value={participant?.phoneNumber} />
              <InfoRow label="Registration ID" value={`REG-${registration.id}`} />
              <InfoRow label="Ticket Class" value={registration.ticketClass?.name} />
              <InfoRow label="Quantity" value={quantity} />
            </div>
          </div>

          <div className="col-lg-5">
            <div className="public-flow-summary bg-white rounded-4 shadow-sm p-4 sticky-top">
              <h3 className="fw-bold mb-3">Payment</h3>

              <div className="d-flex align-items-center gap-2 text-success mb-3">
                <BsShieldCheck /> <strong>Secure demo payment</strong>
              </div>

              {paymentState === "PENDING" && (
                <div className="alert alert-warning py-2">Payment is processing...</div>
              )}
              {paymentState === "FAILED" && (
                <div className="alert alert-danger py-2">Previous payment failed. You can try again.</div>
              )}
              {paymentState === "PAID" && (
                <div className="alert alert-success py-2">Payment successful.</div>
              )}

              <div
                className="p-4 rounded-4 mb-4"
                style={{
                  background: "linear-gradient(135deg,#eef2ff,#ffffff)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p className="text-muted mb-1">Amount Payable</p>
                <h1 className="fw-bold mb-0">₹{Number(amount).toFixed(0)}</h1>
              </div>

              <h5 className="fw-bold mb-3">Choose Payment Method</h5>

              <PaymentOption
                active={paymentMethod === "UPI"}
                icon={<BsPhone />}
                title="UPI"
                desc="Google Pay, PhonePe, Paytm"
                onClick={() => setPaymentMethod("UPI")}
              />

              <PaymentOption
                active={paymentMethod === "CARD"}
                icon={<BsCreditCard />}
                title="Debit / Credit Card"
                desc="Visa, Mastercard, RuPay"
                onClick={() => setPaymentMethod("CARD")}
              />

              <PaymentOption
                active={paymentMethod === "NET_BANKING"}
                icon={<BsBank />}
                title="Net Banking"
                desc="Pay using bank account"
                onClick={() => setPaymentMethod("NET_BANKING")}
              />

              <PaymentDetails
                method={paymentMethod}
                details={details}
                onChange={(e) => setDetails((current) => ({ ...current, [e.target.name]: e.target.value }))}
              />

              {message && <div className="alert alert-danger mt-3">{message}</div>}

              <button
                className="btn btn-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                style={{ height: "48px", borderRadius: "12px" }}
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "Processing..." : `Pay ₹${Number(amount).toFixed(0)}`}
                <BsArrowRight />
              </button>

              <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "13px" }}>
                Demo payment: clicking Pay marks the registration as paid.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PaymentOption({ active, icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-100 text-start border mb-3 p-3"
      style={{
        borderRadius: "16px",
        background: active ? "#eef2ff" : "#fff",
        borderColor: active ? "#4f46e5" : "#e5e7eb",
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <div className="text-primary fs-4">{icon}</div>
        <div>
          <div className="fw-bold">{title}</div>
          <small className="text-muted">{desc}</small>
        </div>
      </div>
    </button>
  );
}

function PaymentDetails({ method, details, onChange }) {
  if (!method) return null;

  if (method === "UPI") {
    return <div className="border rounded-3 p-3 mb-3 bg-light">
      <label className="form-label fw-semibold">UPI application</label>
      <select className="form-select mb-3" name="upiApp" value={details.upiApp} onChange={onChange}>
        <option value="">Select UPI application</option>
        <option>Google Pay</option><option>PhonePe</option><option>Paytm</option><option>BHIM</option><option>Amazon Pay</option>
      </select>
      <label className="form-label fw-semibold">UPI ID</label>
      <input className="form-control" name="upiId" value={details.upiId} onChange={onChange} placeholder="name@bank" />
    </div>;
  }

  if (method === "CARD") {
    return <div className="border rounded-3 p-3 mb-3 bg-light">
      <label className="form-label fw-semibold">Name on card</label>
      <input className="form-control mb-3" name="cardName" value={details.cardName} onChange={onChange} placeholder="Card holder name" />
      <label className="form-label fw-semibold">Card number</label>
      <input className="form-control mb-3" name="cardNumber" inputMode="numeric" maxLength="19" value={details.cardNumber} onChange={onChange} placeholder="1234 5678 9012 3456" />
      <div className="row g-3">
        <div className="col-7"><label className="form-label fw-semibold">Expiry</label><input className="form-control" name="expiry" value={details.expiry} onChange={onChange} placeholder="MM/YY" maxLength="5" /></div>
        <div className="col-5"><label className="form-label fw-semibold">CVV</label><input className="form-control" type="password" inputMode="numeric" name="cvv" value={details.cvv} onChange={onChange} placeholder="123" maxLength="4" /></div>
      </div>
    </div>;
  }

  return <div className="border rounded-3 p-3 mb-3 bg-light">
    <label className="form-label fw-semibold">Bank</label>
    <select className="form-select mb-3" name="bank" value={details.bank} onChange={onChange}>
      <option value="">Select bank</option><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Indian Bank</option>
    </select>
    <label className="form-label fw-semibold">Account number</label>
    <input className="form-control mb-3" name="accountNumber" inputMode="numeric" value={details.accountNumber} onChange={onChange} placeholder="Enter account number" />
    <label className="form-label fw-semibold">IFSC code</label>
    <input className="form-control text-uppercase" name="ifsc" value={details.ifsc} onChange={onChange} placeholder="SBIN0001234" maxLength="11" />
  </div>;
}

function validatePaymentDetails(method, details) {
  if (!method) return "Choose a payment method to continue.";
  if (method === "UPI" && (!details.upiApp || !/^[\w.-]+@[\w.-]+$/.test(details.upiId))) return "Select a UPI application and enter a valid UPI ID.";
  if (method === "CARD" && (!details.cardName.trim() || details.cardNumber.replace(/\D/g, "").length < 12 || !/^\d{2}\/\d{2}$/.test(details.expiry) || !/^\d{3,4}$/.test(details.cvv))) return "Enter valid card holder, card number, expiry and CVV details.";
  if (method === "NET_BANKING" && (!details.bank || details.accountNumber.replace(/\D/g, "").length < 8 || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(details.ifsc))) return "Select a bank and enter a valid account number and IFSC code.";
  return "";
}

function InfoRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between border-bottom py-2">
      <span className="text-muted">{label}</span>
      <strong>{value || "N/A"}</strong>
    </div>
  );
}

function formatDate(dateTime) {
  if (!dateTime) return "To be announced";

  return new Date(dateTime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default PublicPayment;
