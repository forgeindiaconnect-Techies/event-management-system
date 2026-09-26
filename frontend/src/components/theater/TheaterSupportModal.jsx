import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import {
  BsHeadset,
  BsXLg,
  BsSend,
  BsClockHistory,
  BsCheckCircle,
  BsExclamationTriangle,
  BsChatLeftText,
  BsArrowClockwise,
  BsBuilding,
  BsShieldCheck
} from "react-icons/bs";

const categories = [
  { value: "EMERGENCY_SHOW_STOPPER", label: "🚨 Emergency: Live Show Halt / Screen Snag" },
  { value: "GATE_SCANNER_HARDWARE", label: "🎟️ Gate Scanner / Usher Terminal Sync Error" },
  { value: "BOX_OFFICE_POS", label: "📠 Box Office POS / Thermal Printer Jam" },
  { value: "PAYOUT_FINANCIAL", label: "💳 Payout / Bank Settlement & Fee Dispute" },
  { value: "SEAT_LAYOUT", label: "💺 Seat Layout / Broken Recliner Seat Lock" },
  { value: "FOOD_CONCESSIONS", label: "🍿 F&B Concessions Voucher Redemption Failure" },
  { value: "GENERAL", label: "ℹ️ General Inquiry / Portal Staff Access" }
];

export default function TheaterSupportModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("new"); // "new" | "history"
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Context auto-detection
  const portalId = localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "";
  const theaterName = localStorage.getItem("theaterName") || localStorage.getItem("portalName") || "Cinema Partner";
  const city = localStorage.getItem("city") || localStorage.getItem("theaterCity") || "";
  const dutyRole = localStorage.getItem("dutyRole") || localStorage.getItem("role") || "THEATER_STAFF";
  const userEmail = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const requesterName = (firstName + " " + lastName).trim() || dutyRole;

  const [form, setForm] = useState({
    category: "GENERAL",
    priority: "MEDIUM",
    subject: "",
    description: "",
    contactPhone: localStorage.getItem("mobileNumber") || "",
    contactEmail: userEmail || "",
    screenshotUrl: ""
  });

  const loadHistory = async () => {
    if (!portalId) return;
    setFetchingHistory(true);
    try {
      const res = await api.get(`/theaters/support/mine?theaterPortalId=${portalId}`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load theater tickets:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccessMsg("");
      loadHistory();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError("Please provide a subject and description of your issue.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload = {
        theaterPortalId: portalId ? Number(portalId) : null,
        theaterName,
        city,
        requesterName,
        dutyRole,
        contactEmail: form.contactEmail.trim() || userEmail || "partner@theater.com",
        contactPhone: form.contactPhone.trim(),
        category: form.category,
        priority: form.priority,
        subject: form.subject.trim(),
        description: form.description.trim(),
        screenshotUrl: form.screenshotUrl.trim()
      };
      const res = await api.post("/theaters/support", payload);
      setSuccessMsg(`Ticket created successfully! Reference Code: ${res.data.referenceCode || `THTR-${res.data.id}`}`);
      setForm({
        category: "GENERAL",
        priority: "MEDIUM",
        subject: "",
        description: "",
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        screenshotUrl: ""
      });
      loadHistory();
      setTab("history");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit support ticket. Please try again.");
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
        backgroundColor: "rgba(15, 23, 42, 0.6)",
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
          width: "min(720px, 95vw)",
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
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "#fff"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                display: "grid",
                placeItems: "center",
                fontSize: "20px"
              }}
            >
              <BsHeadset />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                Theater Operations Support
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "#c7d2fe" }}>
                Direct desk for Cinema Owners, Managers, Cashiers & Ushers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#cbd5e1",
              fontSize: "18px",
              cursor: "pointer",
              padding: "6px"
            }}
          >
            <BsXLg />
          </button>
        </div>

        {/* Sub-header Context Bar */}
        <div
          style={{
            padding: "10px 24px",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.82rem",
            color: "#475569"
          }}
        >
          <div>
            <BsBuilding style={{ marginRight: "6px", color: "#6366f1" }} />
            <strong>{theaterName}</strong> {city && `(${city})`}
          </div>
          <div>
            <BsShieldCheck style={{ marginRight: "6px", color: "#10b981" }} />
            Logged in as: <strong>{dutyRole.replace("_", " ")}</strong> ({requesterName})
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 24px",
            backgroundColor: "#fff"
          }}
        >
          <button
            type="button"
            onClick={() => setTab("new")}
            style={{
              padding: "12px 18px",
              border: "none",
              borderBottom: tab === "new" ? "3px solid #4f46e5" : "3px solid transparent",
              backgroundColor: "transparent",
              color: tab === "new" ? "#4f46e5" : "#64748b",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            New Support Request
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            style={{
              padding: "12px 18px",
              border: "none",
              borderBottom: tab === "history" ? "3px solid #4f46e5" : "3px solid transparent",
              backgroundColor: "transparent",
              color: tab === "history" ? "#4f46e5" : "#64748b",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            My Theater Tickets {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
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

          {successMsg && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "16px",
                borderRadius: "8px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <BsCheckCircle /> {successMsg}
            </div>
          )}

          {tab === "new" && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Issue Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      backgroundColor: "#fff"
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Priority *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="LOW">Low (General inquiry)</option>
                    <option value="MEDIUM">Medium (Normal daily issue)</option>
                    <option value="HIGH">High (Impacting shift operations)</option>
                    <option value="URGENT">🚨 Urgent (Live Show / Gate Crisis)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Screen 1 audio sync stutter or Gate 2 scanner app offline"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the exact error message, auditorium/screen number, affected showtime, or hardware model..."
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Contact Phone (For urgent call)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
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
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
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
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <BsSend /> {loading ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          )}

          {tab === "history" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Tickets submitted by {theaterName}
                </span>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={fetchingHistory}
                  style={{
                    background: "transparent",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "0.8rem",
                    color: "#4f46e5",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <BsArrowClockwise /> Refresh
                </button>
              </div>

              {fetchingHistory ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <BsClockHistory style={{ fontSize: "28px", marginBottom: "8px", color: "#94a3b8" }} />
                  <p>Loading your tickets...</p>
                </div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                  <BsChatLeftText style={{ fontSize: "32px", marginBottom: "10px", color: "#cbd5e1" }} />
                  <strong style={{ display: "block", color: "#334155" }}>No Support Tickets Yet</strong>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem" }}>
                    Any operational, hardware, or payout tickets filed by your theater team will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {history.map((ticket) => (
                    <div
                      key={ticket.id}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#fff"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              color: "#4f46e5",
                              backgroundColor: "#e0e7ff",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              marginRight: "8px"
                            }}
                          >
                            {ticket.referenceCode || `THTR-${ticket.id}`}
                          </span>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{ticket.subject}</strong>
                        </div>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor:
                              ticket.status === "RESOLVED" ? "#dcfce7" :
                              ticket.status === "IN_PROGRESS" ? "#fef3c7" : "#fee2e2",
                            color:
                              ticket.status === "RESOLVED" ? "#15803d" :
                              ticket.status === "IN_PROGRESS" ? "#b45309" : "#b91c1c"
                          }}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#475569" }}>
                        {ticket.description}
                      </p>
                      <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "#94a3b8" }}>
                        <span>Role: <strong>{ticket.dutyRole}</strong></span>
                        <span>Priority: <strong>{ticket.priority}</strong></span>
                        <span>Date: <strong>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN") : "Recent"}</strong></span>
                      </div>

                      {ticket.adminResponse && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: "#f1f5f9",
                            borderLeft: "4px solid #4f46e5"
                          }}
                        >
                          <strong style={{ fontSize: "0.82rem", color: "#312e81", display: "block", marginBottom: "4px" }}>
                            Super Admin Resolution:
                          </strong>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155" }}>
                            {ticket.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
