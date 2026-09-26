import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import {
  BsFilm,
  BsBuilding,
  BsPerson,
  BsEnvelope,
  BsPhone,
  BsShieldCheck,
  BsTags,
  BsArrowRight,
  BsTv,
  BsGrid3X3,
} from "react-icons/bs";
import ficLogo from "../../assets/images/fic-logo.png";
import "../../styles/Admin.css";

export default function TheaterPartnerSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cinemaName: "",
    city: "Chennai",
    theaterType: "SINGLE_SCREEN",
    ownerName: "",
    ownerEmail: "",
    mobileNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Create Theater Account
      const res = await api.post("/theater/create", {
        name: formData.cinemaName,
        city: formData.city,
        theaterType: formData.theaterType,
        ownerEmail: formData.ownerEmail,
        ownerName: formData.ownerName,
        mobileNumber: formData.mobileNumber,
        phoneNumber: formData.mobileNumber,
        password: formData.password,
        address: formData.city + ", India",
      });

      setMessage("SUCCESS: Theater Partner Portal created successfully!");
      setTimeout(() => {
        navigate("/theater/dashboard");
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create theater portal. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-portal-page" style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      {/* TOP NAVBAR (Matching CreatePortal.jsx) */}
      <nav
        className="create-portal-navbar d-flex align-items-center justify-content-between px-5"
        style={{ height: "66px", background: "#12085c", color: "#fff" }}
      >
        <Link to="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
          <img className="create-portal-navbar-logo" src={ficLogo} alt="FIC BackRooms logo" style={{ height: "36px" }} />
          <span className="create-portal-brand fw-bold" style={{ fontSize: "24px" }}>
            FIC BackRooms
          </span>
        </Link>

        <Link to="/login" className="btn btn-light public-user-btn fw-bold">
          Back to Login
        </Link>
      </nav>

      {/* CONTAINER (Matching CreatePortal.jsx layout) */}
      <div className="create-portal-container container py-5">
        <div className="row g-4">
          {/* LEFT INTRO COLUMN */}
          <div className="create-portal-intro-column col-lg-4">
            <div
              className="create-portal-intro p-4 h-100"
              style={{
                borderRadius: "28px",
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                color: "#fff",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center mb-4"
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "22px",
                  background: "rgba(255,255,255,.14)",
                  fontSize: "34px",
                }}
              >
                <BsFilm />
              </div>

              <h1 className="fw-bold mb-3" style={{ fontSize: "32px" }}>
                Create Theater Portal
              </h1>

              <p style={{ color: "#dbeafe", fontSize: "16px" }}>
                Set up your cinema partner portal to manage screens, seat layouts, movie showtimes, concessions, and box office sales.
              </p>

              <div className="mt-4 d-grid gap-3">
                <div className="d-flex gap-3 align-items-start p-3 rounded-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <BsTv size={24} className="text-warning mt-1" />
                  <div>
                    <strong className="d-block text-white mb-1">Single & Multiplex Support</strong>
                    <small style={{ color: "#cbd5e1" }}>Configure 1 screen or multi-hall cinema complexes.</small>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start p-3 rounded-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <BsGrid3X3 size={24} className="text-info mt-1" />
                  <div>
                    <strong className="d-block text-white mb-1">Visual Seat Layout Builder</strong>
                    <small style={{ color: "#cbd5e1" }}>Click-to-color seat categories for Recliner, Executive, and Normal.</small>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start p-3 rounded-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <BsShieldCheck size={24} className="text-success mt-1" />
                  <div>
                    <strong className="d-block text-white mb-1">Zero Monthly SaaS Fee</strong>
                    <small style={{ color: "#cbd5e1" }}>Listing your cinema is 100% free with automated ticket settlements.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM COLUMN (Matching CreatePortal.jsx) */}
          <div className="create-portal-form-column col-lg-8">
            <div
              className="create-portal-form-card bg-white shadow-sm p-4 p-md-5"
              style={{ borderRadius: "28px", border: "1px solid #e8ecf4" }}
            >
              <h2 className="fw-bold mb-2" style={{ fontSize: "28px" }}>
                Theater Details
              </h2>

              <p className="text-muted mb-4">
                Register your cinema partner portal and owner credentials.
              </p>

              {message && (
                <div className={`alert ${message.includes("SUCCESS") ? "alert-success" : "alert-danger"} mb-4`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small">Cinema / Theater Name *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><BsBuilding className="text-muted" /></span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2"
                      placeholder="e.g. Santhi Silver Screens or Rohini Multiplex"
                      value={formData.cinemaName}
                      onChange={(e) => setFormData({ ...formData, cinemaName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">City / Location *</label>
                    <input
                      type="text"
                      className="form-control py-2"
                      placeholder="e.g. Chennai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">Theater Type *</label>
                    <select
                      className="form-select py-2"
                      value={formData.theaterType}
                      onChange={(e) => setFormData({ ...formData, theaterType: e.target.value })}
                    >
                      <option value="SINGLE_SCREEN">Single-Screen Cinema</option>
                      <option value="MULTIPLEX">Multiplex Chain</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small">Owner / Manager Name *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><BsPerson className="text-muted" /></span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2"
                      placeholder="Full Name"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">Owner Contact Email *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0"><BsEnvelope className="text-muted" /></span>
                      <input
                        type="email"
                        className="form-control border-start-0 py-2"
                        placeholder="manager@cinema.com"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">Owner Mobile Number *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0"><BsPhone className="text-muted" /></span>
                      <input
                        type="tel"
                        className="form-control border-start-0 py-2"
                        placeholder="e.g. 9876543210"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small">Set Account Password *</label>
                  <input
                    type="password"
                    className="form-control py-2"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 py-3"
                  style={{ background: "#12085c", borderColor: "#12085c" }}
                  disabled={loading}
                >
                  {loading ? "Creating Portal..." : <>Create Theater Portal <BsArrowRight /></>}
                </button>
                <div className="mt-3 text-center small text-muted">
                  By creating a portal, you agree to our <Link to="/terms" className="text-decoration-none">Terms of Service</Link>.
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
