import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsCheck2Circle,
  BsPersonCheck,
  BsQrCodeScan,
  BsSearch,
  BsTicketPerforated,
} from "react-icons/bs";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import api from "../../api/axiosConfig";

function CheckIn() {
  const { id } = useParams();
  const scannerRef = useRef(null);
  const stoppingRef = useRef(false);
  const [dashboard, setDashboard] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const scannerId = "event-day-qr-reader";

  useEffect(() => {
    loadCheckInData();

    return () => {
      stopScanner();
    };
  }, [id]);

  const loadCheckInData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, registrationsRes] = await Promise.all([
        api.get(`/attendance-dashboard/event/${id}`),
        api.get(`/registrations/event/${id}`),
      ]);

      setDashboard(dashboardRes.data);
      setRegistrations(registrationsRes.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setDashboard(null);
      setRegistrations([]);
      setMessage("Unable to load check-in data.");
    } finally {
      setLoading(false);
    }
  };

  const checkInRate = useMemo(() => {
    if (!dashboard?.totalRegistrations) return 0;
    return Math.round((dashboard.checkedIn / dashboard.totalRegistrations) * 100);
  }, [dashboard]);

  const filteredRegistrations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return registrations;

    return registrations.filter((registration) => {
      const participant = registration.participant || {};
      const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();

      return [registration.id, fullName, participant.email, participant.phoneNumber, registration.registrationType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [registrations, search]);

  const recentCheckIns = registrations.filter((registration) => registration.attended);

  const markAttendance = async (registrationId) => {
    try {
      const res = await api.put(`/registrations/${registrationId}/attendance`);
      setRegistrations((current) =>
        current.map((registration) => (registration.id === registrationId ? res.data : registration))
      );
      await loadCheckInData();
      setMessage("Attendee checked in successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to check in attendee.");
    }
  };

  const openTicketDetails = async (registration) => {
    setSelectedRegistration(registration);
    setSelectedTicket(null);

    try {
      setTicketLoading(true);
      const res = await api.get(`/tickets/registration/${registration.id}`);
      setSelectedTicket(res.data);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Ticket is not generated for this attendee yet.");
    } finally {
      setTicketLoading(false);
    }
  };

  const closeTicketDetails = () => {
    setSelectedRegistration(null);
    setSelectedTicket(null);
  };

  const stopScanner = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (error) {
          console.log("Scanner stop ignored:", error);
        }

        try {
          await scannerRef.current.clear();
        } catch (error) {
          console.log("Scanner clear ignored:", error);
        }

        scannerRef.current = null;
      }

      const scannerElement = document.getElementById(scannerId);
      if (scannerElement) {
        const videos = scannerElement.querySelectorAll("video");
        videos.forEach((video) => {
          if (video.srcObject) {
            video.srcObject.getTracks().forEach((track) => track.stop());
            video.srcObject = null;
          }
          video.pause();
          video.removeAttribute("src");
          video.load();
        });
        scannerElement.innerHTML = "";
      }
    } finally {
      setScanning(false);
      stoppingRef.current = false;
    }
  };

  const startScanner = async () => {
    try {
      await stopScanner();
      setMessage("Starting camera...");
      setScanning(true);

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setMessage("No camera found.");
        setScanning(false);
        return;
      }

      const backCamera =
        devices.find((device) => device.label.toLowerCase().includes("back")) ||
        devices.find((device) => device.label.toLowerCase().includes("rear")) ||
        devices[devices.length - 1];

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { deviceId: { exact: backCamera.id } },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          await stopScanner();
          await handleQrValue(decodedText);
        },
        () => {}
      );

      setMessage("Camera active. Point it at the ticket QR code.");
    } catch (error) {
      console.log(error);
      await stopScanner();
      setMessage("Unable to open camera. Please allow camera permission.");
    }
  };

  const handleQrValue = async (value) => {
    const qrValue = String(value || "").trim();
    if (!qrValue) return;

    const staffId = localStorage.getItem("userId");

    try {
      if (staffId) {
        await api.put(`/tickets/verify/${encodeURIComponent(qrValue)}/staff/${staffId}`);
        await loadCheckInData();
        setMessage("Ticket QR verified successfully. Attendance marked present.");
        return;
      }
    } catch (error) {
      console.log("Ticket verification fallback:", error);
    }

    const parsedRegistrationId = parseRegistrationId(qrValue);
    const keyword = (parsedRegistrationId || qrValue).toLowerCase();

    const match = registrations.find((registration) => {
      const participant = registration.participant || {};
      return [registration.id, participant.email, participant.phoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === keyword);
    });

    if (!match) {
      setMessage("No matching registration found for this ticket.");
      return;
    }

    if (match.attended) {
      setMessage("This attendee is already checked in.");
      return;
    }

    markAttendance(match.id);
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    await handleQrValue(scanValue);
    setScanValue("");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Check-In
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Validate registrations and mark attendees present at the event.
          </p>
        </div>

        <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={loadCheckInData}>
          <BsArrowClockwise /> {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4 mb-4">
        <StatCard label="Total Registrations" value={dashboard?.totalRegistrations || 0} />
        <StatCard label="Checked-In" value={dashboard?.checkedIn || 0} />
        <StatCard label="Pending Check-In" value={dashboard?.notCheckedIn || 0} />
        <StatCard label="Check-In Rate" value={`${checkInRate}%`} />
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Scan or Enter Ticket
              </h5>

              <div
                className="position-relative mx-auto mb-3"
                style={{
                  width: "100%",
                  minHeight: "260px",
                  border: scanning ? "0" : "2px dashed #2563eb",
                  borderRadius: "16px",
                  backgroundColor: scanning ? "#111827" : "#eff6ff",
                  overflow: "hidden",
                }}
              >
                <div
                  id={scannerId}
                  style={{
                    width: "100%",
                    minHeight: "260px",
                  }}
                />

                {!scanning && (
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <BsQrCodeScan size={86} color="#2563eb" />
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mb-3">
                <button
                  className="btn btn-outline-primary w-50"
                  type="button"
                  onClick={startScanner}
                  disabled={scanning}
                >
                  Start Camera
                </button>
                <button
                  className="btn btn-outline-secondary w-50"
                  type="button"
                  onClick={stopScanner}
                >
                  Stop
                </button>
              </div>

              <form onSubmit={handleScanSubmit}>
                <input
                  className="form-control mb-3"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  placeholder="QR text, REG ID, email, or phone"
                />
                <button className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2">
                  <BsPersonCheck /> Check In
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h5 className="fw-semibold mb-0" style={{ fontSize: "17px" }}>
                  Attendee Check-In
                </h5>
                <div className="input-group" style={{ maxWidth: "320px" }}>
                  <span className="input-group-text bg-white">
                    <BsSearch />
                  </span>
                  <input
                    className="form-control"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search attendee"
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Attendee</th>
                      <th>Ticket</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          No registrations found.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((registration) => (
                        <RegistrationRow
                          key={registration.id}
                          registration={registration}
                          onCheckIn={markAttendance}
                          onViewTicket={openTicketDetails}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Recent Check-Ins
              </h5>
              {recentCheckIns.length === 0 ? (
                <div className="text-muted">No attendees checked in yet.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {recentCheckIns.slice(0, 5).map((registration) => {
                    const participant = registration.participant || {};
                    return (
                      <div className="d-flex justify-content-between border rounded p-3" key={registration.id}>
                        <div>
                          <div className="fw-semibold">
                            {participant.firstName} {participant.lastName}
                          </div>
                          <div className="text-muted small">{participant.email}</div>
                        </div>
                        <span className="text-success d-flex align-items-center gap-2">
                          <BsCheck2Circle /> Checked In
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedRegistration && (
        <TicketDetailsModal
          registration={selectedRegistration}
          ticket={selectedTicket}
          loading={ticketLoading}
          onClose={closeTicketDetails}
          onCheckIn={markAttendance}
        />
      )}
    </div>
  );
}

function RegistrationRow({ registration, onCheckIn, onViewTicket }) {
  const participant = registration.participant || {};
  const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim() || "Attendee";

  return (
    <tr style={{ cursor: "pointer" }} onClick={() => onViewTicket(registration)}>
      <td>
        <button
          className="btn btn-link p-0 fw-semibold text-decoration-none"
          onClick={(e) => {
            e.stopPropagation();
            onViewTicket(registration);
          }}
        >
          {fullName}
        </button>
        <div className="text-muted small">{participant.email}</div>
      </td>
      <td>
        <div>#{registration.id}</div>
        <div className="text-muted small">{registration.registrationType}</div>
      </td>
      <td>{registration.paymentStatus}</td>
      <td>
        {registration.attended ? (
          <span className="badge text-bg-success">Checked In</span>
        ) : (
          <span className="badge text-bg-warning">Pending</span>
        )}
      </td>
      <td className="text-end">
        <button
          className="btn btn-sm btn-primary"
          disabled={registration.attended}
          onClick={(e) => {
            e.stopPropagation();
            onCheckIn(registration.id);
          }}
        >
          Check In
        </button>
      </td>
    </tr>
  );
}

function TicketDetailsModal({ registration, ticket, loading, onClose, onCheckIn }) {
  const participant = registration.participant || {};
  const event = registration.event || {};
  const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim() || "Attendee";
  const qrValue = ticket?.qrCode || `REG-${registration.id}-${ticket?.ticketNumber || ""}`;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(15, 23, 42, 0.55)" }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-semibold">Attendee Ticket</h5>
              <div className="text-muted small">Registration #{registration.id}</div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="text-center py-5 text-muted">Loading ticket...</div>
            ) : (
              <div className="row g-4">
                <div className="col-md-5">
                  <div className="border rounded-3 p-4 text-center h-100">
                    <div
                      className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "160px",
                        height: "160px",
                        border: "1px solid #dbeafe",
                        borderRadius: "18px",
                        background: "#eff6ff",
                      }}
                    >
                      <QRCodeCanvas
                        value={qrValue}
                        size={128}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="fw-semibold">{ticket?.ticketNumber || `REG-${registration.id}`}</div>
                    <div className="text-muted small mt-1">
                      {ticket ? "Ticket number" : "Ticket not generated yet"}
                    </div>
                    <span className={`badge mt-3 ${ticket?.status === "USED" ? "text-bg-success" : "text-bg-primary"}`}>
                      {ticket?.status || registration.status}
                    </span>
                  </div>
                </div>

                <div className="col-md-7">
                  <InfoLine label="Attendee" value={fullName} />
                  <InfoLine label="Email" value={participant.email} />
                  <InfoLine label="Phone" value={participant.phoneNumber} />
                  <InfoLine label="Event" value={event.eventName} />
                  <InfoLine label="Registration Type" value={registration.registrationType} />
                  <InfoLine label="Payment Status" value={registration.paymentStatus} />
                  <InfoLine label="Attendance" value={registration.attended ? "Checked In" : "Pending"} />
                  <InfoLine label="Ticket QR" value={qrValue} />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={registration.attended}
              onClick={() => onCheckIn(registration.id)}
            >
              <BsTicketPerforated /> Check In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="d-flex py-2 border-bottom">
      <div className="text-muted" style={{ width: "42%" }}>
        {label}
      </div>
      <div className="fw-semibold" style={{ width: "58%", overflowWrap: "anywhere" }}>
        {value || "N/A"}
      </div>
    </div>
  );
}

function parseRegistrationId(qrValue) {
  const regMatch = String(qrValue).match(/^REG-(\d+)/i);
  if (regMatch) return regMatch[1];

  const numericMatch = String(qrValue).match(/^\d+$/);
  if (numericMatch) return numericMatch[0];

  return "";
}

function StatCard({ label, value }) {
  return (
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted" style={{ fontSize: "13px" }}>
            {label}
          </div>
          <div className="fw-semibold" style={{ fontSize: "28px" }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckIn;
