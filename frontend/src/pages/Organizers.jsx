import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/Admin.css";
import api from "../api/axiosConfig";
import {
  BsEnvelope,
  BsPersonPlus,
  BsClipboard,
  BsPeople,
  BsArrowClockwise,
  BsPersonVcard,
} from "react-icons/bs";

function Organizers() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [addMode, setAddMode] = useState("email");
  const [manualForm, setManualForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  useEffect(() => {
    fetchOrganizers();
  }, []);

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

    const portalId = localStorage.getItem("portalId");
    const invitedById = localStorage.getItem("userId");

    if (!portalId || !invitedById) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

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

      fetchOrganizers();
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message ||
          "Unable to invite organizer. Please check backend logs."
      );
      setInviteLink("");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invitation link copied.");
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((current) => ({ ...current, [name]: value }));
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const portalId = localStorage.getItem("portalId");
    const invitedById = localStorage.getItem("userId");

    if (!portalId || !invitedById) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setInviteLink("");
      await api.post("/invitations/manual", {
        ...manualForm,
        portalId: Number(portalId),
        invitedById: Number(invitedById),
      });
      setMessage("Organizer account created successfully. They can login using the entered email and password.");
      setManualForm({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "" });
      fetchOrganizers();
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Unable to create organizer account.");
    } finally {
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
          onClick={fetchOrganizers}
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
            </form> : <form onSubmit={handleManualAdd}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input className="form-control" name="firstName" value={manualForm.firstName} onChange={handleManualChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" name="lastName" value={manualForm.lastName} onChange={handleManualChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Login Email</label>
                  <input className="form-control" type="email" name="email" value={manualForm.email} onChange={handleManualChange} placeholder="organizer@example.com" required />
                  <small className="text-muted">No invitation is sent. This email is used only as the organizer's login ID.</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control" name="phoneNumber" value={manualForm.phoneNumber} onChange={handleManualChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Temporary Password</label>
                  <input className="form-control" type="password" name="password" value={manualForm.password} onChange={handleManualChange} minLength={6} required />
                </div>
              </div>
              <button className="btn btn-primary mt-3" disabled={loading} style={{ borderRadius: "10px", padding: "9px 22px" }}>
                {loading ? "Creating..." : "Create Organizer"}
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
        <div className="admin-section-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
              Current Organizers
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
              Organizers who accepted invitation and joined this portal.
            </p>
          </div>
        </div>

        {organizers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              No organizers found yet.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: "15px" }}>Name</th>
                  <th style={{ fontSize: "15px" }}>Email</th>
                  <th style={{ fontSize: "15px" }}>Phone</th>
                  <th style={{ fontSize: "15px" }}>Status</th>
                </tr>
              </thead>

              <tbody>
                {organizers.map((organizer) => (
                  <tr key={organizer.id}>
                    <td style={{ fontSize: "15px" }}>
                      {organizer.firstName} {organizer.lastName}
                    </td>
                    <td style={{ fontSize: "15px" }}>{organizer.email}</td>
                    <td style={{ fontSize: "15px" }}>
                      {organizer.phoneNumber || "Not added"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          organizer.active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {organizer.active ? "Active" : "Inactive"}
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

export default Organizers;
