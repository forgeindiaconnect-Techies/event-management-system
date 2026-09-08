import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import { formatIndianDate, formatIndianTime } from "../../utils/dateTime";
import PublicMovieDetails from "./PublicMovieDetails";
import PublicMovieShowtimes, { getScreenTech } from "./PublicMovieShowtimes";
import PublicMovieSeatLayout from "./PublicMovieSeatLayout";
import {
  BsFilm,
  BsSearch,
  BsGeoAlt,
  BsCalendarEvent,
  BsStarFill,
  BsPlayFill,
  BsTicketPerforated,
  BsShieldCheck,
  BsCheckCircleFill,
  BsTv,
  BsClock,
  BsFire,
  BsBuilding,
  BsCameraVideo,
} from "react-icons/bs";

// Default placeholder poster if showtime in DB does not have posterUrl
const DEFAULT_POSTER =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80";

export default function PublicMovieDiscovery({ onSelectMovieForBooking, globalSearchQuery = "", locationFilter = "" }) {
  const [theaters, setTheaters] = useState([]);
  const [dbShowtimes, setDbShowtimes] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get("view") || "DISCOVERY";
  const [movieFlowView, setMovieFlowView] = useState(initialView); // "DISCOVERY" | "DETAILS" | "THEATERS" | "SEATS"

  // Listen to browser back/forward buttons
  useEffect(() => {
    const view = searchParams.get("view") || "DISCOVERY";
    setMovieFlowView(view);
    if (view === "DISCOVERY") {
      setSelectedMovie(null);
      setSelectedShowtime(null);
    }
  }, [searchParams]);

  const navigateToView = (view, movie = undefined, showtime = undefined) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("view", view);
    
    const nextMovie = movie !== undefined ? movie : selectedMovie;
    if (nextMovie && nextMovie.movieId) newParams.set("movieId", nextMovie.movieId);
    
    setSearchParams(newParams);
    setMovieFlowView(view);
    if (movie !== undefined) setSelectedMovie(movie);
    if (showtime !== undefined) setSelectedShowtime(showtime);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filters
  const [selectedScreen, setSelectedScreen] = useState("All Screens");
  const [selectedDate, setSelectedDate] = useState("All Dates");
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Load real showtimes and theaters from database
  useEffect(() => {
    loadDatabaseShowtimes();
  }, []);

  const loadDatabaseShowtimes = async () => {
    try {
      setLoading(true);

      // 1. Fetch from new public showtimes endpoint
      const pubRes = await api.get("/theater/public/showtimes").catch(() => ({ data: [] }));
      let allShows = Array.isArray(pubRes.data) ? pubRes.data : [];

      // Fetch all movies from backend
      const moviesRes = await api.get("/movies").catch(() => ({ data: [] }));
      setAllMovies(Array.isArray(moviesRes.data) ? moviesRes.data : []);

      // 2. Fetch theater list
      const thRes = await api.get("/theater/list").catch(() => ({ data: [] }));
      const thList = Array.isArray(thRes.data) ? thRes.data : [];
      setTheaters(thList);

      // Create lookup map for theaters & portals
      const thMap = new Map();
      thList.forEach((th) => {
        if (th.id) thMap.set(String(th.id), th);
        if (th.portal?.id) thMap.set(String(th.portal.id), th);
        if (th.theaterPortal?.id) thMap.set(String(th.theaterPortal.id), th);
      });

      // Enrich backend showtimes with correct portal information
      allShows = allShows.map((st) => {
        const thId = st.theater?.id || st.theaterId || st.screen?.theater?.id;
        const matchingTh = thId ? thMap.get(String(thId)) : null;

        // Prioritize theaterPortal.portalName (e.g. Theater #2 -> Gopal Multiplex, Thirupathur)
        let portalName = "";
        let city = "";

        if (matchingTh?.theaterPortal?.portalName) {
          portalName = matchingTh.theaterPortal.portalName;
          city = matchingTh.theaterPortal.city || matchingTh.city || "Thirupathur";
        } else if (st.theater?.theaterPortal?.portalName) {
          portalName = st.theater.theaterPortal.portalName;
          city = st.theater.theaterPortal.city || st.theater.city || "Thirupathur";
        } else if (matchingTh?.name) {
          portalName = matchingTh.name;
          city = matchingTh.city || "Dharmapuri";
        } else if (st.theater?.name) {
          portalName = st.theater.name;
          city = st.theater.city || "Dharmapuri";
        } else if (st.portalName) {
          portalName = st.portalName;
          city = st.theaterCity || "Chennai";
        } else {
          portalName = "Gopal Multiplex";
          city = "Thirupathur";
        }

        return {
          ...st,
          portalName,
          theaterName: portalName,
          theaterCity: city,
        };
      });

      // 3. If public showtimes is empty, fetch per theater or per screen
      if (allShows.length === 0 && thList.length > 0) {
        for (const th of thList) {
          try {
            const stRes = await api.get(`/theater/${th.id}/showtimes`);
            if (Array.isArray(stRes.data)) {
              const pName = th.theaterPortal?.portalName || th.name || "Naveen Cinemas";
              const cName = th.theaterPortal?.city || th.city || "Chennai";
              allShows.push(
                ...stRes.data.map((st) => ({
                  ...st,
                  portalName: pName,
                  theaterName: pName,
                  theaterCity: cName,
                }))
              );
            }
          } catch {
            // ignore
          }
        }
      }

      // 4. Merge any showtimes saved in browser localStorage by theater manager or cashier
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("theater_showtimes_")) {
          const pId = key.replace("theater_showtimes_", "");
          const matchingTh = thMap.get(String(pId));
          const pName =
            matchingTh?.theaterPortal?.portalName ||
            (pId === "2" ? "Gopal Multiplex" : matchingTh?.name || "Naveen Cinemas");
          const pCity =
            matchingTh?.theaterPortal?.city ||
            matchingTh?.city ||
            (pId === "2" ? "Thirupathur" : "Dharmapuri");

          try {
            const localList = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(localList)) {
              allShows.push(
                ...localList.map((st) => ({
                  ...st,
                  portalName: st.portalName || pName,
                  theaterName: st.theaterName || pName,
                  theaterCity: st.theaterCity || pCity,
                }))
              );
            }
          } catch {
            // ignore
          }
        }
      }

      // Get current time minus 15 minutes buffer
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 15);

      // Deduplicate showtimes by id or by (movieTitle + showDate + startTime + screenId)
      const dedupMap = new Map();
      allShows.forEach((st) => {
        if (!st || !st.movieTitle) return;

        // --- FILTER PAST SHOWTIMES ---
        if (st.showDate && st.startTime) {
          try {
            let showDateTime;
            if (st.showDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              showDateTime = new Date(st.showDate);
            } else {
              const currentYear = new Date().getFullYear();
              let showDateStr = st.showDate;
              if (!showDateStr.includes(String(currentYear))) {
                  showDateStr = `${st.showDate} ${currentYear}`;
              }
              showDateTime = new Date(showDateStr);
            }
            
            const timeMatch = st.startTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (timeMatch && !isNaN(showDateTime.getTime())) {
              let hours = parseInt(timeMatch[1], 10);
              const mins = parseInt(timeMatch[2], 10);
              const ampm = timeMatch[3];
              
              if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
              if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;

              showDateTime.setHours(hours, mins, 0, 0);

              if (showDateTime < cutoffTime) {
                return; // Skip this showtime as it has already passed
              }
            }
          } catch (e) {
            // If date parsing fails, let it through instead of hiding it
          }
        }
        // -----------------------------

        const dedupeKey = st.id
          ? String(st.id)
          : `${st.movieTitle}_${st.showDate}_${st.startTime}_${st.screen?.id || st.screenId || ""}`;
        if (!dedupMap.has(dedupeKey)) {
          dedupMap.set(dedupeKey, st);
        }
      });

      setDbShowtimes(Array.from(dedupMap.values()));
    } catch (err) {
      console.warn("Error loading showtimes from database:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group real database showtimes by Movie Title (no demo data!)
  const databaseMovies = useMemo(() => {
    const map = new Map();

    dbShowtimes.forEach((st) => {
      if (!st || !st.movieTitle) return;
      const key = st.movieTitle.trim();
      const existing = map.get(key) || {
        id: `movie_${key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        title: key,
        movieId: st.movieId || null,
        poster: st.posterUrl || "",
        showtimes: [],
        portals: new Set(),
        cities: new Set(),
        screens: new Set(),
        theaters: new Set(),
        formats: new Set(["2D"]),
        dates: new Set(),
        prices: new Set(),
      };

      if (!existing.poster && st.posterUrl) {
        existing.poster = st.posterUrl;
      }
      if (!existing.movieId && st.movieId) {
        existing.movieId = st.movieId;
      }

      existing.showtimes.push(st);

      // Track correct theater portal
      const portal =
        st.portalName ||
        st.theater?.theaterPortal?.portalName ||
        st.theater?.name ||
        st.theaterName ||
        "Naveen Cinemas";
      existing.portals.add(portal);

      if (st.theaterCity) existing.cities.add(st.theaterCity);
      else if (st.theater?.city) existing.cities.add(st.theater.city);

      // Track screens
      if (st.screen?.name) existing.screens.add(st.screen.name);
      else if (st.screenName) existing.screens.add(st.screenName);

      // Track formats (accurate screen technology only)
      existing.formats.add(getScreenTech(st));

      // Track theaters
      if (st.theater?.name) existing.theaters.add(st.theater.name);
      else if (st.theaterName) existing.theaters.add(st.theaterName);

      // Track show dates
      if (st.showDate) existing.dates.add(st.showDate);

      // Track prices
      if (st.classPrices) {
        const prices = String(st.classPrices).match(/\d+/g);
        if (prices) {
          prices.forEach((p) => existing.prices.add(Number(p)));
        }
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).map((m) => {
      const pricesArr = Array.from(m.prices);
      const portalsArr = Array.from(m.portals);
      const citiesArr = Array.from(m.cities);
      return {
        ...m,
        portalName: portalsArr[0] || m.theatersList[0] || "Naveen Cinemas",
        portalsList: portalsArr,
        city: citiesArr[0] || "Chennai",
        screensList: Array.from(m.screens),
        theatersList: Array.from(m.theaters),
        formatsList: Array.from(m.formats),
        datesList: Array.from(m.dates).sort(),
        minPrice: pricesArr.length > 0 ? Math.min(...pricesArr) : 120,
        maxPrice: pricesArr.length > 0 ? Math.max(...pricesArr) : 220,
      };
    });
  }, [dbShowtimes]);

  // Extract distinct screens from database movies for filtering
  const availableScreens = useMemo(() => {
    const screens = new Set();
    databaseMovies.forEach((m) => {
      m.screensList.forEach((s) => screens.add(s));
    });
    return ["All Screens", ...Array.from(screens)];
  }, [databaseMovies]);

  // Filtered movies based on user search and filters
  const filteredMovies = useMemo(() => {
    return databaseMovies.filter((movie) => {
      // Search
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(q);
        const matchesScreen = movie.screensList.some((s) => s.toLowerCase().includes(q));
        const matchesTheater = movie.theatersList.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesScreen && !matchesTheater) return false;
      }
      // Location filter
      if (locationFilter.trim()) {
        const l = locationFilter.toLowerCase();
        if (!movie.city?.toLowerCase().includes(l)) {
          return false;
        }
      }
      // Screen filter
      if (selectedScreen !== "All Screens") {
        if (!movie.screensList.includes(selectedScreen)) return false;
      }
      // Date filter
      if (selectedDate !== "All Dates") {
        if (!movie.datesList.includes(selectedDate)) return false;
      }
      return true;
    });
  }, [databaseMovies, globalSearchQuery, locationFilter, selectedScreen, selectedDate]);

  const upcomingMovies = useMemo(() => {
    // A movie is upcoming if it's in allMovies, but its title doesn't match any title in databaseMovies
    return allMovies.filter(am => {
      const amTitle = (am.title || "").trim().toLowerCase();
      const isNowShowing = databaseMovies.some(dm => {
        const dmTitle = (dm.title || "").trim().toLowerCase();
        return dmTitle === amTitle || dmTitle.includes(amTitle) || amTitle.includes(dmTitle);
      });
      if (isNowShowing) return false;
      
      // Filter by global search query
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        if (!amTitle.includes(q)) return false;
      }
      return true;
    });
  }, [allMovies, databaseMovies, globalSearchQuery]);

  const activeSpotlightMovie = filteredMovies[activeBannerIdx] || filteredMovies[0] || null;

  // VIEW 1: Movie Details Page (About, Cast & Crew)
  if (movieFlowView === "DETAILS" && selectedMovie) {
    return (
      <PublicMovieDetails
        movie={selectedMovie}
        onBack={() => navigateToView("DISCOVERY")}
        onProceedToTheaters={() => navigateToView("THEATERS")}
      />
    );
  }

  // VIEW 2: Theaters & Showtimes Selection Page (Next Page)
  if (movieFlowView === "THEATERS" && selectedMovie) {
    return (
      <PublicMovieShowtimes
        movie={selectedMovie}
        onBack={() => navigateToView("DETAILS")}
        onSelectShowtime={(showtime) => navigateToView("SEATS", undefined, showtime)}
      />
    );
  }

  // VIEW 3: Interactive Hall Seat Layout & Booking (Next Page)
  if (movieFlowView === "SEATS" && selectedMovie && selectedShowtime) {
    return (
      <PublicMovieSeatLayout
        movie={selectedMovie}
        showtime={selectedShowtime}
        onChangeShowtime={(st) => setSelectedShowtime(st)}
        onBack={() => navigateToView("THEATERS")}
        onBookingComplete={() => {
          loadDatabaseShowtimes();
          navigateToView("DISCOVERY", null, null);
        }}
      />
    );
  }

  return (
    <div className="public-movie-discovery pb-5" style={{ backgroundColor: "#f8fafc", color: "#0f172a", minHeight: "100vh" }}>
      {/* 1. HERO SPOTLIGHT BANNER (ONLY IF MOVIES EXIST IN DATABASE) */}
      {activeSpotlightMovie ? (
        <section
          className="position-relative overflow-hidden shadow-sm"
          style={{
            minHeight: "380px",
            background: "linear-gradient(90deg, #0f172a 35%, #1e293b 70%, #334155 100%)",
            color: "#ffffff",
          }}
        >
          <div className="container py-5">
            <div className="row align-items-center">
              {/* Left Details */}
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span
                    className="badge bg-danger px-3 py-1.5 rounded-pill fw-bold text-uppercase d-inline-flex align-items-center gap-1.5 shadow-sm"
                    style={{ letterSpacing: "0.5px" }}
                  >
                    <BsFire /> Live Showtime
                  </span>
                  {activeSpotlightMovie.screensList.map((sc) => (
                    <span key={sc} className="badge bg-light text-dark px-3 py-1 rounded-pill fw-semibold shadow-sm">
                      {sc}
                    </span>
                  ))}
                  {activeSpotlightMovie.formatsList.map((fmt) => (
                    <span key={fmt} className="badge bg-primary px-3 py-1 rounded-pill fw-semibold shadow-sm">
                      {fmt}
                    </span>
                  ))}
                </div>

                <h1 className="fw-bolder mb-2 text-white display-5" style={{ letterSpacing: "-0.5px" }}>
                  {activeSpotlightMovie.title}
                </h1>

                <div className="d-flex align-items-center gap-3 mb-3 text-light text-opacity-80" style={{ fontSize: "15px" }}>
                  <span className="text-warning fw-bold d-flex align-items-center gap-1">
                    <BsStarFill /> Rated Excellent
                  </span>
                  <span>•</span>
                  <span>
                    <BsBuilding className="me-1" />
                    {activeSpotlightMovie.portalName || "Naveen Cinemas"}
                  </span>
                  <span>•</span>
                  <span>
                    <BsGeoAlt className="me-1" />
                    {activeSpotlightMovie.city || "Chennai"}
                  </span>
                </div>

                {/* Showtime Slots Chips */}
                <div className="mb-4">
                  <div className="small text-light text-opacity-75 mb-2 fw-semibold">Available Showtimes:</div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {activeSpotlightMovie.showtimes.slice(0, 6).map((st) => (
                      <span
                        key={st.id || Math.random()}
                        className="badge bg-dark bg-opacity-75 text-white border border-secondary px-3 py-1.5 rounded-3 fw-medium"
                        style={{ fontSize: "13px" }}
                      >
                        {formatIndianTime(st.startTime || "10:00:00")}
                        {st.screen?.name ? ` (${st.screen.name})` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2.5 fw-bold rounded-pill d-flex align-items-center gap-2 shadow"
                    style={{ fontSize: "16px" }}
                    onClick={() => navigateToView("DETAILS", activeSpotlightMovie)}
                  >
                    <BsTicketPerforated size={18} /> Book Tickets
                  </button>

                  <span className="text-light text-opacity-75 small">
                    Tickets starting from <strong>₹{activeSpotlightMovie.minPrice}</strong>
                  </span>
                </div>
              </div>

              {/* Right Poster Card */}
              <div className="col-lg-4 d-none d-lg-flex justify-content-end">
                <div
                  className="rounded-4 overflow-hidden position-relative shadow-lg"
                  style={{
                    width: "240px",
                    height: "340px",
                    border: "3px solid rgba(255,255,255,0.2)",
                    backgroundColor: "#1e293b",
                  }}
                >
                  <img
                    src={activeSpotlightMovie.poster || DEFAULT_POSTER}
                    alt={activeSpotlightMovie.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_POSTER;
                    }}
                  />
                  <div
                    className="position-absolute bottom-0 start-0 end-0 p-3 text-center"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)" }}
                  >
                    <div className="fw-bold text-white small text-truncate">{activeSpotlightMovie.title}</div>
                    <div className="text-light text-opacity-75" style={{ fontSize: "12px" }}>
                      Now Showing in Theaters
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Indicators if multiple movies */}
            {filteredMovies.length > 1 && (
              <div className="d-flex align-items-center gap-2 mt-4">
                {filteredMovies.slice(0, 5).map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    className="btn p-0 rounded-pill border-0 transition-all"
                    style={{
                      width: activeBannerIdx === idx ? "28px" : "10px",
                      height: "8px",
                      backgroundColor: activeBannerIdx === idx ? "#3b82f6" : "rgba(255,255,255,0.4)",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => setActiveBannerIdx(idx)}
                    aria-label={`Switch to ${m.title}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 2. STICKY FILTER & SEARCH TOOLBAR */}
      <div
        className="py-3 sticky-top shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          zIndex: 100,
        }}
      >
        <div className="container">
          <div className="row g-2 align-items-center justify-content-between">
            {/* Screen Filters */}
            <div className="col-12 d-flex align-items-center gap-2 justify-content-md-end overflow-auto py-1">
              <div className="d-flex align-items-center gap-1.5 flex-nowrap">
                {availableScreens.map((scr) => (
                  <button
                    key={scr}
                    type="button"
                    className={`btn btn-sm rounded-pill text-nowrap px-3 transition-all ${
                      selectedScreen === scr
                        ? "btn-primary text-white fw-bold shadow-sm"
                        : "btn-outline-secondary text-dark bg-white border"
                    }`}
                    style={{ fontSize: "13px" }}
                    onClick={() => setSelectedScreen(scr)}
                  >
                    {scr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NOW SHOWING REAL DATABASE MOVIES GRID */}
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2" style={{ fontSize: "28px" }}>
              <BsFilm className="text-primary" /> Now Showing in Theaters
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
              Live movies and showtimes scheduled across theater screens.
            </p>
          </div>

          <span className="badge bg-white text-secondary border px-3 py-2 rounded-pill fw-medium shadow-sm">
            {filteredMovies.length} Movie{filteredMovies.length !== 1 ? "s" : ""} in Database
          </span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading showtimes...</span>
            </div>
            <p className="text-muted mt-2">Fetching scheduled movies from database...</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          /* EMPTY STATE WHEN NO SHOWTIMES ARE IN THE DATABASE */
          <div className="text-center py-5 rounded-4 bg-white border shadow-sm my-4 p-5">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "32px",
              }}
            >
              <BsFilm />
            </div>
            <h4 className="fw-bold text-dark">No Scheduled Showtimes in Database</h4>
            <p className="text-muted mb-4" style={{ maxWidth: "480px", margin: "0 auto" }}>
              No movie showtimes are currently listed in the database. Theater managers can schedule movies and showtimes from the Theater Dashboard.
            </p>
            <div className="d-flex align-items-center justify-content-center gap-3">
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-4"
                onClick={loadDatabaseShowtimes}
              >
                Refresh Showtimes
              </button>
              <a href="/theater/dashboard" className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm">
                Go to Theater Dashboard
              </a>
            </div>
          </div>
        ) : (
          /* REAL MOVIES GRID - HORIZONTAL SCROLL */
          <div className="position-relative">
            <style>
              {`
                .movie-scroll-container::-webkit-scrollbar {
                  display: none;
                }
                .movie-scroll-container {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>
            <div 
              className="d-flex flex-nowrap gap-4 pb-3 pt-2 movie-scroll-container overflow-auto"
              style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
                  <div
                    className="card h-100 border-0 rounded-4 overflow-hidden transition-all position-relative"
                    style={{
                      width: "220px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                      border: "1px solid #e2e8f0",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 16px 35px rgba(37, 99, 235, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.06)";
                    }}
                  >
                    {/* Poster Thumbnail */}
                    <div
                      className="position-relative"
                      style={{ height: "330px", overflow: "hidden", backgroundColor: "#0f172a", cursor: "pointer" }}
                    onClick={() => navigateToView("DETAILS", movie)}
                  >
                    <img
                      src={movie.poster || DEFAULT_POSTER}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_POSTER;
                      }}
                    />

                    {/* Bottom Gradient overlay with Rating */}
                    <div
                      className="position-absolute bottom-0 start-0 end-0 px-2 py-2 d-flex align-items-end justify-content-between"
                      style={{
                        background: "linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, transparent)",
                      }}
                    >
                      <div className="d-flex align-items-center gap-1 text-white fw-medium" style={{ fontSize: "12px" }}>
                        <BsStarFill className="text-danger" size={12} /> 8.7/10 
                        <span className="text-white-50 ms-1" style={{ fontSize: "10px" }}>(25K Votes)</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-2.5 d-flex flex-column justify-content-between bg-white">
                    <div>
                      <h5
                        className="fw-bold mb-1 text-dark text-truncate"
                        title={movie.title}
                        style={{ fontSize: "15px", cursor: "pointer" }}
                        onClick={() => navigateToView("DETAILS", movie)}
                      >
                        {movie.title}
                      </h5>

                      {/* Genre */}
                      <div className="text-muted text-truncate mb-3" style={{ fontSize: "12px" }}>
                        Action/Thriller/Drama
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      type="button"
                      className="btn btn-primary w-100 py-1.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-1.5 mt-1 shadow-sm"
                      style={{ fontSize: "13px" }}
                      onClick={() => navigateToView("DETAILS", movie)}
                    >
                      <BsTicketPerforated size={14} /> Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* UPCOMING MOVIES REAL DATABASE SECTION */}
      {upcomingMovies.length > 0 && (
        <div className="container py-2">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2" style={{ fontSize: "28px" }}>
                <BsFilm className="text-secondary" /> Upcoming Movies
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                Movies coming soon to theaters. Show your interest!
              </p>
            </div>
            <span className="badge bg-white text-secondary border px-3 py-2 rounded-pill fw-medium shadow-sm">
              {upcomingMovies.length} Upcoming
            </span>
          </div>

          <div className="position-relative">
            <div 
              className="d-flex flex-nowrap gap-4 pb-3 pt-2 movie-scroll-container overflow-auto"
              style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {upcomingMovies.map((movie) => (
                <div key={movie.id} className="flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
                  <div
                    className="card h-100 border-0 rounded-4 overflow-hidden transition-all position-relative"
                    style={{
                      width: "220px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                      border: "1px solid #e2e8f0",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 16px 35px rgba(37, 99, 235, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.06)";
                    }}
                  >
                    {/* Poster Thumbnail */}
                    <div
                      className="position-relative"
                      style={{ height: "330px", overflow: "hidden", backgroundColor: "#0f172a", cursor: "pointer" }}
                    onClick={() => {
                      navigateToView("DETAILS", {
                        ...movie,
                        isUpcoming: true,
                        screensList: [],
                        formatsList: [],
                        theatersList: [],
                        datesList: [],
                        showtimes: []
                      });
                    }}
                  >
                    <img
                      src={movie.posterUrl || DEFAULT_POSTER}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_POSTER;
                      }}
                    />
                    <div
                      className="position-absolute top-0 end-0 m-2"
                    >
                      <span className="badge bg-warning text-dark px-2 py-1 rounded shadow-sm">Upcoming</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-2.5 d-flex flex-column justify-content-between bg-white">
                    <div>
                      <h5
                        className="fw-bold mb-1 text-dark text-truncate"
                        title={movie.title}
                        style={{ fontSize: "15px", cursor: "pointer" }}
                        onClick={() => {
                          navigateToView("DETAILS", {
                            ...movie,
                            isUpcoming: true,
                            screensList: [],
                            formatsList: [],
                            theatersList: [],
                            datesList: [],
                            showtimes: []
                          });
                        }}
                      >
                        {movie.title}
                      </h5>

                      {/* Genre */}
                      <div className="text-muted text-truncate mb-3" style={{ fontSize: "12px" }}>
                        Action/Thriller/Drama
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100 py-1.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-1.5 mt-1 shadow-sm"
                      style={{ fontSize: "13px" }}
                      onClick={() => {
                        navigateToView("DETAILS", {
                          ...movie,
                          isUpcoming: true,
                          screensList: [],
                          formatsList: [],
                          theatersList: [],
                          datesList: [],
                          showtimes: []
                        });
                      }}
                    >
                      <BsCheckCircleFill size={14} /> I'm Interested
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CINEMA EXPERIENCE & FEATURES SECTION */}
      <div className="container mt-2 pt-4">
        <div className="p-4 rounded-4 bg-white border shadow-sm">
          <div className="row g-4 text-secondary">
            <div className="col-md-4 d-flex align-items-start gap-3">
              <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary fs-4">
                <BsTicketPerforated />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Instant E-Ticket</h6>
                <p className="small text-muted mb-0">Direct QR entry at the theater gate. No physical printouts needed.</p>
              </div>
            </div>
            <div className="col-md-4 d-flex align-items-start gap-3">
              <div className="p-3 rounded-3 bg-success bg-opacity-10 text-success fs-4">
                <BsShieldCheck />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1">100% Real-Time Seating</h6>
                <p className="small text-muted mb-0">Live seat layout synchronized across box office counters and online.</p>
              </div>
            </div>
            <div className="col-md-4 d-flex align-items-start gap-3">
              <div className="p-3 rounded-3 bg-warning bg-opacity-10 text-warning fs-4">
                <BsTv />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Dolby Atmos & 4K Laser</h6>
                <p className="small text-muted mb-0">Experience cinema in ultra-high fidelity across premium screens.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
