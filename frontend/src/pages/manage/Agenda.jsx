import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import {
  FaCalendarAlt,
  FaChair,
  FaClock,
  FaCog,
  FaEdit,
  FaMapMarkerAlt,
  FaMicrophone,
  FaPlus,
  FaSave,
  FaTrash,
  FaUsers
} from "react-icons/fa";

const emptySession = {
  title: "",
  speaker: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  type: "",
  capacity: "",
  description: "",
  period: "morning"
};

function Agenda() {
  const { id } = useParams();
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySession);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalizeSession = useCallback((session) => ({
    ...session,
    date: session.date || session.sessionDate || "",
    sessionDate: session.sessionDate || session.date || "",
    capacity: session.capacity ?? "",
    period: session.period || getPeriod(session.startTime)
  }), []);

  const loadSessions = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.get(`/events/${id}/sessions`);
      setSessions((response.data || []).map(normalizeSession));
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load saved sessions.");
    } finally {
      setLoading(false);
    }
  }, [id, normalizeSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const groups = useMemo(
    () => [
      {
        key: "morning",
        title: "Morning",
        time: "Before 12:00 PM",
        sessions: sessions.filter((session) => session.period === "morning")
      },
      {
        key: "noon",
        title: "Noon",
        time: "12:00 PM - 04:00 PM",
        sessions: sessions.filter((session) => session.period === "noon")
      },
      {
        key: "evening",
        title: "Evening",
        time: "After 04:00 PM",
        sessions: sessions.filter((session) => session.period === "evening")
      }
    ],
    [sessions]
  );

  const totalCapacity = sessions.reduce(
    (total, session) => total + (Number(session.capacity) || 0),
    0
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "startTime" ? { period: getPeriod(value) } : {})
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptySession);
    setShowForm(true);
    setMessage("");
  };

  const editSession = (session) => {
    setEditingId(session.id);
    setForm(normalizeSession(session));
    setShowForm(true);
    setMessage("");
  };

  const deleteSession = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setMessage("Session removed.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to remove session.");
    }
  };

  const saveSession = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.date || !form.startTime || !form.endTime) {
      setMessage("Session title, date, start time and end time are required.");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      speaker: form.speaker,
      sessionDate: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue,
      type: form.type,
      capacity: Number(form.capacity) || 0,
      period: getPeriod(form.startTime)
    };

    try {
      setSaving(true);

      const response = editingId
        ? await api.put(`/sessions/${editingId}`, payload)
        : await api.post(`/events/${id}/sessions`, payload);

      const savedSession = normalizeSession(response.data);

      setSessions((current) =>
        editingId
          ? current.map((session) => (session.id === editingId ? savedSession : session))
          : [...current, savedSession]
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptySession);
      setMessage(editingId ? "Session updated." : "Session added.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to save session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Agenda</h1>
          <p className="text-muted mb-0">
            Add sessions and organize them by morning, noon and evening.
          </p>
        </div>

        <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={openAddForm}>
          <FaPlus /> Add Session
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 fw-semibold mb-1">{editingId ? "Edit Session" : "Add Session"}</h2>
            <p className="text-muted mb-0 small">
              Enter the session details. The section is automatically selected from start time.
            </p>
          </div>

          <form className="card-body" onSubmit={saveSession}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Session Title *</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Example: Opening Ceremony"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Short session description"
                rows={3}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Speaker / Host</label>
                <input
                  className="form-control"
                  value={form.speaker}
                  onChange={(e) => updateField("speaker", e.target.value)}
                  placeholder="Speaker name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Session Type</label>
                <input
                  className="form-control"
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  placeholder="Keynote, Workshop, Break"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Start Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">End Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Venue / Hall</label>
                <input
                  className="form-control"
                  value={form.venue}
                  onChange={(e) => updateField("venue", e.target.value)}
                  placeholder="Main Hall"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Capacity</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", e.target.value)}
                  placeholder="Seats"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Time Section</label>
                <select
                  className="form-select"
                  value={form.period}
                  onChange={(e) => updateField("period", e.target.value)}
                >
                  <option value="morning">Morning</option>
                  <option value="noon">Noon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={saving}>
                <FaSave /> {saving ? "Saving..." : editingId ? "Update Session" : "Save Session"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<FaCalendarAlt />} label="Total Sessions" value={sessions.length} />
        <SummaryCard icon={<FaClock />} label="Event Blocks" value={groups.length} />
        <SummaryCard
          icon={<FaMicrophone />}
          label="Speakers"
          value={new Set(sessions.map((session) => session.speaker).filter(Boolean)).size}
        />
        <SummaryCard icon={<FaUsers />} label="Total Capacity" value={totalCapacity} />
      </div>

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-1">Session Information</h2>
              <p className="text-muted mb-0 small">
                Saved sessions appear under the correct time section.
              </p>
            </div>

            {loading ? (
              <div className="card-body text-center py-5 text-muted">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="card-body text-center py-5">
                <FaCalendarAlt className="text-secondary opacity-50 mb-3" size={52} />
                <h3 className="h5 fw-semibold">No sessions added yet</h3>
                <p className="text-muted">Click Add Session to create the first agenda item.</p>
                <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={openAddForm}>
                  <FaPlus /> Add Session
                </button>
              </div>
            ) : (
              <div className="card-body">
                {groups.map((group) => (
                  <section className="agenda-period" key={group.key}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h3 className="h5 fw-semibold mb-1">{group.title}</h3>
                        <div className="text-muted small">{group.time}</div>
                      </div>
                      <span className="badge bg-primary-subtle text-primary">
                        {group.sessions.length} sessions
                      </span>
                    </div>

                    {group.sessions.length === 0 ? (
                      <div className="border border-dashed rounded-3 p-3 text-muted small mb-3">
                        No {group.title.toLowerCase()} sessions.
                      </div>
                    ) : (
                      <div className="d-grid gap-3 mb-3">
                        {group.sessions.map((session) => (
                          <article className="card bg-light border-0" key={session.id}>
                            <div className="card-body">
                              <div className="row g-3">
                                <div className="col-md-2 border-end">
                                  <div className="fw-semibold">{formatTime(session.startTime)}</div>
                                  <div className="text-muted small">{formatTime(session.endTime)}</div>
                                </div>

                                <div className="col-md-8">
                                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                                    <div>
                                      <h4 className="h6 fw-semibold mb-1">{session.title}</h4>
                                      <div className="text-muted small">{session.type || "Session"}</div>
                                    </div>
                                    <span className="badge bg-white text-dark border">{session.date}</span>
                                  </div>

                                  {session.description && (
                                    <p className="text-muted small mb-2">{session.description}</p>
                                  )}

                                  <div className="d-flex flex-wrap gap-3 text-muted small">
                                    <span><FaMicrophone className="text-primary me-1" /> {session.speaker || "Speaker not added"}</span>
                                    <span><FaMapMarkerAlt className="text-primary me-1" /> {session.venue || "Venue not added"}</span>
                                    <span><FaChair className="text-primary me-1" /> {session.capacity || 0} seats</span>
                                  </div>
                                </div>

                                <div className="col-md-2 d-flex justify-content-md-end gap-2">
                                  <button type="button" className="btn btn-sm btn-light border" onClick={() => editSession(session)}>
                                    <FaEdit />
                                  </button>
                                  <button type="button" className="btn btn-sm btn-light border" onClick={() => deleteSession(session.id)}>
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card border-0 shadow-sm agenda-settings">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaCog className="text-primary" />
                <h2 className="h5 fw-semibold mb-0">Session Settings</h2>
              </div>

              <SettingRow label="Session ordering" value="Time based" />
              <SettingRow label="Display format" value="Morning / Noon / Evening" />
              <SettingRow label="Capacity tracking" value="Editable" />
              <SettingRow label="Speaker assignment" value="Optional" />
              <SettingRow label="Venue assignment" value="Optional" />

              <div className="bg-light border rounded-3 p-3 mt-3">
                <div className="fw-semibold mb-1">Time split</div>
                <p className="text-muted small mb-0">
                  Start time before 12:00 PM is Morning, 12:00 PM to 3:59 PM is Noon,
                  and 4:00 PM onwards is Evening.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{agendaStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="agenda-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-4 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between gap-3 border-bottom py-2">
      <span className="text-muted small">{label}</span>
      <strong className="small text-end">{value}</strong>
    </div>
  );
}

function getPeriod(time) {
  if (!time) return "morning";

  const hour = Number(time.split(":")[0]);
  if (hour < 12) return "morning";
  if (hour < 16) return "noon";
  return "evening";
}

function formatTime(time) {
  if (!time) return "Not set";

  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);
  const displayHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";

  return `${displayHour}:${minute} ${suffix}`;
}

const agendaStyles = `
  .agenda-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .agenda-period {
    border-left: 2px solid #dbe3ff;
    margin-left: 10px;
    padding: 0 0 18px 22px;
    position: relative;
  }

  .agenda-period::before {
    background: #4f46e5;
    border: 4px solid #eef2ff;
    border-radius: 50%;
    content: "";
    height: 16px;
    left: -9px;
    position: absolute;
    top: 4px;
    width: 16px;
  }

  .agenda-period:last-child {
    padding-bottom: 0;
  }

  .agenda-settings {
    position: sticky;
    top: 82px;
  }

  .border-dashed {
    border-style: dashed !important;
  }

  @media (max-width: 1200px) {
    .agenda-settings {
      position: static;
    }
  }

  @media (max-width: 768px) {
    .agenda-period {
      margin-left: 4px;
      padding-left: 18px;
    }
  }
`;

export default Agenda;
