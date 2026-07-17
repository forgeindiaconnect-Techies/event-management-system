import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsCalendarCheck,
  BsCheckCircle,
  BsPeople,
  BsPersonX,
  BsGraphUp,
  BsArrowClockwise,
} from "react-icons/bs";

function Analytics() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const eventRes = await api.get(`/events/portal/${portalId}`);
      const registrationRes = await api.get(`/registrations/portal/${portalId}`);

      setEvents(eventRes.data || []);
      setRegistrations(registrationRes.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load analytics data.");
    }
  };

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED").length;
  const completedEvents = events.filter((e) => e.status === "COMPLETED").length;
  const totalRegistrations = registrations.length;
  const presentCount = registrations.filter((r) => r.attended).length;
  const absentCount = registrations.filter((r) => !r.attended).length;

  const attendanceRate =
    totalRegistrations === 0
      ? 0
      : Math.round((presentCount / totalRegistrations) * 100);

  const cards = [
    {
      title: "Total Events",
      value: totalEvents,
      icon: <BsCalendarCheck />,
    },
    {
      title: "Published Events",
      value: publishedEvents,
      icon: <BsGraphUp />,
    },
    {
      title: "Completed Events",
      value: completedEvents,
      icon: <BsCheckCircle />,
    },
    {
      title: "Total Registrations",
      value: totalRegistrations,
      icon: <BsPeople />,
    },
    {
      title: "Present Attendees",
      value: presentCount,
      icon: <BsPeople />,
    },
    {
      title: "Absent Attendees",
      value: absentCount,
      icon: <BsPersonX />,
    },
  ];

  return (
    <AdminLayout>
      <div className="admin-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Analytics
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            Track event performance and attendee engagement for this portal.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={fetchAnalyticsData}
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

      <div className="admin-stat-grid row g-4 mb-4">
        {cards.map((card) => (
          <div className="col-md-4" key={card.title}>
            <div className="admin-bento-card">
              <div className="admin-bento-icon">{card.icon}</div>
              <p className="admin-bento-label">{card.title}</p>
              <h2 className="admin-bento-value">{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-page-grid row g-4">
        <div className="col-md-8">
          <div className="admin-bento-card h-100">
            <h2 className="fw-bold mb-2" style={{ fontSize: "22px" }}>
              Attendance Overview
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "15px" }}>
              Percentage of registered attendees who checked in.
            </p>

            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                height: "180px",
                borderRadius: "18px",
                background: "#f4f6f9",
              }}
            >
              <div className="text-center">
                <h1 className="fw-bold mb-1" style={{ fontSize: "56px" }}>
                  {attendanceRate}%
                </h1>
                <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
                  Attendance Rate
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card h-100">
            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Portal Insights
            </h2>

            <p style={{ fontSize: "15px" }}>
              <strong>Events:</strong> {totalEvents}
            </p>
            <p style={{ fontSize: "15px" }}>
              <strong>Registrations:</strong> {totalRegistrations}
            </p>
            <p style={{ fontSize: "15px" }}>
              <strong>Checked In:</strong> {presentCount}
            </p>
            <p style={{ fontSize: "15px" }}>
              <strong>Not Checked In:</strong> {absentCount}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Analytics;
