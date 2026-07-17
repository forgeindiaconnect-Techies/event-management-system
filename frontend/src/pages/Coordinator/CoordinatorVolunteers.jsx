import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsPeople,
  BsSearch,
  BsArrowClockwise,
  BsCalendarEvent,
} from "react-icons/bs";

function CoordinatorVolunteers() {
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const coordRes = await api.get(
        `/coordinator-assignments/coordinator/${coordinatorId}`
      );

      const assignments = coordRes.data || [];

      const volunteerResults = await Promise.all(
        assignments.map((assignment) =>
          api.get(`/volunteer-assignments/event/${assignment.event?.id}`)
        )
      );

      const volunteerList = volunteerResults.flatMap((res) => res.data || []);

      setVolunteerAssignments(volunteerList);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load volunteers.");
    }
  };

  const filteredVolunteers = volunteerAssignments.filter((assignment) => {
    const name = `${assignment.volunteer?.firstName || ""} ${
      assignment.volunteer?.lastName || ""
    }`.toLowerCase();

    const email = assignment.volunteer?.email?.toLowerCase() || "";
    const eventName = assignment.event?.eventName?.toLowerCase() || "";
    const duty = assignment.duty?.toLowerCase() || "";

    return (
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      eventName.includes(search.toLowerCase()) ||
      duty.includes(search.toLowerCase())
    );
  });

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Volunteers
          </h1>
          <p className="text-muted mb-0">
            View volunteers assigned to your coordinated events.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadVolunteers}>
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
            <p className="admin-bento-label">Total Volunteers</p>
            <h2 className="admin-bento-value">
              {volunteerAssignments.length}
            </h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsCalendarEvent />
            </div>
            <p className="admin-bento-label">Assigned Events</p>
            <h2 className="admin-bento-value">
              {
                new Set(
                  volunteerAssignments
                    .map((item) => item.event?.id)
                    .filter(Boolean)
                ).size
              }
            </h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card mb-4">
        <div
          className="d-flex align-items-center border rounded px-3"
          style={{ height: "44px", background: "#fff", maxWidth: "420px" }}
        >
          <BsSearch className="me-2 text-primary" />
          <input
            className="form-control border-0 shadow-none p-0"
            placeholder="Search volunteer, email, event or duty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Volunteer List
        </h2>

        {filteredVolunteers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsPeople size={55} className="mb-3" />
            <p>No volunteers found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Volunteer</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Duty</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredVolunteers.map((assignment, index) => (
                  <tr key={assignment.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>
                        {assignment.volunteer?.firstName}{" "}
                        {assignment.volunteer?.lastName}
                      </strong>
                    </td>
                    <td>{assignment.volunteer?.email || "N/A"}</td>
                    <td>{assignment.event?.eventName || "N/A"}</td>
                    <td>{assignment.duty || "General duty"}</td>
                    <td>
                      <span
                        className={`badge ${
                          assignment.active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {assignment.active ? "Active" : "Inactive"}
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

export default CoordinatorVolunteers;
