import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { getDefaultBanner } from "../../utils/bannerUtils";
import {
  BsCalendarEvent,
  BsFilm,
  BsGeoAlt,
  BsFire,
  BsStarFill,
  BsArrowRight,
  BsTicketPerforated,
  BsLightningChargeFill,
  BsShieldCheck,
  BsStars,
  BsClock,
  BsTag,
} from "react-icons/bs";

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80";

export default function PublicForYouFeed({ events = [], searchQuery = "" }) {
  const navigate = useNavigate();
  const [dbShowtimes, setDbShowtimes] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatabaseShowtimes();
  }, []);

  const loadDatabaseShowtimes = async () => {
    try {
      setLoading(true);
      const pubRes = await api.get("/theater/public/showtimes").catch(() => ({ data: [] }));
      let allShows = Array.isArray(pubRes.data) ? pubRes.data : [];

      const moviesRes = await api.get("/movies").catch(() => ({ data: [] }));
      setAllMovies(Array.isArray(moviesRes.data) ? moviesRes.data : []);

      const thRes = await api.get("/theater/list").catch(() => ({ data: [] }));
      const thList = Array.isArray(thRes.data) ? thRes.data : [];

      const thMap = new Map();
      thList.forEach((th) => {
        if (th.id) thMap.set(String(th.id), th);
        if (th.portal?.id) thMap.set(String(th.portal.id), th);
        if (th.theaterPortal?.id) thMap.set(String(th.theaterPortal.id), th);
      });

      // Filter and deduplicate
      const dedupMap = new Map();
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 15);

      allShows.forEach((st) => {
        if (!st || !st.movieTitle) return;

        if (st.showDate && st.startTime) {
          try {
            const showDateTime = new Date(`${st.showDate} ${st.startTime}`);
            if (!isNaN(showDateTime.getTime()) && showDateTime < cutoffTime) {
              return;
            }
          } catch (e) {
            // ignore parse errors
          }
        }

        const dedupeKey = st.id ? String(st.id) : `${st.movieTitle}_${st.showDate}_${st.startTime}`;
        if (!dedupMap.has(dedupeKey)) dedupMap.set(dedupeKey, st);
      });

      setDbShowtimes(Array.from(dedupMap.values()));
    } catch (err) {
      console.warn("Error loading showtimes", err);
    } finally {
      setLoading(false);
    }
  };

  const databaseMovies = useMemo(() => {
    const map = new Map();
    dbShowtimes.forEach((st) => {
      if (!st || !st.movieTitle) return;
      const key = st.movieTitle.trim();

      let genre = st.genre || st.movieGenre || "";
      if (!genre) {
        const matchingMovie = allMovies.find(
          (m) => (st.movieId && m.id === st.movieId) ||
                 (m.title && m.title.trim().toLowerCase() === key.toLowerCase())
        );
        if (matchingMovie?.genre) genre = matchingMovie.genre;
      }
      if (!genre) {
        const t = key.toLowerCase();
        if (t.includes("avenger") || t.includes("endgame")) genre = "Action / Sci-Fi / Adventure";
        else if (t.includes("paradise")) genre = "Action / Thriller / Drama";
        else if (t.includes("goat") || t.includes("greatest of all time")) genre = "Action / Sci-Fi / Thriller";
        else if (t.includes("coolie")) genre = "Action / Crime / Thriller";
        else if (t.includes("loki")) genre = "Action / Fantasy / Sci-Fi";
        else genre = "Action / Drama";
      }

      const existing = map.get(key) || {
        id: `movie_${key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        title: key,
        genre: genre,
        movieId: st.movieId || null,
        poster: st.posterUrl || DEFAULT_POSTER,
        showtimes: [],
        minPrice: 120,
      };
      if (!existing.poster || existing.poster === DEFAULT_POSTER) {
        if (st.posterUrl) existing.poster = st.posterUrl;
      }
      if (!existing.movieId && st.movieId) existing.movieId = st.movieId;
      if (!existing.genre && genre) existing.genre = genre;

      existing.showtimes.push(st);

      if (st.classPrices) {
        const prices = String(st.classPrices).match(/\d+/g);
        if (prices && prices.length > 0) {
          const parsed = prices.map(Number);
          existing.minPrice = Math.min(existing.minPrice, ...parsed);
        }
      }
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [dbShowtimes, allMovies]);

  const featuredEvent = events[0] || null;
  const popularEvents = events.slice(0, 8);
  const trendingMovies = databaseMovies
    .filter((movie) => {
      if (!searchQuery.trim()) return true;
      return movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, 8);

  const heroItem = featuredEvent;

  const navigateToMovie = (movie) => {
    const movieIdParam = movie.movieId ? `&movieId=${encodeURIComponent(movie.movieId)}` : "";
    const titleParam = movie.title ? `&movieTitle=${encodeURIComponent(movie.title)}` : "";
    navigate(`/find-events?tab=movie&view=DETAILS${movieIdParam}${titleParam}`);
  };

  const formatDate = (date) => {
    if (!date) return "Date not announced";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="public-for-you-feed pb-5 fade-in-up">
      {/* ── 1. HERO HIGHLIGHT BANNER ── */}
      {heroItem && (
        <section
          className="position-relative overflow-hidden mb-4 mb-md-5 rounded-bottom-4 shadow-sm"
          style={{
            minHeight: "clamp(340px, 48vh, 460px)",
            background: `linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.82) 50%, rgba(15, 23, 42, 0.5) 100%), url(${
              heroItem.bannerUrl || getDefaultBanner(heroItem.eventType)
            }) center/cover no-repeat`,
            color: "#ffffff",
          }}
        >
          <div className="container py-4 py-md-5 h-100 d-flex align-items-center">
            <div style={{ maxWidth: "620px" }}>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                <span className="badge bg-danger px-3 py-1.5 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-1.5">
                  <BsFire /> FEATURED EXPERIENCE
                </span>
                {heroItem.eventType && (
                  <span className="badge bg-white bg-opacity-20 text-white rounded-pill px-3 py-1.5 fw-semibold">
                    {heroItem.eventType}
                  </span>
                )}
              </div>

              <h1
                className="fw-bold mb-3 text-white"
                style={{
                  fontSize: "clamp(24px, 4.5vw, 42px)",
                  lineHeight: "1.18",
                  letterSpacing: "-0.5px",
                }}
              >
                {heroItem.eventName}
              </h1>

              <p
                className="text-light text-opacity-85 mb-4"
                style={{
                  fontSize: "clamp(13.5px, 2vw, 16px)",
                  lineHeight: "1.5",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {heroItem.description || "Experience top-rated events, performances, and gatherings tailored for you."}
              </p>

              <div className="d-flex flex-wrap gap-2 gap-sm-3 mb-4 small">
                <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5">
                  <BsCalendarEvent className="text-info" /> {formatDate(heroItem.startDateTime)}
                </span>
                <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5">
                  <BsGeoAlt className="text-warning" /> {heroItem.venue || "Online / Virtual"}
                </span>
              </div>

              <div>
                <Link
                  to={`/public/events/${heroItem.id}`}
                  className="btn btn-light px-4 py-2 fw-bold rounded-pill shadow-lg d-inline-flex align-items-center gap-2 hover-scale"
                  style={{ fontSize: "14px" }}
                >
                  <BsTicketPerforated /> Explore & Register <BsArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. MAIN FEED CONTAINER ── */}
      <div className={`container px-3 px-md-4 ${heroItem ? "" : "pt-4 pt-md-5 mt-2"}`}>
        {/* ── 3. POPULAR MOVIES SHOWCASE (NOW ON TOP) ── */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark" style={{ fontSize: "clamp(18px, 3vw, 22px)" }}>
                <BsFilm className="text-danger" /> Now In Theaters
              </h4>
              <small className="text-muted d-none d-sm-inline">Catch the latest blockbusters and cinema releases</small>
            </div>
            <Link
              to="/find-events?tab=movie"
              className="text-decoration-none fw-bold text-danger small d-inline-flex align-items-center gap-1"
            >
              <span>Explore All</span> <BsArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm">
              <div className="spinner-border text-danger" role="status"></div>
              <div className="small text-muted mt-2">Loading showtimes...</div>
            </div>
          ) : (
            <div
              className="d-flex flex-nowrap gap-3 gap-md-4 overflow-auto pb-3 custom-scrollbar"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "thin" }}
            >
              {trendingMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="card border-0 rounded-4 shadow-sm flex-shrink-0 position-relative event-hover cursor-pointer bg-white overflow-hidden"
                  style={{ width: "clamp(190px, 58vw, 230px)", scrollSnapAlign: "start" }}
                  onClick={() => navigateToMovie(movie)}
                >
                  <div className="position-relative overflow-hidden">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="card-img-top"
                      style={{
                        height: "clamp(250px, 65vw, 310px)",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                    />
                    <div
                      className="position-absolute bottom-0 start-0 w-100 p-2.5"
                      style={{ background: "linear-gradient(to top, rgba(15,23,42,0.92) 0%, transparent 100%)" }}
                    >
                      <span className="badge bg-dark bg-opacity-80 text-warning fw-bold d-inline-flex align-items-center gap-1 border border-secondary border-opacity-50">
                        <BsStarFill size={11} /> 8.6/10
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h6
                        className="fw-bold text-dark text-truncate mb-1"
                        style={{ fontSize: "14.5px" }}
                        title={movie.title}
                      >
                        {movie.title}
                      </h6>
                      <small
                        className="text-muted text-truncate d-block mb-3"
                        style={{ fontSize: "12px", fontWeight: "500" }}
                        title={movie.genre}
                      >
                        {movie.genre || "Action / Drama"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-100 fw-bold rounded-pill transition-all hover-solid d-flex align-items-center justify-content-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToMovie(movie);
                      }}
                    >
                      <BsTicketPerforated /> Book Tickets
                    </button>
                  </div>
                </div>
              ))}

              {trendingMovies.length === 0 && (
                <div className="w-100 p-4 text-center bg-white rounded-4 shadow-sm text-muted">
                  No movies currently listed in theaters today.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 4. TRENDING EVENTS CAROUSEL (NOW BELOW MOVIES) ── */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark" style={{ fontSize: "clamp(18px, 3vw, 22px)" }}>
                <BsCalendarEvent className="text-primary" /> Trending Events
              </h4>
              <small className="text-muted d-none d-sm-inline">Handpicked experiences happening around you</small>
            </div>
            <Link
              to="/find-events?tab=events"
              className="text-decoration-none fw-bold text-primary small d-inline-flex align-items-center gap-1"
            >
              <span>View All</span> <BsArrowRight />
            </Link>
          </div>

          <div
            className="d-flex flex-nowrap gap-3 gap-md-4 overflow-auto pb-3 custom-scrollbar"
            style={{ scrollSnapType: "x mandatory", scrollbarWidth: "thin" }}
          >
            {popularEvents.map((event) => (
              <Link
                key={event.id}
                to={`/public/events/${event.id}`}
                className="card border-0 rounded-4 shadow-sm text-decoration-none text-dark flex-shrink-0 position-relative event-hover bg-white overflow-hidden"
                style={{ width: "clamp(240px, 75vw, 290px)", scrollSnapAlign: "start" }}
              >
                <div className="position-relative overflow-hidden">
                  <img
                    src={event.bannerUrl || getDefaultBanner(event.eventType)}
                    alt={event.eventName}
                    className="card-img-top"
                    style={{ height: "155px", objectFit: "cover" }}
                  />
                  {event.eventType && (
                    <span
                      className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-2"
                      style={{ fontSize: "11px" }}
                    >
                      {event.eventType}
                    </span>
                  )}
                </div>

                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <h6
                      className="fw-bold mb-2 text-dark"
                      style={{
                        fontSize: "15px",
                        lineHeight: "1.3",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "38px",
                      }}
                      title={event.eventName}
                    >
                      {event.eventName}
                    </h6>
                    <p className="text-muted small mb-1 d-flex align-items-center gap-1.5">
                      <BsCalendarEvent className="text-primary flex-shrink-0" size={13} />
                      <span className="text-truncate">{formatDate(event.startDateTime)}</span>
                    </p>
                    <p className="text-muted small mb-2 d-flex align-items-center gap-1.5">
                      <BsGeoAlt className="text-danger flex-shrink-0" size={13} />
                      <span className="text-truncate">{event.venue || "Online"}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-top d-flex justify-content-between align-items-center mt-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                      Register Now
                    </span>
                    <span className="small text-primary fw-bold d-flex align-items-center gap-1">
                      Details <BsArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {popularEvents.length === 0 && (
              <div className="w-100 p-4 text-center bg-white rounded-4 shadow-sm text-muted">
                No upcoming events right now. Check back soon!
              </div>
            )}
          </div>
        </section>

        {/* ── 5. QUICK PERKS BENTO STRIP ── */}
        <section className="mb-4">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="card border-0 rounded-4 p-3 h-100 bg-white shadow-sm d-flex flex-row align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: "46px", height: "46px", background: "#ecfdf5", color: "#059669" }}
                >
                  <BsLightningChargeFill size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>Instant M-Ticket</h6>
                  <small className="text-muted" style={{ fontSize: "12px" }}>Zero paper printouts. Scan QR directly at entrance gates.</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 rounded-4 p-3 h-100 bg-white shadow-sm d-flex flex-row align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: "46px", height: "46px", background: "#e0e7ff", color: "#4f46e5" }}
                >
                  <BsShieldCheck size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>100% Verified Partners</h6>
                  <small className="text-muted" style={{ fontSize: "12px" }}>Verified event venues and licensed cinema screens.</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 rounded-4 p-3 h-100 bg-white shadow-sm d-flex flex-row align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: "46px", height: "46px", background: "#fef3c7", color: "#d97706" }}
                >
                  <BsTicketPerforated size={22} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>Seamless Live Booking</h6>
                  <small className="text-muted" style={{ fontSize: "12px" }}>Real-time seat layout selection and concession combos.</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .event-hover {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          cursor: pointer;
        }
        .event-hover:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.09) !important;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.04);
        }
        .hover-solid:hover {
          background-color: #dc3545 !important;
          color: white !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .fade-in-up {
          animation: fadeInUp 0.5s ease forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
