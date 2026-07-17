import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { BsEye, BsEyeSlash } from "react-icons/bs";

function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      try {
        const res = await api.get(`/invitations/token/${token}`);
        setInvitation(res.data);
      } catch (error) {
        setMessage(
          error.response
            ? "Invalid or expired invitation link."
            : "Unable to connect to the server. Please ask the organizer to make sure the backend is running."
        );
      }
    }

    loadInvitation();
  }, [token]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      await api.post(`/invitations/accept/${token}`, form);

      setMessage("Invitation accepted successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to accept invitation. Link may be expired or already used."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post(`/invitations/reject/${token}`);
      setMessage("Invitation rejected successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to reject invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "#f4f6f9" }}
    >
      <div
        className="card border-0 shadow-sm"
        style={{ width: "520px", borderRadius: "22px" }}
      >
        <div className="card-body p-4">
          <h1 className="fw-bold mb-2" style={{ fontSize: "26px" }}>
            Accept Invitation
          </h1>

          <p className="text-muted mb-4" style={{ fontSize: "16px" }}>
            You have been invited as an organizer. Complete your details below
            to create your FIC BackRooms account.
          </p>

          {invitation && (
            <div className="bg-light border rounded-3 p-3 mb-4">
              <div className="mb-2">
                <strong>Portal:</strong> {invitation.portal?.portalName || "N/A"}
              </div>
              <div className="mb-2">
                <strong>Portal Owner:</strong>{" "}
                {invitation.portal?.admin?.firstName || "N/A"}{" "}
                {invitation.portal?.admin?.lastName || ""}
              </div>
              <div>
                <strong>Invited By:</strong>{" "}
                {invitation.invitedBy?.firstName || "N/A"}{" "}
                {invitation.invitedBy?.lastName || ""}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  className="form-control"
                  name="firstName"
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  className="form-control"
                  name="lastName"
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                className="form-control"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={form.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Create Password</label>
              <div className="input-group">
                <input
                  className="form-control"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary w-100"
              disabled={loading}
              style={{ fontSize: "16px", padding: "10px", borderRadius: "10px" }}
            >
              {loading ? "Creating Account..." : "Create Organizer Account"}
            </button>

            <button
              type="button"
              className="btn btn-outline-danger w-100 mt-2"
              disabled={loading}
              style={{ fontSize: "16px", padding: "10px", borderRadius: "10px" }}
              onClick={handleReject}
            >
              Reject Invitation
            </button>
          </form>

          {message && (
            <div className="alert alert-info mt-3 mb-0" style={{ fontSize: "15px" }}>
              {message}
            </div>
          )}

          <div className="mt-3">
            <Link to="/login" className="text-decoration-none">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitation;
