import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsCalendarEvent, BsCheckCircle, BsPeople, BsStar, BsClock } from "react-icons/bs";
import api from "../api/axiosConfig";
import RoleLayout from "../layouts/RoleLayout";
import "../styles/Admin.css";

const config = {
  JUDGE: {
    title: "Judge Dashboard",
    description: "Review assigned competitions and keep judging work organized.",
    nav: [
      ["Competitions", "/judge/competitions", BsCalendarEvent],
      ["Assigned Work", "/judge/work", BsStar],
    ],
    cards: [["Competitions", BsCalendarEvent], ["Participants", BsPeople], ["Scores submitted", BsStar], ["Completed", BsCheckCircle]],
    empty: "No competitions have been assigned to you yet.",
  },
  TRAINER: {
    title: "Trainer Dashboard",
    description: "Train assigned teams and keep coaching sessions on track.",
    nav: [
      ["Assigned Teams", "/mentor/teams", BsPeople],
      ["Schedule", "/mentor/schedule", BsClock],
    ],
    cards: [["Assigned teams", BsPeople], ["Events", BsCalendarEvent], ["Sessions", BsClock], ["Completed", BsCheckCircle]],
    empty: "No teams or events have been assigned to you yet.",
  },
};

export default function RoleAssignmentWorkspace({ role, section = "dashboard" }) {
  const navigate = useNavigate();
  const current = config[role];
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    api.get(`/event-assignments/user/${userId}`)
      .then(({ data }) => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setError("Unable to load your assignments right now."))
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => assignments.filter((item) => {
    const assignedRole = String(item.roleName || item.role || item.eventRole || "").toUpperCase();
    return !assignedRole || assignedRole === role;
  }), [assignments, role]);

  if (section !== "dashboard") {
    if (section === "scores") {
      return <RoleLayout><ScoreWorkspace items={events} loading={loading} error={error} /></RoleLayout>;
    }
    const label = section === "competitions" ? "Assigned Competitions" : section === "scores" ? "Scores & Evaluations" : section === "teams" ? "Assigned Teams" : "Training Schedule";
    return <RoleLayout><WorkspaceList title={label} description={current.description} items={events} loading={loading} error={error} empty={current.empty} /></RoleLayout>;
  }

  return <RoleLayout>
    <header className="mb-4">
      <div className="text-uppercase text-primary fw-bold" style={{ letterSpacing: "1px", fontSize: "13px" }}>{role === "JUDGE" ? "JUDGE WORKSPACE" : "TRAINER WORKSPACE"}</div>
      <h1 className="fw-bold mb-1" style={{ fontSize: "30px" }}>{current.title}</h1>
      <p className="text-muted mb-0">{current.description}</p>
    </header>
    <div className="row g-4 mb-4">
      {current.cards.map(([label, Icon]) => <div className="col-lg-3 col-md-6" key={label}><div className="admin-bento-card h-100"><div className="admin-bento-icon mb-3"><Icon /></div><div className="admin-bento-label">{label}</div><div className="admin-bento-value">{label === current.cards[0][0] ? events.length : 0}</div></div></div>)}
    </div>
    <div className="admin-bento-card mb-4"><h4 className="fw-bold">Your workspace</h4><p className="text-muted">Use the links below to open the pages for your role.</p><div className="d-flex flex-wrap gap-2">{current.nav.map(([label, path, Icon]) => <button className="btn btn-outline-primary d-flex align-items-center gap-2" key={path} onClick={() => navigate(path)}><Icon /> {label}</button>)}</div></div>
    <WorkspaceList title={role === "JUDGE" ? "Assigned Competitions" : "Assigned Events & Teams"} description="Only assignments linked to your account are shown." items={events} loading={loading} error={error} empty={current.empty} />
  </RoleLayout>;
}

function WorkspaceList({ title, description, items, loading, error, empty }) {
  return <section className="admin-bento-card"><h4 className="fw-bold mb-1">{title}</h4><p className="text-muted">{description}</p>{error && <div className="alert alert-danger">{error}</div>}{loading ? <p className="text-muted">Loading assignments...</p> : items.length === 0 ? <div className="text-center text-muted py-5"><BsCalendarEvent size={34} className="mb-2" /><p className="mb-0">{empty}</p></div> : <div className="row g-3">{items.map((item, index) => <div className="col-md-6" key={item.id || index}><div className="border rounded-3 p-3 h-100">{item.bannerUrl && <img src={item.bannerUrl} alt="Event banner" className="w-100 rounded-3 mb-3" style={{ height: "140px", objectFit: "cover" }} />}<h5 className="fw-semibold mb-2">{item.eventName || item.event?.name || item.title || "Assigned event"}</h5><div className="small text-muted">Role: {displayRole(item.roleName || item.role || item.eventRole)}</div><div className="small text-muted">Status: {item.eventStatus || item.status || "ACTIVE"}</div></div></div>)}</div>}</section>;
}

function ScoreWorkspace({ items, loading, error }) {
  return <section className="admin-bento-card"><h1 className="fw-bold mb-1">Scores & Evaluations</h1><p className="text-muted">Select the participant you are judging and submit the evaluation details.</p>{error && <div className="alert alert-danger">{error}</div>}{loading ? <p className="text-muted">Loading competitions...</p> : items.length === 0 ? <p className="text-muted py-4">No assigned competitions available.</p> : items.map((item, index) => <div className="border rounded-3 p-3 mb-3" key={item.id || index}>{item.bannerUrl && <img src={item.bannerUrl} alt="Event banner" className="w-100 rounded-3 mb-3" style={{ maxHeight: "180px", objectFit: "cover" }} />}<h4 className="fw-semibold">{item.eventName || "Assigned competition"}</h4><div className="row g-3 mt-1"><div className="col-md-6"><label className="form-label">Participant name *</label><input className="form-control" placeholder="Enter participant name" /></div><div className="col-md-6"><label className="form-label">Participant ID / registration *</label><input className="form-control" placeholder="Enter registration ID" /></div><div className="col-md-4"><label className="form-label">Technical score</label><input className="form-control" type="number" min="0" max="100" /></div><div className="col-md-4"><label className="form-label">Performance score</label><input className="form-control" type="number" min="0" max="100" /></div><div className="col-md-4"><label className="form-label">Overall score</label><input className="form-control" type="number" min="0" max="100" /></div><div className="col-12"><label className="form-label">Remarks</label><textarea className="form-control" rows="3" placeholder="Add evaluation remarks" /></div></div><button className="btn btn-primary mt-3" type="button">Submit Evaluation</button><div className="small text-muted mt-2">Evaluation storage will be connected to the scoring API.</div></div>)}</section>;
}

function roleForItem(item) { return String(item.roleName || item.role || item.eventRole || "").toUpperCase(); }
function displayRole(role) { const value = String(role || "ASSIGNED MEMBER").toUpperCase(); return value.replaceAll("_", " "); }
