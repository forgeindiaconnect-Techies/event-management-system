import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { NotificationBell } from "./AdminNavbar";
import {
  BsBox,
  BsBuilding,
  BsCheck2Circle,
  BsEnvelope,
  BsPencilSquare,
  BsPerson,
  BsPersonCircle,
  BsPhone,
  BsQuestionCircle,
  BsShieldCheck,
  BsXLg,
  BsArrowLeftRight,
} from "react-icons/bs";

function OrganizerNavbar() {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [portalDetails, setPortalDetails] = useState({
    portalName: localStorage.getItem("portalName") || "Portal",
    portalCode: localStorage.getItem("portalCode") || "",
  });
  const [userProfile, setUserProfile] = useState(getStoredUserProfile);
  const [profileForm, setProfileForm] = useState(getStoredUserProfile);

  useEffect(() => {
    const portalId = localStorage.getItem("portalId");
    const userId = localStorage.getItem("userId");

    const loadPortalDetails = async () => {
      if (!portalId) return;

      try {
        const response = await api.get(`/portals/${portalId}`);
        const portal = response.data || {};

        setPortalDetails({
          portalName: portal.portalName || localStorage.getItem("portalName") || "Portal",
          portalCode: portal.portalCode || localStorage.getItem("portalCode") || "",
        });

        if (portal.portalName) {
          localStorage.setItem("portalName", portal.portalName);
        }

        if (portal.portalCode) {
          localStorage.setItem("portalCode", portal.portalCode);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const loadUserDetails = async () => {
      if (!userId) return;

      try {
        const response = await api.get(`/users/${userId}`);
        const nextProfile = normalizeUserProfile(response.data || {});
        saveProfileToStorage(nextProfile);
        setUserProfile(nextProfile);
        setProfileForm(nextProfile);
      } catch (error) {
        console.log(error);
      }
    };

    loadPortalDetails();
    loadUserDetails();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveProfile = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setProfileMessage("User ID not found. Please login again.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMessage("");

      const payload = {
        ...userProfile.raw,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
      };

      const response = await api.put(`/users/${userId}`, payload);
      const nextProfile = normalizeUserProfile(response.data || payload);

      saveProfileToStorage(nextProfile);
      setUserProfile(nextProfile);
      setProfileForm(nextProfile);
      setEditProfile(false);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.log(error);
      setProfileMessage("Unable to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEdit = () => {
    setProfileForm(userProfile);
    setEditProfile(false);
    setProfileMessage("");
  };

  const portalName = portalDetails.portalName || "Portal";
  const portalCode = portalDetails.portalCode || "N/A";
  const fullName = userProfile.fullName || userProfile.email || "Organizer";

  return (
    <>
      <nav
        className="organizer-navbar d-flex align-items-center justify-content-between px-4"
        style={{
          height: "50px",
          width: "100%",
          background: "#12085c",
          color: "#fff",
        }}
      >
        <button
          className="organizer-navbar-brand border-0 bg-transparent text-white d-flex align-items-center gap-2"
          style={{
            cursor: "pointer",
            transition: "0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onClick={() => navigate("/")}
        >
          <BsBox size={22} />

          <span className="fw-bold" style={{ fontSize: "18px" }}>
            BackRooms
          </span>

          <span style={{ opacity: 0.65, fontSize: "18px" }}>|</span>

          <span className="fw-semibold" style={{ fontSize: "16px" }}>
            {portalName}
          </span>
        </button>

        <div className="organizer-navbar-actions d-flex align-items-center gap-4">
          <NotificationBell />

          <button
            type="button"
            className="organizer-navbar-help border-0 bg-transparent text-white d-flex align-items-center"
            aria-label="Open Help and Support"
            title="Help and Support"
            style={{
              transition: "0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <BsQuestionCircle size={23} />
          </button>

          <button
            className="organizer-navbar-profile border-0 bg-transparent text-white d-flex align-items-center gap-2"
            onClick={() => setShowProfile(true)}
            style={{
              transition: "0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <div className="text-end">
              <div
                className="fw-semibold"
                style={{
                  fontSize: "15px",
                  lineHeight: "16px",
                }}
              >
                Organizer
              </div>

              <small
                style={{
                  color: "#dbeafe",
                  fontSize: "12px",
                }}
              >
                {portalName}
              </small>
            </div>

            <ProfileAvatar profile={userProfile} size={30} />
          </button>
        </div>
      </nav>

      {showProfile && (
        <div
          className="compact-profile-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.25)",
            zIndex: 999,
          }}
          onClick={() => setShowProfile(false)}
        >
          <div
            className="compact-profile-popup bg-white shadow-lg"
            style={{
              width: "380px",
              height: "100vh",
              position: "absolute",
              right: 0,
              top: 0,
              animation: "slideIn 0.2s ease",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>
              {`
                @keyframes slideIn {
                  from {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }

                .drawer-btn-hover {
                  transition: 0.2s ease;
                }

                .drawer-btn-hover:hover {
                  transform: translateY(-1px);
                  box-shadow: 0 8px 18px rgba(220, 38, 38, 0.22);
                }
              `}
            </style>

            <div
              className="text-white p-4"
              style={{
                background: "linear-gradient(135deg,#12085c,#4c1d95)",
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <p className="mb-1" style={{ color: "#ddd6fe", fontSize: "13px" }}>
                    Organizer
                  </p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "24px" }}>
                    Profile
                  </h2>
                </div>

                <button
                  className="btn border-0 text-white"
                  style={{ transition: "0.2s ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "rotate(90deg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "rotate(0deg)";
                  }}
                  onClick={() => setShowProfile(false)}
                >
                  <BsXLg />
                </button>
              </div>

              <div className="d-flex align-items-center gap-3">
                <ProfileAvatar profile={userProfile} size={58} />
                <div>
                  <h3 className="fw-bold mb-1" style={{ fontSize: "21px" }}>
                    {fullName}
                  </h3>
                  <p className="mb-0" style={{ color: "#e9d5ff", fontSize: "14px" }}>
                    {userProfile.email || "Email not added"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-light rounded-4 p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0">User Details</h6>
                  {!editProfile && (
                    <button
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                      onClick={() => setEditProfile(true)}
                    >
                      <BsPencilSquare /> Edit
                    </button>
                  )}
                </div>

                {editProfile ? (
                  <ProfileEditForm
                    form={profileForm}
                    saving={savingProfile}
                    onChange={handleProfileChange}
                    onSave={saveProfile}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <>
                    <ProfileInfo icon={<BsPerson />} label="Name" value={fullName} />
                    <ProfileInfo icon={<BsEnvelope />} label="Email ID" value={userProfile.email} />
                    <ProfileInfo icon={<BsPhone />} label="Phone Number" value={userProfile.phoneNumber} />
                  </>
                )}

                {profileMessage && (
                  <div className="alert alert-info py-2 mb-0 mt-3" style={{ fontSize: "13px" }}>
                    {profileMessage}
                  </div>
                )}
              </div>

              <div className="bg-light rounded-4 p-3 mb-4">
                <h6 className="fw-bold mb-3">Portal Details</h6>
                <ProfileInfo icon={<BsBuilding />} label="Portal Name" value={portalName} />
                <ProfileInfo icon={<BsShieldCheck />} label="Portal Code" value={portalCode} />
              </div>

              <button type="button" className="btn btn-outline-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2" onClick={() => { setShowProfile(false); navigate("/choose-access"); }}>
                <BsArrowLeftRight /> Switch Role / Event
              </button>

              <button
                className="btn btn-danger w-100 drawer-btn-hover"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileEditForm({ form, saving, onChange, onSave, onCancel }) {
  return (
    <div>
      <div className="mb-2">
        <label className="form-label mb-1" style={{ fontSize: "12px" }}>
          First Name
        </label>
        <input
          className="form-control form-control-sm"
          name="firstName"
          value={form.firstName}
          onChange={onChange}
        />
      </div>

      <div className="mb-2">
        <label className="form-label mb-1" style={{ fontSize: "12px" }}>
          Last Name
        </label>
        <input
          className="form-control form-control-sm"
          name="lastName"
          value={form.lastName}
          onChange={onChange}
        />
      </div>

      <div className="mb-2">
        <label className="form-label mb-1" style={{ fontSize: "12px" }}>
          Email ID
        </label>
        <input
          className="form-control form-control-sm"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: "12px" }}>
          Phone Number
        </label>
        <input
          className="form-control form-control-sm"
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={onChange}
        />
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
          onClick={onSave}
          disabled={saving}
        >
          <BsCheck2Circle /> {saving ? "Saving..." : "Save"}
        </button>
        <button className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProfileInfo({ icon, label, value }) {
  return (
    <div className="d-flex gap-3 py-2 border-bottom">
      <span className="text-primary mt-1">{icon}</span>
      <div>
        <div className="text-muted" style={{ fontSize: "12px" }}>
          {label}
        </div>
        <div className="fw-semibold" style={{ fontSize: "14px", overflowWrap: "anywhere" }}>
          {value || "Not added"}
        </div>
      </div>
    </div>
  );
}

function ProfileAvatar({ profile, size = 42 }) {
  const imageUrl =
    profile.profileImageUrl ||
    profile.profileImage ||
    profile.avatarUrl ||
    profile.photoUrl ||
    profile.picture;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={profile.fullName || profile.email || "Profile"}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.8)",
          flex: `0 0 ${size}px`,
        }}
      />
    );
  }

  return (
    <span
      className="d-inline-flex align-items-center justify-content-center fw-bold"
      title={profile.email || "Profile"}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "#eef2ff",
        color: "#4f46e5",
        border: "2px solid rgba(255,255,255,0.9)",
        fontSize: `${Math.max(12, Math.round(size * 0.38))}px`,
        flex: `0 0 ${size}px`,
      }}
    >
      {getProfileInitials(profile)}
    </span>
  );
}

function getStoredUserProfile() {
  return normalizeUserProfile({
    id: localStorage.getItem("userId"),
    firstName: localStorage.getItem("firstName"),
    lastName: localStorage.getItem("lastName"),
    email: localStorage.getItem("email"),
    phoneNumber: localStorage.getItem("phoneNumber") || localStorage.getItem("phone"),
  });
}

function normalizeUserProfile(user) {
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const email = user.email || localStorage.getItem("email") || "";
  const phoneNumber = user.phoneNumber || user.phone || "";
  const fullName = `${firstName} ${lastName}`.trim() || user.name || email;

  return {
    ...user,
    raw: user,
    firstName,
    lastName,
    email,
    phoneNumber,
    fullName,
    profileImageUrl: user.profileImageUrl || user.profileImage || user.avatarUrl || user.photoUrl || user.picture || "",
  };
}

function saveProfileToStorage(profile) {
  localStorage.setItem("firstName", profile.firstName || "");
  localStorage.setItem("lastName", profile.lastName || "");
  localStorage.setItem("email", profile.email || "");
  localStorage.setItem("phoneNumber", profile.phoneNumber || "");
}

function getProfileInitials(profile) {
  const nameParts = String(profile.fullName || "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return String(profile.email || "U").slice(0, 2).toUpperCase();
}

export default OrganizerNavbar;
