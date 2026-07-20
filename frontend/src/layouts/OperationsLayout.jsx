import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import EventDetailLayout from "./EventDetailLayout";
import OperationsSidebar from "../components/OperationsSidebar";
import api from "../api/axiosConfig";

function OperationsLayout() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`).then((response) => setEvent(response.data)).catch(console.error);
  }, [id]);

  return (
    <EventDetailLayout event={event}>
      <div className="manage-layout" style={{ minHeight: "calc(100vh - 58px)" }}>
        <div
          className={`manage-layout-sidebar ${open ? "open" : "closed"}`}
          style={{
            width: open ? 230 : 0,
            minWidth: open ? 230 : 0,
            overflow: "hidden",
            transition: "width .25s ease, min-width .25s ease",
            background: "#fff",
          }}
        >
          <OperationsSidebar />
        </div>

        <button
          type="button"
          className="manage-sidebar-toggle"
          aria-label={open ? "Close operations menu" : "Open operations menu"}
          onClick={() => setOpen((value) => !value)}
          style={{ width: 10, height: 26, marginTop: 2, border: "1px solid #4f46e5", background: "#fff", color: "#4f46e5", borderRadius: "0 6px 6px 0" }}
        >
          {open ? "‹" : "›"}
        </button>

        <main className="manage-page-content flex-grow-1 p-4" style={{ minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </EventDetailLayout>
  );
}

export default OperationsLayout;
