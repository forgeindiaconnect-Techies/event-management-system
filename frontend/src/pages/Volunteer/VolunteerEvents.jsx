import AssignedEventsWorkspace from "../../components/Role/AssignedEventsWorkspace";
export default function VolunteerEvents(){const id=localStorage.getItem("userId");return <AssignedEventsWorkspace role="VOLUNTEER" legacyEndpoint={`/volunteer-assignments/volunteer/${id}`} description="Choose an assigned event to see only its tasks, deadlines, and incident reports."/>;}
