import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { BsFilm, BsBoxArrowRight, BsPersonCircle, BsPeople } from "react-icons/bs";
import ficLogo from "../assets/images/fic-logo.png";
import "../styles/Admin.css"; 

export default function ContentOperationsLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      {/* Top Navbar - Full Width */}
      <header className="sa-topbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, borderRadius: 0, height: "60px", padding: "0 20px" }}>
        <div className="sa-topbar-brand" onClick={() => navigate("/content-operations")} style={{ background: "transparent", color: "#fff", cursor: "pointer" }}>
          <img src={ficLogo} alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "8px", marginRight: "10px" }} />
          <strong>Content</strong><i /> <span>Operations</span>
        </div>
        
        <div className="sa-topbar-profile" style={{ cursor: "pointer" }}>
          <button type="button">
            <span><strong>Content Team</strong><small>Platform Admin</small></span>
            <b>CO</b>
          </button>
        </div>
      </header>

      {/* Sidebar - Below Navbar */}
      <aside style={{ position: "fixed", top: "60px", left: 0, width: "260px", height: "calc(100vh - 60px)", backgroundColor: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", zIndex: 999 }}>
        <nav style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            <li>
              <NavLink 
                to="/content-operations/movies"
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", 
                  backgroundColor: isActive && window.location.pathname === "/content-operations/movies" ? "#eff6ff" : "transparent", 
                  color: isActive && window.location.pathname === "/content-operations/movies" ? "#2563eb" : "#475569", 
                  borderRadius: "8px", textDecoration: "none", fontWeight: "600"
                })}
              >
                <BsFilm /> Saved Movie List
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/content-operations/add-movie"
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", 
                  backgroundColor: isActive ? "#eff6ff" : "transparent", 
                  color: isActive ? "#2563eb" : "#475569", 
                  borderRadius: "8px", textDecoration: "none", fontWeight: "600"
                })}
              >
                <BsFilm /> Add New Movie
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/content-operations/cast-crew"
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", 
                  backgroundColor: isActive ? "#eff6ff" : "transparent", 
                  color: isActive ? "#2563eb" : "#475569", 
                  borderRadius: "8px", textDecoration: "none", fontWeight: "600"
                })}
              >
                <BsPeople /> Cast & Crew
              </NavLink>
            </li>
          </ul>
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", backgroundColor: "transparent", border: "none", color: "#64748b", fontWeight: "600", cursor: "pointer" }}>
            <BsBoxArrowRight /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: "260px", marginTop: "60px", padding: "30px", minHeight: "calc(100vh - 60px)", overflowX: "hidden" }}>
        <Outlet />
      </main>
    </div>
  );
}
