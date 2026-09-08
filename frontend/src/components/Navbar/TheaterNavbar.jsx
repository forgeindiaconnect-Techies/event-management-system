import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import HelpMenu from "../Help/HelpMenu";
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
} from "react-icons/bs";

function TheaterNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const portalId = localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";
      const userRole = (localStorage.getItem("userRole") || localStorage.getItem("role") || "").toUpperCase();
      const dutyRole = (localStorage.getItem("dutyRole") || "").toLowerCase();
      const currentPath = window.location.pathname.toLowerCase();

      const isCashier = currentPath.includes("cashier") || dutyRole.includes("cashier") || userRole.includes("CASHIER");
      const isUsher = currentPath.includes("usher") || dutyRole.includes("usher") || dutyRole.includes("gate") || userRole.includes("USHER");
      const isManager = currentPath.includes("manager") || userRole.includes("MANAGER");

      if (isCashier) {
        // Cashier-specific operational notifications
        const firstName = localStorage.getItem("firstName") || "Cashier";
        const cashierNotifs = [
          {
            id: 101,
            title: "Shift Active & POS Ready",
            message: `Welcome ${firstName}! Morning shift POS is active and ready for Box Office ticket bookings.`,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          },
          {
            id: 102,
            title: "Movies & Pricing Synced",
            message: "All live screens, seating layouts, and ticket prices are synchronized.",
            createdAt: "Live",
            read: false,
          }
        ];
        setNotifications(cashierNotifs);
        setUnreadCount(cashierNotifs.length);
        return;
      }

      if (isUsher) {
        // Usher-specific operational notifications
        const firstName = localStorage.getItem("firstName") || "Usher";
        const usherNotifs = [
          {
            id: 201,
            title: "Gate Entry Scanner Active",
            message: `Welcome ${firstName}! QR code ticket scanner is connected and ready for audience entry.`,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          }
        ];
        setNotifications(usherNotifs);
        setUnreadCount(usherNotifs.length);
        return;
      }

      const res = await api.get(`/theater-invitations/portal/${portalId}`);
      if (res.data && Array.isArray(res.data)) {
        let filtered = res.data;
        if (isManager) {
          // Managers ONLY receive notifications for Theater Staff invited by them
          filtered = res.data.filter((inv) => (inv.roleName && inv.roleName.startsWith("THEATER_STAFF")) || (inv.dutyRole && !inv.dutyRole.includes("Manager")));
        }

        const theaterNotifs = filtered.map((inv) => {
          const roleLabel = inv.dutyRole || (inv.roleName === "THEATER_MANAGER" ? "Branch Manager" : "Theater Staff");
          return {
            id: inv.id,
            title: `Staff Invitation (${roleLabel})`,
            message: `Invitation for ${inv.speakerName || inv.email} (${inv.email}) — Status: ${inv.status}`,
            createdAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "Recently",
            read: false,
          };
        });
        setNotifications(theaterNotifs);
        setUnreadCount(theaterNotifs.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (e) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const removeOne = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="border-0 bg-transparent text-white d-flex align-items-center justify-content-center"
        style={{ width: 34, height: 34, position: "relative" }}
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
        title="Theater Notifications"
      >
        <BsBell size={18} />
        {unreadCount > 0 && (
          <span
            className="badge rounded-pill bg-danger"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              fontSize: "10px",
              padding: "2px 5px",
            }}
          >
            {unreadCount}
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
            width: "360px",
            zIndex: 1100,
            color: "#333",
          }}
        >
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light rounded-top-3">
            <h6 className="fw-bold mb-0 text-dark">Theater Notifications</h6>
            {notifications.length > 0 && (
              <button
                className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold text-primary"
                onClick={clearAll}
              >
                <BsCheck2All /> Clear All
              </button>
            )}
          </div>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {loading ? (
              <p className="text-muted text-center py-4 mb-0">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No new theater notifications.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 border-bottom d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h6 className="fw-bold mb-1 small text-dark">{n.title}</h6>
                    <p className="mb-1 text-muted" style={{ fontSize: "13px" }}>{n.message}</p>
                    <small className="text-secondary" style={{ fontSize: "11px" }}>{n.createdAt}</small>
                  </div>
                  <button
                    className="btn btn-sm border-0 text-danger p-0"
                    onClick={() => removeOne(n.id)}
                    title="Remove"
                  >
                    <BsTrash size={14} />
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

export default function TheaterNavbar({ theaterName }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
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
          onClick={() => navigate("/")}
        >
          <BsBox size={22} />
          <span className="fw-bold" style={{ fontSize: "18px" }}>BackRooms</span>
          <span style={{ opacity: 0.65, fontSize: "18px" }}>|</span>
          <BsFilm className="text-warning ms-1" />
          <span className="fw-semibold" style={{ fontSize: "16px" }}>
            {name} {!isManagerOrStaff && <span className="text-info ms-2" style={{ fontSize: "14px" }}>- Owner Console</span>}
          </span>
        </button>

        <div className="organizer-navbar-actions d-flex align-items-center gap-4">
          <TheaterNotificationBell />
          <HelpMenu hideFloating={true} />

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

      {showProfile && (
        <div
          className="compact-profile-backdrop"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 999 }}
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
        </div>
      )}
    </>
  );
}
