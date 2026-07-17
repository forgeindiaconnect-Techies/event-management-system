import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsPeople,
  BsPersonCheck,
  BsPersonX,
  BsSearch,
  BsArrowClockwise,
} from "react-icons/bs";

function CoordinatorAttendance() {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const coordRes = await api.get(
        `/coordinator-assignments/coordinator/${coordinatorId}`
      );

      const assignments = coordRes.data || [];

      const registrationResults = await Promise.all(
        assignments.map((assignment) =>
          api.get(`/registrations/event/${assignment.event?.id}`)
        )
      );

      setRegistrations(registrationResults.flatMap((res) => res.data || []));
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load attendance.");
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const name = `${reg.participant?.firstName || ""} ${
      reg.participant?.lastName || ""
    }`.toLowerCase();

    const email = reg.participant?.email?.toLowerCase() || "";
    const eventName = reg.event?.eventName?.toLowerCase() || "";

    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      eventName.includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "Present") return reg.attended === true;
    if (filter === "Absent") return reg.attended === false;

    return true;
  });

  const total = registrations.length;
  const present = registrations.filter((reg) => reg.attended).length;
  const absent = registrations.filter((reg) => !reg.attended).length;

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Attendance
          </h1>
          <p className="text-muted mb-0">
            View attendance for events coordinated by you.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadAttendance}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPeople />
            </div>
            <p className="admin-bento-label">Total Attendees</p>
            <h2 className="admin-bento-value">{total}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonCheck />
            </div>
            <p className="admin-bento-label">Present</p>
            <h2 className="admin-bento-value">{present}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonX />
            </div>
            <p className="admin-bento-label">Absent</p>
            <h2 className="admin-bento-value">{absent}</h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <div
              className="d-flex align-items-center border rounded px-3"
              style={{ height: "44px", background: "#fff" }}
            >
              <BsSearch className="me-2 text-primary" />
              <input
                className="form-control border-0 shadow-none p-0"
                placeholder="Search attendee, email or event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ height: "44px" }}
            >
              <option>All</option>
              <option>Present</option>
              <option>Absent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Attendance List
        </h2>

        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No attendance records found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Attendee</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Attendance</th>
                </tr>
              </thead>

              <tbody>
                {filteredRegistrations.map((reg, index) => (
                  <tr key={reg.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>
                        {reg.participant?.firstName} {reg.participant?.lastName}
                      </strong>
                    </td>
                    <td>{reg.participant?.email || "N/A"}</td>
                    <td>{reg.event?.eventName || "N/A"}</td>
                    <td>
                      <span className="badge bg-primary">
                        {reg.registrationType}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          reg.attended ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {reg.attended ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}

export default CoordinatorAttendance;
