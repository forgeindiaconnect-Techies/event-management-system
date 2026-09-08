import { useState } from "react";
import { BsQrCodeScan, BsCupStraw, BsCheckCircle, BsXCircle, BsListCheck } from "react-icons/bs";

export default function StaffWebWorkspace() {
  const [activeTab, setActiveTab] = useState("scan");
  const [lastScan, setLastScan] = useState(null);
  const [ticketInput, setTicketInput] = useState("");

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (!ticketInput) return;

    if (ticketInput.includes("FAIL")) {
      setLastScan({
        status: "INVALID",
        message: "Ticket Already Checked-In or Invalid Token",
        time: new Date().toLocaleTimeString(),
      });
    } else {
      setLastScan({
        status: "VALID",
        message: "Access Granted - Screen 1 | Row F (Seat F7, F8)",
        fnb: "1x Large Popcorn Combo Included",
        time: new Date().toLocaleTimeString(),
      });
    }
    setTicketInput("");
  };

  return (
    <div className="min-vh-100 bg-light p-4">
      <div className="container" style={{ maxWidth: "800px" }}>
        <header className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
          <div>
            <h3 className="fw-bold mb-1">Staff Operational Workspace</h3>
            <span className="badge bg-primary">Assigned: Screen 1 - Avatar 3 (6:00 PM Show)</span>
          </div>
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${activeTab === "scan" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("scan")}
            >
              <BsQrCodeScan /> Ticket Scanner
            </button>
            <button
              className={`btn btn-sm ${activeTab === "fnb" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("fnb")}
            >
              <BsCupStraw /> F&B Counter
            </button>
          </div>
        </header>

        {activeTab === "scan" && (
          <div>
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4 text-center">
              <BsQrCodeScan size={48} className="text-primary mb-3" />
              <h5 className="fw-bold mb-2">Scan Attendee / Movie Ticket</h5>
              <p className="text-muted small mb-3">Scan barcode with camera or type ticket ID manually below</p>

              <form onSubmit={handleSimulateScan} className="d-flex gap-2 justify-content-center" style={{ maxWidth: "450px", margin: "0 auto" }}>
                <input
                  type="text"
                  className="form-control form-control-lg fs-6"
                  placeholder="Enter Ticket ID (e.g. TKT-9982)"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-lg fs-6 fw-bold px-4">Verify</button>
              </form>
            </div>

            {lastScan && (
              <div className={`card border-0 shadow-sm p-4 rounded-3 text-white ${lastScan.status === "VALID" ? "bg-success" : "bg-danger"}`}>
                <div className="d-flex align-items-center gap-3">
                  {lastScan.status === "VALID" ? <BsCheckCircle size={40} /> : <BsXCircle size={40} />}
                  <div>
                    <h4 className="fw-bold mb-1">{lastScan.status === "VALID" ? "VALID TICKET - ACCESS GRANTED" : "INVALID TICKET"}</h4>
                    <p className="mb-1">{lastScan.message}</p>
                    {lastScan.fnb && <small className="d-block bg-white text-dark p-2 rounded-2 fw-bold mt-2">🍿 {lastScan.fnb}</small>}
                    <small className="opacity-75 d-block mt-1">Verified at {lastScan.time}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "fnb" && (
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
            <h5 className="fw-bold mb-3">Concession / F&B Dispenser Counter</h5>
            <p className="text-muted small mb-4">Scan attendee ticket barcode to claim popcorn & drink combos</p>
            <div className="alert alert-info">No pending popcorn claims for current show.</div>
          </div>
        )}
      </div>
    </div>
  );
}
