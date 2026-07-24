import { useEffect, useRef, useState } from "react";
import { BsArrowLeft, BsChatDots, BsSend } from "react-icons/bs";
import api from "../../api/axiosConfig";

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function currentChatContext() {
  return {
    role:
      localStorage.getItem("activeRole") ||
      localStorage.getItem("role") ||
      null,
    portalId: positiveNumber(
      localStorage.getItem("activePortalId") ||
      localStorage.getItem("portalId")
    ),
    eventId: positiveNumber(localStorage.getItem("activeEventId"))
  };
}

function HelpAssistant({ onBack }) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! I’m the FIC Assistant. Choose a topic or type your question."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const askAssistant = async (value) => {
    const message = value.trim();
    if (!message || loading) return;

    setMessages((current) => [
      ...current,
      { from: "user", text: message }
    ]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/chatbot", {
        message,
        ...currentChatContext()
      });

      const answer = response.data?.answer?.trim();
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text:
            answer ||
            "I couldn’t generate an answer. Please try again or contact support."
        }
      ]);
    } catch (error) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error;

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text:
            serverMessage ||
            "The FIC Assistant is temporarily unavailable. Please try again shortly."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = (event) => {
    event.preventDefault();
    askAssistant(question);
  };

  return (
    <div className="fic-assistant">
      <div className="fic-help-view-header">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Help menu"
        >
          <BsArrowLeft />
        </button>
        <span>
          <BsChatDots />
          <strong>Ask FIC Assistant</strong>
        </span>
      </div>

      <div className="fic-assistant-messages" ref={messagesRef}>
        {messages.map((message, index) => (
          <div
            key={`${message.from}-${index}`}
            className={`fic-assistant-message ${message.from}`}
          >
            {message.text}
          </div>
        ))}
        {loading && (
          <div className="fic-assistant-message bot" role="status">
            FIC Assistant is thinking…
          </div>
        )}
      </div>

      <form className="fic-assistant-input" onSubmit={submitQuestion}>
        <input
          value={question}
          disabled={loading}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Type your question..."
          aria-label="Question for FIC Assistant"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          aria-label="Send question"
        >
          <BsSend />
        </button>
      </form>
    </div>
  );
}

export default HelpAssistant;
