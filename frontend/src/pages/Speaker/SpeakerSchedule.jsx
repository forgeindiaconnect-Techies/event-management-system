import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import "../../styles/Admin.css";
import {
  BsCalendarEvent,
  BsClock,
  BsGeoAlt,
  BsArrowClockwise,
} from "react-icons/bs";

function SpeakerSchedule() {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const speakerId = localStorage.getItem("userId");

    try {
      const res = await api.get(
        `/speaker-assignments/speaker/${speakerId}`
      );

      const sorted = (res.data || []).sort(
        (a, b) =>
          new Date(a.event?.startDateTime) -
          new Date(b.event?.startDateTime)
      );

      setSessions(sorted);
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
          <h1
            className="fw-bold mb-1"
            style={{ fontSize: "24px" }}
          >
            My Schedule
          </h1>

          <p className="text-muted mb-0">
            View your upcoming speaking schedule.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={loadSchedule}
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

      {sessions.length === 0 ? (
        <div className="admin-bento-card text-center py-5">
          <BsCalendarEvent
            size={60}
            className="mb-3 text-primary"
          />

          <h4>No Schedule Available</h4>

          <p className="text-muted mb-0">
            Your assigned sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {sessions.map((session) => (
            <div
              className="col-lg-6"
              key={session.id}
            >
              <div className="admin-bento-card h-100">

                <h4 className="fw-bold">
                  {session.sessionTitle || "Session"}
                </h4>

                <p className="text-primary fw-semibold">
                  {session.event?.eventName}
                </p>

                <hr />

                <p>
                  <BsClock className="me-2" />
                  {formatDate(session.event?.startDateTime)}
                </p>

                <p>
                  <BsGeoAlt className="me-2" />
                  {session.event?.venue || "Venue not specified"}
                </p>

                <p>
                  <strong>Topic:</strong>{" "}
                  {session.topic || "Not specified"}
                </p>

                <span
                  className={`badge ${
                    session.active
                      ? "bg-success"
                      : "bg-secondary"
                  }`}
                >
                  {session.active
                    ? "Upcoming"
                    : "Completed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </RoleLayout>
  );
}

export default SpeakerSchedule;
