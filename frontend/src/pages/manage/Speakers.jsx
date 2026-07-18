import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaEnvelope,
  FaMicrophone,
  FaPaperPlane,
  FaPlus,
  FaUserTie
} from "react-icons/fa";
import api from "../../api/axiosConfig";

const emptyInvite = {
  email: "",
  speakerName: "",
  title: "",
  organization: "",
  sessionTitle: "",
  sessionDescription: "",
  sessionDate: "",
  sessionTime: ""
};

function Speakers() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [speakerAssignments, setSpeakerAssignments] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyInvite);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [eventRes, speakerRes, eventAssignmentRes, invitationRes] = await Promise.allSettled([
        api.get(`/events/${id}`),
        api.get(`/speaker-assignments/event/${id}`),
        api.get(`/event-assignments/event/${id}`),
        api.get(`/role-invitations/event/${id}/role/SPEAKER`)
      ]);

      if (eventRes.status === "fulfilled") setEvent(eventRes.value.data);
      const oldSpeakerAssignments =
        speakerRes.status === "fulfilled" ? speakerRes.value.data || [] : [];
      const eventSpeakerAssignments =
        eventAssignmentRes.status === "fulfilled"
          ? (eventAssignmentRes.value.data || [])
              .filter((assignment) => normalizeRole(assignment.roleName) === "SPEAKER")
              .map(mapEventAssignmentToSpeaker)
          : [];

      setSpeakerAssignments(
        mergeSpeakerAssignments(oldSpeakerAssignments, eventSpeakerAssignments)
      );
      setSentInvites(
        invitationRes.status === "fulfilled" ? invitationRes.value.data || [] : []
      );
    } catch (error) {
      setMessage("Unable to load speaker details.");
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const inviteSpeaker = async (e) => {
    e.preventDefault();

    if (!form.email || !form.sessionTitle) {
      setMessage("Speaker email and session title are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/role-invitations/invite", {
        email: form.email,
        roleName: "SPEAKER",
        portalId: Number(localStorage.getItem("portalId") || event?.portal?.id),
        invitedById: Number(localStorage.getItem("userId") || event?.organizer?.id),
        eventId: Number(id),
        eventName: event?.eventName,
        eventDescription: event?.description,
        eventVenue: event?.venue || event?.meetingLink,
        eventStartDateTime: event?.startDateTime,
        speakerName: form.speakerName,
        speakerTitle: form.title,
        speakerOrganization: form.organization,
        sessionTitle: form.sessionTitle,
        sessionDescription: form.sessionDescription,
        sessionDate: form.sessionDate,
        sessionTime: form.sessionTime
      });

      setSentInvites((current) => [response.data, ...current]);
      setForm(emptyInvite);
      setShowForm(false);
      setMessage("Speaker invitation sent successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send speaker invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Speakers</h1>
          <p className="text-muted mb-0">
            Invite speakers by email and include event, role, description and session details.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Invite Speaker
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<FaMicrophone />} label="Assigned Speakers" value={speakerAssignments.length} />
        <SummaryCard icon={<FaEnvelope />} label="Sent Invites" value={sentInvites.length} />
        <SummaryCard icon={<FaUserTie />} label="Role" value="Speaker" />
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 fw-semibold mb-1">Invite Speaker</h2>
            <p className="text-muted mb-0 small">
              This invitation uses the same role invitation API as Invite Staff.
            </p>
          </div>

          <form className="card-body" onSubmit={inviteSpeaker}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Speaker Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="speaker@example.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Speaker Name</label>
                <input
                  className="form-control"
                  value={form.speakerName}
                  onChange={(e) => updateField("speakerName", e.target.value)}
                  placeholder="Speaker name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Title / Designation</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Founder, Professor, CTO"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Organization</label>
                <input
                  className="form-control"
                  value={form.organization}
                  onChange={(e) => updateField("organization", e.target.value)}
                  placeholder="Company or institution"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Session Title *</label>
                <input
                  className="form-control"
                  value={form.sessionTitle}
                  onChange={(e) => updateField("sessionTitle", e.target.value)}
                  placeholder="Session title"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Session Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.sessionDate}
                  onChange={(e) => updateField("sessionDate", e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Session Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.sessionTime}
                  onChange={(e) => updateField("sessionTime", e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Role & Session Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.sessionDescription}
                  onChange={(e) => updateField("sessionDescription", e.target.value)}
                  placeholder="Describe what the speaker is invited to present or handle."
                />
              </div>
            </div>

            <div className="card bg-light border-0 mt-4">
              <div className="card-body">
                <h3 className="h6 fw-semibold">Email Preview</h3>
                <p className="text-muted small mb-2">
                  The speaker receives event name, event details, speaker role and session
                  information in the invitation email.
                </p>
                <div className="small">
                  <strong>Event:</strong> {event?.eventName || "Current event"}
                  <br />
                  <strong>Role:</strong> SPEAKER
                  <br />
                  <strong>Session:</strong> {form.sessionTitle || "Session title"}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={loading}>
                <FaPaperPlane /> {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-1">Assigned Speakers</h2>
              <p className="text-muted mb-0 small">Speakers already assigned to this event.</p>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Session</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {speakerAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        {getSpeakerName(assignment)}
                      </td>
                      <td>{getSpeakerEmail(assignment)}</td>
                      <td>{assignment.sessionTitle || assignment.topic || "N/A"}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {assignment.active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {speakerAssignments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No speakers assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-1">Speaker Invitations</h2>
              <p className="text-muted mb-0 small">Invitations sent from this page.</p>
            </div>

            <div className="card-body">
              {sentInvites.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FaEnvelope size={42} className="opacity-50 mb-3" />
                  <p className="mb-0">No speaker invitations sent yet.</p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {sentInvites.map((invite) => (
                    <div className="border rounded-3 p-3" key={invite.id}>
                      <div className="d-flex justify-content-between gap-2">
                        <strong>{invite.email}</strong>
                        <span className="badge bg-warning text-dark">{invite.status}</span>
                      </div>
                      <div className="text-muted small mt-1">{invite.sessionTitle}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{speakerStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-md-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="speaker-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapEventAssignmentToSpeaker(assignment) {
  return {
    id: `event-assignment-${assignment.id}`,
    source: "EVENT_ASSIGNMENT",
    active: assignment.active,
    sessionTitle: assignment.eventName,
    topic: assignment.roleName,
    speaker: {
      firstName: assignment.userName,
      lastName: "",
      email: assignment.email,
    },
    userName: assignment.userName,
    email: assignment.email,
  };
}

function mergeSpeakerAssignments(oldAssignments, eventAssignments) {
  const seen = new Set();

  return [...oldAssignments, ...eventAssignments].filter((assignment) => {
    const email = getSpeakerEmail(assignment).toLowerCase();
    const key = email || String(assignment.id);

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSpeakerName(assignment) {
  const firstName = assignment.speaker?.firstName || assignment.userName || "";
  const lastName = assignment.speaker?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || getSpeakerEmail(assignment) || "Speaker";
}

function getSpeakerEmail(assignment) {
  return assignment.speaker?.email || assignment.email || "N/A";
}

function normalizeRole(role) {
  const value = String(role || "").trim();
  return value === "Staff" ? "STAFF" : value.toUpperCase();
}

const speakerStyles = `
  .speaker-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }
`;

export default Speakers;
