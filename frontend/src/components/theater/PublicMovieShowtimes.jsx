import { useState, useMemo } from "react";
import {
  BsArrowLeft,
  BsClock,
  BsInfoCircle,
  BsPhone,
  BsCupHot,
  BsChevronDown,
  BsSearch,
} from "react-icons/bs";
import { formatIndianDate, formatIndianTime } from "../../utils/dateTime";

// Accurate screen technology resolver based on screen projection, sound system, format, and name
export function getScreenTech(st) {
  if (!st) return "2D";
  const scr = st.screen || {};
  const scrFormat = String(scr.screenFormat || "").toUpperCase();
  const sound = String(scr.soundSystem || "").toUpperCase();
  const projection = String(scr.projectionType || "").toUpperCase();
  const rawType = String(scr.screenType || st.screenType || "").toUpperCase();
  const scrName = String(scr.screenName || st.screenName || "").toUpperCase();

  // 1. 4DX screen format
  if (scrFormat.includes("4DX") || rawType.includes("4DX") || scrName.includes("4DX")) {
    return "4DX";
  }

  // 2. True IMAX screens (only if IMAX screen format or screen title, not just RGB laser spec)
  if ((scrFormat.includes("IMAX") || scrName.includes("IMAX")) && (scrFormat.includes("3D") || rawType.includes("3D"))) {
    return "IMAX 3D";
  }
  if (scrFormat.includes("IMAX") || scrName.includes("IMAX")) {
    return "IMAX 2D";
  }

  // 3. 3D screens (excluding aspect ratio numbers like 2.39:1)
  if ((scrFormat.includes("3D") || rawType.includes("3D")) && !scrFormat.includes("2.39") && !rawType.includes("2.39")) {
    return "3D";
  }

  // 4. Dolby Atmos & 4K Laser systems
  const hasDolbyAtmos = sound.includes("DOLBY ATMOS") || rawType.includes("DOLBY ATMOS");
  const has4K = projection.includes("4K") || rawType.includes("4K");

  if (hasDolbyAtmos && has4K) {
    return "4K DOLBY ATMOS";
  }
  if (hasDolbyAtmos) {
    return "DOLBY ATMOS";
  }
  if (sound.includes("7.1")) {
    return has4K ? "4K DOLBY 7.1" : "DOLBY 7.1";
  }
  if (has4K) {
    return "4K 2D";
  }

  // 5. Standard 2D
  return "2D";
}

export default function PublicMovieShowtimes({ movie, onBack, onSelectShowtime }) {
  const [selectedDate, setSelectedDate] = useState("ALL");
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [selectedPriceRange, setSelectedPriceRange] = useState("ALL");
  const [selectedTime, setSelectedTime] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("ALL");

  // Distinct dates available for this movie
  const availableDates = useMemo(() => {
    if (!movie || !movie.showtimes) return [];
    const dates = new Set();
    movie.showtimes.forEach((st) => {
      if (st.showDate) dates.add(st.showDate);
    });
    return Array.from(dates).sort();
  }, [movie]);

  // Extract clean tech formats available for this movie
  const availableFormats = useMemo(() => {
    const set = new Set(["ALL"]);
    if (movie?.showtimes) {
      movie.showtimes.forEach((st) => {
        set.add(getScreenTech(st));
      });
    } else if (movie?.formatsList) {
      movie.formatsList.forEach((f) => set.add(f));
    }
    return Array.from(set);
  }, [movie]);

  // Filter showtimes by selected date, format, price, and time
  const filteredShowtimes = useMemo(() => {
    if (!movie || !movie.showtimes) return [];
    
    let filtered = movie.showtimes.filter((st) => {
      // 1. Date Filter
      if (selectedDate !== "ALL" && st.showDate !== selectedDate) return false;
      
      // 2. Format Filter
      if (selectedFormat !== "ALL") {
        const tech = getScreenTech(st);
        if (tech !== selectedFormat) return false;
      }
      
      // 3. Time Filter
      if (selectedTime !== "ALL") {
        const time = st.startTime || "10:00:00";
        const hour = parseInt(time.split(":")[0], 10);
        if (selectedTime === "morning" && hour >= 12) return false;
        if (selectedTime === "afternoon" && (hour < 12 || hour >= 16)) return false;
        if (selectedTime === "evening" && (hour < 16 || hour >= 20)) return false;
        if (selectedTime === "night" && hour < 20) return false;
      }
      
      // 4. Price Filter (checking minimum price in ticket classes)
      if (selectedPriceRange !== "ALL") {
        const prices = st.ticketClasses?.map(tc => tc.price) || [150]; // Default mock price
        const minPrice = Math.min(...prices);
        if (selectedPriceRange === "0-150" && minPrice > 150) return false;
        if (selectedPriceRange === "151-300" && (minPrice < 151 || minPrice > 300)) return false;
        if (selectedPriceRange === "301+" && minPrice <= 300) return false;
      }
      
      return true;
    });

    // 5. Sort By
    if (selectedSort !== "ALL") {
      filtered.sort((a, b) => {
        const timeA = a.startTime || "10:00:00";
        const timeB = b.startTime || "10:00:00";
        const minPriceA = Math.min(...(a.ticketClasses?.map(tc => tc.price) || [150]));
        const minPriceB = Math.min(...(b.ticketClasses?.map(tc => tc.price) || [150]));
        
        switch(selectedSort) {
          case "time-asc":
            return timeA.localeCompare(timeB);
          case "time-desc":
            return timeB.localeCompare(timeA);
          case "price-asc":
            return minPriceA - minPriceB;
          case "price-desc":
            return minPriceB - minPriceA;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [movie, selectedDate, selectedFormat, selectedTime, selectedPriceRange, selectedSort]);

  // Group showtimes by Theater & Cinema Hall
  const theaterGroups = useMemo(() => {
    const map = new Map();

    filteredShowtimes.forEach((st) => {
      const thName =
        st.portalName ||
        st.theater?.theaterPortal?.portalName ||
        st.theater?.name ||
        st.theaterName ||
        "Gopal Multiplex";
      const thCity =
        st.theaterCity ||
        st.theater?.theaterPortal?.city ||
        st.theater?.city ||
        "Thirupathur";
      const tech = getScreenTech(st);

      const key = `${thName}___${thCity}`;

      const existing = map.get(key) || {
        theaterName: thName,
        theaterCity: thCity,
        techs: new Set(),
        showtimes: [],
      };

      existing.techs.add(tech);
      existing.showtimes.push({
        ...st,
        screenTech: tech,
      });
      map.set(key, existing);
    });

    return Array.from(map.values()).map((th) => ({
      ...th,
      primaryTech: Array.from(th.techs).join(", "),
    }));
  }, [filteredShowtimes]);

  if (!movie) return null;

  return (
    <div className="public-movie-showtimes pb-5" style={{ backgroundColor: "#f8fafc", color: "#0f172a", minHeight: "100vh" }}>
      {/* 1. TOP HEADER & MOVIE INFO BAR */}
      <div
        className="sticky-top bg-white border-bottom shadow-sm py-3 px-4 position-relative"
        style={{ zIndex: 110 }}
      >
        {/* Absolute Back Button pushed to the left edge */}
        <button
          type="button"
          className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-2 position-absolute d-none d-lg-flex transition-all"
          onClick={onBack}
          style={{ fontSize: "15px", fontWeight: "600", left: "24px", top: "50%", transform: "translateY(-50%)" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <BsArrowLeft size={18} /> Back
        </button>

        <div className="container">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center">
              {/* Mobile Back Button */}
              <button
                type="button"
                className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-2 me-3 d-lg-none transition-all"
                onClick={onBack}
                style={{ fontSize: "15px", fontWeight: "600" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <BsArrowLeft size={18} />
              </button>

              <div className="d-flex align-items-center flex-wrap" style={{ gap: "12px" }}>
                <h4 className="fw-bolder mb-0 text-dark" style={{ fontSize: "22px", letterSpacing: "-0.5px" }}>
                  {movie.title}
                </h4>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark border px-2 py-0.5 rounded small">
                    UA
                  </span>
                  {availableFormats.filter((f) => f !== "ALL").slice(0, 2).map((fmt) => (
                    <span key={fmt} className="badge bg-primary px-2.5 py-0.5 rounded-pill small fw-semibold">
                      {fmt}
                    </span>
                  ))}
                </div>
                <div className="text-muted small border-start border-2 ps-3 ms-1 d-none d-md-block" style={{ fontSize: "13px" }}>
                  Select your cinema hall and showtime to choose seats.
                </div>
              </div>
            </div>

            {/* Quick Status Legend */}
            <div className="d-flex align-items-center gap-3 small text-secondary">
              <span className="d-flex align-items-center gap-1.5">
                <span className="badge bg-success rounded-circle p-1" style={{ width: "8px", height: "8px" }}></span>
                Available
              </span>
              <span className="d-flex align-items-center gap-1.5">
                <span className="badge bg-warning rounded-circle p-1" style={{ width: "8px", height: "8px" }}></span>
                Filling Fast
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODERN DATE SELECTOR & FILTERS BAR */}
      <div className="bg-white sticky-top shadow-sm border-bottom" style={{ zIndex: 109, top: "82px", padding: "12px 0" }}>
        <div className="container d-flex flex-column flex-xl-row align-items-center justify-content-between gap-3 p-0">
          
          {/* Left Side: Modern Date Pills */}
          <div className="d-flex align-items-center gap-2 overflow-auto no-scrollbar w-100" style={{ flexWrap: "nowrap", paddingLeft: "12px", paddingRight: "12px" }}>
            {availableDates.length > 0 ? (
              availableDates.map((dateStr, idx) => {
                const isSelected = selectedDate === dateStr || (selectedDate === "ALL" && idx === 0);
                
                // Parse date for Day, Date, Month
                const d = new Date(dateStr);
                const dayStr = isNaN(d) ? "Day" : d.toLocaleDateString("en-US", { weekday: "short" });
                const dateNum = isNaN(d) ? "00" : d.toLocaleDateString("en-US", { day: "2-digit" });
                const monthStr = isNaN(d) ? "Mon" : d.toLocaleDateString("en-US", { month: "short" });

                return (
                  <button
                    key={dateStr}
                    type="button"
                    className={`btn rounded-pill d-flex align-items-center justify-content-center gap-2 transition-all shadow-sm ${
                      isSelected ? "text-white" : "text-dark"
                    }`}
                    style={{
                      minWidth: "120px",
                      padding: "8px 16px",
                      background: isSelected ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" : "#f8fafc",
                      border: isSelected ? "none" : "1px solid #e2e8f0",
                      transform: isSelected ? "translateY(-1px)" : "none",
                      boxShadow: isSelected ? "0 4px 12px rgba(59, 130, 246, 0.25)" : "none",
                    }}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span style={{ fontSize: "17px", fontWeight: "700" }}>{dateNum}</span>
                    <div className="d-flex flex-column align-items-start" style={{ lineHeight: "1.1" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", opacity: isSelected ? 0.9 : 0.6, letterSpacing: "0.5px" }}>{dayStr.toUpperCase()}</span>
                      <span style={{ fontSize: "11px", fontWeight: "600", opacity: isSelected ? 0.9 : 0.6, letterSpacing: "0.5px" }}>{monthStr.toUpperCase()}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-muted small">No dates available</div>
            )}
          </div>

          {/* Right Side: Soft Pill Filters */}
          <div className="d-flex align-items-center gap-2.5 overflow-auto no-scrollbar w-100 justify-content-xl-end" style={{ flexWrap: "nowrap", paddingLeft: "12px", paddingRight: "12px" }}>
            
            <select
              className="form-select form-select-sm rounded-pill px-3 shadow-sm transition-all fw-semibold"
              style={{ fontSize: "13px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", minWidth: "120px", cursor: "pointer", height: "34px" }}
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="ALL">All Formats</option>
              {availableFormats.filter(f => f !== "ALL").map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            
            <select
              className="form-select form-select-sm rounded-pill px-3 shadow-sm transition-all fw-semibold"
              style={{ fontSize: "13px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", minWidth: "120px", cursor: "pointer", height: "34px" }}
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
            >
              <option value="ALL">Price Range</option>
              <option value="0-150">₹0 - ₹150</option>
              <option value="151-300">₹151 - ₹300</option>
              <option value="301+">₹301 & Above</option>
            </select>
            
            <select
              className="form-select form-select-sm rounded-pill px-3 shadow-sm transition-all fw-semibold d-none d-md-block"
              style={{ fontSize: "13px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", minWidth: "140px", cursor: "pointer", height: "34px" }}
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="ALL">Preferred Time</option>
              <option value="morning">Morning (Before 12 PM)</option>
              <option value="afternoon">Afternoon (12-4 PM)</option>
              <option value="evening">Evening (4-8 PM)</option>
              <option value="night">Night (After 8 PM)</option>
            </select>

            <select
              className="form-select form-select-sm rounded-pill px-3 shadow-sm transition-all fw-semibold d-none d-lg-block"
              style={{ fontSize: "13px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", minWidth: "120px", cursor: "pointer", height: "34px" }}
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
            >
              <option value="ALL">Sort By</option>
              <option value="time-asc">Time (Earliest)</option>
              <option value="time-desc">Time (Latest)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
            
            <button className="btn rounded-circle d-flex align-items-center justify-content-center shadow-sm text-primary flex-shrink-0" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", width: "34px", height: "34px", padding: 0 }}>
              <BsSearch size={14} />
            </button>

          </div>
        </div>
      </div>

      {/* CSS for hiding scrollbar on Webkit */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 3. FORMAT FILTERS & THEATER LISTINGS */}
      <div className="container py-4">

        {/* THEATER LISTINGS (EXACT BOOKMYSHOW DESIGN) */}
        <div className="d-flex flex-column gap-3.5 mt-2">
          {theaterGroups.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-4">
              <BsClock size={40} className="text-muted opacity-50 mb-3" />
              <h5 className="fw-bold text-dark">No Showtimes Available</h5>
              <p className="text-muted mb-3">
                There are no scheduled showtimes for {movie.title} on this date.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-4"
                onClick={() => setSelectedDate("ALL")}
              >
                View All Dates
              </button>
            </div>
          ) : (
            theaterGroups.map((th, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-3 border shadow-xs"
                style={{ backgroundColor: "#ffffff" }}
              >
                {/* 1. TOP ROW: CINEMA LOGO + NAME + INFO + SUBTITLE */}
                <div className="d-flex align-items-center gap-3 mb-2">
                  {/* Cinema Logo / Crest Avatar */}
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs"
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="text-center">
                      <span style={{ fontSize: "16px" }}>🏛️</span>
                    </div>
                  </div>

                  {/* Cinema Title + Info Icon + Cancellation Subtitle */}
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h5
                        className="fw-bold mb-0 text-dark"
                        style={{ fontSize: "16px", letterSpacing: "-0.2px" }}
                      >
                        {th.theaterName}: {th.theaterCity} {th.primaryTech ? `• ${th.primaryTech}` : ""}
                      </h5>
                      <BsInfoCircle
                        className="text-secondary opacity-75"
                        size={15}
                        style={{ cursor: "pointer" }}
                        title="Cinema Amenities & Safety Information"
                      />
                    </div>
                    <div className="text-muted" style={{ fontSize: "13px", marginTop: "2px" }}>
                      Cancellation available
                    </div>
                  </div>
                </div>

                {/* 2. FEATURE BADGES (FOOD & BEVERAGE + M-TICKET) */}
                <div className="d-flex align-items-center gap-2 mb-3 ms-1">
                  <span
                    className="rounded-2 p-1.5 d-inline-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "#fff7ed", color: "#f97316" }}
                    title="Food & Beverages Available"
                  >
                    <BsCupHot size={15} />
                  </span>
                  <span
                    className="rounded-2 p-1.5 d-inline-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "#f0fdf4", color: "#10b981" }}
                    title="M-Ticket Supported"
                  >
                    <BsPhone size={15} />
                  </span>
                </div>

                {/* 3. SHOWTIME PILL BUTTONS WITH ACCURATE SCREEN TECH */}
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  {th.showtimes.map((st) => (
                    <button
                      key={st.id || Math.random()}
                      type="button"
                      className="btn bg-white px-3.5 py-2 text-center transition-all position-relative d-flex flex-column align-items-center justify-content-center"
                      style={{
                        minWidth: "128px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "#3b82f6";
                        e.currentTarget.style.color = "#3b82f6";
                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(59, 130, 246, 0.1)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.color = "initial";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                      }}
                      onClick={() => onSelectShowtime(st)}
                      title={`Click to select seats & book (${st.screenTech || "2D"})`}
                    >
                      <span
                        className="fw-bold"
                        style={{ fontSize: "15px", letterSpacing: "0.2px" }}
                      >
                        {formatIndianTime(st.startTime || "10:00:00")}
                      </span>
                      <span
                        className="text-muted fw-semibold"
                        style={{
                          fontSize: "10.5px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          marginTop: "2px",
                        }}
                      >
                        {st.screenTech || "2D"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Note */}
        <div className="p-3 rounded-3 bg-white border shadow-xs mt-4 d-flex align-items-center gap-3 text-secondary small">
          <BsInfoCircle className="text-primary fs-5 flex-shrink-0" />
          <div>
            <strong>Real-Time Seat Synchronization:</strong> Clicking any showtime connects directly to the live hall layout. Seats booked via online portal or box office counter are instantly marked as SOLD across all screens.
          </div>
        </div>
      </div>
    </div>
  );
}
