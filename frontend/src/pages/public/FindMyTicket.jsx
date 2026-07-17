import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import logo from "../../assets/images/fic-logo.png";
import UserProfileMenu from "../../components/Public/UserProfileMenu";
import { QRCodeCanvas } from "qrcode.react";
import {
  BsArrowRight,
  BsCalendarEvent,
  BsEnvelope,
  BsGeoAlt,
  BsSearch,
  BsTelephone,
  BsTicketPerforated,
} from "react-icons/bs";

function FindMyTicket() {
  const [form, setForm] = useState({
    eventName: "",
    emailOrPhone: "",
  });
  const [tickets, setTickets] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const searchTickets = async (event) => {
    event.preventDefault();

    if (!form.eventName.trim() || !form.emailOrPhone.trim()) {
      setMessage("Enter event name and email or phone number.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSearched(true);

      const response = await api.get("/tickets/search", {
        params: {
          eventName: form.eventName.trim(),
          emailOrPhone: form.emailOrPhone.trim(),
        },
      });

      setTickets(response.data || []);
    } catch (error) {
      console.log(error);
      setTickets([]);
      setMessage("Unable to search tickets. Please check the details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="find-ticket-page" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <nav
        className="public-flow-navbar d-flex justify-content-between align-items-center px-5"
        style={{
          height: "68px",
          background: "#030712",
          color: "#fff",
        }}
      >
        <Link to="/" className="d-flex align-items-center gap-3 text-white text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#ffffff",
              overflow: "hidden",
              padding: "4px",
            }}
          >
            <img src={logo} alt="FIC BackRooms" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <strong style={{ fontSize: "22px" }}>FIC BackRooms</strong>
        </Link>

        <div className="public-flow-navbar-actions d-flex align-items-center gap-4">
          <Link to="/find-events" className="public-nav-link text-white text-decoration-none">
            Find Events
          </Link>
          <UserProfileMenu dark />
        </div>
      </nav>

      <section className="find-ticket-hero"
        style={{
          background: "linear-gradient(135deg,#030712,#2e1065)",
          color: "#fff",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="badge bg-primary mb-3">Ticket Lookup</span>
              <h1 className="fw-bold mb-3" style={{ fontSize: "42px" }}>
                Find My Ticket
              </h1>
              <p className="mb-0" style={{ color: "#d1d5db", fontSize: "17px", maxWidth: "560px" }}>
                Search using the event name you registered for and the email or
                phone number used during booking.
              </p>
            </div>

            <div className="col-lg-6">
              <form onSubmit={searchTickets} className="bg-white rounded-4 shadow p-4 text-dark">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Event Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <BsCalendarEvent />
                    </span>
                    <input
                      className="form-control"
                      name="eventName"
                      placeholder="Example: Product Launch"
                      value={form.eventName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email or Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <BsEnvelope />
                    </span>
                    <input
                      className="form-control"
                      name="emailOrPhone"
                      placeholder="you@example.com or 9876543210"
                      value={form.emailOrPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {message && <div className="alert alert-info py-2">{message}</div>}

                <button className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Searching..." : "Find Ticket"} <BsSearch className="ms-2" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <main className="public-flow-main container py-5">
        <div className="public-flow-section-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Your Tickets</h2>
            <p className="text-muted mb-0">
              Matching ticket records will appear here.
            </p>
          </div>
          <Link to="/find-events" className="btn btn-outline-primary">
            Browse Events
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="text-muted mt-3">Searching tickets...</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className="row g-4">
            {tickets.map((ticket) => (
              <TicketResultCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-4 shadow-sm p-5 text-center">
            <BsTicketPerforated size={48} className="text-primary mb-3" />
            <h4 className="fw-bold">
              {searched ? "No ticket found" : "Search your booked ticket"}
            </h4>
            <p className="text-muted mb-0">
              {searched
                ? "Check the event name, email, or phone number and try again."
                : "Enter your booking details above to view your ticket."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function TicketResultCard({ ticket }) {
  const registration = ticket.registration || {};
  const event = registration.event || {};
  const participant = registration.participant || {};

  return (
    <div className="col-lg-4 col-md-6">
      <div className="find-ticket-result bg-white rounded-4 shadow-sm h-100 overflow-hidden border">
        <div
          className="p-4 text-white"
          style={{ background: "linear-gradient(135deg,#071b4d,#4c1d95)" }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <span className="badge bg-light text-primary mb-2">
                {ticket.status || "ACTIVE"}
              </span>
              <h4 className="fw-bold mb-1">{event.eventName || "Event"}</h4>
              <p className="mb-0" style={{ color: "#d1d5db" }}>
                Ticket #{ticket.ticketNumber || ticket.id}
              </p>
            </div>

            <div className="bg-white rounded-3 p-2">
              <QRCodeCanvas
                value={ticket.qrCode || `REG-${registration.id}-${ticket.ticketNumber || ""}`}
                size={76}
                level="H"
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          <InfoLine icon={<BsCalendarEvent />} text={formatDate(event.startDateTime)} />
          <InfoLine icon={<BsGeoAlt />} text={event.venue || "Online"} />
          <InfoLine
            icon={<BsEnvelope />}
            text={participant.email || "Email not available"}
          />
          <InfoLine
            icon={<BsTelephone />}
            text={participant.phoneNumber || "Phone not available"}
          />

          <div className="d-grid mt-4">
            <Link
              to={`/public/ticket/${registration.id}`}
              className="btn btn-primary"
            >
              Open Ticket <BsArrowRight className="ms-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ icon, text }) {
  return (
    <div className="d-flex align-items-center gap-2 text-muted mb-2">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "Date not added";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default FindMyTicket;
