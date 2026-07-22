import RoleLayout from "../layouts/RoleLayout";
import "../styles/Admin.css";
import {
  BsCalendarEvent,
  BsCheckCircle,
  BsClipboardCheck,
  BsPeople,
  BsMic,
  BsTrophy,
  BsPersonBadge,
  BsStar,
} from "react-icons/bs";

function RoleDashboard() {
  const role = localStorage.getItem("role") || "Staff";
  const firstName = localStorage.getItem("firstName") || "User";
  const portalName = localStorage.getItem("portalName") || "Event Portal";

  const dashboardContent = {
    Staff: {
      title: "Staff Dashboard",
      description: "Manage event operations and attendee verification.",
      cards: [
        { title: "Assigned Events", value: 0, icon: <BsCalendarEvent /> },
        { title: "Tickets Verified", value: 0, icon: <BsCheckCircle /> },
        { title: "Attendance", value: 0, icon: <BsClipboardCheck /> },
        { title: "Pending Tasks", value: 0, icon: <BsPersonBadge /> },
      ],
    },

    VOLUNTEER: {
      title: "Volunteer Dashboard",
      description: "View assigned activities and support the event.",
      cards: [
        { title: "Assigned Events", value: 0, icon: <BsCalendarEvent /> },
        { title: "Tasks", value: 0, icon: <BsClipboardCheck /> },
        { title: "Completed", value: 0, icon: <BsCheckCircle /> },
        { title: "Teams", value: 0, icon: <BsPeople /> },
      ],
    },

    COORDINATOR: {
      title: "Coordinator Dashboard",
      description: "Monitor staff and coordinate event activities.",
      cards: [
        { title: "Events", value: 0, icon: <BsCalendarEvent /> },
        { title: "Staff", value: 0, icon: <BsPeople /> },
        { title: "Volunteers", value: 0, icon: <BsPersonBadge /> },
        { title: "Completed", value: 0, icon: <BsCheckCircle /> },
      ],
    },

    SPEAKER: {
      title: "Speaker Dashboard",
      description: "Manage your sessions and schedules.",
      cards: [
        { title: "Sessions", value: 0, icon: <BsMic /> },
        { title: "Events", value: 0, icon: <BsCalendarEvent /> },
        { title: "Participants", value: 0, icon: <BsPeople /> },
        { title: "Completed", value: 0, icon: <BsCheckCircle /> },
      ],
    },

    JUDGE: {
      title: "Judge Dashboard",
      description: "Review competitions and submit scores.",
      cards: [
        { title: "Competitions", value: 0, icon: <BsTrophy /> },
        { title: "Participants", value: 0, icon: <BsPeople /> },
        { title: "Scores", value: 0, icon: <BsStar /> },
        { title: "Completed", value: 0, icon: <BsCheckCircle /> },
      ],
    },

    TRAINER: {
      title: "Trainer Dashboard",
      description: "Guide assigned teams and participants.",
      cards: [
        { title: "Teams", value: 0, icon: <BsPeople /> },
        { title: "Meetings", value: 0, icon: <BsCalendarEvent /> },
        { title: "Sessions", value: 0, icon: <BsMic /> },
        { title: "Completed", value: 0, icon: <BsCheckCircle /> },
      ],
    },

    CHIEF_GUEST: {
      title: "Chief Guest Dashboard",
      description: "View event schedule and important information.",
      cards: [
        { title: "Events", value: 0, icon: <BsCalendarEvent /> },
        { title: "Agenda", value: 0, icon: <BsClipboardCheck /> },
        { title: "Sessions", value: 0, icon: <BsMic /> },
        { title: "Guests", value: 0, icon: <BsPeople /> },
      ],
    },
  };

  const current = dashboardContent[role] || dashboardContent.Staff;

  return (
    <RoleLayout>
      <div className="mb-4">
        <h1 className="fw-bold" style={{ fontSize: "28px" }}>
          {current.title}
        </h1>

        <p className="text-muted" style={{ fontSize: "16px" }}>
          Welcome back, <strong>{firstName}</strong> 👋
        </p>

        <p className="text-muted mb-0">
          {current.description}
        </p>
      </div>

      <div className="row g-4 mb-4">
        {current.cards.map((card) => (
          <div className="col-lg-3 col-md-6" key={card.title}>
            <div className="admin-bento-card h-100">
              <div className="admin-bento-icon mb-3">
                {card.icon}
              </div>

              <div className="admin-bento-label">
                {card.title}
              </div>

              <div className="admin-bento-value">
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-bento-card">
        <h4 className="fw-bold mb-3">
          Welcome to {portalName}
        </h4>

        <p className="text-muted mb-0">
          This dashboard is customized for the <strong>{role}</strong> role.
          As more modules are added, you'll be able to manage your assigned
          events, responsibilities, schedules, and tasks from here.
        </p>
      </div>
    </RoleLayout>
  );
}

export default RoleDashboard;
