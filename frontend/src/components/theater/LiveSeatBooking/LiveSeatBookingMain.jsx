import React, { useState } from "react";
import LiveSeatBookingFilters from "./LiveSeatBookingFilters";
import LiveSeatBookingMap from "./LiveSeatBookingMap";
import LiveSeatBookingLegend from "./LiveSeatBookingLegend";
import { BsGrid3X3 } from "react-icons/bs";

export default function LiveSeatBookingMain({
  screens,
  showtimes,
  selectedScreenId,
  onScreenChange,
  selectedShowtimeId,
  onShowtimeChange,
  liveMovieSearch,
  setLiveMovieSearch,
  getLayoutForTargetScreen,
  bookedSeatsMap,
  formatIndianDate,
  ROW_LETTERS,
  getCanonicalSection
}) {
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <div className="d-flex flex-column w-100 live-seat-booking-container pb-4">
      {/* ROW 1: PAGE HEADING TOP */}
      <div className="mb-3 pb-2 flex-shrink-0">
        <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <BsGrid3X3 className="text-primary" /> Live Physical Seat Map & Occupancy Status
        </h4>
        <p className="text-muted small mb-0">Monitor live booked, held, and available seats per movie showtime across all screens.</p>
      </div>

      <LiveSeatBookingFilters
        screens={screens}
        showtimes={showtimes}
        selectedScreenId={selectedScreenId}
        onScreenChange={onScreenChange}
        selectedShowtimeId={selectedShowtimeId}
        onShowtimeChange={onShowtimeChange}
        liveMovieSearch={liveMovieSearch}
        setLiveMovieSearch={setLiveMovieSearch}
        formatIndianDate={formatIndianDate}
      />

      <LiveSeatBookingMap
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        screens={screens}
        showtimes={showtimes}
        selectedScreenId={selectedScreenId}
        selectedShowtimeId={selectedShowtimeId}
        getLayoutForTargetScreen={getLayoutForTargetScreen}
        bookedSeatsMap={bookedSeatsMap}
        ROW_LETTERS={ROW_LETTERS}
        getCanonicalSection={getCanonicalSection}
      />

      <LiveSeatBookingLegend />
    </div>
  );
}
