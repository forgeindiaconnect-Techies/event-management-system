import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsCheckCircle,
  BsClockHistory,
  BsEnvelope,
  BsPersonCheck,
  BsSearch,
  BsTelephone,
  BsXCircle
} from "react-icons/bs";
import api from "../../api/axiosConfig";

function Approval() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("Needs Review");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadApprovals = useCallback(async () => {
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
        setMessage("Unable to load approval data.");
      }
    } catch {
      setMessage("Unable to load approval data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const approvalRows = useMemo(() => {
    return registrations.map((registration) => {
      const participant = registration.participant || {};
      const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();
      const paymentStatus = registration.paymentStatus || "FREE";
      const status = registration.status || "REGISTERED";

      return {
        id: registration.id,
        registrationId: `REG-${registration.id}`,
        name: fullName || "Unnamed attendee",
        email: participant.email || "N/A",
        phone: participant.phoneNumber || "N/A",
        type: registration.registrationType || "PARTICIPANT",
        status,
        paymentStatus,
        paymentMethod: registration.paymentMethod || "",
        needsReview: status === "WAITLISTED" || paymentStatus === "PENDING" || paymentStatus === "FAILED",
        registeredAt: registration.registrationDate
      };
    });
  }, [registrations]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    return approvalRows.filter((row) => {
      const matchesSearch =
        row.registrationId.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query);
      const matchesReview =
        reviewFilter === "All" ||
        (reviewFilter === "Needs Review" && row.needsReview) ||
        (reviewFilter === "Approved" && row.status === "REGISTERED" && row.paymentStatus !== "PENDING") ||
        (reviewFilter === "Waitlisted" && row.status === "WAITLISTED") ||
        (reviewFilter === "Cancelled" && row.status === "CANCELLED");

      return matchesSearch && matchesReview;
    });
  }, [approvalRows, search, reviewFilter]);

  const needsReviewCount = approvalRows.filter((row) => row.needsReview).length;
  const approvedCount = approvalRows.filter(
    (row) => row.status === "REGISTERED" && row.paymentStatus !== "PENDING"
  ).length;
  const waitlistedCount = approvalRows.filter((row) => row.status === "WAITLISTED").length;
  const cancelledCount = approvalRows.filter((row) => row.status === "CANCELLED").length;

  const markPaid = async (registrationId) => {
    try {
      setMessage("");
      const res = await api.put(`/registrations/${registrationId}/mark-paid`, {
        paymentMethod: "Organizer Approved"
      });

      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === registrationId ? res.data : registration
        )
      );
      setMessage("Registration payment marked as paid.");
    } catch {
      setMessage("Unable to approve payment.");
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

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Approval
          </h3>
          <p className="text-muted mb-0">
            Review payment and registration status for {event?.eventName || "this event"}.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={loadApprovals}
          disabled={loading}
        >
          <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsClockHistory />} label="Needs Review" value={needsReviewCount} />
        <SummaryCard icon={<BsCheckCircle />} label="Approved" value={approvedCount} />
        <SummaryCard icon={<BsPersonCheck />} label="Waitlisted" value={waitlistedCount} />
        <SummaryCard icon={<BsXCircle />} label="Cancelled" value={cancelledCount} />
      </div>

      <div className="alert alert-light border">
        Current backend statuses are REGISTERED, WAITLISTED and CANCELLED. This page reviews those records and can mark pending payments as paid.
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row g-3 align-items-end">
            <div className="col-lg-7">
              <label className="form-label fw-semibold">Search Registrations</label>
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
              <label className="form-label fw-semibold">Review Status</label>
              <select
                className="form-select"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
              >
                <option>Needs Review</option>
                <option>Approved</option>
                <option>Waitlisted</option>
                <option>Cancelled</option>
                <option>All</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading approval data...</div>
        ) : filteredRows.length === 0 ? (
          <div className="card-body text-center py-5">
            <BsCheckCircle className="text-secondary opacity-50 mb-3" size={52} />
            <h4 className="fw-semibold" style={{ fontSize: "18px" }}>
              No registrations found
            </h4>
            <p className="text-muted mb-0">Approval records will appear after attendees register.</p>
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
                  <th>Registration</th>
                  <th>Payment</th>
                  <th>Registered</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
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
                      <span className={`badge ${registrationBadge(row.status)}`}>{row.status}</span>
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
                        className="btn btn-sm btn-light border me-2"
                        onClick={() => markPaid(row.id)}
                        disabled={row.paymentStatus === "PAID" || row.paymentStatus === "FREE" || row.status === "CANCELLED"}
                      >
                        Mark Paid
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

      <style>{approvalStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="approval-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function registrationBadge(status) {
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

const approvalStyles = `
  .approval-summary-icon {
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

export default Approval;
