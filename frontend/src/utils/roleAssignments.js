import api from "../api/axiosConfig";

export function normalizeRoleName(role) {
  const value = String(role || "").trim();

  if (!value) return "";
  if (value === "Staff") return "STAFF";
  if (value === "Chief Guest" || value === "CHIEF GUEST") return "CHIEF_GUEST";

  return value.replace(/\s+/g, "_").toUpperCase();
}

export function getAssignmentEvent(assignment) {
  return assignment.event || {
    id: assignment.eventId,
    eventName: assignment.eventName,
    venue: assignment.eventVenue,
    startDateTime: assignment.eventStartDateTime,
    endDateTime: assignment.eventEndDateTime,
    status: assignment.eventStatus,
    eventType: assignment.eventType,
    bannerUrl: assignment.bannerUrl,
  };
}

export function mapEventAssignment(assignment) {
  const event = getAssignmentEvent(assignment);

  return {
    id: `event-assignment-${assignment.id}`,
    assignmentId: assignment.id,
    active: assignment.active !== false,
    source: "EVENT_ASSIGNMENT",
    roleName: normalizeRoleName(assignment.roleName),
    roleDescription: assignment.sessionDescription || assignment.sessionTitle || assignment.roleName,
    duty: assignment.sessionDescription || assignment.sessionTitle || "Assigned event access",
    taskTitle: assignment.sessionTitle || "Assigned event access",
    status: assignment.status || "PENDING",
    event,
    eventId: event.id,
    eventName: event.eventName,
    portalId: assignment.portalId,
    portalName: assignment.portalName,
    userName: assignment.userName,
    email: assignment.email,
    sessionTitle: assignment.sessionTitle,
    sessionDescription: assignment.sessionDescription,
    sessionDate: assignment.sessionDate,
    sessionTime: assignment.sessionTime,
    assignedAt: assignment.createdAt || assignment.assignedAt,
  };
}

export function mergeAssignments(primaryAssignments, secondaryAssignments) {
  const seen = new Set();

  return [...primaryAssignments, ...secondaryAssignments].filter((assignment) => {
    const event = getAssignmentEvent(assignment);
    const role = normalizeRoleName(assignment.roleName);
    const key = `${role}-${event?.id || "none"}-${assignment.id || assignment.assignmentId}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadRoleAssignments(roleName, legacyEndpoint) {
  const userId = localStorage.getItem("userId");
  const normalizedRole = normalizeRoleName(roleName || localStorage.getItem("activeRole") || localStorage.getItem("role"));

  const requests = [api.get(`/event-assignments/user/${userId}`)];

  if (legacyEndpoint) {
    requests.push(api.get(legacyEndpoint));
  }

  const results = await Promise.allSettled(requests);

  const eventAssignments =
    results[0].status === "fulfilled"
      ? (results[0].value.data || [])
          .filter(
            (assignment) =>
              assignment.active !== false &&
              normalizeRoleName(assignment.roleName) === normalizedRole
          )
          .map(mapEventAssignment)
      : [];

  const legacyAssignments =
    results[1]?.status === "fulfilled" ? results[1].value.data || [] : [];

  return mergeAssignments(eventAssignments, legacyAssignments);
}

export const OPERATIONAL_ROLES = ["COORDINATOR", "STAFF", "VOLUNTEER"];

export function getEventLifecycle(event) {
  const status = String(event?.status || "").toUpperCase();
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "COMPLETED") return "COMPLETED";

  const now = Date.now();
  const start = event?.startDateTime ? new Date(event.startDateTime).getTime() : null;
  const end = event?.endDateTime ? new Date(event.endDateTime).getTime() : null;
  if (end && end < now) return "COMPLETED";
  if (start && start > now) return "UPCOMING";
  if (start && (!end || end >= now)) return "RUNNING";
  return status || "UPCOMING";
}

export function setActiveRoleAssignment(assignment) {
  const event = getAssignmentEvent(assignment);
  if (!event?.id) return;
  localStorage.setItem("activeEventId", String(event.id));
  localStorage.setItem("activeEventName", event.eventName || "Event");
  localStorage.setItem("activeAssignmentId", String(assignment.assignmentId || assignment.id || ""));
  if (assignment.portalId) localStorage.setItem("activePortalId", String(assignment.portalId));
  if (assignment.portalName) localStorage.setItem("activePortalName", assignment.portalName);
  window.dispatchEvent(new CustomEvent("role-active-event-changed", { detail: assignment }));
}

export function resolveActiveAssignment(assignments = []) {
  const activeId = localStorage.getItem("activeEventId");
  const valid = assignments.filter((item) => item.active !== false && getAssignmentEvent(item)?.id);
  const selected = valid.find((item) => String(getAssignmentEvent(item).id) === String(activeId)) || valid[0] || null;
  if (selected && String(getAssignmentEvent(selected).id) !== String(activeId)) setActiveRoleAssignment(selected);
  return selected;
}

export function filterToActiveEvent(assignments = []) {
  const activeId = localStorage.getItem("activeEventId");
  if (!activeId) return assignments;
  return assignments.filter((item) => String(getAssignmentEvent(item)?.id) === String(activeId));
}
