import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BsPeople,
  BsPersonCheck,
  BsPersonBadge,
  BsAward,
  BsCashCoin,
  BsClockHistory,
  BsXCircle,
  BsDownload,
  BsArrowClockwise,
} from "react-icons/bs";

function OrganizerReports() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) loadReport(selectedEventId);
  }, [selectedEventId]);

  const loadEvents = async () => {
    const organizerId = Number(localStorage.getItem("userId"));

    try {
      const res = await api.get(`/events/organizer/${organizerId}`);
      const myEvents = res.data || [];

      setEvents(myEvents);
      if (myEvents.length > 0) setSelectedEventId(myEvents[0].id);
      else setMessage("No events assigned to you.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load events.");
    }
  };

  const loadReport = async (eventId) => {
    try {
      const res = await api.get(`/reports/event/${eventId}/summary`);
      setReport(res.data);
      setMessage("");
    } catch (error) {
      console.log(error);
      setReport(null);
      setMessage("Unable to load report.");
    }
  };

  const downloadPDF = () => {
  if (!report) return;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text(`${report.eventName} Report`, 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Report Field", "Value"]],
    body: [
      ["Event Name", report.eventName],
      ["Total Registrations", report.totalRegistrations],
      ["Participants", report.participants],
      ["Audience", report.audience],
      ["Checked In", report.checkedIn],
      ["Certificates Issued", report.certificatesIssued],
      ["Paid", report.paid],
      ["Free", report.free],
      ["Pending", report.pending],
      ["Failed", report.failed],
    ],
    headStyles: {
      fillColor: [37, 99, 235],
    },
    styles: {
      fontSize: 11,
      cellPadding: 3,
    },
  });

  doc.save(`${report.eventName}-Report.pdf`);
};

  const downloadExcel = () => {
    if (!report) return;

    const rows = [
      ["Report Field", "Value"],
      ["Event Name", report.eventName],
      ["Total Registrations", report.totalRegistrations],
      ["Participants", report.participants],
      ["Audience", report.audience],
      ["Checked In", report.checkedIn],
      ["Certificates Issued", report.certificatesIssued],
      ["Paid", report.paid],
      ["Free", report.free],
      ["Pending", report.pending],
      ["Failed", report.failed],
    ];

    const csv =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${report.eventName}-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cards = report
    ? [
        ["Total Registrations", report.totalRegistrations, <BsPeople />],
        ["Participants", report.participants, <BsPersonBadge />],
        ["Audience", report.audience, <BsPeople />],
        ["Checked In", report.checkedIn, <BsPersonCheck />],
        ["Certificates Issued", report.certificatesIssued, <BsAward />],
        ["Paid", report.paid, <BsCashCoin />],
        ["Free", report.free, <BsCashCoin />],
        ["Pending", report.pending, <BsClockHistory />],
        ["Failed", report.failed, <BsXCircle />],
      ]
    : [];

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Reports
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
            View and download event reports for your assigned events.
          </p>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={() => selectedEventId && loadReport(selectedEventId)}
          style={{ borderRadius: "10px", fontSize: "15px" }}
        >
          <BsArrowClockwise /> Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="admin-bento-card mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Select Event</label>
            <select
              className="form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.length === 0 && <option value="">No events found</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </div>

          <div className="organizer-export-actions col-md-6 d-flex gap-3">
            <button className="btn btn-outline-danger" onClick={downloadPDF}>
              <BsDownload /> PDF
            </button>

            <button className="btn btn-outline-success" onClick={downloadExcel}>
              <BsDownload /> Excel
            </button>
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="organizer-stat-grid row g-4 mb-4">
            {cards.map(([title, value, icon]) => (
              <div className="col-md-4" key={title}>
                <div className="admin-bento-card">
                  <div className="admin-bento-icon">{icon}</div>
                  <p className="admin-bento-label">{title}</p>
                  <h2 className="admin-bento-value">{value}</h2>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-bento-card">
            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Report Summary
            </h2>

            <p>
              <strong>Event:</strong> {report.eventName}
            </p>
            <p>
              <strong>Total Registrations:</strong> {report.totalRegistrations}
            </p>
            <p>
              <strong>Certificates Issued:</strong> {report.certificatesIssued}
            </p>
          </div>
        </>
      )}
    </OrganizerLayout>
  );
}

export default OrganizerReports;
