import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "../styles/Admin.css";

function CreateEvent() {
  const navigate = useNavigate();
const role = localStorage.getItem("role");
const normalizedRole = role?.toUpperCase();
const [categorySearch, setCategorySearch] = useState("");
const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
const [customCategory, setCustomCategory] = useState("");

  const [event, setEvent] = useState({
    eventName: "",
    description: "",
    eventType: "",
    eventMode: "IN_PERSON",
    startDateTime: "",
    endDateTime: "",
    venue: "",
    meetingLink: "",
    capacity: "",
    registrationDeadline: "",
    paid: false,
    ticketPrice: 0,
    certificateEnabled: false,
    certificateTitle: "",
    bannerUrl: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvent({ ...event, [name]: type === "checkbox" ? checked : value });
  };

  const selectMode = (mode) => {
    setEvent({ ...event, eventMode: mode });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!event.eventType) {
      alert("Please select an event category.");
      return;
    }

    if (event.eventType === "Other" && !customCategory.trim()) {
      alert("Please enter your event category.");
      return;
    }

    try {
      const isOrganizer = normalizedRole === "ORGANIZER";

      await api.post("/events", {
        ...event,
        eventType: event.eventType === "Other" ? customCategory.trim() : event.eventType,
        capacity: Number(event.capacity),
        availableSeats: Number(event.capacity),
        ticketPrice: event.paid ? Number(event.ticketPrice) : 0,
      });

      alert("Event created successfully");
      navigate(isOrganizer ? "/organizer/events" : "/admin/events");
    } catch (error) {
      console.log("Create event failed:", error.response?.data || error);
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to create event");
    }
  };

  const categoryGroups = [
  {
    heading: "Education",
    categories: ["College Fest", "Technical Symposium", "Cultural Event", "Sports Meet", "Hackathon", "Workshop", "Seminar", "Webinar", "Conference"],
  },
  {
    heading: "Business",
    categories: ["Product Launch", "Startup Event", "Corporate Training", "Networking Event", "Exhibition", "Expo"],
  },
  {
    heading: "Career",
    categories: ["Job Fair", "Career Fair", "Alumni Meet"],
  },
  {
    heading: "Public & Community",
    categories: ["Public Awareness Event", "Charity Event", "Community Meetup"],
  },
  {
    heading: "Food",
    categories: ["Food Festival", "Cooking Workshop", "Restaurant Launch", "Food Expo", "Catering Event"],
  },
  {
    heading: "Music & Entertainment",
    categories: ["Music Concert", "Live Music", "Music Festival", "DJ Night", "Dance Show", "Comedy Show", "Film Screening"],
  },
  {
    heading: "Fitness & Wellness",
    categories: ["Fitness", "Yoga", "Marathon", "Cycling", "Zumba", "Gym Workshop", "Wellness Retreat"],
  },
  {
    heading: "Medical",
    categories: ["Medical Camp", "Health Awareness Event", "Blood Donation Camp", "Healthcare Conference", "Wellness Workshop"],
  },
  {
    heading: "Sports & Physical",
    categories: ["Sports", "Physical"],
  },
  {
    heading: "Others",
    categories: ["Other"],
  },
];

const filteredCategoryGroups = categoryGroups
  .map((group) => ({
    ...group,
    categories: group.categories.filter((category) =>
      category.toLowerCase().includes(categorySearch.toLowerCase())
    ),
  }))
  .filter((group) => group.categories.length > 0);

  return (
    <div
      className="create-event-page min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="create-event-dialog bg-white shadow-lg"
        style={{
          width: "82%",
          maxWidth: "1250px",
          borderRadius: "10px",
          overflow: "hidden"
        }}
      >
        <div className="create-event-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
          <h4 className="mb-0 fw-semibold">Create Event</h4>
          <button type="button" aria-label="Close" className="btn fs-3 p-0" onClick={() => navigate(-1)}>
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-event-body row g-0">
            <div className="create-event-main col-md-9 p-4">
              <div className="create-event-modes row mb-4">
                <ModeCard
                  title="In-person"
                  text="Conduct an event in a physical venue for face-to-face networking"
                  active={event.eventMode === "IN_PERSON"}
                  onClick={() => selectMode("IN_PERSON")}
                />

                <ModeCard
                  title="Virtual"
                  text="Host a digital event that engages participants who join remotely"
                  active={event.eventMode === "VIRTUAL"}
                  onClick={() => selectMode("VIRTUAL")}
                />

                <ModeCard
                  title="Hybrid"
                  text="Expand your in-person event to reach a wider audience"
                  active={event.eventMode === "HYBRID"}
                  onClick={() => selectMode("HYBRID")}
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <label className="form-label fw-semibold">
                    Event Name <span className="text-danger">*</span>
                  </label>
                  <span className="fw-semibold">
                    {event.eventName.length} / 255
                  </span>
                </div>

                <input
                  className="form-control"
                  name="eventName"
                  maxLength="255"
                  value={event.eventName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3 position-relative">
  <label className="form-label fw-semibold">Category</label>

  <div
    className="form-control d-flex justify-content-between align-items-center"
    style={{ cursor: "pointer", height: "42px" }}
    onClick={() => {
      setShowCategoryDropdown(!showCategoryDropdown);
      setCategorySearch("");
    }}
  >
    <span>{event.eventType || "Select category"}</span>
    <span className="fw-semibold">v</span>
  </div>

  {showCategoryDropdown && (
    <div
      className="position-absolute bg-white border shadow-sm w-100 mt-1 p-2"
      style={{
        zIndex: 30,
        maxHeight: "320px",
        overflowY: "auto",
        borderRadius: "8px",
      }}
    >
      <input
        className="form-control mb-2"
        placeholder="Search"
        value={categorySearch}
        autoFocus
        onChange={(e) => setCategorySearch(e.target.value)}
      />

      {filteredCategoryGroups.map((group) => (
        <div key={group.heading}>
          <div
            className="px-2 py-2 fw-bold text-uppercase text-muted"
            style={{ fontSize: "12px", background: "#f8fafc" }}
          >
            {group.heading}
          </div>

          {group.categories.map((category) => (
            <button
              type="button"
              key={category}
              className="dropdown-item py-2"
              onClick={() => {
                setEvent({ ...event, eventType: category });
                if (category !== "Other") setCustomCategory("");
                setCategorySearch("");
                setShowCategoryDropdown(false);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      ))}

      {filteredCategoryGroups.length === 0 && (
        <div className="text-muted px-3 py-2">No category found</div>
      )}
    </div>
  )}
</div>

              {event.eventType === "Other" && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Enter Event Category <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Example: Pet Show, Fashion Event, Book Fair"
                    maxLength="100"
                    required
                  />
                  <small className="text-muted">Enter the category that best describes your event.</small>
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Start Date & Time</label>
                  <input
                    className="form-control"
                    type="datetime-local"
                    name="startDateTime"
                    value={event.startDateTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">End Date & Time</label>
                  <input
                    className="form-control"
                    type="datetime-local"
                    name="endDateTime"
                    value={event.endDateTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {event.eventMode !== "VIRTUAL" && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Venue</label>
                  <input
                    className="form-control"
                    name="venue"
                    value={event.venue}
                    onChange={handleChange}
                  />
                </div>
              )}

              {event.eventMode !== "IN_PERSON" && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Meeting Link</label>
                  <input
                    className="form-control"
                    name="meetingLink"
                    value={event.meetingLink}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Capacity</label>
                  <input
                    className="form-control"
                    type="number"
                    name="capacity"
                    value={event.capacity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Registration Deadline
                  </label>
                  <input
                    className="form-control"
                    type="datetime-local"
                    name="registrationDeadline"
                    value={event.registrationDeadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="paid"
                      checked={event.paid}
                      onChange={handleChange}
                    />
                    <label className="form-check-label fw-semibold">
                      Paid Event
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="certificateEnabled"
                      checked={event.certificateEnabled}
                      onChange={handleChange}
                    />
                    <label className="form-check-label fw-semibold">
                      Certificate Enabled
                    </label>
                  </div>
                </div>
              </div>

              {event.paid && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Ticket Price</label>
                  <input
                    className="form-control"
                    type="number"
                    name="ticketPrice"
                    value={event.ticketPrice}
                    onChange={handleChange}
                  />
                </div>
              )}

              {event.certificateEnabled && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Certificate Title</label>
                  <input
                    className="form-control"
                    name="certificateTitle"
                    value={event.certificateTitle}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">Banner URL</label>
                <input
                  className="form-control"
                  name="bannerUrl"
                  value={event.bannerUrl}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div
              className="create-event-aside col-md-3 p-4 border-start"
              style={{ backgroundColor: "#f4f6fb" }}
            >
              <div className="text-center mb-4" style={{ fontSize: "80px" }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm fw-bold" style={{ width: "96px", height: "96px", color: "#4f46e5", fontSize: "28px" }}>
                  CAL
                </div>
              </div>

              <h3 className="fw-semibold">Create your event</h3>

              <p style={{ fontSize: "15px", lineHeight: "1.6" }}>
                Start creating your event by providing the basic details now and
                fill in what your event is all about later.
              </p>

              <p className="text-primary fw-semibold">
                Complete event setup after creation
              </p>
            </div>
          </div>

          <div className="create-event-footer d-flex justify-content-end gap-2 px-4 py-3 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary px-4">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModeCard({ title, text, active, onClick }) {
  return (
    <div className="create-event-mode-card col-md-4 mb-2">
      <div
        onClick={onClick}
        className="p-3 h-100"
        style={{
          border: active ? "1.5px solid #4f46e5" : "1px solid #dee2e6",
          borderRadius: "8px",
          cursor: "pointer",
          backgroundColor: active ? "#f1f4ff" : "#fff"
        }}
      >
        <div className="d-flex align-items-start gap-2">
          <span className={active ? "bg-primary rounded-circle mt-1" : "border rounded-circle mt-1"} style={{ width: "12px", height: "12px", display: "inline-block", flex: "0 0 12px" }} />
          <div>
            <h5 className="fw-semibold mb-2">{title}</h5>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
              {text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;

