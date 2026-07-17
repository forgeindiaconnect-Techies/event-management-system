import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import logo from "../../assets/images/fic-logo.png";
import UserProfileMenu from "../../components/Public/UserProfileMenu";
import { getDefaultBanner } from "../../utils/bannerUtils";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BsCalendarEvent,
  BsGeoAlt,
  BsPerson,
  BsTicketPerforated,
  BsCheckCircle,
  BsCreditCard,
  BsInfoCircle,
} from "react-icons/bs";

function PublicTicket() {
  const { registrationId } = useParams();

  const ticketRef = useRef(null);

  const [registration, setRegistration] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTicket();
  }, [registrationId]);

  const loadTicket = async () => {
    try {
      const regRes = await api.get(`/registrations/${registrationId}`);
      setRegistration(regRes.data);

      try {
        const ticketRes = await api.get(`/tickets/registration/${registrationId}/all`);
        const loadedTickets = Array.isArray(ticketRes.data) ? ticketRes.data : [];
        setTickets(loadedTickets);
        setTicket(loadedTickets[0] || null);
      } catch {
        try {
          const ticketRes = await api.get(`/tickets/registration/${registrationId}`);
          setTicket(ticketRes.data);
          setTickets(ticketRes.data ? [ticketRes.data] : []);
        } catch {
          setTicket(null);
          setTickets([]);
        }
      }
    } catch (error) {
      console.log(error);
      setMessage("Unable to load ticket.");
    }
  };

  const downloadTicket = async () => {
    try {
      const element = ticketRef.current;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      pdf.save(`ticket-${registration.id}.pdf`);
    } catch (error) {
      console.log(error);
    }
  };

  if (message) {
    return <div className="container py-5 text-danger">{message}</div>;
  }

  if (!registration) {
    return <div className="container py-5">Loading ticket...</div>;
  }

  const event = registration.event;
  const participant = registration.participant;
  const portal = event?.portal;

  const portalName = portal?.portalName || portal?.name || "FIC Events";
  const portalLogo = portal?.logoUrl || logo;

  const banner = event?.bannerUrl || getDefaultBanner(event?.eventType);
  const displayTicket = ticket || tickets[0];
  const amount =
    Number(registration.totalAmount || 0) ||
    Number(registration.ticketClass?.price || event?.ticketPrice || 0) *
      Number(registration.ticketQuantity || 1);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <nav
        className="public-flow-navbar d-flex justify-content-between align-items-center px-5"
        style={{
          height: "68px",
          background: "#030712",
          color: "#fff",
        }}
      >
        <Link
          to="/"
          className="d-flex align-items-center gap-3 text-white text-decoration-none"
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#fff",
              overflow: "hidden",
              padding: "4px",
            }}
          >
            <img
              src={portalLogo}
              alt={portalName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          <strong style={{ fontSize: "22px" }}>{portalName}</strong>
        </Link>

        <div className="public-flow-navbar-actions d-flex align-items-center gap-4">
          <Link to="/find-events" className="public-nav-link text-white text-decoration-none">
            Find Events
          </Link>
          <UserProfileMenu dark />
        </div>
      </nav>

      <main className="public-ticket-main public-flow-main container py-3">
        <div className="text-center mb-3">
          <BsCheckCircle size={40} color="#16a34a" />
          <h1 className="fw-bold mt-2 mb-1 fs-3">Registration Successful</h1>
          <p className="text-muted mb-0">
            Your event ticket is ready to download.
          </p>
        </div>

        <div
          ref={ticketRef}
          className="public-compact-ticket bg-white mx-auto shadow-sm overflow-hidden"
          style={{
            maxWidth: "620px",
            borderRadius: "16px",
            border: "1px solid #dbe3ef",
          }}
        >
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2"
            style={{
              borderTop: "7px solid #08245c",
              borderBottom: "1px dashed #b7c0cc",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  padding: "5px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <img
                  src={portalLogo}
                  alt={portalName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              <div>
                <h3 className="fw-bold mb-0" style={{ color: "#08245c", fontSize: "17px" }}>
                  {portalName}
                </h3>
                <p className="text-muted mb-0" style={{ fontSize: "11px" }}>Event Management Platform</p>
              </div>
            </div>

            <div className="text-end">
              <h3 className="fw-bold mb-0" style={{ color: "#08245c", fontSize: "17px" }}>
                EVENT TICKET
              </h3>
              <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>Thank you for registering!</p>
            </div>
          </div>

          <div className="row g-0">
            <div className="col-md-8 px-3 py-2">
              <span className="badge bg-primary mb-1">
                {event?.eventType || "EVENT"}
              </span>

              <h1
                className="fw-bold mb-2"
                style={{
                  color: "#071b4d",
                  fontSize: "22px",
                  lineHeight: 1.2,
                }}
              >
                {event?.eventName}
              </h1>

              <p className="mb-1 small">
                <BsCalendarEvent className="me-2 text-primary" />
                {formatDate(event?.startDateTime)}
              </p>

              <p className="mb-0 small">
                <BsGeoAlt className="me-2 text-primary" />
                {event?.venue || "Online"}
              </p>

            </div>

            <div
              className="col-md-4 p-2 d-flex align-items-center justify-content-center"
              style={{
                borderLeft: "1px dashed #b7c0cc",
              }}
            >
              <div className="text-center">
                <div
                  className="bg-white p-1 mx-auto"
                  style={{
                    width: "116px",
                    height: "116px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <QRCodeCanvas
                    value={displayTicket?.qrCode || `REG-${registration.id}`}
                    size={106}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-between text-white px-3 py-2"
            style={{
              background: "linear-gradient(90deg,#071b4d,#08245c)",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <BsTicketPerforated size={24} />
              <div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>
                  REGISTRATION ID
                </div>
                <div className="fw-bold">REG-{registration.id}</div>
              </div>
            </div>

            <div
              style={{
                height: "38px",
                borderLeft: "1px dashed rgba(255,255,255,.5)",
              }}
            />

            <div className="d-flex align-items-center gap-3">
              <BsTicketPerforated size={24} />
              <div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>
                  TICKET NUMBER
                </div>
                <div className="fw-bold">
                  {displayTicket?.ticketNumber || `TICKET-${registration.id}`}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="row g-3">
              <div className="col-md-6">
                <TicketSection title="REGISTERED DETAILS" icon={<BsPerson />}>
              <InfoRow
                label="Participant Name"
                value={`${participant?.firstName || ""} ${
                  participant?.lastName || ""
                }`}
              />
              <InfoRow label="Email" value={participant?.email} />
              <InfoRow label="Phone Number" value={participant?.phoneNumber} />
              <InfoRow
                label="Registration Type"
                value={registration.registrationType}
              />
              <InfoRow
                label="Ticket Class"
                value={registration.ticketClass?.name}
              />
              <InfoRow
                label="Quantity"
                value={registration.ticketQuantity}
              />
              <InfoRow
                label="QR Mode"
                value={formatQrMode(registration.qrGenerationMode)}
              />
              <InfoRow
    label="Registered On"
    value={formatDate(registration.registrationDate)}
/>
                </TicketSection>
              </div>

              <div className="col-md-6">
                <TicketSection title="PAYMENT DETAILS" icon={<BsCreditCard />}>
  <InfoRow
    label="Payment Status"
    value={
      <span
        className={`badge ${
          registration.paymentStatus === "PAID"
            ? "bg-success"
            : registration.paymentStatus === "PENDING"
            ? "bg-warning text-dark"
            : "bg-secondary"
        }`}
      >
        {registration.paymentStatus}
      </span>
    }
  />

  <InfoRow
    label="Payment Method"
    value={registration.paymentMethod}
  />

  <InfoRow
    label="Transaction ID"
    value={registration.transactionReference}
  />

  <InfoRow
    label="Amount"
    value={amount > 0 ? `Rs. ${amount.toLocaleString("en-IN")}` : "Free"}
  />

  <InfoRow
    label="Paid On"
    value={formatDate(registration.paymentDate)}
  />
                </TicketSection>
              </div>
            </div>

            {tickets.length > 1 && (
              <TicketSection title="GENERATED TICKETS" icon={<BsTicketPerforated />}>
                <div className="row g-3">
                  {tickets.map((item, index) => (
                    <div className="col-md-6" key={item.id || item.ticketNumber}>
                      <div className="border rounded-3 p-3 h-100">
                        <div className="d-flex justify-content-between gap-2">
                          <div>
                            <div className="text-muted small">Ticket {index + 1}</div>
                            <div className="fw-semibold">{item.ticketNumber}</div>
                          </div>
                          <span className="badge bg-light text-dark">{item.status}</span>
                        </div>
                        <div className="mt-3 d-flex align-items-center gap-3">
                          <QRCodeCanvas
                            value={item.qrCode || item.ticketNumber}
                            size={76}
                            level="H"
                          />
                          <small className="text-muted">
                            Show this QR at entry for this ticket.
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TicketSection>
            )}

            <div
              className="d-flex justify-content-between align-items-center mt-3 pt-3"
              style={{
                borderTop: "1px dashed #b7c0cc",
              }}
            >
              <div className="d-flex gap-3 align-items-start">
                <BsInfoCircle className="text-primary mt-1" />
                <p className="mb-0 text-muted">
                  Please show this ticket digitally or printed at the event
                  entry.
                </p>
              </div>

              <h4
                className="mb-0"
                style={{
                  color: "#08245c",
                  fontFamily: "cursive",
                }}
              >
                Thank you!
              </h4>
            </div>
          </div>

          <div
            style={{
              height: "18px",
              background: "#08245c",
            }}
          />
        </div>

        <div className="text-center mt-4">
          <button className="btn btn-primary px-3 me-2" onClick={downloadTicket}>
            Download Ticket
          </button>

          <Link to="/find-events" className="btn btn-outline-primary px-3">
            View More Events
          </Link>
        </div>
      </main>
    </div>
  );
}

function TicketSection({ title, icon, children }) {
  return (
    <div
      className="ticket-compact-section p-3 h-100"
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
      }}
    >
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <h5 className="fw-bold mb-0 small" style={{ color: "#08245c" }}>
          {title}
        </h5>
      </div>

      <div>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      className="d-flex py-1 gap-2"
      style={{
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="text-muted small" style={{ width: "43%" }}>
        {label}
      </div>

      <div className="fw-semibold small text-break" style={{ width: "57%" }}>
        {value || "N/A"}
      </div>
    </div>
  );
}

function formatDate(dateTime) {
  if (!dateTime) return "N/A";

  return new Date(dateTime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatQrMode(qrMode) {
  if (qrMode === "PER_ORDER") return "One QR for full order";
  if (qrMode === "PER_PARTICIPANT") return "One QR per participant/team";
  return "One QR per ticket";
}

export default PublicTicket;
