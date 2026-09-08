import React from "react";

export default function LiveSeatBookingLegend() {
  return (
    <div className="py-2 mt-2 border-top d-flex justify-content-center align-items-center gap-4 flex-wrap flex-shrink-0">
      <div className="d-flex align-items-center gap-1">
        <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#9ca3af" }}></span>
        <span className="text-muted fw-bold small">Available</span>
      </div>
      <div className="d-flex align-items-center gap-1">
        <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#10B981" }}></span>
        <span className="text-success fw-bold small">Selected / Active</span>
      </div>
      <div className="d-flex align-items-center gap-1">
        <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#ef4444" }}></span>
        <span className="text-danger fw-bold small">Sold / Booked</span>
      </div>
      <div className="d-flex align-items-center gap-1">
        <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f59e0b" }}></span>
        <span className="text-warning fw-bold small">Holded (5-min Online)</span>
      </div>
    </div>
  );
}
