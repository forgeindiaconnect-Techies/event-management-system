  import { useEffect, useState } from "react";
  import { Link } from "react-router-dom";
  import api from "../api/axiosConfig";
  import "../styles/Admin.css";
  import AdminLayout from "../layouts/AdminLayout";
  import {
    BsCalendarEvent,
    BsPeople,
    BsPersonPlus,
    BsTicketPerforated,
    BsGraphUp,
    BsArrowRight,
  } from "react-icons/bs";

  function AdminDashboard() {
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [users, setUsers] = useState([]);
    const [organizers, setOrganizers] = useState([]);

    useEffect(() => {
  async function fetchDashboardData() {
    const portalId = localStorage.getItem("portalId");

    try {
      const eventRes = await api.get(`/events/portal/${portalId}`);
      setEvents(eventRes.data || []);
    } catch (error) {
      console.log("events error:", error);
    }

    try {
      const registrationRes = await api.get(`/registrations/portal/${portalId}`);
      setRegistrations(registrationRes.data || []);
    } catch (error) {
      console.log("registrations error:", error);
    }

    try {
      const userRes = await api.get(`/users/portal/${portalId}`);
      setUsers(userRes.data || []);
    } catch (error) {
      console.log("users error:", error);
    }

    try {
      const organizerRes = await api.get(
        `/users/organizers/portal/${portalId}`
      );
      setOrganizers(organizerRes.data || []);
    } catch (error) {
      console.log("organizers error:", error);
    }
  }

  fetchDashboardData();
}, []);


    const stats = [
      {
        title: "Total Events",
        value: events.length,
        icon: <BsCalendarEvent />,
        path: "/admin/events",
      },
      {
        title: "Registrations",
        value: registrations.length,
        icon: <BsTicketPerforated />,
        path: "/admin/attendees",
      },
      {
        title: "Users",
        value: users.length,
        icon: <BsPeople />,
        path: "/admin/teams",
      },
      {
        title: "Organizers",
        value: organizers.length,
        icon: <BsPersonPlus />,
        path: "/admin/organizers",
      },
    ];

    return (
      <AdminLayout>
        <div className="admin-dashboard-heading mb-4">
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Portal Admin Dashboard
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "18px" }}>
            Manage events, organizers, attendees and reports from one workspace.
          </p>
        </div>

        <div className="admin-dashboard-grid row g-4">
          {stats.map((item) => (
            <div className="col-md-3" key={item.title}>
              <Link to={item.path} className="text-decoration-none text-dark">
                <div className="admin-bento-card">
                  <div className="admin-bento-icon">{item.icon}</div>
                  <p className="admin-bento-label">{item.title}</p>
                  <h2 className="admin-bento-value">{item.value}</h2>
                </div>
              </Link>
            </div>
          ))}

          <div className="col-md-8">
            <div className="admin-bento-card admin-bento-large">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="admin-section-title" style={{ fontSize: "24px" }}>
                    Quick Actions
                  </h2>
                  <p className="admin-section-text" style={{ fontSize: "16px" }} >
                    Start common portal admin tasks quickly.
                  </p>
                </div>
                <BsGraphUp style={{ fontSize: "28px", color: "#7c3aed" }} />
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <Link to="/create-event" className="admin-action-card">
                    <BsCalendarEvent />
                    <span>Create Event</span>
                    <BsArrowRight />
                  </Link>
                </div>

                <div className="col-md-4">
                  <Link to="/admin/organizers" className="admin-action-card">
                    <BsPersonPlus />
                    <span>Invite Organizer</span>
                    <BsArrowRight />
                  </Link>
                </div>

                <div className="col-md-4">
                  <Link to="/admin/reports" className="admin-action-card">
                    <BsGraphUp />
                    <span>View Reports</span>
                    <BsArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="admin-bento-card admin-bento-large">
              <h2 className="admin-section-title" style={{ fontSize: "24px" }}>
                Portal Summary
              </h2>
              <p className="admin-section-text" style={{ fontSize: "16px" }} >
                Current logged-in portal details.
              </p>

              <div className="mt-3">
                <p className="mb-2" style={{ fontSize: "14px" }}>
                  <strong>Portal Code:</strong>{" "}
                  {localStorage.getItem("portalCode") || "Not available"}
                </p>
                <p className="mb-2" style={{ fontSize: "14px" }}>
                  <strong>Role:</strong>{" "}
                  {localStorage.getItem("role") || "PORTAL_ADMIN"}
                </p>
                <p className="mb-0" style={{ fontSize: "14px" }}>
                  <strong>Email:</strong>{" "}
                  {localStorage.getItem("email") || "admin"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  export default AdminDashboard;
