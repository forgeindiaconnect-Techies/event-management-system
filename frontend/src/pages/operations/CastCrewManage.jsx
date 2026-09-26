import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { BsPersonPlus, BsPencil, BsTrash, BsPerson } from "react-icons/bs";

export default function CastCrewManage() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const [formData, setFormData] = useState({ name: "", profileImageUrl: "", primaryRole: "" });

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cast-crew");
      setPersons(res.data);
    } catch (err) {
      console.error("Failed to load cast & crew", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingPerson(null);
    setFormData({ name: "", profileImageUrl: "", primaryRole: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (person) => {
    setEditingPerson(person);
    setFormData({ ...person });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPerson) {
        await api.put(`/cast-crew/${editingPerson.id}`, formData);
      } else {
        await api.post("/cast-crew", formData);
      }
      fetchPersons();
      closeModal();
    } catch (err) {
      alert("Failed to save person.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this person?")) return;
    try {
      await api.delete(`/cast-crew/${id}`);
      fetchPersons();
    } catch (err) {
      alert("Failed to delete person.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("file", file);
    try {
      const res = await api.post("/upload", uploadData, { headers: { "Content-Type": "multipart/form-data" }});
      if (res.data && res.data.url) {
        setFormData(prev => ({ ...prev, profileImageUrl: res.data.url }));
      }
    } catch (err) {
      alert("Failed to upload image.");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>Cast & Crew Database</h2>
        <button 
          onClick={openAddModal}
          style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }}
        >
          <BsPersonPlus /> Add Person
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading people...</div>
      ) : (
        <>
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#334155", marginBottom: "15px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>Cast (Actors & Actresses)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "25px" }}>
              {persons.filter(p => {
                const role = (p.primaryRole || "").toLowerCase();
                return role.includes("actor") || role.includes("actress");
              }).map(person => (
                <div key={person.id} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                  <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "5px" }}>
                    <button onClick={() => openEditModal(person)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "5px" }}><BsPencil /></button>
                    <button onClick={() => handleDelete(person.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "5px" }}><BsTrash /></button>
                  </div>
                  
                  <div style={{ width: "100px", height: "100px", margin: "0 auto 15px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {person.profileImageUrl ? (
                      <img src={person.profileImageUrl} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <BsPerson size={40} color="#cbd5e1" />
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 5px 0" }}>{person.name}</h3>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem", fontWeight: "500" }}>{person.primaryRole}</p>
                </div>
              ))}
            </div>
            {persons.filter(p => {
              const role = (p.primaryRole || "").toLowerCase();
              return role.includes("actor") || role.includes("actress");
            }).length === 0 && (
              <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No cast members found.</p>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#334155", marginBottom: "15px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>Crew (Directors, Composers, etc.)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "25px" }}>
              {persons.filter(p => {
                const role = (p.primaryRole || "").toLowerCase();
                return !(role.includes("actor") || role.includes("actress"));
              }).map(person => (
                <div key={person.id} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
                  <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "5px" }}>
                    <button onClick={() => openEditModal(person)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "5px" }}><BsPencil /></button>
                    <button onClick={() => handleDelete(person.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "5px" }}><BsTrash /></button>
                  </div>
                  
                  <div style={{ width: "100px", height: "100px", margin: "0 auto 15px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {person.profileImageUrl ? (
                      <img src={person.profileImageUrl} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <BsPerson size={40} color="#cbd5e1" />
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 5px 0" }}>{person.name}</h3>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem", fontWeight: "500" }}>{person.primaryRole}</p>
                </div>
              ))}
            </div>
            {persons.filter(p => {
              const role = (p.primaryRole || "").toLowerCase();
              return !(role.includes("actor") || role.includes("actress"));
            }).length === 0 && (
              <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No crew members found.</p>
            )}
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "30px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}>
              {editingPerson ? "Edit Person" : "Add New Person"}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Primary Role</label>
                <input type="text" name="primaryRole" value={formData.primaryRole} onChange={handleInputChange} placeholder="Actor, Director, Composer..." style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#475569", fontWeight: "600", fontSize: "0.9rem" }}>Profile Image (Upload or Paste URL)</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input type="text" name="profileImageUrl" value={formData.profileImageUrl} onChange={handleInputChange} style={{ flex: 1, padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none" }} />
                  <label style={{ backgroundColor: "#f1f5f9", padding: "10px 15px", borderRadius: "8px", cursor: "pointer", color: "#334155", border: "1px solid #cbd5e1", fontWeight: "600", fontSize: "0.9rem" }}>
                    Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={closeModal} style={{ backgroundColor: "#fff", border: "1px solid #cbd5e1", color: "#475569", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: "#2563eb", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>{editingPerson ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
