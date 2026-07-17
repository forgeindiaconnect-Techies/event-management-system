import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsBank,
  BsCashCoin,
  BsCheckCircle,
  BsClockHistory,
  BsCreditCard,
  BsDownload,
  BsExclamationCircle,
  BsSearch
} from "react-icons/bs";
import api from "../../api/axiosConfig";

function Payments() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const activeRole = String(
    localStorage.getItem("activeRole") || localStorage.getItem("role") || ""
  ).toUpperCase();
  const canManagePayments = ["PORTAL_ADMIN", "ORGANIZER"].includes(activeRole);

  const loadPayments = useCallback(async () => {
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
        setMessage("Unable to load registration payment data.");
      }
    } catch {
      setMessage("Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const paymentRows = useMemo(() => {
    const eventPrice = Number(event?.ticketPrice || 0);

    return registrations.map((registration) => {
      const participant = registration.participant || {};
      const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();
      const status = registration.paymentStatus || (eventPrice > 0 ? "PENDING" : "FREE");

      return {
        id: registration.id,
        registrationId: `REG-${registration.id}`,
        name: fullName || "Unnamed attendee",
        email: participant.email || "N/A",
        phone: participant.phoneNumber || "N/A",
        type: registration.registrationType || "Normal",
        method: registration.paymentMethod || (status === "FREE" ? "Free Event" : "Not selected"),
        status,
        amount: Number(
          registration.totalAmount ?? registration.amount ?? registration.ticketPrice ?? eventPrice ?? 0
        ),
        registeredAt: registration.registeredAt || registration.createdAt || registration.registrationDate
      };
    });
  }, [event, registrations]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    return paymentRows.filter((row) => {
      const matchesSearch =
        row.registrationId.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || normalizeStatus(row.status) === statusFilter;
      const matchesMethod = methodFilter === "All" || row.method.includes(methodFilter);

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [paymentRows, search, statusFilter, methodFilter]);

  const paidRows = paymentRows.filter((row) => normalizeStatus(row.status) === "PAID");
  const pendingRows = paymentRows.filter((row) => normalizeStatus(row.status) === "PENDING");
  const failedRows = paymentRows.filter((row) => normalizeStatus(row.status) === "FAILED");
  const freeRows = paymentRows.filter((row) => normalizeStatus(row.status) === "FREE");
  const revenue = paidRows.reduce((total, row) => total + row.amount, 0);
  const expectedRevenue = paymentRows.reduce((total, row) => total + row.amount, 0);

  const exportPayments = () => {
    const headers = ["Registration ID", "Name", "Email", "Phone", "Type", "Method", "Status", "Amount"];
    const rows = filteredRows.map((row) => [
      row.registrationId,
      row.name,
      row.email,
      row.phone,
      row.type,
      row.method,
      row.status,
      row.amount
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${event?.eventName || "event"}-payments.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updatePaymentStatus = async (registrationId, status) => {
    try {
      setUpdatingId(registrationId);
      setMessage("");
      const response = await api.put(
        `/registrations/${registrationId}/payment/manual-status`,
        null,
        { params: { status } }
      );
      setRegistrations((current) => current.map((registration) =>
        registration.id === registrationId ? response.data : registration
      ));
      setMessage(`Payment status updated to ${status}. Revenue has been recalculated.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update payment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Payments
          </h3>
          <p className="text-muted mb-0">
            Track payment status, revenue and transaction methods for this event.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-light border d-inline-flex align-items-center gap-2"
            onClick={exportPayments}
            disabled={filteredRows.length === 0}
          >
            <BsDownload /> Export
          </button>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={loadPayments}
            disabled={loading}
          >
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsCashCoin />} label="Revenue" value={`Rs. ${revenue.toLocaleString("en-IN")}`} />
        <SummaryCard icon={<BsCheckCircle />} label="Paid" value={paidRows.length} />
        <SummaryCard icon={<BsClockHistory />} label="Pending" value={pendingRows.length} />
        <SummaryCard icon={<BsExclamationCircle />} label="Failed" value={failedRows.length} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                    Revenue Progress
                  </h4>
                  <p className="text-muted small mb-0">Collected amount against expected ticket revenue.</p>
                </div>
                <span className="badge bg-primary-subtle text-primary">
                  {expectedRevenue > 0 ? Math.round((revenue / expectedRevenue) * 100) : 0}%
                </span>
              </div>

              <div className="progress mb-3" style={{ height: "10px" }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${expectedRevenue > 0 ? Math.min((revenue / expectedRevenue) * 100, 100) : 0}%`
                  }}
                />
              </div>

              <div className="row g-3">
                <MiniStat label="Expected" value={`Rs. ${expectedRevenue.toLocaleString("en-IN")}`} />
                <MiniStat label="Collected" value={`Rs. ${revenue.toLocaleString("en-IN")}`} />
                <MiniStat
                  label="Balance"
                  value={`Rs. ${Math.max(expectedRevenue - revenue, 0).toLocaleString("en-IN")}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Payment Methods
              </h4>
              <MethodRow icon={<BsCreditCard />} label="UPI / Card" count={methodCount(paymentRows, "UPI") + methodCount(paymentRows, "Card")} />
              <MethodRow icon={<BsBank />} label="Bank / Net Banking" count={methodCount(paymentRows, "Bank")} />
              <MethodRow icon={<BsCashCoin />} label="Free / Not selected" count={freeRows.length + methodCount(paymentRows, "Not selected")} />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label fw-semibold">Search Payments</label>
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
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>NOT_STARTED</option>
                <option>PAID</option>
                <option>PENDING</option>
                <option>FAILED</option>
                <option>FREE</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Method</label>
              <select
                className="form-select"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option>All</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank</option>
                <option>Free Event</option>
                <option>Not selected</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading payments...</div>
        ) : filteredRows.length === 0 ? (
          <div className="card-body text-center py-5">
            <BsCashCoin className="text-secondary opacity-50 mb-3" size={52} />
            <h4 className="fw-semibold" style={{ fontSize: "18px" }}>
              No payment records found
            </h4>
            <p className="text-muted mb-0">Payment records will appear after attendees register.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Attendee</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  {canManagePayments && <th>Update</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold">{row.registrationId}</td>
                    <td>
                      <div className="fw-semibold">{row.name}</div>
                      <div className="text-muted small">{row.email}</div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">{row.type}</span>
                    </td>
                    <td>{row.method}</td>
                    <td>
                      <span className={`badge ${statusBadge(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="fw-semibold">Rs. {row.amount.toLocaleString("en-IN")}</td>
                    <td>{formatDate(row.registeredAt)}</td>
                    {canManagePayments && (
                      <td>
                        <select
                          className="form-select form-select-sm payment-manual-status"
                          value={normalizeStatus(row.status)}
                          disabled={updatingId === row.id || normalizeStatus(row.status) === "FREE"}
                          onChange={(event) => updatePaymentStatus(row.id, event.target.value)}
                          aria-label={`Update payment status for ${row.registrationId}`}
                        >
                          <option value="NOT_STARTED">Not started</option>
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="FAILED">Failed</option>
                          {normalizeStatus(row.status) === "FREE" && <option value="FREE">Free</option>}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{paymentStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="payment-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="col-md-4">
      <div className="border rounded-3 p-3">
        <div className="text-muted small">{label}</div>
        <div className="fw-semibold">{value}</div>
      </div>
    </div>
  );
}

function MethodRow({ icon, label, count }) {
  return (
    <div className="d-flex justify-content-between align-items-center border-bottom py-2">
      <div className="d-flex align-items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="fw-semibold">{count}</span>
    </div>
  );
}

function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();

  if (value.includes("NOT_STARTED")) return "NOT_STARTED";
  if (value.includes("PAID") || value.includes("SUCCESS")) return "PAID";
  if (value.includes("FAIL")) return "FAILED";
  if (value.includes("FREE")) return "FREE";
  return "PENDING";
}

function statusBadge(status) {
  const value = normalizeStatus(status);

  if (value === "PAID") return "bg-success-subtle text-success";
  if (value === "FAILED") return "bg-danger-subtle text-danger";
  if (value === "FREE") return "bg-secondary-subtle text-secondary";
  if (value === "NOT_STARTED") return "bg-secondary-subtle text-secondary";
  return "bg-warning-subtle text-warning";
}

function methodCount(rows, method) {
  return rows.filter((row) => row.method.toLowerCase().includes(method.toLowerCase())).length;
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

const paymentStyles = `
  .payment-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }
  .payment-manual-status {
    min-width: 130px;
  }
`;

export default Payments;
