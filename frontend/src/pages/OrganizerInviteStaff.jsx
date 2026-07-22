import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsPersonPlus,
  BsEnvelope,
  BsPeople,
  BsSend,
  BsSearch,
  BsArrowClockwise,
  BsPersonVcard,
  BsEye,
  BsEyeSlash,
} from "react-icons/bs";

function OrganizerInviteStaff() {
  const [formData, setFormData] = useState({
    email: "",
    roleName: "Staff",
    eventId: "",
  });

  const [invitations, setInvitations] = useState([]);
  const [portalMembers, setPortalMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [assignmentSelections, setAssignmentSelections] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [addMode, setAddMode] = useState("email");
  const [manualData, setManualData] = useState({ firstName: "", lastName: "", phoneNumber: "", password: "" });
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);

  const roles = [
    "Staff",
    "VOLUNTEER",
    "COORDINATOR",
    "SPEAKER",
    "JUDGE",
    "TRAINER",
    "CHIEF_GUEST",
  ];

  useEffect(() => {
    loadInvitations();
    loadPortalMembers();
    loadEvents();
  }, []);

  const loadPortalMembers = async () => {
    const portalId = localStorage.getItem("portalId");
    if (!portalId) return;

    try {
      const response = await api.get(`/users/portal/${portalId}`);
      setPortalMembers(response.data || []);
    } catch (error) {
      console.log(error);
      setPortalMembers([]);
    }
  };

  const refreshHistory = () => {
    loadInvitations();
    loadPortalMembers();
  };

  const loadEvents = async () => {
    const organizerId = localStorage.getItem("userId");

    try {
      const response = await api.get(`/events/organizer/${organizerId}`);
      setEvents(response.data || []);
    } catch (error) {
      console.log(error);
      setEvents([]);
    }
  };

  const loadInvitations = async () => {
    const organizerId = localStorage.getItem("userId");

    try {
      const response = await api.get(`/role-invitations/organizer/${organizerId}`);
      setInvitations(response.data || []);
    } catch (error) {
      console.log(error);
      setMessage("Unable to load sent invitations.");
      setMessageType("danger");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const selectedEvent = events.find(
        (event) => String(event.id) === String(formData.eventId)
      );

      const payload = {
        email: formData.email,
        roleName: formData.roleName,
        portalId: Number(localStorage.getItem("portalId")),
        invitedById: Number(localStorage.getItem("userId")),
      };

      if (selectedEvent) {
        payload.eventId = Number(selectedEvent.id);
        payload.eventName = selectedEvent.eventName;
        payload.eventDescription = selectedEvent.description;
        payload.eventVenue = selectedEvent.venue || selectedEvent.meetingLink;
        payload.eventStartDateTime = selectedEvent.startDateTime;
      }

      await api.post("/role-invitations/invite", payload);

      setMessage("Invitation sent successfully.");
      setMessageType("success");

      setFormData({
        email: "",
        roleName: "Staff",
        eventId: "",
      });

      refreshHistory();
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to send invitation.");
      setMessageType("danger");
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    if (addMode === "email") return handleInvite(e);
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const selectedEvent = events.find((event) => String(event.id) === String(formData.eventId));
      await api.post("/role-invitations/manual", {
        ...formData,
        ...manualData,
        portalId: Number(localStorage.getItem("portalId")),
        invitedById: Number(localStorage.getItem("userId")),
        eventId: selectedEvent ? Number(selectedEvent.id) : null,
      });
      setMessage("User created and assigned successfully. No invitation email was sent.");
      setMessageType("success");
      setFormData({ email: "", roleName: "Staff", eventId: "" });
      setManualData({ firstName: "", lastName: "", phoneNumber: "", password: "" });
      setShowTemporaryPassword(false);
      refreshHistory();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create the user.");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const assignInviteToEvent = async (invite) => {
    const eventId = assignmentSelections[invite.id];

    if (!eventId) {
      setMessage("Please select an event before assigning.");
      setMessageType("warning");
      return;
    }

    try {
      setMessage("");
      await api.post("/event-assignments/assign", {
        email: invite.email,
        eventId: Number(eventId),
        roleName: invite.roleName,
      });

      setMessage("User assigned to event successfully.");
      setMessageType("success");
      setAssignmentSelections((current) => ({
        ...current,
        [invite.id]: "",
      }));
      await loadInvitations();
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to assign user to event.");
      setMessageType("danger");
    }
  };

  const deleteCreatedUser = async (row) => {
    if (!row.userId) return;
    if (!window.confirm(`Delete the account for ${row.email}? This user will lose portal access.`)) return;

    try {
      await api.delete(`/users/${row.userId}`);
      setMessage("User deleted successfully.");
      setMessageType("success");
      refreshHistory();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data || "Unable to delete the user.");
      setMessageType("danger");
    }
  };

  const invitationEmails = new Set(
    invitations.map((invite) => invite.email?.trim().toLowerCase()).filter(Boolean)
  );
  const visibleRoleNames = new Set(roles);
  const manualMembers = portalMembers.filter((member) => {
    const email = member.email?.trim().toLowerCase();
    return email && visibleRoleNames.has(member.role?.roleName) && !invitationEmails.has(email);
  });
  const historyRows = [
    ...invitations.map((invite) => ({
      ...invite,
      userId: portalMembers.find(
        (member) => member.email?.trim().toLowerCase() === invite.email?.trim().toLowerCase()
      )?.id,
      historyType: "EMAIL",
    })),
    ...manualMembers.map((member) => ({
      id: `manual-${member.id}`,
      userId: member.id,
      email: member.email,
      roleName: member.role?.roleName,
      status: member.active === false ? "INACTIVE" : "ACTIVE",
      eventName: null,
      expiryDate: null,
      createdAt: member.createdAt,
      historyType: "MANUAL",
    })),
  ];

  const filteredInvitations = historyRows.filter((invite) => {
    const email = invite.email?.toLowerCase() || "";
    const role = invite.roleName?.toLowerCase() || "";
    const status = invite.status?.toLowerCase() || "";
    const source = invite.historyType === "MANUAL" ? "added manually" : "email invitation";
    return (
      email.includes(search.toLowerCase()) ||
      role.includes(search.toLowerCase()) ||
      status.includes(search.toLowerCase()) ||
      source.includes(search.toLowerCase())
    );
  });

  const statusBadge = (status) => {
    if (status === "ACCEPTED") return "bg-success";
    if (status === "PENDING") return "bg-warning text-dark";
    if (status === "EXPIRED") return "bg-danger";
    if (status === "REJECTED") return "bg-secondary";
    if (status === "ACTIVE") return "bg-success";
    if (status === "INACTIVE") return "bg-secondary";
    return "bg-secondary";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Invite Staff & Roles
          </h1>

          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            Invite staff members and other event roles to your portal.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={refreshHistory}
          style={{ borderRadius: "10px", fontSize: "15px" }}
        >
          <BsArrowClockwise /> Refresh
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="admin-bento-card h-100">
            <h4 className="fw-bold mb-4">
              <BsPersonPlus className="me-2" />
              Add Staff & Roles
            </h4>

            {message && (
              <div className={`alert alert-${messageType} py-3`} role="alert">
                {message}
              </div>
            )}

            <div className="organizer-mode-tabs d-flex gap-2 p-1 rounded-3 mb-4" style={{ background: "#f1f3f8" }}>
              <button type="button" className={`btn flex-fill ${addMode === "email" ? "btn-primary" : "btn-light"}`} onClick={() => setAddMode("email")}>
                <BsEnvelope className="me-2" />Email Invitation
              </button>
              <button type="button" className={`btn flex-fill ${addMode === "manual" ? "btn-primary" : "btn-light"}`} onClick={() => setAddMode("manual")}>
                <BsPersonVcard className="me-2" />Add Manually
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {addMode === "manual" && <div className="row g-3 mb-3">
                <div className="col-md-6"><label className="form-label fw-semibold">First Name</label><input className="form-control" value={manualData.firstName} onChange={(e) => setManualData({ ...manualData, firstName: e.target.value })} required /></div>
                <div className="col-md-6"><label className="form-label fw-semibold">Last Name</label><input className="form-control" value={manualData.lastName} onChange={(e) => setManualData({ ...manualData, lastName: e.target.value })} required /></div>
              </div>}
              <div className="mb-3">
                <label className="form-label fw-semibold">{addMode === "manual" ? "Login Email" : "Email Address"}</label>

                <div className="input-group">
                  <span className="input-group-text">
                    <BsEnvelope />
                  </span>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {addMode === "manual" && <div className="row g-3 mb-3">
                <div className="col-md-6"><label className="form-label fw-semibold">Phone Number</label><input className="form-control" style={{ height: "48px" }} value={manualData.phoneNumber} onChange={(e) => setManualData({ ...manualData, phoneNumber: e.target.value })} required /></div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Temporary Password</label>
                  <div className="input-group" style={{ height: "48px" }}>
                    <input
                      type={showTemporaryPassword ? "text" : "password"}
                      minLength={6}
                      className="form-control"
                      style={{ height: "48px" }}
                      value={manualData.password}
                      onChange={(e) => setManualData({ ...manualData, password: e.target.value })}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ width: "52px", height: "48px" }}
                      onClick={() => setShowTemporaryPassword((visible) => !visible)}
                      aria-label={showTemporaryPassword ? "Hide password" : "Show password"}
                      title={showTemporaryPassword ? "Hide password" : "Show password"}
                    >
                      {showTemporaryPassword ? <BsEyeSlash /> : <BsEye />}
                    </button>
                  </div>
                </div>
              </div>}

              <div className="mb-4">
                <label className="form-label fw-semibold">Select Role</label>

                <select
                  className="form-select"
                  name="roleName"
                  value={formData.roleName}
                  onChange={handleChange}
                  style={{ height: "44px" }}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {formatRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Assign to Event</label>
                <select
                  className="form-select"
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleChange}
                  style={{ height: "44px" }}
                >
                  <option value="">Invite without event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName}
                    </option>
                  ))}
                </select>
                <div className="text-muted mt-1" style={{ fontSize: "13px" }}>
                  Leave empty to invite now and assign the user to an event later.
                </div>
              </div>

              <button className="btn btn-primary px-4" disabled={loading}>
                {addMode === "email" ? <BsSend className="me-2" /> : <BsPersonPlus className="me-2" />}
                {loading ? (addMode === "email" ? "Sending..." : "Creating...") : (addMode === "email" ? "Send Invitation" : "Create User")}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="admin-bento-card h-100">
            <h4 className="fw-bold mb-3">
              <BsPeople className="me-2" />
              Available Roles
            </h4>

            <table className="table align-middle mb-0">
              <tbody>
                <tr>
                  <td>Staff</td>
                  <td className="text-muted">Manage registrations</td>
                </tr>
                <tr>
                  <td>Volunteer</td>
                  <td className="text-muted">Support operations</td>
                </tr>
                <tr>
                  <td>Coordinator</td>
                  <td className="text-muted">Coordinate activities</td>
                </tr>
                <tr>
                  <td>Speaker</td>
                  <td className="text-muted">Deliver sessions</td>
                </tr>
                <tr>
                  <td>Judge</td>
                  <td className="text-muted">Evaluate competitions</td>
                </tr>
                <tr>
                  <td>Trainer</td>
                  <td className="text-muted">Guide participants</td>
                </tr>
                <tr>
                  <td>Chief Guest</td>
                  <td className="text-muted">Special guest access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <div className="organizer-section-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
              User Invitation & Creation History
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
              Track email invitations and users added manually.
            </p>
          </div>

          <div
            className="d-flex align-items-center border rounded px-3 organizer-search"
            style={{ width: "330px", height: "42px", background: "#fff" }}
          >
            <BsSearch className="me-2 text-primary" />
            <input
              className="form-control border-0 shadow-none p-0"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: "15px" }}
            />
          </div>
        </div>

        {filteredInvitations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No invitation or manual creation history found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Added Through</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Expiry Date</th>
                  <th>Assign</th>
                  <th>Delete</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvitations.map((invite, index) => (
                  <tr key={invite.id}>
                    <td>{index + 1}</td>
                    <td>{invite.email}</td>
                    <td>
                      <span className="badge bg-primary">{invite.roleName}</span>
                    </td>
                    <td>
                      <span className={`badge ${invite.historyType === "MANUAL" ? "bg-info text-dark" : "bg-light text-dark"}`}>
                        {invite.historyType === "MANUAL" ? "Added manually" : "Email invitation"}
                      </span>
                    </td>
                    <td>{invite.eventName || "Not assigned"}</td>
                    <td>
                      <span className={`badge ${statusBadge(invite.status)}`}>
                        {invite.status}
                      </span>
                    </td>
                    <td>{invite.historyType === "MANUAL" ? "—" : formatDate(invite.expiryDate)}</td>
                    <td style={{ minWidth: "260px" }}>
                      {invite.historyType === "MANUAL" ? (
                        <span className="text-muted">Created account</span>
                      ) : invite.eventId ? (
                        <span className="badge bg-success-subtle text-success px-3 py-2">Assigned</span>
                      ) : <div className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={assignmentSelections[invite.id] || ""}
                          onChange={(e) =>
                            setAssignmentSelections((current) => ({
                              ...current,
                              [invite.id]: e.target.value,
                            }))
                          }
                          disabled={invite.status !== "ACCEPTED" || Boolean(invite.eventId)}
                        >
                          <option value="">Select event</option>
                          {events.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.eventName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={invite.status !== "ACCEPTED" || Boolean(invite.eventId)}
                          onClick={() => assignInviteToEvent(invite)}
                        >
                          Assign
                        </button>
                      </div>}
                    </td>
                    <td>
                      {invite.userId ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteCreatedUser(invite)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
}

function formatRoleLabel(role) {
  return String(role || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default OrganizerInviteStaff;
