import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import RoleIncidentReporter from "../../components/Role/RoleIncidentReporter";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsListTask,
  BsCheckCircle,
  BsClock,
} from "react-icons/bs";

function VolunteerDashboard() {
  const firstName = localStorage.getItem("firstName") || "Volunteer";

  const [assignments, setAssignments] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const volunteerId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("VOLUNTEER", `/volunteer-assignments/volunteer/${volunteerId}`);
      const taskRes = await api.get(`/volunteer-tasks/volunteer/${volunteerId}`);

      setAssignments(assigned);
      setTasks(taskRes.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const activeAssignments = assignments.filter((item) => item.active);

  const pendingTasks = tasks.filter((task) => task.status === "PENDING").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const cards = [
    {
      title: "Assigned Events",
      value: activeAssignments.length,
      icon: <BsCalendarEvent />,
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: <BsListTask />,
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      icon: <BsClock />,
    },
    {
      title: "Completed",
      value: completedTasks,
      icon: <BsCheckCircle />,
    },
  ];

  return (
    <RoleLayout>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "28px" }}>
          Volunteer Dashboard
        </h1>

        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Welcome back, <strong>{firstName}</strong>. View your assigned events
          and support duties.
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
        <h4 className="fw-bold mb-3">My Assignments</h4>

        {activeAssignments.length === 0 ? (
          <p className="text-muted mb-0">No volunteer assignments found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Duty</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {activeAssignments.map((assignment, index) => (
                  <tr key={assignment.id}>
                    <td>{index + 1}</td>
                    <td>{assignment.event?.eventName || "N/A"}</td>
                    <td>{assignment.duty || "General support"}</td>
                    <td>
                      <span className="badge bg-success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <RoleIncidentReporter assignments={activeAssignments} />
    </RoleLayout>
  );
}

export default VolunteerDashboard;


