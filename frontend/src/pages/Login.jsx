import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { Eye, EyeOff } from "lucide-react";
import ficLogo from "../assets/images/fic-logo.png";
import {
  BsCalendarEvent,
  BsPeople,
  BsShieldCheck,
  BsArrowRight,
} from "react-icons/bs";

const dashboardRoutes = {
  SUPER_ADMIN: "/super-admin",
  PORTAL_ADMIN: "/admin",
  ORGANIZER: "/organizer",
  STAFF: "/staff",
  VOLUNTEER: "/volunteer",
  COORDINATOR: "/coordinator",
  SPEAKER: "/speaker",
  JUDGE: "/judge",
  TRAINER: "/mentor",
  CHIEF_GUEST: "/chief-guest",
  PARTICIPANT: "/participant",
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/auth/login", { email, password });

      const rawRole =
        response.data.role?.roleName ||
        response.data.roleName ||
        response.data.role ||
        "";

      const role = rawRole === "Staff" ? "STAFF" : rawRole.toUpperCase();

      localStorage.clear();
      localStorage.setItem("token", response.data.token || "");
      localStorage.setItem("role", role);
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("userId", response.data.userId || response.data.id || "");
      localStorage.setItem("portalId", response.data.portalId || "");
      localStorage.setItem("portalCode", response.data.portalCode || "");
      localStorage.setItem("portalName", response.data.portalName || "");
      localStorage.setItem("firstName", response.data.firstName || "");
      localStorage.setItem("lastName", response.data.lastName || "");
      localStorage.setItem("phoneNumber", response.data.phoneNumber || response.data.phone || "");

      const accessOptions = await loadAccessOptions(
        response.data.userId || response.data.id,
        role,
        response.data.portalName
      );

      localStorage.setItem("accessOptions", JSON.stringify(accessOptions));

      if (accessOptions.length > 1) {
        navigate("/choose-access");
        return;
      }

      if (accessOptions.length === 1) {
        const selectedRole = normalizeRole(accessOptions[0].role || accessOptions[0].roleName);
        const selectedPath = dashboardRoutes[selectedRole] || accessOptions[0].path || dashboardRoutes[role] || "/login";

        localStorage.setItem("activeRole", selectedRole);
        localStorage.setItem("activeEventId", accessOptions[0].eventId || "");
        localStorage.setItem("activeEventName", accessOptions[0].eventName || "");
        localStorage.setItem("activeAssignmentId", accessOptions[0].assignmentId || "");
        localStorage.setItem("activePortalId", accessOptions[0].portalId || response.data.portalId || "");
        localStorage.setItem("activePortalName", accessOptions[0].portalName || response.data.portalName || "");
        navigate(selectedPath);
        return;
      }

      navigate(dashboardRoutes[role] || "/login");
    } catch (error) {
      console.log(error);
      setMessage("Invalid email or password");
    }
  };

  return (
    <div className="login-page" style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <nav
        className="login-navbar d-flex align-items-center justify-content-between px-5"
        style={{ height: "66px", background: "#12085c", color: "#fff" }}
      >
        <Link to="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
          <img className="login-navbar-logo" src={ficLogo} alt="FIC BackRooms logo" />
          <span className="login-brand fw-bold">
            FIC BackRooms
          </span>
        </Link>

        <div className="login-navbar-actions d-flex align-items-center gap-3">
          <Link to="/public" className="public-nav-link text-white text-decoration-none">
            Find Events
          </Link>
          <Link to="/create-portal" className="btn btn-light public-user-btn">
            Create Portal
          </Link>
        </div>
      </nav>

      <div className="login-container container py-5">
        <div className="row g-4 align-items-stretch">
          <div className="login-intro-column col-lg-7">
            <div
              className="login-intro h-100 p-5"
              style={{
                borderRadius: "28px",
                background:
                  "linear-gradient(135deg,#0f172a,#1e3a8a,#7c3aed)",
                color: "#fff",
              }}
            >
              <div className="mb-5">
                <span className="badge bg-light text-primary mb-3">
                  Event Management Workspace
                </span>

                <h1 className="fw-bold mb-3" style={{ fontSize: "42px" }}>
                  Welcome back to FIC BackRooms
                </h1>

                <p style={{ fontSize: "18px", color: "#dbeafe", maxWidth: "620px" }}>
                  Login to manage portals, events, registrations, teams,
                  attendance, tickets and role-based dashboards from one place.
                </p>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <BentoInfoCard
                    icon={<BsCalendarEvent />}
                    title="Event Operations"
                    text="Create, manage and monitor events easily."
                  />
                </div>

                <div className="col-md-6">
                  <BentoInfoCard
                    icon={<BsPeople />}
                    title="Role Dashboards"
                    text="Organizer, Staff, Coordinator, Volunteer and more."
                  />
                </div>

                <div className="col-md-12">
                  <BentoInfoCard
                    icon={<BsShieldCheck />}
                    title="Secure Access"
                    text="Users are redirected automatically based on their assigned role."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="login-form-column col-lg-5">
            <div
              className="login-form-card bg-white shadow-sm h-100 p-4"
              style={{ borderRadius: "28px" }}
            >
              <div className="mb-4">
                <h2 className="fw-bold mb-2" style={{ fontSize: "30px" }}>
                  Login
                </h2>
                <p className="text-muted mb-0">
                  Access your dashboard using your registered email and password.
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <label className="form-label fw-semibold">Email Address</label>
                <input
                  className="form-control mb-3"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ height: "48px", borderRadius: "12px" }}
                  required
                />

                <label className="form-label fw-semibold">Password</label>

<div className="position-relative mb-3">
  <input
    type={showPassword ? "text" : "password"}
    className="form-control pe-5"
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      height: "50px",
      borderRadius: "12px",
      fontSize: "15px",
    }}
    required
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="btn border-0 bg-transparent position-absolute"
    style={{
      top: "50%",
      right: "12px",
      transform: "translateY(-50%)",
      padding: 0,
      color: "#6b7280",
    }}
  >
    {showPassword ? (
      <EyeOff size={20} strokeWidth={2} />
    ) : (
      <Eye size={20} strokeWidth={2} />
    )}
  </button>
</div>

                {message && (
                  <div className="alert alert-danger py-2">{message}</div>
                )}

                <button
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  Login <BsArrowRight />
                </button>
              </form>

              <hr className="my-4" />

              <div
                className="p-3"
                style={{
                  background: "#f8fafc",
                  borderRadius: "18px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h6 className="fw-bold mb-2">New to FIC BackRooms?</h6>
                <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
                  Create a portal for your organization and start managing events.
                </p>

                <Link
                  to="/create-portal"
                  className="btn btn-outline-primary w-100"
                  style={{ borderRadius: "12px" }}
                >
                  Create Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function loadAccessOptions(userId, primaryRole, portalName) {
  const normalizedUserId = Number(userId);
  const options = [];

  const primaryAccess = {
    role: primaryRole,
    title: portalName || "Portal Dashboard",
    subtitle: "Primary account access",
    portalId: localStorage.getItem("portalId") || "",
    portalName: portalName || localStorage.getItem("portalName") || "",
    path: dashboardRoutes[primaryRole],
  };

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return primaryAccess.path ? [primaryAccess] : [];
  }

  try {
    const response = await api.get(`/event-assignments/user/${normalizedUserId}`);
    const assignments = Array.isArray(response.data) ? response.data : [];

    assignments.forEach((assignment) => {
      if (assignment.active === false) return;

      const role = normalizeRole(assignment.roleName);
      const eventName = assignment.eventName || "Assigned Event";
      const portal = assignment.portalName || portalName || "Portal";

      options.push({
        role,
        path: dashboardRoutes[role],
        title: `${formatRole(role)} Dashboard`,
        eventId: assignment.eventId,
        eventName,
        portalId: assignment.portalId,
        portalName: portal,
        subtitle: `${portal} - ${eventName}`,
        assignmentId: assignment.id,
      });
    });
  } catch (error) {
    console.log(error);
  }

  if (primaryAccess.path) {
    options.unshift(primaryAccess);
  }

  if (options.length === 0 && primaryAccess.path) {
    options.push(primaryAccess);
  }

  return dedupeAccessOptions(options);
}

function dedupeAccessOptions(options) {
  const seen = new Set();

  return options.filter((option) => {
    const key = `${option.role}-${option.eventId || "portal"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeRole(role) {
  const value = String(role || "").trim();
  return value === "Staff" ? "STAFF" : value.toUpperCase();
}

function formatRole(role) {
  return String(role || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BentoInfoCard({ icon, title, text }) {
  return (
    <div
      className="h-100 p-4"
      style={{
        borderRadius: "22px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "14px" }}>{icon}</div>
      <h5 className="fw-bold">{title}</h5>
      <p className="mb-0" style={{ color: "#dbeafe", fontSize: "15px" }}>
        {text}
      </p>
    </div>
  );
}

export default Login;
