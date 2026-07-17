import { Link, useLocation } from "react-router-dom";
import {
  BsHouse,
  BsCalendarEvent,
  BsPeople,
  BsGraphUp,
  BsBarChart,
  BsTicketPerforated,
  BsGear,
  BsPersonPlus,
} from "react-icons/bs";

function AdminSidebar({ onNavigate }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: <BsHouse /> },
    { label: "Events", path: "/admin/events", icon: <BsCalendarEvent /> },
    { label: "Invite Organizers", path: "/admin/organizers", icon: <BsPersonPlus /> },
    { label: "Teams", path: "/admin/teams", icon: <BsPeople /> },
    { label: "Attendees", path: "/admin/attendees", icon: <BsTicketPerforated /> },
    { label: "Reports", path: "/admin/reports", icon: <BsBarChart /> },
    { label: "Analytics", path: "/admin/analytics", icon: <BsGraphUp /> },
    { label: "Settings", path: "/admin/settings", icon: <BsGear /> },
  ];

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: "200px",
        minHeight: "calc(100vh - 50px)",
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        padding: "14px 10px",
      }}
    >
      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <Link
  key={item.path}
  to={item.path}
  className={`admin-sidebar-item text-decoration-none d-flex align-items-center mb-2 ${
    isActive(item.path) ? "active" : ""
  }`}
            onClick={onNavigate}
            style={{
  gap: "8px",
  padding: "8px 10px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: 600,
  color: isActive(item.path) ? "#4f46e5" : "#374151",
  background: isActive(item.path) ? "#eef2ff" : "transparent",
  transition: "all .25s ease",
}}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
