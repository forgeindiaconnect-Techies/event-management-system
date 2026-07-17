import { useMemo, useState } from "react";
import {
  FaBriefcase,
  FaCog,
  FaEdit,
  FaEnvelope,
  FaGlobe,
  FaLayerGroup,
  FaPlus,
  FaSave,
  FaTrash
} from "react-icons/fa";

const emptySponsor = {
  name: "",
  category: "Gold",
  contactEmail: "",
  website: "",
  logoUrl: "",
  description: "",
  status: "Prospect"
};

function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [categories, setCategories] = useState(["Title", "Platinum", "Gold", "Silver", "Community"]);
  const [newCategory, setNewCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySponsor);
  const [settings, setSettings] = useState({
    showOnPublicPage: true,
    showLogoOnTicket: false,
    requireLogo: true,
    allowWebsiteLink: true
  });
  const [message, setMessage] = useState("");

  const confirmedCount = sponsors.filter((sponsor) => sponsor.status === "Confirmed").length;
  const categoryCount = useMemo(() => new Set(sponsors.map((s) => s.category)).size, [sponsors]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptySponsor);
    setShowForm(true);
    setMessage("");
  };

  const editSponsor = (sponsor) => {
    setEditingId(sponsor.id);
    setForm(sponsor);
    setShowForm(true);
    setMessage("");
  };

  const deleteSponsor = (sponsorId) => {
    setSponsors((current) => current.filter((sponsor) => sponsor.id !== sponsorId));
    setMessage("Sponsor removed.");
  };

  const saveSponsor = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage("Sponsor name is required.");
      return;
    }

    const payload = {
      ...form,
      id: editingId || Date.now()
    };

    setSponsors((current) =>
      editingId
        ? current.map((sponsor) => (sponsor.id === editingId ? payload : sponsor))
        : [...current, payload]
    );

    setShowForm(false);
    setEditingId(null);
    setForm(emptySponsor);
    setMessage(editingId ? "Sponsor updated." : "Sponsor added.");
  };

  const addCategory = () => {
    const category = newCategory.trim();

    if (!category) return;
    if (categories.includes(category)) {
      setMessage("Sponsor category already exists.");
      return;
    }

    setCategories((current) => [...current, category]);
    setNewCategory("");
    setMessage("Sponsor category added.");
  };

  const removeCategory = (category) => {
    setCategories((current) => current.filter((item) => item !== category));
    setSponsors((current) =>
      current.map((sponsor) =>
        sponsor.category === category ? { ...sponsor, category: "Gold" } : sponsor
      )
    );
  };

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Sponsors</h1>
          <p className="text-muted mb-0">
            Add sponsors, organize them by category and control sponsor display settings.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={openAddForm}
        >
          <FaPlus /> Add Sponsor
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 fw-semibold mb-1">
              {editingId ? "Edit Sponsor" : "Add Sponsor"}
            </h2>
            <p className="text-muted small mb-0">
              Enter sponsor details, category, contact and branding information.
            </p>
          </div>

          <form className="card-body" onSubmit={saveSponsor}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Sponsor Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Company or sponsor name"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  placeholder="sponsor@example.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Website</label>
                <input
                  className="form-control"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Logo URL</label>
                <input
                  className="form-control"
                  value={form.logoUrl}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                  placeholder="Paste sponsor logo URL"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Short sponsor description or notes"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
                <FaSave /> {editingId ? "Update Sponsor" : "Save Sponsor"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<FaBriefcase />} label="Sponsors" value={sponsors.length} />
        <SummaryCard icon={<FaLayerGroup />} label="Used Categories" value={categoryCount} />
        <SummaryCard icon={<FaGlobe />} label="Public Display" value={settings.showOnPublicPage ? "On" : "Off"} />
        <SummaryCard icon={<FaEnvelope />} label="Confirmed" value={confirmedCount} />
      </div>

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between gap-2">
              <div>
                <h2 className="h5 fw-semibold mb-1">Sponsor List</h2>
                <p className="text-muted small mb-0">
                  Sponsors added by the user will appear here.
                </p>
              </div>
            </div>

            {sponsors.length === 0 ? (
              <div className="card-body text-center py-5">
                <FaBriefcase className="text-secondary opacity-50 mb-3" size={52} />
                <h3 className="h5 fw-semibold">No sponsors added yet</h3>
                <p className="text-muted">Click Add Sponsor to create the first sponsor.</p>
                <button
                  type="button"
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  onClick={openAddForm}
                >
                  <FaPlus /> Add Sponsor
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Sponsor</th>
                      <th>Category</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.map((sponsor) => (
                      <tr key={sponsor.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="sponsor-logo">
                              {sponsor.logoUrl ? (
                                <img src={sponsor.logoUrl} alt={sponsor.name} />
                              ) : (
                                sponsor.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="fw-semibold">{sponsor.name}</div>
                              <div className="text-muted small">
                                {sponsor.website || "Website not added"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary">
                            {sponsor.category}
                          </span>
                        </td>
                        <td>{sponsor.contactEmail || "Not added"}</td>
                        <td>
                          <span className={`badge ${statusBadge(sponsor.status)}`}>
                            {sponsor.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border me-2"
                            onClick={() => editSponsor(sponsor)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            onClick={() => deleteSponsor(sponsor.id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaCog className="text-primary" />
                <h2 className="h5 fw-semibold mb-0">Sponsor Settings</h2>
              </div>

              <SettingToggle
                label="Show sponsors on public event page"
                checked={settings.showOnPublicPage}
                onChange={(value) => updateSetting("showOnPublicPage", value)}
              />
              <SettingToggle
                label="Show sponsor logo on ticket"
                checked={settings.showLogoOnTicket}
                onChange={(value) => updateSetting("showLogoOnTicket", value)}
              />
              <SettingToggle
                label="Require sponsor logo"
                checked={settings.requireLogo}
                onChange={(value) => updateSetting("requireLogo", value)}
              />
              <SettingToggle
                label="Allow website link"
                checked={settings.allowWebsiteLink}
                onChange={(value) => updateSetting("allowWebsiteLink", value)}
              />
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaLayerGroup className="text-primary" />
                <h2 className="h5 fw-semibold mb-0">Sponsor Categories</h2>
              </div>

              <div className="input-group mb-3">
                <input
                  className="form-control"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add category"
                />
                <button type="button" className="btn btn-primary" onClick={addCategory}>
                  Add
                </button>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 px-3 py-2"
                  >
                    {category}
                    <button
                      type="button"
                      className="btn-close sponsor-category-close"
                      aria-label={`Remove ${category}`}
                      onClick={() => removeCategory(category)}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{sponsorStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="sponsor-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, checked, onChange }) {
  return (
    <label className="d-flex justify-content-between align-items-center gap-3 border-bottom py-3">
      <span className="small text-muted">{label}</span>
      <input
        className="form-check-input m-0"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function statusBadge(status) {
  if (status === "Confirmed") return "bg-success-subtle text-success";
  if (status === "Contacted") return "bg-info-subtle text-info";
  if (status === "Declined") return "bg-danger-subtle text-danger";
  return "bg-warning-subtle text-warning";
}

const sponsorStyles = `
  .sponsor-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .sponsor-logo {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    flex: 0 0 42px;
    font-size: 13px;
    font-weight: 700;
    height: 42px;
    justify-content: center;
    overflow: hidden;
    width: 42px;
  }

  .sponsor-logo img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }

  .sponsor-category-close {
    height: 8px;
    width: 8px;
  }
`;

export default Sponsors;
