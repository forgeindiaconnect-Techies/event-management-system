import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSearch, FaTimes } from "react-icons/fa";
import {
  BsGrid,
  BsPeople,
  BsEnvelope,
  BsPalette,
  BsCheckCircle,
  BsShop,
  BsBarChart,
  BsCalendarEvent,
  BsFileText
} from "react-icons/bs";

function EventSearch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const pages = [
    { title: "Overview", path: `/events/${id}`, icon: <BsGrid /> },
    { title: "Attendees", path: `/events/${id}/registrations/attendees`, icon: <BsPeople /> },
    { title: "Automated Emails", path: `/events/${id}/manage/promote`, icon: <BsEnvelope /> },
    { title: "Branding", path: `/events/${id}/manage/forms`, icon: <BsPalette /> },
    { title: "Check In", path: `/events/${id}/event-day/check-in`, icon: <BsCheckCircle /> },
    { title: "Exhibitor Requests", path: `/events/${id}/exhibitors/list`, icon: <BsShop /> },
    { title: "Reports", path: `/events/${id}/reports/overview`, icon: <BsBarChart /> },
    { title: "Sessions", path: `/events/${id}/manage/agenda`, icon: <BsCalendarEvent /> },
    { title: "Registration Form", path: `/events/${id}/registrations/form`, icon: <BsFileText /> }
  ];

  const filteredPages = useMemo(() => {
    return pages.filter((page) =>
      page.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "rgba(0,0,0,0.55)",
        paddingTop: "32px"
      }}
    >
      <div
        className="bg-white mx-auto"
        style={{
          width: "620px",
          borderRadius: "8px",
          overflow: "hidden"
        }}
      >
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
          <h3 className="mb-0" style={{ fontSize: "16px", fontWeight: 600 }}>
            What are you looking for?
          </h3>

          <button
            className="btn border-0 p-0"
            onClick={() => navigate(`/events/${id}`)}
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-4">
          <div
            className="d-flex align-items-center border rounded px-2 mb-3"
            style={{
              height: "38px",
              borderColor: "#4f46e5"
            }}
          >
            <FaSearch size={13} className="text-muted me-2" />

            <input
              className="form-control border-0 shadow-none p-0"
              placeholder="Search or Jump to"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: "13px" }}
              autoFocus
            />

            <span
              className="badge bg-light text-dark"
              style={{ fontSize: "11px" }}
            >
              ⌘ k
            </span>
          </div>

          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {filteredPages.map((page) => (
              <button
                key={page.path}
                className="btn w-100 text-start d-flex align-items-center gap-3 border-0"
                style={{
                  height: "44px",
                  fontSize: "13px"
                }}
                onClick={() => navigate(page.path)}
              >
                {page.icon}
                {page.title}
              </button>
            ))}

            {filteredPages.length === 0 && (
              <div className="text-muted text-center py-4" style={{ fontSize: "13px" }}>
                No pages found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventSearch;