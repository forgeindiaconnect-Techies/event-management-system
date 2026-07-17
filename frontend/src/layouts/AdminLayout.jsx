import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BsList } from "react-icons/bs";
import AdminSidebar from "../components/Admin/AdminSidebar";
import AdminNavbar from "../components/Navbar/AdminNavbar";

function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ background: "#f4f6f9" }}>
      {/* Fixed Navbar */}
      <div
        className="admin-layout-navbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <AdminNavbar />
      </div>

      <button
        type="button"
        className="admin-mobile-menu-button"
        onClick={() => setMobileMenuOpen((open) => !open)}
        aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
        aria-expanded={mobileMenuOpen}
      >
        <BsList />
      </button>

      {/* Fixed Sidebar */}
      <div
        className={`admin-layout-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        style={{
          position: "fixed",
          top: "50px",
          left: 0,
          width: "200px",
          height: "calc(100vh - 50px)",
          zIndex: 999,
          background: "#fff",
        }}
      >
        <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-mobile-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Scrollable Content */}
      <main
        className="admin-layout-main p-4"
        style={{
          marginLeft: "200px",
          marginTop: "50px",
          minHeight: "calc(100vh - 50px)",
          background: "#f4f6f9",
          overflowX: "hidden",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
