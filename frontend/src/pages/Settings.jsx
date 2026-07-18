import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsBuilding,
  BsCheckCircle,
  BsGear,
  BsImage,
  BsBank,
  BsShieldCheck,
  BsCreditCard,
} from "react-icons/bs";

function Settings() {
  const [portal, setPortal] = useState({
    portalName: "",
    portalCode: "",
    description: "",
    category: "",
    logoUrl: "",
    active: true,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [payout, setPayout] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", upiId: "" });

  useEffect(() => {
    fetchPortal();
    fetchPayoutAccount();
  }, []);

  const fetchPayoutAccount = async () => {
    try {
      setPayoutLoading(true);
      const { data } = await api.get("/portal/payout-account");
      setPayout(data || null);
    } catch (error) {
      console.error(error);
      setPayoutError(error.response?.data?.message || "Unable to load payout account status.");
    } finally {
      setPayoutLoading(false);
    }
  };

  const startPayoutSetup = async () => {
    setPayoutError(""); setPayoutMessage("");
    try {
      setPayoutSaving(true);
      await api.post("/portal/payout-account/onboarding", { gatewayProvider: "DEVELOPMENT" });
      await fetchPayoutAccount();
      setShowPayoutForm(true);
    } catch (error) {
      setPayoutError(error.response?.data?.message || "Unable to start payout setup.");
    } finally {
      setPayoutSaving(false);
    }
  };

  const submitPayoutDetails = async (event) => {
    event.preventDefault(); setPayoutError(""); setPayoutMessage("");
    try {
      setPayoutSaving(true);
      const { data } = await api.post("/portal/payout-account/development/details", payoutForm);
      setPayout(data);
      setPayoutForm({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", upiId: "" });
      setShowPayoutForm(false);
      setPayoutMessage("Test payout details saved securely. Only masked values were stored.");
    } catch (error) {
      setPayoutError(error.response?.data?.message || "Unable to save payout details.");
    } finally {
      setPayoutSaving(false);
    }
  };

  const simulateVerification = async (verificationStatus) => {
    setPayoutError(""); setPayoutMessage("");
    try {
      setPayoutSaving(true);
      const { data } = await api.patch("/portal/payout-account/development/verification", { verificationStatus });
      setPayout(data);
      setPayoutMessage(`Test payout account marked as ${formatPayoutValue(verificationStatus)}.`);
    } catch (error) {
      setPayoutError(error.response?.data?.message || "Unable to update test verification.");
    } finally {
      setPayoutSaving(false);
    }
  };

  const fetchPortal = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const response = await api.get(`/portals/${portalId}`);
      setPortal({
        portalName: response.data.portalName || "",
        portalCode: response.data.portalCode || "",
        description: response.data.description || "",
        category: response.data.category || "",
        logoUrl: response.data.logoUrl || "",
        active: response.data.active ?? true,
      });
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load portal settings.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPortal({
      ...portal,
      [name]: value,
    });
  };

  const handleSave = async () => {
    const portalId = localStorage.getItem("portalId");

    try {
      setLoading(true);
      await api.put(`/portals/${portalId}`, {
        portalName: portal.portalName,
        description: portal.description,
        category: portal.category,
        logoUrl: portal.logoUrl,
        active: portal.active,
      });

      localStorage.setItem("portalName", portal.portalName);

      setMessage("Portal settings updated successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to update portal settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="portal-settings-page">
      <div className="portal-settings-heading mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
          Portal Settings
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Manage portal information, branding and workspace status.
        </p>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      <div className="portal-settings-grid admin-page-grid row g-4">
        <div className="col-md-8">
          <div className="admin-bento-card">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="admin-bento-icon mb-0">
                <BsBuilding />
              </div>

              <div>
                <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
                  Portal Information
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                  Update your portal details.
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Portal Name</label>
              <input
                className="form-control"
                name="portalName"
                value={portal.portalName}
                onChange={handleChange}
                style={{ height: "44px", fontSize: "15px" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Portal Code</label>
              <input
                className="form-control"
                value={portal.portalCode || "Not generated"}
                readOnly
                style={{ height: "44px", fontSize: "15px", background: "#f4f6f9" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                name="category"
                value={portal.category}
                onChange={handleChange}
                style={{ height: "44px", fontSize: "15px" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="4"
                name="description"
                value={portal.description}
                onChange={handleChange}
                style={{ fontSize: "15px" }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
              style={{
                borderRadius: "10px",
                fontSize: "15px",
                padding: "9px 22px",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card mb-4">
            <div className="admin-bento-icon">
              <BsCheckCircle />
            </div>

            <p className="admin-bento-label">Portal Status</p>
            <h2 className="admin-bento-value">
              {portal.active ? "Active" : "Inactive"}
            </h2>

            <p className="text-muted mt-3 mb-0" style={{ fontSize: "15px" }}>
              This portal is currently available for event management.
            </p>
          </div>

          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsImage />
            </div>

            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Branding
            </h2>

            <label className="form-label">Logo URL</label>
            <input
              className="form-control mb-3"
              name="logoUrl"
              value={portal.logoUrl}
              onChange={handleChange}
              placeholder="Paste logo URL"
              style={{ height: "44px", fontSize: "15px" }}
            />

            {portal.logoUrl ? (
              <img
                src={portal.logoUrl}
                alt="Portal Logo"
                style={{
                  width: "100%",
                  height: "130px",
                  objectFit: "contain",
                  borderRadius: "16px",
                  background: "#f4f6f9",
                  padding: "12px",
                }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  height: "130px",
                  borderRadius: "16px",
                  background: "#f4f6f9",
                  color: "#6b7280",
                  fontSize: "15px",
                }}
              >
                No logo added
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="admin-bento-card portal-payout-settings">
        <div className="portal-payout-head">
          <div className="d-flex align-items-center gap-3"><div className="admin-bento-icon mb-0"><BsBank /></div><div><h2>Payments & Payouts</h2><p>Connect the account that will receive paid-event registration revenue.</p></div></div>
          <span className="portal-test-badge">TEST MODE — NO REAL MONEY</span>
        </div>

        {payoutError && <div className="alert alert-danger">{payoutError}</div>}
        {payoutMessage && <div className="alert alert-success">{payoutMessage}</div>}

        {payoutLoading ? <div className="portal-payout-loading">Loading payout account...</div> : <>
          <div className="portal-payout-summary">
            <div><span><BsShieldCheck /></span><small>Verification</small><strong>{formatPayoutValue(payout?.verificationStatus || "NOT_STARTED")}</strong></div>
            <div><span><BsCreditCard /></span><small>Payout status</small><strong>{formatPayoutValue(payout?.payoutStatus || "DISABLED")}</strong></div>
            <div><span><BsBank /></span><small>Gateway</small><strong>{formatPayoutValue(payout?.gatewayProvider || "DEVELOPMENT")}</strong></div>
          </div>

          {payout?.maskedAccountNumber && <div className="portal-payout-details">
            <div><small>Account holder</small><strong>{payout.accountHolderName || "Not available"}</strong></div><div><small>Bank</small><strong>{payout.bankName || "Not available"}</strong></div><div><small>Account number</small><strong>{payout.maskedAccountNumber}</strong></div><div><small>IFSC</small><strong>{payout.maskedIfsc || "Not added"}</strong></div><div><small>UPI ID</small><strong>{payout.maskedUpiId || "Not added"}</strong></div><div><small>Verified</small><strong>{payout.verifiedAt ? new Date(payout.verifiedAt).toLocaleDateString("en-IN") : "Not verified"}</strong></div>
          </div>}

          {!showPayoutForm && <div className="portal-payout-actions"><button className="btn btn-primary" onClick={startPayoutSetup} disabled={payoutSaving}>{payoutSaving ? "Starting..." : payout?.maskedAccountNumber ? "Update Test Details" : "Connect Test Payout Account"}</button>{payout?.maskedAccountNumber && <><button onClick={() => simulateVerification("VERIFIED")} disabled={payoutSaving}>Simulate Verified</button><button onClick={() => simulateVerification("REJECTED")} disabled={payoutSaving}>Simulate Rejected</button></>}</div>}

          {showPayoutForm && <form className="portal-payout-form" onSubmit={submitPayoutDetails}>
            <div className="portal-payout-warning"><BsShieldCheck /><div><strong>Development testing only</strong><span>Use fake details. Raw account number, IFSC and UPI values are never saved.</span></div></div>
            <div className="portal-payout-fields"><label>Account holder name<input required value={payoutForm.accountHolderName} onChange={(e) => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })} placeholder="Test Portal Account" /></label><label>Bank name<input required value={payoutForm.bankName} onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })} placeholder="Test Bank" /></label><label>Test account number<input required inputMode="numeric" value={payoutForm.accountNumber} onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })} placeholder="123456789012" /></label><label>Test IFSC code<input required value={payoutForm.ifscCode} onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value.toUpperCase() })} placeholder="TEST0001234" /></label><label>Test UPI ID <small>Optional</small><input value={payoutForm.upiId} onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })} placeholder="testportal@fic" /></label></div>
            <div className="portal-payout-actions"><button type="submit" className="btn btn-primary" disabled={payoutSaving}>{payoutSaving ? "Saving..." : "Save Test Payout Details"}</button><button type="button" onClick={() => setShowPayoutForm(false)}>Cancel</button></div>
          </form>}
        </>}
      </section>
      </div>
    </AdminLayout>
  );
}

function formatPayoutValue(value) {
  return String(value || "Not available").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default Settings;
