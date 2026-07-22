import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import "../../styles/Admin.css";
import { filterToActiveEvent, loadRoleAssignments, resolveActiveAssignment } from "../../utils/roleAssignments";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
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
  const [metrics, setMetrics] = useState({ team: 0, tasks: 0, incidents: 0 });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("COORDINATOR", `/coordinator-assignments/coordinator/${coordinatorId}`);
      resolveActiveAssignment(assigned);
      const selected = filterToActiveEvent(assigned);
      setAssignments(selected.filter((assignment) => assignment.active !== false));
      const active = selected.filter((assignment) => assignment.active !== false && assignment.event?.id);
      const details = await Promise.all(active.map(async (assignment) => {
        const id = assignment.event.id;
        const results = await Promise.allSettled([api.get(`/staff-assignments/event/${id}`), api.get(`/volunteer-assignments/event/${id}`), api.get(`/events/${id}/operations/tasks`), api.get(`/events/${id}/operations/incidents`)]);
        return results.map(result => result.status === "fulfilled" ? result.value.data || [] : []);
      }));
      setMetrics({
        team: details.reduce((n, x) => n + x[0].length + x[1].length, 0),
        tasks: details.reduce((n, x) => n + x[2].filter(t => !["COMPLETED", "CANCELLED"].includes(t.status)).length, 0),
        incidents: details.reduce((n, x) => n + x[3].filter(i => !["RESOLVED", "CLOSED"].includes(i.status)).length, 0),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const cards = [
    { title: "Assigned Events", value: assignments.length, icon: <BsCalendarEvent /> },
    { title: "Assigned Team", value: metrics.team, icon: <BsPeople /> },
    { title: "Open Tasks", value: metrics.tasks, icon: <BsCheckCircle /> },
    { title: "Open Incidents", value: metrics.incidents, icon: <BsBarChart /> },
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
          Monitor only your assigned events, team, deadlines, incident response, attendance, and event-day work.
        </p>
        <div className="d-flex flex-wrap gap-2 mt-3">{[["Assigned Events","/coordinator/events"],["Team","/coordinator/team"],["Tasks","/coordinator/tasks"],["Incidents","/coordinator/incidents"],["Attendance","/coordinator/attendance"],["Event Day","/coordinator/event-day"],["Reports","/coordinator/reports"]].map(([label,path])=><Link className="btn btn-outline-primary" key={path} to={path}>{label}</Link>)}</div>
      </div>
    </RoleLayout>
  );
}

export default CoordinatorDashboard;
