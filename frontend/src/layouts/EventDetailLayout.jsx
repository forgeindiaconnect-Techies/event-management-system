import { useEffect, useMemo, useState } from "react";
import {
  BsArrowLeft,
  BsBox,
  BsBuilding,
  BsCheck2Circle,
  BsCloudUpload,
  BsEnvelope,
  BsPencilSquare,
  BsPerson,
  BsPersonCircle,
  BsPhone,
  BsShieldCheck,
  BsXLg,
  BsList,
} from "react-icons/bs";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import HelpMenu from "../components/Help/HelpMenu";
import "../styles/Admin.css";
import {
  FaTachometerAlt,
  FaCog,
  FaClipboardList,
  FaStore,
  FaFileAlt,
  FaChartBar,
  FaCalendarCheck,
  FaSearch,
  FaTimes
} from "react-icons/fa";

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
  SUPER_ADMIN: "/super-admin",
};

function getDashboardPath() {
  const role = String(
    localStorage.getItem("activeRole") || localStorage.getItem("role") || ""
  )
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

  return dashboardRoutes[role] || "/admin";
}

function EventDetailLayout({ children, event }) {
  const { id } = useParams();
  const location = useLocation();
  const dashboardPath = getDashboardPath();
  const [showSearch, setShowSearch] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [eventStatus, setEventStatus] = useState(event?.status || "");
  const [publishingEvent, setPublishingEvent] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [portalDetails, setPortalDetails] = useState({
    portalName: localStorage.getItem("portalName") || "Portal",
    portalCode: localStorage.getItem("portalCode") || "",
  });
  const [userProfile, setUserProfile] = useState(getStoredUserProfile);
  const [profileForm, setProfileForm] = useState(getStoredUserProfile);

  useEffect(() => {
    setEventStatus(event?.status || "");
  }, [event?.status]);

  useEffect(() => {
    setShowEventMenu(false);
  }, [location.pathname]);

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

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const publishEvent = async () => {
    const confirmed = window.confirm(
      "Have you finished customizing this event? Publishing will make it available to participants."
    );
    if (!confirmed) return;

    try {
      setPublishingEvent(true);
      setPublishMessage("");
      const response = await api.put(`/events/${id}/publish`);
      setEventStatus(response.data?.status || "PUBLISHED");
      setPublishMessage("Event published successfully.");
    } catch (error) {
      console.error(error);
      setPublishMessage(error.response?.data?.message || "Unable to publish the event.");
    } finally {
      setPublishingEvent(false);
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt size={15} />, path: `/events/${id}` },
    { label: "Manage", icon: <FaCog size={15} />, path: `/events/${id}/manage` },
    { label: "Registrations", icon: <FaClipboardList size={15} />, path: `/events/${id}/registrations` },
    { label: "Exhibitors", icon: <FaStore size={15} />, path: `/events/${id}/exhibitors` },
    { label: "Abstracts", icon: <FaFileAlt size={15} />, path: `/events/${id}/abstracts` },
    { label: "Reports", icon: <FaChartBar size={15} />, path: `/events/${id}/reports` },
    { label: "Event Day", icon: <FaCalendarCheck size={15} />, path: `/events/${id}/event-day` }
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <aside
        className={`event-main-sidebar ${showEventMenu ? "mobile-open" : ""}`}
        style={{
          width: "150px",
          minWidth: "150px",
          height: "100vh",
          position: "sticky",
          top: 0,
          background: "#f5f6fb",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          zIndex: 30
        }}
      >
        <div
          className="text-white d-flex align-items-center px-2"
          style={{ background: "#12085c", minHeight: "58px" }}
        >
          <Link
            to={dashboardPath}
            className="text-white text-decoration-none d-flex align-items-center justify-content-center gap-2 w-100"
          >
            <BsBox size={25} />
            <span
              className="fw-bold"
              style={{ fontSize: "15px", whiteSpace: "nowrap" }}
            >
              BackRooms
            </span>
          </Link>
        </div>

        <Link
          to={dashboardPath}
          aria-label="Back to your dashboard"
          title="Back to dashboard"
          className="event-dashboard-floating-back text-decoration-none d-flex align-items-center justify-content-center"
        >
          <BsArrowLeft size={18} />
        </Link>

        <div className="event-main-navigation flex-grow-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              data-tour={`event-${item.label.toLowerCase().replaceAll(" ", "-")}`}
              to={item.path}
              onClick={() => setShowEventMenu(false)}
              className="event-main-sidebar-link d-block text-center py-3 text-decoration-none"
              style={{
                color: isActive(item.path) ? "#4f46e5" : "#111",
                background: isActive(item.path) ? "#e9edff" : "transparent",
                fontSize: "16px"
              }}
            >
              <div className="mb-1">{item.icon}</div>
              <div>{item.label}</div>
            </Link>
          ))}
        </div>

        <button
          data-tour="event-search"
          onClick={() => setShowSearch(true)}
          className="event-main-sidebar-link text-center text-decoration-none py-3 border-top border-0"
          style={{
            color: "#111",
            background: "transparent",
            fontSize: "16px"
          }}
        >
          <div className="mb-1">
            <FaSearch size={16} />
          </div>
          <div>Search</div>
        </button>
      </aside>

      {showEventMenu && <button type="button" className="event-mobile-sidebar-backdrop" aria-label="Close event menu" onClick={() => setShowEventMenu(false)} />}

      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <header
          className="event-detail-navbar text-white px-4 d-flex align-items-center justify-content-between"
          style={{
            background: "#12085c",
            height: "58px",
            position: "sticky",
            top: 0,
            zIndex: 25
          }}
        >
          <button type="button" className="event-mobile-menu-button" aria-label="Open event menu" aria-expanded={showEventMenu} onClick={() => setShowEventMenu((open) => !open)}>
            <BsList />
          </button>

          <div className="d-flex flex-column" data-tour="event-title">
            <div
              className="fw-semibold"
              style={{
                fontSize: "16px",
                lineHeight: "20px"
              }}
            >
              {event?.eventName || "Event Dashboard"}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#ffffffcc",
                marginTop: "2px",
                textTransform: "uppercase"
              }}
            >
              {eventStatus}
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {String(eventStatus).toUpperCase() === "DRAFT" && ["PORTAL_ADMIN", "ORGANIZER"].includes(localStorage.getItem("activeRole") || localStorage.getItem("role")) && (
              <button
                type="button"
                className="event-navbar-publish"
                onClick={publishEvent}
                disabled={publishingEvent}
              >
                <BsCloudUpload size={16} />
                {publishingEvent ? "Publishing..." : "Publish Event"}
              </button>
            )}

            <HelpMenu />

            <button
              data-tour="event-profile"
              className="border-0 bg-transparent text-white d-flex align-items-center gap-2"
              onClick={() => setShowProfile(true)}
              style={{ transition: "0.2s ease" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="text-end d-none d-sm-block">
                <div className="fw-semibold" style={{ fontSize: "13px", lineHeight: "16px" }}>
                  {userProfile.fullName || userProfile.email || "Profile"}
                </div>
                <small style={{ color: "#dbeafe", fontSize: "11px" }}>
                  {localStorage.getItem("activeRole") || localStorage.getItem("role") || "User"}
                </small>
              </div>
              <ProfileAvatar profile={userProfile} size={30} />
            </button>
          </div>
        </header>

        {publishMessage && (
          <div className={`event-publish-message ${eventStatus === "PUBLISHED" ? "success" : "error"}`}>
            {publishMessage}
            <button type="button" onClick={() => setPublishMessage("")} aria-label="Dismiss message">×</button>
          </div>
        )}

        <main
          className="event-detail-content"
          style={{
            background: "#f8f9fa",
            height: "calc(100vh - 58px)",
            overflowX: "hidden",
            overflowY: "auto"
          }}
        >
          {children}
        </main>
      </div>

      {showSearch && (
        <EventSearchModal id={id} close={() => setShowSearch(false)} />
      )}

      {showProfile && (
        <EventProfileDrawer
          userProfile={userProfile}
          profileForm={profileForm}
          portalDetails={portalDetails}
          editProfile={editProfile}
          savingProfile={savingProfile}
          profileMessage={profileMessage}
          onChange={handleProfileChange}
          onSave={saveProfile}
          onCancel={cancelEdit}
          onEdit={() => setEditProfile(true)}
          onClose={() => setShowProfile(false)}
          onLogout={logout}
        />
      )}
    </div>
  );
}

function EventProfileDrawer({
  userProfile,
  profileForm,
  portalDetails,
  editProfile,
  savingProfile,
  profileMessage,
  onChange,
  onSave,
  onCancel,
  onEdit,
  onClose,
  onLogout,
}) {
  const role = localStorage.getItem("activeRole") || localStorage.getItem("role") || "User";
  const fullName = userProfile.fullName || userProfile.email || "User";
  const portalName = portalDetails.portalName || "Portal";
  const portalCode = portalDetails.portalCode || "N/A";

  return (
    <div
      className="compact-profile-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.25)",
        zIndex: 9999,
      }}
      onClick={onClose}
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
        onClick={(event) => event.stopPropagation()}
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
                {formatRole(role)}
              </p>
              <h2 className="fw-bold mb-0" style={{ fontSize: "24px" }}>
                Profile
              </h2>
            </div>

            <button className="btn border-0 text-white" onClick={onClose}>
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
                  onClick={onEdit}
                >
                  <BsPencilSquare /> Edit
                </button>
              )}
            </div>

            {editProfile ? (
              <ProfileEditForm
                form={profileForm}
                saving={savingProfile}
                onChange={onChange}
                onSave={onSave}
                onCancel={onCancel}
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

          <button className="btn btn-danger w-100" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
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

function EventSearchModal({ id, close }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const pages = [
    { title: "Overview", path: `/events/${id}` },
    { title: "Event Info", path: `/events/${id}/manage/event-info` },
    { title: "Team", path: `/events/${id}/manage/team` },
    { title: "Agenda", path: `/events/${id}/manage/agenda` },
    { title: "Speakers", path: `/events/${id}/manage/speakers` },
    { title: "Sponsors", path: `/events/${id}/manage/sponsors` },
    { title: "Attendees", path: `/events/${id}/registrations/attendees` },
    { title: "Registration Form", path: `/events/${id}/registrations/form` },
    { title: "Check In", path: `/events/${id}/event-day/check-in` },
    { title: "Attendance", path: `/events/${id}/event-day/attendance` },
    { title: "Announcements", path: `/events/${id}/event-day/announcements` },
    { title: "Reports Overview", path: `/events/${id}/reports/overview` },
    { title: "Revenue Report", path: `/events/${id}/reports/revenue` },
    { title: "Exhibitors", path: `/events/${id}/exhibitors/list` },
    { title: "Abstract Topics", path: `/events/${id}/abstracts/topics` },
    { title: "Abstract Forms", path: `/events/${id}/abstracts/forms` }
  ];

  const filteredPages = useMemo(() => {
    return pages.filter((page) =>
      page.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const goToPage = (path) => {
    close();
    navigate(path);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        paddingTop: "40px"
      }}
    >
      <div
        className="event-search-modal bg-white mx-auto"
        style={{
          width: "620px",
          borderRadius: "8px",
          overflow: "hidden"
        }}
      >
        <div className="event-search-header d-flex justify-content-between align-items-center p-4 border-bottom">
          <h3 className="mb-0" style={{ fontSize: "16px", fontWeight: 600 }}>
            What are you looking for?
          </h3>

          <button className="btn border-0 p-0" onClick={close}>
            <FaTimes size={18} />
          </button>
        </div>

        <div className="event-search-body p-4">
          <div
            className="event-search-input d-flex align-items-center border rounded px-3 mb-3"
            style={{
              height: "38px",
              borderColor: "#4f46e5"
            }}
          >
            <FaSearch size={16} className="text-muted me-2" />

            <input
              className="form-control border-0 shadow-none p-0"
              placeholder="Search or Jump to"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ fontSize: "16px" }}
              autoFocus
            />

            <span
              className="badge bg-light text-dark"
              style={{ fontSize: "12px" }}
            >
              ⌘ k
            </span>
          </div>

          <div className="event-search-results" style={{ maxHeight: "420px", overflowY: "auto" }}>
            {filteredPages.map((page) => (
              <button
                key={page.path}
                className="event-search-result-btn btn w-100 text-start border-0"
                style={{
                  height: "42px",
                  fontSize: "16px"
                }}
                onClick={() => goToPage(page.path)}
              >
                {page.title}
              </button>
            ))}

            {filteredPages.length === 0 && (
              <div className="text-muted text-center py-4" style={{ fontSize: "13px" }}>
                No pages found
              </div>
            )}
          </div>
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

function formatRole(role) {
  return String(role || "User")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

export default EventDetailLayout;
