import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Admin.css";
import {
  BsCalendarEvent,
  BsPeople,
  BsPersonWorkspace,
  BsCheckCircle,
  BsArrowRight,
  BsPersonPlus,
  BsClipboardCheck,
  BsGraphUp,
} from "react-icons/bs";

function OrganizerDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");
  const [staffCount, setStaffCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const organizerId = Number(localStorage.getItem("userId"));
    const portalId = localStorage.getItem("portalId");

    if (!organizerId || !portalId) {
      setMessage("Unable to load organizer dashboard. Please login again.");
      return;
    }

    try {
      const [eventRes, regRes, usersRes] = await Promise.all([
        api.get(`/events/organizer/${organizerId}`),
        api.get(`/registrations/portal/${portalId}`),
        api.get(`/users/portal/${portalId}`),
      ]);

      const eventList = eventRes.data || [];
      const myEvents = eventList;

      const myEventIds = myEvents.map((event) => event.id);
      const registrationList = regRes.data || [];
      const myRegistrations = registrationList.filter((reg) =>
        myEventIds.includes(reg.event?.id)
      );
      const myStaff = (usersRes.data || []).filter(
        (user) => user.role?.roleName === "Staff"
      );

      setStaffCount(myStaff.length);
      setEvents(myEvents);
      setRegistrations(myRegistrations);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load organizer dashboard.");
    }
  };

  
  const draftEvents = events.filter((event) => event.status === "DRAFT").length;
  const publishedEvents = events.filter((event) => event.status === "PUBLISHED").length;
  const completedEvents = events.filter((event) => event.status === "COMPLETED").length;

  const cards = [
    {
      title: "My Events",
      value: events.length,
      icon: <BsCalendarEvent />,
      path: "/organizer/events",
    },
    {
      title: "Registrations",
      value: registrations.length,
      icon: <BsPeople />,
      path: "/organizer/registrations",
    },
    {
  title: "My Staff",
  value: staffCount,
  icon: <BsPersonWorkspace />,
  path: "/organizer/staff",
},
    {
      title: "Completed Events",
      value: completedEvents,
      icon: <BsCheckCircle />,
      path: "/organizer/events",
    },
  ];

  return (
    <OrganizerLayout>
      <div className="organizer-dashboard-heading mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
          Organizer Dashboard
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Manage your assigned events, registrations and attendance.
        </p>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      <div className="organizer-dashboard-stats row g-4 mb-4">
        {cards.map((card) => (
          <div className="col-md-3" key={card.title}>
            <Link to={card.path} className="text-decoration-none text-dark" aria-label={`Open ${card.title}`}>
            <div className="admin-bento-card admin-dashboard-action-card">
              <div className="admin-bento-icon">{card.icon}</div>
              <p className="admin-bento-label">{card.title}</p>
              <h2 className="admin-bento-value">{card.value}</h2>
              <BsArrowRight className="admin-dashboard-card-arrow" />
            </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="organizer-dashboard-content row g-4">
        <div className="col-md-8">
          <div className="admin-bento-card h-100">
            <h2 className="fw-bold mb-2" style={{ fontSize: "22px" }}>
              Quick Actions
            </h2>

            <p className="text-muted mb-4" style={{ fontSize: "15px" }}>
              Start common organizer tasks quickly.
            </p>

            <div className="row g-3">
              <div className="col-md-4">
                <button
                  className="btn btn-primary w-100 d-flex justify-content-between align-items-center"
                  style={{ borderRadius: "12px", fontSize: "15px" }}
                  onClick={() => navigate("/create-event")}
                >
                  Create Event <BsArrowRight />
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"
                  style={{ borderRadius: "12px", fontSize: "15px" }}
                  onClick={() => navigate("/organizer/invite-staff")}
                >
                  Invite Staff <BsPersonPlus />
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"
                  style={{ borderRadius: "12px", fontSize: "15px" }}
                  onClick={() => navigate("/organizer/team-assignment")}
                >
                  Team Assignment <BsClipboardCheck />
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"
                  style={{ borderRadius: "12px", fontSize: "15px" }}
                  onClick={() => navigate("/organizer/reports")}
                >
                  Reports <BsGraphUp />
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"
                  style={{ borderRadius: "12px", fontSize: "15px" }}
                  onClick={() => navigate("/organizer/events")}
                >
                  My Events <BsArrowRight />
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"
                  style={{ borderRadius: "12px", fontSize: "15px" }}
                  onClick={() => navigate("/organizer/registrations")}
                >
                  Registrations <BsArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card h-100">
            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Event Status
            </h2>

            <p style={{ fontSize: "15px" }}>
              <strong>Draft:</strong> {draftEvents}
            </p>
            <p style={{ fontSize: "15px" }}>
              <strong>Published:</strong> {publishedEvents}
            </p>
            <p style={{ fontSize: "15px" }}>
              <strong>Completed:</strong> {completedEvents}
            </p>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}

export default OrganizerDashboard;
