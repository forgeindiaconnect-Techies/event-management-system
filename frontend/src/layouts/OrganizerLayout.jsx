import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BsList } from "react-icons/bs";
import OrganizerSidebar from "../components/OrganizerSidebar";
import OrganizerNavbar from "../components/Navbar/OrganizerNavbar";

function OrganizerLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  return (
    <div>
      <div className="organizer-layout-navbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <OrganizerNavbar />
      </div>

      <button type="button" className="organizer-mobile-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Open organizer menu" aria-expanded={mobileMenuOpen}>
        <BsList />
      </button>

      <div
        className={`organizer-layout-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        style={{
          position: "fixed",
          top: "50px",
          left: 0,
          width: "250px",
          height: "calc(100vh - 50px)",
          zIndex: 999,
          background: "#fff",
        }}
      >
        <OrganizerSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {mobileMenuOpen && <button type="button" className="organizer-mobile-sidebar-backdrop" aria-label="Close organizer menu" onClick={() => setMobileMenuOpen(false)} />}

      <main
        className="organizer-layout-main p-4"
        style={{
          marginLeft: "250px",
          marginTop: "50px",
          backgroundColor: "#f8f9fa",
          minHeight: "calc(100vh - 50px)",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default OrganizerLayout;
