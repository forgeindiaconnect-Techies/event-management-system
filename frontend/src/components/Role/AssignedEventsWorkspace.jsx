import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowClockwise, BsCalendarEvent, BsGeoAlt, BsSearch } from "react-icons/bs";
import RoleLayout from "../../layouts/RoleLayout";
import { getDefaultBanner } from "../../utils/bannerUtils";
import { getEventLifecycle, loadRoleAssignments, setActiveRoleAssignment } from "../../utils/roleAssignments";
import "../../styles/Admin.css";

const FILTERS = ["ALL", "RUNNING", "UPCOMING", "COMPLETED", "CANCELLED"];
const HOME = { COORDINATOR: "/coordinator", STAFF: "/staff", VOLUNTEER: "/volunteer" };

export default function AssignedEventsWorkspace({ role, legacyEndpoint, description }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try { setAssignments(await loadRoleAssignments(role, legacyEndpoint)); setError(""); }
    catch (e) { setError(e.response?.data?.message || "Unable to load assigned events."); }
  };
  useEffect(() => { load(); }, [role, legacyEndpoint]);

  const rows = useMemo(() => assignments.filter((item) => {
    const event = item.event || {};
    const lifecycle = getEventLifecycle(event);
    const matchesFilter = filter === "ALL" || lifecycle === filter;
    const text = `${event.eventName || ""} ${event.venue || ""} ${item.duty || ""}`.toLowerCase();
    return matchesFilter && text.includes(search.toLowerCase());
  }), [assignments, filter, search]);

  const open = (assignment) => { setActiveRoleAssignment(assignment); navigate(HOME[role]); };
  return <RoleLayout><div className="d-flex justify-content-between align-items-start mb-4"><div><h1 className="fw-bold fs-3">Assigned Events</h1><p className="text-muted">{description}</p></div><button className="btn btn-outline-primary" onClick={load}><BsArrowClockwise className="me-2"/>Refresh</button></div>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="admin-bento-card mb-4"><div className="d-flex flex-wrap gap-2 mb-3">{FILTERS.map(x => <button key={x} className={`btn btn-sm ${filter===x?"btn-primary":"btn-outline-secondary"}`} onClick={()=>setFilter(x)}>{x.replace("ALL","All").replaceAll("_"," ")}</button>)}</div><div className="input-group" style={{maxWidth:420}}><span className="input-group-text bg-white"><BsSearch/></span><input className="form-control" placeholder="Search event, venue or duty" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
    <div className="row g-4">{rows.map(a => { const event=a.event||{}, life=getEventLifecycle(event); return <div className="col-xl-4 col-md-6" key={a.id}><div className="admin-bento-card h-100 d-flex flex-column"><img src={event.bannerUrl||getDefaultBanner(event.eventType)} alt={event.eventName||"Event"} style={{width:"100%",height:150,objectFit:"cover",borderRadius:14,marginBottom:16}}/><div className="d-flex justify-content-between gap-2"><h4 className="fw-bold">{event.eventName}</h4><span className={`badge align-self-start ${life==="RUNNING"?"bg-success":life==="CANCELLED"?"bg-danger":life==="COMPLETED"?"bg-secondary":"bg-primary"}`}>{life}</span></div><p className="text-muted"><BsGeoAlt className="me-2"/>{event.venue||"Venue not added"}</p><p><b>Duty:</b> {a.duty||"Assigned event work"}</p><p><b>Schedule:</b> {format(event.startDateTime)} – {format(event.endDateTime)}</p><p><b>Portal:</b> {a.portalName||"Assigned portal"}</p><button className="btn btn-primary mt-auto" onClick={()=>open(a)}>Open event workspace</button></div></div>})}{!rows.length&&<div className="col-12"><div className="admin-bento-card text-center py-5 text-muted"><BsCalendarEvent size={48}/><p className="mt-3 mb-0">No {filter.toLowerCase()} assigned events found.</p></div></div>}</div>
  </RoleLayout>;
}
function format(value){return value?new Date(value).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Not added";}
