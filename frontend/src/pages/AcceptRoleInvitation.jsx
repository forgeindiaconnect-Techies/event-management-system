import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import {
  BsEnvelope,
  BsPersonBadge,
  BsPerson,
  BsPhone,
  BsLock,
  BsEye,
  BsEyeSlash,
} from "react-icons/bs";

function AcceptRoleInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadInvitation() {
      try {
        const resTheater = await api.get(`/theater-invitations/${token}`);
        setInvitation(resTheater.data);
      } catch (e1) {
        try {
          const res = await api.get(`/role-invitations/${token}`);
          setInvitation(res.data);
        } catch (e2) {
          setMessage(e2.response?.data?.message || "Invalid or expired invitation link.");
        }
      }
    }

    loadInvitation();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      let isTheater = false;
      let userRes = null;

      const isTheaterInv = Boolean(invitation?.theaterPortal || invitation?.invitedByTheaterUser);

      if (isTheaterInv) {
        userRes = await api.post(`/theater-invitations/accept/${token}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNumber: form.phoneNumber,
          password: form.password,
        });
        isTheater = true;
      } else {
        try {
          userRes = await api.post(`/theater-invitations/accept/${token}`, {
            firstName: form.firstName,
            lastName: form.lastName,
            phoneNumber: form.phoneNumber,
            password: form.password,
          });
          isTheater = true;
        } catch (err1) {
          userRes = await api.post(`/role-invitations/accept/${token}`, {
            firstName: form.firstName,
            lastName: form.lastName,
            phoneNumber: form.phoneNumber,
            password: form.password,
          });
        }
      }

      if (isTheater && userRes?.data) {
        const user = userRes.data;
        localStorage.setItem("userRole", user.role || "THEATER_MANAGER");
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userName", `${user.firstName || ''} ${user.lastName || ''}`.trim());
        if (user.theaterPortal?.id) {
          localStorage.setItem("portalId", user.theaterPortal.id);
        }
        setMessage("Theater account setup successfully! Redirecting to Theater Manager Dashboard...");
        setTimeout(() => {
          navigate("/theater/manager-dashboard");
        }, 1500);
        return;
      }

      setMessage("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to accept invitation.");
    }
  };

  const handleReject = async () => {
    try {
      try {
        await api.post(`/theater-invitations/reject/${token}`);
      } catch (err1) {
        await api.post(`/role-invitations/reject/${token}`);
      }
      setMessage("Invitation rejected successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to reject invitation.");
    }
  };

  const inputStyle = {
    height: "56px",
    fontSize: "16px",
    borderRadius: "0 12px 12px 0",
  };

  const iconBoxStyle = {
    width: "52px",
    borderRadius: "12px 0 0 12px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
      }}
    >
      <div
        className="bg-white shadow-lg"
        style={{
          width: "620px",
          borderRadius: "24px",
          padding: "34px",
        }}
      >
        <h1 className="fw-bold mb-2" style={{ fontSize: "34px" }}>
          Accept Invitation
        </h1>

        <p className="text-muted mb-4" style={{ fontSize: "18px" }}>
          Complete your account setup to join this portal.
        </p>

        {invitation && (
          <div
            className="p-4 rounded-4 mb-4 text-start"
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            {/* Auto-generated Employee / Login Username */}
            <div className="p-3 bg-white rounded-3 border border-primary border-opacity-25 mb-3 text-center shadow-sm">
              <span className="text-muted d-block small mb-1 fw-bold">YOUR ASSIGNED LOGIN USERNAME</span>
              <span className="fs-3 fw-bold text-primary font-monospace">
                {invitation.username || invitation.assignedUsername || "GC-1001"}
              </span>
              <span className="d-block text-secondary mt-1" style={{ fontSize: "13px" }}>
                💡 Use this Username (<strong>{invitation.username || "GC-1001"}</strong>) or your email to sign in.
              </span>
            </div>

            <p className="mb-2 d-flex align-items-center gap-2" style={{ fontSize: "16px" }}>
              <BsEnvelope color="#2563eb" />
              <strong>Email Address:</strong>{" "}
              <span className="badge bg-white text-dark border px-2 py-1 fs-6 fw-semibold">
                {invitation.email || invitation.inviteEmail || invitation.userEmail || "email@cinema.com"}
              </span>
            </p>

            <p className="mb-2 d-flex align-items-center gap-2" style={{ fontSize: "16px" }}>
              <BsPersonBadge color="#2563eb" />
              <strong>Assigned Role:</strong>{" "}
              <span className="badge bg-primary px-3 py-1 fs-6 fw-bold">
                {invitation.roleName === "THEATER_MANAGER" || invitation.role === "THEATER_MANAGER" || String(invitation.roleName || invitation.role).includes("MANAGER")
                  ? "Branch Manager"
                  : invitation.roleName === "THEATER_STAFF" || invitation.role === "THEATER_STAFF" || String(invitation.roleName || invitation.role).includes("STAFF")
                  ? "Theater Staff"
                  : "Branch Manager"}
              </span>
            </p>

            <hr className="my-2" />

            <p className="mb-2" style={{ fontSize: "16px" }}>
              <strong>🎭 Theater Portal:</strong>{" "}
              <span className="fw-bold text-primary">
                {invitation.theaterPortal?.portalName || invitation.portal?.portalName || invitation.portalName || localStorage.getItem("portalName") || "Gopal Multiplex"}
              </span>
            </p>

            <p className="mb-0" style={{ fontSize: "16px" }}>
              <strong>👑 Invited By (Owner):</strong>{" "}
              <span className="fw-semibold text-dark">
                {invitation.invitedByTheaterUser
                  ? `${invitation.invitedByTheaterUser.firstName || ""} ${invitation.invitedByTheaterUser.lastName || ""}`.trim()
                  : invitation.theaterPortal?.adminUser
                  ? `${invitation.theaterPortal.adminUser.firstName || ""} ${invitation.theaterPortal.adminUser.lastName || ""}`.trim()
                  : invitation.invitedBy
                  ? `${invitation.invitedBy.firstName || ""} ${invitation.invitedBy.lastName || ""}`.trim()
                  : "Gopal Multiplex"}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group mb-3">
            <span className="input-group-text" style={iconBoxStyle}>
              <BsPerson size={20} />
            </span>
            <input
              className="form-control"
              name="firstName"
              placeholder="Enter first name"
              value={form.firstName}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text" style={iconBoxStyle}>
              <BsPerson size={20} />
            </span>
            <input
              className="form-control"
              name="lastName"
              placeholder="Enter last name"
              value={form.lastName}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text" style={iconBoxStyle}>
              <BsPhone size={20} />
            </span>
            <input
              className="form-control"
              name="phoneNumber"
              placeholder="Enter phone number"
              value={form.phoneNumber}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text" style={iconBoxStyle}>
              <BsLock size={20} />
            </span>
            <input
              className="form-control"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ ...inputStyle, borderRadius: 0 }}
            />
            <button
              type="button"
              className="input-group-text bg-white"
              style={{ width: "52px", borderRadius: "0 12px 12px 0" }}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <BsEyeSlash /> : <BsEye />}
            </button>
          </div>

          <div className="input-group mb-4">
            <span className="input-group-text" style={iconBoxStyle}>
              <BsLock size={20} />
            </span>
            <input
              className="form-control"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              style={{ ...inputStyle, borderRadius: 0 }}
            />
            <button
              type="button"
              className="input-group-text bg-white"
              style={{ width: "52px", borderRadius: "0 12px 12px 0" }}
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <BsEyeSlash /> : <BsEye />}
            </button>
          </div>

          <button
            className="btn btn-primary w-100 fw-semibold"
            style={{
              height: "54px",
              borderRadius: "12px",
              fontSize: "18px",
            }}
          >
            Create Account
          </button>

          <button
            type="button"
            className="btn btn-outline-danger w-100 fw-semibold mt-2"
            style={{
              height: "54px",
              borderRadius: "12px",
              fontSize: "18px",
            }}
            onClick={handleReject}
          >
            Reject Invitation
          </button>
        </form>

        {message && (
          <div className="alert alert-info mt-3 mb-0" style={{ fontSize: "15px" }}>
            {message}
          </div>
        )}

        <div className="mt-4 text-center" style={{ fontSize: "16px" }}>
          Already have an account?{" "}
          <Link to="/login" className="text-decoration-none">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AcceptRoleInvitation;
