import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TheaterNavbar from "../../components/Navbar/TheaterNavbar";
import api from "../../api/axiosConfig";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../../styles/Admin.css";
import {
  BsQrCodeScan,
  BsCheckCircleFill,
  BsXCircleFill,
  BsExclamationTriangleFill,
  BsSearch,
  BsDoorOpen,
  BsClockHistory,
  BsPersonCheck,
  BsTv,
  BsArrowRepeat,
  BsCheckLg,
  BsFilm,
  BsCameraVideo,
  BsPlayCircle,
  BsXLg,
  BsTicketPerforated,
  BsVolumeUp,
  BsVolumeMute,
  BsShieldCheck,
  BsTrash,
  BsGeoAlt,
} from "react-icons/bs";

export default function TheaterUsherDashboard() {
  const navigate = useNavigate();

  const [cinemaName, setCinemaName] = useState("Gopal Multiplex");
  const [screens, setScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");

  const [ticketInput, setTicketInput] = useState("");
  const [validationResult, setValidationResult] = useState(null); // { status: 'SUCCESS'|'ERROR'|'WARNING', message, ticket }
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gateSearchQuery, setGateSearchQuery] = useState("");
  const scannerRef = useRef(null);

  // Play audio chime for instant usher feedback
  const playChime = (type = "success") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (type === "success") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(240, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.32);
      }
    } catch {
      // Audio playback silently suppressed if blocked by browser policy
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem("theaterName") || localStorage.getItem("cinemaName");
    if (savedName) setCinemaName(savedName);
  }, []);

  useEffect(() => {
    if (isScanning) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
          /* verbose= */ false
        );

        scannerRef.current.render(
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.clear().catch((e) => console.warn(e));
              scannerRef.current = null;
            }
            setIsScanning(false);
            setTicketInput(decodedText);
            handleScanOrVerifyTicket(null, decodedText);
          },
          () => {
            // ignore continuous scanning frame errors
          }
        );
      }
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.warn(e));
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.warn(e));
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const [gateLog, setGateLog] = useState([]);
  const [todayMovies, setTodayMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

  useEffect(() => {
    fetchScreens();
    fetchTodayMovies();
  }, []);

  const fetchTodayMovies = async () => {
    try {
      const pId = localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";

      // 1. Fetch real DB public showtimes
      const pubRes = await api.get("/theater/public/showtimes").catch(() => ({ data: [] }));
      let allShows = Array.isArray(pubRes.data) ? pubRes.data : [];

      // 2. Fetch theater specific DB showtimes if empty
      if (allShows.length === 0) {
        const stRes = await api.get(`/theater/${pId}/showtimes`).catch(() => ({ data: [] }));
        if (Array.isArray(stRes.data)) {
          allShows.push(...stRes.data);
        }
      }

      // 3. Fallback to localStorage (manager/cashier saved data)
      const localKey = `theater_showtimes_${pId}`;
      try {
        const localList = JSON.parse(localStorage.getItem(localKey));
        if (Array.isArray(localList)) {
          allShows.push(...localList);
        }
      } catch (e) {
        // ignore JSON errors
      }

      const movieMap = new Map();
      if (allShows.length > 0) {
        const todayStr = new Date().toDateString();
        const todaysShows = allShows.filter((st) => {
          if (!st.showDate) return false;
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
            return showDateTime.toDateString() === todayStr;
          } catch (e) {
            return false;
          }
        });

        todaysShows.forEach((st) => {
          const key = st.movieTitle;
          if (!key) return;
          if (!movieMap.has(key)) {
            movieMap.set(key, { title: key, poster: st.posterUrl || "", shows: [] });
          }
          movieMap.get(key).shows.push(st);
        });
      }

      // Enrich posters from backend if missing
      const moviesRes = await api.get("/movies").catch(() => ({ data: [] }));
      const allMoviesList = Array.isArray(moviesRes.data) ? moviesRes.data : [];

      const finalList = Array.from(movieMap.values()).map((m) => {
        if (!m.poster) {
          const matching = allMoviesList.find((dbm) => dbm.movieTitle === m.title || dbm.id === m.movieId);
          if (matching?.posterUrl) m.poster = matching.posterUrl;
        }
        m.shows = Array.from(new Set(m.shows.map((s) => s.startTime))).map((time) => ({ startTime: time }));
        return m;
      });

      setTodayMovies(finalList);
    } catch (err) {
      console.warn("Failed to fetch today's movies:", err);
      setTodayMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  };

  const fetchScreens = async () => {
    try {
      const pId = localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";
      const res = await api.get(`/theater/${pId}/screens`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setScreens(res.data);
        setSelectedScreenId(res.data[0].id);
      } else {
        const demoScreens = [
          { id: 1, screenName: "SILVI", screenType: "4K Dual Laser" },
          { id: 2, screenName: "LOKI", screenType: "IMAX 3D" },
          { id: 3, screenName: "THOR", screenType: "Standard 2K" },
        ];
        setScreens(demoScreens);
        setSelectedScreenId(demoScreens[0].id);
      }
    } catch (err) {
      console.warn("Usher screens fetch error:", err);
    }
  };

  const activeScreenObj = screens.find((s) => String(s.id) === String(selectedScreenId)) || { screenName: "SILVI", screenType: "4K Dual Laser" };

  const handleScanOrVerifyTicket = (e, scannedText = null) => {
    if (e) e.preventDefault();
    const query = (scannedText || ticketInput).trim();
    if (!query) return;

    let payload = null;
    let ticketIdStr = query;

    try {
      const parsed = JSON.parse(query);
      if (parsed && typeof parsed === "object") {
        payload = parsed;
        ticketIdStr = parsed.ticketId || parsed.id || query;
      }
    } catch (err) {
      // Regular text/string ID
    }

    ticketIdStr = String(ticketIdStr).toUpperCase();

    // Check double check-in
    const alreadyLogged = gateLog.find((item) => String(item.ticketId).toUpperCase() === ticketIdStr);
    if (alreadyLogged) {
      playChime("warning");
      setValidationResult({
        status: "WARNING",
        title: "TICKET ALREADY CHECKED-IN",
        message: `Ticket '${ticketIdStr}' was already scanned and admitted at ${alreadyLogged.checkedInAt}! Prevent double entry.`,
        ticket: alreadyLogged,
      });
      return;
    }

    const movieTitle = payload?.movieTitle || payload?.movie || "Coolie";
    const screenName = payload?.screenName || payload?.screen || activeScreenObj.screenName;
    const seats = payload?.seats || "E-12, E-13";
    const guestName = payload?.guestName || payload?.name || "Moviegoer";

    // Validate Screen Hall Gate
    if (payload && screenName && screenName.toUpperCase() !== activeScreenObj.screenName.toUpperCase()) {
      playChime("warning");
      setValidationResult({
        status: "WARNING",
        title: "WRONG SCREEN HALL GATE",
        message: `Ticket is valid ONLY for ${screenName} Screen! Customer is currently at ${activeScreenObj.screenName} gate.`,
        ticket: {
          ticketId: ticketIdStr,
          movieTitle: movieTitle,
          correctScreen: screenName,
          scannedScreen: activeScreenObj.screenName,
          seats: seats,
        },
      });
      return;
    }

    // Invalid mock rules (only apply to raw text input for testing)
    if (!payload && (ticketIdStr === "INVALID" || ticketIdStr === "TIC-999999")) {
      playChime("error");
      setValidationResult({
        status: "ERROR",
        title: "INVALID TICKET",
        message: `No active booking record found for ticket ID '${ticketIdStr}'. Please refer customer to the Box Office counter.`,
      });
      return;
    }

    // Valid ticket success
    playChime("success");
    const newEntry = {
      id: Date.now(),
      ticketId: ticketIdStr.startsWith("TIC-") ? ticketIdStr : `TIC-${ticketIdStr}`,
      movieTitle: movieTitle,
      screenName: activeScreenObj.screenName,
      seats: seats,
      guestName: guestName,
      checkedInAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "APPROVED",
    };

    setGateLog([newEntry, ...gateLog]);
    setValidationResult({
      status: "SUCCESS",
      title: "ENTRY APPROVED",
      message: `Ticket Verified! Admit customer to ${activeScreenObj.screenName} Screen.`,
      ticket: newEntry,
    });
    setTicketInput("");
  };

  const handleSimulateScan = (overrideScenario = null) => {
    if (overrideScenario === "WRONG_SCREEN") {
      const otherScreen = screens.find((s) => String(s.id) !== String(selectedScreenId))?.screenName || "Screen 2";
      const demoPayload = {
        ticketId: `TIC-${Math.floor(100000 + Math.random() * 900000)}`,
        movieTitle: "Coolie",
        screenName: otherScreen,
        seats: "D-05, D-06",
        guestName: "Priya Sharma",
      };
      handleScanOrVerifyTicket(null, JSON.stringify(demoPayload));
      return;
    }

    if (overrideScenario === "INVALID") {
      handleScanOrVerifyTicket(null, "INVALID");
      return;
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const demoPayload = {
      ticketId: `TIC-${randomNum}`,
      movieTitle: todayMovies[0]?.title || "Coolie",
      screenName: activeScreenObj.screenName,
      seats: `F-${Math.floor(1 + Math.random() * 12)}, F-${Math.floor(13 + Math.random() * 12)}`,
      guestName: "M-Ticket Guest",
    };
    handleScanOrVerifyTicket(null, JSON.stringify(demoPayload));
  };

  const filteredGateLog = gateLog.filter((item) => {
    if (!gateSearchQuery.trim()) return true;
    const q = gateSearchQuery.toLowerCase();
    return (
      item.ticketId?.toLowerCase().includes(q) ||
      item.movieTitle?.toLowerCase().includes(q) ||
      item.seats?.toLowerCase().includes(q) ||
      item.screenName?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* NAVBAR */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <TheaterNavbar theaterName={`${cinemaName} — Gate Usher Portal`} />
      </div>

      <main className="container-fluid usher-terminal-main px-3 px-md-4" style={{ paddingTop: "82px", paddingBottom: "60px" }}>
        {/* HEADER GATE TERMINAL CARD */}
        <div className="usher-glass-card p-3 p-md-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                }}
              >
                <BsDoorOpen size={24} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="fw-bold text-dark mb-0">Gate Entry Usher Terminal</h5>
                  <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                    <span
                      className="usher-pulse-dot rounded-circle bg-success"
                      style={{ width: "8px", height: "8px", display: "inline-block" }}
                    ></span>
                    Scanner Live
                  </span>
                </div>
                <small className="text-muted">High-speed QR validation & guest check-in for cinema screening halls</small>
              </div>
            </div>

            {/* SCREEN SELECTOR & SOUND TOGGLE */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${soundEnabled ? "btn-light text-primary border" : "btn-outline-secondary"} d-flex align-items-center gap-1`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Sound Beeps Enabled" : "Sound Muted"}
              >
                {soundEnabled ? <BsVolumeUp size={16} /> : <BsVolumeMute size={16} />}
                <span className="small fw-semibold d-none d-sm-inline">{soundEnabled ? "Audio On" : "Muted"}</span>
              </button>

              <div className="d-flex align-items-center gap-2 flex-grow-1 flex-sm-grow-0">
                <label className="fw-bold text-secondary small mb-0 d-none d-sm-inline flex-shrink-0">Gate:</label>
                <select
                  className="form-select form-select-sm fw-bold border-primary shadow-none"
                  value={selectedScreenId}
                  onChange={(e) => {
                    setSelectedScreenId(e.target.value);
                    setValidationResult(null);
                  }}
                  style={{ width: "240px", maxWidth: "100%", borderRadius: "8px" }}
                >
                  {screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.screenName} Gate ({s.screenType || "Standard"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK METRIC BENTO STATS ROW */}
        <div className="row g-2 g-md-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="usher-metric-card h-100">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: "36px", height: "36px", background: "#ecfdf5", color: "#059669" }}
              >
                <BsCheckCircleFill size={18} />
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: "10px", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                  Admitted Today
                </small>
                <div className="fw-bold text-dark" style={{ fontSize: "18px", lineHeight: "1.2" }}>
                  {gateLog.length}
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="usher-metric-card h-100">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: "36px", height: "36px", background: "#e0e7ff", color: "#4338ca" }}
              >
                <BsDoorOpen size={18} />
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: "10px", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                  Active Gate
                </small>
                <div
                  className="fw-bold text-dark"
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.25",
                    wordBreak: "break-word",
                  }}
                  title={activeScreenObj.screenName}
                >
                  {activeScreenObj.screenName}
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="usher-metric-card h-100">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: "36px", height: "36px", background: "#e0f2fe", color: "#0284c7" }}
              >
                <BsFilm size={18} />
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: "10px", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                  Active Movies
                </small>
                <div className="fw-bold text-dark" style={{ fontSize: "18px", lineHeight: "1.2" }}>
                  {todayMovies.length}
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="usher-metric-card h-100">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: "36px", height: "36px", background: "#fef3c7", color: "#d97706" }}
              >
                <BsQrCodeScan size={18} />
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: "10px", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                  Scan Mode
                </small>
                <div className="fw-bold text-dark" style={{ fontSize: "13px", lineHeight: "1.25", wordBreak: "break-word" }}>
                  QR + Ticket ID
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S SHOWINGS CAROUSEL */}
        <div className="usher-glass-card p-3 p-md-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <BsFilm className="text-primary" /> Today's Scheduled Showings
            </h6>
            <span className="badge bg-light text-secondary border fw-normal">
              {todayMovies.length} Movies Playing
            </span>
          </div>

          <div className="d-flex gap-3 overflow-auto pb-2 custom-scrollbar" style={{ scrollbarWidth: "thin" }}>
            {loadingMovies ? (
              <div className="p-3 text-muted small">Loading schedule...</div>
            ) : todayMovies.length > 0 ? (
              todayMovies.map((m, idx) => (
                <div
                  key={idx}
                  className="card border border-light-subtle shadow-sm rounded-3 overflow-hidden flex-shrink-0"
                  style={{ width: "210px", backgroundColor: "#ffffff" }}
                >
                  <div style={{ position: "relative", height: "110px", backgroundColor: "#0f172a" }}>
                    <img
                      src={m.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600"}
                      alt={m.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)",
                      }}
                    ></div>
                    <span
                      className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 start-0 m-2"
                      style={{ fontSize: "10px" }}
                    >
                      {activeScreenObj.screenName}
                    </span>
                  </div>
                  <div className="p-2">
                    <h6 className="fw-bold mb-1 text-truncate text-dark" style={{ fontSize: "13px" }} title={m.title}>
                      {m.title}
                    </h6>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {m.shows.slice(0, 3).map((s, i) => (
                        <span key={i} className="badge bg-light text-dark border" style={{ fontSize: "11px" }}>
                          {s.startTime}
                        </span>
                      ))}
                      {m.shows.length > 3 && (
                        <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "10px" }}>
                          +{m.shows.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted small mb-0 py-2">No movie shows listed for today.</p>
            )}
          </div>
        </div>

        {/* MAIN TERMINAL WORKSPACE */}
        <div className="row g-4">
          {/* LEFT COLUMN: SCANNER & VERIFICATION INPUT */}
          <div className="col-lg-6">
            <div className="usher-glass-card p-3 p-md-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <BsQrCodeScan className="text-primary" /> Ticket QR Code / Manual ID Verification
                </h6>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
                  Auto-Gate Check
                </span>
              </div>

              {/* MANUAL TICKET ID INPUT FORM */}
              <form onSubmit={handleScanOrVerifyTicket} className="mb-3">
                <label className="form-label fw-bold small text-secondary mb-1">
                  Enter Ticket ID or Booking Code
                </label>
                <div className="input-group input-group-lg shadow-sm">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <BsSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 fw-bold text-uppercase"
                    placeholder="e.g. TIC-849201"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    style={{ letterSpacing: "1px" }}
                  />
                  {ticketInput && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0 border-end-0"
                      onClick={() => setTicketInput("")}
                    >
                      <BsXLg size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold d-flex align-items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", border: "none" }}
                  >
                    <BsCheckCircleFill /> Verify
                  </button>
                </div>
              </form>

              {/* QUICK SIMULATION / TEST SHORTCUTS */}
              <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                <span className="small text-muted fw-semibold">Quick Test:</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary py-1 px-2 rounded-pill fw-semibold"
                  style={{ fontSize: "11px" }}
                  onClick={() => handleSimulateScan()}
                >
                  <BsPlayCircle className="me-1" /> Valid Ticket
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning py-1 px-2 rounded-pill fw-semibold"
                  style={{ fontSize: "11px" }}
                  onClick={() => handleSimulateScan("WRONG_SCREEN")}
                >
                  Wrong Screen
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger py-1 px-2 rounded-pill fw-semibold"
                  style={{ fontSize: "11px" }}
                  onClick={() => handleSimulateScan("INVALID")}
                >
                  Invalid Code
                </button>
              </div>

              {/* CAMERA SCANNER VIEWFINDER BOX */}
              <div className={`usher-scanner-box p-4 text-center ${isScanning ? "is-active" : ""}`}>
                {isScanning ? (
                  <div>
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <span
                        className="usher-pulse-dot rounded-circle bg-danger"
                        style={{ width: "10px", height: "10px", display: "inline-block" }}
                      ></span>
                      <strong className="text-dark small">Camera Active — Align QR in the box</strong>
                    </div>

                    <div
                      id="qr-reader"
                      style={{
                        width: "100%",
                        maxWidth: "380px",
                        margin: "0 auto",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "2px solid #4f46e5",
                      }}
                    ></div>

                    <button
                      type="button"
                      className="btn btn-danger mt-3 px-4 py-2 fw-bold rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                      onClick={() => setIsScanning(false)}
                    >
                      <BsXCircleFill /> Stop Camera Scanner
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "linear-gradient(135deg, #e0e7ff 0%, #e0f2fe 100%)",
                        color: "#4f46e5",
                      }}
                    >
                      <BsQrCodeScan size={38} />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Camera QR Scanner Ready</h6>
                    <p className="small text-muted mb-3" style={{ maxWidth: "340px", margin: "0 auto" }}>
                      Scan customer M-Ticket QR code from their mobile screen or paper ticket printout.
                    </p>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-primary px-4 py-2 fw-bold rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                        onClick={() => setIsScanning(true)}
                        style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", border: "none" }}
                      >
                        <BsCameraVideo /> Start Camera Scanner
                      </button>
                      <button
                        type="button"
                        className="btn btn-light border px-3 py-2 fw-semibold rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                        onClick={() => handleSimulateScan()}
                      >
                        <BsPlayCircle /> Simulate Scan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* VALIDATION RESULT AUDIO-VISUAL BANNER */}
            {validationResult && (
              <div
                className="card border-0 shadow-lg p-3 p-md-4 rounded-4 text-white mb-4 animate__animated animate__fadeIn"
                style={{
                  background:
                    validationResult.status === "SUCCESS"
                      ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                      : validationResult.status === "WARNING"
                      ? "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
                      : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                }}
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-circle flex-shrink-0">
                      {validationResult.status === "SUCCESS" && <BsCheckCircleFill size={36} />}
                      {validationResult.status === "WARNING" && <BsExclamationTriangleFill size={36} />}
                      {validationResult.status === "ERROR" && <BsXCircleFill size={36} />}
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-white">{validationResult.title}</h5>
                      <p className="mb-0 text-white-50 small mt-1">{validationResult.message}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-link text-white text-decoration-none p-1"
                    onClick={() => setValidationResult(null)}
                    title="Dismiss"
                  >
                    <BsXLg size={18} />
                  </button>
                </div>

                {validationResult.ticket && (
                  <div className="mt-3 pt-3 border-top border-white border-opacity-25 bg-black bg-opacity-20 p-3 rounded-3">
                    <div className="row g-2 small">
                      <div className="col-sm-6">
                        <span className="text-white-50">Ticket Code:</span>{" "}
                        <strong className="text-white font-monospace">{validationResult.ticket.ticketId}</strong>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-white-50">Movie:</span>{" "}
                        <strong className="text-white">{validationResult.ticket.movieTitle}</strong>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-white-50">Assigned Screen:</span>{" "}
                        <span className="badge bg-white text-dark ms-1">
                          {validationResult.ticket.screenName || validationResult.ticket.correctScreen}
                        </span>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-white-50">Reserved Seats:</span>{" "}
                        <span className="badge bg-warning text-dark ms-1">
                          {validationResult.ticket.seats}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE GATE ENTRY FEED */}
          <div className="col-lg-6">
            <div className="usher-glass-card p-3 p-md-4 h-100 d-flex flex-column">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 border-bottom pb-2">
                <div className="d-flex align-items-center gap-2">
                  <BsClockHistory className="text-primary" />
                  <h6 className="fw-bold text-dark mb-0">Live Gate Entry Activity Feed</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                    {gateLog.length} Admitted Today
                  </span>
                  {gateLog.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2 d-flex align-items-center gap-1"
                      onClick={() => setGateLog([])}
                      title="Clear Gate Entry Log"
                      style={{ fontSize: "11px", height: "24px" }}
                    >
                      <BsTrash size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* FILTER / SEARCH IN GATE LOG */}
              {gateLog.length > 0 && (
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search admitted tickets, movie, seat..."
                    value={gateSearchQuery}
                    onChange={(e) => setGateSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {/* FEED LIST */}
              <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "580px" }}>
                {gateLog.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-light text-secondary"
                      style={{ width: "64px", height: "64px" }}
                    >
                      <BsTicketPerforated size={32} />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No Admissions Logged Yet</h6>
                    <p className="small text-muted mb-0">
                      Admitted patrons scanned at this gate will appear in real-time here.
                    </p>
                  </div>
                ) : filteredGateLog.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No log records match &quot;{gateSearchQuery}&quot;
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {filteredGateLog.map((log) => (
                      <div
                        key={log.id}
                        className="usher-feed-item border border-light-subtle d-flex flex-wrap justify-content-between align-items-center gap-2"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{ width: "38px", height: "38px", background: "#ecfdf5", color: "#059669" }}
                          >
                            <BsCheckLg size={18} />
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold font-monospace text-dark" style={{ fontSize: "13px" }}>
                                {log.ticketId}
                              </span>
                              <span className="badge bg-warning-subtle text-dark border border-warning-subtle" style={{ fontSize: "11px" }}>
                                Seats: {log.seats}
                              </span>
                            </div>
                            <small className="text-muted d-block mt-1">
                              Movie: <strong className="text-dark">{log.movieTitle}</strong> &bull; Gate:{" "}
                              <strong className="text-primary">{log.screenName}</strong>
                            </small>
                          </div>
                        </div>

                        <div className="text-end ms-auto">
                          <span className="badge bg-success mb-1 d-inline-block">Admitted</span>
                          <small className="d-block text-muted" style={{ fontSize: "11px" }}>
                            {log.checkedInAt}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
