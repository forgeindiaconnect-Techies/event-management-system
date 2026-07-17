import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import { getDefaultBanner } from "../utils/bannerUtils";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";
import {
  BsCalendarEvent,
  BsGeoAlt,
  BsTicketPerforated,
  BsCashCoin,
  BsThreeDotsVertical,
  BsSearch,
} from "react-icons/bs";

function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("Drafts");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const organizerId = Number(localStorage.getItem("userId"));

    try {
      const response = await api.get(`/events/organizer/${organizerId}`);
      setEvents(response.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load organizer events.");
    }
  };

  const updateStatus = async (id, action) => {
    try {
      await api.put(`/events/${id}/${action}`);
      loadEvents();
    } catch (error) {
      console.log(error);
      setMessage("Unable to update event status.");
    }
  };

  const filterEvents = () => {
    const now = new Date();

    return events.filter((event) => {
      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);

      const matchesSearch = event.eventName
        ?.toLowerCase()
        .includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "All") return event.status !== "TRASHED";
      if (activeTab === "Drafts") return event.status === "DRAFT";
      if (activeTab === "Published") return event.status === "PUBLISHED";
      if (activeTab === "Cancelled") return event.status === "CANCELLED";
      if (activeTab === "Trash") return event.status === "TRASHED";
      if (activeTab === "Upcoming")
        return event.status === "PUBLISHED" && start > now;
      if (activeTab === "Running")
        return event.status === "PUBLISHED" && start <= now && end >= now;
      if (activeTab === "Past")
        return event.status === "COMPLETED" || end < now;

      return true;
    });
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return "Date not added";

    return new Date(dateTime).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    "Running",
    "Upcoming",
    "Published",
    "Drafts",
    "Past",
    "Cancelled",
    "All",
    "Trash",
  ];

  const filteredEvents = filterEvents();

  return (
    <OrganizerLayout>
      <div className="organizer-my-events-page">
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            My Events
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View and manage events assigned to you.
          </p>
        </div>

        <button
          className="organizer-create-event-button btn btn-primary"
          onClick={() => navigate("/create-event")}
          style={{ borderRadius: "10px", fontSize: "15px", padding: "8px 18px" }}
        >
          + Create Event
        </button>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      <div className="organizer-events-filter admin-bento-card mb-4">
        <div className="organizer-scroll-tabs d-flex gap-4 border-bottom mb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              className="btn border-0 rounded-0 px-0 pb-2"
              style={{
                color: activeTab === tab ? "#2563eb" : "#374151",
                borderBottom:
                  activeTab === tab
                    ? "3px solid #2563eb"
                    : "3px solid transparent",
                fontWeight: activeTab === tab ? "700" : "500",
                fontSize: "15px",
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className="organizer-search d-flex align-items-center border rounded px-3"
          style={{ width: "360px", height: "42px", backgroundColor: "#fff" }}
        >
          <BsSearch className="me-2 text-primary" />  

          <input
            className="form-control border-0 shadow-none p-0"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "15px" }}
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="organizer-events-empty admin-bento-card text-center py-5">
          <h2 className="fw-bold" style={{ fontSize: "22px" }}>
            No events found
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
            No events available in {activeTab}.
          </p>
        </div>
      ) : (
        <div className="organizer-events-list row g-4">
          {filteredEvents.map((event) => (
            <div className="col-lg-3 col-md-4 col-sm-6" key={event.id}>
              <div
               className="card border-0 h-100 event-card"
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="position-relative">
                  <img
  src={event.bannerUrl || getDefaultBanner(event.eventType)}
  alt={event.eventName}
  className="card-img-top event-card-image"
  style={{
    height: "145px",
    objectFit: "cover",
  }}
/>

                  <span
                    className="badge bg-dark position-absolute"
                    style={{ right: "10px", bottom: "10px" }}
                  >
                    {event.eventMode}
                  </span>
                </div>

                <div className="card-body p-3">
  <h5
    className="fw-bold mb-3"
    style={{
      fontSize: "18px",
      minHeight: "48px",
    }}
  >
    {event.eventName}
  </h5>

  <p className="mb-2 text-muted d-flex align-items-center gap-2">
    <BsCalendarEvent color="#7c3aed" />
    {formatDate(event.startDateTime)}
  </p>

  <p className="mb-2 text-muted d-flex align-items-center gap-2">
    <BsGeoAlt color="#ef4444" />
    {event.venue || "Location not added"}
  </p>

  <p className="mb-2 text-muted d-flex align-items-center gap-2">
    <BsTicketPerforated color="#f59e0b" />
    {event.availableSeats} seats left
  </p>

  <p className="mb-3 text-muted d-flex align-items-center gap-2">
    <BsCashCoin color="#16a34a" />
    {event.paid ? `₹${event.ticketPrice}` : "Free"}
  </p>

  <div className="d-flex justify-content-between align-items-center">
    <span className="badge bg-secondary">
      {event.status}
    </span>

    <div className="dropdown">
      <button
        className="btn btn-light btn-sm rounded-circle"
        data-bs-toggle="dropdown"
        onClick={(e) => e.stopPropagation()}
      >
        <BsThreeDotsVertical />
      </button>

      
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${event.id}`);
                            }}
                          >
                            View
                          </button>
                        </li>

                        {event.status === "DRAFT" && (
                          <li>
                            <button
                              className="dropdown-item text-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(event.id, "publish");
                              }}
                            >
                              Publish
                            </button>
                          </li>
                        )}

                        {event.status === "PUBLISHED" && (
                          <>
                            <li>
                              <button
                                className="dropdown-item text-warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(event.id, "complete");
                                }}
                              >
                                Complete
                              </button>
                            </li>

                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(event.id, "cancel");
                                }}
                              >
                                Cancel
                              </button>
                            </li>
                          </>
                        )}

                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(event.id, "trash");
                            }}
                          >
                            Move to Trash
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </OrganizerLayout>
  );
}

export default OrganizerEvents;
