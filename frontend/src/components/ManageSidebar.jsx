import { useEffect, useRef } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  BsCalendarEvent,
  BsPeople,
  BsCardChecklist,
  BsMic,
  BsBriefcase,
  BsMegaphone,
  BsChatDots,
  BsFolder,
  BsFileText,
} from "react-icons/bs";

function ManageSidebar({ onScrollEndChange }) {
  const { id } = useParams();
  const navRef = useRef(null);

  const reportScrollPosition = () => {
    const node = navRef.current;
    if (!node) return;
    onScrollEndChange?.(node.scrollLeft + node.clientWidth >= node.scrollWidth - 4);
  };

  useEffect(() => {
    reportScrollPosition();
    window.addEventListener("resize", reportScrollPosition);
    return () => window.removeEventListener("resize", reportScrollPosition);
  }, []);

  const menuItems = [
    {
      label: "Event Info",
      icon: <BsCalendarEvent size={16} />,
      path: `/events/${id}/manage/event-info`
    },
    {
      label: "Team",
      icon: <BsPeople size={16} />,
      path: `/events/${id}/manage/team`
    },
    {
      label: "Agenda",
      icon: <BsCardChecklist size={16} />,
      path: `/events/${id}/manage/agenda`
    },
    {
      label: "Speakers",
      icon: <BsMic size={16} />,
      path: `/events/${id}/manage/speakers`
    },
    {
      label: "Sponsors",
      icon: <BsBriefcase size={16} />,
      path: `/events/${id}/manage/sponsors`
    },
    {
      label: "Promote",
      icon: <BsMegaphone size={16} />,
      path: `/events/${id}/manage/promote`
    },
    {
      label: "Engagement",
      icon: <BsChatDots size={16} />,
      path: `/events/${id}/manage/engagement`
    },
    {
      label: "Event Library",
      icon: <BsFolder size={16} />,
      path: `/events/${id}/manage/library`
    },
    {
      label: "Custom Forms",
      icon: <BsFileText size={16} />,
      path: `/events/${id}/manage/forms`
    },
  ];

  return (
    <div
      ref={navRef}
      onScroll={reportScrollPosition}
      className="manage-subnav bg-white border-end"
      style={{
        width: "220px",
        minWidth: "220px",
        height: "100%",
        padding: "12px 10px"
      }}
    >
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `event-sub-sidebar-link d-flex align-items-center gap-3 text-decoration-none px-3 py-2 rounded-3 mb-2 ${
              isActive ? "bg-primary-subtle text-primary" : "text-dark"
            }`
          }
          style={{
            fontSize: "14px",
            fontWeight: 500
          }}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default ManageSidebar;
