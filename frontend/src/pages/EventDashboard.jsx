import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EventDetailLayout from "../layouts/EventDetailLayout";
import api from "../api/axiosConfig";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaChair,
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaFileAlt,
  FaMicrophone,
  FaRupeeSign,
  FaStore,
  FaTasks,
  FaTicketAlt,
  FaUserTie,
  FaUsers
} from "react-icons/fa";

function EventDashboard() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const [teamCounts, setTeamCounts] = useState({
    staff: 0,
    coordinators: 0,
    volunteers: 0,
    speakers: 0,
    chiefGuests: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [
          eventRes,
          dashboardRes,
          registrationsRes,
          ticketsRes,
          staffRes,
          coordinatorRes,
          volunteerRes,
          speakerRes,
          chiefGuestRes,
          tasksRes
        ] = await Promise.allSettled([
          api.get(`/events/${id}`),
          api.get(`/events/${id}/dashboard`),
          api.get(`/registrations/event/${id}`),
          api.get(`/tickets/event/${id}`),
          api.get(`/staff-assignments/event/${id}`),
          api.get(`/coordinator-assignments/event/${id}`),
          api.get(`/volunteer-assignments/event/${id}`),
          api.get(`/speaker-assignments/event/${id}`),
          api.get(`/chief-guest-assignments/event/${id}`),
          api.get(`/volunteer-tasks/event/${id}`)
        ]);

        if (eventRes.status === "fulfilled") setEvent(eventRes.value.data);
        if (dashboardRes.status === "fulfilled") setDashboard(dashboardRes.value.data);
        if (registrationsRes.status === "fulfilled") {
          setRegistrations(registrationsRes.value.data || []);
        }
        if (ticketsRes.status === "fulfilled") setTickets(ticketsRes.value.data || []);
        if (tasksRes.status === "fulfilled") setTasks(tasksRes.value.data || []);

        setTeamCounts({
          staff: staffRes.status === "fulfilled" ? staffRes.value.data?.length || 0 : 0,
          coordinators:
            coordinatorRes.status === "fulfilled" ? coordinatorRes.value.data?.length || 0 : 0,
          volunteers:
            volunteerRes.status === "fulfilled" ? volunteerRes.value.data?.length || 0 : 0,
          speakers:
            speakerRes.status === "fulfilled" ? speakerRes.value.data?.length || 0 : 0,
          chiefGuests:
            chiefGuestRes.status === "fulfilled" ? chiefGuestRes.value.data?.length || 0 : 0
        });
      } catch (error) {
        setMessage("Unable to load dashboard details.");
      }
    }

    loadData();
  }, [id]);

  if (!event) {
    return (
      <EventDetailLayout>
        <div className="p-4">Loading...</div>
      </EventDetailLayout>
    );
  }

  const totalRegistrations = registrations.length || dashboard?.totalRegistrations || 0;
  const participants = dashboard?.participants || 0;
  const audience = dashboard?.audience || 0;
  const checkedIn = registrations.filter((registration) => registration.attended).length;
  const paidRegistrations = registrations.filter(
    (registration) => registration.paymentStatus === "PAID"
  ).length;
  const ticketSales = tickets.length || totalRegistrations;
  const revenue = event.paid ? paidRegistrations * (Number(event.ticketPrice) || 0) : 0;
  const availableSeats =
    event.availableSeats ?? Math.max(0, (event.capacity || 0) - totalRegistrations);
  const checkInRate = totalRegistrations
    ? Math.round((checkedIn / totalRegistrations) * 100)
    : 0;
  const sessionCount = teamCounts.speakers;
  const teamMembers = Object.values(teamCounts).reduce((total, count) => total + count, 0);
  const daysToEvent = Math.max(
    0,
    Math.ceil((new Date(event.startDateTime) - new Date()) / (1000 * 60 * 60 * 24))
  );

  const quickActions = [
    { label: "Event Info", icon: <FaFileAlt />, path: `/events/${id}/manage/event-info` },
    { label: "Attendees", icon: <FaUsers />, path: `/events/${id}/registrations/attendees` },
    { label: "Agenda", icon: <FaCalendarAlt />, path: `/events/${id}/manage/agenda` },
    { label: "Speakers", icon: <FaMicrophone />, path: `/events/${id}/manage/speakers` },
    { label: "Sponsors", icon: <FaUserTie />, path: `/events/${id}/manage/sponsors` },
    { label: "Check-In", icon: <FaCheckCircle />, path: `/events/${id}/event-day/check-in` },
    { label: "Reports", icon: <FaChartBar />, path: `/events/${id}/reports/overview` },
    { label: "Promote", icon: <FaBullhorn />, path: `/events/${id}/manage/promote` }
  ];

  const registrationItems = registrations.slice(0, 3).map((registration) => ({
    title: `${registration.participant?.firstName || "Guest"} registered`,
    meta: registration.registrationDate
      ? new Date(registration.registrationDate).toLocaleString()
      : "Registration received"
  }));

  const ticketItems = tickets.slice(0, 2).map((ticket) => ({
    title: `Ticket ${ticket.ticketNumber || ticket.id} is ${ticket.status}`,
    meta: ticket.issueDate ? new Date(ticket.issueDate).toLocaleString() : "Ticket issued"
  }));

  const recentActivity = [...registrationItems, ...ticketItems].slice(0, 5);

  return (
    <EventDetailLayout event={event}>
      <div className="event-dashboard-page p-4">
        {message && <div className="alert alert-warning">{message}</div>}

        <div className="event-dashboard-heading d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={`event-status-pill status-${event.status?.toLowerCase()}`}>
                {event.status}
              </span>
              <span className="text-muted" style={{ fontSize: "14px" }}>
                {event.eventMode}
              </span>
            </div>
            <h1 className="mb-1" style={{ fontSize: "28px", fontWeight: 600 }}>
              {event.eventName}
            </h1>
            <p className="text-muted mb-0">
              {event.startDateTime
                ? new Date(event.startDateTime).toLocaleString()
                : "Date not set"}
            </p>
          </div>

          <div className="event-countdown-box">
            <span>{daysToEvent}</span>
            <small>{daysToEvent === 1 ? "day to event" : "days to event"}</small>
          </div>
        </div>

        <div className="event-dashboard-stats row g-3 mb-4">
          <DashboardCard
            title="Registrations"
            value={totalRegistrations}
            icon={<FaClipboardList />}
          />
          <DashboardCard title="Ticket Sales" value={ticketSales} icon={<FaTicketAlt />} />
          <DashboardCard title="Revenue" value={`Rs. ${revenue}`} icon={<FaRupeeSign />} />
          <DashboardCard title="Available Seats" value={availableSeats} icon={<FaChair />} />
          <DashboardCard
            title="Check-In Progress"
            value={`${checkInRate}%`}
            icon={<FaCheckCircle />}
          />
          <DashboardCard title="Sessions" value={sessionCount} icon={<FaMicrophone />} />
          <DashboardCard title="Team Members" value={teamMembers} icon={<FaUsers />} />
          <DashboardCard title="Audience" value={audience} icon={<FaStore />} />
        </div>

        <div className="row g-4 mb-4">
          <div className="col-xl-6">
            <section className="event-dashboard-panel event-chart-panel">
              <h2 className="event-panel-title">Registration Trend</h2>

              <div className="event-chart-empty">
                <TrendIllustration />
                <h3>Invite Attendees</h3>
                <p>
                  Publish your event to send invitations to attendees and schedule reminders.
                </p>
                <Link to={`/events/${id}/manage/promote`} className="event-primary-button">
                  Publish
                </Link>
              </div>
            </section>
          </div>

          <div className="col-xl-6">
            <section className="event-dashboard-panel event-chart-panel">
              <h2 className="event-panel-title">Registrations</h2>

              <div className="event-chart-empty">
                <DonutIllustration />
                <h3>No Tickets Configured</h3>
                <p>
                  Create and sell tickets to check in attendees here during the event.
                </p>
                <Link to={`/events/${id}/registrations/sales`} className="event-primary-button">
                  Add Ticket Class
                </Link>
              </div>
            </section>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-xl-4">
            <section className="event-dashboard-panel h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="event-panel-title">Quick Actions</h2>
              </div>

              <div className="row g-2">
                {quickActions.map((action) => (
                  <ActionButton key={action.path} {...action} />
                ))}
              </div>
            </section>
          </div>

          <div className="col-xl-4">
            <section className="event-dashboard-panel h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="event-panel-title">Registration Summary</h2>
                <Link
                  to={`/events/${id}/registrations/attendees`}
                  className="text-decoration-none"
                  style={{ fontSize: "14px" }}
                >
                  View all
                </Link>
              </div>

              <SummaryRow label="Participants" value={participants} />
              <SummaryRow label="Audience" value={audience} />
              <SummaryRow label="Checked In" value={checkedIn} />
              <SummaryRow
                label="Pending Check-In"
                value={Math.max(0, totalRegistrations - checkedIn)}
              />
            </section>
          </div>

          <div className="col-xl-4">
            <section className="event-dashboard-panel h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="event-panel-title">Upcoming Tasks</h2>
                <FaTasks className="text-muted" />
              </div>

              {tasks.length > 0 ? (
                tasks.slice(0, 4).map((task) => (
                  <div className="event-list-row" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.priority} priority</span>
                    </div>
                    <small>{task.status}</small>
                  </div>
                ))
              ) : (
                <EmptyState text="No upcoming tasks assigned yet." />
              )}
            </section>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-xl-8">
            <section className="event-dashboard-panel">
              <h2 className="event-panel-title mb-3">Event Overview</h2>
              <div className="row g-3">
                <OverviewItem label="Description" value={event.description || "N/A"} wide />
                <OverviewItem label="Type" value={event.eventType || "N/A"} />
                <OverviewItem label="Mode" value={event.eventMode || "N/A"} />
                <OverviewItem label="Venue" value={event.venue || event.meetingLink || "N/A"} />
                <OverviewItem label="Capacity" value={event.capacity || "N/A"} />
                <OverviewItem
                  label="Registration Deadline"
                  value={
                    event.registrationDeadline
                      ? new Date(event.registrationDeadline).toLocaleString()
                      : "N/A"
                  }
                />
                <OverviewItem
                  label="Pricing"
                  value={event.paid ? `Rs. ${event.ticketPrice}` : "Free"}
                />
              </div>
            </section>
          </div>

          <div className="col-xl-4">
            <section className="event-dashboard-panel h-100">
              <h2 className="event-panel-title mb-3">Recent Activity</h2>

              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <div className="event-list-row" key={`${item.title}-${index}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Recent activity will appear here." />
              )}
            </section>
          </div>
        </div>
      </div>
      <style>{dashboardStyles}</style>
    </EventDetailLayout>
  );
}

function DashboardCard({ title, value, icon }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="event-stat-card">
        <div className="event-stat-icon">{icon}</div>
        <div>
          <div className="event-stat-label">{title}</div>
          <div className="event-stat-value">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, path }) {
  return (
    <div className="col-6">
      <Link to={path} className="event-action-button">
        {icon}
        <span>{label}</span>
      </Link>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="event-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OverviewItem({ label, value, wide }) {
  return (
    <div className={wide ? "col-12" : "col-md-6"}>
      <div className="event-overview-item">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="event-empty-state">
      <FaChartBar />
      <span>{text}</span>
    </div>
  );
}

function TrendIllustration() {
  return (
    <svg className="event-chart-illustration" viewBox="0 0 180 140" role="img">
      <line x1="25" y1="112" x2="155" y2="112" />
      <rect x="38" y="70" width="17" height="42" rx="5" />
      <rect x="70" y="48" width="17" height="64" rx="5" />
      <rect x="102" y="66" width="17" height="46" rx="5" />
      <rect x="134" y="32" width="17" height="80" rx="5" />
      <polyline points="47,35 78,10 110,28 143,5" />
      <circle cx="47" cy="35" r="6" />
      <circle cx="78" cy="10" r="6" />
      <circle cx="110" cy="28" r="6" />
      <circle cx="143" cy="5" r="6" />
    </svg>
  );
}

function DonutIllustration() {
  return (
    <svg className="event-donut-illustration" viewBox="0 0 180 140" role="img">
      <path d="M90 22a68 68 0 0 1 50 22l-25 20a35 35 0 0 0-50 0L40 44a68 68 0 0 1 50-22Z" />
      <path d="M144 52a68 68 0 0 1 3 65l-31-14a35 35 0 0 0-2-34Z" />
      <path d="M138 122a68 68 0 1 1-101-72l25 20a35 35 0 1 0 51 36Z" />
    </svg>
  );
}

const dashboardStyles = `
  .event-status-pill {
    border-radius: 999px;
    color: #fff;
    display: inline-flex;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    padding: 6px 10px;
    text-transform: uppercase;
  }

  .status-draft { background: #64748b; }
  .status-published { background: #15803d; }
  .status-completed { background: #4338ca; }
  .status-cancelled { background: #b91c1c; }
  .status-trashed { background: #3f3f46; }

  .event-countdown-box {
    align-items: center;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    display: flex;
    gap: 10px;
    min-width: 150px;
    padding: 14px 16px;
  }

  .event-countdown-box span {
    color: #111827;
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
  }

  .event-countdown-box small {
    color: #64748b;
    font-size: 13px;
    line-height: 16px;
  }

  .event-stat-card,
  .event-dashboard-panel {
    background: #ffffff;
    border: 1px solid #e8ebf0;
    border-radius: 8px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  }

  .event-stat-card {
    align-items: center;
    display: flex;
    gap: 14px;
    min-height: 104px;
    padding: 18px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .event-stat-card:hover,
  .event-dashboard-panel:hover {
    box-shadow: 0 16px 34px rgba(79, 70, 229, 0.12);
    transform: translateY(-2px);
  }

  .event-stat-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    flex: 0 0 44px;
    font-size: 21px;
    height: 44px;
    justify-content: center;
    width: 44px;
  }

  .event-stat-label {
    color: #64748b;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .event-stat-value {
    color: #0f172a;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
  }

  .event-dashboard-panel {
    padding: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .event-panel-title {
    color: #0f172a;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .event-chart-panel {
    min-height: 340px;
  }

  .event-chart-empty {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 285px;
    padding: 12px 24px 4px;
    text-align: center;
  }

  .event-chart-empty h3 {
    color: #0f172a;
    font-size: 22px;
    font-weight: 600;
    margin: 18px 0 8px;
  }

  .event-chart-empty p {
    color: #334155;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    margin: 0 auto 26px;
    max-width: 470px;
  }

  .event-primary-button {
    align-items: center;
    background: #4f46e5;
    border-radius: 6px;
    color: #ffffff;
    display: inline-flex;
    font-size: 16px;
    font-weight: 600;
    justify-content: center;
    min-height: 44px;
    padding: 0 20px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .event-primary-button:hover {
    background: #4338ca;
    color: #ffffff;
    transform: translateY(-1px);
  }

  .event-chart-illustration,
  .event-donut-illustration {
    height: 150px;
    width: 190px;
  }

  .event-chart-illustration line,
  .event-chart-illustration rect,
  .event-chart-illustration polyline,
  .event-chart-illustration circle,
  .event-donut-illustration path {
    fill: none;
    stroke: #cfd9ff;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 5;
  }

  .event-chart-illustration rect,
  .event-donut-illustration path {
    fill: #f5f7ff;
  }

  .event-chart-illustration circle {
    fill: #cfd9ff;
  }

  .event-action-button {
    align-items: center;
    background: #f8fafc;
    border: 1px solid #edf0f4;
    border-radius: 8px;
    color: #111827;
    display: flex;
    gap: 10px;
    min-height: 46px;
    padding: 10px 12px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .event-action-button:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
    color: #4f46e5;
    transform: translateY(-2px);
  }

  .event-summary-row,
  .event-list-row {
    align-items: center;
    border-bottom: 1px solid #eef1f5;
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
  }

  .event-summary-row:first-of-type,
  .event-list-row:first-of-type {
    padding-top: 0;
  }

  .event-summary-row:last-child,
  .event-list-row:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .event-summary-row span,
  .event-list-row span {
    color: #64748b;
    display: block;
    font-size: 13px;
    margin-top: 2px;
  }

  .event-summary-row strong,
  .event-list-row strong {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  .event-list-row small {
    color: #4f46e5;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .event-overview-item {
    background: #f8fafc;
    border: 1px solid #edf0f4;
    border-radius: 8px;
    min-height: 74px;
    padding: 12px 14px;
  }

  .event-overview-item span {
    color: #64748b;
    display: block;
    font-size: 13px;
    margin-bottom: 5px;
  }

  .event-overview-item strong {
    color: #111827;
    display: block;
    font-size: 14px;
    line-height: 20px;
    overflow-wrap: anywhere;
  }

  .event-empty-state {
    align-items: center;
    color: #64748b;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    gap: 10px;
    justify-content: center;
    min-height: 150px;
    text-align: center;
  }

  .event-empty-state svg {
    color: #cbd5e1;
    font-size: 42px;
  }
`;

export default EventDashboard;
