import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import TheaterSupportModal from "../theater/TheaterSupportModal";
import { clearAssistantSession } from "../../utils/assistantSession";
import {
  BsBox,
  BsEnvelope,
  BsPerson,
  BsPhone,
  BsShieldCheck,
  BsXLg,
  BsFilm,
  BsBell,
  BsCheck2All,
  BsTrash,
  BsHeadset,
  BsList,
  BsGear,
} from "react-icons/bs";

function formatNotifTime(dateStr) {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function TheaterNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const getPortalId = () => localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";

  const getLocalAdminNotifications = () => {
    try {
      const pId = getPortalId();
      const raw = localStorage.getItem(`theater_notifications_${pId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      return [];
    }
    return [];
  };

  const loadUnreadCount = async () => {
    let count = 0;
    try {
      const pId = getPortalId();
      const res = await api.get("/theaters/notifications/unread-count", { params: { portalId: pId } });
      count = Number(res.data?.unreadCount || 0);
    } catch {
      // Keep silent on background polling
    }
    const localNotifs = getLocalAdminNotifications();
    const localUnread = localNotifs.filter((n) => !n.read).length;
    setUnreadCount(count + localUnread);
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const pId = getPortalId();
      let serverData = [];
      try {
        const res = await api.get("/theaters/notifications", { params: { portalId: pId, page: 0, size: 30 } });
        serverData = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        // Fallback gracefully
      }
      const localNotifs = getLocalAdminNotifications();
      const combined = [...localNotifs, ...serverData];
      setNotifications(combined);
      const unread = combined.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (e) {
      console.warn("Failed to load theater notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 12000);

    const onPosBooking = () => {
      loadUnreadCount();
      if (open) loadNotifications();
    };
    const onNotif = () => {
      loadUnreadCount();
      if (open) loadNotifications();
    };

    window.addEventListener("pos_booking_updated", onPosBooking);
    window.addEventListener("theater_notification_received", onNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pos_booking_updated", onPosBooking);
      window.removeEventListener("theater_notification_received", onNotif);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenBell = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      loadNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      const pId = getPortalId();
      try {
        await api.patch("/theaters/notifications/read-all", null, { params: { portalId: pId } });
      } catch (ignored) {}

      const notifKey = `theater_notifications_${pId}`;
      const current = JSON.parse(localStorage.getItem(notifKey) || "[]");
      const updated = current.map((n) => ({ ...n, read: true }));
      localStorage.setItem(notifKey, JSON.stringify(updated));

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn("Failed to mark all notifications read:", e);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        if (notif.id && String(notif.id).startsWith("NOTIF-")) {
          const pId = getPortalId();
          const notifKey = `theater_notifications_${pId}`;
          const current = JSON.parse(localStorage.getItem(notifKey) || "[]");
          const updated = current.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
          localStorage.setItem(notifKey, JSON.stringify(updated));
        } else {
          await api.patch(`/theaters/notifications/${notif.id}/read`);
        }
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.warn("Failed to mark notification read:", e);
      }
    }
    setOpen(false);
    if (notif.actionUrl && notif.actionUrl.startsWith("/")) {
      navigate(notif.actionUrl);
    }
  };

  const removeOne = async (e, id) => {
    e.stopPropagation();
    try {
      if (id && String(id).startsWith("NOTIF-")) {
        const pId = getPortalId();
        const notifKey = `theater_notifications_${pId}`;
        const current = JSON.parse(localStorage.getItem(notifKey) || "[]");
        const updated = current.filter((n) => n.id !== id);
        localStorage.setItem(notifKey, JSON.stringify(updated));
      } else {
        await api.delete(`/theaters/notifications/${id}`);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      loadUnreadCount();
    } catch (e) {
      console.warn("Failed to delete notification:", e);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="border-0 bg-transparent text-white d-flex align-items-center justify-content-center"
        style={{ width: 34, height: 34, position: "relative" }}
        onClick={handleOpenBell}
        title="Theater Live Notifications"
      >
        <BsBell size={18} />
        {unreadCount > 0 && (
          <span
            className="badge rounded-pill bg-danger"
            style={{
              position: "absolute",
              top: -2,
              right: -4,
              fontSize: "10px",
              padding: "2px 5px",
              boxShadow: "0 0 8px rgba(225, 29, 72, 0.6)"
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="bg-white shadow-lg rounded-3 border"
          style={{
            position: "absolute",
            top: "42px",
            right: 0,
            width: "380px",
            zIndex: 1100,
            color: "#333",
            overflow: "hidden"
          }}
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-light">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Cinema In-App Alerts</span>
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: "10px" }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold text-primary"
                style={{ fontSize: "12px" }}
                onClick={markAllRead}
              >
                <BsCheck2All /> Mark All Read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {loading ? (
              <div className="text-muted text-center py-4 small">Fetching notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-muted text-center py-4 small">
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>🔔</div>
                No new theater notifications yet.<br />
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>New bookings & alerts will show here in real-time.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="p-3 border-bottom d-flex justify-content-between align-items-start gap-2"
                  style={{
                    cursor: "pointer",
                    backgroundColor: n.read ? "#ffffff" : "#f0fdf4",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = n.read ? "#f8fafc" : "#dcfce7"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.read ? "#ffffff" : "#f0fdf4"; }}
                >
                  <div className="d-flex gap-2 align-items-start" style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        backgroundColor: n.type === "TICKET_BOOKED" ? "#dcfce7" : "#e0e7ff",
                        color: n.type === "TICKET_BOOKED" ? "#16a34a" : "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "14px",
                        flexShrink: 0
                      }}
                    >
                      {n.type === "TICKET_BOOKED" ? "🎟️" : "📢"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a", flexShrink: 0 }} />
                        )}
                      </div>
                      <p className="mb-1 text-secondary" style={{ fontSize: "12px", lineHeight: "1.35", wordBreak: "break-word" }}>
                        {n.message}
                      </p>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        {formatNotifTime(n.createdAt)}
                      </small>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm border-0 text-muted p-1"
                    onClick={(e) => removeOne(e, n.id)}
                    title="Delete"
                    style={{ fontSize: "12px" }}
                  >
                    <BsTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TheaterNavbar({ theaterName, onToggleSidebar, onOpenSettings }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profileData, setProfileData] = useState({
    portalId: localStorage.getItem("portalId") || "",
    portalCode: localStorage.getItem("portalCode") || "PORTAL",
    portalName: theaterName || localStorage.getItem("portalName") || "Cinema Partner",
    theaterType: "MULTIPLEX",
    fullName: localStorage.getItem("fullName") || "Theater Partner",
    mobileNumber: localStorage.getItem("phoneNumber") || localStorage.getItem("mobileNumber") || "",
    email: localStorage.getItem("email") || localStorage.getItem("userEmail") || "",
  });

  const [userInfo, setUserInfo] = useState({
    fullName: localStorage.getItem("userName") || localStorage.getItem("fullName") || "",
    email: localStorage.getItem("userEmail") || localStorage.getItem("email") || "",
    phoneNumber: localStorage.getItem("phoneNumber") || "",
    role: localStorage.getItem("userRole") || localStorage.getItem("role") || "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
    if (!email) return;
    try {
      const res = await api.get(`/theater/user-profile?email=${encodeURIComponent(email)}`);
      if (res.data) {
        setUserInfo({
          fullName: res.data.fullName || email,
          email: res.data.email || email,
          phoneNumber: res.data.phoneNumber || "",
          role: res.data.role || "",
        });
        if (res.data.fullName) localStorage.setItem("userName", res.data.fullName);
        if (res.data.phoneNumber) localStorage.setItem("phoneNumber", res.data.phoneNumber);
        if (res.data.role) localStorage.setItem("userRole", res.data.role);
      }
    } catch (e) {
      console.warn("User profile fetch warning:", e);
    }
  };

  useEffect(() => {
    if (showProfile) {
      fetchProfile();
      fetchUserProfile();
    }
  }, [showProfile]);

  const fetchProfile = async () => {
    try {
      const portalId = localStorage.getItem("portalId") || "";
      const res = await api.get(`/theater/portal-profile/${portalId}`);
      if (res.data) {
        setProfileData({
          portalId: res.data.portalId || portalId,
          portalCode: res.data.portalCode || localStorage.getItem("portalCode") || "PORTAL",
          portalName: res.data.portalName || theaterName || localStorage.getItem("portalName") || "Cinema Partner",
          theaterType: res.data.theaterType || "MULTIPLEX",
          fullName: res.data.fullName || localStorage.getItem("fullName") || "Theater Partner",
          mobileNumber: res.data.mobileNumber || localStorage.getItem("phoneNumber") || "",
          email: res.data.email || localStorage.getItem("email") || "",
        });
      }
    } catch (err) {
      console.warn("Failed to load portal profile from backend:", err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const portalId = profileData.portalId || "1";
      const res = await api.put(`/theater/portal-profile/${portalId}`, profileData);
      if (res.data) {
        setProfileData((prev) => ({ ...prev, ...res.data }));
        localStorage.setItem("portalName", res.data.portalName || profileData.portalName);
        localStorage.setItem("email", res.data.email || profileData.email);
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.clear();
    clearAssistantSession();
    navigate("/");
  };

  const name = profileData.portalName || theaterName || "Cinema Partner";

  const userRole = userInfo.role || localStorage.getItem("userRole") || localStorage.getItem("role") || "";
  const isManagerOrStaff = userRole === "THEATER_MANAGER" || userRole === "THEATER_STAFF" || userRole === "BRANCH_MANAGER" || userRole === "STAFF";

  const roleDisplay = (userRole === "THEATER_MANAGER" || userRole === "BRANCH_MANAGER" || userRole === "MANAGER")
    ? "Branch Manager"
    : (userRole === "THEATER_STAFF" || userRole === "STAFF")
    ? "Theater Staff"
    : "Theater Partner";

  const userEmail = userInfo.email || localStorage.getItem("email") || localStorage.getItem("userEmail") || profileData.email || "";
  const userFullName = userInfo.fullName || localStorage.getItem("userName") || localStorage.getItem("fullName") || (isManagerOrStaff ? (userEmail ? userEmail.split("@")[0] : "Branch Manager") : profileData.fullName);
  const userMobile = userInfo.phoneNumber || localStorage.getItem("phoneNumber") || localStorage.getItem("mobileNumber") || profileData.mobileNumber || "";

  return (
    <>
      <nav
        className="organizer-navbar d-flex align-items-center justify-content-between px-3 px-md-4"
        style={{
          height: "50px",
          width: "100%",
          background: "#12085c",
          color: "#fff",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          {onToggleSidebar && (
            <button
              type="button"
              className="d-md-none border-0 bg-transparent text-white p-1 d-flex align-items-center justify-content-center"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              style={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <BsList size={22} />
            </button>
          )}

          <button
            className="organizer-navbar-brand border-0 bg-transparent text-white d-flex align-items-center gap-2 p-0 text-start text-truncate"
            onClick={() => navigate("/")}
            style={{ maxWidth: "calc(100vw - 190px)" }}
          >
            <BsBox size={22} className="flex-shrink-0" />
            <span className="fw-bold d-none d-sm-inline" style={{ fontSize: "18px" }}>BackRooms</span>
            <span className="d-none d-sm-inline" style={{ opacity: 0.65, fontSize: "18px" }}>|</span>
            <BsFilm className="text-warning ms-1 flex-shrink-0" />
            <span className="fw-semibold text-truncate" style={{ fontSize: "15px" }}>
              {name} {!isManagerOrStaff && <span className="ms-2 d-none d-lg-inline" style={{ fontSize: "14px", fontWeight: "normal" }}>- Owner Console</span>}
            </span>
          </button>
        </div>

        <div className="organizer-navbar-actions d-flex align-items-center gap-2 gap-md-3">
          <TheaterNotificationBell />

          <button
            type="button"
            className="border-0 bg-transparent text-white d-flex align-items-center justify-content-center"
            style={{
              width: 36,
              height: 36,
              cursor: "pointer",
              opacity: 0.92,
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              transition: "background 0.15s ease",
            }}
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                const isManager = window.location.pathname.includes("manager");
                navigate(isManager ? "/theater/manager-dashboard?tab=settings" : "/theater/dashboard?tab=settings");
              }
            }}
            title="Theater Settings"
          >
            <BsGear size={17} />
          </button>
          
          <button
            type="button"
            className="border-0 bg-transparent text-white d-flex align-items-center gap-2"
            style={{ cursor: "pointer", opacity: 0.9, fontSize: "14px", fontWeight: 600, padding: "6px 12px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            onClick={() => setShowSupportModal(true)}
            title="Theater Support & Helpdesk"
          >
            <BsHeadset size={16} />
            <span>Support</span>
          </button>
          
          <TheaterSupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
          />

          <button
            className="organizer-navbar-profile border-0 bg-transparent text-white d-flex align-items-center gap-2"
            onClick={() => setShowProfile(true)}
          >
            <div className="text-end">
              <div className="fw-semibold" style={{ fontSize: "14px", lineHeight: "16px" }}>
                {roleDisplay}
              </div>
              <small style={{ color: "#dbeafe", fontSize: "12px" }}>{userFullName}</small>
            </div>

            <span className="d-inline-flex align-items-center justify-content-center fw-bold bg-primary text-white rounded-circle" style={{ width: "32px", height: "32px", fontSize: "14px" }}>
              {userFullName ? userFullName.slice(0, 2).toUpperCase() : "U"}
            </span>
          </button>
        </div>
      </nav>

      {showProfile &&
        createPortal(
          <div
            className="compact-profile-backdrop"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(2px)",
              zIndex: 20000,
            }}
            onClick={() => {
              setShowProfile(false);
              setIsEditing(false);
            }}
          >
          <div
            className="compact-profile-popup bg-white shadow-lg p-4 d-flex flex-column justify-content-between overflow-auto"
            style={{ width: "420px", height: "100vh", position: "absolute", right: 0, top: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                  <h5 className="fw-bold mb-0 text-dark">
                    {isManagerOrStaff ? `${roleDisplay} Profile` : "Theater Partner Profile"}
                  </h5>
                  <small className="text-muted">Manage your theater & user credentials</small>
                </div>
                <button className="btn border-0 text-secondary fs-5" onClick={() => { setShowProfile(false); setIsEditing(false); }}><BsXLg /></button>
              </div>

              {saveSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3 small" role="alert">
                  <span className="fw-bold">✓ Profile updated successfully!</span>
                </div>
              )}

              {/* SECTION 1: THEATER DETAILS */}
              <div className="p-3 mb-4 rounded-3 border bg-light">
                <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold border-bottom pb-2">
                  <BsFilm />
                  <span>SECTION 1: THEATER DETAILS</span>
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-bold d-block mb-1">THEATER PORTAL ID</label>
                  <span className="badge bg-secondary font-monospace fs-6 px-2 py-1">
                    {profileData.portalCode}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-bold d-block mb-1">THEATER / BRAND NAME</label>
                  {isEditing && !isManagerOrStaff ? (
                    <input
                      type="text"
                      className="form-control form-control-sm fw-semibold"
                      value={profileData.portalName}
                      onChange={(e) => setProfileData({ ...profileData, portalName: e.target.value })}
                    />
                  ) : (
                    <div className="fw-bold fs-6 text-dark">{profileData.portalName}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="text-muted small fw-bold d-block mb-1">THEATER TYPE</label>
                  {isEditing && !isManagerOrStaff ? (
                    <select
                      className="form-select form-select-sm fw-semibold"
                      value={profileData.theaterType}
                      onChange={(e) => setProfileData({ ...profileData, theaterType: e.target.value })}
                    >
                      <option value="MULTIPLEX">MULTIPLEX</option>
                      <option value="SINGLE_SCREEN">SINGLE_SCREEN</option>
                    </select>
                  ) : (
                    <span className="badge bg-info text-dark fw-bold px-2 py-1">
                      {profileData.theaterType}
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION 2: USER / OWNER DETAILS */}
              <div className="p-3 mb-4 rounded-3 border bg-light">
                <div className="d-flex align-items-center gap-2 mb-3 text-success fw-bold border-bottom pb-2">
                  <BsPerson />
                  <span>{isManagerOrStaff ? "SECTION 2: ACCOUNT DETAILS" : "SECTION 2: OWNER DETAILS"}</span>
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-bold d-block mb-1">FULL NAME</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm fw-semibold"
                      value={isManagerOrStaff ? userFullName : profileData.fullName}
                      onChange={(e) => {
                        if (isManagerOrStaff) {
                          localStorage.setItem("userName", e.target.value);
                        } else {
                          setProfileData({ ...profileData, fullName: e.target.value });
                        }
                      }}
                    />
                  ) : (
                    <div className="fw-bold text-dark">{isManagerOrStaff ? userFullName : profileData.fullName}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-bold d-block mb-1">MOBILE NUMBER</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm fw-semibold"
                      value={isManagerOrStaff ? userMobile : profileData.mobileNumber}
                      onChange={(e) => {
                        if (isManagerOrStaff) {
                          localStorage.setItem("phoneNumber", e.target.value);
                        } else {
                          setProfileData({ ...profileData, mobileNumber: e.target.value });
                        }
                      }}
                    />
                  ) : (
                    <div className="fw-semibold text-dark">{(isManagerOrStaff ? userMobile : profileData.mobileNumber) || "Not provided"}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="text-muted small fw-bold d-block mb-1">EMAIL ADDRESS</label>
                  {isEditing ? (
                    <input
                      type="email"
                      className="form-control form-control-sm fw-semibold"
                      value={isManagerOrStaff ? userEmail : profileData.email}
                      onChange={(e) => {
                        if (!isManagerOrStaff) {
                          setProfileData({ ...profileData, email: e.target.value });
                        }
                      }}
                      disabled={isManagerOrStaff}
                    />
                  ) : (
                    <div className="fw-semibold text-dark">{isManagerOrStaff ? userEmail : profileData.email}</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              {isEditing ? (
                <div className="d-flex gap-2 mb-2">
                  <button
                    className="btn btn-success flex-grow-1 fw-bold"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    className="btn btn-outline-secondary fw-bold"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-outline-primary w-100 mb-2 fw-bold"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile Details
                </button>
              )}

              <button className="btn btn-danger w-100 fw-bold" onClick={logout}>
                Log Out of Theater Portal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
