import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsClockHistory,
  BsDownload,
  BsEnvelope,
  BsPeople,
  BsSearch,
  BsTelephone,
  BsTrash,
  BsXCircle
} from "react-icons/bs";
import api from "../../api/axiosConfig";

function Waitlist() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWaitlist = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const [eventRes, waitlistRes] = await Promise.allSettled([
        api.get(`/events/${id}`),
        api.get(`/registrations/event/${id}/waitlist`)
      ]);

      if (eventRes.status === "fulfilled") {
        setEvent(eventRes.value.data);
      }

      if (waitlistRes.status === "fulfilled") {
        setWaitlist(waitlistRes.value.data || []);
      } else {
        setWaitlist([]);
        setMessage("Unable to load waitlist.");
      }
    } catch {
      setMessage("Unable to load waitlist.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWaitlist();
  }, [loadWaitlist]);

  const waitlistRows = useMemo(() => {
    return waitlist.map((registration, index) => {
      const participant = registration.participant || {};
      const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();

      return {
        id: registration.id,
        position: index + 1,
        registrationId: `REG-${registration.id}`,
        name: fullName || "Unnamed attendee",
        email: participant.email || "N/A",
        phone: participant.phoneNumber || "N/A",
        type: registration.registrationType || "PARTICIPANT",
        paymentStatus: registration.paymentStatus || "FREE",
        registeredAt: registration.registrationDate
      };
    });
  }, [waitlist]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    return waitlistRows.filter((row) => {
      const matchesSearch =
        row.registrationId.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query);
      const matchesType = typeFilter === "All" || row.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [waitlistRows, search, typeFilter]);

  const participantCount = waitlistRows.filter((row) => row.type === "PARTICIPANT").length;
  const audienceCount = waitlistRows.filter((row) => row.type === "AUDIENCE").length;
  const availableSeats = Number(event?.availableSeats || 0);

  const removeFromWaitlist = async (registrationId) => {
    try {
      setMessage("");
      await api.put(`/registrations/${registrationId}/cancel`);
      setWaitlist((current) => current.filter((registration) => registration.id !== registrationId));
      setMessage("Waitlisted registration cancelled.");
    } catch {
      setMessage("Unable to cancel waitlisted registration.");
    }
  };

  const exportWaitlist = () => {
    const headers = [
      "Position",
      "Registration ID",
      "Name",
      "Email",
      "Phone",
      "Type",
      "Payment",
      "Joined At"
    ];
    const rows = filteredRows.map((row) => [
      row.position,
      row.registrationId,
      row.name,
      row.email,
      row.phone,
      row.type,
      row.paymentStatus,
      formatDate(row.registeredAt)
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${event?.eventName || "event"}-waitlist.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Waitlist
          </h3>
          <p className="text-muted mb-0">
            Manage queued attendees for {event?.eventName || "this event"}.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-light border d-inline-flex align-items-center gap-2"
            onClick={exportWaitlist}
            disabled={filteredRows.length === 0}
          >
            <BsDownload /> Export
          </button>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={loadWaitlist}
            disabled={loading}
          >
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsPeople />} label="Waitlisted" value={waitlistRows.length} />
        <SummaryCard icon={<BsClockHistory />} label="Participants" value={participantCount} />
        <SummaryCard icon={<BsPeople />} label="Audience" value={audienceCount} />
        <SummaryCard icon={<BsXCircle />} label="Available Seats" value={availableSeats} />
      </div>

      <div className="alert alert-light border d-flex flex-wrap justify-content-between gap-2">
        <span>
          When a confirmed registration is cancelled, your backend automatically promotes the first waitlisted attendee.
        </span>
        <strong>Queue order: oldest first</strong>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row g-3 align-items-end">
            <div className="col-lg-7">
              <label className="form-label fw-semibold">Search Waitlist</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <BsSearch />
                </span>
                <input
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email, phone or registration ID"
                />
              </div>
            </div>

            <div className="col-lg-5">
              <label className="form-label fw-semibold">Registration Type</label>
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option>All</option>
                <option>PARTICIPANT</option>
                <option>AUDIENCE</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading waitlist...</div>
        ) : filteredRows.length === 0 ? (
          <div className="card-body text-center py-5">
            <BsClockHistory className="text-secondary opacity-50 mb-3" size={52} />
            <h4 className="fw-semibold" style={{ fontSize: "18px" }}>
              No waitlisted attendees
            </h4>
            <p className="text-muted mb-0">
              Waitlisted attendees will appear here when event seats are full.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Registration</th>
                  <th>Attendee</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Joined</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="waitlist-position">#{row.position}</span>
                    </td>
                    <td className="fw-semibold">{row.registrationId}</td>
                    <td className="fw-semibold">{row.name}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2 small">
                        <BsEnvelope className="text-primary" /> {row.email}
                      </div>
                      <div className="d-flex align-items-center gap-2 small text-muted">
                        <BsTelephone /> {row.phone}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">{row.type}</span>
                    </td>
                    <td>
                      <span className={`badge ${paymentBadge(row.paymentStatus)}`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td>{formatDate(row.registeredAt)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border d-inline-flex align-items-center gap-2"
                        onClick={() => removeFromWaitlist(row.id)}
                      >
                        <BsTrash /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{waitlistStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="waitlist-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function paymentBadge(status) {
  if (status === "PAID" || status === "FREE") return "bg-success-subtle text-success";
  if (status === "FAILED") return "bg-danger-subtle text-danger";
  return "bg-warning-subtle text-warning";
}

function formatDate(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const waitlistStyles = `
  .waitlist-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .waitlist-position {
    background: #f1f5f9;
    border-radius: 999px;
    color: #334155;
    display: inline-block;
    font-weight: 700;
    padding: 4px 10px;
  }
`;

export default Waitlist;
