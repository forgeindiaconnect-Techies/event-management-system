import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import "../../styles/Admin.css";
import {
  BsMic,
  BsCalendarEvent,
  BsCheckCircle,
  BsClock,
} from "react-icons/bs";

function SpeakerDashboard() {
  const firstName = localStorage.getItem("firstName") || "Speaker";
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
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

      setAssignments(mergeSpeakerSessions(eventAssignments, speakerAssignments));
    } catch (error) {
      console.log(error);
    }
  };

  const activeAssignments = assignments.filter((item) => item.active);

  const cards = [
    {
      title: "Assigned Events",
      value: activeAssignments.length,
      icon: <BsCalendarEvent />,
    },
    {
      title: "Sessions",
      value: activeAssignments.length,
      icon: <BsMic />,
    },
    {
      title: "Upcoming",
      value: activeAssignments.length,
      icon: <BsClock />,
    },
    {
      title: "Completed",
      value: 0,
      icon: <BsCheckCircle />,
    },
  ];

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN");
  };

  return (
    <RoleLayout>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "28px" }}>
          Speaker Dashboard
        </h1>

        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Welcome back, <strong>{firstName}</strong>. View your speaking
          sessions and assigned events.
        </p>
      </div>

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

      <div className="admin-bento-card">
        <h4 className="fw-bold mb-3">My Sessions</h4>

        {activeAssignments.length === 0 ? (
          <p className="text-muted mb-0">No speaker sessions assigned.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Session</th>
                  <th>Topic</th>
                  <th>Start</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {activeAssignments.map((assignment, index) => (
                  <tr key={assignment.id}>
                    <td>{index + 1}</td>
                    <td>{assignment.event?.eventName || assignment.eventName || "N/A"}</td>
                    <td>{assignment.sessionTitle || "Session not added"}</td>
                    <td>{assignment.topic || assignment.sessionDescription || "Topic not added"}</td>
                    <td>{formatSessionDate(assignment, formatDate)}</td>
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

function formatSessionDate(assignment, formatDate) {
  if (assignment.sessionDate || assignment.sessionTime) {
    return [assignment.sessionDate, assignment.sessionTime].filter(Boolean).join(", ");
  }

  return formatDate(assignment.event?.startDateTime);
}

export default SpeakerDashboard;
