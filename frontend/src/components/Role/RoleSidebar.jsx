import { NavLink } from "react-router-dom";
import { BsBarChart } from "react-icons/bs";
import {
  BsHouse,
  BsCalendarEvent,
  BsTicketPerforated,
  BsCheckCircle,
  BsPerson,
  BsListTask,
  BsMic,
  BsTrophy,
  BsStar,
  BsPeople,
  BsInfoCircle,
  BsExclamationTriangle,
  BsCalendarCheck,
} from "react-icons/bs";

function RoleSidebar() {
  const role = normalizeRole(
    localStorage.getItem("activeRole") ||
      localStorage.getItem("role") ||
      "STAFF"
  );

  const menus = {
    STAFF: [
      { label: "Dashboard", path: "/staff", icon: <BsHouse /> },
      { label: "Assigned Events", path: "/staff/events", icon: <BsCalendarEvent /> },
      { label: "Ticket Verify", path: "/staff/check-in", icon: <BsTicketPerforated /> },
      { label: "Attendance", path: "/staff/attendance", icon: <BsCheckCircle /> },
    ],

    VOLUNTEER: [
      { label: "Dashboard", path: "/volunteer", icon: <BsHouse /> },
      { label: "Assigned Events", path: "/volunteer/events", icon: <BsCalendarEvent /> },
      { label: "My Tasks", path: "/volunteer/tasks", icon: <BsListTask /> },
    ],

    COORDINATOR: [
      { label: "Dashboard", path: "/coordinator", icon: <BsHouse /> },
      { label: "Assigned Events", path: "/coordinator/events", icon: <BsCalendarEvent /> },
      { label: "Team", path: "/coordinator/team", icon: <BsPeople /> },
      { label: "Tasks", path: "/coordinator/tasks", icon: <BsListTask /> },
      { label: "Incidents", path: "/coordinator/incidents", icon: <BsExclamationTriangle /> },
      { label: "Attendance", path: "/coordinator/attendance", icon: <BsCheckCircle /> },
      { label: "Event Day", path: "/coordinator/event-day", icon: <BsCalendarCheck /> },
      { label: "Reports", path: "/coordinator/reports", icon: <BsBarChart /> },
    ],

    SPEAKER: [
      { label: "Dashboard", path: "/speaker", icon: <BsHouse /> },
      { label: "My Sessions", path: "/speaker/sessions", icon: <BsMic /> },
      { label: "Schedule", path: "/speaker/schedule", icon: <BsCalendarEvent /> },
    ],

    JUDGE: [
      { label: "Dashboard", path: "/judge", icon: <BsHouse /> },
      { label: "Competitions", path: "/judge/competitions", icon: <BsTrophy /> },
      { label: "Assigned Work", path: "/judge/work", icon: <BsListTask /> },
    ],

    TRAINER: [
      { label: "Dashboard", path: "/mentor", icon: <BsHouse /> },
      { label: "Assigned Teams", path: "/mentor/teams", icon: <BsPeople /> },
      { label: "Schedule", path: "/mentor/schedule", icon: <BsCalendarEvent /> },
    ],

    CHIEF_GUEST: [
      { label: "Dashboard", path: "/chief-guest", icon: <BsHouse /> },
      { label: "Event Schedule", path: "/chief-guest/schedule", icon: <BsCalendarEvent /> },
      { label: "Event Details", path: "/chief-guest/details", icon: <BsInfoCircle /> },
    ],
  };

  const menuItems = menus[role] || menus.STAFF;

  return (
    <aside
      style={{
        width: "250px",
        height: "100%",
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        padding: "14px 10px",
      }}
    >
      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `role-sidebar-item text-decoration-none d-flex align-items-center mb-2 ${
                isActive ? "active" : ""
              }`
            }
          >
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 550
              }}
            >
              {item.label}
            </span>
            </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function normalizeRole(role) {
  const value = String(role || "").trim();
  return value === "Staff" ? "STAFF" : value.toUpperCase();
}

export default RoleSidebar;
