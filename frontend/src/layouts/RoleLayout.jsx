import { useState } from "react";
import { BsList, BsXLg } from "react-icons/bs";
import RoleNavbar from "../components/Role/RoleNavbar";
import RoleSidebar from "../components/Role/RoleSidebar";

function RoleLayout({ children, mainClassName = "", sidebarClassName = "" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="role-layout-shell" style={{ background: "#f4f6f9" }}>
      <div className="role-layout-navbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <RoleNavbar />
      </div>

      <button className="role-mobile-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
        <BsList />
      </button>

      <div
        className={`role-layout-sidebar ${menuOpen ? "mobile-open" : ""} ${sidebarClassName}`}
        onClick={(event) => {
          if (event.target.closest("a")) setMenuOpen(false);
        }}
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
        <button className="role-mobile-menu-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><BsXLg /></button>
        <RoleSidebar />
      </div>

      {menuOpen && <button className="role-mobile-menu-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <main
        className={`role-main-content p-4 ${mainClassName}`}
        style={{
          marginLeft: "250px",
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

export default RoleLayout;
