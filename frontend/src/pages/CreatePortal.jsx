import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import {
  BsBox,
  BsBuilding,
  BsPerson,
  BsEnvelope,
  BsPhone,
  BsShieldCheck,
  BsArrowRight,
} from "react-icons/bs";
import { Eye, EyeOff } from "lucide-react";

function CreatePortal() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    portalName: "",
    description: "",
    category: "COLLEGE",
    logoUrl: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/create-portal", form);

      localStorage.clear();
      localStorage.setItem("token", response.data.token || "");
      localStorage.setItem("role", response.data.role || "");
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("userId", response.data.userId || "");
      localStorage.setItem("portalId", response.data.portalId || "");
      localStorage.setItem("portalCode", response.data.portalCode || "");
      localStorage.setItem("portalName", response.data.portalName || form.portalName);
      localStorage.setItem("firstName", response.data.firstName || form.firstName);
      localStorage.setItem("lastName", response.data.lastName || form.lastName);
      localStorage.setItem("phoneNumber", response.data.phoneNumber || form.phoneNumber);

      navigate(response.data.redirectPath || "/subscription");
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message ||
        (error.response?.status === 409
          ? "This email address or portal name already exists."
          : "Unable to create portal. Please check your details.")
      );
    }
  };

  return (
    <div className="create-portal-page" style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <nav
        className="create-portal-navbar d-flex align-items-center justify-content-between px-5"
        style={{ height: "66px", background: "#12085c", color: "#fff" }}
      >
        <Link to="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
          <BsBox size={30} />
          <span className="create-portal-brand fw-bold" style={{ fontSize: "24px" }}>BackRooms</span>
        </Link>

        <Link to="/login" className="btn btn-light public-user-btn">
          Back to Login
        </Link>
      </nav>

      <div className="create-portal-container container py-5">
        <div className="row g-4">
          <div className="create-portal-intro-column col-lg-4">
            <div
              className="create-portal-intro p-4 h-100"
              style={{
                borderRadius: "28px",
                background: "linear-gradient(135deg,#0f172a,#1e3a8a,#7c3aed)",
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
                <BsBuilding />
              </div>

              <h1 className="fw-bold mb-3" style={{ fontSize: "32px" }}>
                Create Your Portal
              </h1>

              <p style={{ color: "#dbeafe", fontSize: "16px" }}>
                Set up your organization workspace and start managing events,
                registrations, teams, tickets and reports from one dashboard.
              </p>

              <div className="mt-4 d-grid gap-3">
                <InfoBox
                  icon={<BsShieldCheck />}
                  title="Secure workspace"
                  text="Every portal has its own users, events and role access."
                />
                <InfoBox
                  icon={<BsPerson />}
                  title="Owner account"
                  text="The first user becomes the portal admin."
                />
              </div>
            </div>
          </div>

          <div className="create-portal-form-column col-lg-8">
            <div
              className="create-portal-form-card bg-white shadow-sm p-4"
              style={{ borderRadius: "28px" }}
            >
              <h2 className="fw-bold mb-2" style={{ fontSize: "28px" }}>
                Portal Details
              </h2>

              <p className="text-muted mb-4">
                Create your organization portal and owner account.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Portal Name</label>
                    <input
                      className="form-control"
                      name="portalName"
                      placeholder="Enter your organization name"
                      value={form.portalName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="COLLEGE">College</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="PUBLIC">Public</option>
                      <option value="ALL">All</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="3"
                      placeholder="Describe your organization or event portal"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Logo URL</label>
                    <input
                      className="form-control"
                      name="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={form.logoUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <h3 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
                  Owner Account
                </h3>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">First Name</label>
                    <input
                      className="form-control"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Last Name</label>
                    <input
                      className="form-control"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      className="form-control"
                      name="phoneNumber"
                      placeholder="Enter your phone number"
                      value={form.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="position-relative">
                      <input
                        className="form-control pe-5"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                      <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((current) => !current)}
                        className="btn border-0 bg-transparent position-absolute"
                        style={{ top: "50%", right: 12, transform: "translateY(-50%)", padding: 0, color: "#6b7280" }}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {message && <div className="alert alert-danger mt-4">{message}</div>}

                <button className="create-portal-submit btn btn-primary mt-4 px-4">
                  Create Portal <BsArrowRight className="ms-2" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, title, text }) {
  return (
    <div
      className="p-3"
      style={{
        borderRadius: "18px",
        background: "rgba(255,255,255,.12)",
        border: "1px solid rgba(255,255,255,.18)",
      }}
    >
      <div style={{ fontSize: "24px" }}>{icon}</div>
      <h6 className="fw-bold mt-2 mb-1">{title}</h6>
      <p className="mb-0" style={{ color: "#dbeafe", fontSize: "14px" }}>
        {text}
      </p>
    </div>
  );
}

export default CreatePortal;
