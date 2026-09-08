import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TheaterNavbar from "../../components/Navbar/TheaterNavbar";
import api from "../../api/axiosConfig";
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
} from "react-icons/bs";

export default function TheaterUsherDashboard() {
  const navigate = useNavigate();

  const [cinemaName, setCinemaName] = useState("Gopal Multiplex");
  const [screens, setScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");

  const [ticketInput, setTicketInput] = useState("");
  const [validationResult, setValidationResult] = useState(null); // { status: 'SUCCESS'|'ERROR'|'WARNING', message, ticket }

  // Live gate log of checked-in attendees
  const [gateLog, setGateLog] = useState([
    {
      id: 1,
      ticketId: "TIC-849201",
      movieTitle: "Avatar: Fire and Ash",
      screenName: "SILVI",
      seats: "E-12, E-13",
      guestName: "Rithveen N",
      checkedInAt: "02:15 PM",
      status: "APPROVED",
    },
    {
      id: 2,
      ticketId: "TIC-773219",
      movieTitle: "Coolie",
      screenName: "SILVI",
      seats: "A-5",
      guestName: "Walk-In Guest",
      checkedInAt: "02:22 PM",
      status: "APPROVED",
    },
  ]);

  useEffect(() => {
    fetchScreens();
  }, []);

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

  const activeScreenObj = screens.find((s) => String(s.id) === String(selectedScreenId)) || { screenName: "SILVI" };

  const handleScanOrVerifyTicket = (e) => {
    if (e) e.preventDefault();
    const query = ticketInput.trim().toUpperCase();
    if (!query) return;

    // Simulated ticket lookup
    // Demo rule 1: TIC-999999 or INVALID -> Not found
    // Demo rule 2: Wrong hall if ticket is for LOKI but gate is SILVI
    if (query === "INVALID" || query === "TIC-999999") {
      setValidationResult({
        status: "ERROR",
        title: "INVALID TICKET",
        message: `No active booking record found for ticket ID '${query}'. Please refer customer to the Box Office counter.`,
      });
      return;
    }

    if (query.includes("LOKI") && activeScreenObj.screenName !== "LOKI") {
      setValidationResult({
        status: "WARNING",
        title: "WRONG SCREEN HALL GATE",
        message: `Ticket '${query}' is valid ONLY for LOKI Screen! Customer is currently at ${activeScreenObj.screenName} Screen gate.`,
        ticket: {
          ticketId: query,
          movieTitle: "Coolie",
          correctScreen: "LOKI",
          scannedScreen: activeScreenObj.screenName,
          seats: "B-8, B-9",
          showTime: "02:30 PM",
        },
      });
      return;
    }

    // Check if already checked in
    const alreadyLogged = gateLog.find((item) => item.ticketId === query);
    if (alreadyLogged) {
      setValidationResult({
        status: "WARNING",
        title: "TICKET ALREADY CHECKED-IN",
        message: `Ticket '${query}' was already scanned and admitted at ${alreadyLogged.checkedInAt}! Prevent double entry.`,
        ticket: alreadyLogged,
      });
      return;
    }

    // Valid ticket success
    const newEntry = {
      id: Date.now(),
      ticketId: query.startsWith("TIC-") ? query : `TIC-${query}`,
      movieTitle: "Avatar: Fire and Ash",
      screenName: activeScreenObj.screenName,
      seats: "E-12, E-13",
      guestName: "Moviegoer",
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

  const handleSimulateScan = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const demoId = `TIC-${randomNum}`;
    setTicketInput(demoId);

    // Auto verify
    const newEntry = {
      id: Date.now(),
      ticketId: demoId,
      movieTitle: "Avatar: Fire and Ash",
      screenName: activeScreenObj.screenName,
      seats: `F-${Math.floor(1 + Math.random() * 14)}, F-${Math.floor(15 + Math.random() * 10)}`,
      guestName: "M-Ticket Guest",
      checkedInAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "APPROVED",
    };

    setGateLog([newEntry, ...gateLog]);
    setValidationResult({
      status: "SUCCESS",
      title: "ENTRY APPROVED",
      message: `QR M-Ticket Verified! Customer admitted to ${activeScreenObj.screenName} Screen.`,
      ticket: newEntry,
    });
    setTicketInput("");
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* NAVBAR */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <TheaterNavbar theaterName={`${cinemaName} — Gate Usher QR Validation`} />
      </div>

      <main className="container-fluid px-4" style={{ paddingTop: "85px", paddingBottom: "50px" }}>
        {/* HEADER GATE SELECTOR */}
        <div className="card border-0 shadow-sm p-3 bg-white rounded-3 mb-4">
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <BsDoorOpen className="text-primary" /> Gate Entry Usher Terminal
              </h5>
              <small className="text-muted">Live ticket QR verification & entrance gate check-in</small>
            </div>

            <div className="col-md-6 d-flex align-items-center justify-content-md-end gap-2">
              <label className="fw-bold text-dark small mb-0">Assigned Screen Entrance:</label>
              <select
                className="form-select form-select-sm fw-bold border-primary"
                value={selectedScreenId}
                onChange={(e) => {
                  setSelectedScreenId(e.target.value);
                  setValidationResult(null);
                }}
                style={{ width: "230px" }}
              >
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>
                    🚪 {s.screenName} Entrance ({s.screenType || "Standard"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* LEFT COLUMN: QR SCANNER & SEARCH CONTROLS */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <BsQrCodeScan className="text-primary" /> Scan Customer Ticket QR Code / Ticket ID
              </h6>

              <form onSubmit={handleScanOrVerifyTicket} className="mb-4">
                <label className="form-label fw-bold small text-dark">Enter Ticket ID or M-Ticket Code *</label>
                <div className="input-group input-group-lg mb-3">
                  <span className="input-group-text bg-light"><BsSearch /></span>
                  <input
                    type="text"
                    className="form-control fw-bold"
                    placeholder="e.g. TIC-849201"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary px-4 fw-bold">
                    Verify Ticket
                  </button>
                </div>
              </form>

              {/* CAMERA SCANNER SIMULATOR BUTTON */}
              <div className="p-4 bg-light border border-dashed rounded-3 text-center mb-2">
                <BsQrCodeScan size={64} className="text-primary mb-3" />
                <h6 className="fw-bold text-dark mb-1">Camera QR Scanner Active</h6>
                <p className="small text-muted mb-3">Position phone M-Ticket QR code in front of camera or click simulator below.</p>
                <button
                  type="button"
                  className="btn btn-success px-4 py-2 fw-bold rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                  onClick={handleSimulateScan}
                >
                  <BsQrCodeScan /> Simulate Live Camera QR Scan
                </button>
              </div>
            </div>

            {/* VALIDATION RESULT AUDIO-VISUAL BANNER */}
            {validationResult && (
              <div
                className={`card border-0 shadow-sm p-4 rounded-3 text-white ${
                  validationResult.status === "SUCCESS"
                    ? "bg-success"
                    : validationResult.status === "WARNING"
                    ? "bg-warning text-dark"
                    : "bg-danger"
                }`}
              >
                <div className="d-flex align-items-center gap-3">
                  {validationResult.status === "SUCCESS" && <BsCheckCircleFill size={48} />}
                  {validationResult.status === "WARNING" && <BsExclamationTriangleFill size={48} />}
                  {validationResult.status === "ERROR" && <BsXCircleFill size={48} />}

                  <div>
                    <h4 className="fw-bold mb-1">{validationResult.title}</h4>
                    <p className="mb-0 fs-6">{validationResult.message}</p>
                  </div>
                </div>

                {validationResult.ticket && (
                  <div className="mt-3 pt-3 border-top border-white-50 text-start bg-black bg-opacity-10 p-3 rounded-3">
                    <div className="row g-2 small fw-bold">
                      <div className="col-6">Ticket ID: {validationResult.ticket.ticketId}</div>
                      <div className="col-6">Movie: {validationResult.ticket.movieTitle}</div>
                      <div className="col-6">Screen: {validationResult.ticket.screenName || validationResult.ticket.correctScreen}</div>
                      <div className="col-6">Seats: {validationResult.ticket.seats}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE GATE ENTRY LOG */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <BsClockHistory className="text-primary" /> Live Gate Entry Activity Feed
                </h6>
                <span className="badge bg-success-subtle text-success border border-success px-3 py-1">
                  {gateLog.length} Admitted Today
                </span>
              </div>

              {gateLog.length === 0 ? (
                <p className="text-muted text-center py-4">No tickets scanned at this gate yet today.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {gateLog.map((log) => (
                    <div className="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center" key={log.id}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-success-subtle text-success rounded-circle">
                          <BsCheckLg size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">{log.ticketId} — Seat {log.seats}</h6>
                          <small className="text-muted">
                            Movie: <strong className="text-dark">{log.movieTitle}</strong> | Screen: <strong className="text-primary">{log.screenName}</strong>
                          </small>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="badge bg-success mb-1">Admitted</span>
                        <small className="d-block text-muted">{log.checkedInAt}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
