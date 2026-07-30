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
