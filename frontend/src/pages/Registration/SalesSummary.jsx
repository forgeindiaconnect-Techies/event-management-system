import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsBarChart,
  BsCashCoin,
  BsCheckCircle,
  BsClockHistory,
  BsDownload,
  BsPeople,
  BsTicketPerforated
} from "react-icons/bs";
import api from "../../api/axiosConfig";

function SalesSummary() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSalesSummary = useCallback(async () => {
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
        setMessage("Unable to load sales data.");
      }
    } catch {
      setMessage("Unable to load sales summary.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSalesSummary();
  }, [loadSalesSummary]);

  const rows = useMemo(() => {
    const ticketPrice = Number(event?.ticketPrice || 0);

    return registrations.map((registration) => {
      const participant = registration.participant || {};
      const fullName = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();
      const paymentStatus = registration.paymentStatus || (ticketPrice > 0 ? "PENDING" : "FREE");
      const status = registration.status || "REGISTERED";

      return {
        id: registration.id,
        registrationId: `REG-${registration.id}`,
        name: fullName || "Unnamed attendee",
        email: participant.email || "N/A",
        type: registration.registrationType || "PARTICIPANT",
        status,
        paymentStatus,
        paymentMethod: registration.paymentMethod || "N/A",
        amount: Number(registration.amount || registration.ticketPrice || ticketPrice || 0),
        registeredAt: registration.registrationDate
      };
    });
  }, [event, registrations]);

  const activeRows = rows.filter((row) => row.status !== "CANCELLED");
  const soldRows = activeRows.filter((row) => row.status === "REGISTERED");
  const paidRows = activeRows.filter((row) => row.paymentStatus === "PAID");
  const pendingRows = activeRows.filter((row) => row.paymentStatus === "PENDING");
  const freeRows = activeRows.filter((row) => row.paymentStatus === "FREE");
  const failedRows = activeRows.filter((row) => row.paymentStatus === "FAILED");

  const grossRevenue = paidRows.reduce((total, row) => total + row.amount, 0);
  const pendingRevenue = pendingRows.reduce((total, row) => total + row.amount, 0);
  const expectedRevenue = activeRows.reduce((total, row) => total + row.amount, 0);
  const cancelledCount = rows.filter((row) => row.status === "CANCELLED").length;
  const capacity = Number(event?.capacity || event?.availableSeats || 0);
  const availableSeats = Number(event?.availableSeats || Math.max(capacity - soldRows.length, 0));
  const salesPercent = capacity > 0 ? Math.min(Math.round((soldRows.length / capacity) * 100), 100) : 0;
  const revenuePercent = expectedRevenue > 0 ? Math.min(Math.round((grossRevenue / expectedRevenue) * 100), 100) : 0;

  const typeSummary = ["PARTICIPANT", "AUDIENCE"].map((type) => {
    const typeRows = activeRows.filter((row) => row.type === type);
    const typePaidRows = typeRows.filter((row) => row.paymentStatus === "PAID");

    return {
      type,
      sold: typeRows.length,
      paid: typePaidRows.length,
      revenue: typePaidRows.reduce((total, row) => total + row.amount, 0)
    };
  });

  const exportSales = () => {
    const headers = [
      "Registration ID",
      "Name",
      "Email",
      "Type",
      "Registration Status",
      "Payment Status",
      "Payment Method",
      "Amount",
      "Registered At"
    ];
    const csvRows = rows.map((row) => [
      row.registrationId,
      row.name,
      row.email,
      row.type,
      row.status,
      row.paymentStatus,
      row.paymentMethod,
      row.amount,
      formatDate(row.registeredAt)
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${event?.eventName || "event"}-sales-summary.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Sales Summary
          </h3>
          <p className="text-muted mb-0">
            Track ticket sales, revenue and seat movement for {event?.eventName || "this event"}.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-light border d-inline-flex align-items-center gap-2"
            onClick={exportSales}
            disabled={rows.length === 0}
          >
            <BsDownload /> Export
          </button>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={loadSalesSummary}
            disabled={loading}
          >
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsCashCoin />} label="Collected Revenue" value={`Rs. ${grossRevenue.toLocaleString("en-IN")}`} />
        <SummaryCard icon={<BsTicketPerforated />} label="Tickets Sold" value={soldRows.length} />
        <SummaryCard icon={<BsClockHistory />} label="Pending Revenue" value={`Rs. ${pendingRevenue.toLocaleString("en-IN")}`} />
        <SummaryCard icon={<BsPeople />} label="Available Seats" value={availableSeats} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                    Sales Progress
                  </h4>
                  <p className="text-muted small mb-0">Seats sold against event capacity.</p>
                </div>
                <span className="badge bg-primary-subtle text-primary">{salesPercent}% sold</span>
              </div>

              <div className="progress mb-4" style={{ height: "10px" }}>
                <div className="progress-bar" style={{ width: `${salesPercent}%` }} />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                    Revenue Progress
                  </h4>
                  <p className="text-muted small mb-0">Collected revenue against expected revenue.</p>
                </div>
                <span className="badge bg-success-subtle text-success">{revenuePercent}% collected</span>
              </div>

              <div className="progress" style={{ height: "10px" }}>
                <div className="progress-bar bg-success" style={{ width: `${revenuePercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Payment Status
              </h4>
              <StatusRow label="Paid" count={paidRows.length} amount={grossRevenue} />
              <StatusRow label="Pending" count={pendingRows.length} amount={pendingRevenue} />
              <StatusRow label="Free" count={freeRows.length} amount={0} />
              <StatusRow label="Failed" count={failedRows.length} amount={0} />
              <StatusRow label="Cancelled" count={cancelledCount} amount={0} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {typeSummary.map((item) => (
          <div className="col-md-6" key={item.type}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                      {item.type}
                    </h4>
                    <p className="text-muted small mb-0">Sales by registration type.</p>
                  </div>
                  <BsBarChart className="text-primary" size={24} />
                </div>
                <div className="row g-2">
                  <MiniStat label="Sold" value={item.sold} />
                  <MiniStat label="Paid" value={item.paid} />
                  <MiniStat label="Revenue" value={`Rs. ${item.revenue.toLocaleString("en-IN")}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
              Recent Sales
            </h4>
            <p className="text-muted small mb-0">Latest registration and payment records.</p>
          </div>
          <span className="badge bg-primary-subtle text-primary">{rows.length} records</span>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading sales summary...</div>
        ) : rows.length === 0 ? (
          <div className="card-body text-center py-5">
            <BsCheckCircle className="text-secondary opacity-50 mb-3" size={52} />
            <h4 className="fw-semibold" style={{ fontSize: "18px" }}>
              No sales yet
            </h4>
            <p className="text-muted mb-0">Sales will appear after attendees register.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Attendee</th>
                  <th>Type</th>
                  <th>Registration</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold">{row.registrationId}</td>
                    <td>
                      <div className="fw-semibold">{row.name}</div>
                      <div className="text-muted small">{row.email}</div>
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
                    <td className="fw-semibold">Rs. {row.amount.toLocaleString("en-IN")}</td>
                    <td>{formatDate(row.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{salesStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="sales-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, count, amount }) {
  return (
    <div className="d-flex justify-content-between align-items-center border-bottom py-2">
      <span>{label}</span>
      <span className="fw-semibold">
        {count} / Rs. {amount.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="col-4">
      <div className="border rounded-3 p-2 text-center">
        <div className="text-muted small">{label}</div>
        <div className="fw-semibold">{value}</div>
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

const salesStyles = `
  .sales-summary-icon {
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

export default SalesSummary;
