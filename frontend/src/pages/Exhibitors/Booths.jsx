import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsGrid,
  BsPencil,
  BsPlus,
  BsSearch,
  BsTrash
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const emptyBooth = {
  boothNo: "",
  hall: "Hall A",
  size: "3m x 3m",
  type: "Standard",
  exhibitorId: "",
  status: "Available"
};

function Booths() {
  const { id } = useParams();
  const [booths, setBooths] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [form, setForm] = useState(emptyBooth);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBooths = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const [boothsRes, exhibitorsRes] = await Promise.allSettled([
        api.get(`/exhibitor-booths/event/${id}`),
        api.get(`/exhibitors/event/${id}`)
      ]);

      setBooths(boothsRes.status === "fulfilled" ? boothsRes.value.data || [] : []);
      setExhibitors(exhibitorsRes.status === "fulfilled" ? exhibitorsRes.value.data || [] : []);

      if (boothsRes.status !== "fulfilled") {
        setMessage("Unable to load booths.");
      }
    } catch {
      setBooths([]);
      setExhibitors([]);
      setMessage("Unable to load booths.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooths();
  }, [loadBooths]);

  const filteredBooths = useMemo(() => {
    const query = search.toLowerCase();

    return booths.filter((booth) => {
      const exhibitorName = booth.exhibitor?.company || "";

      return (
        (booth.boothNo || "").toLowerCase().includes(query) ||
        (booth.hall || "").toLowerCase().includes(query) ||
        exhibitorName.toLowerCase().includes(query) ||
        (booth.status || "").toLowerCase().includes(query)
      );
    });
  }, [booths, search]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyBooth);
    setShowForm(true);
    setMessage("");
  };

  const editBooth = (booth) => {
    setEditingId(booth.id);
    setForm({
      boothNo: booth.boothNo || "",
      hall: booth.hall || "Hall A",
      size: booth.size || "3m x 3m",
      type: booth.type || "Standard",
      exhibitorId: booth.exhibitor?.id ? String(booth.exhibitor.id) : "",
      status: booth.status || "Available"
    });
    setShowForm(true);
    setMessage("");
  };

  const saveBooth = async (e) => {
    e.preventDefault();

    if (!form.boothNo.trim()) {
      setMessage("Booth number is required.");
      return;
    }

    try {
      const payload = {
        boothNo: form.boothNo,
        hall: form.hall,
        size: form.size,
        type: form.type,
        status: form.exhibitorId ? "Assigned" : form.status,
        event: { id: Number(id) },
        exhibitor: form.exhibitorId ? { id: Number(form.exhibitorId) } : null
      };
      const res = editingId
        ? await api.put(`/exhibitor-booths/${editingId}`, payload)
        : await api.post("/exhibitor-booths", payload);

      setBooths((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? res.data : item))
          : [res.data, ...current]
      );
      setForm(emptyBooth);
      setEditingId(null);
      setShowForm(false);
      setMessage(editingId ? "Booth updated." : "Booth created.");
    } catch {
      setMessage("Unable to save booth.");
    }
  };

  const deleteBooth = async (boothId) => {
    try {
      await api.delete(`/exhibitor-booths/${boothId}`);
      setBooths((current) => current.filter((item) => item.id !== boothId));
      setMessage("Booth removed.");
    } catch {
      setMessage("Unable to remove booth.");
    }
  };

  const assignedCount = booths.filter((booth) => booth.status === "Assigned").length;
  const availableCount = booths.filter((booth) => booth.status === "Available").length;
  const reservedCount = booths.filter((booth) => booth.status === "Reserved").length;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>Booths</h3>
          <p className="text-muted mb-0">Create booths, assign exhibitors and track booth availability.</p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={loadBooths} disabled={loading}>
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={openCreateForm}>
            <BsPlus /> Add Booth
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsGrid />} label="Total Booths" value={booths.length} />
        <SummaryCard icon={<BsGrid />} label="Assigned" value={assignedCount} />
        <SummaryCard icon={<BsGrid />} label="Available" value={availableCount} />
        <SummaryCard icon={<BsGrid />} label="Reserved" value={reservedCount} />
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>{editingId ? "Edit Booth" : "Add Booth"}</h4>
            <p className="text-muted small mb-0">Set booth location, size and assigned exhibitor.</p>
          </div>
          <form className="card-body" onSubmit={saveBooth}>
            <div className="row g-3">
              <Input label="Booth No *" value={form.boothNo} onChange={(value) => updateField("boothNo", value)} width="col-md-3" />
              <Input label="Hall" value={form.hall} onChange={(value) => updateField("hall", value)} width="col-md-3" />
              <Input label="Size" value={form.size} onChange={(value) => updateField("size", value)} width="col-md-3" />
              <Select label="Type" value={form.type} onChange={(value) => updateField("type", value)} options={["Standard", "Premium", "Startup", "Food", "Sponsor"]} width="col-md-3" />

              <div className="col-md-6">
                <label className="form-label fw-semibold">Assigned Exhibitor</label>
                <select className="form-select" value={form.exhibitorId} onChange={(e) => updateField("exhibitorId", e.target.value)}>
                  <option value="">Not assigned</option>
                  {exhibitors.map((exhibitor) => (
                    <option key={exhibitor.id} value={exhibitor.id}>{exhibitor.company}</option>
                  ))}
                </select>
              </div>
              <Select label="Status" value={form.status} onChange={(value) => updateField("status", value)} options={["Available", "Reserved", "Assigned", "Blocked"]} width="col-md-6" />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? "Update" : "Save"} Booth</button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <label className="form-label fw-semibold">Search Booths</label>
          <div className="input-group">
            <span className="input-group-text bg-white"><BsSearch /></span>
            <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Booth, hall, exhibitor or status" />
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading booths...</div>
        ) : filteredBooths.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">No booths found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Booth</th>
                  <th>Hall</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Exhibitor</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooths.map((booth) => (
                  <tr key={booth.id}>
                    <td className="fw-semibold">{booth.boothNo}</td>
                    <td>{booth.hall}</td>
                    <td>{booth.size}</td>
                    <td>{booth.type}</td>
                    <td>{booth.exhibitor?.company || "Not assigned"}</td>
                    <td><span className={`badge ${statusBadge(booth.status)}`}>{booth.status}</span></td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-light border me-2" onClick={() => editBooth(booth)}><BsPencil /></button>
                      <button type="button" className="btn btn-sm btn-light border" onClick={() => deleteBooth(booth.id)}><BsTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="booth-grid">
        {booths.map((booth) => (
          <button type="button" key={booth.id} className={`booth-tile booth-${(booth.status || "available").toLowerCase()}`}>
            <strong>{booth.boothNo}</strong>
            <span>{booth.exhibitor?.company || booth.status}</span>
          </button>
        ))}
      </div>

      <style>{boothStyles}</style>
    </div>
  );
}

function Input({ label, value, onChange, width }) {
  return (
    <div className={width}>
      <label className="form-label fw-semibold">{label}</label>
      <input className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Select({ label, value, onChange, options, width }) {
  return (
    <div className={width}>
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
          <div className="booth-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status) {
  if (status === "Assigned") return "bg-success-subtle text-success";
  if (status === "Reserved") return "bg-warning-subtle text-warning";
  if (status === "Blocked") return "bg-danger-subtle text-danger";
  return "bg-secondary-subtle text-secondary";
}

const boothStyles = `
  .booth-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .booth-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .booth-tile {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    min-height: 86px;
    padding: 12px;
    text-align: left;
  }

  .booth-tile strong,
  .booth-tile span {
    display: block;
  }

  .booth-assigned {
    border-top: 4px solid #16a34a;
  }

  .booth-available {
    border-top: 4px solid #64748b;
  }

  .booth-reserved {
    border-top: 4px solid #ca8a04;
  }

  .booth-blocked {
    border-top: 4px solid #dc2626;
  }
`;

export default Booths;
