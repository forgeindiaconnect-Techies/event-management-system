import React from "react";
import { BsSearch } from "react-icons/bs";

export default function LiveSeatBookingFilters({
  screens,
  showtimes,
  selectedScreenId,
  onScreenChange,
  selectedShowtimeId,
  onShowtimeChange,
  liveMovieSearch,
  setLiveMovieSearch,
  formatIndianDate
}) {
  return (
    <div className="row g-2 align-items-center mb-3 pb-3 border-bottom flex-shrink-0">
      <div className="col-md-5">
        <label className="fw-bold text-dark mb-1 d-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
          <BsSearch className="text-primary" /> Search Movie, Show Date or Showtime:
        </label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="e.g. Mandadi / Avatar / 09:30:00..."
          value={liveMovieSearch}
          onChange={(e) => setLiveMovieSearch(e.target.value)}
        />
      </div>

      <div className="col-md-3">
        <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>Target Screen Hall:</label>
        <select
          className="form-select form-select-sm fw-bold border-primary"
          value={selectedScreenId || (screens[0]?.id || "")}
          onChange={(e) => {
            const sId = e.target.value;
            onScreenChange(sId);
            const sShows = showtimes.filter((s) => String(s.screen?.id || s.screenId) === String(sId));
            if (sShows.length > 0) onShowtimeChange(sShows[0].id);
          }}
        >
          {screens.map((scr) => (
            <option key={scr.id} value={scr.id}>
              {scr.screenName}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>Scheduled Showtime:</label>
        <select
          className="form-select form-select-sm fw-bold border-success"
          value={selectedShowtimeId || (showtimes.find((s) => String(s.screen?.id || s.screenId) === String(selectedScreenId || screens[0]?.id))?.id || "")}
          onChange={(e) => onShowtimeChange(e.target.value)}
        >
          {showtimes
            .filter((st) => {
              const scrMatch = String(st.screen?.id || st.screenId) === String(selectedScreenId || screens[0]?.id);
              const titleMatch = !liveMovieSearch.trim() || (st.movieTitle || "").toLowerCase().includes(liveMovieSearch.toLowerCase());
              return scrMatch && titleMatch;
            })
            .map((st) => (
              <option key={st.id} value={st.id}>
                {st.movieTitle} ({st.startTime}) — {formatIndianDate(st.showDate) || "Today"}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
