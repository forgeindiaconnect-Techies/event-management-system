import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsPeople,
  BsPersonCheck,
  BsPersonX,
  BsSearch,
  BsArrowClockwise,
  BsTrash,
} from "react-icons/bs";

function OrganizerStaff() {
  const [staffs, setStaffs] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadStaffs();
  }, []);

  const loadStaffs = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const response = await api.get(`/users/portal/${portalId}`);

      const staffUsers = (response.data || []).filter(
        (user) => user.role?.roleName === "Staff"
      );

      setStaffs(staffUsers);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load staff members.");
    }
  };

  const deleteStaff = async (staff) => {
    const confirmed = window.confirm(
      `Delete ${staff.firstName || "this"} ${staff.lastName || "staff member"}? This account will lose portal access.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${staff.id}`);
      setMessage("Staff member deleted successfully.");
      await loadStaffs();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data || "Unable to delete the staff member.");
    }
  };

  const filteredStaffs = staffs.filter((staff) => {
    const fullName = `${staff.firstName || ""} ${staff.lastName || ""}`.toLowerCase();
    const email = staff.email?.toLowerCase() || "";
    return fullName.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const activeCount = staffs.filter((staff) => staff.active).length;
  const inactiveCount = staffs.filter((staff) => !staff.active).length;

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Staff Members
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View staff members connected to your portal.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={loadStaffs}
          style={{ borderRadius: "10px", fontSize: "15px" }}
        >
          <BsArrowClockwise /> Refresh
        </button>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      <div className="organizer-stat-grid row g-4 mb-4">
        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPeople />
            </div>
            <p className="admin-bento-label">Total Staff</p>
            <h2 className="admin-bento-value">{staffs.length}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonCheck />
            </div>
            <p className="admin-bento-label">Active Staff</p>
            <h2 className="admin-bento-value">{activeCount}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonX />
            </div>
            <p className="admin-bento-label">Inactive Staff</p>
            <h2 className="admin-bento-value">{inactiveCount}</h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <div className="organizer-section-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
              Staff List
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
              Search staff by name or email.
            </p>
          </div>

          <div
            className="d-flex align-items-center border rounded px-3 organizer-search"
            style={{ width: "330px", height: "42px", background: "#fff" }}
          >
            <BsSearch className="me-2 text-primary" />
            <input
              className="form-control border-0 shadow-none p-0"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: "15px" }}
            />
          </div>
        </div>

        {filteredStaffs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              No staff members found.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: "15px" }}>#</th>
                  <th style={{ fontSize: "15px" }}>Name</th>
                  <th style={{ fontSize: "15px" }}>Email</th>
                  <th style={{ fontSize: "15px" }}>Phone</th>
                  <th style={{ fontSize: "15px" }}>Role</th>
                  <th style={{ fontSize: "15px" }}>Status</th>
                  <th style={{ fontSize: "15px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaffs.map((staff, index) => (
                  <tr key={staff.id}>
                    <td style={{ fontSize: "15px" }}>{index + 1}</td>

                    <td style={{ fontSize: "15px" }}>
                      <strong>
                        {staff.firstName} {staff.lastName}
                      </strong>
                    </td>

                    <td style={{ fontSize: "15px" }}>{staff.email}</td>

                    <td style={{ fontSize: "15px" }}>
                      {staff.phoneNumber || "Not added"}
                    </td>

                    <td>
                      <span className="badge bg-primary">
                        {staff.role?.roleName}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          staff.active ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {staff.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteStaff(staff)}
                        title="Delete staff member"
                      >
                        <BsTrash /> Delete
                      </button>
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

export default OrganizerStaff;
