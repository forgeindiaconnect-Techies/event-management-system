import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import logo from "../../assets/images/fic-logo.png";
import UserProfileMenu from "../../components/Public/UserProfileMenu";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BsArrowRight,
  BsCalendarEvent,
  BsEnvelope,
  BsGeoAlt,
  BsSearch,
  BsTelephone,
  BsTicketPerforated,
  BsFilm,
  BsTv,
  BsClock,
  BsDownload,
  BsPrinter,
  BsX,
  BsCheckCircleFill,
  BsBuilding,
  BsCreditCard2Back,
} from "react-icons/bs";

function FindMyTicket() {
  const [activeTab, setActiveTab] = useState("events"); // "events" | "movies"

  const [eventForm, setEventForm] = useState({
    eventName: "",
    emailOrPhone: "",
  });

  const [movieForm, setMovieForm] = useState({
    movieTitle: "",
    emailOrPhone: "",
  });

  const [eventTickets, setEventTickets] = useState([]);
  const [movieTickets, setMovieTickets] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searchedTab, setSearchedTab] = useState("events");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedMovieTicket, setSelectedMovieTicket] = useState(null);

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMovieChange = (e) => {
    const { name, value } = e.target;
    setMovieForm((prev) => ({ ...prev, [name]: value }));
  };

  const searchEventTickets = async (e) => {
    e.preventDefault();
    if (!eventForm.eventName.trim() || !eventForm.emailOrPhone.trim()) {
      setMessage("Please enter the event name and your email or phone number.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSearched(true);
      setSearchedTab("events");

      const response = await api.get("/tickets/search", {
        params: {
          eventName: eventForm.eventName.trim(),
          emailOrPhone: eventForm.emailOrPhone.trim(),
        },
      });

      setEventTickets(response.data || []);
    } catch (error) {
      console.error("Event ticket search error:", error);
      setEventTickets([]);
      setMessage("Unable to find event tickets. Please check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchMovieTickets = async (e) => {
    e.preventDefault();
    if (!movieForm.movieTitle.trim() && !movieForm.emailOrPhone.trim()) {
      setMessage("Please enter either the movie name/booking ID or your phone number.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSearched(true);
      setSearchedTab("movies");

      let results = [];
      try {
        const response = await api.get("/theater/tickets/search", {
          params: {
            movieTitle: movieForm.movieTitle.trim(),
            emailOrPhone: movieForm.emailOrPhone.trim(),
          },
        });
        if (response.data && Array.isArray(response.data)) {
          results = response.data;
        }
      } catch (searchErr) {
        console.warn("Dedicated movie search error, attempting sales-history fallback:", searchErr);
      }

      // If empty or error, fallback to sales-history with local client filter
      if (!results || results.length === 0) {
        try {
          const historyRes = await api.get("/theater/sales-history");
          const allSales = historyRes.data || [];
          const qTitle = movieForm.movieTitle.trim().toLowerCase();
          const qContact = movieForm.emailOrPhone.trim().toLowerCase();
          const phoneDigits = qContact.replace(/\D/g, "");

          results = allSales.filter((t) => {
            let matchTitle = true;
            let matchContact = true;

            if (qTitle) {
              const tTitle = (t.movieTitle || "").toLowerCase();
              const tId = (t.ticketId || "").toLowerCase();
              matchTitle = tTitle.includes(qTitle) || tId.includes(qTitle);
            }

            if (qContact) {
              const tPhone = (t.customerPhone || "").replace(/\D/g, "");
              const tEmail = (t.customerEmail || "").toLowerCase();
              const tCust = (t.customerName || "").toLowerCase();
              const tId = (t.ticketId || "").toLowerCase();

              matchContact =
                (phoneDigits && tPhone.includes(phoneDigits)) ||
                tEmail.includes(qContact) ||
                tCust.includes(qContact) ||
                tId.includes(qContact);
            }

            return matchTitle && matchContact;
          });
        } catch (historyErr) {
          console.error("Sales-history fallback error:", historyErr);
        }
      }

      setMovieTickets(results);
    } catch (error) {
      console.error("Movie ticket search error:", error);
      setMovieTickets([]);
      setMessage("Unable to find movie tickets. Please check the details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="find-ticket-page" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Navbar */}
      <nav
        className="public-flow-navbar d-flex justify-content-between align-items-center px-4 px-md-5"
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

        <div className="public-flow-navbar-actions d-flex align-items-center gap-3 gap-md-4">
          <Link to="/find-events" className="public-nav-link text-white text-decoration-none d-none d-sm-inline">
            Find Events
          </Link>
          <UserProfileMenu dark />
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="find-ticket-hero py-5"
        style={{
          background: "linear-gradient(135deg, #030712 0%, #1e1b4b 50%, #2e1065 100%)",
          color: "#fff",
        }}
      >
        <div className="container py-2">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6">
              <span className="badge bg-primary px-3 py-2 rounded-pill mb-3" style={{ fontSize: "13px" }}>
                ✨ Universal Ticket Lookup
              </span>
              <h1 className="fw-bold mb-3" style={{ fontSize: "40px", letterSpacing: "-0.5px" }}>
                Find My Tickets
              </h1>
              <p className="mb-4" style={{ color: "#d1d5db", fontSize: "16px", maxWidth: "540px", lineHeight: "1.6" }}>
                Retrieve both your <strong>Event Passes</strong> and <strong>Cinema Movie Tickets</strong> booked online
                or at the counter anytime with instant QR gate entry and digital PDF download.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-10 px-3 py-2 rounded-pill">
                  🎪 Live Events & Workshops
                </span>
                <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-10 px-3 py-2 rounded-pill">
                  🎬 Cinema & Multiplex Shows
                </span>
                <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-10 px-3 py-2 rounded-pill">
                  📱 Instant M-Ticket & PDF
                </span>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="bg-white rounded-4 shadow-lg p-4 text-dark border">
                {/* Mode Selector Tabs */}
                <div className="d-flex p-1 bg-light rounded-pill mb-4 border">
                  <button
                    type="button"
                    className={`btn flex-fill rounded-pill fw-bold py-2 ${
                      activeTab === "events"
                        ? "btn-primary shadow-sm text-white"
                        : "btn-light text-muted"
                    }`}
                    style={{ fontSize: "14px", transition: "all 0.2s ease" }}
                    onClick={() => {
                      setActiveTab("events");
                      setMessage("");
                    }}
                  >
                    <BsCalendarEvent className="me-2" /> Event Tickets
                  </button>
                  <button
                    type="button"
                    className={`btn flex-fill rounded-pill fw-bold py-2 ${
                      activeTab === "movies"
                        ? "btn-primary shadow-sm text-white"
                        : "btn-light text-muted"
                    }`}
                    style={{ fontSize: "14px", transition: "all 0.2s ease" }}
                    onClick={() => {
                      setActiveTab("movies");
                      setMessage("");
                    }}
                  >
                    <BsFilm className="me-2" /> Cinema Movie Tickets
                  </button>
                </div>

                {/* Event Form */}
                {activeTab === "events" ? (
                  <form onSubmit={searchEventTickets}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted text-uppercase mb-1">
                        Event Name
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <BsCalendarEvent className="text-primary" />
                        </span>
                        <input
                          className="form-control border-start-0 ps-0"
                          name="eventName"
                          placeholder="Example: Tech Summit, Musical Concert"
                          value={eventForm.eventName}
                          onChange={handleEventChange}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted text-uppercase mb-1">
                        Email or Phone Number
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <BsEnvelope className="text-primary" />
                        </span>
                        <input
                          className="form-control border-start-0 ps-0"
                          name="emailOrPhone"
                          placeholder="you@example.com or 9876543210"
                          value={eventForm.emailOrPhone}
                          onChange={handleEventChange}
                        />
                      </div>
                    </div>

                    {message && (
                      <div className="alert alert-info py-2 small mb-3">
                        {message}
                      </div>
                    )}

                    <button className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                      {loading && searchedTab === "events" ? "Searching Events..." : "Find Event Ticket"}
                      <BsSearch className="ms-2" />
                    </button>
                  </form>
                ) : (
                  /* Movie Form */
                  <form onSubmit={searchMovieTickets}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted text-uppercase mb-1">
                        Movie Title or Booking ID
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <BsFilm className="text-primary" />
                        </span>
                        <input
                          className="form-control border-start-0 ps-0"
                          name="movieTitle"
                          placeholder="Example: Paradise, Mandadi, or FIC-TKT-511268"
                          value={movieForm.movieTitle}
                          onChange={handleMovieChange}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted text-uppercase mb-1">
                        Phone Number or Email
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <BsTelephone className="text-primary" />
                        </span>
                        <input
                          className="form-control border-start-0 ps-0"
                          name="emailOrPhone"
                          placeholder="9876543210 or customer email"
                          value={movieForm.emailOrPhone}
                          onChange={handleMovieChange}
                        />
                      </div>
                    </div>

                    {message && (
                      <div className="alert alert-info py-2 small mb-3">
                        {message}
                      </div>
                    )}

                    <button className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                      {loading && searchedTab === "movies" ? "Searching Cinema..." : "Find Movie Ticket"}
                      <BsSearch className="ms-2" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Results Section */}
      <main className="public-flow-main container py-5">
        <div className="public-flow-section-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "26px" }}>
              {activeTab === "events"
                ? `Event Tickets ${eventTickets.length > 0 ? `(${eventTickets.length})` : ""}`
                : `Cinema Movie Tickets ${movieTickets.length > 0 ? `(${movieTickets.length})` : ""}`}
            </h2>
            <p className="text-muted mb-0">
              {activeTab === "events"
                ? "Matching event registrations and entry passes appear below."
                : "Matching cinema bookings, seat numbers, and M-Tickets appear below."}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/find-events" className="btn btn-outline-primary btn-sm px-3 rounded-pill">
              Browse Events
            </Link>
            <Link to="/" className="btn btn-outline-dark btn-sm px-3 rounded-pill">
              Cinema & Shows
            </Link>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border p-5">
            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
            <p className="text-muted mt-3 mb-0 fw-medium">
              Searching {activeTab === "events" ? "event registrations" : "cinema ticket records"}...
            </p>
          </div>
        ) : activeTab === "events" ? (
          /* EVENT TICKETS RENDERING */
          eventTickets.length > 0 ? (
            <div className="row g-4">
              {eventTickets.map((ticket) => (
                <TicketResultCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-4 shadow-sm p-5 text-center border">
              <BsTicketPerforated size={48} className="text-primary mb-3 opacity-75" />
              <h4 className="fw-bold">
                {searched && searchedTab === "events" ? "No Event Tickets Found" : "Search Your Event Tickets"}
              </h4>
              <p className="text-muted mb-3" style={{ maxWidth: "480px", margin: "0 auto" }}>
                {searched && searchedTab === "events"
                  ? "We couldn't locate event tickets with these details. Check the event title and registered email/phone."
                  : "Enter your registered event name and email or phone number in the form above."}
              </p>
              {searched && searchedTab === "events" && (
                <button
                  type="button"
                  className="btn btn-link text-decoration-none fw-semibold"
                  onClick={() => {
                    setActiveTab("movies");
                    setMessage("");
                  }}
                >
                  Looking for a movie ticket instead? Switch to Movie Tickets &rarr;
                </button>
              )}
            </div>
          )
        ) : (
          /* MOVIE TICKETS RENDERING */
          movieTickets.length > 0 ? (
            <div className="row g-4">
              {movieTickets.map((ticket, idx) => (
                <MovieTicketResultCard
                  key={ticket.id || ticket.ticketId || idx}
                  ticket={ticket}
                  onViewTicket={(t) => setSelectedMovieTicket(t)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-4 shadow-sm p-5 text-center border">
              <BsFilm size={48} className="text-primary mb-3 opacity-75" />
              <h4 className="fw-bold">
                {searched && searchedTab === "movies" ? "No Movie Tickets Found" : "Search Your Cinema Tickets"}
              </h4>
              <p className="text-muted mb-3" style={{ maxWidth: "480px", margin: "0 auto" }}>
                {searched && searchedTab === "movies"
                  ? "We couldn't locate movie tickets with those details. Make sure your phone number or booking reference matches your booking."
                  : "Enter your movie title or booking reference ID (e.g. FIC-TKT-...) and phone number above."}
              </p>
              {searched && searchedTab === "movies" && (
                <button
                  type="button"
                  className="btn btn-link text-decoration-none fw-semibold"
                  onClick={() => {
                    setActiveTab("events");
                    setMessage("");
                  }}
                >
                  Looking for an event pass instead? Switch to Event Tickets &rarr;
                </button>
              )}
            </div>
          )
        )}
      </main>

      {/* Cinema M-Ticket Modal for View & Download */}
      {selectedMovieTicket && (
        <MovieTicketModal
          ticket={selectedMovieTicket}
          onClose={() => setSelectedMovieTicket(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// EVENT TICKET CARD
// ----------------------------------------------------
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

// ----------------------------------------------------
// MOVIE TICKET CARD
// ----------------------------------------------------
function MovieTicketResultCard({ ticket, onViewTicket }) {
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const handleDownloadPdf = async (e) => {
    e.stopPropagation();
    try {
      setDownloading(true);
      const element = cardRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, pdfHeight);
      pdf.save(`MovieTicket-${ticket.ticketId || ticket.id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="col-lg-4 col-md-6">
      <div
        ref={cardRef}
        className="movie-ticket-card bg-white rounded-4 shadow-sm h-100 overflow-hidden border d-flex flex-column"
        style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
      >
        {/* Cinema Dark Header */}
        <div
          className="p-4 text-white position-relative"
          style={{
            background: "linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #311042 100%)",
            borderBottom: "2px dashed rgba(255,255,255,0.15)",
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: "11px" }}>
                <BsFilm className="me-1" /> CINEMA PASS
              </span>
              <span className="badge bg-success bg-opacity-75 text-white px-2 py-1" style={{ fontSize: "11px" }}>
                {ticket.status || "CONFIRMED"}
              </span>
            </div>

            <div className="bg-white rounded-3 p-2 shadow-sm">
              <QRCodeCanvas
                value={ticket.ticketId ? `FIC-MOVIE:${ticket.ticketId}` : `TKT-${ticket.id}`}
                size={70}
                level="M"
              />
            </div>
          </div>

          <h4 className="fw-bold mb-1 text-white text-truncate" title={ticket.movieTitle}>
            {ticket.movieTitle || "Movie"}
          </h4>
          <p className="small mb-0 text-white-50 font-monospace">
            Booking ID: #{ticket.ticketId || ticket.id}
          </p>
        </div>

        {/* Ticket Details */}
        <div className="p-4 flex-fill d-flex flex-column justify-content-between">
          <div>
            <InfoLine
              icon={<BsBuilding />}
              text={ticket.theaterName || "Gopal Multiplex"}
            />
            <InfoLine
              icon={<BsTv />}
              text={ticket.screenName || "Screen 1"}
            />
            <InfoLine
              icon={<BsClock />}
              text={`${formatShowDate(ticket.date)} • ${ticket.time || "Showtime"}`}
            />
            <div className="d-flex align-items-center gap-2 mb-2 text-dark">
              <span className="text-primary">
                <BsTicketPerforated />
              </span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-bold">
                Seats: {ticket.seats || "Selected Seats"}
              </span>
            </div>
            <InfoLine
              icon={<BsTelephone />}
              text={`${ticket.customerName || "Customer"}${
                ticket.customerPhone ? " • " + ticket.customerPhone : ""
              }`}
            />
            <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-3">
              <span className="text-muted small">Total Paid:</span>
              <span className="fw-bold text-dark fs-6">
                ₹{Number(ticket.amount || 0).toFixed(2)}{" "}
                <span className="badge bg-light text-muted border small ms-1">
                  {ticket.paymentMode || "Paid"}
                </span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row g-2 mt-4 pt-2">
            <div className="col-6">
              <button
                type="button"
                className="btn btn-outline-primary w-100 btn-sm py-2 fw-semibold"
                onClick={() => onViewTicket(ticket)}
              >
                View M-Ticket
              </button>
            </div>
            <div className="col-6">
              <button
                type="button"
                className="btn btn-primary w-100 btn-sm py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <BsDownload /> {downloading ? "Saving..." : "PDF Ticket"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MOVIE TICKET MODAL (VIEW & PRINT & DOWNLOAD)
// ----------------------------------------------------
function MovieTicketModal({ ticket, onClose }) {
  const modalTicketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const element = modalTicketRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 15, 15, pdfWidth - 30, pdfHeight);
      pdf.save(`CinemaTicket-${ticket.ticketId || ticket.id}.pdf`);
    } catch (err) {
      console.error("Modal ticket download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-dark text-white border-0 py-3 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0" style={{ fontSize: "17px" }}>
              <BsFilm className="text-warning" /> Cinema M-Ticket
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: "28px", height: "28px" }}
              onClick={onClose}
            >
              <BsX size={20} />
            </button>
          </div>

          {/* Printable Ticket Area */}
          <div className="modal-body p-4 bg-light">
            <div
              ref={modalTicketRef}
              className="bg-white rounded-4 shadow-sm border overflow-hidden p-4"
              style={{ position: "relative" }}
            >
              {/* Multiplex Brand */}
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <div>
                  <h6 className="fw-bold mb-0 text-primary">
                    {ticket.theaterName || "Gopal Multiplex"}
                  </h6>
                  <span className="small text-muted">
                    {ticket.screenName || "Audi Screen 1"}
                  </span>
                </div>
                <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-1">
                  <BsCheckCircleFill className="me-1" /> Confirmed
                </span>
              </div>

              {/* Movie Title */}
              <div className="text-center my-3">
                <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: "-0.5px" }}>
                  {ticket.movieTitle || "Movie"}
                </h3>
                <p className="text-muted small mb-0">
                  {formatShowDate(ticket.date)} &bull; {ticket.time || "09:30 AM"}
                </p>
              </div>

              {/* Seats highlight */}
              <div className="bg-light rounded-3 p-3 text-center my-3 border">
                <div className="text-muted small text-uppercase fw-semibold mb-1">
                  Confirmed Seats
                </div>
                <div className="fs-5 fw-bold text-primary font-monospace">
                  {ticket.seats || "Assigned Seats"}
                </div>
              </div>

              {/* QR Code */}
              <div className="d-flex flex-column align-items-center justify-content-center my-3 p-2">
                <div className="bg-white p-2 rounded-3 border shadow-sm">
                  <QRCodeCanvas
                    value={ticket.ticketId ? `FIC-MOVIE:${ticket.ticketId}` : `TKT-${ticket.id}`}
                    size={130}
                    level="H"
                  />
                </div>
                <span className="font-monospace text-muted small mt-2">
                  #{ticket.ticketId || ticket.id}
                </span>
                <span className="small text-muted" style={{ fontSize: "11px" }}>
                  Scan at Turnstile Gate Entry
                </span>
              </div>

              {/* Booking Info Table */}
              <div className="border-top pt-3 small text-muted">
                <div className="d-flex justify-content-between mb-1">
                  <span>Customer:</span>
                  <span className="fw-semibold text-dark">{ticket.customerName || "Customer"}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Phone:</span>
                  <span className="fw-semibold text-dark">{ticket.customerPhone || "N/A"}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Payment Mode:</span>
                  <span className="fw-semibold text-dark">{ticket.paymentMode || "UPI"}</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top mt-2">
                  <span className="fw-bold text-dark">Amount Paid:</span>
                  <span className="fw-bold text-primary fs-6">
                    ₹{Number(ticket.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Terms note */}
              <div
                className="mt-3 p-2 bg-light rounded text-center"
                style={{ fontSize: "10.5px", color: "#64748b" }}
              >
                Please arrive 15 minutes before showtime. Food & Beverages can be picked up at the counter.
              </div>
            </div>
          </div>

          {/* Modal Footer with Actions */}
          <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3"
              onClick={handlePrint}
            >
              <BsPrinter className="me-1" /> Print
            </button>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm px-4 fw-semibold"
                onClick={handleDownload}
                disabled={downloading}
              >
                <BsDownload className="me-1" /> {downloading ? "Generating PDF..." : "Download PDF"}
              </button>
              <button type="button" className="btn btn-light btn-sm px-3" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------
function InfoLine({ icon, text }) {
  return (
    <div className="d-flex align-items-center gap-2 text-muted mb-2 small">
      <span className="text-primary">{icon}</span>
      <span className="text-truncate">{text}</span>
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

function formatShowDate(dateStr) {
  if (!dateStr) return "Today's Show";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

export default FindMyTicket;
