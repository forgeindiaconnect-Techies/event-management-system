import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import {
  BsTicketPerforated,
  BsXLg,
  BsSend,
  BsCheckCircle,
  BsExclamationTriangle,
  BsFilm,
  BsCalendarEvent,
  BsLightbulb
} from "react-icons/bs";

const movieCategories = [
  { value: "PAYMENT_DEBITED_NO_TICKET", label: "💸 Money Deducted, but Ticket / Booking ID Not Received" },
  { value: "TICKET_NOT_RECEIVED", label: "📩 M-Ticket / SMS / WhatsApp QR Pass Not Delivered" },
  { value: "GATE_SCAN_FAILURE", label: "🚪 Gate Usher Scanner Rejected My QR Code" },
  { value: "CANCEL_REFUND_REQUEST", label: "🔄 Show Cancelled by Cinema / Refund Tracking" },
  { value: "SEAT_ISSUE", label: "💺 Seat Conflict (Another Patron Occupying Seat)" },
  { value: "FOOD_CONCESSIONS", label: "🍿 Pre-booked F&B Popcorn Voucher Not Redeemable" },
  { value: "GENERAL", label: "ℹ️ Other Movie Booking Inquiries" }
];

const eventCategories = [
  { value: "PAYMENT_DEBITED_NO_TICKET", label: "💸 Money Deducted, but Registration Pass Not Received" },
  { value: "TICKET_NOT_RECEIVED", label: "📩 Entry Badge / Ticket QR Email Not Arrived" },
  { value: "GATE_SCAN_FAILURE", label: "🎟️ Check-In Desk / Gate Scanner Could Not Read Badge" },
  { value: "CANCEL_REFUND_REQUEST", label: "🔄 Event Postponed or Cancelled / Refund Inquiry" },
  { value: "SEAT_ISSUE", label: "🪑 VIP / Seated Pass Allocation Conflict" },
  { value: "REGISTRATION_DETAILS_CHANGE", label: "✏️ Name / Attendee Details Correction on Badge" },
  { value: "GENERAL", label: "ℹ️ Other Event Booking & Access Inquiries" }
];

export default function PublicMovieSupportModal({
  isOpen,
  onClose,
  initialBookingRef = "",
  initialMovieTitle = "",
  initialTheaterName = "",
  defaultBookingType = "MOVIE"
}) {
  const [bookingType, setBookingType] = useState(defaultBookingType); // "MOVIE" | "EVENT"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectedNotice, setDetectedNotice] = useState("");
  const [successTicket, setSuccessTicket] = useState(null);

  const [form, setForm] = useState({
    bookingReference: initialBookingRef || "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    titleOrVenueName: [initialMovieTitle, initialTheaterName].filter(Boolean).join(" • ") || "",
    category: "PAYMENT_DEBITED_NO_TICKET",
    priority: "HIGH",
    subject: initialBookingRef ? `Support request for Booking #${initialBookingRef}` : "",
    description: ""
  });

  // Auto-detect booking type from reference code prefix
  const handleBookingRefChange = (val) => {
    const trimmed = val.trim().toUpperCase();
    let newForm = { ...form, bookingReference: val };
    
    if (/^(REG-|EVT-|CONF-|SUMMIT-|PASS-)/i.test(trimmed)) {
      if (bookingType !== "EVENT") {
        setBookingType("EVENT");
        setDetectedNotice("Detected Event Registration prefix. Switched to Event Support.");
        setTimeout(() => setDetectedNotice(""), 4000);
      }
    } else if (/^(M-TKT-|MOV-|TKT-|CINEMA-)/i.test(trimmed)) {
      if (bookingType !== "MOVIE") {
        setBookingType("MOVIE");
        setDetectedNotice("Detected Movie Ticket prefix. Switched to Cinema Support.");
        setTimeout(() => setDetectedNotice(""), 4000);
      }
    }
    setForm(newForm);
  };

  const categories = bookingType === "EVENT" ? eventCategories : movieCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerEmail.trim() || !form.description.trim()) {
      setError("Please provide your email address and description of the issue.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessTicket(null);
    try {
      const typeLabel = bookingType === "EVENT" ? "Event" : "Movie";
      const payload = {
        bookingType: bookingType,
        bookingReference: form.bookingReference.trim(),
        customerName: form.customerName.trim() || `${typeLabel} Attendee`,
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        titleOrVenueName: form.titleOrVenueName.trim(),
        category: form.category,
        priority: form.priority,
        subject: form.subject.trim() || `${typeLabel} Ticket Assistance (${form.category.replace(/_/g, " ")})`,
        description: form.description.trim()
      };
      const res = await api.post("/public/support", payload);
      setSuccessTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(660px, 95vw)",
          maxHeight: "90vh",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#fff"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: bookingType === "EVENT" ? "#6366f1" : "#e11d48",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
                color: "#fff",
                transition: "background 0.2s ease"
              }}
            >
              {bookingType === "EVENT" ? <BsCalendarEvent /> : <BsFilm />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#fff" }}>
                Public Ticket & Booking Support
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                Instant resolution desk for payment debits, missing tickets & gate entry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "18px",
              cursor: "pointer",
              padding: "6px"
            }}
          >
            <BsXLg />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Booking Type Pill Switcher */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
              Select Ticket Type:
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "10px"
              }}
            >
              <button
                type="button"
                onClick={() => setBookingType("MOVIE")}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  transition: "all 0.18s ease",
                  backgroundColor: bookingType === "MOVIE" ? "#fff" : "transparent",
                  color: bookingType === "MOVIE" ? "#e11d48" : "#64748b",
                  boxShadow: bookingType === "MOVIE" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
                }}
              >
                <BsFilm /> Cinema / Movie Ticket
              </button>
              <button
                type="button"
                onClick={() => setBookingType("EVENT")}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  transition: "all 0.18s ease",
                  backgroundColor: bookingType === "EVENT" ? "#fff" : "transparent",
                  color: bookingType === "EVENT" ? "#6366f1" : "#64748b",
                  boxShadow: bookingType === "EVENT" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
                }}
              >
                <BsCalendarEvent /> Event / Concert / Summit Pass
              </button>
            </div>
            {detectedNotice && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.78rem",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 8px",
                  background: "#eff6ff",
                  borderRadius: "6px"
                }}
              >
                <BsLightbulb /> {detectedNotice}
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "16px",
                borderRadius: "8px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <BsExclamationTriangle /> {error}
            </div>
          )}

          {successTicket ? (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#dcfce7",
                  color: "#16a34a",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "30px",
                  margin: "0 auto 16px auto"
                }}
              >
                <BsCheckCircle />
              </div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Support Ticket Registered</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 20px 0" }}>
                Our {bookingType === "EVENT" ? "Event Operations & Attendee Helpdesk" : "Cinema Operations Team"} has received your request and is reviewing it.
              </p>

              <div
                style={{
                  display: "inline-block",
                  padding: "14px 24px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  marginBottom: "24px",
                  textAlign: "left"
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Reference Tracking Code:</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: bookingType === "EVENT" ? "#6366f1" : "#e11d48", fontFamily: "monospace" }}>
                  {successTicket.referenceCode || `PUB-${successTicket.id}`}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "4px" }}>
                  Category: <strong>{bookingType} Ticket Support</strong> • Status: <strong style={{ color: "#16a34a" }}>{successTicket.status}</strong>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  What problem did you encounter? *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    backgroundColor: "#fff"
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {bookingType === "EVENT" ? "Registration ID / Payment Ref" : "Booking ID / Bank UTR"}
                  </label>
                  <input
                    type="text"
                    placeholder={bookingType === "EVENT" ? "e.g. REG-10492 or Bank UTR" : "e.g. M-TKT-10492 or Bank UTR"}
                    value={form.bookingReference}
                    onChange={(e) => handleBookingRefChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {bookingType === "EVENT" ? "Event / Summit Name" : "Movie & Cinema Name"}
                  </label>
                  <input
                    type="text"
                    placeholder={bookingType === "EVENT" ? "e.g. Tech Leaders Summit 2026" : "e.g. Inception • PVR Forum"}
                    value={form.titleOrVenueName}
                    onChange={(e) => setForm({ ...form, titleOrVenueName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Email Address (For ticket delivery) *
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem"
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Mobile Number (For SMS / WhatsApp confirmation)
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Description of the issue *
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    bookingType === "EVENT"
                      ? "Tell us what happened (e.g., payment debited via UPI, but registration badge QR not received in inbox)..."
                      : "Tell us what happened (e.g., amount debited from Google Pay at 06:45 PM, but screen showed booking failed)..."
                  }
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    resize: "vertical"
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#fff",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: bookingType === "EVENT" ? "#6366f1" : "#e11d48",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <BsSend /> {loading ? "Sending..." : "Submit Ticket Assistance"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

