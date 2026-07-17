import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import logo from "../assets/images/fic-logo.png";
import UserProfileMenu from "../components/Public/UserProfileMenu";
import "../styles/LandingPage.css";

const guideContent = {
  "how-to-plan-an-event": {
    title: "How to Plan an Event",
    intro: "Use this flow to move from a rough event idea to a published, manageable event.",
    steps: [
      ["Define the purpose", "Start by writing the event goal, expected audience, and the outcome you want. This helps decide the format, capacity, ticket type, and promotion plan."],
      ["Create the basic event details", "Add the event name, description, category, date, time, venue or meeting link, and registration deadline before inviting attendees."],
      ["Build the registration flow", "Choose the ticket class, customize the registration form, and decide whether attendees need approval, payment, or waitlist support."],
      ["Assign the team", "Give organizers, staff, speakers, and volunteers clear roles so each person knows what to manage before and during the event."],
      ["Publish and review", "Publish the event, monitor registrations, check ticket sales, and use reports to improve the event before event day."],
    ],
  },
  "types-of-events": {
    title: "Types of Events",
    intro: "Different events need different workflows, teams, and attendee journeys.",
    steps: [
      ["Educational events", "Workshops, seminars, symposiums, and college fests need sessions, speakers, registration forms, and attendee certificates."],
      ["Business events", "Product launches, conferences, networking events, and expos need branding, sponsor details, ticket classes, and lead tracking."],
      ["Community events", "Public awareness events, charity events, and meetups need simple registration, clear venue details, and strong communication."],
      ["Hybrid events", "Hybrid events need both venue information and meeting links so offline and online attendees can join smoothly."],
    ],
  },
  "event-strategy-guide": {
    title: "Event Strategy Guide",
    intro: "A good strategy keeps the event focused from planning to reporting.",
    steps: [
      ["Set the event objective", "Decide whether the event is for learning, revenue, networking, promotion, hiring, or community building."],
      ["Identify the audience", "Define who should attend and what information they need before registering."],
      ["Plan the value", "Decide what attendees gain from the event, such as sessions, speakers, certificates, demos, or networking."],
      ["Measure success", "Track registrations, attendance, ticket sales, revenue, session interest, and post-event feedback."],
    ],
  },
  "event-planning-for-corporates": {
    title: "Event Planning for Corporates",
    intro: "Corporate events need clear ownership, branding, communication, and measurable outcomes.",
    steps: [
      ["Confirm stakeholders", "List the business owners, organizing team, speakers, sponsors, and approval contacts."],
      ["Protect the brand", "Use consistent event banners, sponsor logos, email messages, ticket branding, and public page content."],
      ["Control registrations", "Use ticket classes, approval settings, custom fields, and attendee lists to manage access."],
      ["Report outcomes", "Review revenue, attendance, lead activity, check-in count, and event feedback after completion."],
    ],
  },
  "event-budgeting": {
    title: "Event Budgeting",
    intro: "Budgeting helps compare cost, income, discounts, and final event value.",
    steps: [
      ["List event costs", "Include venue, equipment, food, speakers, promotion, staff, software, printing, and travel."],
      ["Define ticket pricing", "Create ticket classes like normal, silver, gold, or diamond based on benefits and seat limits."],
      ["Track payments", "Monitor paid, pending, failed, refunded, and free registrations in the payment section."],
      ["Review revenue", "Use sales summary and revenue reports to compare expected income with actual collections."],
    ],
  },
  "venue-management": {
    title: "Venue Management",
    intro: "Good venue planning makes event-day movement easier for attendees and staff.",
    steps: [
      ["Add venue details", "Enter venue name, address, hall, floor, parking details, and directions."],
      ["Map the attendee flow", "Decide where check-in, help desk, stage, sessions, food, and exits will be placed."],
      ["Assign staff points", "Place staff at registration desks, gates, halls, and speaker areas."],
      ["Prepare fallback notes", "Keep emergency contacts, alternate rooms, and support instructions ready."],
    ],
  },
  "risk-management": {
    title: "Risk Management",
    intro: "Risk planning keeps small issues from becoming event-day problems.",
    steps: [
      ["Identify common risks", "Review capacity, payments, venue access, speaker availability, weather, and staff coverage."],
      ["Create backup plans", "Prepare alternate speakers, backup meeting links, manual check-in, and waitlist handling."],
      ["Communicate changes", "Use announcements and email updates when timing, venue, or registration status changes."],
      ["Review after the event", "Document what went wrong and update the next event plan with better controls."],
    ],
  },
  "planning-timeline": {
    title: "Planning Timeline",
    intro: "A timeline helps the team know what must happen before the event goes live.",
    steps: [
      ["Draft stage", "Create the event, add basic information, and prepare the first version of the event page."],
      ["Setup stage", "Add agenda, speakers, sponsors, ticket classes, registration form, and team members."],
      ["Publish stage", "Publish the public page, share the link, and start tracking registrations."],
      ["Event-day stage", "Use check-in, attendance, scanner, announcements, and staff tasks to run the event."],
      ["Report stage", "Review revenue, registrations, attendance, tickets, and feedback."],
    ],
  },
  "virtual-event-planning": {
    title: "Virtual Event Planning",
    intro: "Virtual events need simple access, clear reminders, and reliable session links.",
    steps: [
      ["Choose the platform", "Add Zoom, Google Meet, Teams, or a custom meeting link with password details if needed."],
      ["Prepare attendee instructions", "Explain how and when attendees should join, including time zone and access rules."],
      ["Assign online support", "Give staff responsibility for chat, session access, speaker support, and attendance checks."],
      ["Review attendance", "Compare registrations with actual attendance to measure reach and engagement."],
    ],
  },
  "event-briefing-template": {
    title: "Event Briefing Template",
    intro: "A briefing keeps every team member aligned before event day.",
    steps: [
      ["Event summary", "Include event name, purpose, date, time, venue or meeting link, capacity, and audience."],
      ["Team responsibilities", "List each role, duty, shift, contact number, and escalation path."],
      ["Agenda overview", "Share session order, speaker timing, breaks, check-in time, and closing flow."],
      ["Important rules", "Add ticket validation, attendee approval, badge printing, refund, and emergency rules."],
    ],
  },
  "event-debrief-questions": {
    title: "Event Debrief Questions",
    intro: "A debrief helps improve future events using real event data and team feedback.",
    steps: [
      ["Review attendance", "Compare registered attendees, checked-in attendees, no-shows, and session attendance."],
      ["Review revenue", "Check ticket sales, failed payments, refunds, discounts, and final revenue."],
      ["Review operations", "Ask whether check-in, QR scanning, staff roles, and announcements worked smoothly."],
      ["Plan improvements", "Record changes for venue flow, agenda timing, ticket setup, and communication."],
    ],
  },
  "outdoor-event-planning": {
    title: "Outdoor Event Planning",
    intro: "Outdoor events need extra planning for space, weather, movement, and safety.",
    steps: [
      ["Plan the location", "Map entry gates, stages, booths, parking, food areas, restrooms, and emergency exits."],
      ["Prepare weather backup", "Keep tents, alternate locations, timing changes, and attendee communication ready."],
      ["Control entry", "Use QR tickets, staff checkpoints, and clear signage for attendee flow."],
      ["Track capacity", "Monitor available seats, walk-ins, check-ins, and crowd movement."],
    ],
  },
  "event-content-creation-guide": {
    title: "Event Content Creation Guide",
    intro: "Good event content helps attendees understand why they should register.",
    steps: [
      ["Write the event summary", "Explain what the event is, who it is for, and what attendees will gain."],
      ["Add speaker and agenda content", "Include session titles, speaker bios, timing, and key highlights."],
      ["Prepare promotion content", "Create short messages for social media, email invites, and public sharing."],
      ["Keep content updated", "Update venue, timing, ticket, and speaker changes before publishing reminders."],
    ],
  },
};

function LandingGuidePage() {
  const { slug } = useParams();
  const guide = guideContent[slug] || guideContent["how-to-plan-an-event"];
  const showLandingProfile = Boolean(
    localStorage.getItem("token") || localStorage.getItem("email")
  );

  useEffect(() => {
    const items = document.querySelectorAll(".landing-step-reveal");
    items.forEach((item, index) => {
      setTimeout(() => item.classList.add("is-visible"), 160 + index * 140);
    });
  }, [slug]);

  return (
    <div className="landing-page">
      <nav className="landing-topbar">
        <Link to="/" className="d-flex align-items-center gap-2 text-white text-decoration-none">
          <div className="landing-logo-box">
            <img src={logo} alt="FIC BackRooms Logo" />
          </div>
          <h1 className="landing-brand mb-0">FIC BackRooms</h1>
        </Link>

        <div className="ms-auto d-flex align-items-center gap-3">
          <Link to="/" className="landing-top-link">Home</Link>
          <Link to="/create-portal" className="landing-top-link">Create Portal</Link>
          {showLandingProfile ? (
            <UserProfileMenu dark mode="landing" />
          ) : (
            <Link to="/login" className="landing-login-btn">Login</Link>
          )}
        </div>
      </nav>

      <main className="landing-guide-page">
        <div className="container">
          <Link to="/" className="landing-back-link">Back to landing</Link>

          <div className="landing-guide-article landing-step-reveal">
            <p className="landing-kicker">Guide</p>
            <h1>{guide.title}</h1>
            <p>{guide.intro}</p>

            <div className="landing-guide-steps">
              {guide.steps.map(([title, text], index) => (
                <div className="landing-guide-step landing-step-reveal" key={title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 landing-step-reveal">
              <Link to="/create-portal" className="landing-primary-btn">
                Start Planning
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LandingGuidePage;
