import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BsMegaphone, BsPlusLg, BsSend, BsTrash } from "react-icons/bs";
import api from "../../api/axiosConfig";

const initialForm = {
  title: "",
  message: "",
  audience: "All Attendees",
  status: "Draft",
  scheduledAt: "",
};

function Announcements() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [registrationsRes, announcementsRes] = await Promise.all([
        api.get(`/registrations/event/${id}`),
        api.get(`/events/${id}/announcements`),
      ]);
      setRegistrations(registrationsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setRegistrations([]);
      setAnnouncements([]);
      setMessage("Unable to load announcements.");
    }
  };

  const recipientCount = useMemo(() => {
    if (form.audience === "Checked-In Only") {
      return registrations.filter((registration) => registration.attended).length;
    }

    if (form.audience === "Pending Check-In") {
      return registrations.filter((registration) => !registration.attended).length;
    }

    return registrations.length;
  }, [form.audience, registrations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      setMessage("Announcement title and message are required.");
      return;
    }

    if (form.status === "Scheduled" && !form.scheduledAt) {
      setMessage("Choose a future date and time for the scheduled announcement.");
      return;
    }

    try {
      const payload = {
        title: form.title,
        message: form.message,
        audience: form.audience.toUpperCase().replaceAll(" ", "_").replaceAll("-", "_"),
        status: form.status.toUpperCase(),
        scheduledAt: form.status === "Scheduled"
          ? new Date(form.scheduledAt).toISOString().slice(0, 19)
          : null,
      };
      const response = await api.post(`/events/${id}/announcements`, payload);
      setAnnouncements((current) => [response.data, ...current]);
      setForm(initialForm);
      setMessage(
        form.status === "Draft"
          ? "Announcement saved as a draft."
          : `${response.data.recipientCount} announcement emails queued successfully.`
      );
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || "Unable to save announcement.");
    }
  };

  const publishAnnouncement = async (announcementId) => {
    try {
      const response = await api.post(`/events/${id}/announcements/${announcementId}/publish`);
      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === announcementId ? response.data : announcement
        )
      );
      setMessage("Announcement emails queued for delivery.");
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || "Unable to publish announcement.");
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    try {
      await api.delete(`/events/${id}/announcements/${announcementId}`);
      setAnnouncements((current) =>
        current.filter((announcement) => announcement.id !== announcementId)
      );
      setMessage("Draft announcement deleted.");
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || "Unable to delete announcement.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Announcements
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Prepare live event updates for attendees and checked-in guests.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 text-primary fw-semibold">
          <BsMegaphone />
          <span>{announcements.length} Messages</span>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                New Announcement
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    className="form-control"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Lunch break, session change..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Write announcement content"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Audience</label>
                  <select className="form-select" name="audience" value={form.audience} onChange={handleChange}>
                    <option>All Attendees</option>
                    <option>Checked-In Only</option>
                    <option>Pending Check-In</option>
                  </select>
                  <div className="text-muted small mt-1">{recipientCount} recipients</div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      <option>Draft</option>
                      <option>Scheduled</option>
                      <option>Published</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Schedule</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      name="scheduledAt"
                      value={form.scheduledAt}
                      onChange={handleChange}
                      disabled={form.status !== "Scheduled"}
                      min={toDateTimeLocalValue(new Date())}
                    />
                  </div>
                </div>

                <button className="btn btn-primary d-flex align-items-center gap-2">
                  <BsPlusLg /> Save Announcement
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                Announcement List
              </h5>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Announcement</th>
                      <th>Status</th>
                      <th>Recipients</th>
                      <th>Sent</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          No announcements created yet.
                        </td>
                      </tr>
                    ) : (
                      announcements.map((announcement) => (
                        <tr key={announcement.id}>
                          <td>
                            <div className="fw-semibold">{announcement.title}</div>
                            <div className="text-muted small">{announcement.message}</div>
                            {announcement.scheduledAt && announcement.status === "SCHEDULED" && (
                              <div className="text-muted small">Scheduled: {formatScheduledTime(announcement.scheduledAt)}</div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getStatusClass(announcement.status)}`}>
                              {formatLabel(announcement.status)}
                            </span>
                          </td>
                          <td>{announcement.recipientCount}</td>
                          <td>{announcement.sentCount}</td>
                          <td className="text-end">
                            {announcement.status === "DRAFT" && (
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => publishAnnouncement(announcement.id)}
                              >
                                <BsSend />
                              </button>
                            )}
                            {announcement.status === "DRAFT" && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteAnnouncement(announcement.id)}
                              >
                                <BsTrash />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status) {
  if (status === "PUBLISHED") return "text-bg-success";
  if (status === "SCHEDULED") return "text-bg-primary";
  return "text-bg-secondary";
}

function formatLabel(value = "") {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatScheduledTime(value) {
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(timestamp).toLocaleString();
}

function toDateTimeLocalValue(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default Announcements;
