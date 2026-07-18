import { useState } from "react";
import { BsArrowLeft, BsChatDots, BsSend } from "react-icons/bs";

const topics = [
  ["event", "Events & publishing"],
  ["invite", "Invitations & roles"],
  ["registration", "Registrations & tickets"],
  ["payment", "Payments & refunds"],
  ["exhibitor", "Exhibitors & booths"],
  ["subscription", "Subscriptions"],
  ["access", "Account & access"]
];

const answers = {
  event: "Open Events, select an event, complete Event Info and the required setup, then use Publish Event from the event header.",
  invite: "Use Invite Organizers from Portal Admin or Invite Staff from Organizer. You can send an email invitation or add a user manually.",
  registration: "Inside an event, open Registrations to configure the form, ticket classes, attendees, payments and generated tickets.",
  payment: "A payment starts only after the user submits payment details and clicks Pay. Admins and organizers can review payment status from the event payment page.",
  exhibitor: "Open Event → Exhibitors to add companies or stalls. Assign categories and booths from the Exhibitors and Booths sections.",
  subscription: "Open Portal Subscription to review the current plan, expiry, payment history, upgrades, renewals and billing period.",
  access: "Open your profile to edit account details or use Switch Role / Event when your account has access to multiple roles or events."
};

function HelpAssistant({ onBack }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! I’m the FIC Assistant. Choose a topic or type a short question." }
  ]);
  const [question, setQuestion] = useState("");

  const answerTopic = (key, label) => {
    setMessages((current) => [
      ...current,
      { from: "user", text: label },
      { from: "bot", text: answers[key] }
    ]);
  };

  const submitQuestion = (event) => {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;

    const normalized = value.toLowerCase();
    const match = topics.find(([key, label]) =>
      normalized.includes(key) || label.toLowerCase().split(" ").some((word) => word.length > 4 && normalized.includes(word))
    );
    const response = match
      ? answers[match[0]]
      : "I don’t have a prepared answer for that yet. Please use Feedback & Support to send the question to the support team.";

    setMessages((current) => [
      ...current,
      { from: "user", text: value },
      { from: "bot", text: response }
    ]);
    setQuestion("");
  };

  return (
    <div className="fic-assistant">
      <div className="fic-help-view-header">
        <button type="button" onClick={onBack} aria-label="Back to Help menu"><BsArrowLeft /></button>
        <span><BsChatDots /><strong>Ask FIC Assistant</strong></span>
      </div>

      <div className="fic-assistant-messages">
        {messages.map((message, index) => (
          <div key={`${message.from}-${index}`} className={`fic-assistant-message ${message.from}`}>
            {message.text}
          </div>
        ))}
      </div>

      <div className="fic-assistant-topics">
        {topics.map(([key, label]) => (
          <button type="button" key={key} onClick={() => answerTopic(key, label)}>{label}</button>
        ))}
      </div>

      <form className="fic-assistant-input" onSubmit={submitQuestion}>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Type your question..." aria-label="Question for FIC Assistant" />
        <button type="submit" aria-label="Send question"><BsSend /></button>
      </form>
    </div>
  );
}

export default HelpAssistant;
