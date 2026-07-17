import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import EventDetailLayout from "./EventDetailLayout";
import ManageSidebar from "../components/ManageSidebar";
import api from "../api/axiosConfig";

function ManageLayout() {
  const { id } = useParams();
  const [open, setOpen] = useState(true);
  const [subnavAtEnd, setSubnavAtEnd] = useState(false);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    async function loadEvent() {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    }
    loadEvent();
  }, [id]);

  return (
    <EventDetailLayout event={event}>
      <div className="manage-layout" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div
          className={`manage-layout-sidebar ${open ? "open" : "closed"} ${subnavAtEnd ? "subnav-at-end" : ""}`}
          style={{
            width: open ? "220px" : "0px",
            minWidth: open ? "220px" : "0px",
            overflow: "hidden",
            transition: "width 0.25s ease, min-width 0.25s ease",
            backgroundColor: "#fff"
          }}
        >
          <ManageSidebar onScrollEndChange={setSubnavAtEnd} />
        </div>

        <button
          className="manage-sidebar-toggle"
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

        <div className="manage-page-content flex-grow-1 p-4" style={{ minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </EventDetailLayout>
  );
}

export default ManageLayout;
