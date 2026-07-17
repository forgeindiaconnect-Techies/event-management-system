import { useState } from "react";
import {
  FaChartBar,
  FaComments,
  FaCog,
  FaPlus,
  FaPoll,
  FaQuestionCircle,
  FaSave,
  FaStar,
  FaTrash
} from "react-icons/fa";

const emptyPoll = {
  question: "",
  options: "Yes\nNo",
  status: "Draft"
};

const emptyQuestion = {
  question: "",
  askedBy: "",
  session: "",
  status: "Open"
};

const emptyFeedback = {
  field: "",
  type: "Rating",
  required: true
};

function Engagement() {
  const [activeTool, setActiveTool] = useState("polls");
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [feedbackFields, setFeedbackFields] = useState([]);
  const [pollForm, setPollForm] = useState(emptyPoll);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedback);
  const [settings, setSettings] = useState({
    allowAnonymousQuestions: true,
    moderateQuestions: true,
    collectPostEventFeedback: true,
    showPollResults: true
  });
  const [message, setMessage] = useState("");

  const savePoll = (e) => {
    e.preventDefault();
    if (!pollForm.question.trim()) {
      setMessage("Poll question is required.");
      return;
    }

    setPolls((current) => [{ ...pollForm, id: Date.now() }, ...current]);
    setPollForm(emptyPoll);
    setMessage("Poll added.");
  };

  const saveQuestion = (e) => {
    e.preventDefault();
    if (!questionForm.question.trim()) {
      setMessage("Question is required.");
      return;
    }

    setQuestions((current) => [{ ...questionForm, id: Date.now() }, ...current]);
    setQuestionForm(emptyQuestion);
    setMessage("Question added.");
  };

  const saveFeedbackField = (e) => {
    e.preventDefault();
    if (!feedbackForm.field.trim()) {
      setMessage("Feedback field name is required.");
      return;
    }

    setFeedbackFields((current) => [{ ...feedbackForm, id: Date.now() }, ...current]);
    setFeedbackForm(emptyFeedback);
    setMessage("Feedback field added.");
  };

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="manage-subpage p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 fw-semibold mb-1">Engagement</h1>
          <p className="text-muted mb-0">
            Create polls, collect Q&A, and prepare feedback for attendees.
          </p>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard icon={<FaPoll />} label="Polls" value={polls.length} />
        <SummaryCard icon={<FaQuestionCircle />} label="Questions" value={questions.length} />
        <SummaryCard icon={<FaStar />} label="Feedback Fields" value={feedbackFields.length} />
        <SummaryCard icon={<FaChartBar />} label="Active Tools" value="3" />
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="btn-group flex-wrap" role="group" aria-label="Engagement tools">
            <ToolButton active={activeTool === "polls"} onClick={() => setActiveTool("polls")}>
              Polls
            </ToolButton>
            <ToolButton active={activeTool === "qa"} onClick={() => setActiveTool("qa")}>
              Q&A
            </ToolButton>
            <ToolButton active={activeTool === "feedback"} onClick={() => setActiveTool("feedback")}>
              Feedback
            </ToolButton>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-8">
          {activeTool === "polls" && (
            <ToolPanel
              title="Polls"
              description="Create interactive polls for attendees during sessions."
              icon={<FaPoll />}
            >
              <form onSubmit={savePoll} className="mb-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Poll Question</label>
                  <input
                    className="form-control"
                    value={pollForm.question}
                    onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                    placeholder="Example: Which topic should we cover next?"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Options</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={pollForm.options}
                    onChange={(e) => setPollForm({ ...pollForm, options: e.target.value })}
                    placeholder="Enter one option per line"
                  />
                </div>

                <div className="row g-3 align-items-end">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={pollForm.status}
                      onChange={(e) => setPollForm({ ...pollForm, status: e.target.value })}
                    >
                      <option>Draft</option>
                      <option>Live</option>
                      <option>Closed</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                      <FaSave /> Save Poll
                    </button>
                  </div>
                </div>
              </form>

              <ItemList
                emptyText="No polls created yet."
                items={polls}
                renderItem={(poll) => (
                  <EngagementItem
                    key={poll.id}
                    title={poll.question}
                    meta={`${poll.options.split("\n").filter(Boolean).length} options`}
                    badge={poll.status}
                    onDelete={() => setPolls((current) => current.filter((item) => item.id !== poll.id))}
                  />
                )}
              />
            </ToolPanel>
          )}

          {activeTool === "qa" && (
            <ToolPanel
              title="Q&A"
              description="Collect audience questions and track their status."
              icon={<FaComments />}
            >
              <form onSubmit={saveQuestion} className="mb-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Question</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder="Enter audience question"
                  />
                </div>

                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Asked By</label>
                    <input
                      className="form-control"
                      value={questionForm.askedBy}
                      onChange={(e) => setQuestionForm({ ...questionForm, askedBy: e.target.value })}
                      placeholder="Attendee name"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Session</label>
                    <input
                      className="form-control"
                      value={questionForm.session}
                      onChange={(e) => setQuestionForm({ ...questionForm, session: e.target.value })}
                      placeholder="Session name"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={questionForm.status}
                      onChange={(e) => setQuestionForm({ ...questionForm, status: e.target.value })}
                    >
                      <option>Open</option>
                      <option>Answered</option>
                      <option>Hidden</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                      <FaPlus /> Add Question
                    </button>
                  </div>
                </div>
              </form>

              <ItemList
                emptyText="No questions added yet."
                items={questions}
                renderItem={(question) => (
                  <EngagementItem
                    key={question.id}
                    title={question.question}
                    meta={`${question.askedBy || "Anonymous"} • ${question.session || "No session"}`}
                    badge={question.status}
                    onDelete={() =>
                      setQuestions((current) => current.filter((item) => item.id !== question.id))
                    }
                  />
                )}
              />
            </ToolPanel>
          )}

          {activeTool === "feedback" && (
            <ToolPanel
              title="Feedback"
              description="Build the feedback form attendees will fill after the event."
              icon={<FaStar />}
            >
              <form onSubmit={saveFeedbackField} className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Field Name</label>
                    <input
                      className="form-control"
                      value={feedbackForm.field}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, field: e.target.value })}
                      placeholder="Example: Rate the session"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Type</label>
                    <select
                      className="form-select"
                      value={feedbackForm.type}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                    >
                      <option>Rating</option>
                      <option>Text</option>
                      <option>Yes / No</option>
                      <option>Multiple Choice</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Required</label>
                    <select
                      className="form-select"
                      value={feedbackForm.required ? "Yes" : "No"}
                      onChange={(e) =>
                        setFeedbackForm({ ...feedbackForm, required: e.target.value === "Yes" })
                      }
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                      <FaPlus /> Add Feedback Field
                    </button>
                  </div>
                </div>
              </form>

              <ItemList
                emptyText="No feedback fields added yet."
                items={feedbackFields}
                renderItem={(field) => (
                  <EngagementItem
                    key={field.id}
                    title={field.field}
                    meta={field.type}
                    badge={field.required ? "Required" : "Optional"}
                    onDelete={() =>
                      setFeedbackFields((current) => current.filter((item) => item.id !== field.id))
                    }
                  />
                )}
              />
            </ToolPanel>
          )}
        </div>

        <div className="col-xl-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaCog className="text-primary" />
                <h2 className="h5 fw-semibold mb-0">Engagement Settings</h2>
              </div>

              <SettingToggle
                label="Allow anonymous questions"
                checked={settings.allowAnonymousQuestions}
                onChange={(value) => updateSetting("allowAnonymousQuestions", value)}
              />
              <SettingToggle
                label="Moderate questions before showing"
                checked={settings.moderateQuestions}
                onChange={(value) => updateSetting("moderateQuestions", value)}
              />
              <SettingToggle
                label="Collect post-event feedback"
                checked={settings.collectPostEventFeedback}
                onChange={(value) => updateSetting("collectPostEventFeedback", value)}
              />
              <SettingToggle
                label="Show poll results to attendees"
                checked={settings.showPollResults}
                onChange={(value) => updateSetting("showPollResults", value)}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{engagementStyles}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="engagement-summary-icon">{icon}</div>
          <div>
            <div className="text-muted small">{label}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`btn ${active ? "btn-primary" : "btn-outline-primary"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolPanel({ title, description, icon, children }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-primary">{icon}</span>
          <div>
            <h2 className="h5 fw-semibold mb-1">{title}</h2>
            <p className="text-muted small mb-0">{description}</p>
          </div>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function ItemList({ items, emptyText, renderItem }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed rounded-3 p-4 text-center text-muted">
        {emptyText}
      </div>
    );
  }

  return <div className="d-grid gap-3">{items.map(renderItem)}</div>;
}

function EngagementItem({ title, meta, badge, onDelete }) {
  return (
    <div className="border rounded-3 p-3 d-flex justify-content-between gap-3">
      <div>
        <div className="fw-semibold">{title}</div>
        <div className="text-muted small">{meta}</div>
      </div>
      <div className="d-flex align-items-start gap-2">
        <span className="badge bg-primary-subtle text-primary">{badge}</span>
        <button type="button" className="btn btn-sm btn-light border" onClick={onDelete}>
          <FaTrash />
        </button>
      </div>
    </div>
  );
}

function SettingToggle({ label, checked, onChange }) {
  return (
    <label className="d-flex justify-content-between align-items-center gap-3 border-bottom py-3">
      <span className="small text-muted">{label}</span>
      <input
        className="form-check-input m-0"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

const engagementStyles = `
  .engagement-summary-icon {
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

export default Engagement;
