import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";
import api from "../../api/axiosConfig";
import "../../styles/Admin.css";
import {
  BsListTask,
  BsSearch,
  BsArrowClockwise,
  BsCheckCircle,
} from "react-icons/bs";

function VolunteerTasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const volunteerId = localStorage.getItem("userId");

    try {
      const response = await api.get(`/volunteer-tasks/volunteer/${volunteerId}`);
      setTasks(response.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load tasks.");
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/volunteer-tasks/${taskId}/status?status=${status}`);
      setMessage("Task status updated successfully.");
      loadTasks();
    } catch (error) {
      console.log(error);
      setMessage("Unable to update task status.");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const title = task.title?.toLowerCase() || "";
    const eventName = task.assignment?.event?.eventName?.toLowerCase() || "";

    const matchesSearch =
      title.includes(search.toLowerCase()) ||
      eventName.includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "ALL") return true;

    return task.status === filter;
  });

  const statusBadge = (status) => {
    if (status === "COMPLETED") return "bg-success";
    if (status === "IN_PROGRESS") return "bg-warning text-dark";
    return "bg-secondary";
  };

  const priorityBadge = (priority) => {
    if (priority === "URGENT") return "bg-danger";
    if (priority === "HIGH") return "bg-warning text-dark";
    if (priority === "LOW") return "bg-secondary";
    return "bg-primary";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN");
  };

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
            My Tasks
          </h1>
          <p className="text-muted mb-0">
            View and update your assigned volunteer tasks.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadTasks}>
          <BsArrowClockwise className="me-2" />
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="admin-bento-card mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <div
              className="d-flex align-items-center border rounded px-3"
              style={{ height: "44px", background: "#fff" }}
            >
              <BsSearch className="me-2 text-primary" />
              <input
                className="form-control border-0 shadow-none p-0"
                placeholder="Search task or event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ height: "44px" }}
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="admin-bento-card text-center py-5 text-muted">
          <BsListTask size={60} className="mb-3" />
          <h4>No tasks found</h4>
          <p className="mb-0">
            Tasks assigned by the coordinator will appear here.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredTasks.map((task) => (
            <div className="col-lg-4 col-md-6" key={task.id}>
              <div className="admin-bento-card h-100">
                <div className="admin-bento-icon mb-3">
                  <BsListTask />
                </div>

                <h4 className="fw-bold mb-2">{task.title}</h4>

                <p className="text-muted mb-2">
                  {task.assignment?.event?.eventName || "Event not available"}
                </p>

                <p className="mb-2">
                  <strong>Description:</strong>{" "}
                  {task.description || "No description"}
                </p>

                <p className="mb-2">
                  <strong>Start:</strong> {formatDate(task.startTime)}
                </p>

                <p className="mb-2">
                  <strong>End:</strong> {formatDate(task.endTime)}
                </p>

                <div className="d-flex gap-2 mb-3">
                  <span className={`badge ${priorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>

                  <span className={`badge ${statusBadge(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  {task.status !== "IN_PROGRESS" && (
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => updateStatus(task.id, "IN_PROGRESS")}
                    >
                      Start
                    </button>
                  )}

                  {task.status !== "COMPLETED" && (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => updateStatus(task.id, "COMPLETED")}
                    >
                      <BsCheckCircle className="me-1" />
                      Complete
                    </button>
                  )}

                  {task.status !== "PENDING" && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => updateStatus(task.id, "PENDING")}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </RoleLayout>
  );
}

export default VolunteerTasks;