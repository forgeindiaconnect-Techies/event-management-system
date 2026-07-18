import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const tours = {
  admin: [
    [".admin-navbar-brand", "Portal Admin workspace", "This workspace is where you manage your portal, events, people and reports."],
    ["[data-tour='admin-create']", "Create an event", "Start a new event and configure its details before publishing."],
    ["[data-tour='admin-events']", "Events", "Open running, upcoming, published, draft, past and cancelled events."],
    ["[data-tour='admin-invite-organizers']", "Invite organizers", "Invite organizers by email or add them manually."],
    ["[data-tour='admin-reports']", "Reports and analytics", "Review registrations, attendance and event performance."],
    ["[data-tour='admin-plan']", "Subscription", "Review your current plan, limits, expiry and upgrades."],
    ["[data-tour='admin-notifications']", "Notifications", "See invitations, payments, subscription and event updates."],
    ["[data-tour='admin-profile']", "Profile", "Edit your details, switch role or event, and sign out."]
  ],
  organizer: [
    [".organizer-navbar-brand", "Organizer workspace", "Manage your assigned events, registrations, team and attendance."],
    ["[data-tour='organizer-my-events']", "My Events", "Open the events assigned to you and enter an event workspace."],
    ["[data-tour='organizer-registrations']", "Registrations", "Review participants and their registration information."],
    ["[data-tour='organizer-invite-staff']", "Invite event roles", "Invite staff and other event roles by email or add them manually."],
    ["[data-tour='organizer-reports']", "Reports", "Review event activity, attendance and operational results."],
    ["[data-tour='organizer-notifications']", "Notifications", "Check event assignments, invitations and important updates."],
    ["[data-tour='organizer-profile']", "Profile and access", "Edit your profile or switch to another role or event."]
  ],
  event: [
    ["[data-tour='event-title']", "Current event", "The header shows the event you are managing and its publication status."],
    ["[data-tour='event-dashboard']", "Event dashboard", "See event registrations, ticket sales, revenue and available seats."],
    ["[data-tour='event-manage']", "Manage", "Configure event information, team, agenda, speakers, sponsors and forms."],
    ["[data-tour='event-registrations']", "Registrations", "Configure forms, tickets, attendees and registration payments."],
    ["[data-tour='event-exhibitors']", "Exhibitors", "Manage exhibitors, categories, booths and leads."],
    ["[data-tour='event-reports']", "Reports", "Review event reports and performance information."],
    ["[data-tour='event-event-day']", "Event Day", "Handle check-in, attendance and live event operations."],
    ["[data-tour='event-search']", "Search", "Quickly find a page or feature inside this event."],
    ["[data-tour='event-profile']", "Profile", "Return to another dashboard, switch access or sign out."]
  ]
};

function GuidedTour({ onClose }) {
  const location = useLocation();
  const context = location.pathname.startsWith("/events/")
    ? "event"
    : location.pathname.startsWith("/organizer")
      ? "organizer"
      : "admin";
  const steps = useMemo(() => tours[context], [context]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    const selector = steps[index][0];
    const target = document.querySelector(selector);
    if (!target) {
      setRect(null);
      return;
    }

    let bounds = target.getBoundingClientRect();
    const outside = bounds.right < 0 || bounds.left > window.innerWidth || bounds.bottom < 0 || bounds.top > window.innerHeight;
    if (outside) {
      const menuButton = document.querySelector(
        context === "event" ? ".event-mobile-menu-button" : context === "organizer" ? ".organizer-mobile-menu-button" : ".admin-mobile-menu-button"
      );
      menuButton?.click();
      window.setTimeout(() => {
        bounds = target.getBoundingClientRect();
        setRect(toRect(bounds));
      }, 280);
      return;
    }
    setRect(toRect(bounds));
  }, [context, index, steps]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const finish = () => {
    localStorage.setItem(`ficTourCompleted:${context}`, "true");
    onClose();
  };

  const [selector, title, description] = steps[index];
  const padding = 7;
  const box = rect ? {
    top: Math.max(0, rect.top - padding),
    left: Math.max(0, rect.left - padding),
    width: Math.min(window.innerWidth, rect.width + padding * 2),
    height: Math.min(window.innerHeight, rect.height + padding * 2)
  } : null;

  return (
    <div className="fic-tour" role="dialog" aria-label={`${context} guided tour`}>
      {box ? (
        <>
          <div className="fic-tour-shade top" style={{ height: box.top }} />
          <div className="fic-tour-shade left" style={{ top: box.top, width: box.left, height: box.height }} />
          <div className="fic-tour-shade right" style={{ top: box.top, left: box.left + box.width, height: box.height }} />
          <div className="fic-tour-shade bottom" style={{ top: box.top + box.height }} />
          <div className="fic-tour-highlight" style={box} />
        </>
      ) : <div className="fic-tour-shade full" />}

      <div className="fic-tour-dialog">
        <div className="fic-tour-progress">
          {steps.map((_, stepIndex) => <span key={stepIndex} className={stepIndex <= index ? "active" : ""} />)}
        </div>
        <strong>{title}</strong>
        <p>{description}</p>
        <div className="fic-tour-footer">
          <small>Step {index + 1} of {steps.length}</small>
          <div>
            <button type="button" className="skip" onClick={onClose}>Skip Tour</button>
            <button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Back</button>
            <button type="button" className="next" onClick={() => index === steps.length - 1 ? finish() : setIndex((value) => value + 1)}>
              {index === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
      <style>{tourStyles}</style>
    </div>
  );
}

function toRect(bounds) {
  return { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height };
}

const tourStyles = `
  .fic-tour{position:fixed;inset:0;z-index:10000;pointer-events:none}.fic-tour-shade{position:fixed;background:rgba(8,12,28,.7);pointer-events:auto}.fic-tour-shade.top{top:0;left:0;right:0}.fic-tour-shade.left{left:0}.fic-tour-shade.right{right:0}.fic-tour-shade.bottom{left:0;right:0;bottom:0}.fic-tour-shade.full{inset:0}.fic-tour-highlight{position:fixed;border:3px solid #8b7cff;border-radius:12px;box-shadow:0 0 0 5px rgba(139,124,255,.25);pointer-events:none}
  .fic-tour-dialog{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);width:min(520px,calc(100vw - 28px));padding:18px;border:1px solid #e0e3eb;border-radius:14px;background:#fff;color:#172033;box-shadow:0 20px 55px rgba(0,0,0,.3);pointer-events:auto}.fic-tour-dialog>strong{display:block;font-size:17px}.fic-tour-dialog>p{margin:7px 0 15px;color:#667085;font-size:13px;line-height:1.5}.fic-tour-progress{display:flex;gap:5px;margin-bottom:13px}.fic-tour-progress span{height:4px;flex:1;border-radius:10px;background:#e5e7eb}.fic-tour-progress span.active{background:#6557dd}.fic-tour-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.fic-tour-footer small{color:#7b8190}.fic-tour-footer>div{display:flex;gap:7px}.fic-tour-footer button{padding:7px 11px;border:1px solid #d9dde6;border-radius:8px;background:#fff;color:#344054;font-size:12px}.fic-tour-footer button:disabled{opacity:.45}.fic-tour-footer .skip{border-color:transparent}.fic-tour-footer .next{border-color:#5548d9;background:#5548d9;color:#fff}
  @media(max-width:576px){.fic-tour-dialog{bottom:12px;padding:14px}.fic-tour-footer{align-items:flex-start;flex-direction:column}.fic-tour-footer>div{width:100%;justify-content:flex-end}}
`;

export default GuidedTour;
