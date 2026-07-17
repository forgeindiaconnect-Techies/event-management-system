import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import {
  BsArrowRight,
  BsBox,
  BsCalendarEvent,
  BsPersonBadge,
} from "react-icons/bs";

const dashboardRoutes = {
  PORTAL_ADMIN: "/admin",
  ORGANIZER: "/organizer",
  STAFF: "/staff",
  VOLUNTEER: "/volunteer",
  COORDINATOR: "/coordinator",
  SPEAKER: "/speaker",
  JUDGE: "/judge",
  MENTOR: "/mentor",
  CHIEF_GUEST: "/chief-guest",
  PARTICIPANT: "/participant",
};

function ChooseAccess() {
  const navigate = useNavigate();
  const [accesses, setAccesses] = useState(readAccessOptions);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const userName = [localStorage.getItem("firstName"), localStorage.getItem("lastName")]
    .filter(Boolean)
    .join(" ");
  const email = localStorage.getItem("email") || "";
  const portalName = localStorage.getItem("portalName") || "Portal";

  useEffect(() => {
    refreshAccessOptions();
  }, []);

  const refreshAccessOptions = async () => {
    const userId = Number(localStorage.getItem("userId"));
    const primaryRole = normalizeRole(localStorage.getItem("role"));
    const currentPortalName = localStorage.getItem("portalName") || "Portal";
    const currentPortalId = localStorage.getItem("portalId") || "";

    if (!Number.isFinite(userId) || userId <= 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/event-assignments/user/${userId}`);
      const assignmentOptions = (Array.isArray(response.data) ? response.data : []).map(
        mapAssignmentToAccess
      );

      const nextAccesses = dedupeAccessOptions([
        createPrimaryAccess(primaryRole, currentPortalName, currentPortalId),
        ...assignmentOptions,
      ].filter(Boolean));

      localStorage.setItem("accessOptions", JSON.stringify(nextAccesses));
      setAccesses(nextAccesses);
    } catch (error) {
      console.log(error);
      setAccesses(readAccessOptions());
    } finally {
      setLoading(false);
    }
  };

  const openAccess = async (access) => {
    const selectedRole = normalizeRole(access.role || access.roleName);
    const selectedPath = dashboardRoutes[selectedRole] || access.path || "/login";

    setAccessError("");

    if (access.eventId || access.assignmentId) {
      try {
        const userId = Number(localStorage.getItem("userId"));
        const response = await api.get(`/event-assignments/user/${userId}`);
        const validAssignment = (Array.isArray(response.data) ? response.data : []).find(
          (assignment) =>
            assignment.active !== false &&
            Number(assignment.id) === Number(access.assignmentId) &&
            Number(assignment.eventId) === Number(access.eventId) &&
            normalizeRole(assignment.roleName) === selectedRole &&
            (!access.portalId || Number(assignment.portalId) === Number(access.portalId))
        );

        if (!validAssignment) {
          setAccessError("This role or event assignment is no longer valid. The access list has been refreshed.");
          await refreshAccessOptions();
          return;
        }
      } catch (error) {
        console.log(error);
        setAccessError("Unable to validate this access. Please refresh and try again.");
        return;
      }
    } else {
      const primaryRole = normalizeRole(localStorage.getItem("role"));
      if (selectedRole !== primaryRole) {
        setAccessError("This primary dashboard access is not valid for your account.");
        await refreshAccessOptions();
        return;
      }
    }

    localStorage.setItem("activeRole", selectedRole);
    localStorage.setItem("activeEventId", access.eventId || "");
    localStorage.setItem("activeEventName", access.eventName || "");
    localStorage.setItem("activeAssignmentId", access.assignmentId || "");
    localStorage.setItem("activePortalId", access.portalId || "");
    localStorage.setItem("activePortalName", access.portalName || "");
    navigate(selectedPath);
  };

  if (loading) {
    return (
      <AccessShell>
        <div className="bg-white shadow-sm p-4 choose-access-panel">
          <h2 className="fw-bold mb-2">Loading access...</h2>
          <p className="text-muted mb-0">Checking your assigned dashboards.</p>
        </div>
      </AccessShell>
    );
  }

  if (accesses.length === 0) {
    return (
      <AccessShell>
        <div className="bg-white shadow-sm p-4 choose-access-panel">
          <h2 className="fw-bold mb-2">No access found</h2>
          <p className="text-muted mb-4">
            Your account is active, but no event role is assigned yet.
          </p>
          <Link to="/login" className="btn btn-primary">
            Back to Login
          </Link>
        </div>
      </AccessShell>
    );
  }

  return (
    <AccessShell>
      <div className="bg-white shadow-sm p-4 choose-access-panel">
        <div className="choose-access-header d-flex flex-wrap justify-content-between gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Choose Access</h2>
            <p className="text-muted mb-0">
              Select the event role you want to open.
            </p>
          </div>
          <div className="choose-access-account text-end">
            <div className="fw-semibold">{userName || email}</div>
            <div className="text-muted small">{portalName}</div>
          </div>
        </div>

        {accessError && <div className="alert alert-danger py-2">{accessError}</div>}

        <div className="row g-3">
          {accesses.map((access) => (
            <div className="col-md-6" key={`${access.role}-${access.eventId || "portal"}`}>
              <button
                type="button"
                className="choose-access-card"
                onClick={() => openAccess(access)}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className="choose-access-icon">
                    {access.eventId ? <BsCalendarEvent /> : <BsPersonBadge />}
                  </div>
                  <div className="choose-access-card-content text-start flex-grow-1">
                    <div className="text-muted small mb-1">{formatRole(access.role || access.roleName)}</div>
                    <h5 className="fw-bold mb-1">
                      {access.eventName || access.title || portalName}
                    </h5>
                    <p className="text-muted small mb-0">
                      {access.subtitle || access.portalName || "Open dashboard"}
                    </p>
                  </div>
                  <BsArrowRight className="choose-access-arrow" />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AccessShell>
  );
}

function AccessShell({ children }) {
  return (
    <div className="choose-access-page">
      <nav className="choose-access-nav">
        <Link to="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
          <BsBox size={30} />
          <span className="choose-access-brand fw-bold" style={{ fontSize: "24px" }}>BackRooms</span>
        </Link>
      </nav>
      <main className="choose-access-main container py-5">{children}</main>
      <style>{chooseAccessStyles}</style>
    </div>
  );
}

function readAccessOptions() {
  try {
    const options = JSON.parse(localStorage.getItem("accessOptions") || "[]");
    return Array.isArray(options)
      ? options.map((option) => ({
          ...option,
          role: normalizeRole(option.role || option.roleName),
          path: dashboardRoutes[normalizeRole(option.role || option.roleName)] || option.path,
        }))
      : [];
  } catch {
    return [];
  }
}

function createPrimaryAccess(primaryRole, portalName, portalId) {
  const role = normalizeRole(primaryRole);
  const path = dashboardRoutes[role];

  if (!path) return null;

  return {
    role,
    path,
    title: `${formatRole(role)} Dashboard`,
    subtitle: "Primary account access",
    portalId,
    portalName,
  };
}

function mapAssignmentToAccess(assignment) {
  const role = normalizeRole(assignment.roleName || assignment.role);
  const eventName = assignment.eventName || "Assigned Event";
  const portalName = assignment.portalName || localStorage.getItem("portalName") || "Portal";

  return {
    role,
    path: dashboardRoutes[role],
    title: `${formatRole(role)} Dashboard`,
    eventId: assignment.eventId,
    eventName,
    portalId: assignment.portalId,
    portalName,
    subtitle: `${portalName} - ${eventName}`,
    assignmentId: assignment.id,
  };
}

function dedupeAccessOptions(options) {
  const seen = new Set();

  return options.filter((option) => {
    const role = normalizeRole(option.role || option.roleName);
    const key = `${role}-${option.eventId || "portal"}-${option.portalId || ""}`;

    if (seen.has(key)) return false;
    seen.add(key);

    option.role = role;
    option.path = dashboardRoutes[role] || option.path;
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

const chooseAccessStyles = `
  .choose-access-page {
    background: #f6f7fb;
    min-height: 100vh;
  }

  .choose-access-nav {
    align-items: center;
    background: #12085c;
    color: #fff;
    display: flex;
    height: 66px;
    padding: 0 48px;
  }

  .choose-access-panel {
    border-radius: 24px;
  }

  .choose-access-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 18px;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
    width: 100%;
  }

  .choose-access-card:hover {
    border-color: #4f46e5;
    box-shadow: 0 12px 28px rgba(79, 70, 229, 0.12);
    transform: translateY(-2px);
  }

  .choose-access-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 12px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .choose-access-arrow {
    color: #4f46e5;
    margin-top: 10px;
  }

  .choose-access-card-content {
    min-width: 0;
  }

  @media (max-width: 767.98px) {
    .choose-access-nav {
      height: 58px;
      padding: 0 14px;
    }

    .choose-access-nav svg {
      height: 25px;
      width: 25px;
    }

    .choose-access-brand {
      font-size: 19px !important;
    }

    .choose-access-main {
      padding: 16px 12px 28px !important;
    }

    .choose-access-panel {
      border-radius: 18px;
      padding: 18px 14px !important;
    }

    .choose-access-header {
      display: block !important;
      margin-bottom: 18px !important;
    }

    .choose-access-header h2 {
      font-size: 27px;
    }

    .choose-access-account {
      background: #f6f7fb;
      border-radius: 12px;
      margin-top: 14px;
      overflow-wrap: anywhere;
      padding: 10px 12px;
      text-align: left !important;
    }

    .choose-access-card {
      border-radius: 14px;
      min-height: 106px;
      padding: 14px 12px;
    }

    .choose-access-card > .d-flex {
      gap: 11px !important;
    }

    .choose-access-icon {
      flex: 0 0 40px;
      height: 40px;
      width: 40px;
    }

    .choose-access-card h5 {
      font-size: 17px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .choose-access-card p {
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    .choose-access-arrow {
      flex: 0 0 auto;
    }
  }
`;

export default ChooseAccess;
