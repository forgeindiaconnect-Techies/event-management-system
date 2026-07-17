import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import { getDefaultBanner } from "../../utils/bannerUtils";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsSearch,
  BsArrowClockwise,
  BsGeoAlt,
} from "react-icons/bs";

function CoordinatorEvents() {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("COORDINATOR", `/coordinator-assignments/coordinator/${coordinatorId}`);
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

    return (
      eventName.includes(search.toLowerCase()) ||
      venue.includes(search.toLowerCase())
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
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Assigned Events
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View events assigned to you for coordination.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadEvents}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="admin-bento-card mb-4">
        <div
          className="d-flex align-items-center border rounded px-3"
          style={{ width: "360px", height: "44px", background: "#fff" }}
        >
          <BsSearch className="me-2 text-primary" />
          <input
            className="form-control border-0 shadow-none p-0"
            placeholder="Search event or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-bento-card">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsCalendarEvent size={55} className="mb-3" />
            <p>No assigned events found.</p>
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

                  <h4 className="fw-bold mb-2">
                    {assignment.event?.eventName}
                  </h4>

                  <p className="text-muted mb-2">
                    <BsGeoAlt className="me-2" />
                    {assignment.event?.venue || "Venue not added"}
                  </p>

                  <p className="mb-2">
                    <strong>Start:</strong>{" "}
                    {formatDate(assignment.event?.startDateTime)}
                  </p>

                  <p className="mb-3">
                    <strong>Status:</strong>{" "}
                    {assignment.event?.status || "N/A"}
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
    </RoleLayout>
  );
}

export default CoordinatorEvents;
