import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BsArrowClockwise, BsCashCoin, BsCreditCard, BsDownload, BsHourglassSplit } from "react-icons/bs";
import api from "../../api/axiosConfig";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444"];

function RevenueReport() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRevenueReport();
  }, [id]);

  const loadRevenueReport = async () => {
    try {
      setLoading(true);
      const [eventRes, summaryRes, registrationsRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/reports/event/${id}/summary`),
        api.get(`/registrations/event/${id}`),
      ]);

      setEvent(eventRes.data);
      setSummary(summaryRes.data);
      setRegistrations(registrationsRes.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setEvent(null);
      setSummary(null);
      setRegistrations([]);
      setMessage("Unable to load revenue report.");
    } finally {
      setLoading(false);
    }
  };

  const ticketPrice = Number(event?.ticketPrice || 0);
  const paidCount = Number(summary?.paid || 0);
  const pendingCount = Number(summary?.pending || 0);
  const failedCount = Number(summary?.failed || 0);
  const totalRevenue = paidCount * ticketPrice;
  const pendingRevenue = pendingCount * ticketPrice;
  const lostRevenue = failedCount * ticketPrice;

  const revenueByDate = useMemo(() => {
    const map = new Map();

    registrations
      .filter((registration) => registration.paymentStatus === "PAID")
      .forEach((registration) => {
        const rawDate = registration.paymentDate || registration.registrationDate;
        const label = rawDate
          ? new Date(rawDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
          : "Unknown";

        map.set(label, (map.get(label) || 0) + ticketPrice);
      });

    if (map.size === 0) {
      return [{ date: "No paid sales", revenue: 0 }];
    }

    return Array.from(map, ([date, revenue]) => ({ date, revenue }));
  }, [registrations, ticketPrice]);

  const paymentData = [
    { name: "Collected", value: totalRevenue },
    { name: "Pending", value: pendingRevenue },
    { name: "Failed", value: lostRevenue },
  ];

  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Event", event?.eventName || "-"],
      ["Ticket Price", ticketPrice],
      ["Paid Registrations", paidCount],
      ["Pending Payments", pendingCount],
      ["Failed Payments", failedCount],
      ["Collected Revenue", totalRevenue],
      ["Pending Revenue", pendingRevenue],
      ["Failed Revenue", lostRevenue],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `event-${id}-revenue-report.csv`;
    link.click();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Revenue Report
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Review ticket revenue, payment status, and pending collections.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={loadRevenueReport}>
            <BsArrowClockwise /> {loading ? "Loading" : "Refresh"}
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={exportReport} disabled={!summary}>
            <BsDownload /> Export
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4 mb-4">
        <StatCard icon={<BsCashCoin />} title="Collected Revenue" value={formatCurrency(totalRevenue)} />
        <StatCard icon={<BsCreditCard />} title="Ticket Price" value={formatCurrency(ticketPrice)} />
        <StatCard icon={<BsHourglassSplit />} title="Pending Revenue" value={formatCurrency(pendingRevenue)} />
        <StatCard icon={<BsCreditCard />} title="Paid Tickets" value={paidCount} />
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <ReportCard title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        <div className="col-lg-5">
          <ReportCard title="Revenue Status">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="name" outerRadius={105} label>
                  {paymentData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        <div className="col-lg-12">
          <ReportCard title="Payment Summary">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Status</th>
                    <th>Registrations</th>
                    <th>Estimated Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <SummaryRow status="Paid" count={paidCount} amount={totalRevenue} note="Confirmed collected ticket sales" />
                  <SummaryRow status="Pending" count={pendingCount} amount={pendingRevenue} note="Payment not completed yet" />
                  <SummaryRow status="Failed" count={failedCount} amount={lostRevenue} note="Failed or rejected payments" />
                  <SummaryRow status="Free" count={summary?.free || 0} amount={0} note="Free registrations do not add revenue" />
                </tbody>
              </table>
            </div>
          </ReportCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded d-flex align-items-center justify-content-center text-primary"
              style={{ width: "42px", height: "42px", backgroundColor: "#eff6ff" }}
            >
              {icon}
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: "13px" }}>
                {title}
              </div>
              <div className="fw-semibold" style={{ fontSize: "24px" }}>
                {value}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, children }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
          {title}
        </h5>
        {children}
      </div>
    </div>
  );
}

function SummaryRow({ status, count, amount, note }) {
  return (
    <tr>
      <td className="fw-semibold">{status}</td>
      <td>{count}</td>
      <td>{formatCurrency(amount)}</td>
      <td className="text-muted">{note}</td>
    </tr>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default RevenueReport;
