import { NavLink, useParams } from "react-router-dom";
import { BsBuilding, BsGrid, BsPeople, BsBarChart } from "react-icons/bs";

function ExhibitorSidebar() {
  const { id } = useParams();

  const items = [
    { label: "Exhibitors", path: `/events/${id}/exhibitors/list`, icon: <BsBuilding size={16} /> },
    { label: "Booths", path: `/events/${id}/exhibitors/booths`, icon: <BsGrid size={16} /> },
    { label: "Leads", path: `/events/${id}/exhibitors/leads`, icon: <BsPeople size={16} /> },
    { label: "Reports", path: `/events/${id}/exhibitors/reports`, icon: <BsBarChart size={16} /> }
  ];

  return (
    <div className="event-workspace-subnav bg-white border-end" style={{ width: "220px", minWidth: "220px", padding: "12px 10px" }}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `event-sub-sidebar-link d-flex align-items-center gap-3 text-decoration-none px-3 py-2 rounded-3 mb-2 ${
              isActive ? "bg-primary-subtle text-primary" : "text-dark"
            }`
          }
          style={{ fontSize: "14px", fontWeight: 500 }}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default ExhibitorSidebar;
