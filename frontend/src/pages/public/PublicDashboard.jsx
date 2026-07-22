import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import logo from "../../assets/images/fic-logo.png";
import heroImage from "../../assets/images/hero-event.jpg";
import { getDefaultBanner } from "../../utils/bannerUtils";
import UserProfileMenu from "../../components/Public/UserProfileMenu";
import {
  BsSearch,
  BsGeoAlt,
  BsCalendarEvent,
  BsPeople,
  BsGrid,
  BsMortarboard,
  BsLaptop,
  BsFire,
  BsArrowRight,
  BsBriefcase,
  BsHeartPulse,
  BsCupHot,
  BsMusicNoteBeamed,
  BsTrophy,
  BsCrosshair,
} from "react-icons/bs";

const EVENT_CATEGORIES = [
  { label: "All Events", icon: <BsGrid />, keywords: [] },
  {
    label: "Education",
    icon: <BsMortarboard />,
    keywords: ["education", "college fest", "seminar", "workshop", "symposium", "webinar", "conference"],
  },
  {
    label: "Technology & Startup",
    icon: <BsLaptop />,
    keywords: ["technology", "technical", "tech", "hackathon", "coding", "software", "ai", "startup", "product launch"],
  },
  {
    label: "Business & Career",
    icon: <BsBriefcase />,
    keywords: ["business", "corporate", "career", "job fair", "career fair", "placement", "training", "networking", "alumni", "exhibition", "expo"],
  },
  {
    label: "Health & Fitness",
    icon: <BsHeartPulse />,
    keywords: ["health", "medical", "fitness", "wellness", "yoga", "marathon", "cycling", "zumba", "gym", "blood donation"],
  },
  {
    label: "Food & Lifestyle",
    icon: <BsCupHot />,
    keywords: ["food", "cooking", "restaurant", "catering", "lifestyle"],
  },
  {
    label: "Music & Entertainment",
    icon: <BsMusicNoteBeamed />,
    keywords: ["music", "concert", "festival", "dj", "dance", "comedy", "film", "movie", "show", "cultural", "entertainment"],
  },
  {
    label: "Sports",
    icon: <BsTrophy />,
    keywords: ["sport", "physical", "tournament", "championship", "game"],
  },
  {
    label: "Community & Social",
    icon: <BsPeople />,
    keywords: ["community", "public awareness", "charity", "donation", "social", "meetup"],
  },
];

const eventMatchesCategory = (event, category) => {
  if (category.label === "All Events") return true;

  const eventText = `${event.eventType || ""} ${event.eventName || ""}`.toLowerCase();
  return category.keywords.some((keyword) => eventText.includes(keyword));
};

const districts = [
  { district: "Ariyalur", state: "Tamil Nadu" },
  { district: "Chengalpattu", state: "Tamil Nadu" },
  { district: "Chennai", state: "Tamil Nadu" },
  { district: "Coimbatore", state: "Tamil Nadu" },
  { district: "Cuddalore", state: "Tamil Nadu" },
  { district: "Dharmapuri", state: "Tamil Nadu" },
  { district: "Dindigul", state: "Tamil Nadu" },
  { district: "Erode", state: "Tamil Nadu" },
  { district: "Kallakurichi", state: "Tamil Nadu" },
  { district: "Kanchipuram", state: "Tamil Nadu" },
  { district: "Kanniyakumari", state: "Tamil Nadu" },
  { district: "Karur", state: "Tamil Nadu" },
  { district: "Krishnagiri", state: "Tamil Nadu" },
  { district: "Madurai", state: "Tamil Nadu" },
  { district: "Mayiladuthurai", state: "Tamil Nadu" },
  { district: "Nagapattinam", state: "Tamil Nadu" },
  { district: "Namakkal", state: "Tamil Nadu" },
  { district: "Nilgiris", state: "Tamil Nadu" },
  { district: "Perambalur", state: "Tamil Nadu" },
  { district: "Pudukkottai", state: "Tamil Nadu" },
  { district: "Ramanathapuram", state: "Tamil Nadu" },
  { district: "Ranipet", state: "Tamil Nadu" },
  { district: "Salem", state: "Tamil Nadu" },
  { district: "Sivaganga", state: "Tamil Nadu" },
  { district: "Tenkasi", state: "Tamil Nadu" },
  { district: "Thanjavur", state: "Tamil Nadu" },
  { district: "Theni", state: "Tamil Nadu" },
  { district: "Thoothukudi", state: "Tamil Nadu" },
  { district: "Tiruchirappalli", state: "Tamil Nadu" },
  { district: "Tirunelveli", state: "Tamil Nadu" },
  { district: "Tirupathur", state: "Tamil Nadu" },
  { district: "Tiruppur", state: "Tamil Nadu" },
  { district: "Tiruvallur", state: "Tamil Nadu" },
  { district: "Tiruvannamalai", state: "Tamil Nadu" },
  { district: "Tiruvarur", state: "Tamil Nadu" },
  { district: "Vellore", state: "Tamil Nadu" },
  { district: "Viluppuram", state: "Tamil Nadu" },
  { district: "Virudhunagar", state: "Tamil Nadu" },
  { district: "Bagalkot", state: "Karnataka" },
  { district: "Ballari", state: "Karnataka" },
  { district: "Belagavi", state: "Karnataka" },
  { district: "Bengaluru Rural", state: "Karnataka" },
  { district: "Bengaluru Urban", state: "Karnataka" },
  { district: "Bidar", state: "Karnataka" },
  { district: "Chamarajanagar", state: "Karnataka" },
  { district: "Chikkaballapur", state: "Karnataka" },
  { district: "Chikkamagaluru", state: "Karnataka" },
  { district: "Chitradurga", state: "Karnataka" },
  { district: "Dakshina Kannada", state: "Karnataka" },
  { district: "Davanagere", state: "Karnataka" },
  { district: "Dharwad", state: "Karnataka" },
  { district: "Gadag", state: "Karnataka" },
  { district: "Hassan", state: "Karnataka" },
  { district: "Haveri", state: "Karnataka" },
  { district: "Kalaburagi", state: "Karnataka" },
  { district: "Kodagu", state: "Karnataka" },
  { district: "Kolar", state: "Karnataka" },
  { district: "Koppal", state: "Karnataka" },
  { district: "Mandya", state: "Karnataka" },
  { district: "Mysuru", state: "Karnataka" },
  { district: "Raichur", state: "Karnataka" },
  { district: "Ramanagara", state: "Karnataka" },
  { district: "Shivamogga", state: "Karnataka" },
  { district: "Tumakuru", state: "Karnataka" },
  { district: "Udupi", state: "Karnataka" },
  { district: "Uttara Kannada", state: "Karnataka" },
  { district: "Vijayanagara", state: "Karnataka" },
  { district: "Vijayapura", state: "Karnataka" },
  { district: "Yadgir", state: "Karnataka" },
  { district: "Alluri Sitharama Raju", state: "Andhra Pradesh" },
  { district: "Anakapalli", state: "Andhra Pradesh" },
  { district: "Ananthapuramu", state: "Andhra Pradesh" },
  { district: "Annamayya", state: "Andhra Pradesh" },
  { district: "Bapatla", state: "Andhra Pradesh" },
  { district: "Chittoor", state: "Andhra Pradesh" },
  { district: "Dr. B.R. Ambedkar Konaseema", state: "Andhra Pradesh" },
  { district: "East Godavari", state: "Andhra Pradesh" },
  { district: "Eluru", state: "Andhra Pradesh" },
  { district: "Guntur", state: "Andhra Pradesh" },
  { district: "Kakinada", state: "Andhra Pradesh" },
  { district: "Krishna", state: "Andhra Pradesh" },
  { district: "Kurnool", state: "Andhra Pradesh" },
  { district: "Nandyal", state: "Andhra Pradesh" },
  { district: "NTR", state: "Andhra Pradesh" },
  { district: "Palnadu", state: "Andhra Pradesh" },
  { district: "Parvathipuram Manyam", state: "Andhra Pradesh" },
  { district: "Prakasam", state: "Andhra Pradesh" },
  { district: "Sri Potti Sriramulu Nellore", state: "Andhra Pradesh" },
  { district: "Sri Sathya Sai", state: "Andhra Pradesh" },
  { district: "Srikakulam", state: "Andhra Pradesh" },
  { district: "Tirupati", state: "Andhra Pradesh" },
  { district: "Visakhapatnam", state: "Andhra Pradesh" },
  { district: "Vizianagaram", state: "Andhra Pradesh" },
  { district: "West Godavari", state: "Andhra Pradesh" },
  { district: "YSR Kadapa", state: "Andhra Pradesh" },
];

function PublicDashboard() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Events");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showLocationConsent, setShowLocationConsent] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!locationError) return undefined;

    const timer = window.setTimeout(() => setLocationError(""), 4500);
    return () => window.clearTimeout(timer);
  }, [locationError]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      const res = await api.get("/events/public/status/PUBLISHED");
      const publishedEvents = res.data || [];

      console.log("Published events:", publishedEvents);

      setEvents(publishedEvents);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
          );

          if (!response.ok) throw new Error("Unable to identify this location");

          const data = await response.json();
          const detectedLocation =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            data.countryName;

          if (!detectedLocation) throw new Error("Unable to identify this location");
          setLocation(detectedLocation);
          setLocationError("");
        } catch (error) {
          setLocationError(
            error.message ||
              "Coordinates were received, but the city could not be identified. Enter it manually."
          );
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Precise location is blocked. Enable Location in this site's browser settings or enter your district manually."
          );
          setLocating(false);
          return;
        }

        setLocationError("Unable to fetch your current location. Enter it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const locationSuggestions = useMemo(() => {
    const locationText = location.trim().toLowerCase();

    if (!locationText) return [];

    return districts
      .filter(({ district, state }) =>
        `${district} ${state}`.toLowerCase().includes(locationText)
      )
      .slice(0, 8);
  }, [location]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const searchText = `${event.eventName || ""} ${event.description || ""} ${
        event.eventType || ""
      }`.toLowerCase();

      const locationText = `${event.venue || ""} ${
        event.eventMode === "VIRTUAL" ? "online" : ""
      }`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesLocation = locationText.includes(location.toLowerCase());

      const selectedCategory = EVENT_CATEGORIES.find(
        (category) => category.label === activeCategory
      );
      const matchesCategory = selectedCategory
        ? eventMatchesCategory(event, selectedCategory)
        : true;

      return matchesSearch && matchesLocation && matchesCategory;
    });
  }, [events, search, location, activeCategory]);

  const featuredEvent = filteredEvents[0];
  const upcomingEvents = filteredEvents.slice(0, 10);
  const popularEvents = filteredEvents.slice(0, 8);
  const allEvents = filteredEvents;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>
        {`
          .event-hover {
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          }

          .event-hover:hover {
            transform: translateY(-6px);
            box-shadow: 0 18px 38px rgba(124, 58, 237, 0.18) !important;
            border-color: rgba(124, 58, 237, 0.48) !important;
          }

          .event-hover img {
            transition: transform 220ms ease, filter 220ms ease;
          }

          .event-hover:hover img {
            transform: scale(1.04);
            filter: saturate(1.08);
          }

          .public-nav-link {
            position: relative;
            padding: 8px 10px;
            border-radius: 10px;
            transition: color 180ms ease, background 180ms ease, transform 180ms ease;
          }

          .public-nav-link:hover {
            color: #ddd6fe !important;
            background: rgba(124, 58, 237, 0.18);
            transform: translateY(-2px);
          }

          .public-nav-link::after {
            content: "";
            position: absolute;
            left: 10px;
            right: 10px;
            bottom: 4px;
            height: 2px;
            background: #a78bfa;
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 180ms ease;
          }

          .public-nav-link:hover::after {
            transform: scaleX(1);
          }

          .public-user-btn {
            transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
          }

          .public-user-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(124, 58, 237, 0.28);
            background: #ede9fe !important;
            color: #5b21b6 !important;
          }

          .category-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px 2px 12px;
            scroll-snap-type: x proximity;
          }

          .category-scroll::-webkit-scrollbar {
            height: 8px;
          }

          .category-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 999px;
          }

          .category-pill {
            flex: 0 0 auto;
            scroll-snap-align: start;
            transition: transform 180ms ease, box-shadow 180ms ease;
          }

          .category-pill:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
          }

          .location-suggestion-row {
            cursor: pointer;
          }

          .location-suggestion-row:hover {
            background: #f8fafc;
          }

          .event-horizontal-scroll {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            overscroll-behavior-inline: contain;
            scroll-snap-type: x proximity;
            padding: 4px 4px 14px;
          }

          .event-horizontal-scroll > * {
            flex: 0 0 auto;
            scroll-snap-align: start;
          }

          .event-horizontal-scroll::-webkit-scrollbar {
            height: 7px;
          }

          .event-horizontal-scroll::-webkit-scrollbar-track {
            background: #eef2f7;
            border-radius: 999px;
          }

          .event-horizontal-scroll::-webkit-scrollbar-thumb {
            background: #a5b4fc;
            border-radius: 999px;
          }

          .popular-compact-card {
            width: 190px;
            min-height: 218px;
          }

          .upcoming-scroll-card {
            width: 245px;
          }

          .public-event-mini-card {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 425px;
          }

          .public-event-mini-card > img {
            flex: 0 0 150px;
            height: 150px;
            object-fit: cover;
            width: 100%;
          }

          .public-event-mini-card-body {
            display: flex;
            flex: 1 1 auto;
            flex-direction: column;
            min-height: 0;
          }

          .public-event-mini-title {
            display: -webkit-box;
            min-height: 66px;
            overflow: hidden;
            overflow-wrap: anywhere;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }

          .public-event-mini-meta {
            align-items: flex-start;
            display: flex;
            gap: 6px;
          }

          .public-event-mini-meta svg {
            flex: 0 0 auto;
            margin-top: 2px;
          }

          .public-event-mini-venue {
            display: -webkit-box;
            min-height: 40px;
            overflow: hidden;
            overflow-wrap: anywhere;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .public-event-mini-footer {
            margin-top: auto;
          }

          .current-location-btn {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            border: 0;
            border-radius: 10px;
            background: #ede9fe;
            color: #6d28d9;
            transition: background 180ms ease, transform 180ms ease;
          }

          .current-location-btn:hover {
            background: #ddd6fe;
            transform: translateY(-1px);
          }

          @media (max-width: 767.98px) {
            .public-dashboard-navbar {
              flex-wrap: wrap;
              height: auto !important;
              padding: 9px 12px !important;
              row-gap: 8px;
            }

            .public-dashboard-brand {
              gap: 8px !important;
            }

            .public-dashboard-brand > div:first-child {
              height: 34px !important;
              width: 34px !important;
            }

            .public-dashboard-brand-name {
              font-size: 17px !important;
            }

            .public-dashboard-nav-links {
              gap: 5px !important;
              overflow-x: auto;
              scrollbar-width: none;
              width: 100%;
            }

            .public-dashboard-nav-links::-webkit-scrollbar {
              display: none;
            }

            .public-dashboard-nav-links .public-nav-link {
              flex: 0 0 auto;
              font-size: 12px;
              padding: 6px 7px;
              white-space: nowrap;
            }

            .public-dashboard-hero {
              min-height: auto !important;
            }

            .public-dashboard-hero > .container {
              padding: 34px 12px !important;
            }

            .public-dashboard-hero h1 {
              font-size: 34px !important;
            }

            .public-dashboard-search {
              align-items: stretch !important;
              display: grid !important;
              height: auto !important;
              overflow: visible !important;
            }

            .public-dashboard-search > div {
              min-height: 50px;
            }

            .public-dashboard-search > div:nth-child(2) {
              border-left: 0 !important;
              border-top: 1px solid #e5e7eb;
            }

            .public-dashboard-search > button {
              border-radius: 0 0 10px 10px !important;
              min-height: 48px;
              width: 100%;
            }

            .public-dashboard-main {
              padding: 16px 12px 28px !important;
            }

            .public-dashboard-main .rounded-4 {
              border-radius: 18px !important;
            }

            .public-dashboard-main .p-4 {
              padding: 16px !important;
            }

            .popular-compact-card {
              width: min(76vw, 230px);
            }

            .upcoming-scroll-card {
              width: min(82vw, 270px);
            }

            .event-horizontal-scroll {
              margin-left: -4px;
              margin-right: -4px;
            }

            .category-scroll {
              scrollbar-width: none;
            }

            .category-scroll::-webkit-scrollbar,
            .event-horizontal-scroll::-webkit-scrollbar {
              display: none;
            }

            .category-pill {
              font-size: 13px;
              padding: 8px 13px !important;
            }

            .public-dashboard-main section > .d-flex.justify-content-between {
              gap: 10px;
            }
          }
        `}
      </style>

      <nav
        className="public-dashboard-navbar d-flex justify-content-between align-items-center px-5"
        style={{
          height: "68px",
          background: "#030712",
          color: "#fff",
        }}
      >
        <Link
          to="/"
          className="public-dashboard-brand d-flex align-items-center gap-3 fw-bold text-decoration-none"
          aria-label="Go to FIC BackRooms home page"
        >
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#ffffff",
              overflow: "hidden",
              padding: "4px",
            }}
          >
            <img
              src={logo}
              alt="FIC BackRooms"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          <div>
            <div
              className="public-dashboard-brand-name"
              style={{
                fontSize: "22px",
                fontWeight: "700",
                lineHeight: "22px",
                color: "#e5dfe6",
              }}
            >
              FIC BackRooms
            </div>
          </div>
        </Link>

        <div className="public-dashboard-nav-links d-flex align-items-center gap-4">
          <Link to="/" className="public-nav-link text-white text-decoration-none">
            Home
          </Link>
          <Link to="/find-my-ticket" className="public-nav-link text-white text-decoration-none">
            Find My Ticket
          </Link>
          <a href="/#about" className="public-nav-link text-white text-decoration-none">
            About Us
          </a>
          <a href="/#resources" className="public-nav-link text-white text-decoration-none">
            Resources
          </a>
          <UserProfileMenu dark />
        </div>
      </nav>

      <section
        className="public-dashboard-hero"
        style={{
          minHeight: "300px",
          background: `linear-gradient(90deg, rgba(3,7,18,.95), rgba(17,24,39,.78)), url(${heroImage}) center/cover`,
          color: "#fff",
        }}
      >
        <div className="container py-5">
          <h1 className="fw-bold mb-3" style={{ fontSize: "42px" }}>
            Discover Events
          </h1>

          <p style={{ maxWidth: "520px", color: "#e5e7eb", fontSize: "17px" }}>
            Find events that match your interests and passions.
          </p>

          <Link to="/find-my-ticket" className="btn btn-outline-light mt-2">
            Find My Ticket
          </Link>

          <div
            className="public-dashboard-search bg-white d-flex align-items-center shadow mt-4"
            style={{
              maxWidth: "920px",
              height: "58px",
              borderRadius: "10px",
              overflow: "visible",
            }}
          >
            <div className="d-flex align-items-center flex-grow-1 px-3">
              <BsSearch className="text-muted me-2" />
              <input
                className="form-control border-0 shadow-none"
                placeholder="Search events, workshops, hackathons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div
              className="d-flex align-items-center flex-grow-1 px-3 border-start position-relative"
              style={{ height: "100%" }}
            >
              <BsGeoAlt className="text-muted me-2" />
              <input
                className="form-control border-0 shadow-none"
                placeholder="Enter location or Online"
                value={location}
                onFocus={() => {
                  setLocationError("");
                  setShowLocationMenu(true);
                }}
                onBlur={() => window.setTimeout(() => setShowLocationMenu(false), 150)}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setLocationError("");
                  setShowLocationMenu(true);
                }}
              />

              <button
                type="button"
                className="current-location-btn d-flex align-items-center justify-content-center"
                onClick={() => {
                  setShowLocationConsent(true);
                  setShowLocationMenu(false);
                }}
                disabled={locating}
                title="Use my current location"
                aria-label="Use my current location"
              >
                {locating ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <BsCrosshair />
                )}
              </button>

              {showLocationMenu && (!location.trim() || locationSuggestions.length > 0) && (
                <div
                  className="position-absolute bg-white text-dark shadow border"
                  style={{
                    top: "62px",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <table className="table table-sm mb-0">
                    <tbody>
                      {!location.trim() && (
                        <tr
                          className="location-suggestion-row"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setShowLocationConsent(true);
                            setShowLocationMenu(false);
                          }}
                        >
                          <td className="ps-3 py-3 fw-semibold text-primary" colSpan="2">
                            <BsCrosshair className="me-2" />
                            {locating ? "Detecting your location..." : "Use current location"}
                          </td>
                        </tr>
                      )}

                      {locationSuggestions.length > 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="px-3 pt-2 pb-1 text-uppercase text-muted fw-semibold"
                            style={{ fontSize: "11px", letterSpacing: ".06em" }}
                          >
                            Suggested locations
                          </td>
                        </tr>
                      )}

                      {locationSuggestions.map(({ district, state }) => (
                        <tr
                          key={`${district}-${state}`}
                          className="location-suggestion-row"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setLocation(district);
                            setLocationError("");
                            setShowLocationMenu(false);
                          }}
                        >
                          <td className="ps-3 fw-semibold">{district}</td>
                          <td className="pe-3 text-muted text-end">{state}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {locationError && (
                <div
                  className="position-absolute text-danger bg-white px-2 py-1 shadow-sm"
                  style={{ top: "62px", left: 0, zIndex: 21, fontSize: "12px", borderRadius: "8px" }}
                >
                  {locationError}
                </div>
              )}
            </div>

            <button
              className="btn text-white px-5 h-100"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                borderRadius: 0,
              }}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <main className="public-dashboard-main container py-4">
        <section className="mb-4">
          <div className="bg-white rounded-4 shadow-sm p-3">
            <div className="mb-3">
              <h5 className="fw-bold mb-1">Browse by category</h5>
              <p className="text-muted small mb-0">
                Select a category to view only its related events.
              </p>
            </div>

            <div className="category-scroll">
              {EVENT_CATEGORIES.map((category) => (
                <button
                  key={category.label}
                  onClick={() => setActiveCategory(category.label)}
                  aria-pressed={activeCategory === category.label}
                  className={`btn category-pill d-flex align-items-center gap-2 px-4 py-2 ${
                    activeCategory === category.label
                      ? "btn-primary"
                      : "btn-light border shadow-sm"
                  }`}
                  style={{ borderRadius: "12px" }}
                >
                  {category.icon}
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="text-muted mt-3">Loading events...</p>
          </div>
        ) : (
          <>
            <section className="row g-4 mb-4 align-items-stretch">
              <div className="col-lg-5">
                <FeaturedCard event={featuredEvent} />
              </div>

              <div className="col-lg-7">
                <div className="bg-white rounded-4 shadow-sm p-4 h-100 event-hover popular-panel">
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">
                        <BsFire className="text-danger me-2" />
                        Popular This Month
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                        Most viewed events
                      </p>
                    </div>
                  </div>

                  <div className="event-horizontal-scroll">
                    {popularEvents.map((event) => (
                      <Link
                        key={event.id}
                        to={`/public/events/${event.id}`}
                        className="popular-compact-card border rounded-4 overflow-hidden event-hover text-decoration-none text-dark bg-white"
                      >
                        <img
                          src={event.bannerUrl || getDefaultBanner(event.eventType)}
                          alt={event.eventName}
                          style={{ width: "100%", height: "92px", objectFit: "cover" }}
                        />

                        <div className="p-3">
                          <h6 className="fw-bold mb-2 text-truncate">{event.eventName}</h6>
                          <p className="text-muted mb-1 text-truncate" style={{ fontSize: "12px" }}>
                            <BsCalendarEvent className="me-1" />
                            {formatDate(event.startDateTime)}
                          </p>
                          <p className="text-muted mb-2 text-truncate" style={{ fontSize: "12px" }}>
                            <BsGeoAlt className="me-1" />
                            {event.venue || "Online"}
                          </p>
                          <span
                            className={`fw-bold ${event.paid ? "text-danger" : "text-success"}`}
                            style={{ fontSize: "13px" }}
                          >
                            {event.paid ? `Rs.${event.ticketPrice}` : "Free"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {popularEvents.length === 0 && (
                    <p className="text-muted mb-0">No popular events.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-4 shadow-sm p-4 mb-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="event-icon">
                      <BsCalendarEvent />
                    </div>
                    <h5 className="fw-bold mb-0">Upcoming Events</h5>
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                    {upcomingEvents.length} events this week
                  </p>
                </div>

                <button className="btn btn-link text-decoration-none">
                  View all
                </button>
              </div>

              <div className="event-horizontal-scroll">
                {upcomingEvents.map((event) => (
                  <div className="upcoming-scroll-card" key={event.id}>
                    <EventMiniCard event={event} />
                  </div>
                ))}
              </div>

              {upcomingEvents.length === 0 && (
                <p className="text-muted text-center py-5 mb-0">
                  No upcoming events found.
                </p>
              )}
            </section>

            <section className="bg-white rounded-4 shadow-sm p-4">
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h5 className="fw-bold mb-1">All Events</h5>
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                    Explore all upcoming events
                  </p>
                </div>

                <span className="text-muted">{allEvents.length} events</span>
              </div>

              <div className="row g-4">
                {allEvents.map((event) => (
                  <div className="col-md-3" key={event.id}>
                    <EventMiniCard event={event} />
                  </div>
                ))}
              </div>

              {allEvents.length === 0 && (
                <div className="text-center text-muted py-5">
                  No events found.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showLocationConsent && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(15, 23, 42, .58)", zIndex: 1080, padding: "20px" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-consent-title"
        >
          <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: "100%", maxWidth: "430px" }}>
            <div
              className="d-flex align-items-center justify-content-center mb-3"
              style={{ width: "52px", height: "52px", borderRadius: "16px", background: "#ede9fe", color: "#6d28d9" }}
            >
              <BsGeoAlt size={24} />
            </div>
            <h4 id="location-consent-title" className="fw-bold mb-2">
              Use your current location?
            </h4>
            <p className="text-muted mb-4">
              We use your location only to find nearby events. Your browser will ask for location permission next.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light border px-4"
                onClick={() => setShowLocationConsent(false)}
              >
                Not now
              </button>
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={() => {
                  setShowLocationConsent(false);
                  useCurrentLocation();
                }}
              >
                Allow current location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ event }) {
  const banner = event?.bannerUrl || getDefaultBanner(event?.eventType);

  return (
    <div
      className="text-white rounded-4 shadow-sm p-4 h-100 event-hover"
      style={{
        minHeight: "320px",
        background: `linear-gradient(135deg, rgba(3,7,18,.82), rgba(88,28,135,.45)), url(${banner}) center/cover`,
      }}
    >
      <span className="badge bg-primary mb-3">FEATURED</span>

      <h2 className="fw-bold mb-3">
        {event?.eventName || "Featured Event"}
      </h2>

      <p style={{ color: "#e5e7eb" }}>
        {event?.description || "Explore exciting events near you."}
      </p>

      <p>
        <BsCalendarEvent className="me-2" />
        {formatDate(event?.startDateTime)}
      </p>

      <p>
        <BsGeoAlt className="me-2" />
        {event?.venue || "Venue not added"}
      </p>

      {event && (
        <Link to={`/public/events/${event.id}`} className="btn btn-light mt-3">
          View Details <BsArrowRight className="ms-2" />
        </Link>
      )}
    </div>
  );
}

function EventMiniCard({ event }) {
  return (
    <div className="border rounded-4 overflow-hidden bg-white event-hover public-event-mini-card">
      <img
        src={event.bannerUrl || getDefaultBanner(event.eventType)}
        alt={event.eventName}
      />

      <div className="p-3 public-event-mini-card-body">
        <small className="text-primary fw-bold">
          {event.eventType || "EVENT"}
        </small>

        <h6 className="fw-bold mt-1 mb-2 public-event-mini-title">{event.eventName}</h6>

        <p className="text-muted mb-2 public-event-mini-meta" style={{ fontSize: "13px" }}>
          <BsCalendarEvent />
          <span>{formatDate(event.startDateTime)}</span>
        </p>

        <p className="text-muted mb-3 public-event-mini-meta" style={{ fontSize: "13px" }}>
          <BsGeoAlt />
          <span className="public-event-mini-venue">{event.venue || "Online"}</span>
        </p>

        <div className="d-flex justify-content-between align-items-center public-event-mini-footer">
          <span
            className={`fw-bold ${
              event.paid ? "text-danger" : "text-success"
            }`}
          >
            {event.paid ? `Rs.${event.ticketPrice}` : "Free"}
          </span>

          <Link
            to={`/public/events/${event.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "Date not added";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default PublicDashboard;
