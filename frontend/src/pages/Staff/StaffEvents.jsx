import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleLayout from "../../layouts/RoleLayout";
import "../../styles/Admin.css";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import { getDefaultBanner } from "../../utils/bannerUtils";
import {
  BsCalendarEvent,
  BsSearch,
  BsArrowClockwise,
  BsGeoAlt,
  BsTicketPerforated,
  BsCheckCircle,
} from "react-icons/bs";

function StaffEvents() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAssignedEvents();
  }, []);

  const loadAssignedEvents = async () => {
    const staffId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("STAFF", `/staff-assignments/staff/${staffId}`);
      setAssignments(assigned);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load assigned events.");
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const eventName = assignment.event?.eventName?.toLowerCase() || "";
    const venue = assignment.event?.venue?.toLowerCase() || "";
    const duty = assignment.duty?.toLowerCase() || "";

    return (
      eventName.includes(search.toLowerCase()) ||
      venue.includes(search.toLowerCase()) ||
      duty.includes(search.toLowerCase())
    );
  });

  const formatDate = (dateTime) => {
    if (!dateTime) return "Not added";

    return new Date(dateTime).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <RoleLayout
      mainClassName="staff-dashboard-main"
      sidebarClassName="staff-dashboard-sidebar"
    >
      <div className="staff-dashboard-page">
      <div className="d-flex justify-content-between align-items-start mb-4 staff-page-header">
        <div>
          <h1 className="fw-bold mb-1 staff-dashboard-title">
            Assigned Events
          </h1>
          <p className="text-muted mb-0 staff-dashboard-subtitle">
            View events assigned to you by the organizer.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={loadAssignedEvents}
          style={{ borderRadius: "10px", fontSize: "15px" }}
        >
          <BsArrowClockwise /> Refresh
        </button>
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

      <div className="admin-bento-card mb-4">
        <div
          className="d-flex align-items-center border rounded px-3 organizer-search staff-search-box"
          style={{ width: "360px", height: "44px", background: "#fff" }}
        >
          <BsSearch className="me-2 text-primary" />
          <input
            className="form-control border-0 shadow-none p-0"
            placeholder="Search event, venue or duty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "15px" }}
          />
        </div>
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Event List
        </h2>

        {filteredAssignments.length === 0 ? (
          <div className="text-center py-5">
            <BsCalendarEvent size={55} className="mb-3 text-muted" />
            <p className="text-muted mb-0">No assigned events found.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredAssignments.map((assignment) => (
              <div className="col-md-4" key={assignment.id}>
                <div className="admin-bento-card h-100">
                  <img
                    src={assignment.event?.bannerUrl || getDefaultBanner(assignment.event?.eventType)}
                    alt={assignment.event?.eventName || "Event"}
                    style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "14px", marginBottom: "16px" }}
                  />
                  <div className="admin-bento-icon mb-3">
                    <BsCalendarEvent />
                  </div>

                  <h4 className="fw-bold mb-2" style={{ fontSize: "20px" }}>
                    {assignment.event?.eventName}
                  </h4>

                  <p className="text-muted mb-2" style={{ fontSize: "15px" }}>
                    <BsGeoAlt className="me-2" />
                    {assignment.event?.venue || "Venue not added"}
                  </p>

                  <p className="mb-2" style={{ fontSize: "15px" }}>
                    <strong>Start:</strong>{" "}
                    {formatDate(assignment.event?.startDateTime)}
                  </p>

                  <p className="mb-2" style={{ fontSize: "15px" }}>
                    <strong>Duty:</strong> {assignment.duty || "General duty"}
                  </p>

                  <span
                    className={`badge ${
                      assignment.active ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {assignment.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </RoleLayout>
  );
}

export default StaffEvents;



