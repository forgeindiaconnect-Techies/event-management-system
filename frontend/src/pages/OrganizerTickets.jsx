import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsTicketPerforated,
  BsSearch,
  BsArrowClockwise,
  BsQrCode,
} from "react-icons/bs";

function OrganizerTickets() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOrganizerEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTickets(selectedEventId);
    }
  }, [selectedEventId]);

  const loadOrganizerEvents = async () => {
    const organizerId = Number(localStorage.getItem("userId"));

    try {
      const res = await api.get(`/events/organizer/${organizerId}`);
      const myEvents = res.data || [];

      setEvents(myEvents);

      if (myEvents.length > 0) {
        setSelectedEventId(myEvents[0].id);
      } else {
        setMessage("No events assigned to you.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Unable to load events.");
    }
  };

  const loadTickets = async (eventId) => {
    try {
      const res = await api.get(`/tickets/event/${eventId}`);
      setTickets(res.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setTickets([]);
      setMessage("Unable to load tickets.");
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const participant = ticket.registration?.participant;
    const fullName = `${participant?.firstName || ""} ${
      participant?.lastName || ""
    }`.toLowerCase();

    const email = participant?.email?.toLowerCase() || "";
    const ticketNo = ticket.ticketNumber?.toLowerCase() || "";

    return (
      fullName.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      ticketNo.includes(search.toLowerCase())
    );
  });

  const activeTickets = tickets.filter((t) => t.status === "ACTIVE").length;
  const usedTickets = tickets.filter((t) => t.status === "USED").length;
  const cancelledTickets = tickets.filter((t) => t.status === "CANCELLED").length;

  const downloadTicket = (ticket) => {
    const participant = ticket.registration?.participant;
    const event = ticket.registration?.event;

    const rows = [
      ["Ticket Number", ticket.ticketNumber],
      ["Participant", `${participant?.firstName || ""} ${participant?.lastName || ""}`],
      ["Email", participant?.email || "N/A"],
      ["Event", event?.eventName || "N/A"],
      ["Type", ticket.registration?.registrationType || "N/A"],
      ["Payment", ticket.registration?.paymentStatus || "N/A"],
      ["QR Code", ticket.qrCode || "N/A"],
      ["Status", ticket.status],
    ];

    const content = rows.map((row) => row.join(": ")).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${ticket.ticketNumber}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Tickets
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View generated tickets and QR details for your events.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={() => selectedEventId && loadTickets(selectedEventId)}
          style={{ borderRadius: "10px", fontSize: "15px" }}
        >
          <BsArrowClockwise /> Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="admin-bento-card mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Select Event</label>
            <select
              className="form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
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
            <label className="form-label fw-semibold">Search Ticket</label>
            <div
              className="d-flex align-items-center border rounded px-3 organizer-search"
              style={{ height: "44px", background: "#fff" }}
            >
              <BsSearch className="me-2 text-primary" />
              <input
                className="form-control border-0 shadow-none p-0"
                placeholder="Name, email or ticket number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="organizer-stat-grid row g-4 mb-4">
        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsTicketPerforated />
            </div>
            <p className="admin-bento-label">Total Tickets</p>
            <h2 className="admin-bento-value">{tickets.length}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsTicketPerforated />
            </div>
            <p className="admin-bento-label">Active</p>
            <h2 className="admin-bento-value">{activeTickets}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsTicketPerforated />
            </div>
            <p className="admin-bento-label">Used</p>
            <h2 className="admin-bento-value">{usedTickets}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsTicketPerforated />
            </div>
            <p className="admin-bento-label">Cancelled</p>
            <h2 className="admin-bento-value">{cancelledTickets}</h2>
          </div>
        </div>
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Ticket List
        </h2>

        {filteredTickets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No tickets found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Ticket No</th>
                  <th>Participant</th>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>QR</th>
                  <th>Download</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.ticketNumber}</td>
                    <td>
                      {ticket.registration?.participant?.firstName}{" "}
                      {ticket.registration?.participant?.lastName}
                    </td>
                    <td>{ticket.registration?.event?.eventName}</td>
                    <td>
                      <span className="badge bg-primary">
                        {ticket.registration?.registrationType}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        {ticket.registration?.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{ticket.status}</span>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-2">
                        <BsQrCode /> {ticket.qrCode}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => downloadTicket(ticket)}
                      >
                        Download
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

export default OrganizerTickets;
