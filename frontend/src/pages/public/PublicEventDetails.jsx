import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BsArrowLeft,
  BsArrowRight,
  BsCalendarEvent,
  BsCheckCircle,
  BsClock,
  BsGeoAlt,
  BsGlobe2,
  BsInfoCircle,
  BsPeople,
  BsTag,
  BsTicketPerforated,
} from "react-icons/bs";
import api from "../../api/axiosConfig";
import logo from "../../assets/images/fic-logo.png";
import UserProfileMenu from "../../components/Public/UserProfileMenu";
import { getDefaultBanner } from "../../utils/bannerUtils";

function PublicEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    api.get(`/events/public/${id}`)
      .then((response) => setEvent(response.data))
      .catch((error) => console.log(error));
  }, [id]);

  if (!event) {
    return <div className="container py-5">Loading event...</div>;
  }

  const banner = event.bannerUrl || getDefaultBanner(event.eventType);
  const tabs = ["Overview", "Agenda", "Speakers", "Sponsors"];
  const isOnline = event.eventMode === "VIRTUAL";
  const isHybrid = event.eventMode === "HYBRID";
  const ticketPrice = event.paid
    ? `₹${Number(event.ticketPrice || 0).toLocaleString("en-IN")}`
    : "Free";

  return (
    <div className="public-event-page">
      <style>{eventDetailsStyles}</style>

      <nav className="event-public-nav d-flex justify-content-between align-items-center px-5">
        <Link to="/" className="d-flex align-items-center gap-3 text-white text-decoration-none">
          <div className="event-public-logo">
            <img src={logo} alt="FIC BackRooms" />
          </div>
          <strong className="event-public-brand">FIC BackRooms</strong>
        </Link>
        <div className="d-flex align-items-center gap-4">
          <Link to="/find-events" className="text-white text-decoration-none">Explore Events</Link>
          <UserProfileMenu dark />
        </div>
      </nav>

      <section
        className="event-detail-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(3,7,18,.96), rgba(30,27,75,.78), rgba(76,29,149,.35)), url(${banner})` }}
      >
        <div className="container event-detail-hero-content">
          <button className="event-back-button" onClick={() => navigate("/find-events")}>
            <BsArrowLeft /> Back to Events
          </button>

          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="event-hero-chip"><BsTag /> {event.eventType || "Event"}</span>
            <span className="event-hero-chip"><BsGlobe2 /> {formatMode(event.eventMode)}</span>
            <span className={`event-hero-chip ${event.paid ? "paid" : "free"}`}>
              <BsTicketPerforated /> {ticketPrice}
            </span>
          </div>

          <h1 className="event-detail-title">{event.eventName}</h1>
          <p className="event-detail-summary">
            {event.description || "Event details will be updated soon."}
          </p>
          <div className="event-hero-meta">
            <span><BsCalendarEvent /> {formatDate(event.startDateTime)}</span>
            <span><BsGeoAlt /> {isOnline ? "Online event" : event.venue || "Venue to be announced"}</span>
          </div>
        </div>
      </section>

      <main className="container event-detail-main">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="event-content-card">
              <div className="event-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`event-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "Overview" && (
                <div className="event-overview">
                  <div className="event-section-heading">
                    <span><BsInfoCircle /></span>
                    <div>
                      <small>EVENT OVERVIEW</small>
                      <h2>About this event</h2>
                    </div>
                  </div>

                  <p className="event-about-copy">
                    {event.description || "No description available."}
                  </p>

                  <h5 className="event-subheading">Basic details</h5>
                  <div className="event-basic-grid">
                    <DetailTile icon={<BsTag />} label="Category" value={event.eventType} />
                    <DetailTile icon={<BsGlobe2 />} label="Event mode" value={formatMode(event.eventMode)} />
                    <DetailTile icon={<BsCalendarEvent />} label="Starts" value={formatDate(event.startDateTime)} />
                    <DetailTile icon={<BsClock />} label="Ends" value={formatDate(event.endDateTime)} />
                    <DetailTile icon={<BsGeoAlt />} label={isOnline ? "Access" : "Venue"} value={isOnline ? "Online event" : event.venue} />
                    <DetailTile icon={<BsPeople />} label="Capacity" value={event.capacity ? `${event.capacity} attendees` : "Not specified"} />
                    <DetailTile icon={<BsCalendarEvent />} label="Registration closes" value={formatDate(event.registrationDeadline)} />
                    <DetailTile icon={<BsTicketPerforated />} label="Ticket" value={ticketPrice} />
                  </div>

                  {(isOnline || isHybrid) && event.meetingLink && (
                    <div className="event-access-note">
                      <BsGlobe2 />
                      <div>
                        <strong>Online access available</strong>
                        <span>The joining link is provided during registration.</span>
                      </div>
                    </div>
                  )}

                  {event.certificateEnabled && (
                    <div className="event-certificate-note">
                      <BsCheckCircle />
                      Certificate available{event.certificateTitle ? ` — ${event.certificateTitle}` : ""}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Agenda" && <EmptyTab title="Agenda" text="Agenda details will be published by the organizer." />}
              {activeTab === "Speakers" && <EmptyTab title="Speakers" text="Speaker details will be announced soon." />}
              {activeTab === "Sponsors" && <EmptyTab title="Sponsors" text="Sponsor details will be announced soon." />}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="event-booking-card sticky-top">
              <div className="event-booking-eyebrow">REGISTRATION</div>
              <div className="event-price">{ticketPrice}</div>
              <p className="text-muted small mb-4">per attendee</p>

              <Info icon={<BsCalendarEvent />} label="Starts" value={formatDate(event.startDateTime)} />
              <Info icon={<BsClock />} label="Ends" value={formatDate(event.endDateTime)} />
              <Info icon={<BsGeoAlt />} label={isOnline ? "Location" : "Venue"} value={isOnline ? "Online" : event.venue || "To be announced"} />
              <Info icon={<BsPeople />} label="Availability" value={`${event.availableSeats || 0} seats left`} />

              <button className="event-register-button" onClick={() => navigate(`/public/events/${event.id}/register`)}>
                Register Now <BsArrowRight />
              </button>

              <div className="event-ticket-note">
                <BsTicketPerforated /> Ticket is generated after successful registration.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailTile({ icon, label, value }) {
  return (
    <div className="event-detail-tile">
      <div className="event-detail-tile-icon">{icon}</div>
      <div>
        <div className="event-detail-tile-label">{label}</div>
        <div className="event-detail-tile-value">{value || "Not added"}</div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="event-side-info">
      <div className="event-side-icon">{icon}</div>
      <div>
        <div className="event-side-label">{label}</div>
        <div className="event-side-value">{value}</div>
      </div>
    </div>
  );
}

function EmptyTab({ title, text }) {
  return (
    <div className="event-empty-tab">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function formatDate(dateTime) {
  if (!dateTime) return "To be announced";
  return new Date(dateTime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMode(mode) {
  if (!mode) return "Not added";
  return mode
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const eventDetailsStyles = `
  .public-event-page{min-height:100vh;background:#f4f7fb;color:#111827}.event-public-nav{height:68px;background:#030712;color:#fff}.event-public-logo{width:44px;height:44px;border-radius:12px;background:#fff;overflow:hidden;padding:4px}.event-public-logo img{width:100%;height:100%;object-fit:contain}.event-public-brand{font-size:22px}.event-detail-hero{min-height:360px;background-position:center;background-size:cover;color:#fff}.event-detail-hero-content{padding-top:42px;padding-bottom:54px}.event-back-button{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);border-radius:10px;color:#fff;margin-bottom:28px;padding:9px 14px}.event-back-button:hover{background:#fff;color:#111827}.event-hero-chip{align-items:center;backdrop-filter:blur(8px);background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2);border-radius:999px;display:inline-flex;font-size:13px;font-weight:700;gap:7px;padding:7px 12px}.event-hero-chip.free{background:rgba(16,185,129,.22)}.event-hero-chip.paid{background:rgba(124,58,237,.35)}.event-detail-title{font-size:clamp(36px,5vw,58px);font-weight:800;letter-spacing:-.035em;line-height:1.05;margin:0 0 16px;max-width:850px}.event-detail-summary{color:#e5e7eb;font-size:17px;line-height:1.7;margin-bottom:22px;max-width:760px}.event-hero-meta{display:flex;flex-wrap:wrap;gap:18px 28px}.event-hero-meta span{align-items:center;display:flex;gap:9px;font-weight:600}.event-detail-main{padding-bottom:60px;padding-top:30px}.event-content-card,.event-booking-card{background:#fff;border:1px solid #e5eaf2;border-radius:20px;box-shadow:0 18px 48px rgba(15,23,42,.07)}.event-content-card{overflow:hidden}.event-tabs{border-bottom:1px solid #e5e7eb;display:flex;gap:8px;overflow-x:auto;padding:0 28px}.event-tab{background:none;border:0;border-bottom:3px solid transparent;color:#64748b;font-weight:650;padding:20px 15px 16px;white-space:nowrap}.event-tab.active{border-bottom-color:#7c3aed;color:#6d28d9}.event-overview{padding:30px}.event-section-heading{align-items:center;display:flex;gap:14px;margin-bottom:18px}.event-section-heading>span{align-items:center;background:#ede9fe;border-radius:12px;color:#7c3aed;display:flex;font-size:21px;height:46px;justify-content:center;width:46px}.event-section-heading small,.event-booking-eyebrow{color:#7c3aed;font-size:11px;font-weight:800;letter-spacing:.1em}.event-section-heading h2{font-size:26px;font-weight:800;margin:2px 0 0}.event-about-copy{color:#475569;font-size:16px;line-height:1.85;margin-bottom:30px}.event-subheading{font-weight:800;margin-bottom:15px}.event-basic-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}.event-detail-tile{align-items:flex-start;background:#f8fafc;border:1px solid #e5eaf2;border-radius:14px;display:flex;gap:12px;min-height:92px;padding:16px}.event-detail-tile-icon{align-items:center;background:#fff;border:1px solid #e5e7eb;border-radius:9px;color:#7c3aed;display:flex;flex:0 0 34px;height:34px;justify-content:center}.event-detail-tile-label,.event-side-label{color:#64748b;font-size:12px;margin-bottom:3px}.event-detail-tile-value,.event-side-value{color:#172033;font-weight:700;overflow-wrap:anywhere}.event-access-note,.event-certificate-note{align-items:center;border-radius:14px;display:flex;gap:13px;margin-top:18px;padding:15px 17px}.event-access-note{background:#eff6ff;color:#1d4ed8}.event-access-note span{display:block;font-size:13px;opacity:.8}.event-certificate-note{background:#ecfdf5;color:#047857;font-weight:700}.event-empty-tab{padding:40px 30px 60px}.event-empty-tab h3{font-weight:800}.event-empty-tab p{color:#64748b}.event-booking-card{padding:26px;top:86px}.event-price{font-size:38px;font-weight:850;letter-spacing:-.04em;margin-top:5px}.event-side-info{display:flex;gap:12px;margin-bottom:17px}.event-side-icon{color:#7c3aed;font-size:20px}.event-register-button{align-items:center;background:linear-gradient(135deg,#7c3aed,#5b21b6);border:0;border-radius:12px;color:#fff;display:flex;font-weight:750;gap:9px;height:50px;justify-content:center;margin-top:22px;width:100%}.event-register-button:hover{box-shadow:0 12px 24px rgba(109,40,217,.25);transform:translateY(-1px)}.event-ticket-note{background:#f8fafc;border-radius:12px;color:#64748b;font-size:13px;line-height:1.5;margin-top:14px;padding:13px}.event-ticket-note svg{color:#7c3aed;margin-right:6px}@media(max-width:767px){.event-public-nav{height:58px;padding-left:12px!important;padding-right:12px!important}.event-public-nav>a{gap:7px!important;min-width:0}.event-public-logo{border-radius:9px;height:34px;width:34px}.event-public-brand{display:block;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event-public-nav>div{gap:8px!important}.event-public-nav>div>a{font-size:12px;white-space:nowrap}.event-detail-hero{min-height:auto}.event-detail-hero-content{padding:28px 12px 36px}.event-back-button{font-size:13px;margin-bottom:20px;padding:8px 11px}.event-hero-chip{font-size:11px;padding:6px 9px}.event-detail-title{font-size:clamp(32px,10vw,42px);overflow-wrap:anywhere}.event-detail-summary{font-size:15px;line-height:1.6}.event-hero-meta{display:grid;gap:10px}.event-detail-main{padding:16px 12px 32px}.event-content-card,.event-booking-card{border-radius:17px}.event-tabs{gap:2px;padding:0 8px;scrollbar-width:none}.event-tabs::-webkit-scrollbar{display:none}.event-tab{font-size:13px;padding:16px 11px 13px}.event-overview{padding:20px 14px}.event-section-heading{gap:10px}.event-section-heading>span{flex:0 0 40px;height:40px;width:40px}.event-section-heading h2{font-size:22px}.event-about-copy{font-size:15px;line-height:1.7;margin-bottom:22px}.event-basic-grid{grid-template-columns:1fr}.event-detail-tile{min-height:82px;padding:13px}.event-access-note,.event-certificate-note{align-items:flex-start;padding:13px}.event-empty-tab{padding:28px 16px 40px}.event-booking-card{padding:20px 16px;position:static!important;top:auto}.event-price{font-size:34px}.event-register-button{height:50px}.event-ticket-note{font-size:12px}}
`;

export default PublicEventDetails;
