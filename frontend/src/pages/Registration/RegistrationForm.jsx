import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsArrowClockwise,
  BsEnvelope,
  BsPlus,
  BsSave,
  BsTextareaT,
  BsTrash
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const emptyField = {
  fieldLabel: "",
  fieldType: "TEXT",
  registrationType: "PARTICIPANT",
  required: false,
  options: ""
};

const registrationTypes = [
  { label: "Participant", value: "PARTICIPANT" },
  { label: "Audience", value: "AUDIENCE" }
];

const fieldTypes = [
  { label: "Text", value: "TEXT" },
  { label: "Email", value: "EMAIL" },
  { label: "Phone", value: "PHONE" },
  { label: "Number", value: "NUMBER" },
  { label: "Date", value: "DATE" },
  { label: "Paragraph", value: "TEXTAREA" },
  { label: "Dropdown", value: "SELECT" },
  { label: "Checkbox", value: "CHECKBOX" }
];

const reservedTicketFieldLabels = new Set([
  "ticket count",
  "ticket quantity",
  "number of tickets",
  "tickets"
]);

function RegistrationForm() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedType, setSelectedType] = useState("PARTICIPANT");
  const [form, setForm] = useState(emptyField);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [registrationAccess, setRegistrationAccess] = useState({
    allowParticipantRegistration: true,
    allowAudienceRegistration: true
  });
  const [message, setMessage] = useState("");

  const loadRegistrationForm = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const [eventRes, fieldsRes] = await Promise.allSettled([
        api.get(`/events/${id}`),
        api.get(`/form-fields/event/${id}`)
      ]);

      if (eventRes.status === "fulfilled") {
        const loadedEvent = eventRes.value.data;
        setEvent(loadedEvent);
        setRegistrationAccess({
          allowParticipantRegistration: loadedEvent.allowParticipantRegistration !== false,
          allowAudienceRegistration: loadedEvent.allowAudienceRegistration !== false
        });
      }

      if (fieldsRes.status === "fulfilled") {
        setFields((fieldsRes.value.data || []).filter((field) => !isReservedTicketField(field)));
      } else {
        setFields([]);
        setMessage("Unable to load registration form fields.");
      }
    } catch {
      setMessage("Unable to load registration form.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRegistrationForm();
  }, [loadRegistrationForm]);

  const currentFields = useMemo(
    () =>
      fields.filter(
        (field) => field.registrationType === selectedType && !isReservedTicketField(field)
      ),
    [fields, selectedType]
  );

  const enabledRegistrationTypes = useMemo(
    () => registrationTypes.filter((type) =>
      type.value === "PARTICIPANT"
        ? registrationAccess.allowParticipantRegistration
        : registrationAccess.allowAudienceRegistration
    ),
    [registrationAccess]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addField = async (e) => {
    e.preventDefault();

    if (!form.fieldLabel.trim()) {
      setMessage("Field label is required.");
      return;
    }

    if ((form.fieldType === "SELECT" || form.fieldType === "CHECKBOX") && !form.options.trim()) {
      setMessage("Options are required for dropdown and checkbox fields.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        fieldLabel: form.fieldLabel.trim(),
        fieldType: form.fieldType,
        registrationType: selectedType,
        required: form.required,
        options: form.options,
        event: { id: Number(id) }
      };

      await api.post("/form-fields", payload);
      setForm({ ...emptyField, registrationType: selectedType });
      setMessage("Registration field added.");
      loadRegistrationForm();
    } catch {
      setMessage("Unable to save registration field.");
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (fieldId) => {
    try {
      setMessage("");
      await api.delete(`/form-fields/${fieldId}`);
      setFields((current) => current.filter((field) => field.id !== fieldId));
      setMessage("Registration field deleted.");
    } catch {
      setMessage("Unable to delete registration field.");
    }
  };

  const changeSelectedType = (value) => {
    setSelectedType(value);
    setForm({ ...emptyField, registrationType: value });
  };

  const toggleRegistrationAccess = (key) => {
    const next = { ...registrationAccess, [key]: !registrationAccess[key] };
    if (!next.allowParticipantRegistration && !next.allowAudienceRegistration) {
      setMessage("At least one registration type must remain enabled.");
      return;
    }

    setMessage("");
    setRegistrationAccess(next);
    const disabledType = key === "allowParticipantRegistration" ? "PARTICIPANT" : "AUDIENCE";
    if (!next[key] && selectedType === disabledType) {
      changeSelectedType(disabledType === "PARTICIPANT" ? "AUDIENCE" : "PARTICIPANT");
    }
  };

  const saveRegistrationAccess = async () => {
    if (!event) return;

    try {
      setAccessSaving(true);
      setMessage("");
      const response = await api.put(`/events/${id}`, { ...event, ...registrationAccess });
      setEvent(response.data);
      setMessage("Allowed registration types saved successfully.");
    } catch (error) {
      const responseData = error.response?.data;
      setMessage(
        (typeof responseData === "string" ? responseData : responseData?.message) ||
          "Unable to save registration types."
      );
    } finally {
      setAccessSaving(false);
    }
  };

  const saveForm = () => {
    setMessage(`${labelForType(selectedType)} registration form saved successfully.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Registration Form
          </h3>
          <p className="text-muted mb-0">
            Customize the public registration form for {event?.eventName || "this event"}.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={loadRegistrationForm}
          disabled={loading}
        >
          <BsArrowClockwise /> {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="card border-0 shadow-sm mb-4 registration-access-card">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h4 className="fw-semibold mb-1" style={{ fontSize: "18px" }}>
                Allowed Registration Types
              </h4>
              <p className="text-muted small mb-0">
                Enable the people who can register. Disabled types are hidden from the public form.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={saveRegistrationAccess}
              disabled={accessSaving || !event}
            >
              <BsSave /> {accessSaving ? "Saving..." : "Save Access"}
            </button>
          </div>

          <div className="registration-access-options">
            <button
              type="button"
              className={registrationAccess.allowParticipantRegistration ? "active" : ""}
              onClick={() => toggleRegistrationAccess("allowParticipantRegistration")}
            >
              <span className="registration-access-check">
                {registrationAccess.allowParticipantRegistration ? "✓" : ""}
              </span>
              <span><b>Participants</b><small>Competitors, runners, performers or contestants</small></span>
            </button>
            <button
              type="button"
              className={registrationAccess.allowAudienceRegistration ? "active" : ""}
              onClick={() => toggleRegistrationAccess("allowAudienceRegistration")}
            >
              <span className="registration-access-check">
                {registrationAccess.allowAudienceRegistration ? "✓" : ""}
              </span>
              <span><b>Audience</b><small>Visitors, spectators, guests or ticket holders</small></span>
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {enabledRegistrationTypes.map((type) => (
          <div className="col-md-6" key={type.value}>
            <button
              type="button"
              className={`registration-type-tab ${selectedType === type.value ? "active" : ""}`}
              onClick={() => changeSelectedType(type.value)}
            >
              <span>{type.label}</span>
              <strong>
                {fields.filter((field) => field.registrationType === type.value).length} fields
              </strong>
            </button>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-xl-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                Add Field
              </h4>
              <p className="text-muted small mb-0">
                This field will appear for {labelForType(selectedType)} registrations.
              </p>
            </div>

            <form className="card-body" onSubmit={addField}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Field Label *</label>
                <input
                  className="form-control"
                  value={form.fieldLabel}
                  onChange={(e) => updateField("fieldLabel", e.target.value)}
                  placeholder="College / Company / Department"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Field Type</label>
                <select
                  className="form-select"
                  value={form.fieldType}
                  onChange={(e) => updateField("fieldType", e.target.value)}
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {(form.fieldType === "SELECT" || form.fieldType === "CHECKBOX") && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Options *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.options}
                    onChange={(e) => updateField("options", e.target.value)}
                    placeholder="One option per line"
                  />
                </div>
              )}

              <div className="form-check form-switch mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="fieldRequired"
                  checked={form.required}
                  onChange={(e) => updateField("required", e.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="fieldRequired">
                  Required field
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 d-inline-flex justify-content-center align-items-center gap-2"
                disabled={saving}
              >
                <BsPlus /> {saving ? "Saving..." : "Add Field"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <div>
                <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                  Form Fields
                </h4>
                <p className="text-muted small mb-0">
                  Fields configured for {labelForType(selectedType)}.
                </p>
              </div>
              <span className="badge bg-primary-subtle text-primary">{currentFields.length} fields</span>
            </div>

            {loading ? (
              <div className="card-body text-center py-5 text-muted">Loading fields...</div>
            ) : currentFields.length === 0 ? (
              <div className="card-body text-center py-5">
                <BsTextareaT className="text-secondary opacity-50 mb-3" size={52} />
                <h4 className="fw-semibold" style={{ fontSize: "18px" }}>
                  No custom fields yet
                </h4>
                <p className="text-muted mb-0">Add fields to customize this registration type.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Options</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFields.map((field) => (
                      <tr key={field.id}>
                        <td className="fw-semibold">{field.fieldLabel}</td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary">
                            {field.fieldType}
                          </span>
                        </td>
                        <td>{field.required ? "Yes" : "No"}</td>
                        <td className="text-muted small">{formatOptions(field.options)}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            onClick={() => deleteField(field.id)}
                          >
                            <BsTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
                Public Form Preview
              </h4>
              <p className="text-muted small mb-0">
                This is how the public registration page will show these fields.
              </p>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <PreviewInput label="First Name" icon={<BsTextareaT />} required />
                <PreviewInput label="Last Name" icon={<BsTextareaT />} required />
                <PreviewInput label="Email" icon={<BsEnvelope />} required />
                <PreviewInput label="Phone Number" icon={<BsTextareaT />} required />
                {currentFields.map((field) => (
                  <PreviewDynamicField key={field.id} field={field} />
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary mt-4 d-inline-flex align-items-center gap-2"
                onClick={saveForm}
              >
                <BsSave /> Save Form
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{registrationFormStyles}</style>
    </div>
  );
}

function PreviewInput({ label, required }) {
  return (
    <div className="col-md-6">
      <label className="form-label fw-semibold">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input className="form-control" placeholder={`Enter ${label.toLowerCase()}`} disabled />
    </div>
  );
}

function PreviewDynamicField({ field }) {
  const options = parseOptions(field.options);

  return (
    <div className="col-md-6">
      <label className="form-label fw-semibold">
        {field.fieldLabel}
        {field.required && <span className="text-danger ms-1">*</span>}
      </label>
      {field.fieldType === "TEXTAREA" ? (
        <textarea className="form-control" rows={3} disabled />
      ) : field.fieldType === "SELECT" ? (
        <select className="form-select" disabled>
          <option>Select option</option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : field.fieldType === "CHECKBOX" ? (
        <div className="d-grid gap-2">
          {options.map((option) => (
            <label className="form-check" key={option}>
              <input className="form-check-input" type="checkbox" disabled />
              <span className="form-check-label">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <input className="form-control" type={inputType(field.fieldType)} disabled />
      )}
    </div>
  );
}

function labelForType(type) {
  return registrationTypes.find((item) => item.value === type)?.label || type;
}

function isReservedTicketField(field) {
  const label = String(field?.fieldLabel || field?.label || "").trim().toLowerCase();
  return reservedTicketFieldLabels.has(label);
}

function inputType(fieldType) {
  if (fieldType === "EMAIL") return "email";
  if (fieldType === "PHONE") return "tel";
  if (fieldType === "NUMBER") return "number";
  if (fieldType === "DATE") return "date";
  return "text";
}

function parseOptions(options) {
  if (!options) return [];
  if (Array.isArray(options)) return options;

  return String(options)
    .split(/\r?\n|,/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function formatOptions(options) {
  const parsedOptions = parseOptions(options);
  return parsedOptions.length > 0 ? parsedOptions.join(", ") : "N/A";
}

const registrationFormStyles = `
  .registration-access-options {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .registration-access-options > button {
    align-items: flex-start;
    background: #fff;
    border: 1px solid #dbe3ef;
    border-radius: 10px;
    color: #334155;
    display: flex;
    gap: 11px;
    padding: 14px;
    text-align: left;
  }

  .registration-access-options > button.active {
    background: #eef2ff;
    border-color: #4f46e5;
    color: #312e81;
  }

  .registration-access-check {
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    display: flex;
    flex: 0 0 22px;
    height: 22px;
    justify-content: center;
  }

  .registration-access-options > button.active .registration-access-check {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  .registration-access-options b,
  .registration-access-options small { display: block; }
  .registration-access-options small { color: #64748b; line-height: 1.4; margin-top: 3px; }

  .registration-type-tab {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    padding: 16px;
    text-align: left;
    width: 100%;
  }

  .registration-type-tab.active {
    background: #eef2ff;
    border-color: #4f46e5;
    color: #4f46e5;
  }

  @media (max-width: 767px) {
    .registration-access-options { grid-template-columns: 1fr; }
  }
`;

export default RegistrationForm;
