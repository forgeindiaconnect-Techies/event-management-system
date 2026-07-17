import { useEffect, useState } from "react";
import OrganizerLayout from "../layouts/OrganizerLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import { BsPeople, BsSend, BsArrowClockwise } from "react-icons/bs";

function OrganizerTeamAssignment() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    role: "Staff",
    eventId: "",
    userId: "",
    duty: "",
  });
  const [message, setMessage] = useState("");

 const roles = [
  "Staff",
  "COORDINATOR",
  "VOLUNTEER",
  "SPEAKER",
  "CHIEF_GUEST",
];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const organizerId = Number(localStorage.getItem("userId"));
    const portalId = Number(localStorage.getItem("portalId"));

    try {
      const eventRes = await api.get(`/events/organizer/${organizerId}`);
      const userRes = await api.get(`/users/portal/${portalId}`);

      const myEvents = eventRes.data || [];

      setEvents(myEvents);
      setUsers(userRes.data || []);

      setForm((prev) => ({
        ...prev,
        eventId: myEvents[0]?.id || "",
      }));

      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load team assignment data.");
    }
  };

  const filteredUsers = users.filter(
    (user) => user.role?.roleName === form.role
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const assignMember = async (e) => {
  e.preventDefault();

  if (!form.eventId || !form.userId) {
    setMessage("Please select event and user.");
    return;
  }

  let payload = {};
  let endpoint = "";

  if (form.role === "Staff") {
    endpoint = "/staff-assignments";

    payload = {
      duty: form.duty,
      event: { id: Number(form.eventId) },
      staff: { id: Number(form.userId) },
      assignedBy: { id: Number(localStorage.getItem("userId")) },
    };
  }

  if (form.role === "COORDINATOR") {
    endpoint = "/coordinator-assignments";

    payload = {
      event: { id: Number(form.eventId) },
      coordinator: { id: Number(form.userId) },
      assignedBy: { id: Number(localStorage.getItem("userId")) },
    };
  }

  if (form.role === "VOLUNTEER") {
    endpoint = "/volunteer-assignments";

    payload = {
      duty: form.duty,
      event: { id: Number(form.eventId) },
      volunteer: { id: Number(form.userId) },
      assignedBy: { id: Number(localStorage.getItem("userId")) },
    };
  }

  if (form.role === "SPEAKER") {
  endpoint = "/speaker-assignments";

  payload = {
    sessionTitle: form.duty,
    topic: form.duty,
    event: { id: Number(form.eventId) },
    speaker: { id: Number(form.userId) },
    assignedBy: { id: Number(localStorage.getItem("userId")) },
  };
}

if (form.role === "CHIEF_GUEST") {
  endpoint = "/chief-guest-assignments";

  payload = {
    roleDescription: form.duty,
    event: { id: Number(form.eventId) },
    chiefGuest: { id: Number(form.userId) },
    assignedBy: { id: Number(localStorage.getItem("userId")) },
  };
}

  try {
    await api.post(endpoint, payload);
    setMessage("Team member assigned successfully.");

    setForm({
      role: "Staff",
      eventId: events[0]?.id || "",
      userId: "",
      duty: "",
    });
  } catch (error) {
    console.log(error);
    setMessage(error.response?.data?.message || "Assignment failed.");
  }
};

  return (
    <OrganizerLayout>
      <div className="organizer-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Team Assignment
          </h1>
          <p className="text-muted mb-0">
            Assign staff, coordinators, and volunteers to organizer events.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadData}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="admin-bento-card">
        <h4 className="fw-bold mb-4">
          <BsPeople className="me-2" />
          Assign Team Member
        </h4>

        <form onSubmit={assignMember}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Role</label>
              <select
                className="form-select"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Event</label>
              <select
                className="form-select"
                name="eventId"
                value={form.eventId}
                onChange={handleChange}
              >
                <option value="">Select event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">User</label>
              <select
                className="form-select"
                name="userId"
                value={form.userId}
                onChange={handleChange}
              >
                <option value="">Select user</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            {(form.role === "Staff" ||
  form.role === "VOLUNTEER" ||
  form.role === "SPEAKER" ||
  form.role === "CHIEF_GUEST") && (
              <div className="col-md-6">
                <label className="form-label fw-semibold">Duty</label>
                <input
                  className="form-control"
                  name="duty"
                  placeholder="Registration desk, ticket verification..."
                  value={form.duty}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <button className="btn btn-primary mt-4">
            <BsSend className="me-2" />
            Assign Member
          </button>
        </form>
      </div>
    </OrganizerLayout>
  );
}

export default OrganizerTeamAssignment;
