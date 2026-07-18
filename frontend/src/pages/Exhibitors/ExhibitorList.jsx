import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsBuilding,
  BsDownload,
  BsEnvelope,
  BsPencil,
  BsPlus,
  BsSearch,
  BsTelephone,
  BsTrash
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const EXHIBITOR_CATEGORIES = [
  "Startup & Product",
  "Food & Beverage",
  "Merchandise",
  "Technology",
  "Service Provider",
  "College / Student Project",
  "Art & Handcraft",
  "Other"
];

const emptyExhibitor = {
  company: "",
  category: "Technology",
  customCategory: "",
  contact: "",
  email: "",
  phone: "",
  booth: "",
  status: "Pending",
  packageType: "Standard"
};

function ExhibitorList() {
  const { id } = useParams();
  const [exhibitors, setExhibitors] = useState([]);
  const [form, setForm] = useState(emptyExhibitor);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadExhibitors = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get(`/exhibitors/event/${id}`);
      setExhibitors(res.data || []);
    } catch {
      setExhibitors([]);
      setMessage("Unable to load exhibitors.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadExhibitors();
  }, [loadExhibitors]);

  const filteredExhibitors = useMemo(() => {
    const query = search.toLowerCase();

    return exhibitors.filter((exhibitor) => {
      const matchesSearch =
        (exhibitor.company || "").toLowerCase().includes(query) ||
        (exhibitor.contact || "").toLowerCase().includes(query) ||
        (exhibitor.email || "").toLowerCase().includes(query) ||
        (exhibitor.booth || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || exhibitor.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All" ||
        exhibitor.category === categoryFilter ||
        (categoryFilter === "Other" &&
          !EXHIBITOR_CATEGORIES.filter((category) => category !== "Other").includes(
            exhibitor.category
          ));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [exhibitors, search, statusFilter, categoryFilter]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyExhibitor);
    setShowForm(true);
    setMessage("");
  };

  const editExhibitor = (exhibitor) => {
    const savedCategory = exhibitor.category || "Technology";
    const isListedCategory = EXHIBITOR_CATEGORIES.includes(savedCategory);

    setEditingId(exhibitor.id);
    setForm({
      company: exhibitor.company || "",
      category: isListedCategory ? savedCategory : "Other",
      customCategory: isListedCategory ? "" : savedCategory,
      contact: exhibitor.contact || "",
      email: exhibitor.email || "",
      phone: exhibitor.phone || "",
      booth: exhibitor.booth || "",
      status: exhibitor.status || "Pending",
      packageType: exhibitor.packageType || "Standard"
    });
    setShowForm(true);
    setMessage("");
  };

  const saveExhibitor = async (e) => {
    e.preventDefault();

    if (!form.company.trim() || !form.contact.trim() || !form.email.trim()) {
      setMessage("Company, contact person and email are required.");
      return;
    }

    if (form.category === "Other" && !form.customCategory.trim()) {
      setMessage("Enter the exhibitor category.");
      return;
    }

    try {
      const { customCategory, ...exhibitorForm } = form;
      const payload = {
        ...exhibitorForm,
        category: form.category === "Other" ? customCategory.trim() : form.category,
        event: { id: Number(id) }
      };
      const res = editingId
        ? await api.put(`/exhibitors/${editingId}`, payload)
        : await api.post("/exhibitors", payload);

      setExhibitors((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? res.data : item))
          : [res.data, ...current]
      );
      setForm(emptyExhibitor);
      setEditingId(null);
      setShowForm(false);
      setMessage(editingId ? "Exhibitor updated." : "Exhibitor added.");
    } catch {
      setMessage("Unable to save exhibitor.");
    }
  };

  const deleteExhibitor = async (exhibitorId) => {
    try {
      await api.delete(`/exhibitors/${exhibitorId}`);
      setExhibitors((current) => current.filter((item) => item.id !== exhibitorId));
      setMessage("Exhibitor removed.");
    } catch {
      setMessage("Unable to remove exhibitor.");
    }
  };

  const exportExhibitors = () => {
    const headers = ["Company", "Category", "Contact", "Email", "Phone", "Booth", "Status", "Package"];
    const rows = filteredExhibitors.map((item) => [
      item.company,
      item.category,
      item.contact,
      item.email,
      item.phone,
      item.booth,
      item.status,
      item.packageType
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "exhibitors.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmedCount = exhibitors.filter((item) => item.status === "Confirmed").length;
  const pendingCount = exhibitors.filter((item) => item.status === "Pending").length;
  const assignedCount = exhibitors.filter((item) => (item.booth || "").trim()).length;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>Exhibitors</h3>
          <p className="text-muted mb-0">Manage exhibitor companies, contacts, booth allocation and status.</p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={loadExhibitors} disabled={loading}>
            <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" className="btn btn-light border d-inline-flex align-items-center gap-2" onClick={exportExhibitors} disabled={filteredExhibitors.length === 0}>
            <BsDownload /> Export
          </button>
          <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={openCreateForm}>
            <BsPlus /> Add Exhibitor
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<BsBuilding />} label="Total Exhibitors" value={exhibitors.length} />
        <SummaryCard icon={<BsBuilding />} label="Confirmed" value={confirmedCount} />
        <SummaryCard icon={<BsBuilding />} label="Pending" value={pendingCount} />
        <SummaryCard icon={<BsBuilding />} label="Booths Assigned" value={assignedCount} />
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>{editingId ? "Edit Exhibitor" : "Add Exhibitor"}</h4>
            <p className="text-muted small mb-0">Enter company, contact and booth details.</p>
          </div>

          <form className="card-body" onSubmit={saveExhibitor}>
            <div className="row g-3">
              <Input label="Company Name *" value={form.company} onChange={(value) => updateField("company", value)} />
              <Input label="Contact Person *" value={form.contact} onChange={(value) => updateField("contact", value)} />
              <Input label="Email *" value={form.email} onChange={(value) => updateField("email", value)} />
              <Input label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />

              <Select label="Category" value={form.category} onChange={(value) => updateField("category", value)} options={EXHIBITOR_CATEGORIES} width="col-md-3" />
              {form.category === "Other" && (
                <Input label="Enter Category *" value={form.customCategory} onChange={(value) => updateField("customCategory", value)} width="col-md-3" />
              )}
              <Input label="Booth" value={form.booth} onChange={(value) => updateField("booth", value)} width="col-md-3" />
              <Select label="Package" value={form.packageType} onChange={(value) => updateField("packageType", value)} options={["Standard", "Silver", "Gold", "Platinum"]} width="col-md-3" />
              <Select label="Status" value={form.status} onChange={(value) => updateField("status", value)} options={["Pending", "Confirmed", "Rejected", "Inactive"]} width="col-md-3" />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? "Update" : "Save"} Exhibitor</button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label fw-semibold">Search Exhibitors</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><BsSearch /></span>
                <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company, contact, email or booth" />
              </div>
            </div>
            <div className="col-lg-3">
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Pending", "Confirmed", "Rejected", "Inactive"]} width="col-12" />
            </div>
            <div className="col-lg-3">
              <Select label="Category" value={categoryFilter} onChange={setCategoryFilter} options={["All", ...EXHIBITOR_CATEGORIES]} width="col-12" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card-body text-center py-5 text-muted">Loading exhibitors...</div>
        ) : filteredExhibitors.length === 0 ? (
          <div className="card-body text-center py-5">
            <BsBuilding className="text-secondary opacity-50 mb-3" size={52} />
            <h4 className="fw-semibold" style={{ fontSize: "18px" }}>No exhibitors found</h4>
            <p className="text-muted mb-0">Add exhibitors and assign booth details.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Category</th>
                  <th>Booth</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExhibitors.map((exhibitor) => (
                  <tr key={exhibitor.id}>
                    <td className="fw-semibold">{exhibitor.company}</td>
                    <td>
                      <div>{exhibitor.contact}</div>
                      <div className="text-muted small d-flex align-items-center gap-2"><BsEnvelope /> {exhibitor.email}</div>
                      <div className="text-muted small d-flex align-items-center gap-2"><BsTelephone /> {exhibitor.phone || "N/A"}</div>
                    </td>
                    <td><span className="badge bg-info-subtle text-info-emphasis">{exhibitor.category}</span></td>
                    <td>{exhibitor.booth || "Not assigned"}</td>
                    <td><span className="badge bg-primary-subtle text-primary">{exhibitor.packageType}</span></td>
                    <td><span className={`badge ${statusBadge(exhibitor.status)}`}>{exhibitor.status}</span></td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-light border me-2" onClick={() => editExhibitor(exhibitor)}><BsPencil /></button>
                      <button type="button" className="btn btn-sm btn-light border" onClick={() => deleteExhibitor(exhibitor.id)}><BsTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{exhibitorStyles}</style>
    </div>
  );
}

function Input({ label, value, onChange, width = "col-md-6" }) {
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
          <div className="exhibitor-summary-icon">{icon}</div>
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
  if (status === "Confirmed") return "bg-success-subtle text-success";
  if (status === "Rejected") return "bg-danger-subtle text-danger";
  if (status === "Inactive") return "bg-secondary-subtle text-secondary";
  return "bg-warning-subtle text-warning";
}

const exhibitorStyles = `
  .exhibitor-summary-icon {
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

export default ExhibitorList;
