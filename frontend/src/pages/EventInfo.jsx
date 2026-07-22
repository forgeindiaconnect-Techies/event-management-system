import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheck,
  FaGlobe,
  FaImage,
  FaInfoCircle,
  FaLink,
  FaMapMarkerAlt,
  FaSave
} from "react-icons/fa";
import api from "../api/axiosConfig";

const EVENT_CATEGORIES = [
  "Education", "Business", "Technology", "Healthcare", "Sports",
  "Product Launch", "Food", "Fitness", "Music", "Entertainment",
  "Conference", "Workshop", "Webinar", "Networking", "Community",
];

function EventInfo() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    async function loadEvent() {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
      const loadedCategory = res.data.eventType || "";
      const standardCategory = EVENT_CATEGORIES.includes(loadedCategory);
      setCustomCategory(loadedCategory && !standardCategory ? loadedCategory : "");
      setForm({
        eventName: res.data.eventName || "",
        description: res.data.description || "",
        eventType: loadedCategory && !standardCategory ? "Other" : loadedCategory,
        eventMode: res.data.eventMode || "IN_PERSON",
        startDateTime: toInputDateTime(res.data.startDateTime),
        endDateTime: toInputDateTime(res.data.endDateTime),
        registrationDeadline: toInputDateTime(res.data.registrationDeadline),
        capacity: res.data.capacity || "",
        availableSeats: res.data.availableSeats || "",
        venue: res.data.venue || "",
        meetingLink: res.data.meetingLink || "",
        bannerUrl: res.data.bannerUrl || "",
        paid: Boolean(res.data.paid),
        ticketPrice: res.data.ticketPrice || 0,
        certificateEnabled: Boolean(res.data.certificateEnabled),
        certificateTitle: res.data.certificateTitle || ""
      });
    }

    loadEvent();
  }, [id]);

  if (!event || !form) {
    return <div className="p-4">Loading...</div>;
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveEvent = async () => {
    setSaving(true);
    setMessage("");

    try {
      if (!form.eventType) {
        setMessage("Please select an event category.");
        setSaving(false);
        return;
      }
      if (form.eventType === "Other" && !customCategory.trim()) {
        setMessage("Please enter the custom event category.");
        setSaving(false);
        return;
      }
      const payload = {
        ...event,
        ...form,
        eventType: form.eventType === "Other" ? customCategory.trim() : form.eventType,
        capacity: Number(form.capacity) || 0,
        availableSeats: Number(form.availableSeats) || 0,
        ticketPrice: Number(form.ticketPrice) || 0,
        paid: Boolean(form.paid),
        certificateEnabled: Boolean(form.certificateEnabled)
      };

      const res = await api.put(`/events/${id}`, payload);
      setEvent(res.data);
      setMessage("Event details saved successfully.");
    } catch (error) {
      setMessage("Unable to save event details.");
    } finally {
      setSaving(false);
    }
  };

  const publishEvent = async () => {
    await saveEvent();

    try {
      const res = await api.put(`/events/${id}/publish`);
      setEvent(res.data);
      setMessage("Event saved and published.");
    } catch (error) {
      setMessage("Event details saved, but publish failed.");
    }
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    document.getElementById(`event-info-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <div className="event-info-editor">
      <div className="event-info-main">
        <div className="event-info-toolbar">
          <div>
            <span className={`event-info-status status-${event.status?.toLowerCase()}`}>
              {event.status}
            </span>
            <h1>Event Info</h1>
            <p>
              Edit the basic event details, summary, location, timing, access link and
              publishing information.
            </p>
          </div>

          <div className="event-info-actions">
            <button type="button" className="event-primary-btn" onClick={publishEvent} disabled={saving}>
              <FaCheck /> Publish
            </button>
          </div>
        </div>

        {message && <div className="event-info-message">{message}</div>}

        <section id="event-info-basic" className="event-info-card">
          <SectionTitle icon={<FaInfoCircle />} title="Basic Details" />

          <FormGroup label="Event Name" required>
            <input
              value={form.eventName}
              onChange={(e) => updateField("eventName", e.target.value)}
              placeholder="Enter event name"
            />
          </FormGroup>

          <FormGroup label="Summary / Description" required>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Write a clear summary for the event page"
              rows={5}
            />
          </FormGroup>

          <div className="event-info-two-col">
            <FormGroup label="Category" required>
              <select value={form.eventType} onChange={(e) => {
                updateField("eventType", e.target.value);
                if (e.target.value !== "Other") setCustomCategory("");
              }}>
                <option value="">Select category</option>
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </FormGroup>

            <FormGroup label="Event Mode">
              <select value={form.eventMode} onChange={(e) => updateField("eventMode", e.target.value)}>
                <option value="IN_PERSON">In Person</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </FormGroup>
          </div>

          {form.eventType === "Other" && (
            <FormGroup label="Enter Event Category" required>
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Example: Pet Show, Fashion Event, Book Fair"
                maxLength={100}
              />
            </FormGroup>
          )}

          <div className="event-access-box">
            <FaGlobe />
            <div>
              <strong>Event Website Access</strong>
              <span>
                {event.status === "PUBLISHED"
                  ? "Public visitors can access this event website."
                  : "This event is in draft. Complete the details and publish when ready."}
              </span>
            </div>
          </div>
        </section>

        <section id="event-info-location" className="event-info-card">
          <SectionTitle icon={<FaCalendarAlt />} title="Location & Time Zone" />

          <div className="event-info-two-col">
            <FormGroup label="Start Date & Time" required>
              <input
                type="datetime-local"
                value={form.startDateTime}
                onChange={(e) => updateField("startDateTime", e.target.value)}
              />
            </FormGroup>

            <FormGroup label="End Date & Time" required>
              <input
                type="datetime-local"
                value={form.endDateTime}
                onChange={(e) => updateField("endDateTime", e.target.value)}
              />
            </FormGroup>
          </div>

          <FormGroup label="Registration Deadline">
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => updateField("registrationDeadline", e.target.value)}
            />
          </FormGroup>

          <FormGroup label="Venue">
            <div className="event-input-icon">
              <FaMapMarkerAlt />
              <input
                value={form.venue}
                onChange={(e) => updateField("venue", e.target.value)}
                placeholder="Venue name, hall, city or address"
              />
            </div>
          </FormGroup>

          <FormGroup label="Meeting / Event Link">
            <div className="event-input-icon">
              <FaLink />
              <input
                value={form.meetingLink}
                onChange={(e) => updateField("meetingLink", e.target.value)}
                placeholder="Zoom, Meet, Teams or custom event link"
              />
            </div>
          </FormGroup>
        </section>

        <section id="event-info-other" className="event-info-card">
          <SectionTitle icon={<FaImage />} title="Other Details" />

          <div className="event-info-two-col">
            <FormGroup label="Capacity">
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Available Seats">
              <input
                type="number"
                min="0"
                value={form.availableSeats}
                onChange={(e) => updateField("availableSeats", e.target.value)}
              />
            </FormGroup>
          </div>

          <div className="event-info-two-col">
            <FormGroup label="Ticket Type">
              <select
                value={form.paid ? "paid" : "free"}
                onChange={(e) => updateField("paid", e.target.value === "paid")}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </FormGroup>

            <FormGroup label="Ticket Price">
              <input
                type="number"
                min="0"
                value={form.ticketPrice}
                onChange={(e) => updateField("ticketPrice", e.target.value)}
                disabled={!form.paid}
              />
            </FormGroup>
          </div>

          <FormGroup label="Event Thumbnail / Banner URL">
            <input
              value={form.bannerUrl}
              onChange={(e) => updateField("bannerUrl", e.target.value)}
              placeholder="Paste banner image URL"
            />
          </FormGroup>

          <label className="event-toggle-row">
            <input
              type="checkbox"
              checked={form.certificateEnabled}
              onChange={(e) => updateField("certificateEnabled", e.target.checked)}
            />
            <span>Enable certificate for this event</span>
          </label>

          <FormGroup label="Certificate Title">
            <input
              value={form.certificateTitle}
              onChange={(e) => updateField("certificateTitle", e.target.value)}
              placeholder="Certificate title"
              disabled={!form.certificateEnabled}
            />
          </FormGroup>
        </section>

        <div className="event-info-bottom-actions">
          <button type="button" className="event-secondary-btn" onClick={saveEvent} disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save Event Details"}
          </button>
        </div>
      </div>

      <aside className="event-info-nav">
        {[
          ["basic", "Basic Details"],
          ["location", "Location & Time Zone"],
          ["other", "Other Details"]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeSection === key ? "active" : ""}
            onClick={() => scrollToSection(key)}
          >
            {label}
          </button>
        ))}
      </aside>

      <style>{eventInfoStyles}</style>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="event-section-title">
      <span>{icon}</span>
      <h2>{title}</h2>
    </div>
  );
}

function FormGroup({ label, required, children }) {
  return (
    <label className="event-form-group">
      <span>
        {label} {required && <b>*</b>}
      </span>
      {children}
    </label>
  );
}

function toInputDateTime(value) {
  if (!value) return "";
  return value.slice(0, 16);
}

const eventInfoStyles = `
  .event-info-editor {
    align-items: flex-start;
    display: grid;
    gap: 28px;
    grid-template-columns: minmax(0, 1fr) 220px;
    padding: 24px;
  }

  .event-info-main {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 920px;
  }

  .event-info-toolbar,
  .event-info-card {
    background: #ffffff;
    border: 1px solid #e3e7ee;
    border-radius: 8px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
  }

  .event-info-toolbar {
    align-items: flex-start;
    display: flex;
    gap: 18px;
    justify-content: space-between;
    padding: 22px 24px;
  }

  .event-info-toolbar h1 {
    color: #0f172a;
    font-size: 26px;
    font-weight: 600;
    margin: 10px 0 6px;
  }

  .event-info-toolbar p {
    color: #475569;
    font-size: 15px;
    line-height: 23px;
    margin: 0;
    max-width: 650px;
  }

  .event-info-status {
    border-radius: 999px;
    color: #ffffff;
    display: inline-flex;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    text-transform: uppercase;
  }

  .status-draft { background: #64748b; }
  .status-published { background: #15803d; }
  .status-completed { background: #4338ca; }
  .status-cancelled { background: #b91c1c; }
  .status-trashed { background: #3f3f46; }

  .event-info-actions {
    display: flex;
    gap: 10px;
  }

  .event-primary-btn,
  .event-secondary-btn {
    align-items: center;
    border: 0;
    border-radius: 6px;
    display: inline-flex;
    font-size: 15px;
    font-weight: 600;
    gap: 8px;
    min-height: 40px;
    padding: 0 16px;
  }

  .event-primary-btn {
    background: #4f46e5;
    color: #ffffff;
  }

  .event-secondary-btn {
    background: #eef2ff;
    color: #4338ca;
  }

  .event-primary-btn:disabled,
  .event-secondary-btn:disabled {
    opacity: 0.65;
  }

  .event-info-message {
    background: #ecfdf5;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    color: #166534;
    font-size: 14px;
    padding: 12px 14px;
  }

  .event-info-card {
    padding: 24px;
    scroll-margin-top: 78px;
  }

  .event-section-title {
    align-items: center;
    display: flex;
    gap: 10px;
    margin-bottom: 22px;
  }

  .event-section-title span {
    align-items: center;
    background: #eef2ff;
    border-radius: 8px;
    color: #4f46e5;
    display: flex;
    height: 38px;
    justify-content: center;
    width: 38px;
  }

  .event-section-title h2 {
    color: #0f172a;
    font-size: 22px;
    font-weight: 600;
    margin: 0;
  }

  .event-info-two-col {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .event-form-group {
    display: block;
    margin-bottom: 18px;
  }

  .event-form-group > span {
    color: #0f172a;
    display: block;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .event-form-group b {
    color: #dc2626;
  }

  .event-form-group input,
  .event-form-group select,
  .event-form-group textarea {
    background: #ffffff;
    border: 1px solid #cfd6e3;
    border-radius: 7px;
    color: #0f172a;
    font-size: 15px;
    outline: none;
    padding: 10px 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    width: 100%;
  }

  .event-form-group textarea {
    resize: vertical;
  }

  .event-form-group input:focus,
  .event-form-group select:focus,
  .event-form-group textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  .event-form-group input:disabled {
    background: #f8fafc;
    color: #94a3b8;
  }

  .event-input-icon {
    align-items: center;
    border: 1px solid #cfd6e3;
    border-radius: 7px;
    display: flex;
    gap: 10px;
    padding: 0 12px;
  }

  .event-input-icon:focus-within {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  .event-input-icon svg {
    color: #64748b;
  }

  .event-input-icon input {
    border: 0;
    box-shadow: none;
    padding-left: 0;
  }

  .event-input-icon input:focus {
    box-shadow: none;
  }

  .event-access-box {
    align-items: center;
    border: 1px solid #e3e7ee;
    border-radius: 8px;
    display: flex;
    gap: 16px;
    padding: 16px;
  }

  .event-access-box svg {
    color: #4f46e5;
    font-size: 28px;
  }

  .event-access-box strong {
    color: #0f172a;
    display: block;
    font-size: 16px;
    font-weight: 600;
  }

  .event-access-box span {
    color: #475569;
    display: block;
    font-size: 14px;
    margin-top: 3px;
  }

  .event-toggle-row {
    align-items: center;
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
  }

  .event-info-bottom-actions {
    display: flex;
    justify-content: flex-end;
    padding: 4px 0 18px;
  }

  .event-info-bottom-actions .event-secondary-btn {
    background: #4f46e5;
    color: #fff;
    min-width: 190px;
    justify-content: center;
  }

  .event-toggle-row input {
    height: 16px;
    width: 16px;
  }

  .event-toggle-row span {
    color: #0f172a;
    font-size: 15px;
    font-weight: 500;
  }

  .event-info-nav {
    border-right: 1px solid #dbe1ea;
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: sticky;
    top: 82px;
  }

  .event-info-nav button {
    background: transparent;
    border: 0;
    border-radius: 6px 0 0 6px;
    color: #0f172a;
    font-size: 15px;
    padding: 11px 14px;
    text-align: right;
  }

  .event-info-nav button.active {
    background: #e5e9ff;
    border-right: 2px solid #4f46e5;
    color: #4f46e5;
    font-weight: 600;
  }

  @media (max-width: 1100px) {
    .event-info-editor {
      grid-template-columns: 1fr;
    }

    .event-info-nav {
      display: none;
    }
  }

  @media (max-width: 720px) {
    .event-info-editor {
      padding: 16px;
    }

    .event-info-toolbar {
      flex-direction: column;
    }

    .event-info-actions,
    .event-info-two-col {
      grid-template-columns: 1fr;
      width: 100%;
    }

    .event-info-actions {
      display: grid;
    }
  }
`;

export default EventInfo;
