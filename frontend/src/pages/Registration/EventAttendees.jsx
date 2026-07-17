import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsCheckCircle,
  BsDownload,
  BsEnvelope,
  BsPersonCheck,
  BsPeople,
  BsSearch,
  BsTelephone,
  BsXCircle
} from "react-icons/bs";
import api from "../../api/axiosConfig";

function EventAttendees() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAttendees = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const [eventRes, registrationsRes] = await Promise.allSettled([
        api.get(`/events/${id}`),
        api.get(`/registrations/event/${id}`)
      ]);

      if (eventRes.status === "fulfilled") {
        setEvent(eventRes.value.data);
      }

      if (registrationsRes.status === "fulfilled") {
        setRegistrations(registrationsRes.value.data || []);
      } else {
        setRegistrations([]);
        setMessage("Unable to load attendees.");
      }
    } catch {
      setMessage("Unable to load attendees.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const attendeeRows = useMemo(() => {
    return registrations.map((registration) => {
      const participant = registration.participant || {};
      const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();

      return {
        id: registration.id,
        registrationId: `REG-${registration.id}`,
        name: fullName || "Unnamed attendee",
        email: participant.email || "N/A",
        phone: participant.phoneNumber || "N/A",
        type: registration.registrationType || "PARTICIPANT",
        status: registration.status || "REGISTERED",
        paymentStatus: registration.paymentStatus || "FREE",
        paymentMethod: registration.paymentMethod || "N/A",
        attended: Boolean(registration.attended),
        registeredAt: registration.registrationDate
      };
    });
  }, [registrations]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    return attendeeRows.filter((row) => {
      const matchesSearch =
        row.registrationId.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query);
      const matchesType = typeFilter === "All" || row.type === typeFilter;
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [attendeeRows, search, typeFilter, statusFilter]);

  const registeredCount = attendeeRows.filter((row) => row.status === "REGISTERED").length;
  const checkedInCount = attendeeRows.filter((row) => row.attended).length;
  const cancelledCount = attendeeRows.filter((row) => row.status === "CANCELLED").length;
  const waitlistedCount = attendeeRows.filter((row) => row.status === "WAITLISTED").length;

  const markAttendance = async (registrationId) => {
    try {
      setMessage("");
      await api.put(`/registrations/${registrationId}/attendance`);
      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === registrationId
            ? { ...registration, attended: true }
            : registration
        )
      );
      setMessage("Attendance marked.");
    } catch {
      setMessage("Unable to mark attendance.");
    }
  };

  const cancelRegistration = async (registrationId) => {
    try {
      setMessage("");
      await api.put(`/registrations/${registrationId}/cancel`);
      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === registrationId
            ? { ...registration, status: "CANCELLED" }
            : registration
        )
      );
      setMessage("Registration cancelled.");
    } catch {
      setMessage("Unable to cancel registration.");
    }
  };

  const exportAttendees = () => {
    const headers = [
      "Registration ID",
      "Name",
      "Email",
      "Phone",
      "Type",
      "Status",
      "Payment",
      "Attendance",
      "Registered At"
    ];
    const rows = filteredRows.map((row) => [
      row.registrationId,
      row.name,
      row.email,
      row.phone,
      row.type,
      row.status,
      row.paymentStatus,
      row.attended ? "Present" : "Absent",
      formatDate(row.registeredAt)
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${event?.eventName || "event"}-attendees.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Attendees
          </h3>
          <p className="text-muted mb-0">
            View, search and manage registrations for {event?.eventName || "this event"}.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-light border d-inline-flex align-items-center gap-2"
            onClick={exportAttendees}
            disabled={filteredRows.length === 0}
          >
            <BsDownload /> Export
          </button>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={loadAttendees}
            disabled={loading}
          >
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsPeople />} label="Total Attendees" value={attendeeRows.length} />
        <SummaryCard icon={<BsCheckCircle />} label="Registered" value={registeredCount} />
        <SummaryCard icon={<BsPersonCheck />} label="Checked In" value={checkedInCount} />
        <SummaryCard icon={<BsXCircle />} label="Cancelled / Waitlist" value={cancelledCount + waitlistedCount} />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label fw-semibold">Search Attendees</label>
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

            <div className="col-md-3">
              <label className="form-label fw-semibold">Type</label>
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

            <div className="col-md-4">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>REGISTERED</option>
                <option>WAITLISTED</option>
                <option>CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading attendees...</div>
        ) : filteredRows.length === 0 ? (
          <div className="card-body text-center py-5">
            <BsPeople className="text-secondary opacity-50 mb-3" size={52} />
            <h4 className="fw-semibold" style={{ fontSize: "18px" }}>
              No attendees found
            </h4>
            <p className="text-muted mb-0">Attendees will appear here after public registrations.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Attendee</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Attendance</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold">{row.registrationId}</td>
                    <td>
                      <div className="fw-semibold">{row.name}</div>
                      <div className="text-muted small">{formatDate(row.registeredAt)}</div>
                    </td>
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
                      <span className={`badge ${statusBadge(row.status)}`}>{row.status}</span>
                    </td>
                    <td>
                      {row.paymentStatus === "NOT_STARTED" ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span className={`badge ${paymentBadge(row.paymentStatus)}`}>
                          {row.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td>{row.attended ? "Present" : "Absent"}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border me-2"
                        onClick={() => markAttendance(row.id)}
                        disabled={row.attended || row.status === "CANCELLED"}
                      >
                        Check In
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border"
                        onClick={() => cancelRegistration(row.id)}
                        disabled={row.status === "CANCELLED"}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{attendeeStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="attendee-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status) {
  if (status === "REGISTERED") return "bg-success-subtle text-success";
  if (status === "WAITLISTED") return "bg-warning-subtle text-warning";
  if (status === "CANCELLED") return "bg-danger-subtle text-danger";
  return "bg-secondary-subtle text-secondary";
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

const attendeeStyles = `
  .attendee-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }
`;

export default EventAttendees;
