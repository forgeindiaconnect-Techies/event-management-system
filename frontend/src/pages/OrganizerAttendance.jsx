import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsPeople,
  BsPersonCheck,
  BsPersonX,
  BsGraphUp,
  BsSearch,
  BsArrowClockwise,
} from "react-icons/bs";

function OrganizerAttendance() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOrganizerEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const loadOrganizerEvents = async () => {
    const organizerId = Number(localStorage.getItem("userId"));

    try {
      const response = await api.get(`/events/organizer/${organizerId}`);
      const myEvents = response.data || [];

      setEvents(myEvents);

      if (myEvents.length > 0) {
        setSelectedEventId(myEvents[0].id);
      } else {
        setMessage("No events assigned to you.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Unable to load organizer events.");
    }
  };

  const loadRegistrations = async (eventId) => {
    try {
      const response = await api.get(`/registrations/event/${eventId}`);
      setRegistrations(response.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setRegistrations([]);
      setMessage("Unable to load attendance.");
    }
  };

  const markAttendance = async (registrationId) => {
    try {
      await api.put(`/registrations/${registrationId}/attendance`);
      loadRegistrations(selectedEventId);
    } catch (error) {
      console.log(error);
      setMessage("Unable to mark attendance.");
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const fullName = `${reg.participant?.firstName || ""} ${
      reg.participant?.lastName || ""
    }`.toLowerCase();

    const email = reg.participant?.email?.toLowerCase() || "";

    return (
      fullName.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())
    );
  });

  const total = registrations.length;
  const present = registrations.filter((reg) => reg.attended).length;
  const absent = registrations.filter((reg) => !reg.attended).length;
  const attendanceRate = total === 0 ? 0 : Math.round((present / total) * 100);

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Attendance
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            Mark and monitor attendance for your assigned events.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={() => selectedEventId && loadRegistrations(selectedEventId)}
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

      <div className="admin-bento-card mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: "15px" }}>
              Select Event
            </label>

            <select
              className="form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ height: "44px", fontSize: "15px" }}
            >
              {events.length === 0 && <option value="">No events found</option>}

              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: "15px" }}>
              Search Attendee
            </label>

            <div
              className="d-flex align-items-center border rounded px-3 organizer-search"
              style={{ height: "44px", background: "#fff" }}
            >
              <BsSearch className="me-2 text-primary" />
              <input
                className="form-control border-0 shadow-none p-0"
                placeholder="Name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: "15px" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="organizer-stat-grid row g-4 mb-4">
        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPeople />
            </div>
            <p className="admin-bento-label">Total</p>
            <h2 className="admin-bento-value">{total}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonCheck />
            </div>
            <p className="admin-bento-label">Present</p>
            <h2 className="admin-bento-value">{present}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPersonX />
            </div>
            <p className="admin-bento-label">Absent</p>
            <h2 className="admin-bento-value">{absent}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsGraphUp />
            </div>
            <p className="admin-bento-label">Attendance Rate</p>
            <h2 className="admin-bento-value">{attendanceRate}%</h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Attendance List
        </h2>

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
                  <th style={{ fontSize: "15px" }}>Attendee</th>
                  <th style={{ fontSize: "15px" }}>Email</th>
                  <th style={{ fontSize: "15px" }}>Type</th>
                  <th style={{ fontSize: "15px" }}>Attendance</th>
                  <th style={{ fontSize: "15px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRegistrations.map((reg, index) => (
                  <tr key={reg.id}>
                    <td style={{ fontSize: "15px" }}>{index + 1}</td>

                    <td style={{ fontSize: "15px" }}>
                      <strong>
                        {reg.participant?.firstName} {reg.participant?.lastName}
                      </strong>
                    </td>

                    <td style={{ fontSize: "15px" }}>
                      {reg.participant?.email || "Not available"}
                    </td>

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

                    <td>
                      {reg.attended ? (
                        <button className="btn btn-success btn-sm" disabled>
                          Present
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => markAttendance(reg.id)}
                        >
                          Mark Present
                        </button>
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

export default OrganizerAttendance;
