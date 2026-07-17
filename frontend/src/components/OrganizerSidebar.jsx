import { NavLink } from "react-router-dom";
import { BsPersonPlus } from "react-icons/bs";

import {
  BsHouse,
  BsCalendarEvent,
  BsClipboardCheck,
  BsPeople,
  BsCheckCircle,
  BsAward,
  BsBarChart,
  BsTicketPerforated
} from "react-icons/bs";

function OrganizerSidebar({ onNavigate }) {
  const menuItems = [
    {
      label: "Dashboard",
      path: "/organizer",
      icon: <BsHouse size={16} />
    },
    {
      label: "My Events",
      path: "/organizer/events",
      icon: <BsCalendarEvent size={16} />
    },
    {
      label: "Registrations",
      path: "/organizer/registrations",
      icon: <BsClipboardCheck size={16} />
    },
    {
      label: "Invite Staff",
      path: "/organizer/invite-staff",
      icon: <BsPersonPlus size={16} />
    },
    {
      label: "Staff",
      path: "/organizer/staff",
      icon: <BsPeople size={16} />
    },
    {
      label: "Attendance",
      path: "/organizer/attendance",
      icon: <BsCheckCircle size={16} />
    },
    {
      label: "Certificates",
      path: "/organizer/certificates",
      icon: <BsAward size={16} />
    },
    {
      label: "Reports",
      path: "/organizer/reports",
      icon: <BsBarChart size={16} />
    },
    {
      label: "Tickets",
      path: "/organizer/tickets",
      icon: <BsTicketPerforated size={16} />
    },
    {
  label: "Team Assignment",
  path: "/organizer/team-assignment",
  icon: <BsPeople size={16} />
}
  ];

  return (
    <div
      className="bg-white border-end"
      style={{
  width: "250px",
  height: "calc(100vh - 72px)",
  overflowY: "auto",
  overflowX: "hidden",
}}
    >
      <div className="pt-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/organizer"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `organizer-sidebar-item d-flex align-items-center gap-3 text-decoration-none px-3 py-2 mb-3 ${isActive
                ? "active mx-3"
                : "text-dark mx-3"
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
      </div>
    </div>
  );
}

export default OrganizerSidebar;
