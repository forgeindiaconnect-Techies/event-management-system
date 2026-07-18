import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BsArrowLeft, BsArrowRight, BsBarChart, BsBell, BsCalendar3,
  BsCheck2Circle, BsClipboardCheck, BsCompass, BsPeople, BsPersonPlus,
  BsReceipt, BsShieldCheck, BsStars
} from "react-icons/bs";

const tourData = {
  admin: {
    eyebrow: "PORTAL ADMIN TOUR",
    title: "Run your entire event portal",
    description: "See how a portal admin creates events, builds a team, monitors registrations and manages plan access.",
    openLabel: "Open Admin Dashboard",
    openPath: "/admin",
    steps: [
      ["overview", "Dashboard overview", "Start here to review events, registrations, users and organizers at a glance."],
      ["create", "Create an event", "Use Create Event to build a new event and configure its essential information."],
      ["events", "Manage events", "Open the Events workspace to publish, update and monitor every portal event."],
      ["invite", "Invite organizers", "Invite organizers by email or create their account manually, then assign events."],
      ["reports", "Reports and analytics", "Track registrations, attendance and event performance from one place."],
      ["plan", "Subscription access", "Review your current plan, renewal date and available upgrades."],
      ["profile", "Notifications and profile", "Read alerts, switch access and manage your account from the top bar."]
    ]
  },
  organizer: {
    eyebrow: "ORGANIZER TOUR",
    title: "Coordinate assigned events",
    description: "Learn how organizers manage registrations, staff, attendance, certificates and reports.",
    openLabel: "Open Organizer Dashboard",
    openPath: "/organizer",
    steps: [
      ["overview", "Organizer overview", "Review assigned events, registrations, staff and completed-event totals."],
      ["events", "My Events", "Open the events assigned to you and enter their dedicated workspace."],
      ["registrations", "Registrations", "Search attendees and review their registration and payment status."],
      ["invite", "Invite staff", "Invite or manually add event staff, then assign them to an event."],
      ["attendance", "Attendance and certificates", "Record attendance and issue certificates after the event."],
      ["reports", "Organizer reports", "Measure registrations, ticket revenue and attendance performance."],
      ["profile", "Profile and access switcher", "Open your profile to switch safely between assigned roles and events."]
    ]
  },
  event: {
    eyebrow: "EVENT WORKSPACE TOUR",
    title: "Build and operate one event",
    description: "Explore the focused workspace used for event setup, registrations, exhibitors, reporting and event day.",
    openLabel: "Open Event Workspace",
    openPath: () => {
      const eventId = localStorage.getItem("activeEventId");
      return eventId ? `/events/${eventId}` : "/admin/events";
    },
    steps: [
      ["header", "Event identity and status", "The header keeps the selected event, publish state and account visible."],
      ["overview", "Event dashboard", "Monitor registrations, ticket sales, revenue and available seats."],
      ["manage", "Manage event details", "Configure event information, team, agenda, speakers, sponsors and forms."],
      ["registrations", "Registration workspace", "Manage attendees, payments, waitlists, forms, ticket classes and sales."],
      ["exhibitors", "Exhibitors and booths", "Maintain exhibitors, booth allocation, categories, leads and reports."],
      ["reports", "Event reports", "Review revenue and event-level performance without leaving the workspace."],
      ["eventday", "Event-day operations", "Run check-in, attendance and announcements while the event is live."]
    ]
  }
};

const menuByType = {
  admin: [["overview", "Dashboard", BsCompass], ["events", "Events", BsCalendar3], ["invite", "Invite Organizers", BsPersonPlus], ["reports", "Reports", BsBarChart], ["plan", "Subscription", BsReceipt]],
  organizer: [["overview", "Dashboard", BsCompass], ["events", "My Events", BsCalendar3], ["registrations", "Registrations", BsClipboardCheck], ["invite", "Invite Staff", BsPersonPlus], ["attendance", "Attendance", BsCheck2Circle], ["reports", "Reports", BsBarChart]],
  event: [["overview", "Dashboard", BsCompass], ["manage", "Manage", BsShieldCheck], ["registrations", "Registrations", BsClipboardCheck], ["exhibitors", "Exhibitors", BsPeople], ["reports", "Reports", BsBarChart], ["eventday", "Event Day", BsCalendar3]]
};

function Feature({ id, active, children, className = "" }) {
  return <div data-feature={id} className={`${className} ${active === id ? "tour-active-feature" : ""}`}>{children}</div>;
}

function DashboardPreview({ type, active = null, compact = false }) {
  const menus = menuByType[type];
  const eventMode = type === "event";
  const roleName = type === "admin" ? "Portal Admin" : type === "organizer" ? "Organizer" : "Event Admin";
  return (
    <div className={`tour-dashboard ${compact ? "tour-dashboard-compact" : ""} ${active ? "tour-dashboard-running" : ""}`}>
      <Feature id="header" active={active} className="tour-mock-nav">
        <div className="tour-brand"><span>◇</span><b>FIC BackRooms</b>{!compact && <em>| FIC events</em>}</div>
        <div className="tour-nav-actions">
          {type === "admin" && <Feature id="plan" active={active}><button>⚡ Upgrade</button></Feature>}
          <Feature id="profile" active={active}><BsBell /><span className="tour-avatar">NM</span></Feature>
        </div>
      </Feature>
      <div className="tour-mock-body">
        <aside>
          {menus.map(([id, label, Icon], index) => (
            <Feature id={id} active={active} key={id} className={`tour-mock-menu ${index === 0 ? "selected" : ""}`}>
              <Icon /><span>{label}</span>
            </Feature>
          ))}
        </aside>
        <main>
          <div className="tour-content-heading">
            <div><small>{eventMode ? "EVENT WORKSPACE" : `${roleName.toUpperCase()} DASHBOARD`}</small><h2>{eventMode ? "AI Startup Builders – Live Demo" : `${roleName} Dashboard`}</h2><p>Manage your work from one focused workspace.</p></div>
            {type === "admin" && <Feature id="create" active={active}><button className="tour-primary">+ Create Event</button></Feature>}
          </div>
          <Feature id="overview" active={active} className="tour-stat-grid">
            {[["Events", "3", BsCalendar3], ["Registrations", "248", BsClipboardCheck], [eventMode ? "Revenue" : "Users", eventMode ? "₹24,800" : "12", eventMode ? BsBarChart : BsPeople], [eventMode ? "Seats Left" : "Completed", "152", BsCheck2Circle]].map(([label, value, Icon]) => (
              <article key={label}><span><Icon /></span><small>{label}</small><strong>{value}</strong></article>
            ))}
          </Feature>
          <div className="tour-lower-grid">
            <Feature id={type === "event" ? "manage" : "events"} active={active} className="tour-panel">
              <div className="tour-panel-title"><b>{eventMode ? "Event setup progress" : "Recent events"}</b><span>View all</span></div>
              {["AI Startup Builders", "Fitness & Wellness Expo", "Product Launch Summit"].map((name, i) => <div className="tour-row" key={name}><span className="tour-row-dot" /> <b>{name}</b><small>{i === 0 ? "Active" : "Upcoming"}</small></div>)}
            </Feature>
            <Feature id={eventMode ? "registrations" : type === "organizer" ? "attendance" : "reports"} active={active} className="tour-panel tour-chart-panel">
              <b>{eventMode ? "Registration activity" : "Weekly performance"}</b>
              <div className="tour-bars">{[44, 68, 52, 82, 61, 94, 76].map((height, i) => <i key={i} style={{height: `${height}%`}} />)}</div>
            </Feature>
          </div>
        </main>
      </div>
    </div>
  );
}

function TourSelection() {
  const navigate = useNavigate();
  return (
    <div className="tour-page">
      <header className="tour-page-nav"><button onClick={() => navigate(-1)}><BsArrowLeft /> Back</button><div><BsStars /> FIC BackRooms <span>Help Center</span></div></header>
      <section className="tour-hero"><span><BsCompass /> INTERACTIVE PRODUCT TOUR</span><h1>Explore the platform before you work</h1><p>Choose a workspace below. You will see the actual page structure, important controls and a guided explanation—without changing any real data.</p></section>
      <section className="tour-gallery">
        {Object.entries(tourData).map(([type, data]) => {
          const complete = localStorage.getItem(`ficPreviewTourCompleted:${type}`) === "true";
          return <article className="tour-gallery-card" key={type}>
            <div className="tour-gallery-preview"><DashboardPreview type={type} compact /></div>
            <div className="tour-gallery-copy"><div><span>{data.eyebrow}</span>{complete && <em><BsCheck2Circle /> Completed</em>}</div><h2>{data.title}</h2><p>{data.description}</p><button onClick={() => navigate(`/help/tour/${type}`)}>{complete ? "View Tour Again" : "Start Visual Tour"}<BsArrowRight /></button></div>
          </article>;
        })}
      </section>
      <footer className="tour-note"><BsShieldCheck /><div><b>Safe preview environment</b><span>This tour never creates, edits, deletes or submits platform data.</span></div></footer>
      <style>{styles}</style>
    </div>
  );
}

function TourDetail({ type }) {
  const navigate = useNavigate();
  const data = tourData[type];
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = data.steps[step];

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  const finish = () => { localStorage.setItem(`ficPreviewTourCompleted:${type}`, "true"); setFinished(true); };
  const openDashboard = () => navigate(typeof data.openPath === "function" ? data.openPath() : data.openPath);
  return (
    <div className="tour-page tour-detail-page">
      <header className="tour-page-nav"><button onClick={() => navigate("/help/tour")}><BsArrowLeft /> All Tours</button><div><BsStars /> {data.eyebrow}</div><button className="tour-exit" onClick={openDashboard}>Exit Tour</button></header>
      <section className="tour-detail-heading"><div><span>{finished ? "TOUR COMPLETE" : `STEP ${step + 1} OF ${data.steps.length}`}</span><h1>{finished ? `You’re ready to use the ${type === "event" ? "Event Workspace" : type === "admin" ? "Admin Dashboard" : "Organizer Dashboard"}` : current[1]}</h1><p>{finished ? "You can repeat this walkthrough at any time from the question-mark Help menu." : current[2]}</p></div><div className="tour-progress"><i style={{width: `${finished ? 100 : ((step + 1) / data.steps.length) * 100}%`}} /></div></section>
      <section className="tour-stage-wrap">
        <DashboardPreview type={type} active={finished ? null : current[0]} />
        {!finished && <div className="tour-step-card"><div><small>YOU ARE VIEWING</small><strong>{current[1]}</strong><p>{current[2]}</p></div><div className="tour-step-actions"><button disabled={step === 0} onClick={() => setStep((value) => value - 1)}><BsArrowLeft /> Back</button><button className="tour-skip" onClick={() => navigate("/help/tour")}>Skip Tour</button><button className="tour-next" onClick={() => step === data.steps.length - 1 ? finish() : setStep((value) => value + 1)}>{step === data.steps.length - 1 ? "Finish Tour" : "Next"}<BsArrowRight /></button></div></div>}
        {finished && <div className="tour-complete-card"><BsCheck2Circle /><div><b>Tour completed</b><span>Your progress has been saved on this device.</span></div><button onClick={() => { setStep(0); setFinished(false); }}>Restart Tour</button><button className="tour-next" onClick={openDashboard}>{data.openLabel}<BsArrowRight /></button></div>}
      </section>
      <style>{styles}</style>
    </div>
  );
}

export default function TourCenter() {
  const { tourType } = useParams();
  const validType = useMemo(() => tourType && tourData[tourType] ? tourType : null, [tourType]);
  return validType ? <TourDetail type={validType} /> : <TourSelection />;
}

const styles = `
*{box-sizing:border-box}.tour-page{min-height:100vh;background:#f5f7fb;color:#101828;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.tour-page button{font:inherit;cursor:pointer}.tour-page-nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:68px;padding:0 5vw;background:#170b69;color:#fff;box-shadow:0 5px 20px rgba(24,16,89,.16)}.tour-page-nav>div{display:flex;align-items:center;gap:9px;font-weight:800}.tour-page-nav>div span{font-weight:400;opacity:.7}.tour-page-nav button{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(255,255,255,.08);color:#fff}.tour-page-nav .tour-exit{background:#fff;color:#170b69}.tour-hero{max-width:900px;margin:0 auto;padding:70px 24px 38px;text-align:center}.tour-hero>span,.tour-detail-heading span,.tour-gallery-copy>div>span{color:#6557ed;font-size:12px;font-weight:800;letter-spacing:.13em}.tour-hero h1{margin:13px 0 14px;font-size:clamp(32px,5vw,54px);line-height:1.08}.tour-hero p{max-width:760px;margin:auto;color:#667085;font-size:17px;line-height:1.65}.tour-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1440px;margin:auto;padding:12px 4vw 42px}.tour-gallery-card{overflow:hidden;border:1px solid #e1e5ec;border-radius:20px;background:#fff;box-shadow:0 14px 38px rgba(16,24,40,.08);transition:.2s}.tour-gallery-card:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(16,24,40,.13)}.tour-gallery-preview{height:240px;overflow:hidden;padding:13px;background:linear-gradient(145deg,#e9eaff,#f6f7fb)}.tour-gallery-copy{padding:22px}.tour-gallery-copy>div{display:flex;justify-content:space-between;gap:8px}.tour-gallery-copy em{display:flex;align-items:center;gap:4px;color:#168354;font-size:11px;font-style:normal;font-weight:700}.tour-gallery-copy h2{margin:10px 0 8px;font-size:22px}.tour-gallery-copy p{min-height:66px;margin:0;color:#667085;font-size:14px;line-height:1.55}.tour-gallery-copy button{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:18px;padding:12px 14px;border:0;border-radius:10px;background:#5447dc;color:#fff;font-weight:750}.tour-note{display:flex;align-items:center;justify-content:center;gap:12px;padding:22px;background:#ecebff;color:#302a79}.tour-note svg{font-size:25px}.tour-note div{display:grid}.tour-note span{color:#625e82;font-size:13px}.tour-dashboard{overflow:hidden;border:1px solid #dfe3eb;border-radius:16px;background:#f5f7fb;box-shadow:0 22px 55px rgba(16,24,40,.15)}.tour-dashboard-compact{width:820px;height:400px;transform:scale(.5);transform-origin:top left;border-radius:20px}.tour-mock-nav{display:flex;align-items:center;justify-content:space-between;height:66px;padding:0 24px;background:#170b69;color:#fff}.tour-brand{display:flex;align-items:center;gap:10px}.tour-brand span{font-size:27px}.tour-brand em{font-style:normal;opacity:.72}.tour-nav-actions,.tour-nav-actions>div{display:flex;align-items:center;gap:14px}.tour-nav-actions button{padding:8px 13px;border:1px solid #9187ff;border-radius:9px;background:#5d50dc;color:#fff}.tour-avatar{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#fff;color:#5548d9;font-size:12px;font-weight:800}.tour-mock-body{display:grid;grid-template-columns:215px 1fr;min-height:580px}.tour-mock-body aside{display:flex;flex-direction:column;gap:6px;padding:19px 13px;background:#fff;border-right:1px solid #e4e7ec}.tour-mock-menu{display:flex;align-items:center;gap:11px;padding:12px 13px;border-radius:10px;color:#364152}.tour-mock-menu.selected{background:#eeefff;color:#5548d9;font-weight:700}.tour-mock-body main{min-width:0;padding:28px}.tour-content-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.tour-content-heading small{color:#6557ed;font-weight:800;letter-spacing:.08em}.tour-content-heading h2{margin:5px 0;font-size:27px}.tour-content-heading p{margin:0;color:#667085}.tour-primary{padding:12px 16px;border:0;border-radius:10px;background:#1769ed;color:#fff;font-weight:700}.tour-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:26px}.tour-stat-grid article{display:grid;grid-template-columns:42px 1fr;align-items:center;padding:18px;border:1px solid #e6e9ef;border-radius:14px;background:#fff}.tour-stat-grid article>span{grid-row:span 2;display:grid;place-items:center;width:35px;height:35px;border-radius:9px;background:#eeeaff;color:#5b4ce5}.tour-stat-grid article small{color:#667085}.tour-stat-grid article strong{font-size:24px}.tour-lower-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin-top:17px}.tour-panel{min-height:225px;padding:19px;border:1px solid #e6e9ef;border-radius:14px;background:#fff}.tour-panel-title{display:flex;justify-content:space-between;margin-bottom:13px}.tour-panel-title span{color:#5548d9;font-size:12px}.tour-row{display:grid;grid-template-columns:11px 1fr auto;align-items:center;gap:8px;padding:13px 0;border-top:1px solid #eef0f4}.tour-row-dot{width:8px;height:8px;border-radius:50%;background:#6557ed}.tour-row small{color:#168354}.tour-chart-panel{display:flex;flex-direction:column}.tour-bars{display:flex;align-items:flex-end;gap:9px;height:140px;margin-top:20px}.tour-bars i{flex:1;border-radius:5px 5px 0 0;background:linear-gradient(#887cff,#5548d9)}.tour-dashboard-running [data-feature]{transition:.25s}.tour-dashboard-running [data-feature]:not(.tour-active-feature){opacity:.3;filter:saturate(.45)}.tour-dashboard-running .tour-active-feature{position:relative;z-index:4;opacity:1!important;filter:none!important;outline:4px solid #ffcf3f;outline-offset:4px;box-shadow:0 0 0 9999px rgba(12,16,35,.2)}.tour-detail-heading{display:grid;grid-template-columns:1fr 300px;align-items:end;gap:30px;max-width:1400px;margin:auto;padding:38px 4vw 24px}.tour-detail-heading h1{margin:7px 0;font-size:32px}.tour-detail-heading p{max-width:820px;margin:0;color:#667085}.tour-progress{height:8px;overflow:hidden;border-radius:99px;background:#e2e5ec}.tour-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#5548d9,#8c51ed);transition:.3s}.tour-stage-wrap{max-width:1400px;margin:auto;padding:0 4vw 60px}.tour-step-card,.tour-complete-card{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;margin:-8px 24px 0;padding:20px 22px;border:1px solid #dfe3eb;border-radius:0 0 16px 16px;background:#fff;box-shadow:0 18px 35px rgba(16,24,40,.14)}.tour-step-card>div:first-child{max-width:650px}.tour-step-card small{display:block;color:#6557ed;font-size:10px;font-weight:800;letter-spacing:.12em}.tour-step-card strong{display:block;margin:3px 0;font-size:18px}.tour-step-card p{margin:0;color:#667085;font-size:13px}.tour-step-actions{display:flex;gap:8px}.tour-step-actions button,.tour-complete-card button{display:flex;align-items:center;gap:7px;padding:10px 13px;border:1px solid #d7dce5;border-radius:9px;background:#fff;color:#344054}.tour-step-actions button:disabled{opacity:.4;cursor:not-allowed}.tour-step-actions .tour-skip{border:0;color:#667085}.tour-step-actions .tour-next,.tour-complete-card .tour-next{border-color:#5548d9;background:#5548d9;color:#fff}.tour-complete-card>svg{color:#168354;font-size:34px}.tour-complete-card>div{display:grid;margin-right:auto}.tour-complete-card span{color:#667085;font-size:13px}
@media(max-width:1050px){.tour-gallery{grid-template-columns:1fr}.tour-gallery-card{display:grid;grid-template-columns:360px 1fr}.tour-gallery-preview{height:220px}.tour-gallery-copy p{min-height:0}.tour-stat-grid{grid-template-columns:repeat(2,1fr)}.tour-detail-heading{grid-template-columns:1fr}.tour-progress{max-width:none}.tour-mock-body{grid-template-columns:170px 1fr}.tour-mock-body main{padding:20px}}
@media(max-width:700px){.tour-page-nav{min-height:58px;padding:0 14px}.tour-page-nav>div span{display:none}.tour-hero{padding:45px 18px 25px}.tour-gallery{padding:8px 14px 30px}.tour-gallery-card{display:block}.tour-gallery-preview{height:190px}.tour-detail-heading{padding:25px 16px 18px}.tour-detail-heading h1{font-size:25px}.tour-stage-wrap{padding:0 10px 40px;overflow:hidden}.tour-dashboard:not(.tour-dashboard-compact){width:900px;transform:scale(.42);transform-origin:top left;margin-bottom:-360px}.tour-step-card,.tour-complete-card{display:grid;margin:0;padding:16px;border-radius:14px}.tour-step-actions{display:grid;grid-template-columns:1fr 1fr}.tour-step-actions .tour-skip{grid-column:span 2;grid-row:2}.tour-step-actions button{justify-content:center}.tour-complete-card button{justify-content:center}.tour-page-nav .tour-exit{padding:8px}.tour-note{align-items:flex-start;padding:18px}}
`;
