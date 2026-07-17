import { useEffect, useRef } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  BsCreditCard,
  BsListUl,
  BsCheckCircle,
  BsFileText,
  BsGraphUp,
  BsTicketPerforated,
  BsPeople
} from "react-icons/bs";

function RegistrationSidebar({ onScrollEndChange }) {
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

  const items = [
    { label: "Attendees", path: `/events/${id}/registrations/attendees`, icon: <BsPeople size={16} /> },
    { label: "Payments", path: `/events/${id}/registrations/payments`, icon: <BsCreditCard size={16} /> },
    { label: "Ticket Classes", path: `/events/${id}/registrations/ticket-classes`, icon: <BsTicketPerforated size={16} /> },
    { label: "Registration Form", path: `/events/${id}/registrations/form`, icon: <BsFileText size={16} /> },
    { label: "Waitlist", path: `/events/${id}/registrations/waitlist`, icon: <BsListUl size={16} /> },
    { label: "Approval", path: `/events/${id}/registrations/approval`, icon: <BsCheckCircle size={16} /> },
    { label: "Sales Summary", path: `/events/${id}/registrations/sales`, icon: <BsGraphUp size={16} /> }
  ];

  return (
    <div ref={navRef} onScroll={reportScrollPosition} className="registration-subnav bg-white border-end" style={{ width: "220px", minWidth: "220px", padding: "12px 10px" }}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `event-sub-sidebar-link d-flex align-items-center gap-3 text-decoration-none px-3 py-2 rounded-3 mb-2 ${
              isActive ? "bg-primary-subtle text-primary" : "text-dark"
            }`
          }
          style={{ fontSize: "14px", fontWeight: 500 }}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default RegistrationSidebar;
