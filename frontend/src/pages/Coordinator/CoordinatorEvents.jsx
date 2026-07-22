import AssignedEventsWorkspace from "../../components/Role/AssignedEventsWorkspace";
export default function CoordinatorEvents(){const id=localStorage.getItem("userId");return <AssignedEventsWorkspace role="COORDINATOR" legacyEndpoint={`/coordinator-assignments/coordinator/${id}`} description="Choose an assigned event, review its lifecycle, and open its coordination workspace."/>;}
