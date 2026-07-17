import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsBarChart,
  BsBuilding,
  BsDownload,
  BsGrid,
  BsPeople,
  BsGraphUp
} from "react-icons/bs";
import api from "../../api/axiosConfig";

function ExhibitorReports() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [exhibitors, setExhibitors] = useState([]);
  const [booths, setBooths] = useState([]);
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const [summaryRes, exhibitorsRes, boothsRes, leadsRes] = await Promise.allSettled([
        api.get(`/exhibitors/event/${id}/summary`),
        api.get(`/exhibitors/event/${id}`),
        api.get(`/exhibitor-booths/event/${id}`),
        api.get(`/exhibitor-leads/event/${id}`)
      ]);

      setSummary(summaryRes.status === "fulfilled" ? summaryRes.value.data : null);
      setExhibitors(exhibitorsRes.status === "fulfilled" ? exhibitorsRes.value.data || [] : []);
      setBooths(boothsRes.status === "fulfilled" ? boothsRes.value.data || [] : []);
      setLeads(leadsRes.status === "fulfilled" ? leadsRes.value.data || [] : []);

      if (summaryRes.status !== "fulfilled") {
        setMessage("Unable to load exhibitor report summary.");
      }
    } catch {
      setSummary(null);
      setExhibitors([]);
      setBooths([]);
      setLeads([]);
      setMessage("Unable to load exhibitor reports.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const ranking = useMemo(() => {
    return exhibitors
      .map((exhibitor) => {
        const exhibitorLeads = leads.filter((lead) => lead.exhibitor?.id === exhibitor.id);
        const converted = exhibitorLeads.filter((lead) => lead.status === "Converted").length;

        return {
          ...exhibitor,
          leads: exhibitorLeads.length,
          converted
        };
      })
      .sort((a, b) => b.leads - a.leads);
  }, [exhibitors, leads]);

  const totalLeads = summary?.totalLeads ?? leads.length;
  const convertedLeads = summary?.convertedLeads ?? leads.filter((lead) => lead.status === "Converted").length;
  const assignedBooths = summary?.assignedBooths ?? booths.filter((booth) => booth.status === "Assigned").length;
  const availableBooths = summary?.availableBooths ?? booths.filter((booth) => booth.status === "Available").length;
  const totalBooths = summary?.totalBooths ?? booths.length;
  const totalExhibitors = summary?.totalExhibitors ?? exhibitors.length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const maxLeads = Math.max(...ranking.map((item) => item.leads), 1);
  const allocationRate = totalBooths > 0 ? Math.round((assignedBooths / totalBooths) * 100) : 0;

  const exportReports = () => {
    const headers = ["Company", "Status", "Package", "Booth", "Leads", "Converted"];
    const rows = ranking.map((item) => [
      item.company,
      item.status,
      item.packageType,
      item.booth,
      item.leads,
      item.converted
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "exhibitor-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>Exhibitor Reports</h3>
          <p className="text-muted mb-0">Review exhibitor participation, booth usage and lead performance.</p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={loadReports} disabled={loading}>
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={exportReports} disabled={ranking.length === 0}>
            <BsDownload /> Export
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsBuilding />} label="Exhibitors" value={totalExhibitors} />
        <SummaryCard icon={<BsGrid />} label="Assigned Booths" value={assignedBooths} />
        <SummaryCard icon={<BsPeople />} label="Leads" value={totalLeads} />
        <SummaryCard icon={<BsGraphUp />} label="Conversion Rate" value={`${conversionRate}%`} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>Lead Performance</h4>
              {loading ? (
                <div className="text-muted py-4">Loading report...</div>
              ) : ranking.length === 0 ? (
                <div className="text-muted py-4">No exhibitor lead data yet.</div>
              ) : (
                <div className="d-grid gap-3">
                  {ranking.map((item) => (
                    <div key={item.id}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold">{item.company}</span>
                        <span className="text-muted small">{item.leads} leads / {item.converted} converted</span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div className="progress-bar" style={{ width: `${(item.leads / maxLeads) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>Booth Usage</h4>
              <ReportRow label="Assigned" value={assignedBooths} />
              <ReportRow label="Available" value={availableBooths} />
              <ReportRow label="Reserved" value={booths.filter((booth) => booth.status === "Reserved").length} />
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Allocation</span>
                  <span className="text-muted small">{allocationRate}%</span>
                </div>
                <div className="progress" style={{ height: "10px" }}>
                  <div className="progress-bar bg-success" style={{ width: `${allocationRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>Exhibitor Ranking</h4>
          <p className="text-muted small mb-0">Lead and conversion results by exhibitor.</p>
        </div>
        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading exhibitor report...</div>
        ) : ranking.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">No exhibitor report data found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Exhibitor</th>
                  <th>Status</th>
                  <th>Package</th>
                  <th>Booth</th>
                  <th>Leads</th>
                  <th>Converted</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item) => {
                  const rate = item.leads > 0 ? Math.round((item.converted / item.leads) * 100) : 0;

                  return (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.company}</td>
                      <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                      <td>{item.packageType}</td>
                      <td>{item.booth || "N/A"}</td>
                      <td>{item.leads}</td>
                      <td>{item.converted}</td>
                      <td>{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{reportStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="report-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between align-items-center border-bottom py-2">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusBadge(status) {
  if (status === "Confirmed") return "bg-success-subtle text-success";
  if (status === "Pending") return "bg-warning-subtle text-warning";
  return "bg-secondary-subtle text-secondary";
}

const reportStyles = `
  .report-summary-icon {
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

export default ExhibitorReports;
