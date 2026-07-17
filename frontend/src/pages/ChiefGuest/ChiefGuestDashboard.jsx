import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsStar,
  BsClock,
  BsCheckCircle,
} from "react-icons/bs";

function ChiefGuestDashboard() {
  const firstName = localStorage.getItem("firstName") || "Chief Guest";

  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const chiefGuestId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("CHIEF_GUEST", `/chief-guest-assignments/chief-guest/${chiefGuestId}`);
      setAssignments(assigned);
    } catch (error) {
      console.log(error);
    }
  };

  const activeAssignments = assignments.filter(
    (item) => item.active
  );

  const upcoming = activeAssignments.filter(
    (item) =>
      item.event?.startDateTime &&
      new Date(item.event.startDateTime) > new Date()
  ).length;

  const completed = activeAssignments.filter(
    (item) =>
      item.event?.endDateTime &&
      new Date(item.event.endDateTime) < new Date()
  ).length;

  const cards = [
    {
      title: "Assigned Events",
      value: activeAssignments.length,
      icon: <BsCalendarEvent />,
    },
    {
      title: "Upcoming Events",
      value: upcoming,
      icon: <BsClock />,
    },
    {
      title: "Completed Events",
      value: completed,
      icon: <BsCheckCircle />,
    },
    {
      title: "Chief Guest",
      value: activeAssignments.length,
      icon: <BsStar />,
    },
  ];

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN");
  };

  return (
    <RoleLayout>
      <div className="mb-4">
        <h1
          className="fw-bold mb-1"
          style={{ fontSize: "28px" }}
        >
          Chief Guest Dashboard
        </h1>

        <p
          className="text-muted mb-0"
          style={{ fontSize: "16px" }}
        >
          Welcome back, <strong>{firstName}</strong>. View your
          assigned events and schedule.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div
            className="col-lg-3 col-md-6"
            key={card.title}
          >
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
          Assigned Events
        </h4>

        {activeAssignments.length === 0 ? (
          <p className="text-muted mb-0">
            No events assigned.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Role</th>
                  <th>Start</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {activeAssignments.map(
                  (assignment, index) => (
                    <tr key={assignment.id}>
                      <td>{index + 1}</td>

                      <td>
                        {assignment.event?.eventName ||
                          "N/A"}
                      </td>

                      <td>
                        {assignment.roleDescription ||
                          "Chief Guest"}
                      </td>

                      <td>
                        {formatDate(
                          assignment.event?.startDateTime
                        )}
                      </td>

                      <td>
                        <span className="badge bg-success">
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}

export default ChiefGuestDashboard;
