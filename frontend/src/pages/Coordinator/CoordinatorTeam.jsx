import { useEffect, useMemo, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { filterToActiveEvent, loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";

export default function CoordinatorTeam() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const id = localStorage.getItem("userId");
      const assigned = await loadRoleAssignments("COORDINATOR", `/coordinator-assignments/coordinator/${id}`);
      const rows = await Promise.all(filterToActiveEvent(assigned).filter(a => a.active !== false && a.event?.id).map(async a => {
        const [staff, volunteers] = await Promise.allSettled([
          api.get(`/staff-assignments/event/${a.event.id}`),
          api.get(`/volunteer-assignments/event/${a.event.id}`),
        ]);
        return [
          ...(staff.status === "fulfilled" ? staff.value.data || [] : []).map(x => ({ id: `s-${x.id}`, role: "Staff", user: x.staff, event: a.event, duty: x.responsibility || x.duty })),
          ...(volunteers.status === "fulfilled" ? volunteers.value.data || [] : []).map(x => ({ id: `v-${x.id}`, role: "Volunteer", user: x.volunteer, event: a.event, duty: x.responsibility || x.duty })),
        ];
      }));
      setMembers(rows.flat()); setError("");
    } catch (e) { setError(e.response?.data?.message || "Unable to load assigned team."); }
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => members.filter(m => `${m.user?.firstName || ""} ${m.user?.lastName || ""} ${m.user?.email || ""} ${m.event?.eventName || ""}`.toLowerCase().includes(search.toLowerCase())), [members, search]);

  return <RoleLayout><Header title="Team" text="View staff and volunteers assigned to your events." action={load} />
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="row g-3 mb-4"><Metric label="Team members" value={members.length}/><Metric label="Staff" value={members.filter(x=>x.role==="Staff").length}/><Metric label="Volunteers" value={members.filter(x=>x.role==="Volunteer").length}/></div>
    <div className="admin-bento-card"><input className="form-control mb-3" placeholder="Search member or event..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Name</th><th>Role</th><th>Assigned event</th><th>Responsibility</th></tr></thead><tbody>{filtered.map(m=><tr key={m.id}><td><b>{m.user?.firstName} {m.user?.lastName}</b><div className="text-muted small">{m.user?.email}</div></td><td><span className="badge bg-primary">{m.role}</span></td><td>{m.event?.eventName}</td><td>{m.duty || "Assigned event support"}</td></tr>)}{!filtered.length&&<tr><td colSpan="4" className="text-center text-muted py-4">No assigned team members found.</td></tr>}</tbody></table></div>
    </div></RoleLayout>;
}
function Header({title,text,action}) { return <div className="d-flex justify-content-between align-items-start mb-4"><div><h1 className="fw-bold fs-3">{title}</h1><p className="text-muted">{text}</p></div><button className="btn btn-outline-primary" onClick={action}>Refresh</button></div>; }
function Metric({label,value}) { return <div className="col-md-4"><div className="admin-bento-card"><div className="admin-bento-label">{label}</div><div className="admin-bento-value">{value}</div></div></div>; }
