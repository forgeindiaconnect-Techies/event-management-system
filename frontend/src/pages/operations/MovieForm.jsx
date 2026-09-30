import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import { BsArrowLeft, BsStarFill } from "react-icons/bs";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";

export default function MovieForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [persons, setPersons] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    posterUrl: "",
    trailerUrl: "",
    synopsis: "",
    genre: "",
    language: "",
    durationMinutes: "",
    certification: "U",
    releaseDate: "",
    rating: "",
    totalVotes: "",
    likes: "",
    castAndCrewIds: []
  });

  const stringToOptions = (str) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s).map(s => ({ value: s, label: s }));
  };

  const optionsToString = (options) => {
    if (!options) return "";
    return options.map(o => o.value).join(', ');
  };

  useEffect(() => {
    // Fetch persons for multiselect
    api.get("/cast-crew")
      .then(res => setPersons(res.data))
      .catch(err => console.error("Failed to load cast & crew", err));

    if (id) {
      setLoading(true);
      api.get(`/movies/${id}`)
        .then(res => {
          const movie = res.data;
          let localMeta = {};
          try {
            localMeta = JSON.parse(localStorage.getItem(`movie_rating_meta_${id}`) || "{}");
          } catch (e) {}

          setFormData({
            title: movie.title || "",
            posterUrl: movie.posterUrl || "",
            trailerUrl: movie.trailerUrl || "",
            synopsis: movie.synopsis || "",
            genre: movie.genre || "",
            language: movie.language || "",
            durationMinutes: movie.durationMinutes || "",
            certification: movie.certification || "U",
            releaseDate: movie.releaseDate || "",
            rating: movie.rating !== undefined && movie.rating !== null ? String(movie.rating) : (localMeta.rating !== undefined && localMeta.rating !== null ? String(localMeta.rating) : ""),
            totalVotes: movie.totalVotes || localMeta.totalVotes || "",
            likes: movie.likes || localMeta.likes || "",
            castAndCrewIds: movie.castAndCrew ? movie.castAndCrew.map(p => p.id) : []
          });
        })
        .catch(err => console.error("Failed to load movie", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setFormData(prev => ({ ...prev, castAndCrewIds: selected }));
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("file", file);
    try {
      const res = await api.post("/upload", uploadData, { headers: { "Content-Type": "multipart/form-data" }});
      if (res.data && res.data.url) {
        setFormData(prev => ({ ...prev, posterUrl: res.data.url }));
      }
    } catch (err) {
      alert("Failed to upload poster.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map castAndCrewIds to the object structure expected by the backend (@ManyToMany Set<Person>)
      const parsedRating = formData.rating !== "" && !isNaN(Number(formData.rating)) ? parseFloat(formData.rating) : null;
      const payload = {
        ...formData,
        rating: parsedRating,
        totalVotes: formData.totalVotes.trim() || null,
        likes: formData.likes.trim() || null,
        castAndCrew: formData.castAndCrewIds.map(personId => ({ id: personId }))
      };

      let savedMovie = null;
      if (id) {
        const res = await api.put(`/movies/${id}`, payload);
        savedMovie = res.data;
      } else {
        const res = await api.post("/movies", payload);
        savedMovie = res.data;
      }

      // Persist rating, vote, & likes meta in localStorage so changes reflect everywhere immediately
      const effectiveSavedId = id || savedMovie?.id;
      if (effectiveSavedId) {
        localStorage.setItem(`movie_rating_meta_${effectiveSavedId}`, JSON.stringify({
          rating: parsedRating,
          totalVotes: payload.totalVotes,
          likes: payload.likes,
        }));
      }

      navigate("/content-operations/movies");
    } catch (err) {
      console.error("Error saving movie", err);
      alert("Failed to save movie.");
    }
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}>Loading movie details...</div>;

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "30px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <button 
        onClick={() => navigate("/content-operations/movies")}
        style={{ background: "none", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", cursor: "pointer", marginBottom: "25px", padding: 0 }}
      >
        <BsArrowLeft /> Back to Movie List
      </button>

      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", marginBottom: "25px" }}>
        {id ? "Edit Movie Details" : "Add New Movie"}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Movie Title *</label>
          <input required type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Poster Image (Upload or Paste URL)</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="text" name="posterUrl" value={formData.posterUrl} onChange={handleInputChange} placeholder="https://..." style={{ flex: 1, padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} />
            <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.85rem" }}>OR</span>
            <label style={{ backgroundColor: "#f1f5f9", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", color: "#334155", border: "1px solid #cbd5e1", fontWeight: "600", fontSize: "0.9rem" }}>
              Upload File
              <input type="file" accept="image/*" onChange={handlePosterUpload} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Trailer URL (YouTube)</label>
          <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Genre</label>
          <CreatableSelect
            isMulti
            name="genre"
            options={[
              { value: "Action", label: "Action" },
              { value: "Adventure", label: "Adventure" },
              { value: "Comedy", label: "Comedy" },
              { value: "Drama", label: "Drama" },
              { value: "Fantasy", label: "Fantasy" },
              { value: "Horror", label: "Horror" },
              { value: "Romance", label: "Romance" },
              { value: "Sci-Fi", label: "Sci-Fi" },
              { value: "Thriller", label: "Thriller" }
            ]}
            value={stringToOptions(formData.genre)}
            onChange={(selected) => setFormData(prev => ({ ...prev, genre: optionsToString(selected) }))}
            placeholder="Select or type genres..."
            styles={{ control: (base) => ({ ...base, padding: "2px", borderRadius: "8px", borderColor: "#cbd5e1" }) }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Language</label>
          <CreatableSelect
            isMulti
            name="language"
            options={[
              { value: "Tamil", label: "Tamil" },
              { value: "Telugu", label: "Telugu" },
              { value: "Malayalam", label: "Malayalam" },
              { value: "Hindi", label: "Hindi" },
              { value: "Kannada", label: "Kannada" },
              { value: "English", label: "English" }
            ]}
            value={stringToOptions(formData.language)}
            onChange={(selected) => setFormData(prev => ({ ...prev, language: optionsToString(selected) }))}
            placeholder="Select or type languages..."
            styles={{ control: (base) => ({ ...base, padding: "2px", borderRadius: "8px", borderColor: "#cbd5e1" }) }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Duration</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input type="number" min="0" value={Math.floor((parseInt(formData.durationMinutes) || 0) / 60) || ""} onChange={(e) => {
                const h = parseInt(e.target.value) || 0;
                const m = (parseInt(formData.durationMinutes) || 0) % 60;
                setFormData(prev => ({ ...prev, durationMinutes: (h * 60) + m }));
              }} placeholder="0" style={{ width: "100%", padding: "10px 15px", paddingRight: "40px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} />
              <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.85rem", pointerEvents: "none" }}>hrs</span>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <input type="number" min="0" max="59" value={(parseInt(formData.durationMinutes) || 0) % 60 || ""} onChange={(e) => {
                let m = parseInt(e.target.value) || 0;
                if (m > 59) m = 59;
                const h = Math.floor((parseInt(formData.durationMinutes) || 0) / 60);
                setFormData(prev => ({ ...prev, durationMinutes: (h * 60) + m }));
              }} placeholder="0" style={{ width: "100%", padding: "10px 15px", paddingRight: "40px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} />
              <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.85rem", pointerEvents: "none" }}>min</span>
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Certification</label>
          <select name="certification" value={formData.certification} onChange={handleInputChange} style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem", backgroundColor: "#fff" }}>
            <option value="U">U (Universal)</option>
            <option value="U/A">U/A (Parental Guidance)</option>
            <option value="A">A (Adults Only)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Release Date</label>
          <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} />
        </div>

        {/* AUDIENCE RATING & REVIEWS CONFIGURATION */}
        <div style={{ gridColumn: "1 / -1", backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center" }}>
                <BsStarFill size={18} />
              </span>
              <div>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#1e293b" }}>Audience Rating & Review Metrics</h4>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Update the official movie rating and total votes displayed on the public movie details page</span>
              </div>
            </div>
            <div>
              {formData.rating ? (
                <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "5px 14px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "700", border: "1px solid #fde68a" }}>
                  ★ {formData.rating}/10 {formData.totalVotes ? `(${formData.totalVotes} Votes)` : ""}
                </span>
              ) : formData.likes ? (
                <span style={{ backgroundColor: "#ecfdf5", color: "#047857", padding: "5px 14px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "700", border: "1px solid #a7f3d0" }}>
                  👍 {formData.likes} Likes (Unrated)
                </span>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", color: "#475569", fontWeight: "600", fontSize: "0.85rem" }}>
                Base Rating (out of 10)
              </label>
              <div style={{ position: "relative" }}>
                <input 
                  type="number" 
                  name="rating" 
                  step="0.1" 
                  min="1" 
                  max="10" 
                  placeholder="e.g. 9.2 (blank if unrated)" 
                  value={formData.rating} 
                  onChange={handleInputChange} 
                  style={{ width: "100%", padding: "10px 15px", paddingRight: "50px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} 
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.85rem", pointerEvents: "none" }}>
                  / 10
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {[9.5, 9.2, 8.8, 8.5].map((preset) => (
                  <button 
                    key={preset} 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, rating: String(preset) }))}
                    style={{ fontSize: "0.75rem", padding: "3px 7px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", color: "#334155", fontWeight: "500" }}
                  >
                    ★ {preset}
                  </button>
                ))}
                {formData.rating && (
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, rating: "" }))}
                    style={{ fontSize: "0.75rem", padding: "3px 7px", borderRadius: "4px", border: "1px solid #fecaca", backgroundColor: "#fee2e2", cursor: "pointer", color: "#b91c1c", fontWeight: "500" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", color: "#475569", fontWeight: "600", fontSize: "0.85rem" }}>
                Total Votes Text
              </label>
              <input 
                type="text" 
                name="totalVotes" 
                placeholder="e.g. 34.8K or 25,000" 
                value={formData.totalVotes} 
                onChange={handleInputChange} 
                style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} 
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {["34.8K", "25K", "15K", "5.2K"].map((preset) => (
                  <button 
                    key={preset} 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, totalVotes: preset }))}
                    style={{ fontSize: "0.75rem", padding: "3px 7px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", color: "#334155", fontWeight: "500" }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", color: "#475569", fontWeight: "600", fontSize: "0.85rem" }}>
                Audience Likes (Fallback)
              </label>
              <input 
                type="text" 
                name="likes" 
                placeholder="e.g. 24.5K (shown if unrated)" 
                value={formData.likes} 
                onChange={handleInputChange} 
                style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem" }} 
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {["45.2K", "24.5K", "18.6K", "9.2K"].map((preset) => (
                  <button 
                    key={preset} 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, likes: preset }))}
                    style={{ fontSize: "0.75rem", padding: "3px 7px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", color: "#334155", fontWeight: "500" }}
                  >
                    👍 {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Cast (Select multiple)</label>
            <Select 
              isMulti
              options={persons.filter(p => {
                const role = (p.primaryRole || "").toLowerCase();
                return role.includes("actor") || role.includes("actress");
              }).map(p => ({ value: p.id, label: `${p.name} (${p.primaryRole})` }))}
              value={formData.castAndCrewIds.map(id => {
                const p = persons.find(person => person.id === id);
                if (!p) return null;
                const role = (p.primaryRole || "").toLowerCase();
                if (role.includes("actor") || role.includes("actress")) {
                  return { value: p.id, label: `${p.name} (${p.primaryRole})` };
                }
                return null;
              }).filter(Boolean)}
              onChange={(selectedOptions) => {
                const selectedIds = selectedOptions ? selectedOptions.map(o => o.value) : [];
                // Find IDs that are currently selected but belong ONLY to the crew side
                const crewIdsToKeep = formData.castAndCrewIds.filter(id => {
                  const p = persons.find(person => person.id === id);
                  if (!p) return false;
                  const role = (p.primaryRole || "").toLowerCase();
                  // Keep if they are NOT cast
                  return !(role.includes("actor") || role.includes("actress"));
                });
                setFormData(prev => ({ 
                  ...prev, 
                  castAndCrewIds: [...new Set([...selectedIds, ...crewIdsToKeep])] 
                }));
              }}
              placeholder="Search and select cast..."
              styles={{
                control: (base) => ({
                  ...base, padding: "2px", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "none",
                  "&:hover": { borderColor: "#94a3b8" }
                })
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Crew (Select multiple)</label>
            <Select 
              isMulti
              options={persons.filter(p => {
                const role = (p.primaryRole || "").toLowerCase();
                const roles = role.split(',').map(r => r.trim());
                // Include if they have any role that is NOT actor/actress
                return roles.some(r => !(r.includes("actor") || r.includes("actress")));
              }).map(p => ({ value: p.id, label: `${p.name} (${p.primaryRole})` }))}
              value={formData.castAndCrewIds.map(id => {
                const p = persons.find(person => person.id === id);
                if (!p) return null;
                const role = (p.primaryRole || "").toLowerCase();
                const roles = role.split(',').map(r => r.trim());
                if (roles.some(r => !(r.includes("actor") || r.includes("actress")))) {
                  return { value: p.id, label: `${p.name} (${p.primaryRole})` };
                }
                return null;
              }).filter(Boolean)}
              onChange={(selectedOptions) => {
                const selectedIds = selectedOptions ? selectedOptions.map(o => o.value) : [];
                // Find IDs that are currently selected but belong ONLY to the cast side
                const castIdsToKeep = formData.castAndCrewIds.filter(id => {
                  const p = persons.find(person => person.id === id);
                  if (!p) return false;
                  const role = (p.primaryRole || "").toLowerCase();
                  const roles = role.split(',').map(r => r.trim());
                  // Keep if they are ONLY cast (no crew roles)
                  return !roles.some(r => !(r.includes("actor") || r.includes("actress")));
                });
                setFormData(prev => ({ 
                  ...prev, 
                  castAndCrewIds: [...new Set([...selectedIds, ...castIdsToKeep])] 
                }));
              }}
              placeholder="Search and select crew..."
              styles={{
                control: (base) => ({
                  ...base, padding: "2px", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "none",
                  "&:hover": { borderColor: "#94a3b8" }
                })
              }}
            />
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Synopsis</label>
          <textarea rows="4" name="synopsis" value={formData.synopsis} onChange={handleInputChange} style={{ width: "100%", padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "0.95rem", resize: "vertical" }}></textarea>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "15px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
          <button type="button" onClick={() => navigate("/content-operations/movies")} style={{ backgroundColor: "#fff", border: "1px solid #cbd5e1", color: "#475569", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Cancel</button>
          <button type="submit" style={{ backgroundColor: "#2563eb", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }}>{id ? "Update Movie" : "Save Movie"}</button>
        </div>
      </form>
    </div>
  );
}
