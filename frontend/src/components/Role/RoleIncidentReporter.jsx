import { useEffect, useMemo, useState } from "react";
import { BsExclamationTriangle, BsPlusLg, BsX } from "react-icons/bs";
import api from "../../api/axiosConfig";

const emptyForm = {
  eventId: "",
  title: "",
  category: "Safety",
  severity: "MEDIUM",
  location: "",
  description: "",
  evidenceUrl: "",
};

const categories = ["Safety", "Medical", "Security", "Technical", "Crowd", "Venue", "Equipment", "Other"];

function RoleIncidentReporter({ assignments = [] }) {
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const events = useMemo(() => {
    const unique = new Map();
    assignments.forEach((assignment) => {
      if (assignment.active !== false && assignment.event?.id) {
        unique.set(assignment.event.id, assignment.event);
      }
    });
    return [...unique.values()];
  }, [assignments]);

  const loadReports = async () => {
    if (!events.length) {
      setReports([]);
      return;
    }
    try {
      const responses = await Promise.all(
        events.map((event) => api.get(`/events/${event.id}/operations/incidents/mine`))
      );
      const eventNames = new Map(events.map((event) => [event.id, event.eventName]));
      setReports(
        responses.flatMap((response, index) =>
          (response.data || []).map((report) => ({
            ...report,
            eventName: eventNames.get(events[index].id) || "Event",
          }))
        )
      );
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  useEffect(() => {
    loadReports();
  }, [events.map((event) => event.id).join(",")]);

  const openForm = () => {
    setForm({ ...emptyForm, eventId: events[0]?.id ? String(events[0].id) : "" });
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.eventId) {
      setError("Select an assigned event.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await api.post(`/events/${form.eventId}/operations/incidents`, {
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        status: "OPEN",
        location: form.location,
        evidenceUrl: form.evidenceUrl,
      });
      setShowForm(false);
      setMessage("Incident reported successfully. The event team can now review it.");
      await loadReports();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-bento-card mt-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <BsExclamationTriangle className="text-warning" /> Incident Reports
          </h4>
          <p className="text-muted mb-0">Report an issue from an assigned event and follow its progress.</p>
        </div>
        <button className="btn btn-danger d-flex align-items-center gap-2" onClick={openForm} disabled={!events.length}>
          <BsPlusLg /> Report Incident
        </button>
      </div>

      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      {showForm && (
        <form className="border rounded-3 p-3 mb-4 bg-light" onSubmit={submit}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold mb-0">Report an Incident</h5>
            <button type="button" className="btn btn-sm btn-light" onClick={() => setShowForm(false)}><BsX size={22} /></button>
          </div>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label fw-semibold">Event *</label><select className="form-select" required value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}><option value="">Select event</option>{events.map((item) => <option key={item.id} value={item.id}>{item.eventName}</option>)}</select></div>
            <div className="col-md-6"><label className="form-label fw-semibold">Incident title *</label><input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Category *</label><select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Severity *</label><select className="form-select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Location</label><input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Gate, hall or booth" /></div>
            <div className="col-12"><label className="form-label fw-semibold">Photo or evidence URL</label><input type="url" className="form-control" value={form.evidenceUrl} onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })} placeholder="https://... (optional)" /></div>
            <div className="col-12"><label className="form-label fw-semibold">Description *</label><textarea className="form-control" rows="3" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-danger" disabled={loading}>{loading ? "Submitting..." : "Submit Incident"}</button></div>
        </form>
      )}

      {reports.length === 0 ? <div className="text-center text-muted py-4">No incidents reported by you.</div> : <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Event</th><th>Incident</th><th>Severity</th><th>Status</th><th>Management response</th><th>Reported</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td>{report.eventName}</td><td><div className="fw-semibold">{report.title}</div><small className="text-muted">{report.location || report.category}</small></td><td><span className={`badge ${severityClass(report.severity)}`}>{report.severity}</span></td><td><span className="badge bg-primary-subtle text-primary">{String(report.status).replaceAll("_", " ")}</span></td><td><div>{report.resolutionNotes || "Awaiting response"}</div>{report.assignedUserName && <small className="text-muted">Responder: {report.assignedUserName}</small>}</td><td>{report.reportedAt ? new Date(report.reportedAt).toLocaleString() : "—"}</td></tr>)}</tbody></table></div>}
    </div>
  );
}

function severityClass(severity) {
  if (severity === "CRITICAL") return "bg-danger text-white";
  if (severity === "HIGH") return "bg-danger-subtle text-danger";
  if (severity === "MEDIUM") return "bg-warning-subtle text-warning-emphasis";
  return "bg-success-subtle text-success";
}

function errorMessage(error) {
  return error.response?.data?.message || error.response?.data?.error || (typeof error.response?.data === "string" ? error.response.data : "Unable to complete the request.");
}

export default RoleIncidentReporter;
