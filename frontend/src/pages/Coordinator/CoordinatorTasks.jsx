import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import { loadRoleAssignments } from "../../utils/roleAssignments";
import "../../styles/Admin.css";
import {
  BsListTask,
  BsSend,
  BsArrowClockwise,
} from "react-icons/bs";

function CoordinatorTasks() {
  const [assignments, setAssignments] = useState([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    assignmentId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const coordinatorId = localStorage.getItem("userId");

    try {
      const coordRes = await api.get(
        `/coordinator-assignments/coordinator/${coordinatorId}`
      );

      const assignedEvents = coordRes.data || [];
      setAssignments(assignedEvents);

      const volunteerResults = await Promise.all(
        assignedEvents.map((assignment) =>
          api.get(`/volunteer-assignments/event/${assignment.event?.id}`)
        )
      );

      setVolunteerAssignments(
        volunteerResults.flatMap((res) => res.data || [])
      );

      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load task data.");
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createTask = async (e) => {
    e.preventDefault();

    if (!form.assignmentId || !form.title) {
      setMessage("Please select volunteer and enter task title.");
      return;
    }

    try {
      await api.post("/volunteer-tasks", {
        title: form.title,
        description: form.description,
        priority: form.priority,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        assignment: { id: Number(form.assignmentId) },
        assignedBy: { id: Number(localStorage.getItem("userId")) },
      });

      setMessage("Task assigned successfully.");

      setForm({
        assignmentId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        startTime: "",
        endTime: "",
      });
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to assign task.");
    }
  };

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            Volunteer Tasks
          </h1>
          <p className="text-muted mb-0">
            Assign tasks to volunteers for your coordinated events.
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
          <BsListTask className="me-2" />
          Assign New Task
        </h4>

        <form onSubmit={createTask}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Volunteer</label>
              <select
                className="form-select"
                name="assignmentId"
                value={form.assignmentId}
                onChange={handleChange}
              >
                <option value="">Select volunteer</option>
                {volunteerAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.volunteer?.firstName}{" "}
                    {assignment.volunteer?.lastName} -{" "}
                    {assignment.event?.eventName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Priority</label>
              <select
                className="form-select"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Task Title</label>
              <input
                className="form-control"
                name="title"
                placeholder="Registration desk, hall setup..."
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Start Time</label>
              <input
                className="form-control"
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">End Time</label>
              <input
                className="form-control"
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                rows="3"
                name="description"
                placeholder="Explain the task details..."
                value={form.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="btn btn-primary mt-4">
            <BsSend className="me-2" />
            Assign Task
          </button>
        </form>
      </div>
    </RoleLayout>
  );
}

export default CoordinatorTasks;
