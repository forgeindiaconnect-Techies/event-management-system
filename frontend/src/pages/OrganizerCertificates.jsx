import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsAward,
  BsPeople,
  BsPersonCheck,
  BsDownload,
  BsSearch,
  BsArrowClockwise,
} from "react-icons/bs";

function OrganizerCertificates() {
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
      setMessage("Unable to load certificates.");
    }
  };

  const downloadCertificate = async (registrationId) => {
    try {
      const response = await api.get(`/certificates/${registrationId}/download`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "certificate.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      setMessage("Unable to download certificate.");
    }
  };

  const eligibleRegistrations = registrations.filter(
    (reg) => reg.attended === true && reg.event?.certificateEnabled === true
  );

  const filteredRegistrations = eligibleRegistrations.filter((reg) => {
    const fullName = `${reg.participant?.firstName || ""} ${
      reg.participant?.lastName || ""
    }`.toLowerCase();

    const email = reg.participant?.email?.toLowerCase() || "";

    return (
      fullName.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())
    );
  });

  const totalRegistrations = registrations.length;
  const presentCount = registrations.filter((reg) => reg.attended).length;
  const eligibleCount = eligibleRegistrations.length;

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Certificates
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            Download certificates for attendees who are present and eligible.
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
              Search Participant
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
        <div className="col-md-4">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsPeople />
            </div>
            <p className="admin-bento-label">Total Registrations</p>
            <h2 className="admin-bento-value">{totalRegistrations}</h2>
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
              <BsAward />
            </div>
            <p className="admin-bento-label">Eligible Certificates</p>
            <h2 className="admin-bento-value">{eligibleCount}</h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Eligible Certificates
        </h2>

        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
              No eligible certificates found.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ fontSize: "15px" }}>#</th>
                  <th style={{ fontSize: "15px" }}>Participant</th>
                  <th style={{ fontSize: "15px" }}>Email</th>
                  <th style={{ fontSize: "15px" }}>Event</th>
                  <th style={{ fontSize: "15px" }}>Status</th>
                  <th style={{ fontSize: "15px" }}>Download</th>
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

                    <td style={{ fontSize: "15px" }}>
                      {reg.event?.eventName}
                    </td>

                    <td>
                      <span className="badge bg-success">Eligible</span>
                    </td>

                    <td>
                      <button
                        className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                        onClick={() => downloadCertificate(reg.id)}
                      >
                        <BsDownload /> Download
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

export default OrganizerCertificates;
