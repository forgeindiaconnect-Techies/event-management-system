import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import EventDetailLayout from "./EventDetailLayout";
import EventDaySidebar from "../components/EventDaySidebar";
import api from "../api/axiosConfig";

function EventDayLayout() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    }

    loadEvent();
  }, [id]);

  return (
    <EventDetailLayout event={event}>
      <div className="event-workspace-layout event-day-layout" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div
          className={`event-workspace-sidebar ${open ? "open" : "closed"}`}
          style={{
            width: open ? "220px" : "0px",
            minWidth: open ? "220px" : "0px",
            overflow: "hidden",
            transition: "width 0.25s ease, min-width 0.25s ease",
            backgroundColor: "#fff"
          }}
        >
          <EventDaySidebar />
        </div>

        <button
          className="event-workspace-sidebar-toggle"
          onClick={() => setOpen(!open)}
         style={{
            width: "08px",
            height: "23px",
            marginTop: "2px",
            border: "1px solid #4f46e5",
            backgroundColor: "#fff",
            color: "#4f46e5",
            borderRadius: "0 6px 6px 0"
          }}
        >
          {open ? "‹" : "›"}
        </button>

        <div className="event-workspace-content flex-grow-1 p-4" style={{ minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </EventDetailLayout>
  );
}

export default EventDayLayout;
