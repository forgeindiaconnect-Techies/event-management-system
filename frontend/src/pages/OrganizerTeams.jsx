import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import { BsPeople, BsPersonBadge, BsPersonCheck, BsBriefcase } from "react-icons/bs";

function OrganizerTeams() {
  const [members, setMembers] = useState([]);
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
      const response = await api.get(`/users/portal/${portalId}`);

      const filtered = (response.data || []).filter((user) =>
        ["PORTAL_ADMIN", "ORGANIZER", "Staff"].includes(user.role?.roleName)
      );

      setMembers(filtered);
    } catch (error) {
      console.log(error);
      setMessage("Unable to load team members.");
    }
  };

  const admins = members.filter((user) => user.role?.roleName === "PORTAL_ADMIN");
  const organizers = members.filter((user) => user.role?.roleName === "ORGANIZER");
  const staffs = members.filter((user) => user.role?.roleName === "Staff");

  const roleBadge = (role) => {
    if (role === "PORTAL_ADMIN") return "bg-primary";
    if (role === "ORGANIZER") return "bg-success";
    if (role === "Staff") return "bg-warning text-dark";
    return "bg-secondary";
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
          Portal Team
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          View portal admins, organizers and staff members connected to this portal.
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
            <p className="admin-bento-label">Staff</p>
            <h2 className="admin-bento-value">{staffs.length}</h2>
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

export default OrganizerTeams;
