import { NavLink, useParams } from "react-router-dom";
import {
  BsBarChart,
  BsCardChecklist,
  BsExclamationTriangle,
  BsBoxes,
  BsBuilding,
  BsCashStack,
} from "react-icons/bs";

const items = [
  ["Overview", "overview", BsBarChart],
  ["Tasks & Checklists", "tasks", BsCardChecklist],
  ["Incidents", "incidents", BsExclamationTriangle],
  ["Resources", "resources", BsBoxes],
  ["Vendors", "vendors", BsBuilding],
  ["Budget & Expenses", "budget", BsCashStack],
];

function OperationsSidebar() {
  const { id } = useParams();

  return (
    <nav className="manage-subnav bg-white border-end" style={{ width: 230, minWidth: 230, height: "100%", padding: "12px 10px" }}>
      {items.map(([label, path, Icon]) => (
        <NavLink
          key={path}
          to={`/events/${id}/operations/${path}`}
          className={({ isActive }) =>
            `event-sub-sidebar-link d-flex align-items-center gap-3 text-decoration-none px-3 py-2 rounded-3 mb-2 ${
              isActive ? "bg-primary-subtle text-primary" : "text-dark"
            }`
          }
          style={{ fontSize: 14, fontWeight: 500 }}
        >
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default OperationsSidebar;
