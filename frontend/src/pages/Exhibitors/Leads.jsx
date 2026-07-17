import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsDownload,
  BsEnvelope,
  BsPeople,
  BsPlus,
  BsSearch,
  BsTelephone,
  BsTrash
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const emptyLead = {
  name: "",
  company: "",
  email: "",
  phone: "",
  exhibitorId: "",
  interest: "",
  source: "Booth Visit",
  status: "New"
};

function Leads() {
  const { id } = useParams();
  const [leads, setLeads] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [form, setForm] = useState(emptyLead);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const [leadsRes, exhibitorsRes] = await Promise.allSettled([
        api.get(`/exhibitor-leads/event/${id}`),
        api.get(`/exhibitors/event/${id}`)
      ]);

      setLeads(leadsRes.status === "fulfilled" ? leadsRes.value.data || [] : []);
      setExhibitors(exhibitorsRes.status === "fulfilled" ? exhibitorsRes.value.data || [] : []);

      if (leadsRes.status !== "fulfilled") {
        setMessage("Unable to load leads.");
      }
    } catch {
      setLeads([]);
      setExhibitors([]);
      setMessage("Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const query = search.toLowerCase();

    return leads.filter((lead) => {
      const exhibitorName = lead.exhibitor?.company || "";
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(query) ||
        (lead.company || "").toLowerCase().includes(query) ||
        (lead.email || "").toLowerCase().includes(query) ||
        exhibitorName.toLowerCase().includes(query) ||
        (lead.interest || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveLead = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.exhibitorId) {
      setMessage("Lead name, email and exhibitor are required.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        interest: form.interest,
        source: form.source,
        status: form.status,
        event: { id: Number(id) },
        exhibitor: { id: Number(form.exhibitorId) }
      };
      const res = await api.post("/exhibitor-leads", payload);

      setLeads((current) => [res.data, ...current]);
      setForm(emptyLead);
      setShowForm(false);
      setMessage("Lead added.");
    } catch {
      setMessage("Unable to save lead.");
    }
  };

  const updateLeadStatus = async (lead, status) => {
    try {
      const payload = {
        ...lead,
        status,
        event: { id: Number(id) },
        exhibitor: { id: lead.exhibitor?.id }
      };
      const res = await api.put(`/exhibitor-leads/${lead.id}`, payload);

      setLeads((current) => current.map((item) => (item.id === lead.id ? res.data : item)));
    } catch {
      setMessage("Unable to update lead status.");
    }
  };

  const deleteLead = async (leadId) => {
    try {
      await api.delete(`/exhibitor-leads/${leadId}`);
      setLeads((current) => current.filter((lead) => lead.id !== leadId));
      setMessage("Lead removed.");
    } catch {
      setMessage("Unable to remove lead.");
    }
  };

  const exportLeads = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Exhibitor", "Interest", "Source", "Status"];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.exhibitor?.company,
      lead.interest,
      lead.source,
      lead.status
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "exhibitor-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const contactedCount = leads.filter((lead) => lead.status === "Contacted").length;
  const convertedCount = leads.filter((lead) => lead.status === "Converted").length;
  const newCount = leads.filter((lead) => lead.status === "New").length;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>Leads</h3>
          <p className="text-muted mb-0">Capture and track leads collected by exhibitors.</p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={loadLeads} disabled={loading}>
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={exportLeads} disabled={filteredLeads.length === 0}>
            <BsDownload /> Export
          </button>
          <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
            <BsPlus /> Add Lead
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsPeople />} label="Total Leads" value={leads.length} />
        <SummaryCard icon={<BsPeople />} label="New" value={newCount} />
        <SummaryCard icon={<BsPeople />} label="Contacted" value={contactedCount} />
        <SummaryCard icon={<BsPeople />} label="Converted" value={convertedCount} />
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>Add Lead</h4>
            <p className="text-muted small mb-0">Record visitor interest for an exhibitor.</p>
          </div>
          <form className="card-body" onSubmit={saveLead}>
            <div className="row g-3">
              <Input label="Lead Name *" value={form.name} onChange={(value) => updateField("name", value)} />
              <Input label="Company" value={form.company} onChange={(value) => updateField("company", value)} />
              <Input label="Email *" value={form.email} onChange={(value) => updateField("email", value)} />
              <Input label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />

              <div className="col-md-6">
                <label className="form-label fw-semibold">Exhibitor *</label>
                <select className="form-select" value={form.exhibitorId} onChange={(e) => updateField("exhibitorId", e.target.value)}>
                  <option value="">Select exhibitor</option>
                  {exhibitors.map((exhibitor) => (
                    <option key={exhibitor.id} value={exhibitor.id}>{exhibitor.company}</option>
                  ))}
                </select>
              </div>

              <Input label="Interested In" value={form.interest} onChange={(value) => updateField("interest", value)} />
              <Select label="Source" value={form.source} onChange={(value) => updateField("source", value)} options={["Booth Visit", "QR Scan", "Demo Request", "Business Card", "Walk-in"]} />
              <Select label="Status" value={form.status} onChange={(value) => updateField("status", value)} options={["New", "Contacted", "Converted", "Lost"]} />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Lead</button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row g-3 align-items-end">
            <div className="col-lg-7">
              <label className="form-label fw-semibold">Search Leads</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><BsSearch /></span>
                <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, company, email, exhibitor or interest" />
              </div>
            </div>
            <div className="col-lg-5">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", "New", "Contacted", "Converted", "Lost"]} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">No leads found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Exhibitor</th>
                  <th>Interest</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="fw-semibold">{lead.name}</div>
                      <div className="text-muted small">{lead.company || "N/A"}</div>
                    </td>
                    <td>
                      <div className="small d-flex align-items-center gap-2"><BsEnvelope className="text-primary" /> {lead.email}</div>
                      <div className="small text-muted d-flex align-items-center gap-2"><BsTelephone /> {lead.phone || "N/A"}</div>
                    </td>
                    <td>{lead.exhibitor?.company || "N/A"}</td>
                    <td>{lead.interest || "N/A"}</td>
                    <td>{lead.source}</td>
                    <td>
                      <select className={`form-select form-select-sm lead-status ${statusClass(lead.status)}`} value={lead.status} onChange={(e) => updateLeadStatus(lead, e.target.value)}>
                        <option>New</option>
                        <option>Contacted</option>
                        <option>Converted</option>
                        <option>Lost</option>
                      </select>
                    </td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-light border" onClick={() => deleteLead(lead.id)}><BsTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{leadStyles}</style>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div className="col-md-6">
      <label className="form-label fw-semibold">{label}</label>
      <input className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="col-md-6">
      <label className="form-label fw-semibold">{label}</label>
      <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="lead-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusClass(status) {
  if (status === "Converted") return "lead-status-converted";
  if (status === "Contacted") return "lead-status-contacted";
  if (status === "Lost") return "lead-status-lost";
  return "lead-status-new";
}

const leadStyles = `
  .lead-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .lead-status {
    max-width: 140px;
  }

  .lead-status-new {
    color: #4f46e5;
  }

  .lead-status-contacted {
    color: #ca8a04;
  }

  .lead-status-converted {
    color: #16a34a;
  }

  .lead-status-lost {
    color: #dc2626;
  }
`;

export default Leads;
