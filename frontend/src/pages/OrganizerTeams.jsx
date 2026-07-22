import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsPeople,
  BsPersonBadge,
  BsPersonCheck,
  BsBriefcase,
  BsTrash,
  BsCalendarEvent,
} from "react-icons/bs";

function OrganizerTeams() {
  const [members, setMembers] = useState([]);
  const [eventAssignments, setEventAssignments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const [usersResponse, eventsResponse] = await Promise.all([
        api.get(`/users/portal/${portalId}`),
        api.get(`/events/portal/${portalId}`),
      ]);

      const portalMembers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const portalEvents = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      const assignmentResults = await Promise.allSettled(
        portalEvents.map((event) => api.get(`/event-assignments/event/${event.id}`))
      );
      const assignments = assignmentResults.flatMap((result) =>
        result.status === "fulfilled" && Array.isArray(result.value.data)
          ? result.value.data
          : []
      );

      setMembers(portalMembers);
      setEventAssignments(assignments);
      setMessage(
        assignmentResults.some((result) => result.status === "rejected")
          ? "Portal members loaded, but one or more event assignments could not be loaded."
          : ""
      );
    } catch (error) {
      console.log(error);
      setMessage("Unable to load team members.");
    }
  };

  const deleteMember = async (member) => {
    const confirmed = window.confirm(
      `Delete ${member.firstName || "this"} ${member.lastName || "user"}? This account will lose portal access.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${member.id}`);
      setMessage("User deleted successfully.");
      await fetchTeamMembers();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data || "Unable to delete the user.");
    }
  };

  const admins = members.filter((user) => user.role?.roleName === "PORTAL_ADMIN");
  const organizers = members.filter((user) => user.role?.roleName === "ORGANIZER");
  const staffs = members.filter((user) => user.role?.roleName === "Staff");
  const eventRoleCount = new Set(eventAssignments.map((assignment) => assignment.userId)).size;

  const roleBadge = (role) => {
    if (role === "PORTAL_ADMIN") return "bg-primary";
    if (role === "ORGANIZER") return "bg-success";
    if (role === "Staff") return "bg-warning text-dark";
    if (["VOLUNTEER", "COORDINATOR", "SPEAKER"].includes(role)) return "bg-info text-dark";
    if (["JUDGE", "TRAINER", "CHIEF_GUEST"].includes(role)) return "bg-dark";
    return "bg-secondary";
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
          Portal Team
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          View every admin, organizer and event-role member connected to this portal.
        </p>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      <div className="admin-stat-grid row g-4 mb-4">
        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPeople />
            </div>
            <p className="admin-bento-label">Total Members</p>
            <h2 className="admin-bento-value">{members.length}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonBadge />
            </div>
            <p className="admin-bento-label">Portal Admins</p>
            <h2 className="admin-bento-value">{admins.length}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonCheck />
            </div>
            <p className="admin-bento-label">Organizers</p>
            <h2 className="admin-bento-value">{organizers.length}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsBriefcase />
            </div>
            <p className="admin-bento-label">Staff & Event Roles</p>
            <h2 className="admin-bento-value">
              {new Set([
                ...staffs.map((user) => user.id),
                ...eventAssignments.map((assignment) => assignment.userId),
              ]).size}
            </h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <div className="admin-section-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
              Team Members
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
              Members are shown based on the logged-in portal.
            </p>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={fetchTeamMembers}
            style={{ borderRadius: "10px", fontSize: "15px" }}
          >
            Refresh
          </button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              No team members found.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: "15px" }}>Name</th>
                  <th style={{ fontSize: "15px" }}>Role</th>
                  <th style={{ fontSize: "15px" }}>Email</th>
                  <th style={{ fontSize: "15px" }}>Phone</th>
                  <th style={{ fontSize: "15px" }}>Status</th>
                  <th style={{ fontSize: "15px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontSize: "15px" }}>
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                    </td>

                    <td>
                      <span className={`badge ${roleBadge(member.role?.roleName)}`}>
                        {member.role?.roleName}
                      </span>
                    </td>

                    <td style={{ fontSize: "15px" }}>{member.email}</td>

                    <td style={{ fontSize: "15px" }}>
                      {member.phoneNumber || "Not added"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          member.active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {member.role?.roleName !== "PORTAL_ADMIN" &&
                      String(member.id) !== localStorage.getItem("userId") ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteMember(member)}
                          title="Delete user"
                        >
                          <BsTrash /> Delete
                        </button>
                      ) : (
                        <span className="text-muted">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-bento-card mt-4">
        <div className="admin-section-header mb-3">
          <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
            <BsCalendarEvent className="me-2" />
            Event Team Access
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
            Each row is one event-role assignment. A member can therefore have different
            dashboards for different events in this portal.
          </p>
        </div>

        {eventAssignments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              No users are assigned to portal events yet.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Event Role</th>
                  <th>Dashboard Access</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="fw-semibold">{assignment.userName || "Team member"}</td>
                    <td>{assignment.email || "Not added"}</td>
                    <td>
                      <div className="fw-semibold">{assignment.eventName}</div>
                      <small className="text-muted">Event #{assignment.eventId}</small>
                    </td>
                    <td>
                      <span className={`badge ${roleBadge(assignment.roleName)}`}>
                        {formatRole(assignment.roleName)}
                      </span>
                    </td>
                    <td>{formatRole(assignment.roleName)} Dashboard</td>
                    <td>
                      <span className={`badge ${assignment.active !== false ? "bg-success" : "bg-secondary"}`}>
                        {assignment.active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function formatRole(role) {
  return String(role || "Event role")
    .replaceAll("_", " ")
    .replace(/^Staff$/i, "Staff")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default OrganizerTeams;
