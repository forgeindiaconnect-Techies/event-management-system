import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import "../../styles/Admin.css";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import {
  BsCalendarEvent,
  BsPeople,
  BsCheckCircle,
  BsBarChart,
} from "react-icons/bs";

function CoordinatorDashboard() {
  const firstName = localStorage.getItem("firstName") || "Coordinator";
  const portalName = localStorage.getItem("portalName") || "Event Portal";
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("COORDINATOR", `/coordinator-assignments/coordinator/${coordinatorId}`);
      setAssignments(assigned.filter((assignment) => assignment.active !== false));
    } catch (error) {
      console.log(error);
    }
  };

  const cards = [
    { title: "Assigned Events", value: assignments.length, icon: <BsCalendarEvent /> },
    { title: "Staff Members", value: 0, icon: <BsPeople /> },
    { title: "Volunteers", value: 0, icon: <BsPeople /> },
    { title: "Attendance", value: 0, icon: <BsCheckCircle /> },
    { title: "Reports", value: 0, icon: <BsBarChart /> },
  ];

  return (
    <RoleLayout>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "28px" }}>
          Coordinator Dashboard
        </h1>

        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Welcome back, <strong>{firstName}</strong>. Coordinate event
          operations for <strong>{portalName}</strong>.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div className="col-lg-3 col-md-6" key={card.title}>
            <div className="admin-bento-card h-100">
              <div className="admin-bento-icon mb-3">{card.icon}</div>
              <div className="admin-bento-label">{card.title}</div>
              <div className="admin-bento-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-bento-card">
        <h4 className="fw-bold mb-3">
          Coordinator Workspace
        </h4>

        <p className="text-muted mb-0">
          Monitor assigned events, staff, volunteers, attendance, and reports
          from one place.
        </p>
      </div>
    </RoleLayout>
  );
}

export default CoordinatorDashboard;
