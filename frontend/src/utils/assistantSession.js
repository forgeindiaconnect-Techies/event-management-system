const ASSISTANT_MESSAGES_KEY = "ficAssistantMessages";

export const ASSISTANT_WELCOME_MESSAGE = {
  from: "bot",
  text: "Hello! I’m the FIC Assistant. Choose a topic or type your question."
};

function validMessage(message) {
  return (
    message &&
    (message.from === "bot" || message.from === "user") &&
    typeof message.text === "string" &&
    message.text.trim()
  );
}

export function loadAssistantMessages() {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(ASSISTANT_MESSAGES_KEY) || "[]"
    );
    const messages = Array.isArray(stored)
      ? stored.filter(validMessage)
      : [];

    return messages.length ? messages : [ASSISTANT_WELCOME_MESSAGE];
  } catch {
    return [ASSISTANT_WELCOME_MESSAGE];
  }
}

export function appendAssistantMessage(message) {
  const next = [...loadAssistantMessages(), message].slice(-100);
  sessionStorage.setItem(ASSISTANT_MESSAGES_KEY, JSON.stringify(next));
  return next;
}

export function clearAssistantSession() {
  sessionStorage.removeItem(ASSISTANT_MESSAGES_KEY);
}
