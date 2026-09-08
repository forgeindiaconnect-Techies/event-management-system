import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { BsFilm, BsPlusLg, BsSearch, BsClockHistory, BsTranslate, BsPencil, BsTrash } from "react-icons/bs";

export default function MoviesList() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/movies");
      setMovies(res.data);
    } catch (err) {
      console.error("Failed to fetch movies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    try {
      await api.delete(`/movies/${id}`);
      fetchMovies();
    } catch (err) {
      console.error("Error deleting movie", err);
      alert("Failed to delete movie.");
    }
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    (m.genre && m.genre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <BsSearch style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search movies by title or genre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
          />
        </div>
        
        <button 
          onClick={() => navigate("/content-operations/add-movie")}
          style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }}
        >
          <BsPlusLg /> Add New Movie
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading movies...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
          {filteredMovies.map(movie => (
            <div key={movie.id} style={{ backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "350px", width: "100%", position: "relative", backgroundColor: "#f1f5f9" }}>
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BsFilm size={40} color="#cbd5e1" />
                  </div>
                )}
                <div style={{ position: "absolute", top: "12px", right: "12px", backgroundColor: "rgba(255,255,255,0.9)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", color: "#0f172a", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  {movie.certification}
                </div>
              </div>
              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>{movie.title}</h3>
                
                <div style={{ display: "flex", gap: "15px", marginBottom: "15px", color: "#64748b", fontSize: "0.85rem", fontWeight: "500" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><BsClockHistory /> {movie.durationMinutes}m</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><BsTranslate /> {movie.language}</span>
                </div>
                
                <p style={{ color: "#475569", fontSize: "0.9rem", flex: 1, margin: "0 0 20px 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.5" }}>
                  {movie.synopsis}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                  <button onClick={() => navigate(`/content-operations/edit-movie/${movie.id}`)} style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600" }}>
                    <BsPencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(movie.id)} style={{ backgroundColor: "#fef2f2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600" }}>
                    <BsTrash size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
