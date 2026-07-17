import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsClock,
  BsGeoAlt,
  BsArrowClockwise,
} from "react-icons/bs";

function ChiefGuestSchedule() {
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const chiefGuestId = localStorage.getItem("userId");

    try {
      const res = await api.get(
        `/chief-guest-assignments/chief-guest/${chiefGuestId}`
      );

      const sorted = (res.data || []).sort(
        (a, b) =>
          new Date(a.event?.startDateTime) -
          new Date(b.event?.startDateTime)
      );

      setAssignments(sorted);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load schedule.");
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
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Event Schedule
          </h1>
          <p className="text-muted mb-0">
            View your assigned chief guest event schedule.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadSchedule}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {assignments.length === 0 ? (
        <div className="admin-bento-card text-center py-5">
          <BsCalendarEvent size={60} className="mb-3 text-primary" />
          <h4>No Schedule Available</h4>
          <p className="text-muted mb-0">
            Events assigned by the organizer will appear here.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {assignments.map((assignment) => (
            <div className="col-lg-6" key={assignment.id}>
              <div className="admin-bento-card h-100">
                <h4 className="fw-bold mb-2">
                  {assignment.event?.eventName || "Event"}
                </h4>

                <p className="text-primary fw-semibold mb-3">
                  {assignment.roleDescription || "Chief Guest"}
                </p>

                <p>
                  <BsClock className="me-2" />
                  {formatDate(assignment.event?.startDateTime)}
                </p>

                <p>
                  <BsGeoAlt className="me-2" />
                  {assignment.event?.venue || "Venue not specified"}
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
    </RoleLayout>
  );
}

export default ChiefGuestSchedule;
