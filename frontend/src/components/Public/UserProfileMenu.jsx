import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAssistantSession } from "../../utils/assistantSession";
import {
  BsEnvelope,
  BsPersonCheck,
  BsPersonCircle,
  BsPhone,
  BsSpeedometer2,
  BsHeadset,
} from "react-icons/bs";
import PublicMovieSupportModal from "./PublicMovieSupportModal";

function UserProfileMenu({ dark = false, mode = "public" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("touchstart", closeOutside);
    };
  }, [open]);

  const profile = useMemo(() => {
    let publicUser = null;

    try {
      publicUser = JSON.parse(sessionStorage.getItem("publicUser") || "null");
    } catch {
      publicUser = null;
    }

    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    const storedName = `${firstName} ${lastName}`.trim();

    if (mode === "landing" || localStorage.getItem("token")) {
      const email = localStorage.getItem("email") || "";
      const phone =
        localStorage.getItem("phoneNumber") ||
        localStorage.getItem("phone") ||
        "";

      if (!localStorage.getItem("token") && !email) {
        return null;
      }

      const role = (localStorage.getItem("role") || "").toUpperCase();
      const dutyRole = (localStorage.getItem("dutyRole") || "").toLowerCase();
      const portalCode = localStorage.getItem("portalCode") || "";
      const redirectPath = localStorage.getItem("redirectPath") || "";

      const isTheater =
        role.startsWith("THEATER_") ||
        role.includes("CASHIER") ||
        role.includes("USHER") ||
        role === "BRANCH_MANAGER" ||
        dutyRole.includes("cashier") ||
        dutyRole.includes("usher") ||
        dutyRole.includes("manager") ||
        portalCode.startsWith("TH-") ||
        (redirectPath && redirectPath.startsWith("/theater"));

      let targetDashboardPath = "/admin";
      let roleLabel = "User Profile";

      if (isTheater) {
        if (redirectPath === "/theater-fb" || role.includes("CONCESSION") || dutyRole.includes("concession") || dutyRole.includes("f&b") || dutyRole.includes("food") || dutyRole.includes("beverage")) {
          targetDashboardPath = "/theater-fb";
          roleLabel = "F&B Staff";
        } else if (role.includes("CASHIER") || dutyRole.includes("cashier") || role === "THEATER_STAFF" || dutyRole.includes("staff")) {
          targetDashboardPath = "/theater/cashier-dashboard";
          roleLabel = "Cashier Portal";
        } else if (role.includes("USHER") || dutyRole.includes("usher") || dutyRole.includes("gate")) {
          targetDashboardPath = "/theater/usher-dashboard";
          roleLabel = "Usher Portal";
        } else if (role === "THEATER_MANAGER" || role === "BRANCH_MANAGER" || dutyRole.includes("manager")) {
          targetDashboardPath = "/theater/manager-dashboard";
          roleLabel = "Theater Manager";
        } else {
          targetDashboardPath = "/theater/dashboard";
          roleLabel = "Theater Owner";
        }
      } else {
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
        targetDashboardPath = dashboardRoutes[role] || "/admin";
        roleLabel = role ? role.replace(/_/g, " ") : "User Profile";
      }

      return {
        name: storedName || email,
        subtitle: roleLabel,
        dashboardPath: redirectPath && redirectPath.startsWith("/") ? redirectPath : targetDashboardPath,
        lines: [
          {
            icon: <BsEnvelope />,
            label: "Email",
            value: email || "Not added",
          },
          {
            icon: <BsPhone />,
            label: "Phone",
            value: phone || "Not added",
          },
        ],
        showSignOut: Boolean(localStorage.getItem("token")),
      };
    }

    if (publicUser) {
      return {
        name: publicUser.name || publicUser.email || "Public Visitor",
        subtitle: "Public Profile",
        lines: [
          {
            icon: <BsEnvelope />,
            label: "Email",
            value: publicUser.email || "Not added",
          },
          {
            icon: <BsPhone />,
            label: "Phone",
            value: publicUser.phone || "Not added",
          },
        ],
        showSignOut: false,
      };
    }

    return null;
  }, [mode]);

  if (!profile) return null;

  const signOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.clear();
    clearAssistantSession();
    setOpen(false);
    navigate("/");
  };

  return (
    <div ref={menuRef} className="user-profile-menu">
      <button
        type="button"
        className={`user-profile-trigger ${dark ? "user-profile-trigger-dark" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label="Open user profile"
      >
        <BsPersonCircle size={24} />
      </button>

      {open && (
        <div className="user-profile-card">
          <div className="d-flex align-items-center gap-3 mb-3">
            <BsPersonCircle size={46} className="text-primary" />
            <div>
              <h6 className="mb-0 fw-bold">{profile.name}</h6>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 rounded-pill small fw-semibold mt-1">
                {profile.subtitle}
              </span>
            </div>
          </div>

          {profile.lines.map((line) => (
            <ProfileLine
              key={line.label}
              icon={line.icon}
              label={line.label}
              value={line.value}
            />
          ))}

          {profile.showSignOut && (
            <div className="d-grid gap-2 mt-3">
              {profile.dashboardPath && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-2 fw-bold shadow-xs py-2"
                  onClick={() => {
                    setOpen(false);
                    navigate(profile.dashboardPath);
                  }}
                >
                  <BsSpeedometer2 /> Go to Dashboard
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center gap-2"
                onClick={signOut}
              >
                <BsPersonCheck /> Sign Out
              </button>
            </div>
          )}

          <div className="pt-2 border-top mt-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: "12px", fontWeight: 600 }}
              onClick={() => {
                setOpen(false);
                setShowSupportModal(true);
              }}
            >
              <BsHeadset /> Need Ticket Support?
            </button>
          </div>
        </div>
      )}

      <PublicMovieSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}

function ProfileLine({ icon, label, value }) {
  return (
    <div className="user-profile-line">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <p>{value}</p>
      </div>
    </div>
  );
}

export default UserProfileMenu;
