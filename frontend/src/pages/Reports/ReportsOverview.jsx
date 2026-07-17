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
import {
  BsArrowClockwise,
  BsAward,
  BsCheck2Circle,
  BsDownload,
  BsPeople,
  BsPersonCheck,
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444"];

function ReportsOverview() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/event/${id}/summary`);
      setSummary(res.data);
      setMessage("");
    } catch (error) {
      console.log(error);
      setSummary(null);
      setMessage("Unable to load report overview.");
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = useMemo(() => {
    if (!summary?.totalRegistrations) return 0;
    return Math.round((summary.checkedIn / summary.totalRegistrations) * 100);
  }, [summary]);

  const registrationData = [
    { name: "Participants", value: summary?.participants || 0 },
    { name: "Audience", value: summary?.audience || 0 },
  ];

  const paymentData = [
    { name: "Paid", value: summary?.paid || 0 },
    { name: "Free", value: summary?.free || 0 },
    { name: "Pending", value: summary?.pending || 0 },
    { name: "Failed", value: summary?.failed || 0 },
  ];

  const progressData = [
    { name: "Registrations", value: summary?.totalRegistrations || 0 },
    { name: "Checked In", value: summary?.checkedIn || 0 },
    { name: "Certificates", value: summary?.certificatesIssued || 0 },
  ];

  const exportReport = () => {
    if (!summary) return;

    const rows = [
      ["Metric", "Value"],
      ["Event", summary.eventName || "-"],
      ["Total Registrations", summary.totalRegistrations || 0],
      ["Participants", summary.participants || 0],
      ["Audience", summary.audience || 0],
      ["Checked In", summary.checkedIn || 0],
      ["Attendance Rate", `${attendanceRate}%`],
      ["Free", summary.free || 0],
      ["Paid", summary.paid || 0],
      ["Pending", summary.pending || 0],
      ["Failed", summary.failed || 0],
      ["Certificates Issued", summary.certificatesIssued || 0],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `event-${id}-overview-report.csv`;
    link.click();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Reports Overview
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Track registrations, attendance, certificates, and payment status.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={loadReport}>
            <BsArrowClockwise /> {loading ? "Loading" : "Refresh"}
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={exportReport} disabled={!summary}>
            <BsDownload /> Export
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4 mb-4">
        <StatCard icon={<BsPeople />} title="Registrations" value={summary?.totalRegistrations || 0} />
        <StatCard icon={<BsPersonCheck />} title="Checked In" value={summary?.checkedIn || 0} />
        <StatCard icon={<BsCheck2Circle />} title="Attendance Rate" value={`${attendanceRate}%`} />
        <StatCard icon={<BsAward />} title="Certificates" value={summary?.certificatesIssued || 0} />
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <ReportCard title="Registration Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={registrationData} dataKey="value" nameKey="name" outerRadius={95} label>
                  {registrationData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        <div className="col-lg-7">
          <ReportCard title="Event Progress">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        <div className="col-lg-12">
          <ReportCard title="Payment Status">
            <div className="row g-3 align-items-center">
              <div className="col-md-5">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                      {paymentData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="col-md-7">
                <div className="row g-3">
                  {paymentData.map((item, index) => (
                    <div className="col-sm-6" key={item.name}>
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span
                            className="rounded-circle"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-muted">{item.name}</span>
                        </div>
                        <div className="fw-semibold" style={{ fontSize: "24px" }}>
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              <div className="fw-semibold" style={{ fontSize: "26px" }}>
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

export default ReportsOverview;
