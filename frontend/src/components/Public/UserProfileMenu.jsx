import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BsEnvelope,
  BsPersonCheck,
  BsPersonCircle,
  BsPhone,
} from "react-icons/bs";

function UserProfileMenu({ dark = false, mode = "public" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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

    if (mode === "landing") {
      const email = localStorage.getItem("email") || "";
      const phone =
        localStorage.getItem("phoneNumber") ||
        localStorage.getItem("phone") ||
        "";

      if (!localStorage.getItem("token") && !email) {
        return null;
      }

      return {
        name: storedName || email,
        subtitle: "User Profile",
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
      };
    }

    return null;
  }, [mode]);

  if (!profile) return null;

  const signOut = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.clear();
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
              <small className="text-muted">{profile.subtitle}</small>
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
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center gap-2"
                onClick={signOut}
              >
                <BsPersonCheck /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
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
