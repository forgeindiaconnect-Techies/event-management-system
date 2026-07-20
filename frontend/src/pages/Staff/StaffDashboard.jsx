import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import RoleIncidentReporter from "../../components/Role/RoleIncidentReporter";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsTicketPerforated,
  BsCheckCircle,
  BsPeople,
  BsArrowRight,
} from "react-icons/bs";

function StaffDashboard() {
  const navigate = useNavigate();

  const firstName = localStorage.getItem("firstName") || "Staff";
  const portalName = localStorage.getItem("portalName") || "Event Portal";

  const [assignments, setAssignments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const staffId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("STAFF", `/staff-assignments/staff/${staffId}`);

      const activeAssignments = assigned.filter(
        (assignment) => assignment.active === true
      );

      const eventIds = activeAssignments
        .map((assignment) => assignment.event?.id)
        .filter(Boolean);

      const registrationResults = await Promise.all(
        eventIds.map((eventId) => api.get(`/registrations/event/${eventId}`))
      );

      const ticketResults = await Promise.all(
        eventIds.map((eventId) => api.get(`/tickets/event/${eventId}`))
      );

      setAssignments(activeAssignments);
      setRegistrations(registrationResults.flatMap((res) => res.data || []));
      setTickets(ticketResults.flatMap((res) => res.data || []));
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load staff dashboard.");
    }
  };

  const assignedEventsCount = assignments.length;
  const ticketsVerifiedCount = tickets.filter(
    (ticket) => ticket.status === "USED"
  ).length;
  const attendanceCount = registrations.filter(
    (registration) => registration.attended === true
  ).length;
  const participantsCount = registrations.length;

  const cards = [
    {
      title: "Assigned Events",
      value: assignedEventsCount,
      icon: <BsCalendarEvent />,
    },
    {
      title: "Tickets Verified",
      value: ticketsVerifiedCount,
      icon: <BsTicketPerforated />,
    },
    {
      title: "Attendance",
      value: attendanceCount,
      icon: <BsCheckCircle />,
    },
    {
      title: "Participants",
      value: participantsCount,
      icon: <BsPeople />,
    },
  ];

  return (
    <RoleLayout
      mainClassName="staff-dashboard-main"
      sidebarClassName="staff-dashboard-sidebar"
    >
      <div className="staff-dashboard-page">
      <div className="mb-4 staff-dashboard-header">
        <h1 className="fw-bold mb-1 staff-dashboard-title">
          Staff Dashboard
        </h1>

        <p className="text-muted mb-0 staff-dashboard-subtitle">
          Welcome back, <strong>{firstName}</strong>. Manage your assigned
          events and attendee verification for <strong>{portalName}</strong>.
        </p>
      </div>

      <div className="staff-mobile-nav mb-3">
        <button onClick={() => navigate("/staff")}>
          <BsCalendarEvent />
          Dashboard
        </button>
        <button onClick={() => navigate("/staff/check-in")}>
          <BsTicketPerforated />
          Verify
        </button>
        <button onClick={() => navigate("/staff/attendance")}>
          <BsCheckCircle />
          Attendance
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

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

      <div className="admin-bento-card mb-4">
        <h4 className="fw-bold mb-3">Quick Actions</h4>

        <div className="row g-3">
          <div className="col-md-4">
            <button
              className="btn btn-primary w-100 py-3"
              onClick={() => navigate("/staff/check-in")}
            >
              <BsTicketPerforated className="me-2" />
              Verify Tickets
            </button>
          </div>

          <div className="col-md-4">
            <button
              className="btn btn-success w-100 py-3"
              onClick={() => navigate("/staff/attendance")}
            >
              <BsCheckCircle className="me-2" />
              View Attendance
            </button>
          </div>

          <div className="col-md-4">
            <button
              className="btn btn-outline-primary w-100 py-3"
              onClick={() => navigate("/staff/events")}
            >
              <BsCalendarEvent className="me-2" />
              View Events
            </button>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <div className="d-flex justify-content-between align-items-center mb-3 staff-section-toolbar">
          <h4 className="fw-bold mb-0">Assigned Event Activity</h4>

          <button
            className="btn btn-link text-decoration-none"
            onClick={() => navigate("/staff/events")}
          >
            View All <BsArrowRight />
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-5" style={{ color: "#6b7280" }}>
            <BsCalendarEvent size={55} className="mb-3" />

            <h5>No assigned events available</h5>

            <p className="mb-0">
              Assigned events, ticket verification, and attendance activities
              will appear here.
            </p>
          </div>
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
                {assignments.slice(0, 5).map((assignment, index) => (
                  <tr key={assignment.id}>
                    <td>{index + 1}</td>
                    <td>{assignment.event?.eventName || "N/A"}</td>
                    <td>{assignment.duty || "General duty"}</td>
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
      <RoleIncidentReporter assignments={assignments} />
      </div>
    </RoleLayout>
  );
}

export default StaffDashboard;



