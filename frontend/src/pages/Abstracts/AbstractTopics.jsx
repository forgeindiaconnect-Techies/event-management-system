import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BsCheckCircle,
  BsPencilSquare,
  BsPlusLg,
  BsSearch,
  BsTrash,
} from "react-icons/bs";
import api from "../../api/axiosConfig";

const initialForm = {
  topicName: "",
  submissionType: "Oral Presentation",
  description: "",
  status: "Active",
};

function AbstractTopics() {
  const { id } = useParams();
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTopics();
  }, [id]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/abstract-topics/event/${id}`);
      setTopics(res.data || []);
      setMessage("");
    } catch (error) {
      console.log(error);
      setTopics([]);
      setMessage("Unable to load abstract topics.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return topics;

    return topics.filter((topic) =>
      [topic.topicName, topic.submissionType, topic.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [topics, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.topicName.trim()) {
      setMessage("Topic name is required.");
      return;
    }

    const payload = {
      ...form,
      event: { id: Number(id) },
    };

    try {
      const res = editingId
        ? await api.put(`/abstract-topics/${editingId}`, payload)
        : await api.post("/abstract-topics", payload);

      setTopics((current) =>
        editingId
          ? current.map((topic) => (topic.id === editingId ? res.data : topic))
          : [res.data, ...current]
      );
      resetForm();
      setMessage(editingId ? "Topic updated successfully." : "Topic added successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to save abstract topic.");
    }
  };

  const editTopic = (topic) => {
    setEditingId(topic.id);
    setForm({
      topicName: topic.topicName || "",
      submissionType: topic.submissionType || "Oral Presentation",
      description: topic.description || "",
      status: topic.status || "Active",
    });
  };

  const deleteTopic = async (topicId) => {
    try {
      await api.delete(`/abstract-topics/${topicId}`);
      setTopics((current) => current.filter((topic) => topic.id !== topicId));
      if (editingId === topicId) resetForm();
      setMessage("Topic deleted successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to delete abstract topic.");
    }
  };

  const activeCount = topics.filter((topic) => topic.status === "Active").length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Abstract Topics
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Manage topic tracks and allowed submission types for this event.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 text-primary fw-semibold">
          <BsCheckCircle />
          <span>{activeCount} Active</span>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-semibold mb-3" style={{ fontSize: "17px" }}>
                {editingId ? "Edit Topic" : "Add Topic"}
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Topic Name</label>
                  <input
                    className="form-control"
                    name="topicName"
                    value={form.topicName}
                    onChange={handleChange}
                    placeholder="AI, Healthcare, Marketing..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Submission Type</label>
                  <select
                    className="form-select"
                    name="submissionType"
                    value={form.submissionType}
                    onChange={handleChange}
                  >
                    <option>Oral Presentation</option>
                    <option>Poster Presentation</option>
                    <option>Workshop Proposal</option>
                    <option>Paper Submission</option>
                    <option>Case Study</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Short note about what this topic accepts"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Active</option>
                    <option>Closed</option>
                    <option>Hidden</option>
                  </select>
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
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h5 className="fw-semibold mb-0" style={{ fontSize: "17px" }}>
                  Topic List
                </h5>

                <div className="input-group" style={{ maxWidth: "280px" }}>
                  <span className="input-group-text bg-white">
                    <BsSearch />
                  </span>
                  <input
                    className="form-control"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search topics"
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Topic</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          Loading topics...
                        </td>
                      </tr>
                    ) : filteredTopics.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          No abstract topics found.
                        </td>
                      </tr>
                    ) : (
                      filteredTopics.map((topic) => (
                        <tr key={topic.id}>
                          <td>
                            <div className="fw-semibold">{topic.topicName}</div>
                            <div className="text-muted small">{topic.description || "No description"}</div>
                          </td>
                          <td>{topic.submissionType}</td>
                          <td>
                            <span
                              className={`badge ${
                                topic.status === "Active" ? "bg-success" : "bg-secondary"
                              }`}
                            >
                              {topic.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => editTopic(topic)}
                            >
                              <BsPencilSquare />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteTopic(topic.id)}
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

export default AbstractTopics;
