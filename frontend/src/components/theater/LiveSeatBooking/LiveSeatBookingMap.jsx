import React from "react";
import { BsZoomOut, BsZoomIn, BsArrowCounterclockwise } from "react-icons/bs";

export default function LiveSeatBookingMap({
  zoomLevel,
  setZoomLevel,
  screens,
  showtimes,
  selectedScreenId,
  selectedShowtimeId,
  getLayoutForTargetScreen,
  bookedSeatsMap,
  ROW_LETTERS,
  getCanonicalSection
}) {
  return (
    <>
      <div className="d-flex align-items-center justify-content-between my-1 flex-shrink-0">
        <span className="fw-bold text-muted small">
          Cinema Physical Seat Map & Layout Grid
        </span>

        <div className="d-flex align-items-center gap-1">
          <button
            className="btn btn-sm btn-light border fw-bold px-2 py-1 d-flex align-items-center gap-1"
            style={{ fontSize: "11px" }}
            onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
            title="Zoom Out (-)"
          >
            <BsZoomOut /> -
          </button>
          <span className="badge bg-secondary px-2 py-1" style={{ fontSize: "11px" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            className="btn btn-sm btn-light border fw-bold px-2 py-1 d-flex align-items-center gap-1"
            style={{ fontSize: "11px" }}
            onClick={() => setZoomLevel((prev) => Math.min(1.5, prev + 0.1))}
            title="Zoom In (+)"
          >
            <BsZoomIn /> +
          </button>
          <button
            className="btn btn-sm btn-light border fw-bold text-primary px-2 py-1 ms-1 d-flex align-items-center gap-1"
            style={{ fontSize: "11px" }}
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom to 100%"
          >
            <BsArrowCounterclockwise /> Reset
          </button>
        </div>
      </div>

      <div className="text-center my-2 flex-shrink-0">
        <div
          className="mx-auto shadow-sm rounded-pill d-flex align-items-center justify-content-center"
          style={{
            width: "75%",
            height: "22px",
            background: "linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)",
            borderBottom: "3px solid #94a3b8",
          }}
        >
          <span className="fw-bold text-secondary" style={{ fontSize: "10px", letterSpacing: "3px" }}>
            🎥 CINEMA SCREEN PROJECTION THIS WAY 🎥
          </span>
        </div>
      </div>

      <div className="p-3 bg-white rounded-3 border overflow-auto text-center flex-grow-1" style={{ minHeight: 0 }}>
        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
          {(() => {
            const targetScrId = selectedScreenId || screens[0]?.id;
            const targetLayout = getLayoutForTargetScreen(targetScrId);
            const targetSections = targetLayout.sections || [];
            const targetDeletedSeats = targetLayout.deletedSeats || {};
            const targetStId = selectedShowtimeId || (showtimes.find((s) => String(s.screen?.id || s.screenId) === String(selectedScreenId || screens[0]?.id))?.id);
            const targetShow = showtimes.find((s) => String(s.id) === String(targetStId));
            const targetScr = screens.find((s) => String(s.id) === String(selectedScreenId || targetShow?.screen?.id || targetShow?.screenId));
            const mClean = (targetShow?.movieTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const sClean = (targetScr?.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            const dClean = (targetShow?.showDate || targetShow?.date || "").replace(/[^0-9]/g, "");
            const tClean = (targetShow?.startTime || "").replace(/[^0-9]/g, "").slice(0, 4);
            const ctxKey = `CTX_${mClean}_${sClean}_${dClean}_${tClean}`;

            if (targetSections.length === 0) {
              return <p className="text-muted py-5 mb-0">No physical seat layout created for this screen yet.</p>;
            }

            let floorRowOffset = 0;
            return targetSections.map((sec, sIdx) => {
              const isBalcony = (sec.name || "").toLowerCase().includes("balcony");
              const secRows = sec.rowsCount || sec.rows || 4;
              const sectionRowLabels = [];
              if (isBalcony) {
                for (let r = 0; r < secRows; r++) {
                  sectionRowLabels.push(ROW_LETTERS[r] || `B-R${r + 1}`);
                }
              } else {
                for (let r = 0; r < secRows; r++) {
                  sectionRowLabels.push(ROW_LETTERS[floorRowOffset++] || `R${floorRowOffset}`);
                }
              }

              const secPrice = (() => {
                const sName = (sec.name || "").toLowerCase();
                if (targetShow?.classPrices) {
                  if (typeof targetShow.classPrices === "object") {
                    for (const [k, v] of Object.entries(targetShow.classPrices)) {
                      if (k.toLowerCase().includes(sName) || sName.includes(k.toLowerCase())) return v;
                    }
                  } else if (typeof targetShow.classPrices === "string") {
                    const match = targetShow.classPrices.match(new RegExp(`${sName}\\s*\\((\\d+)\\)`, "i"));
                    if (match) return match[1];
                  }
                }
                if (sName.includes("balcony") || sName.includes("vip") || sName.includes("recliner")) return 220;
                if (sName.includes("gold") || sName.includes("executive")) return 190;
                return 160;
              })();

              return (
                <div key={sec.id || sIdx} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-2 border-bottom pb-1">
                    <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                      <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: sec.color || "#3B82F6" }}></span>
                      {sec.name} Class
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success fw-bold">
                      ₹{secPrice} / Ticket
                    </span>
                  </div>

                  {Array.from({ length: secRows }).map((_, rIdx) => {
                    const rowLetter = sectionRowLabels[rIdx] || String.fromCharCode(65 + rIdx);
                    const halfSeats = Math.ceil((sec.seatsPerRow || 16) / 2);
                    let activeSeatCounter = 1;

                    return (
                      <div key={rIdx} className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <span className="fw-bold text-muted me-2" style={{ fontSize: "11px", width: "16px" }}>
                          {rowLetter}
                        </span>

                        <div className="d-flex gap-1">
                          {Array.from({ length: halfSeats }).map((_, cIdx) => {
                            const isDeleted = Boolean(
                              targetDeletedSeats[`${sec.id}-${rIdx}-${cIdx}`] ||
                              targetDeletedSeats[`${sec.id}-${rowLetter}-${cIdx}`]
                            );
                            if (isDeleted) {
                              return <div key={cIdx} style={{ width: "32px", height: "32px", visibility: "hidden" }}></div>;
                            }
                            const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                            const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            const cSec = getCanonicalSection(sec.name || sec.id);
                            const seatKey1 = `${targetStId}-${sec.id}-${rowLetter}-${cIdx}`;
                            const seatKey2 = `${targetStId}-${sec.id}-${rIdx}-${cIdx}`;
                            const isSold = Boolean(
                              bookedSeatsMap[seatKey1] ||
                              bookedSeatsMap[seatKey2] ||
                              bookedSeatsMap[`${targetStId}-${sec.id}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${targetStId}-${secClean}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${targetStId}-${cSec}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${ctxKey}-${sec.id}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${ctxKey}-${secClean}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${ctxKey}-${cSec}-${seatNumDisplay}`]
                            );

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                title={isSold ? `${seatNumDisplay} (${sec.name}) - Sold / Booked` : `${seatNumDisplay} (${sec.name}) - Available`}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "5px",
                                  fontWeight: "700",
                                  fontSize: "10px",
                                  backgroundColor: isSold ? "#ef4444" : "#9ca3af",
                                  color: "#ffffff",
                                  border: "none",
                                  boxShadow: isSold ? "0 2px 4px rgba(239, 68, 68, 0.4)" : "none",
                                  cursor: "default",
                                }}
                              >
                                {seatNumDisplay}
                              </button>
                            );
                          })}
                        </div>

                        {sec.centerAisleGap > 0 && (
                          <div style={{ width: `${(sec.centerAisleGap || 2) * 20}px` }}></div>
                        )}

                        <div className="d-flex gap-1">
                          {Array.from({ length: (sec.seatsPerRow || 16) - halfSeats }).map((_, cIdx) => {
                            const actualCIdx = halfSeats + cIdx;
                            const isDeleted = Boolean(
                              targetDeletedSeats[`${sec.id}-${rIdx}-${actualCIdx}`] ||
                              targetDeletedSeats[`${sec.id}-${rowLetter}-${actualCIdx}`]
                            );
                            if (isDeleted) {
                              return <div key={cIdx} style={{ width: "32px", height: "32px", visibility: "hidden" }}></div>;
                            }
                            const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                            const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            const cSec = getCanonicalSection(sec.name || sec.id);
                            const seatKey1 = `${targetStId}-${sec.id}-${rowLetter}-${actualCIdx}`;
                            const seatKey2 = `${targetStId}-${sec.id}-${rIdx}-${actualCIdx}`;
                            const isSold = Boolean(
                              bookedSeatsMap[seatKey1] ||
                              bookedSeatsMap[seatKey2] ||
                              bookedSeatsMap[`${targetStId}-${sec.id}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${targetStId}-${secClean}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${targetStId}-${cSec}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${ctxKey}-${sec.id}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${ctxKey}-${secClean}-${seatNumDisplay}`] ||
                              bookedSeatsMap[`${ctxKey}-${cSec}-${seatNumDisplay}`]
                            );

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                title={isSold ? `${seatNumDisplay} (${sec.name}) - Sold / Booked` : `${seatNumDisplay} (${sec.name}) - Available`}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "5px",
                                  fontWeight: "700",
                                  fontSize: "10px",
                                  backgroundColor: isSold ? "#ef4444" : "#9ca3af",
                                  color: "#ffffff",
                                  border: "none",
                                  boxShadow: isSold ? "0 2px 4px rgba(239, 68, 68, 0.4)" : "none",
                                  cursor: "default",
                                }}
                              >
                                {seatNumDisplay}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {(sec.hasAisleBelow || sIdx < targetSections.length - 1) && (
                    <div className="w-100 my-3 py-1 bg-light border text-muted small fw-bold text-center rounded-pill shadow-2xs" style={{ fontSize: "11px" }}>
                      🚶 HORIZONTAL AISLE WALKWAY 🚶
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </>
  );
}
