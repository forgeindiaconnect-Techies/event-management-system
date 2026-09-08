const SERVER_TIME_ZONE_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/i;

export function parseServerDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const timestamp = String(value).trim();
  const normalized = SERVER_TIME_ZONE_SUFFIX.test(timestamp)
    ? timestamp
    : `${timestamp}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIndiaDateTime(value, options = {}) {
  const date = parseServerDateTime(value);
  if (!date) return "—";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  });
}

export function formatIndianDate(value) {
  if (!value) return "";
  const str = String(value).trim();
  // Handle ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  }
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    const [year, month, day] = str.split("/");
    return `${day}/${month}/${year}`;
  }
  const date = parseServerDateTime(value) || new Date(value);
  if (!date || Number.isNaN(date.getTime())) return str;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatIndianTime(timeStr) {
  if (!timeStr) return "";
  const str = String(timeStr).trim();
  // Match HH:MM:SS or HH:MM
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return str;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  const hoursStr = String(hours).padStart(2, "0");
  return `${hoursStr}:${minutes} ${ampm}`;
}
