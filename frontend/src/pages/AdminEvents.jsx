import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import AdminLayout from "../layouts/AdminLayout";
import { getDefaultBanner } from "../utils/bannerUtils";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("Drafts");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [organizers, setOrganizers] = useState([]);
  const [assigningEvent, setAssigningEvent] = useState(null);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchOrganizers();
  }, []);

  const fetchEvents = async () => {
  try {
    const portalId = localStorage.getItem("portalId");

    const response = await api.get(`/events/portal/${portalId}`);

    setEvents(response.data || []);
    setMessage("");
  } catch (error) {
    console.log(error);
    setMessage("Unable to load events.");
  }
};

  const fetchOrganizers = async () => {
    try {
      const portalId = localStorage.getItem("portalId");
      const response = await api.get(`/users/organizers/portal/${portalId}`);
      setOrganizers(response.data || []);
    } catch (error) {
      console.log(error);
      setOrganizers([]);
    }
  };

  const updateStatus = async (id, action) => {
    try {
      await api.put(`/events/${id}/${action}`);
      fetchEvents();
    } catch (error) {
      console.log(error);
      alert("Action failed");
    }
  };

  const openAssignOrganizer = (event) => {
    setAssigningEvent(event);
    setSelectedOrganizerId(event.organizer?.id ? String(event.organizer.id) : "");
  };

  const closeAssignOrganizer = () => {
    setAssigningEvent(null);
    setSelectedOrganizerId("");
    setAssigning(false);
  };

  const assignOrganizer = async () => {
    if (!assigningEvent || !selectedOrganizerId) {
      setMessage("Please select an organizer.");
      return;
    }

    try {
      setAssigning(true);
      await api.put(`/events/${assigningEvent.id}/assign-organizer/${selectedOrganizerId}`);
      await fetchEvents();
      setMessage("Organizer assigned successfully.");
      closeAssignOrganizer();
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Unable to assign organizer.");
      setAssigning(false);
    }
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

  {message && (
  <div className="alert alert-danger">
    {message}
  </div>
)}

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
      if (activeTab === "Past") return event.status === "COMPLETED" || end < now;

      return true;
    });
  };

  const tabs = ["Running", "Upcoming", "Published", "Drafts", "Past", "Cancelled", "All", "Trash"];
  const filteredEvents = filterEvents();

  return (
    <AdminLayout>
      <div className="admin-page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Events
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            Create, publish and manage portal events.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ fontSize: "16px", borderRadius: "10px", padding: "8px 18px" }}
          onClick={() => navigate("/create-event")}
        >
          + Create Event
        </button>
      </div>

      {message && (
        <div className="alert alert-info py-2">
          {message}
        </div>
      )}

      <div className="admin-events-toolbar bg-white rounded-4 shadow-sm p-3 mb-4">
        <div className="admin-scroll-tabs d-flex gap-4 border-bottom mb-3">
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
                fontSize: "16px",
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className="admin-search-box d-flex align-items-center border rounded px-3"
          style={{ width: "360px", height: "42px", backgroundColor: "#fff" }}
        >
          <span className="me-2">🔍</span>
          <input
            className="form-control border-0 shadow-none p-0"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-4 shadow-sm p-5 text-center">
          <h2 className="fw-bold" style={{ fontSize: "22px" }}>
            No events found
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            No events available in {activeTab}.
          </p>
        </div>
      ) : (
        <div className="admin-event-grid row g-4">
          {filteredEvents.map((event) => (
            <div className="col-md-4" key={event.id}>
              <div
                className="card border-0 shadow-sm h-100"
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
                    className="card-img-top"
                    style={{
                      height: "170px",
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

                <div className="card-body">
                  <h5 className="fw-bold mb-3" style={{ fontSize: "20px" }}>
                    {event.eventName}
                  </h5>

                  <p className="mb-2 text-muted" style={{ fontSize: "15px" }}>
                    📅 {formatDate(event.startDateTime)}
                  </p>

                  <p className="mb-2 text-muted" style={{ fontSize: "15px" }}>
                    📍 {event.venue || "Location not added"}
                  </p>

                  <p className="mb-2 text-muted" style={{ fontSize: "15px" }}>
                    🎫 {event.availableSeats} seats left
                  </p>

                  <p className="mb-3 text-muted" style={{ fontSize: "15px" }}>
                    💰 {event.paid ? `₹${event.ticketPrice}` : "Free"}
                  </p>

                  <p className="mb-3 text-muted" style={{ fontSize: "15px" }}>
                    Organizer:{" "}
                    <strong>
                      {event.organizer
                        ? `${event.organizer.firstName || ""} ${event.organizer.lastName || ""}`.trim()
                        : "Unassigned"}
                    </strong>
                  </p>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-secondary">{event.status}</span>

                    <div className="dropdown">
                      <button
                        className="btn btn-light btn-sm"
                        data-bs-toggle="dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⋮
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

                        <li>
                          <button
                            className="dropdown-item text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignOrganizer(event);
                            }}
                          >
                            Assign Organizer
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

      {assigningEvent && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(15, 23, 42, 0.55)" }}
          onClick={closeAssignOrganizer}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-semibold">Assign Organizer</h5>
                  <div className="text-muted small">{assigningEvent.eventName}</div>
                </div>
                <button type="button" className="btn-close" onClick={closeAssignOrganizer}></button>
              </div>

              <div className="modal-body">
                <label className="form-label fw-semibold">Organizer</label>
                <select
                  className="form-select"
                  value={selectedOrganizerId}
                  onChange={(e) => setSelectedOrganizerId(e.target.value)}
                >
                  <option value="">Select organizer</option>
                  {organizers.map((organizer) => (
                    <option key={organizer.id} value={organizer.id}>
                      {organizer.firstName} {organizer.lastName} - {organizer.email}
                    </option>
                  ))}
                </select>

                {organizers.length === 0 && (
                  <div className="text-muted small mt-2">
                    No organizers found in this portal.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeAssignOrganizer}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!selectedOrganizerId || assigning}
                  onClick={assignOrganizer}
                >
                  {assigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminEvents;
