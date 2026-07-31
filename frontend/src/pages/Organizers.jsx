import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { useRef } from "react";
import "../styles/Admin.css";
import api from "../api/axiosConfig";
import { buildLoginDetails, generateTemporaryPassword } from "../utils/temporaryCredentials";
import { formatIndiaDateTime } from "../utils/dateTime";
import {
  BsEnvelope,
  BsPersonPlus,
  BsClipboard,
  BsPeople,
  BsArrowClockwise,
  BsPersonVcard,
  BsTrash,
  BsXCircle,
} from "react-icons/bs";

function Organizers() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [listMode, setListMode] = useState("invitations");
  const [addMode, setAddMode] = useState("email");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const submissionRef = useRef(false);
  const [manualForm, setManualForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  useEffect(() => {
    refreshOrganizerData();
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timeoutId = window.setTimeout(() => setMessage(""), 15000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const refreshOrganizerData = async () => {
    await Promise.all([fetchOrganizers(), fetchInvitations()]);
  };

  const fetchOrganizers = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const response = await api.get(`/users/organizers/portal/${portalId}`);
      setOrganizers(response.data || []);
    } catch (error) {
      console.log(error);
      setMessage("Unable to load organizers.");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (submissionRef.current) return;

    const portalId = localStorage.getItem("portalId");
    const invitedById = localStorage.getItem("userId");

    if (!portalId || !invitedById) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    submissionRef.current = true;
    try {
      setLoading(true);
      setMessage("");
      setInviteLink("");

      const response = await api.post("/invitations/invite", {
        email,
        portalId: Number(portalId),
        invitedById: Number(invitedById),
      });

      const link = `${window.location.origin}/invitation/accept/${response.data.token}`;

      setMessage("Invitation sent successfully to the organizer email.");
      setInviteLink(link);
      setEmail("");

      await refreshOrganizerData();
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message ||
          "Unable to invite organizer. Please check backend logs."
      );
      setInviteLink("");
    } finally {
      submissionRef.current = false;
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invitation link copied.");
  };

  const fetchInvitations = async () => {
    const portalId = localStorage.getItem("portalId");
    if (!portalId) return;

    try {
      const response = await api.get(`/invitations/portal/${portalId}`);
      setInvitations(response.data || []);
    } catch (error) {
      console.log(error);
      setMessage("Unable to load organizer invitations.");
    }
  };

  const deleteOrganizer = async (organizer) => {
    const name = `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim()
      || organizer.email
      || "this organizer";
    const confirmed = window.confirm(
      `Delete ${name}? Their portal access and active event assignments will be removed.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${organizer.id}`);
      setMessage("Organizer deleted successfully.");
      await fetchOrganizers();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data ||
        "Unable to delete the organizer."
      );
    }
  };

  const rejectOrganizerInvitation = async (invitation) => {
    if (!window.confirm(`Reject the invitation sent to ${invitation.email}?`)) return;

    try {
      await api.post(`/invitations/${invitation.id}/reject`);
      setMessage("Organizer invitation rejected.");
      await fetchInvitations();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data ||
        "Unable to reject the invitation."
      );
    }
  };

  const deleteOrganizerInvitation = async (invitation) => {
    if (!window.confirm(
      `Delete the invitation record for ${invitation.email}? This does not delete an organizer account.`
    )) return;

    try {
      await api.delete(`/invitations/${invitation.id}`);
      setMessage("Organizer invitation deleted.");
      await fetchInvitations();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data ||
        "Unable to delete the invitation."
      );
    }
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((current) => ({ ...current, [name]: value }));
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (submissionRef.current) return;
    const portalId = localStorage.getItem("portalId");
    const invitedById = localStorage.getItem("userId");

    if (!portalId || !invitedById) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    if (!manualForm.firstName.trim() || !manualForm.lastName.trim() || !manualForm.email.trim() || !manualForm.phoneNumber.trim() || !manualForm.password) {
      setMessage("First name, last name, email, phone number and temporary password are required.");
      return;
    }

    try {
      submissionRef.current = true;
      setLoading(true);
      setMessage("");
      setInviteLink("");
      await api.post("/invitations/manual", {
        ...manualForm,
        portalId: Number(portalId),
        invitedById: Number(invitedById),
      });
      setCreatedCredentials({ email: manualForm.email.trim(), password: manualForm.password });
      setMessage("Organizer account created. Copy and share the login details privately.");
      setManualForm({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "" });
      await refreshOrganizerData();
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Unable to create organizer account.");
    } finally {
      submissionRef.current = false;
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Organizers
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            Invite and manage organizers inside this portal.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={refreshOrganizerData}
          style={{ borderRadius: "10px", fontSize: "16px" }}
        >
          <BsArrowClockwise /> Refresh
        </button>
      </div>

      <div className="admin-page-grid row g-4">
        <div className="col-md-7">
          <div className="admin-bento-card">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="admin-bento-icon mb-0">
                <BsPersonPlus />
              </div>

              <div>
                <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
                  Add Organizer
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                  Send an invitation link or create the organizer directly.
                </p>
              </div>
            </div>

            <div className="admin-mode-tabs d-flex gap-2 p-1 rounded-3 mb-4" style={{ background: "#f1f3f8" }}>
              <button
                type="button"
                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${addMode === "email" ? "btn-primary" : "btn-light"}`}
                onClick={() => { setAddMode("email"); setMessage(""); setInviteLink(""); }}
              >
                <BsEnvelope /> Email Invitation
              </button>
              <button
                type="button"
                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${addMode === "manual" ? "btn-primary" : "btn-light"}`}
                onClick={() => { setAddMode("manual"); setMessage(""); setInviteLink(""); }}
              >
                <BsPersonVcard /> Add Manually
              </button>
            </div>

            {addMode === "email" ? <form onSubmit={handleInvite}>
              <label className="form-label" style={{ fontSize: "16px" }}>
                Organizer Email
              </label>

              <div className="input-group mb-3">
                <span className="input-group-text bg-white">
                  <BsEnvelope />
                </span>
                <input
                  className="form-control"
                  type="email"
                  placeholder="organizer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ fontSize: "16px", height: "46px" }}
                />
              </div>

              <button
                className="btn btn-primary"
                disabled={loading}
                style={{
                  fontSize: "16px",
                  borderRadius: "10px",
                  padding: "9px 22px",
                }}
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </form> : <form className="organizer-manual-form" onSubmit={handleManualAdd}>
              <div className="row g-3 align-items-start">
                <div className="col-md-6">
                  <label className="form-label">First Name <span className="text-danger">*</span></label>
                  <input className="form-control" name="firstName" value={manualForm.firstName} onChange={handleManualChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input className="form-control" name="lastName" value={manualForm.lastName} onChange={handleManualChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Login Email <span className="text-danger">*</span></label>
                  <input className="form-control" type="email" name="email" value={manualForm.email} onChange={handleManualChange} placeholder="organizer@example.com" required />
                  <small className="organizer-field-help text-muted">
                    The organizer will use this email and the temporary password below to sign in.
                  </small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input className="form-control" type="tel" inputMode="numeric" pattern="[0-9]{10,15}" name="phoneNumber" value={manualForm.phoneNumber} onChange={handleManualChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Temporary Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input className="form-control" name="password" value={manualForm.password} onChange={handleManualChange} minLength="8" required />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setManualForm((current) => ({ ...current, password: generateTemporaryPassword() }))}>Generate</button>
                  </div>
                  <small className="organizer-field-help text-muted">
                    Use at least 8 characters with uppercase, lowercase and a number.
                  </small>
                </div>
              </div>
              <button className="btn btn-primary mt-3" disabled={loading} style={{ borderRadius: "10px", padding: "9px 22px" }}>
                {loading ? "Creating..." : "Create Account Directly"}
              </button>
            </form>}

            {message && (
              <div className="alert alert-info mt-3 mb-0" style={{ fontSize: "15px" }}>
                {message}
              </div>
            )}

            {inviteLink && (
              <div className="mt-3 p-3 rounded-4" style={{ background: "#f4f6f9" }}>
                <p className="mb-2 fw-semibold" style={{ fontSize: "15px" }}>
                  Invitation Link
                </p>

                <div className="admin-copy-row d-flex gap-2">
                  <input
                    className="form-control"
                    value={inviteLink}
                    readOnly
                    style={{ fontSize: "14px" }}
                  />

                  <button
                    className="btn btn-outline-primary"
                    onClick={copyInviteLink}
                    type="button"
                  >
                    <BsClipboard />
                  </button>
                </div>
              </div>
            )}
            {createdCredentials && (
              <div className="alert alert-warning mt-3 mb-0">
                <strong>Login details — shown after creation</strong>
                <div className="mt-2">Email: {createdCredentials.email}</div>
                <div>Temporary password: {createdCredentials.password}</div>
                <button type="button" className="btn btn-sm btn-dark mt-2" onClick={async () => {
                  await navigator.clipboard.writeText(buildLoginDetails(createdCredentials.email, createdCredentials.password));
                  setMessage("Login details copied.");
                }}>Copy Login Details</button>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-5">
          <div className="admin-bento-card h-100">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="admin-bento-icon mb-0">
                <BsPeople />
              </div>

              <div>
                <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
                  Organizer Summary
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                  Active organizer accounts in this portal.
                </p>
              </div>
            </div>

            <h1 className="fw-bold mb-0" style={{ fontSize: "42px" }}>
              {organizers.length}
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              Total Organizers
            </p>
          </div>
        </div>
      </div>

      <div className="admin-bento-card mt-4">
        <div className="admin-mode-tabs d-flex gap-2 p-1 rounded-3 mb-4" style={{ background: "#f1f3f8" }}>
          <button
            type="button"
            className={`btn flex-fill ${listMode === "invitations" ? "btn-primary" : "btn-light"}`}
            onClick={() => setListMode("invitations")}
          >
            Organizer Invitations ({invitations.length})
          </button>
          <button
            type="button"
            className={`btn flex-fill ${listMode === "organizers" ? "btn-primary" : "btn-light"}`}
            onClick={() => setListMode("organizers")}
          >
            Current Organizers ({organizers.length})
          </button>
        </div>

        {listMode === "invitations" ? (
          <>
            <div className="admin-section-header mb-3">
              <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>Organizer Invitations</h2>
              <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                Invitations sent from this portal and their current status.
              </p>
            </div>
            {invitations.length === 0 ? (
              <div className="text-center py-4 text-muted">No organizer invitations sent yet.</div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: "380px", overflow: "auto" }}>
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Recipient</th><th>Invited By</th><th>Sent</th><th>Expires</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((invitation) => (
                      <tr key={invitation.id}>
                        <td className="fw-semibold">{invitation.email}</td>
                        <td>{invitation.invitedByName || "Portal Admin"}</td>
                        <td>{formatInvitationDate(invitation.createdAt)}</td>
                        <td>{formatInvitationDate(invitation.expiryDate)}</td>
                        <td><span className={`badge ${invitationStatusClass(invitation.status)}`}>{String(invitation.status || "PENDING").replaceAll("_", " ")}</span></td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {invitation.status === "PENDING" && <button type="button" className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1" onClick={() => rejectOrganizerInvitation(invitation)}><BsXCircle /> Reject</button>}
                            <button type="button" className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => deleteOrganizerInvitation(invitation)}><BsTrash /> Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="admin-section-header mb-3">
              <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>Current Organizers</h2>
              <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                Organizers who accepted invitation and joined this portal.
              </p>
            </div>
            {organizers.length === 0 ? (
              <div className="text-center py-4 text-muted">No organizers found yet.</div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: "380px", overflow: "auto" }}>
                <table className="table align-middle mb-0">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {organizers.map((organizer) => (
                      <tr key={organizer.id}>
                        <td>{organizer.firstName} {organizer.lastName}</td>
                        <td>{organizer.email}</td>
                        <td>{organizer.phoneNumber || "Not added"}</td>
                        <td><span className={`badge ${organizer.active ? "bg-success" : "bg-secondary"}`}>{organizer.active ? "Active" : "Inactive"}</span></td>
                        <td><button type="button" className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => deleteOrganizer(organizer)} title="Delete organizer"><BsTrash /> Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function formatInvitationDate(value) {
  return formatIndiaDateTime(value);
}

function invitationStatusClass(status) {
  if (status === "ACCEPTED") return "bg-success";
  if (status === "REJECTED") return "bg-danger";
  if (status === "EXPIRED") return "bg-secondary";
  return "bg-warning text-dark";
}

export default Organizers;
