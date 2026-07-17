import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { FaCheckCircle, FaExternalLinkAlt, FaInstagram } from "react-icons/fa";
import {
  FaBullhorn,
  FaCopy,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter
} from "react-icons/fa6";
import api from "../../api/axiosConfig";

function Promote() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await api.get(`/events/${id}`);
        setEvent(response.data);
        setCaption(buildDefaultCaption(response.data, getPublicUrl(id)));
      } catch (error) {
        setMessage("Unable to load event promotion details.");
      }
    }

    loadEvent();
  }, [id]);

  const publicUrl = useMemo(() => getPublicUrl(id), [id]);

  if (!event) return <div className="p-4">Loading...</div>;

  const isPublished = event.status === "PUBLISHED";
  const checklist = [
    { label: "Event details completed", done: Boolean(event.eventName && event.description) },
    { label: "Date and time added", done: Boolean(event.startDateTime && event.endDateTime) },
    { label: "Venue or meeting link added", done: Boolean(event.venue || event.meetingLink) },
    { label: "Capacity configured", done: Boolean(event.capacity) },
    { label: "Event is published", done: isPublished }
  ];

  const shareText = encodeURIComponent(caption);
  const shareUrl = encodeURIComponent(publicUrl);

  const shareLinks = [
    {
      label: "WhatsApp",
      icon: <FaWhatsapp />,
      url: `https://wa.me/?text=${shareText}%20${shareUrl}`,
      className: "btn-success"
    },
    {
      label: "LinkedIn",
      icon: <FaLinkedinIn />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      className: "btn-primary"
    },
    {
      label: "Twitter / X",
      icon: <FaXTwitter />,
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      className: "btn-dark"
    },
    {
      label: "Facebook",
      icon: <FaFacebookF />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      className: "btn-primary"
    },
    {
      label: "Email",
      icon: <FaEnvelope />,
      url: `mailto:?subject=${encodeURIComponent(event.eventName)}&body=${shareText}%0A%0A${shareUrl}`,
      className: "btn-secondary"
    }
  ];

  const copyText = async (text, successMessage) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopyText(text);
      }
      setMessage(successMessage);
    } catch (error) {
      setMessage("Unable to copy. Please copy manually.");
    }
  };

  const shareToInstagram = async () => {
    await copyText(`${caption}\n\n${publicUrl}`, "Caption and link copied for Instagram.");
    window.open("https://www.instagram.com/", "_blank", "noreferrer");
  };

  const publishEvent = async () => {
    try {
      const response = await api.put(`/events/${id}/publish`);
      setEvent(response.data);
      setMessage("Event published successfully.");
    } catch (error) {
      setMessage("Unable to publish event.");
    }
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Promote Your Event</h1>
          <p className="text-muted mb-0">
            Share your public event link, prepare promotional text and track readiness.
          </p>
        </div>

        <span className={`badge px-3 py-2 ${isPublished ? "bg-success" : "bg-warning text-dark"}`}>
          {event.status}
        </span>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex align-items-start gap-3">
                <div className="promote-icon">
                  <FaGlobe />
                </div>
                <div className="flex-grow-1">
                  <h2 className="h5 fw-semibold mb-1">Public Event Link</h2>
                  <p className="text-muted small mb-3">
                    Use this link in social media posts, emails and messages.
                  </p>

                  <div className="input-group">
                    <input className="form-control" value={publicUrl} readOnly />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => copyText(publicUrl, "Public event link copied.")}
                    >
                      <FaCopy />
                    </button>
                    <a
                      className="btn btn-primary"
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaExternalLinkAlt />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-1">Promotional Caption</h2>
              <p className="text-muted small mb-0">
                Edit the text and share it with your event link.
              </p>
            </div>
            <div className="card-body">
              <textarea
                className="form-control"
                rows={7}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                  onClick={() => copyText(caption, "Promotional caption copied.")}
                >
                  <FaCopy /> Copy Caption
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                  onClick={() => setCaption(buildDefaultCaption(event, publicUrl))}
                >
                  <FaBullhorn /> Reset Caption
                </button>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-1">Share Event</h2>
              <p className="text-muted small mb-0">
                Open the selected channel with your event information.
              </p>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {shareLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn ${link.className} d-inline-flex align-items-center gap-2`}
                  >
                    {link.icon} {link.label}
                  </a>
                ))}
                <button
                  type="button"
                  className="btn btn-danger d-inline-flex align-items-center gap-2"
                  onClick={shareToInstagram}
                >
                  <FaInstagram /> Instagram
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body text-center">
              <div className="promote-qr mx-auto mb-3">
                <QRCodeCanvas value={publicUrl} size={138} level="M" includeMargin />
              </div>
              <h2 className="h5 fw-semibold">QR Share</h2>
              <p className="text-muted small">
                Use the public link to generate or print a QR code for posters and venue desks.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary w-100 d-inline-flex justify-content-center align-items-center gap-2"
                onClick={() => copyText(publicUrl, "QR link copied.")}
              >
                <FaCopy /> Copy QR Link
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-0">Publishing Status</h2>
            </div>
            <div className="card-body">
              {isPublished ? (
                <div className="alert alert-success mb-3">
                  Event is live and ready to promote.
                </div>
              ) : (
                <div className="alert alert-warning mb-3">
                  Publish the event before sharing widely.
                </div>
              )}

              {!isPublished && (
                <button type="button" className="btn btn-primary w-100" onClick={publishEvent}>
                  Publish Event
                </button>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h2 className="h5 fw-semibold mb-0">Promotion Checklist</h2>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                {checklist.map((item) => (
                  <div className="d-flex align-items-center gap-2" key={item.label}>
                    <FaCheckCircle className={item.done ? "text-success" : "text-secondary opacity-50"} />
                    <span className={item.done ? "text-dark" : "text-muted"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{promoteStyles}</style>
    </div>
  );
}

function getPublicUrl(id) {
  return `${window.location.origin}/public/events/${id}`;
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function buildDefaultCaption(event, publicUrl) {
  const date = event.startDateTime
    ? new Date(event.startDateTime).toLocaleString()
    : "Date will be announced";

  return `Join us for ${event.eventName || "our upcoming event"}.\n\n${event.description || ""}\n\nDate: ${date}\nVenue: ${event.venue || event.meetingLink || "Venue will be announced"}\n\nRegister here: ${publicUrl}\n\n#${(event.eventType || "Event").replaceAll(" ", "")}`;
}

const promoteStyles = `
  .promote-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    flex: 0 0 44px;
    font-size: 20px;
    height: 44px;
    justify-content: center;
    width: 44px;
  }

  .promote-qr {
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    height: 170px;
    justify-content: center;
    width: 170px;
  }
`;

export default Promote;
