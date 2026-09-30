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

export function timeStrToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

export function minutesToTimeStr(totalMinutes) {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(norm / 60);
  const minutes = norm % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getMovieDurationMinutes(movieId, movieTitle, centralMovies = []) {
  if (Array.isArray(centralMovies)) {
    const found = centralMovies.find(
      (m) =>
        (movieId && String(m.id) === String(movieId)) ||
        (movieTitle && m.title && m.title.trim().toLowerCase() === String(movieTitle).trim().toLowerCase())
    );
    if (found && found.durationMinutes && !isNaN(Number(found.durationMinutes))) {
      return Number(found.durationMinutes);
    }
  }
  return 150; // standard default movie runtime (2h 30m)
}

export function getTheaterShowtimeBuffers(portalId = null) {
  try {
    const pId = portalId || localStorage.getItem("portalId") || "2";
    const saved = localStorage.getItem(`theater_settings_${pId}`) || localStorage.getItem("theater_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        turnaroundMins: !isNaN(Number(parsed.turnaroundMins)) ? Number(parsed.turnaroundMins) : 25,
        trailerBufferMins: !isNaN(Number(parsed.trailerBufferMins)) ? Number(parsed.trailerBufferMins) : 10,
        intervalMins: !isNaN(Number(parsed.intervalMins)) ? Number(parsed.intervalMins) : 15,
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    turnaroundMins: 25,
    trailerBufferMins: 10,
    intervalMins: 15,
  };
}

export function getTheaterTurnaroundBuffer(portalId = null) {
  return getTheaterShowtimeBuffers(portalId).turnaroundMins;
}

export function calculateSuggestedShowtime({
  screenId,
  showDate,
  showtimes = [],
  centralMovies = [],
  turnaroundMinutes = 25,
  trailerBufferMinutes = 10,
  intervalMinutes = 15,
  editingShowId = null,
}) {
  if (!screenId || !showDate) {
    return {
      suggestedTime: "10:00",
      isFirstShow: true,
      previousShow: null,
      turnaroundMinutes,
      trailerBufferMinutes,
      intervalMinutes,
    };
  }

  // Filter shows on the same screen and date
  const sameScreenShows = showtimes
    .filter(
      (st) =>
        String(st.screenId || st.screen?.id) === String(screenId) &&
        st.showDate === showDate &&
        (!editingShowId || String(st.id) !== String(editingShowId)) &&
        st.startTime
    )
    .sort((a, b) => timeStrToMinutes(a.startTime) - timeStrToMinutes(b.startTime));

  if (sameScreenShows.length === 0) {
    return {
      suggestedTime: "10:00",
      isFirstShow: true,
      previousShow: null,
      existingShowsCount: 0,
      turnaroundMinutes,
      trailerBufferMinutes,
      intervalMinutes,
    };
  }

  // Find the last show
  const lastShow = sameScreenShows[sameScreenShows.length - 1];
  const lastStartMins = timeStrToMinutes(lastShow.startTime);
  const prevMovieDuration = getMovieDurationMinutes(lastShow.movieId, lastShow.movieTitle, centralMovies);
  
  // Total show runtime in auditorium = Movie Runtime + Pre-Show Trailers/Ads + Interval Break
  const prevTotalRunMins = prevMovieDuration + trailerBufferMinutes + intervalMinutes;
  const prevEndMins = lastStartMins + prevTotalRunMins;
  
  // Add turnaround housekeeping cleaning buffer
  const rawSuggestedMins = prevEndMins + turnaroundMinutes;
  // Round up to nearest 5 minutes for clean theater schedule (e.g., 13:03 -> 13:05)
  const roundedSuggestedMins = Math.ceil(rawSuggestedMins / 5) * 5;

  return {
    suggestedTime: minutesToTimeStr(roundedSuggestedMins),
    isFirstShow: false,
    previousShow: lastShow,
    prevMovieTitle: lastShow.movieTitle,
    prevMovieDuration,
    prevTotalRunMins,
    prevStartTime: lastShow.startTime,
    prevEndTimeStr: minutesToTimeStr(prevEndMins),
    turnaroundMinutes,
    trailerBufferMinutes,
    intervalMinutes,
    existingShowsCount: sameScreenShows.length,
  };
}

export function validateShowtimeOverlap({
  proposedStartTimeStr,
  newMovieId,
  newMovieTitle,
  screenId,
  showDate,
  showtimes = [],
  centralMovies = [],
  turnaroundMinutes = 25,
  trailerBufferMinutes = 10,
  intervalMinutes = 15,
  editingShowId = null,
}) {
  if (!proposedStartTimeStr || !screenId || !showDate) {
    return { hasConflict: false };
  }

  const propStart = timeStrToMinutes(proposedStartTimeStr);
  const propMovieDuration = getMovieDurationMinutes(newMovieId, newMovieTitle, centralMovies);
  const propTotalRun = propMovieDuration + trailerBufferMinutes + intervalMinutes;
  const propEnd = propStart + propTotalRun;
  const propEarliestNext = propEnd + turnaroundMinutes;

  const sameScreenShows = showtimes.filter(
    (st) =>
      String(st.screenId || st.screen?.id) === String(screenId) &&
      st.showDate === showDate &&
      (!editingShowId || String(st.id) !== String(editingShowId)) &&
      st.startTime
  );

  for (const exShow of sameScreenShows) {
    const exStart = timeStrToMinutes(exShow.startTime);
    const exMovieDuration = getMovieDurationMinutes(exShow.movieId, exShow.movieTitle, centralMovies);
    const exTotalRun = exMovieDuration + trailerBufferMinutes + intervalMinutes;
    const exEnd = exStart + exTotalRun;
    const exEarliestNext = exEnd + turnaroundMinutes;

    // Overlap case 1: Proposed show starts during existing show or its cleaning window
    if (propStart >= exStart && propStart < exEarliestNext) {
      return {
        hasConflict: true,
        type: "STARTS_DURING_PRIOR_SHOW",
        conflictingShow: exShow,
        priorEndTime: minutesToTimeStr(exEnd),
        earliestAllowedStart: minutesToTimeStr(exEarliestNext),
        message: `Conflicts with "${exShow.movieTitle}" (${formatIndianTime(exShow.startTime)}). It runs until ${formatIndianTime(minutesToTimeStr(exEnd))} (${exMovieDuration}m film + ${trailerBufferMinutes}m ads + ${intervalMinutes}m interval) + ${turnaroundMinutes}m cleaning buffer. Earliest available start is ${formatIndianTime(minutesToTimeStr(exEarliestNext))}.`,
      };
    }

    // Overlap case 2: Proposed show starts before existing show, but doesn't finish + clean in time
    if (propStart <= exStart && propEarliestNext > exStart) {
      return {
        hasConflict: true,
        type: "OVERLAPS_SUBSEQUENT_SHOW",
        conflictingShow: exShow,
        nextShowStartTime: exShow.startTime,
        message: `This show ends with cleaning at ${formatIndianTime(minutesToTimeStr(propEarliestNext))} (${propMovieDuration}m film + ${trailerBufferMinutes}m ads + ${intervalMinutes}m interval + ${turnaroundMinutes}m cleaning), overlapping the subsequent show "${exShow.movieTitle}" scheduled at ${formatIndianTime(exShow.startTime)}.`,
      };
    }
  }

  return {
    hasConflict: false,
    propMovieDuration,
    propTotalRun,
    propEndTime: minutesToTimeStr(propEnd),
    propEarliestNext: minutesToTimeStr(propEarliestNext),
    turnaroundMinutes,
    trailerBufferMinutes,
    intervalMinutes,
  };
}

