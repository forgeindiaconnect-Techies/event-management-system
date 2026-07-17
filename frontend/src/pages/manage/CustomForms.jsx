import { useState } from "react";
import {
  FaClipboardList,
  FaEdit,
  FaEye,
  FaFileAlt,
  FaPlus,
  FaSave,
  FaTrash
} from "react-icons/fa";

const emptyForm = {
  name: "",
  purpose: "General",
  status: "Draft",
  description: "",
  fields: []
};

const emptyField = {
  label: "",
  type: "Text",
  required: true,
  options: ""
};

function CustomForms() {
  const [forms, setForms] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [field, setField] = useState(emptyField);
  const [message, setMessage] = useState("");

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateField = (key, value) => {
    setField((current) => ({ ...current, [key]: value }));
  };

  const openBuilder = () => {
    setEditingId(null);
    setForm(emptyForm);
    setField(emptyField);
    setBuilderOpen(true);
    setMessage("");
  };

  const editForm = (customForm) => {
    setEditingId(customForm.id);
    setForm(customForm);
    setField(emptyField);
    setBuilderOpen(true);
    setMessage("");
  };

  const addField = () => {
    if (!field.label.trim()) {
      setMessage("Field label is required.");
      return;
    }

    setForm((current) => ({
      ...current,
      fields: [...current.fields, { ...field, id: Date.now() }]
    }));
    setField(emptyField);
    setMessage("Field added.");
  };

  const removeField = (fieldId) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.filter((item) => item.id !== fieldId)
    }));
  };

  const saveForm = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage("Form name is required.");
      return;
    }

    const payload = {
      ...form,
      id: editingId || Date.now()
    };

    setForms((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? payload : item))
        : [payload, ...current]
    );
    setBuilderOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setField(emptyField);
    setMessage(editingId ? "Form updated." : "Form created.");
  };

  const deleteForm = (formId) => {
    setForms((current) => current.filter((item) => item.id !== formId));
    setMessage("Form removed.");
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Custom Forms</h1>
          <p className="text-muted mb-0">
            Build event-specific forms for speakers, volunteers, sponsors and attendees.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={openBuilder}
        >
          <FaPlus /> Create Form
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {builderOpen && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h2 className="h5 fw-semibold mb-1">
              {editingId ? "Edit Form" : "Create Form"}
            </h2>
            <p className="text-muted small mb-0">
              Configure form details and add custom fields.
            </p>
          </div>

          <form className="card-body" onSubmit={saveForm}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Form Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Speaker Registration Form"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Purpose</label>
                <select
                  className="form-select"
                  value={form.purpose}
                  onChange={(e) => updateForm("purpose", e.target.value)}
                >
                  <option>General</option>
                  <option>Speaker</option>
                  <option>Volunteer</option>
                  <option>Sponsor</option>
                  <option>Attendee</option>
                  <option>Feedback</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                >
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Explain who should fill this form"
                />
              </div>
            </div>

            <div className="card bg-light border-0 mt-4">
              <div className="card-body">
                <h3 className="h6 fw-semibold mb-3">Add Field</h3>
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Field Label</label>
                    <input
                      className="form-control"
                      value={field.label}
                      onChange={(e) => updateField("label", e.target.value)}
                      placeholder="College / Company"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Type</label>
                    <select
                      className="form-select"
                      value={field.type}
                      onChange={(e) => updateField("type", e.target.value)}
                    >
                      <option>Text</option>
                      <option>Email</option>
                      <option>Phone</option>
                      <option>Number</option>
                      <option>Date</option>
                      <option>Textarea</option>
                      <option>Select</option>
                      <option>Checkbox</option>
                      <option>File Upload</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Required</label>
                    <select
                      className="form-select"
                      value={field.required ? "Yes" : "No"}
                      onChange={(e) => updateField("required", e.target.value === "Yes")}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100 d-inline-flex justify-content-center align-items-center gap-2"
                      onClick={addField}
                    >
                      <FaPlus /> Add Field
                    </button>
                  </div>

                  {(field.type === "Select" || field.type === "Checkbox") && (
                    <div className="col-12">
                      <label className="form-label fw-semibold">Options</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={field.options}
                        onChange={(e) => updateField("options", e.target.value)}
                        placeholder="One option per line"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="h6 fw-semibold">Fields ({form.fields.length})</h3>
              {form.fields.length === 0 ? (
                <div className="border border-dashed rounded-3 p-4 text-center text-muted">
                  No fields added yet.
                </div>
              ) : (
                <div className="d-grid gap-2">
                  {form.fields.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-3 p-3 d-flex justify-content-between align-items-center gap-3"
                    >
                      <div>
                        <div className="fw-semibold">{item.label}</div>
                        <div className="text-muted small">
                          {item.type} - {item.required ? "Required" : "Optional"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border"
                        onClick={() => removeField(item.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setBuilderOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
                <FaSave /> {editingId ? "Update Form" : "Save Form"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<FaClipboardList />} label="Forms" value={forms.length} />
        <SummaryCard
          icon={<FaFileAlt />}
          label="Active"
          value={forms.filter((item) => item.status === "Active").length}
        />
        <SummaryCard
          icon={<FaEdit />}
          label="Draft"
          value={forms.filter((item) => item.status === "Draft").length}
        />
        <SummaryCard
          icon={<FaEye />}
          label="Fields"
          value={forms.reduce((total, item) => total + item.fields.length, 0)}
        />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h2 className="h5 fw-semibold mb-1">Created Forms</h2>
          <p className="text-muted small mb-0">Manage custom forms for this event.</p>
        </div>

        {forms.length === 0 ? (
          <div className="card-body text-center py-5">
            <FaClipboardList className="text-secondary opacity-50 mb-3" size={52} />
            <h3 className="h5 fw-semibold">No forms created yet</h3>
            <p className="text-muted">Create a form and add custom fields.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Purpose</th>
                  <th>Fields</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((customForm) => (
                  <tr key={customForm.id}>
                    <td>
                      <div className="fw-semibold">{customForm.name}</div>
                      <div className="text-muted small">{customForm.description || "No description"}</div>
                    </td>
                    <td>{customForm.purpose}</td>
                    <td>{customForm.fields.length}</td>
                    <td>
                      <span className={`badge ${statusBadge(customForm.status)}`}>
                        {customForm.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border me-2"
                        onClick={() => editForm(customForm)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border"
                        onClick={() => deleteForm(customForm.id)}
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

      <style>{formStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="custom-form-summary-icon">{icon}</div>
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
  if (status === "Active") return "bg-success-subtle text-success";
  if (status === "Closed") return "bg-secondary-subtle text-secondary";
  return "bg-warning-subtle text-warning";
}

const formStyles = `
  .custom-form-summary-icon {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .border-dashed {
    border-style: dashed !important;
  }
`;

export default CustomForms;
