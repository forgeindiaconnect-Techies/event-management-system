import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsCheck2Circle,
  BsEye,
  BsGripVertical,
  BsPencilSquare,
  BsPlusLg,
  BsTrash,
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const initialForm = {
  fieldLabel: "",
  fieldType: "Text",
  placeholderText: "",
  required: true,
  active: true,
  displayOrder: 1,
  optionsText: "",
};

const fieldTypes = [
  "Text",
  "Textarea",
  "Email",
  "Phone",
  "Number",
  "Select",
  "Checkbox",
  "File Upload",
  "URL",
];

const defaultFields = [
  {
    fieldLabel: "Presentation Title",
    fieldType: "Text",
    placeholderText: "Enter presentation title",
    required: true,
    active: true,
    displayOrder: 1,
    optionsText: "",
  },
  {
    fieldLabel: "Abstract Description",
    fieldType: "Textarea",
    placeholderText: "Enter abstract summary",
    required: true,
    active: true,
    displayOrder: 2,
    optionsText: "",
  },
  {
    fieldLabel: "Author Email",
    fieldType: "Email",
    placeholderText: "Enter author email",
    required: true,
    active: true,
    displayOrder: 3,
    optionsText: "",
  },
];

function AbstractForms() {
  const { id } = useParams();
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFields();
  }, [id]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/abstract-form-fields/event/${id}`);
      setFields(res.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setFields([]);
      setMessage("Unable to load abstract form fields.");
    } finally {
      setLoading(false);
    }
  };

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [fields]
  );

  const activeFields = fields.filter((field) => field.active).length;
  const requiredFields = fields.filter((field) => field.required).length;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      displayOrder: fields.length + 1,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fieldLabel.trim()) {
      setMessage("Field label is required.");
      return;
    }

    const payload = {
      ...form,
      displayOrder: Number(form.displayOrder || 0),
      event: { id: Number(id) },
    };

    try {
      const res = editingId
        ? await api.put(`/abstract-form-fields/${editingId}`, payload)
        : await api.post("/abstract-form-fields", payload);

      setFields((current) =>
        editingId
          ? current.map((field) => (field.id === editingId ? res.data : field))
          : [...current, res.data]
      );
      resetForm();
      setMessage(editingId ? "Form field updated successfully." : "Form field added successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to save abstract form field.");
    }
  };

  const editField = (field) => {
    setEditingId(field.id);
    setForm({
      fieldLabel: field.fieldLabel || "",
      fieldType: field.fieldType || "Text",
      placeholderText: field.placeholderText || "",
      required: Boolean(field.required),
      active: field.active !== false,
      displayOrder: field.displayOrder || 1,
      optionsText: field.optionsText || "",
    });
  };

  const deleteField = async (fieldId) => {
    try {
      await api.delete(`/abstract-form-fields/${fieldId}`);
      setFields((current) => current.filter((field) => field.id !== fieldId));
      if (editingId === fieldId) resetForm();
      setMessage("Form field deleted successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to delete form field.");
    }
  };

  const createDefaultFields = async () => {
    try {
      setLoading(true);
      const created = await Promise.all(
        defaultFields.map((field) =>
          api.post("/abstract-form-fields", {
            ...field,
            event: { id: Number(id) },
          })
        )
      );
      setFields(created.map((res) => res.data));
      setMessage("Default abstract form created successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to create default abstract form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Abstract Forms
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Customize the abstract submission fields shown to authors.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <span className="badge text-bg-primary px-3 py-2">{activeFields} Active</span>
          <span className="badge text-bg-light border px-3 py-2">{requiredFields} Required</span>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                {editingId ? "Edit Field" : "Add Field"}
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Field Label</label>
                  <input
                    className="form-control"
                    name="fieldLabel"
                    value={form.fieldLabel}
                    onChange={handleChange}
                    placeholder="Author name, college, file..."
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label fw-semibold">Field Type</label>
                    <select
                      className="form-select"
                      name="fieldType"
                      value={form.fieldType}
                      onChange={handleChange}
                    >
                      {fieldTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Order</label>
                    <input
                      className="form-control"
                      name="displayOrder"
                      type="number"
                      min="1"
                      value={form.displayOrder}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="my-3">
                  <label className="form-label fw-semibold">Placeholder</label>
                  <input
                    className="form-control"
                    name="placeholderText"
                    value={form.placeholderText}
                    onChange={handleChange}
                    placeholder="Input helper text"
                  />
                </div>

                {(form.fieldType === "Select" || form.fieldType === "Checkbox") && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Options</label>
                    <textarea
                      className="form-control"
                      name="optionsText"
                      rows="3"
                      value={form.optionsText}
                      onChange={handleChange}
                      placeholder="One option per line"
                    />
                  </div>
                )}

                <div className="d-flex gap-4 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="abstractRequired"
                      name="required"
                      checked={form.required}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="abstractRequired">
                      Required
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="abstractActive"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="abstractActive">
                      Active
                    </label>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary d-flex align-items-center gap-2" type="submit">
                    <BsPlusLg /> {editingId ? "Update" : "Add"}
                  </button>
                  {editingId && (
                    <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h5 className="fw-semibold mb-0" style={{ fontSize: "17px" }}>
                  Form Fields
                </h5>
                {fields.length === 0 && (
                  <button className="btn btn-outline-primary btn-sm" onClick={createDefaultFields}>
                    Create Default Form
                  </button>
                )}
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "48px" }}></th>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Rules</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          Loading form fields...
                        </td>
                      </tr>
                    ) : sortedFields.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No abstract form fields added yet.
                        </td>
                      </tr>
                    ) : (
                      sortedFields.map((field) => (
                        <tr key={field.id}>
                          <td className="text-muted">
                            <BsGripVertical />
                          </td>
                          <td>
                            <div className="fw-semibold">{field.fieldLabel}</div>
                            <div className="text-muted small">
                              {field.placeholderText || "No placeholder"}
                            </div>
                          </td>
                          <td>{field.fieldType}</td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              {field.required && <span className="badge text-bg-danger">Required</span>}
                              {field.active ? (
                                <span className="badge text-bg-success">Active</span>
                              ) : (
                                <span className="badge text-bg-secondary">Hidden</span>
                              )}
                            </div>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => editField(field)}
                            >
                              <BsPencilSquare />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteField(field.id)}
                            >
                              <BsTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold d-flex align-items-center gap-2 mb-3" style={{ fontSize: "17px" }}>
                <BsEye /> Preview
              </h5>

              {sortedFields.filter((field) => field.active).length === 0 ? (
                <div className="text-muted">Active fields will appear here.</div>
              ) : (
                <div className="row g-3">
                  {sortedFields
                    .filter((field) => field.active)
                    .map((field) => (
                      <div className="col-md-6" key={field.id}>
                        <label className="form-label fw-semibold">
                          {field.fieldLabel}
                          {field.required && <span className="text-danger"> *</span>}
                        </label>
                        <PreviewField field={field} />
                      </div>
                    ))}
                </div>
              )}

              <div className="d-flex align-items-center gap-2 text-success mt-4">
                <BsCheck2Circle />
                <span className="small">This preview reflects the active abstract submission fields.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ field }) {
  const placeholder = field.placeholderText || field.fieldLabel;
  const options = (field.optionsText || "")
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);

  if (field.fieldType === "Textarea") {
    return <textarea className="form-control" rows="3" placeholder={placeholder} disabled />;
  }

  if (field.fieldType === "Select") {
    return (
      <select className="form-select" disabled>
        <option>{placeholder}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.fieldType === "Checkbox") {
    return (
      <div className="border rounded p-3 bg-light">
        {(options.length ? options : ["Option 1"]).map((option) => (
          <div className="form-check" key={option}>
            <input className="form-check-input" type="checkbox" disabled />
            <label className="form-check-label">{option}</label>
          </div>
        ))}
      </div>
    );
  }

  if (field.fieldType === "File Upload") {
    return <input className="form-control" type="file" disabled />;
  }

  const typeMap = {
    Email: "email",
    Phone: "tel",
    Number: "number",
    URL: "url",
  };

  return <input className="form-control" type={typeMap[field.fieldType] || "text"} placeholder={placeholder} disabled />;
}

export default AbstractForms;
