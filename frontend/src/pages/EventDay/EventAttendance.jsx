import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BsArrowClockwise, BsPeople, BsPersonCheck, BsPersonDash } from "react-icons/bs";
import api from "../../api/axiosConfig";

const COLORS = ["#16a34a", "#ef4444"];

function EventAttendance() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAttendance();
  }, [id]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [dashboardRes, registrationsRes] = await Promise.all([
        api.get(`/attendance-dashboard/event/${id}`),
        api.get(`/registrations/event/${id}`),
      ]);

      setDashboard(dashboardRes.data);
      setRegistrations(registrationsRes.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setDashboard(null);
      setRegistrations([]);
      setMessage("Unable to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = useMemo(() => {
    if (!dashboard?.totalRegistrations) return 0;
    return Math.round((dashboard.checkedIn / dashboard.totalRegistrations) * 100);
  }, [dashboard]);

  const chartData = [
    { name: "Present", value: dashboard?.checkedIn || 0 },
    { name: "Absent", value: dashboard?.notCheckedIn || 0 },
  ];

  const participantRows = registrations.filter((registration) => registration.registrationType === "PARTICIPANT");
  const audienceRows = registrations.filter((registration) => registration.registrationType === "AUDIENCE");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Attendance
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Monitor live attendance and check-in progress for this event.
          </p>
        </div>

        <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={loadAttendance}>
          <BsArrowClockwise /> {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4 mb-4">
        <StatCard icon={<BsPeople />} label="Total Registrations" value={dashboard?.totalRegistrations || 0} />
        <StatCard icon={<BsPersonCheck />} label="Present" value={dashboard?.checkedIn || 0} />
        <StatCard icon={<BsPersonDash />} label="Absent" value={dashboard?.notCheckedIn || 0} />
        <StatCard icon={<BsPersonCheck />} label="Attendance Rate" value={`${attendanceRate}%`} />
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Attendance Distribution
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={105} label>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Attendance Summary
              </h5>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Group</th>
                      <th>Registered</th>
                      <th>Checked In</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SummaryRow title="Participants" rows={participantRows} />
                    <SummaryRow title="Audience" rows={audienceRows} />
                    <tr className="fw-semibold">
                      <td>Total</td>
                      <td>{dashboard?.totalRegistrations || 0}</td>
                      <td>{dashboard?.checkedIn || 0}</td>
                      <td>{dashboard?.notCheckedIn || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Attendee List
              </h5>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Attendee</th>
                      <th>Type</th>
                      <th>Payment</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          No registrations found.
                        </td>
                      </tr>
                    ) : (
                      registrations.map((registration) => {
                        const participant = registration.participant || {};
                        return (
                          <tr key={registration.id}>
                            <td>
                              <div className="fw-semibold">
                                {participant.firstName} {participant.lastName}
                              </div>
                              <div className="text-muted small">{participant.email}</div>
                            </td>
                            <td>{registration.registrationType}</td>
                            <td>{registration.paymentStatus}</td>
                            <td>
                              {registration.attended ? (
                                <span className="badge text-bg-success">Present</span>
                              ) : (
                                <span className="badge text-bg-secondary">Absent</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ title, rows }) {
  const checkedIn = rows.filter((row) => row.attended).length;

  return (
    <tr>
      <td>{title}</td>
      <td>{rows.length}</td>
      <td>{checkedIn}</td>
      <td>{rows.length - checkedIn}</td>
    </tr>
  );
}

function StatCard({ icon, label, value }) {
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
                {label}
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

export default EventAttendance;
