import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsCalendarEvent,
  BsPeople,
  BsPersonCheck,
  BsCreditCard,
  BsCashCoin,
  BsClockHistory,
  BsXCircle,
  BsGraphUp,
} from "react-icons/bs";

function Reports() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPortalEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventReport(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchPortalEvents = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const response = await api.get(`/events/portal/${portalId}`);
      const portalEvents = response.data || [];

      setEvents(portalEvents);

      if (portalEvents.length > 0) {
        setSelectedEventId(portalEvents[0].id);
      } else {
        setMessage("No events found for this portal.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Unable to load portal events.");
    }
  };

  const fetchEventReport = async (eventId) => {
    try {
      const response = await api.get(`/reports/event/${eventId}/summary`);
      setReport(response.data);
      setMessage("");
    } catch (error) {
      console.log(error);
      setReport(null);
      setMessage("Unable to load event report.");
    }
  };

  const cards = report
    ? [
        {
          title: "Total Registrations",
          value: report.totalRegistrations,
          icon: <BsPeople />,
        },
        {
          title: "Participants",
          value: report.participants,
          icon: <BsPersonCheck />,
        },
        {
          title: "Audience",
          value: report.audience,
          icon: <BsCalendarEvent />,
        },
        {
          title: "Checked In",
          value: report.checkedIn,
          icon: <BsGraphUp />,
        },
        {
          title: "Paid",
          value: report.paid,
          icon: <BsCreditCard />,
        },
        {
          title: "Free",
          value: report.free,
          icon: <BsCashCoin />,
        },
        {
          title: "Pending",
          value: report.pending,
          icon: <BsClockHistory />,
        },
        {
          title: "Failed",
          value: report.failed,
          icon: <BsXCircle />,
        },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="admin-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Reports
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View event reports based on the selected portal event.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          style={{ borderRadius: "10px", fontSize: "15px" }}
          onClick={fetchPortalEvents}
        >
          Refresh
        </button>
      </div>

      <div className="admin-bento-card mb-4">
        <div className="row align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: "15px" }}>
              Select Portal Event
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

          <div className="col-md-6 mt-3 mt-md-0">
            <div
              className="p-3 rounded-4"
              style={{ background: "#f4f6f9" }}
            >
              <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                Current Report
              </p>
              <h2 className="fw-bold mb-0" style={{ fontSize: "22px" }}>
                {report?.eventName || "No event selected"}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      {report && (
        <>
          <div className="admin-stat-grid row g-4 mb-4">
            {cards.map((card) => (
              <div className="col-md-3" key={card.title}>
                <div className="admin-bento-card">
                  <div className="admin-bento-icon">{card.icon}</div>
                  <p className="admin-bento-label">{card.title}</p>
                  <h2 className="admin-bento-value">{card.value ?? 0}</h2>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-bento-card">
            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Report Summary
            </h2>

            <div className="row">
              <div className="col-md-6">
                <p style={{ fontSize: "15px" }}>
                  <strong>Event:</strong> {report.eventName}
                </p>
                <p style={{ fontSize: "15px" }}>
                  <strong>Total Registrations:</strong>{" "}
                  {report.totalRegistrations}
                </p>
                <p style={{ fontSize: "15px" }}>
                  <strong>Checked In:</strong> {report.checkedIn}
                </p>
              </div>

              <div className="col-md-6">
                <p style={{ fontSize: "15px" }}>
                  <strong>Participants:</strong> {report.participants}
                </p>
                <p style={{ fontSize: "15px" }}>
                  <strong>Audience:</strong> {report.audience}
                </p>
                <p style={{ fontSize: "15px" }}>
                  <strong>Payment:</strong> Paid {report.paid}, Free{" "}
                  {report.free}, Pending {report.pending}, Failed{" "}
                  {report.failed}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default Reports;
