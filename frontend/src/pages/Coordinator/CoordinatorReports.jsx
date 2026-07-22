import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { filterToActiveEvent, loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsBarChart,
  BsPeople,
  BsPersonCheck,
  BsTicketPerforated,
  BsArrowClockwise,
} from "react-icons/bs";

function CoordinatorReports() {
  const [assignments, setAssignments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const assigned = filterToActiveEvent(await loadRoleAssignments(
        "COORDINATOR",
        `/coordinator-assignments/coordinator/${coordinatorId}`
      ));
      const eventIds = assigned.map((a) => a.event?.id).filter(Boolean);

      const registrationResults = await Promise.all(
        eventIds.map((id) => api.get(`/registrations/event/${id}`))
      );

      const ticketResults = await Promise.all(
        eventIds.map((id) => api.get(`/tickets/event/${id}`))
      );

      setAssignments(assigned);
      setDrafts(Object.fromEntries(assigned.map(item => [item.event?.id, item.completionReport || ""])));
      setRegistrations(registrationResults.flatMap((res) => res.data || []));
      setTickets(ticketResults.flatMap((res) => res.data || []));
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load coordinator reports.");
    }
  };

  const totalRegistrations = registrations.length;
  const present = registrations.filter((r) => r.attended).length;
  const absent = registrations.filter((r) => !r.attended).length;
  const usedTickets = tickets.filter((t) => t.status === "USED").length;

  const cards = [
    { title: "Assigned Events", value: assignments.length, icon: <BsBarChart /> },
    { title: "Registrations", value: totalRegistrations, icon: <BsPeople /> },
    { title: "Present", value: present, icon: <BsPersonCheck /> },
    { title: "Tickets Verified", value: usedTickets, icon: <BsTicketPerforated /> },
  ];

  const submitReport = async (eventId) => {
    const report = drafts[eventId]?.trim();
    if (!report) { setMessage("Enter the event completion report before submitting."); return; }
    try {
      await api.put(`/coordinator-assignments/event/${eventId}/completion-report`, { report });
      setMessage("Event completion report submitted successfully.");
      loadReports();
    } catch (error) { setMessage(error.response?.data?.message || "Unable to submit completion report."); }
  };

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Reports
          </h1>
          <p className="text-muted mb-0">
            View report summary for events coordinated by you.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadReports}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div className="col-md-3" key={card.title}>
            <div className="admin-bento-card h-100">
              <div className="admin-bento-icon mb-3">{card.icon}</div>
              <p className="admin-bento-label">{card.title}</p>
              <h2 className="admin-bento-value">{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-bento-card">
        <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
          Event Report Summary
        </h2>

        {assignments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No assigned events found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Registrations</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Verified Tickets</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((assignment, index) => {
                  const eventId = assignment.event?.id;

                  const eventRegs = registrations.filter(
                    (r) => r.event?.id === eventId
                  );

                  const eventTickets = tickets.filter(
                    (t) => t.registration?.event?.id === eventId
                  );

                  const eventPresent = eventRegs.filter((r) => r.attended).length;
                  const eventAbsent = eventRegs.filter((r) => !r.attended).length;
                  const eventUsedTickets = eventTickets.filter(
                    (t) => t.status === "USED"
                  ).length;

                  return (
                    <tr key={assignment.id}>
                      <td>{index + 1}</td>
                      <td>{assignment.event?.eventName || "N/A"}</td>
                      <td>{eventRegs.length}</td>
                      <td>
                        <span className="badge bg-success">
                          {eventPresent}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {eventAbsent}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {eventUsedTickets}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-bento-card mt-4">
        <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>Event Completion Reports</h2>
        <p className="text-muted">Submit the final operational summary only for events assigned to you.</p>
        {assignments.map((assignment) => <div className="border rounded p-3 mb-3" key={`report-${assignment.id}`}>
          <div className="d-flex justify-content-between gap-3 mb-2"><strong>{assignment.event?.eventName}</strong><small className="text-muted">{assignment.reportSubmittedAt ? `Last submitted: ${new Date(assignment.reportSubmittedAt).toLocaleString()}` : "Not submitted"}</small></div>
          <textarea className="form-control" rows="4" placeholder="Summarize attendance, task completion, incidents, vendor/resource status, and handover notes..." value={drafts[assignment.event?.id] || ""} onChange={e=>setDrafts({...drafts,[assignment.event?.id]:e.target.value})}/>
          <button className="btn btn-primary mt-2" onClick={()=>submitReport(assignment.event?.id)}>Submit completion report</button>
        </div>)}
      </div>
    </RoleLayout>
  );
}

export default CoordinatorReports;
