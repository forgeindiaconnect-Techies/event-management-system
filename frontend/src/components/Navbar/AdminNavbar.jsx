import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import {
  BsBox,
  BsBuilding,
  BsCheck2Circle,
  BsEnvelope,
  BsPencilSquare,
  BsPerson,
  BsPersonCircle,
  BsPhone,
  BsShieldCheck,
  BsXLg,
  BsLightningCharge,
  BsBell,
  BsCheck2All,
  BsTrash,
  BsArrowLeftRight,
  BsQuestionCircle,
} from "react-icons/bs";

function AdminNavbar() {
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
  const [subscription, setSubscription] = useState(null);

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

    const loadSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/current");
        setSubscription(response.data || null);
      } catch (error) {
        console.log("Unable to load subscription status", error);
        setSubscription(null);
      }
    };

    loadPortalDetails();
    loadUserDetails();
    loadSubscription();
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

  const fullName = userProfile.fullName || userProfile.email || "Portal Admin";
  const portalName = portalDetails.portalName || "Portal";
  const portalCode = portalDetails.portalCode || "N/A";
  const planAction = getPlanAction(subscription);

  return (
    <>
      <nav
        className="admin-navbar d-flex align-items-center justify-content-between px-4"
        style={{
          height: "50px",
          width: "100%",
          background: "#12085c",
          color: "#fff",
        }}
      >
        <div
          className="admin-navbar-brand d-flex align-items-center gap-2 fw-bold"
          style={{
            fontSize: "18px",
            cursor: "pointer",
            color: "#fff",
          }}
          onClick={() => navigate("/")}
        >
          <BsBox size={22} />
          <span>FIC BackRooms</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            {portalName || portalCode || "Portal"}
          </span>
        </div>

        <div className="admin-navbar-actions d-flex align-items-center gap-4">
          <button
            className={"admin-navbar-plan-button " + planAction.tone}
            onClick={() => navigate("/subscription")}
            title={planAction.title}
          >
            <BsLightningCharge />
            <span>{planAction.label}</span>
          </button>

          <button
            className="btn btn-light fw-semibold"
            style={{
              borderRadius: "12px",
              fontSize: "12px",
              padding: "6px 12px",
            }}
            onClick={() => navigate("/create-event")}
          >
            Create Event
          </button>

          <NotificationBell />

          <button
            type="button"
            className="admin-navbar-help border-0 bg-transparent text-white d-flex align-items-center p-0"
            aria-label="Open Help and Support"
            title="Help and Support"
          >
            <BsQuestionCircle size={23} />
          </button>

          <button
            className="btn border-0 text-white d-flex align-items-center p-0"
            onClick={() => setShowProfile(true)}
          >
            <ProfileAvatar profile={userProfile} size={32} />
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
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-white p-4"
              style={{
                background: "linear-gradient(135deg,#12085c,#4c1d95)",
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <p className="mb-1" style={{ color: "#ddd6fe", fontSize: "13px" }}>
                    Portal Admin
                  </p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "24px" }}>
                    Profile
                  </h2>
                </div>

                <button className="btn border-0 text-white" onClick={() => setShowProfile(false)}>
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

              <button className="btn btn-danger w-100" onClick={logout}>
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
  const email = user.email || "";
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
  };
}

function saveProfileToStorage(profile) {
  localStorage.setItem("firstName", profile.firstName || "");
  localStorage.setItem("lastName", profile.lastName || "");
  localStorage.setItem("email", profile.email || "");
  localStorage.setItem("phoneNumber", profile.phoneNumber || "");
}

function getPlanAction(subscription) {
  if (!subscription || ["EXPIRED", "CANCELLED"].includes(subscription.status)) {
    return {
      label: "Purchase Plan",
      tone: "purchase",
      title: "Purchase a subscription plan",
    };
  }

  if (subscription.nextPlanCode || subscription.planCode === "ENTERPRISE") {
    return {
      label: "Manage Plan",
      tone: "manage",
      title: "Manage your current subscription",
    };
  }

  return {
    label: "Upgrade Plan",
    tone: "upgrade",
    title: "Compare plans and upgrade your subscription",
  };
}

function ProfileAvatar({ profile, size = 42 }) {
  const imageUrl = profile.profileImageUrl || profile.profileImage || profile.avatarUrl || profile.photoUrl || profile.picture;

  if (imageUrl) {
    return <img src={imageUrl} alt={profile.fullName || profile.email || "Profile"} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.9)" }} />;
  }

  const parts = String(profile.fullName || "").trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : String(parts[0] || profile.email || "PA").slice(0, 2).toUpperCase();

  return <span className="d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: size, height: size, borderRadius: "50%", background: "#eef2ff", color: "#4f46e5", border: "2px solid rgba(255,255,255,.9)", fontSize: Math.max(12, Math.round(size * .38)) }}>{initials}</span>;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(Number(response.data?.unreadCount || 0));
    } catch {
      // The navbar should remain usable if notification polling is unavailable.
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/notifications", {
        params: { page: 0, size: 20 },
      });
      setNotifications(response.data?.content || []);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const timer = window.setInterval(loadUnreadCount, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
    };
  }, [open]);

  const toggleNotifications = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) loadNotifications();
  };

  const markAsRead = async (notification) => {
    if (!notification.read) {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      ));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  };

  const openNotification = async (notification) => {
    try {
      await markAsRead(notification);
    } catch {
      setError("Unable to mark the notification as read.");
    }
    setOpen(false);
    if (notification.actionUrl?.startsWith("/")) {
      navigate(notification.actionUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      setError("Unable to mark all notifications as read.");
    }
  };

  const deleteNotification = async (event, notification) => {
    event.stopPropagation();
    try {
      await api.delete(`/notifications/${notification.id}`);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      if (!notification.read) setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      setError("Unable to delete the notification.");
    }
  };

  return (
    <div ref={notificationRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="border-0 bg-transparent text-white d-flex align-items-center justify-content-center"
        style={{ width: 34, height: 34, position: "relative" }}
        onClick={toggleNotifications}
        title="Notifications"
        aria-label={`${unreadCount} unread notifications`}
      >
        <BsBell size={21} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -3, minWidth: 18, height: 18,
            padding: "0 4px", borderRadius: 10, background: "#ef4444", color: "white",
            border: "2px solid #12085c", fontSize: 10, fontWeight: 800, lineHeight: "14px",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="admin-notification-popup bg-white shadow-lg" style={{
          position: "absolute", right: 0, top: 42, width: 390, maxWidth: "calc(100vw - 24px)",
          border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", zIndex: 1050,
          color: "#111827",
        }}>
          <div className="admin-notification-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
            <div>
              <strong style={{ fontSize: 16 }}>Notifications</strong>
              <div className="text-muted" style={{ fontSize: 11 }}>{unreadCount} unread</div>
            </div>
            <button type="button" className="btn btn-sm btn-light d-flex align-items-center gap-1"
              onClick={markAllAsRead} disabled={!unreadCount}>
              <BsCheck2All /> Read all
            </button>
          </div>

          <div className="admin-notification-list" style={{ maxHeight: 430, overflowY: "auto" }}>
            {loading && <div className="text-center text-muted p-4">Loading notifications...</div>}
            {!loading && error && <div className="alert alert-danger m-3 py-2 small">{error}</div>}
            {!loading && !notifications.length && !error && (
              <div className="text-center text-muted p-5"><BsBell size={26} className="mb-2" /><div>No notifications yet</div></div>
            )}
            {!loading && notifications.map((notification) => (
              <button key={notification.id} type="button"
                className="admin-notification-item w-100 border-0 border-bottom text-start p-3"
                onClick={() => openNotification(notification)}
                style={{ background: notification.read ? "#fff" : "#f1f5ff", position: "relative" }}>
                <div className="d-flex gap-2 justify-content-between">
                  <div style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2">
                      {!notification.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f46e5", flex: "0 0 7px" }} />}
                      <strong style={{ fontSize: 13 }}>{notification.title}</strong>
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 12, lineHeight: 1.45 }}>{notification.message}</div>
                    <small className="text-muted">{formatNotificationDate(notification.createdAt)}</small>
                  </div>
                  <span role="button" tabIndex={0} title="Delete notification"
                    onClick={(event) => deleteNotification(event, notification)}
                    style={{ color: "#dc3545", padding: 4, alignSelf: "flex-start" }}>
                    <BsTrash />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default AdminNavbar;
