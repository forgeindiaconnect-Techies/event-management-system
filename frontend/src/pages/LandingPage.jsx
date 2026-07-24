import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "../assets/images/hero-event.jpg";
import logo from "../assets/images/fic-logo.png";
import api from "../api/axiosConfig";
import UserProfileMenu from "../components/Public/UserProfileMenu";
import "../styles/LandingPage.css";
import {
  BsArrowRight,
  BsCalendarEvent,
  BsPeople,
  BsGraphUp,
  BsStars,
  BsArrowDown,
  BsArrowUp,
} from "react-icons/bs";

function LandingPage() {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const guideButtonRef = useRef(null);
  const guideMenuRef = useRef(null);
  const [isAtPageBottom, setIsAtPageBottom] = useState(false);
  const showLandingProfile = Boolean(
    localStorage.getItem("token") || localStorage.getItem("email")
  );
  const dashboardRoutes = {
    PORTAL_ADMIN: "/admin",
    ORGANIZER: "/organizer",
    STAFF: "/staff",
    VOLUNTEER: "/volunteer",
    COORDINATOR: "/coordinator",
    SPEAKER: "/speaker",
    JUDGE: "/judge",
    TRAINER: "/mentor",
    CHIEF_GUEST: "/chief-guest",
    PARTICIPANT: "/participant",
  };
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const getStartedPath = localStorage.getItem("token")
    ? dashboardRoutes[role] || "/login"
    : "/create-portal";
  const [statsData, setStatsData] = useState({
    events: 0,
    registrations: 0,
    organizers: 0,
    reliability: "Live",
  });

  useEffect(() => {
    const revealItems = document.querySelectorAll(".landing-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("is-visible");
            }, Number(entry.target.dataset.delay || 0));
          }
        });
      },
      { threshold: 0.18 }
    );

    revealItems.forEach((item, index) => {
      item.dataset.delay = String((index % 4) * 120);
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!guideOpen) return undefined;

    const closeGuideOutside = (event) => {
      if (!guideButtonRef.current?.contains(event.target) && !guideMenuRef.current?.contains(event.target)) {
        setGuideOpen(false);
      }
    };

    document.addEventListener("mousedown", closeGuideOutside);
    document.addEventListener("touchstart", closeGuideOutside);
    return () => {
      document.removeEventListener("mousedown", closeGuideOutside);
      document.removeEventListener("touchstart", closeGuideOutside);
    };
  }, [guideOpen]);

  useEffect(() => {
    loadLandingStats();
  }, []);

  useEffect(() => {
    const updateScrollDirection = () => {
      const pageBottom = window.scrollY + window.innerHeight;
      setIsAtPageBottom(pageBottom >= document.documentElement.scrollHeight - 80);
    };
    updateScrollDirection();
    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollDirection);
  }, []);

  const loadLandingStats = async () => {
    try {
      const statsRes = await api.get("/public-stats");
      const stats = statsRes.data || {};

      setStatsData({
        events: Number(stats.events || 0),
        registrations: Number(stats.registrations || 0),
        organizers: Number(stats.organizers || 0),
        reliability: stats.reliability || "Live",
      });
    } catch (error) {
      setStatsData((current) => current);
    }
  };

  const scrollLandingPage = () => {
    if (isAtPageBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const sections = Array.from(
      document.querySelectorAll(".landing-page > section")
    );
    const nextSection = sections.find(
      (section) => section.getBoundingClientRect().top > 90
    );

    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleFindEvents = () => {
    const publicUser = sessionStorage.getItem("publicUser");
    navigate(publicUser ? "/find-events" : "/public");
  };

  const navItems = [
    ["About Us", "#about"],
    ["Resources", "#resources"],
    ["Features", "#features"],
  ];

  const stats = [
    [`${statsData.events}+`, "Events Managed", <BsPeople />],
    [`${statsData.registrations}+`, "Attendees", <BsPeople />],
    [`${statsData.organizers}+`, "Organizers", <BsCalendarEvent />],
    [statsData.reliability, "System Status", <BsGraphUp />],
  ];

  const guideLinks = [
    ["How to plan an event", "/guides/how-to-plan-an-event"],
    ["Types of events", "/guides/types-of-events"],
    ["Event strategy guide", "/guides/event-strategy-guide"],
    ["Event planning for corporates", "/guides/event-planning-for-corporates"],
    ["Event budgeting", "/guides/event-budgeting"],
    ["Venue management", "/guides/venue-management"],
    ["Risk management", "/guides/risk-management"],
    ["Planning timeline", "/guides/planning-timeline"],
    ["Virtual event planning", "/guides/virtual-event-planning"],
    ["Event briefing template", "/guides/event-briefing-template"],
    ["Event debrief questions", "/guides/event-debrief-questions"],
    ["Outdoor event planning", "/guides/outdoor-event-planning"],
    ["Event content creation guide", "/guides/event-content-creation-guide"],
  ];

  const heroCards = [
    ["All-in-One Platform", "Manage everything in one place", "#all-in-one-platform"],
    ["Secure & Reliable", "Your data is always protected", "#secure-reliable"],
    ["Insights That Matter", "Real-time reports and analytics", "#insights-matter"],
  ];

  const pillarTopics = [
    [
      "all-in-one-platform",
      "All-in-One Platform",
      "Planning",
      "The platform brings event creation, ticket classes, registrations, team assignments, event-day tools, public pages, and reports into one working system.",
      "Organizers can move from event draft to published event without switching between separate tools.",
      ["Agenda builder", "Schedule event sessions, speakers, and timelines before publishing."],
      ["Registration setup", "Create ticket classes, approval rules, and custom attendee forms in one place."],
    ],
    [
      "secure-reliable",
      "Secure & Reliable",
      "Control",
      "Role based access keeps organizers, staff, volunteers, speakers, and attendees inside the correct workflow. Tickets, QR check-in, approvals, and portal data stay structured.",
      "This keeps the event team focused while the system handles access and consistency.",
      ["Role permissions", "Assign organizers, staff, volunteers, and speakers only to the work they manage."],
      ["Ticket validation", "Use QR tickets, approvals, and check-in status to protect event entry."],
    ],
    [
      "insights-matter",
      "Insights That Matter",
      "Reporting",
      "Registration counts, attendee status, ticket sales, revenue, check-in progress, and reports give the team a clear view of what is happening.",
      "The event can be improved before publishing, during live check-in, and after the final report.",
      ["Live dashboards", "Track events, attendees, ticket classes, revenue, and check-in progress."],
      ["Post-event reports", "Review registrations, attendance, sales summary, and event performance."],
    ],
  ];

  const resources = [
    ["Event Setup", "Create portals, configure events, publish pages, and manage event visibility."],
    ["Registration Tools", "Build custom forms, manage tickets, approve attendees, and handle payments."],
    ["Live Event Support", "Use check-in, attendance, QR tickets, announcements, and staff workflows."],
  ];

  const features = [
    ["Find Your Events", "Attendees can discover public events, search by interest, view event details, and register from the public event pages."],
    ["Smart Event Search", "Visitors can browse available events and move directly into event details, registration, payment, and ticket pages."],
    ["Digital Tickets", "Generate attendee tickets with QR codes so event-day check-in and validation stay simple."],
    ["Public Registration", "Collect attendee details through custom event forms that organizers configure for each event."],
    ["Organizer Dashboard", "Track assigned events, registrations, staff, sales, and event status in one place."],
    ["Event Customization", "Manage event info, agenda, speakers, sponsors, library files, and custom forms."],
    ["Reports & Insights", "Review revenue, registrations, attendance, ticket sales, and event performance."],
    ["Role Based Workflows", "Give organizers, staff, volunteers, speakers, and coordinators focused dashboards."],
  ];

  return (
    <div className="landing-page">
      <nav className="landing-topbar">
        <Link
          to="/"
          className="d-flex align-items-center gap-2 text-decoration-none"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Go to main page"
        >
          <div className="landing-logo-box">
            <img src={logo} alt="FIC BackRooms Logo" />
          </div>
          <h1 className="landing-brand mb-0">FIC BackRooms</h1>
        </Link>

        <div className="landing-section-nav landing-navbar-links">
          {navItems.map(([label, href]) => (
            <a href={href} className="landing-nav-link" key={label}>{label}</a>
          ))}
          <div ref={guideButtonRef} className="landing-guide-hover">
            <button
              type="button"
              className="landing-nav-link landing-guide-toggle"
              onClick={() => setGuideOpen((open) => !open)}
            >
              Guides <span>{guideOpen ? "▴" : "▾"}</span>
            </button>
            {guideOpen && (
              <div ref={guideMenuRef} className="landing-guide-menu landing-guide-menu-compact landing-guide-menu-open">
                <div className="landing-guide-menu-header">
                  <div>
                    <p>Guide Library</p>
                    <h3>Event planning resources</h3>
                  </div>
                </div>
                <div className="landing-guide-menu-list">
                  {guideLinks.map(([label, path]) => (
                    <Link key={path} to={path} className="landing-guide-menu-link">
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 me-3 landing-top-actions">
          <button onClick={handleFindEvents} className="landing-top-link landing-explore-link border-0 bg-transparent">
            Explore Events
          </button>

          {showLandingProfile ? (
            <UserProfileMenu dark mode="landing" />
          ) : (
            <div className="landing-auth-actions">
              <Link to="/create-portal" className="landing-signup-btn">Sign Up</Link>
              <Link to="/login" className="landing-login-btn">Login</Link>
            </div>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-glow" />

        <div className="container-fluid px-5 position-relative">
          <div className="row align-items-center landing-hero-content">
            <div className="col-md-6">
              <div className="landing-eyebrow">
                <BsStars /> The Complete Event Management Workspace
              </div>

              <h1 className="landing-hero-title">
                Everything Behind <br />
                a <span>Successful</span> Event.
              </h1>

              <p className="landing-hero-text">
                FIC BackRooms empowers event organizers to plan, manage, and
                execute events seamlessly, from registrations to analytics.
              </p>

              <div className="d-flex gap-3 mb-4 flex-wrap">
                <Link to={getStartedPath} className="landing-primary-btn">
                  Get Started <BsArrowRight className="ms-2" />
                </Link>

                <button onClick={handleFindEvents} className="landing-outline-btn">
                  Find Events <BsCalendarEvent className="ms-2" />
                </button>
              </div>

              <div className="row mt-4 g-3">
                {heroCards.map(([title, text, href]) => (
                  <div className="col-md-4" key={title}>
                    <a href={href} className="feature-card-small">
                      <div className="feature-icon-small">
                        <BsStars />
                      </div>
                      <div>
                        <h6>{title}</h6>
                        <p>{text}</p>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-md-6 landing-hero-image-column">
              <div className="hero-image-card">
                <img src={heroImage} alt="Event management workspace" className="hero-image" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container position-relative landing-stats-wrap">
        <div className="bg-white rounded-4 shadow p-3">
          <div className="row g-4">
            {stats.map(([num, label, icon]) => (
              <div className="col-md-3" key={label}>
                <div className="landing-stat-card">
                  <div className="landing-stat-icon">{icon}</div>
                  <div>
                    <h2>{num}</h2>
                    <p>{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="landing-section landing-pillars-section">
        <div className="container">
        <div className="landing-feature-intro landing-reveal">
          <h2>Why all-in-one event management software?</h2>
          <p>
            Today, event teams need one professional place to plan events, manage
            attendees, control tickets, assign roles, and understand performance.
            These three core strengths support the event from the first draft to
            the final report.
          </p>
        </div>

        <div className="landing-pillar-stack">
          {pillarTopics.map(([id, title, category, text, note, firstPoint, secondPoint], index) => (
            <div
              id={id}
              className="landing-pillar-card landing-reveal"
              key={title}
            >
              <div>
                <h4 className="landing-colored-heading">{category}</h4>
                <h3>{title}</h3>
                <p>{text}</p>
                <span>{note}</span>
                <div className="landing-pillar-detail-list">
                  {[firstPoint, secondPoint].map(([detailTitle, detailText]) => (
                    <div key={detailTitle}>
                      <strong>{detailTitle}</strong>
                      <p>{detailText}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="landing-pillar-preview">
                <div className="landing-preview-top">
                  <span>{index === 0 ? "Planning Board" : index === 1 ? "Secure Access" : "Live Insights"}</span>
                </div>
                <div className="landing-preview-lines">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="landing-preview-panel">
                  <strong>{title}</strong>
                  <p>{category} workspace</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section id="about" className="container landing-section">
        <h2 className="text-center fw-bold mb-4 landing-section-title landing-reveal">
          Trusted by Organizations
        </h2>

        <div className="landing-trust-row landing-reveal">
          <span>TechFest</span>
          <span>CodeClub</span>
          <span>Cultural Committee</span>
          <span>Innovation Hub</span>
          <span>Student Council</span>
        </div>

        <div className="row align-items-center g-5 landing-reveal">
          <div className="col-md-5">
            <div className="landing-about-visual">
              <div>
                <span>Plan</span>
                <strong>Event Flow</strong>
              </div>
              <div>
                <span>Manage</span>
                <strong>Team Roles</strong>
              </div>
              <div>
                <span>Review</span>
                <strong>Live Reports</strong>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <p className="landing-kicker">About Us</p>
            <h2 className="fw-bold mb-3 landing-content-title">
              Empowering Event Organizers Every Step of the Way
            </h2>
            <p className="text-muted landing-content-text">
              FIC BackRooms is built to simplify event management for everyone.
              From small meetups to grand festivals, we provide the tools,
              insights, and support you need to create impactful experiences.
            </p>
          </div>
        </div>
      </section>

      <section id="resources" className="landing-section landing-soft-section">
        <div className="container">
          <div className="landing-section-heading landing-reveal">
            <p className="landing-kicker">Resources</p>
            <h2>Everything Your Team Needs to Prepare</h2>
            <p>
              Practical workspaces for setup, registration, event-day movement,
              and post-event review.
            </p>
          </div>

          <div className="row g-4">
            {resources.map(([title, text]) => (
              <div className="col-md-4" key={title}>
                <div className="landing-info-card landing-reveal h-100">
                  <div className="landing-card-icon">
                    <BsStars />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="container landing-section">
        <div className="landing-section-heading landing-reveal">
          <p className="landing-kicker">Features</p>
          <h2>Professional Tools for Modern Events</h2>
          <p>
            Keep planning, registration, live operations, and reporting connected
            across one event management system.
          </p>
        </div>

        <div className="row g-4">
          {features.map(([title, text]) => (
            <div className="col-md-6" key={title}>
              <div className="landing-feature-box landing-reveal">
                <div className="landing-feature-icon">
                  <BsGraphUp />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-contact-section">
        <div className="container">
          <div className="landing-contact-card landing-reveal">
            <div>
              <p className="landing-kicker">Contact</p>
              <h2>Start managing your events with FIC BackRooms</h2>
              <p>
                For support or setup questions, contact our system team at{" "}
                <a href="mailto:support@ficbackrooms.com">support@ficbackrooms.com</a>.
              </p>
            </div>

            <Link to="/create-portal" className="landing-primary-btn">
              Create Portal <BsArrowRight className="ms-2" />
            </Link>
          </div>
        </div>
      </section>

      <div className="landing-scroll-controls" aria-label="Page navigation">
        <button
          type="button"
          className="landing-scroll-button"
          onClick={scrollLandingPage}
          aria-label={isAtPageBottom ? "Return to navbar" : "Scroll to bottom"}
          title={isAtPageBottom ? "Back to navbar" : "Scroll to bottom"}
        >
          <span className="landing-arrow-glitter glitter-one" />
          <span className="landing-arrow-glitter glitter-two" />
          <span className="landing-arrow-glitter glitter-three" />
          {isAtPageBottom ? <BsArrowUp /> : <BsArrowDown />}
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
