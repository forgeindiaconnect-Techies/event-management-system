import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMapMarkerAlt
} from "react-icons/fa";
import { getDefaultBanner } from "../../utils/bannerUtils";

function EventCard({ event }) {
  const navigate = useNavigate();

  const formatDate = (value) => {
    if (!value) return "Date to be announced";

    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <article
      className="card h-100 bg-white border shadow-sm"
      style={{
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <div className="position-relative">
        <img
          src={
            event.bannerUrl ||
            getDefaultBanner(event.eventType)
          }
          alt={event.eventName}
          className="w-100"
          style={{
            height: "190px",
            objectFit: "cover"
          }}
        />

        <span
          className="badge bg-white text-dark position-absolute"
          style={{
            top: "12px",
            left: "12px",
            fontSize: "11px"
          }}
        >
          {event.eventType || "Event"}
        </span>
      </div>

      <div className="card-body d-flex flex-column p-3">
        <div className="d-flex justify-content-between gap-2 mb-2">
          <h3
            className="fw-bold mb-0"
            style={{
              fontSize: "17px",
              lineHeight: 1.4
            }}
          >
            {event.eventName}
          </h3>

          <span
            className="text-success fw-semibold flex-shrink-0"
            style={{ fontSize: "13px" }}
          >
            {event.paid
              ? `INR ${event.ticketPrice}`
              : "Free"}
          </span>
        </div>

        <p
          className="text-muted mb-3"
          style={{
            minHeight: "40px",
            fontSize: "13px",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {event.description ||
            "Event information will be shared by the organizer."}
        </p>

        <EventInformation icon={<FaCalendarAlt />}>
          {formatDate(
            event.startDateTime || event.startDate
          )}
        </EventInformation>

        <EventInformation icon={<FaMapMarkerAlt />}>
          {event.eventMode === "VIRTUAL"
            ? "Online"
            : event.venue || "Venue to be announced"}
        </EventInformation>

        <div className="mt-auto pt-3">
          <button
  className="btn btn-primary w-100"
  style={{
    fontSize: "13px",
    height: "38px"
  }}
  onClick={() => navigate(`/public/events/${event.id}`)}
>
  View Event
</button>
        </div>
      </div>
    </article>
  );
}

function EventInformation({ icon, children }) {
  return (
    <div
      className="d-flex align-items-start gap-2 text-secondary mb-2"
      style={{ fontSize: "13px" }}
    >
      <span className="text-danger mt-1">
        {icon}
      </span>

      <span>{children}</span>
    </div>
  );
}

export default EventCard;