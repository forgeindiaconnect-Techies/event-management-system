import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import { getDefaultBanner } from "../../utils/bannerUtils";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsGeoAlt,
  BsSearch,
  BsArrowClockwise,
} from "react-icons/bs";

function VolunteerEvents() {
  const [assignments, setAssignments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [search, assignments]);

  const loadEvents = async () => {
    const volunteerId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("VOLUNTEER", `/volunteer-assignments/volunteer/${volunteerId}`);
      setAssignments(assigned);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load assigned events.");
    }
  };

  const filterEvents = () => {
    const data = assignments.filter((assignment) => {
      const eventName =
        assignment.event?.eventName?.toLowerCase() || "";

      const venue =
        assignment.event?.venue?.toLowerCase() || "";

      return (
        eventName.includes(search.toLowerCase()) ||
        venue.includes(search.toLowerCase())
      );
    });

    setFiltered(data);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString();
  };

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Assigned Events
          </h1>

          <p className="text-muted mb-0">
            View all events assigned to you.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={loadEvents}
        >
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && (
        <div className="alert alert-info">{message}</div>
      )}

      <div className="admin-bento-card mb-4">
        <div
          className="d-flex align-items-center border rounded px-3"
          style={{
            height: "45px",
            maxWidth: "400px",
          }}
        >
          <BsSearch className="me-2 text-primary" />

          <input
            className="form-control border-0 shadow-none"
            placeholder="Search event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-4">
        {filtered.length === 0 ? (
          <div className="col-12">
            <div className="admin-bento-card text-center py-5">
              <BsCalendarEvent size={60} className="mb-3 text-primary" />
              <h4>No Assigned Events</h4>
              <p className="text-muted mb-0">
                Events assigned by the organizer will appear here.
              </p>
            </div>
          </div>
        ) : (
          filtered.map((assignment) => (
            <div
              className="col-lg-4 col-md-6"
              key={assignment.id}
            >
              <div className="admin-bento-card h-100">

                <img
                  src={assignment.event?.bannerUrl || getDefaultBanner(assignment.event?.eventType)}
                  alt={assignment.event?.eventName || "Event"}
                  style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "14px", marginBottom: "16px" }}
                />

                <div className="admin-bento-icon mb-3">
                  <BsCalendarEvent />
                </div>

                <h4 className="fw-bold">
                  {assignment.event?.eventName}
                </h4>

                <p className="text-muted">
                  <BsGeoAlt className="me-2" />
                  {assignment.event?.venue || "Venue not specified"}
                </p>

                <hr />

                <p>
                  <strong>Duty:</strong>{" "}
                  {assignment.duty || "General Support"}
                </p>

                <p>
                  <strong>Start:</strong>{" "}
                  {formatDate(
                    assignment.event?.startDateTime
                  )}
                </p>

                <p>
                  <strong>End:</strong>{" "}
                  {formatDate(
                    assignment.event?.endDateTime
                  )}
                </p>

                <p>
                  <strong>Assigned On:</strong>{" "}
                  {formatDate(
                    assignment.assignedAt
                  )}
                </p>

                <span
                  className={`badge ${
                    assignment.active
                      ? "bg-success"
                      : "bg-secondary"
                  }`}
                >
                  {assignment.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </RoleLayout>
  );
}

export default VolunteerEvents;


