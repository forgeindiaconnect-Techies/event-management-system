import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import "../../styles/Admin.css";
import {
  BsMic,
  BsSearch,
  BsArrowClockwise,
  BsCalendarEvent,
  BsGeoAlt,
} from "react-icons/bs";

function SpeakerSessions() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const speakerId = localStorage.getItem("userId");

    try {
      const [eventAssignmentRes, speakerAssignmentRes] = await Promise.allSettled([
        api.get(`/event-assignments/user/${speakerId}`),
        api.get(`/speaker-assignments/speaker/${speakerId}`),
      ]);

      const eventAssignments =
        eventAssignmentRes.status === "fulfilled"
          ? (eventAssignmentRes.value.data || [])
              .filter((assignment) => normalizeRole(assignment.roleName) === "SPEAKER")
              .map(mapEventAssignmentToSpeakerSession)
          : [];

      const speakerAssignments =
        speakerAssignmentRes.status === "fulfilled"
          ? speakerAssignmentRes.value.data || []
          : [];

      setSessions(mergeSpeakerSessions(eventAssignments, speakerAssignments));
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load speaker sessions.");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const eventName = session.event?.eventName?.toLowerCase() || "";
    const sessionTitle = session.sessionTitle?.toLowerCase() || "";
    const topic = (session.topic || session.sessionDescription || "").toLowerCase();

    return (
      eventName.includes(search.toLowerCase()) ||
      sessionTitle.includes(search.toLowerCase()) ||
      topic.includes(search.toLowerCase())
    );
  });

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN");
  };

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            My Sessions
          </h1>
          <p className="text-muted mb-0">
            View your assigned speaking sessions and event details.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadSessions}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="admin-bento-card mb-4">
        <div
          className="d-flex align-items-center border rounded px-3"
          style={{ height: "44px", background: "#fff", maxWidth: "420px" }}
        >
          <BsSearch className="me-2 text-primary" />
          <input
            className="form-control border-0 shadow-none p-0"
            placeholder="Search session, topic or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="admin-bento-card text-center py-5 text-muted">
          <BsMic size={60} className="mb-3" />
          <h4>No sessions assigned</h4>
          <p className="mb-0">
            Sessions assigned by the organizer will appear here.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredSessions.map((session) => (
            <div className="col-lg-4 col-md-6" key={session.id}>
              <div className="admin-bento-card h-100">
                <div className="admin-bento-icon mb-3">
                  <BsMic />
                </div>

                <h4 className="fw-bold mb-2">
                  {session.sessionTitle || "Session not added"}
                </h4>

                <p className="text-muted mb-2">
                  <BsCalendarEvent className="me-2" />
                  {session.event?.eventName || "Event not available"}
                </p>

                <p className="text-muted mb-2">
                  <BsGeoAlt className="me-2" />
                  {session.event?.venue || "Venue not added"}
                </p>

                <hr />

                <p>
                  <strong>Topic:</strong> {session.topic || session.sessionDescription || "Topic not added"}
                </p>

                <p>
                  <strong>Session Time:</strong>{" "}
                  {formatSessionDate(session, formatDate)}
                </p>

                <p>
                  <strong>End:</strong>{" "}
                  {formatDate(session.event?.endDateTime)}
                </p>

                <span
                  className={`badge ${
                    session.active ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {session.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </RoleLayout>
  );
}

function mapEventAssignmentToSpeakerSession(assignment) {
  return {
    id: `event-assignment-${assignment.id}`,
    active: assignment.active,
    eventName: assignment.eventName,
    sessionTitle: assignment.sessionTitle || assignment.eventName || "Session not added",
    sessionDescription: assignment.sessionDescription,
    sessionDate: assignment.sessionDate,
    sessionTime: assignment.sessionTime,
    topic: assignment.sessionDescription || assignment.roleName,
    event: {
      id: assignment.eventId,
      eventName: assignment.eventName,
      venue: assignment.eventVenue,
      startDateTime: assignment.eventStartDateTime,
      endDateTime: assignment.eventEndDateTime,
    },
  };
}

function mergeSpeakerSessions(eventAssignments, speakerAssignments) {
  const seen = new Set();

  return [...eventAssignments, ...speakerAssignments].filter((assignment) => {
    const key = `${assignment.event?.id || assignment.eventId || ""}-${assignment.sessionTitle || assignment.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeRole(role) {
  const value = String(role || "").trim();
  return value === "Staff" ? "STAFF" : value.toUpperCase();
}

function formatSessionDate(session, formatDate) {
  if (session.sessionDate || session.sessionTime) {
    return [session.sessionDate, session.sessionTime].filter(Boolean).join(", ");
  }

  return formatDate(session.event?.startDateTime);
}

export default SpeakerSessions;
