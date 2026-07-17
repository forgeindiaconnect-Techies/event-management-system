import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsGeoAlt,
  BsClock,
  BsPeople,
  BsArrowClockwise,
} from "react-icons/bs";

function ChiefGuestDetails() {
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const chiefGuestId = localStorage.getItem("userId");

    try {
      const assigned = await loadRoleAssignments("CHIEF_GUEST", `/chief-guest-assignments/chief-guest/${chiefGuestId}`);
      setAssignments(assigned);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load event details.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1
            className="fw-bold mb-1"
            style={{ fontSize: "24px" }}
          >
            Event Details
          </h1>

          <p className="text-muted mb-0">
            View complete information about your assigned events.
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
        <div className="alert alert-info">
          {message}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="admin-bento-card text-center py-5">
          <BsCalendarEvent
            size={60}
            className="mb-3 text-primary"
          />

          <h4>No Events Assigned</h4>

          <p className="text-muted mb-0">
            Assigned event information will appear here.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {assignments.map((assignment) => (
            <div
              className="col-lg-6"
              key={assignment.id}
            >
              <div className="admin-bento-card h-100">

                <div className="admin-bento-icon mb-3">
                  <BsCalendarEvent />
                </div>

                <h3 className="fw-bold">
                  {assignment.event?.eventName}
                </h3>

                <p className="text-primary fw-semibold">
                  {assignment.roleDescription || "Chief Guest"}
                </p>

                <hr />

                <p>
                  <BsClock className="me-2" />
                  <strong>Start:</strong>{" "}
                  {formatDate(
                    assignment.event?.startDateTime
                  )}
                </p>

                <p>
                  <BsClock className="me-2" />
                  <strong>End:</strong>{" "}
                  {formatDate(
                    assignment.event?.endDateTime
                  )}
                </p>

                <p>
                  <BsGeoAlt className="me-2" />
                  <strong>Venue:</strong>{" "}
                  {assignment.event?.venue || "N/A"}
                </p>

                <p>
                  <BsPeople className="me-2" />
                  <strong>Organizer:</strong>{" "}
                  {assignment.event?.organizer?.firstName}{" "}
                  {assignment.event?.organizer?.lastName}
                </p>

                <p>
                  <strong>Description</strong>
                </p>

                <div
                  className="border rounded p-3 bg-light"
                  style={{ minHeight: "90px" }}
                >
                  {assignment.event?.description ||
                    "No description available."}
                </div>

                <div className="mt-3">
                  <span
                    className={`badge ${
                      assignment.active
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  >
                    {assignment.active
                      ? "Assigned"
                      : "Inactive"}
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </RoleLayout>
  );
}

export default ChiefGuestDetails;
