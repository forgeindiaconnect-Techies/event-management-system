import AssignedEventsWorkspace from "../../components/Role/AssignedEventsWorkspace";
export default function StaffEvents(){const id=localStorage.getItem("userId");return <AssignedEventsWorkspace role="STAFF" legacyEndpoint={`/staff-assignments/staff/${id}`} description="Choose an assigned event to see only its duties, attendance, tickets, and incident work."/>;}
