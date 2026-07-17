import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/Admin.css";
import {
  BsPeople,
  BsPersonCheck,
  BsPersonX,
  BsSearch,
  BsArrowClockwise,
} from "react-icons/bs";

function Attendees() {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const portalId = localStorage.getItem("portalId");
      const response = await api.get(`/registrations/portal/${portalId}`);
      setRegistrations(response.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load attendees.");
    }
  };

  const filteredRegistrations = registrations.filter((registration) => {
    const fullName = `${registration.participant?.firstName || ""} ${
      registration.participant?.lastName || ""
    }`.toLowerCase();

    const email = registration.participant?.email?.toLowerCase() || "";
    const eventName = registration.event?.eventName?.toLowerCase() || "";

    return (
      fullName.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      eventName.includes(search.toLowerCase())
    );
  });

  const presentCount = registrations.filter((r) => r.attended).length;
  const absentCount = registrations.filter((r) => !r.attended).length;

  return (
    <AdminLayout>
      <div className="admin-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Attendee Profiles
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View attendee registrations and attendance status.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={fetchRegistrations}
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

      <div className="admin-stat-grid row g-4 mb-4">
        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPeople />
            </div>
            <p className="admin-bento-label">Total Attendees</p>
            <h2 className="admin-bento-value">{registrations.length}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonCheck />
            </div>
            <p className="admin-bento-label">Present</p>
            <h2 className="admin-bento-value">{presentCount}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonX />
            </div>
            <p className="admin-bento-label">Absent</p>
            <h2 className="admin-bento-value">{absentCount}</h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <div className="admin-section-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
              Registrations
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
              Search attendees by name, email, or event.
            </p>
          </div>

          <div
            className="admin-search-box d-flex align-items-center border rounded px-3"
            style={{ width: "330px", height: "42px", background: "#fff" }}
          >
            <BsSearch className="me-2 text-muted" />
            <input
              className="form-control border-0 shadow-none p-0"
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: "15px" }}
            />
          </div>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              No attendees found.
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
                  <th style={{ fontSize: "15px" }}>Event</th>
                  <th style={{ fontSize: "15px" }}>Attendance</th>
                </tr>
              </thead>

              <tbody>
                {filteredRegistrations.map((registration, index) => (
                  <tr key={registration.id}>
                    <td style={{ fontSize: "15px" }}>{index + 1}</td>

                    <td style={{ fontSize: "15px" }}>
                      <strong>
                        {registration.participant?.firstName}{" "}
                        {registration.participant?.lastName}
                      </strong>
                    </td>

                    <td style={{ fontSize: "15px" }}>
                      {registration.participant?.email || "Not available"}
                    </td>

                    <td style={{ fontSize: "15px" }}>
  {registration.participant?.phoneNumber || "Not available"}
</td>

                    <td style={{ fontSize: "15px" }}>
                      {registration.event?.eventName || "Event not available"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          registration.attended ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {registration.attended ? "Present" : "Absent"}
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

export default Attendees;
