import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import "../../styles/Admin.css";
import {
  BsQrCode,
  BsCheckCircle,
  BsTicketPerforated,
  BsCameraVideo,
  BsCalendarEvent,
} from "react-icons/bs";
import { Html5Qrcode } from "html5-qrcode";

function StaffTicketVerification() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const streamRef = useRef(null);
  const stoppingRef = useRef(false);

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("Ready to scan ticket QR code.");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const scannerId = "staff-qr-reader";

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const turnOffTorch = async () => {
    try {
      const tracks = streamRef.current?.getVideoTracks?.() || [];

      for (const track of tracks) {
        const capabilities = track.getCapabilities?.();

        if (capabilities?.torch) {
          await track.applyConstraints({
            advanced: [{ torch: false }],
          });
        }
      }
    } catch (error) {
      console.log("Torch off failed:", error);
    }
  };

  const forceStopAllVideoTracks = async () => {
    try {
      await turnOffTorch();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      const scannerElement = document.getElementById(scannerId);

      if (scannerElement) {
        const videos = scannerElement.querySelectorAll("video");

        videos.forEach((video) => {
          if (video.srcObject) {
            video.srcObject.getTracks().forEach((track) => {
              track.stop();
            });
            video.srcObject = null;
          }

          video.pause();
          video.removeAttribute("src");
          video.load();
        });

        scannerElement.innerHTML = "";
      }
    } catch (error) {
      console.log("Force stop failed:", error);
    }
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

      await forceStopAllVideoTracks();

      setMessage("Camera stopped.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to stop camera.");
    } finally {
      setScanning(false);
      setLoading(false);
      stoppingRef.current = false;
    }
  };

  const startScanner = async () => {
    try {
      await stopScanner();

      setTicket(null);
      setMessage("Starting camera...");
      setScanning(true);

      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        setMessage("No camera found.");
        setScanning(false);
        return;
      }

      const backCamera =
        devices.find((device) =>
          device.label.toLowerCase().includes("back")
        ) ||
        devices.find((device) =>
          device.label.toLowerCase().includes("rear")
        ) ||
        devices[devices.length - 1];

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { deviceId: { exact: backCamera.id } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopScanner();
          await verifyTicket(decodedText);
        },
        () => {}
      );

      setTimeout(() => {
        const video = document.querySelector(`#${scannerId} video`);

        if (video?.srcObject) {
          streamRef.current = video.srcObject;
        }
      }, 500);

      setMessage("Camera active. Point it at the ticket QR code.");
    } catch (error) {
      console.log(error);
      await forceStopAllVideoTracks();
      setScanning(false);
      setMessage("Unable to open camera. Please allow camera permission.");
    }
  };

  const verifyTicket = async (qrValue) => {
    const staffId = localStorage.getItem("userId");

    try {
      setLoading(true);
      setMessage("Verifying ticket...");
      setTicket(null);

      const response = await api.put(
        `/tickets/verify/${encodeURIComponent(qrValue)}/staff/${staffId}`
      );

      setTicket(response.data);
      setMessage("Ticket verified successfully. Attendance marked present.");
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message ||
          "Invalid ticket or you are not assigned to this event."
      );
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const scanNext = async () => {
    await stopScanner();
    await startScanner();
  };

  return (
    <RoleLayout
      mainClassName="staff-dashboard-main"
      sidebarClassName="staff-dashboard-sidebar"
    >
      <div className="staff-dashboard-page">
      <div className="mb-4 staff-dashboard-header">
        <h1 className="fw-bold mb-1 staff-dashboard-title">
          Ticket Verification
        </h1>
        <p className="text-muted mb-0 staff-dashboard-subtitle">
          Scan attendee ticket QR codes using the camera.
        </p>
      </div>

      <div className="staff-mobile-nav mb-3">
        <button onClick={() => navigate("/staff")}>
          <BsCalendarEvent />
          Dashboard
        </button>
        <button onClick={() => navigate("/staff/check-in")}>
          <BsTicketPerforated />
          Verify
        </button>
        <button onClick={() => navigate("/staff/attendance")}>
          <BsCheckCircle />
          Attendance
        </button>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="admin-bento-card staff-scanner-card">
            <div className="admin-bento-icon mb-3">
              <BsCameraVideo />
            </div>

            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Camera Scanner
            </h2>

            <div
              id={scannerId}
              className="staff-scanner-box"
              style={{
                width: "100%",
                minHeight: "320px",
                borderRadius: "18px",
                overflow: "hidden",
                background: "#111827",
              }}
            />

            <div className="d-flex gap-2 mt-3 staff-scanner-actions">
              <button
                className="btn btn-primary"
                onClick={startScanner}
                disabled={scanning || loading}
              >
                Start Scanner
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={stopScanner}
              >
                Stop
              </button>

              <button
                className="btn btn-outline-primary"
                onClick={scanNext}
                disabled={loading}
              >
                Scan Next
              </button>
            </div>

            {message && (
              <div className="alert alert-info mt-3 mb-0">{message}</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="admin-bento-card h-100 staff-result-card">
            <div className="admin-bento-icon mb-3">
              <BsTicketPerforated />
            </div>

            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Verification Result
            </h2>

            {!ticket ? (
              <div className="text-center py-4 text-muted">
                <BsQrCode size={60} className="mb-3" />
                <p>No ticket verified yet.</p>
              </div>
            ) : (
              <div>
                <div className="alert alert-success d-flex align-items-center gap-2">
                  <BsCheckCircle />
                  Ticket verified successfully
                </div>

                <p>
                  <strong>Ticket No:</strong> {ticket.ticketNumber}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span className="badge bg-success">{ticket.status}</span>
                </p>

                <p>
                  <strong>Participant:</strong>{" "}
                  {ticket.registration?.participant?.firstName}{" "}
                  {ticket.registration?.participant?.lastName}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {ticket.registration?.participant?.email}
                </p>

                <p>
                  <strong>Event:</strong>{" "}
                  {ticket.registration?.event?.eventName}
                </p>

                <p>
                  <strong>Registration Type:</strong>{" "}
                  {ticket.registration?.registrationType}
                </p>

                <p className="mb-0">
                  <strong>Attendance:</strong>{" "}
                  {ticket.registration?.attended ? (
                    <span className="badge bg-success">Present</span>
                  ) : (
                    <span className="badge bg-secondary">Absent</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </RoleLayout>
  );
}

export default StaffTicketVerification;
