import { NavLink, useParams } from "react-router-dom";
import { BsCollection, BsFileText } from "react-icons/bs";

function AbstractSidebar() {
  const { id } = useParams();

  const items = [
    {
      label: "Abstract Topics",
      path: `/events/${id}/abstracts/topics`,
      icon: <BsCollection size={16} />
    },
    {
      label: "Abstract Forms",
      path: `/events/${id}/abstracts/forms`,
      icon: <BsFileText size={16} />
    }
  ];

  return (
    <div
      className="event-workspace-subnav bg-white border-end"
      style={{
  width: "220px",
  minWidth: "220px",
  height: "100%",
  overflowY: "auto",
  padding: "12px 10px"
}}
    >
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `event-sub-sidebar-link d-flex align-items-center gap-3 text-decoration-none px-2 py-2 rounded-3 mb-2 ${
              isActive ? "bg-primary-subtle text-primary" : "text-dark"
            }`
          }
          style={{
            fontSize: "14px",
            fontWeight: 500
          }}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </div>
  );  
}

export default AbstractSidebar;
