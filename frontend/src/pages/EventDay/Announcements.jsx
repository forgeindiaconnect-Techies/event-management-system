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

  const storageKey = `event-day-announcements-${id}`;

  const loadData = async () => {
    try {
      const registrationsRes = await api.get(`/registrations/event/${id}`);
      setRegistrations(registrationsRes.data || []);
    } catch (error) {
      console.log(error);
      setRegistrations([]);
    }

    const saved = localStorage.getItem(storageKey);
    setAnnouncements(saved ? JSON.parse(saved) : []);
  };

  const saveAnnouncements = (nextAnnouncements) => {
    setAnnouncements(nextAnnouncements);
    localStorage.setItem(storageKey, JSON.stringify(nextAnnouncements));
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      setMessage("Announcement title and message are required.");
      return;
    }

    const newAnnouncement = {
      id: Date.now(),
      ...form,
      recipients: recipientCount,
      read: 0,
      createdAt: new Date().toISOString(),
    };

    saveAnnouncements([newAnnouncement, ...announcements]);
    setForm(initialForm);
    setMessage("Announcement saved successfully.");
  };

  const publishAnnouncement = (announcementId) => {
    const next = announcements.map((announcement) =>
      announcement.id === announcementId
        ? {
            ...announcement,
            status: "Published",
            read: Math.round((announcement.recipients || 0) * 0.75),
          }
        : announcement
    );
    saveAnnouncements(next);
    setMessage("Announcement published.");
  };

  const deleteAnnouncement = (announcementId) => {
    saveAnnouncements(announcements.filter((announcement) => announcement.id !== announcementId));
    setMessage("Announcement deleted.");
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
                      type="time"
                      name="scheduledAt"
                      value={form.scheduledAt}
                      onChange={handleChange}
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
                      <th>Read</th>
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
                            {announcement.scheduledAt && (
                              <div className="text-muted small">Scheduled: {announcement.scheduledAt}</div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getStatusClass(announcement.status)}`}>
                              {announcement.status}
                            </span>
                          </td>
                          <td>{announcement.recipients}</td>
                          <td>{announcement.read}</td>
                          <td className="text-end">
                            {announcement.status !== "Published" && (
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => publishAnnouncement(announcement.id)}
                              >
                                <BsSend />
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteAnnouncement(announcement.id)}
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
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status) {
  if (status === "Published") return "text-bg-success";
  if (status === "Scheduled") return "text-bg-primary";
  return "text-bg-secondary";
}

export default Announcements;
