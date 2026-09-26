import React, { useState, useEffect } from "react";
import { BsPlus, BsPencil, BsTrash, BsImage, BsCheckCircle, BsBagCheckFill, BsCheck2Circle } from "react-icons/bs";
import api from "../../api/axiosConfig";

const TheaterManagerMenuEditor = ({ theaterId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Online Food Pre-Booking Facility Toggle
  const effectiveTheaterId = theaterId || localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";
  const [onlineFoodBookingEnabled, setOnlineFoodBookingEnabled] = useState(() => {
    const saved = localStorage.getItem(`theater_online_fb_enabled_${effectiveTheaterId}`);
    return saved !== null ? saved === "true" : true; // default true so owners can test immediately
  });
  const [toggleFeedback, setToggleFeedback] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "Popcorn",
    price: "",
    imageUrl: "",
    description: "",
    isAvailable: true,
    stockLevel: "",
    options: [],
  });

  const categories = ["Popcorn", "Beverage", "Combo", "Snack", "Candy"];

  useEffect(() => {
    fetchMenu();
    loadTheaterSettings();
  }, [theaterId]);

  const loadTheaterSettings = async () => {
    const tId = effectiveTheaterId;
    if (!tId) return;
    try {
      const res = await api.get(`/theater/portal-profile/${tId}`);
      if (res.data && res.data.enableOnlineFoodBooking !== undefined) {
        setOnlineFoodBookingEnabled(Boolean(res.data.enableOnlineFoodBooking));
        localStorage.setItem(`theater_online_fb_enabled_${tId}`, String(res.data.enableOnlineFoodBooking));
      }
    } catch (e) {
      // Fallback already read from localStorage
    }
  };

  const handleToggleOnlineBooking = async (e) => {
    const newVal = e.target.checked;
    setOnlineFoodBookingEnabled(newVal);
    const tId = effectiveTheaterId;

    // Save across all candidate keys so any component / session gets the exact same state
    localStorage.setItem(`theater_online_fb_enabled_${tId}`, String(newVal));
    if (theaterId) localStorage.setItem(`theater_online_fb_enabled_${theaterId}`, String(newVal));
    const pId = localStorage.getItem("portalId");
    if (pId) localStorage.setItem(`theater_online_fb_enabled_${pId}`, String(newVal));
    const uPId = localStorage.getItem("userPortalId");
    if (uPId) localStorage.setItem(`theater_online_fb_enabled_${uPId}`, String(newVal));
    localStorage.setItem("theater_online_fb_enabled_latest", String(newVal));
    localStorage.setItem("theater_online_fb_enabled_global", String(newVal));

    window.dispatchEvent(new Event("theater_online_fb_changed"));
    window.dispatchEvent(new CustomEvent("theater_online_fb_status_update", { detail: { enabled: newVal, theaterId: tId } }));

    setToggleFeedback(
      newVal
        ? "Online food pre-booking is now ENABLED! Ticket buyers will see your menu during booking."
        : "Online food pre-booking is now DISABLED. Moviegoers will order at physical counters only."
    );
    setTimeout(() => setToggleFeedback(""), 4500);

    try {
      await api.put(`/theater/portal-profile/${tId}`, {
        enableOnlineFoodBooking: newVal,
      });
    } catch (err) {
      console.warn("Could not sync online food booking setting to backend profile:", err);
    }
  };

  const fetchMenu = async () => {
    const tId = theaterId || localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";
    if (!tId) return;
    try {
      setLoading(true);
      const res = await api.get(`/fb/menu/${tId}`);
      if (Array.isArray(res.data)) setMenuItems(res.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tId = theaterId || localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stockLevel: formData.stockLevel ? parseInt(formData.stockLevel) : null,
        theater: { id: tId },
      };

      if (editingItem) {
        await api.put(`/fb/menu/${editingItem.id}`, payload);
      } else {
        await api.post(`/fb/menu`, payload);
      }

      setFormData({ name: "", category: "Popcorn", price: "", imageUrl: "", description: "", isAvailable: true, stockLevel: "", options: [] });
      setEditingItem(null);
      setShowForm(false);
      fetchMenu();
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert("Failed to save menu item.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl || "",
      description: item.description || "",
      isAvailable: item.isAvailable,
      stockLevel: item.stockLevel || "",
      options: item.options ? item.options.map(o => ({ name: o.name, additionalPrice: o.additionalPrice })) : [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await api.delete(`/fb/menu/${id}`);
        fetchMenu();
      } catch (err) {
        console.error("Error deleting menu item:", err);
        alert("Failed to delete item.");
      }
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const payload = { ...item, isAvailable: !item.isAvailable };
      await api.put(`/fb/menu/${item.id}`, payload);
      fetchMenu();
    } catch (err) {
      console.error("Error updating availability:", err);
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, { name: "", additionalPrice: 0 }] });
  };

  const removeOption = (index) => {
    setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
  };

  if (loading) return <div>Loading F&B Menu...</div>;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      {/* ONLINE FOOD PRE-BOOKING TOGGLE CARD */}
      <div 
        className="card border-0 mb-4 overflow-hidden shadow-sm" 
        style={{ 
          background: "linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)", 
          borderRadius: "14px", 
          border: "1px solid #e2e8f0" 
        }}
      >
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-start gap-3">
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  background: onlineFoodBookingEnabled 
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                    : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                  transition: "background 0.3s ease" 
                }}
              >
                <BsBagCheckFill size={22} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <h5 className="fw-bold mb-0 text-dark">Online Food Pre-Booking with Tickets</h5>
                  <span className={`badge rounded-pill px-2.5 py-1 small fw-semibold ${onlineFoodBookingEnabled ? "bg-success text-white" : "bg-secondary text-white"}`}>
                    {onlineFoodBookingEnabled ? "✓ Active (Public Can Pre-Order)" : "✕ Disabled (Counter Only)"}
                  </span>
                </div>
                <p className="text-secondary small mb-0" style={{ maxWidth: "620px", lineHeight: "1.4" }}>
                  {onlineFoodBookingEnabled 
                    ? "Moviegoers booking show tickets online will see your active menu right after seat selection and can pre-order snacks for quick concession counter pickup." 
                    : "Public ticket booking flow skips food selection completely. Guests can only buy refreshments directly at physical concession counters."}
                </p>
              </div>
            </div>

            <div className="form-check form-switch ps-0 d-flex align-items-center gap-2 justify-content-start justify-content-md-end">
              <label 
                htmlFor="onlineFoodBookingSwitch" 
                className="form-check-label fw-bold small text-muted text-uppercase cursor-pointer me-2"
                style={{ letterSpacing: "0.5px", fontSize: "12px" }}
              >
                {onlineFoodBookingEnabled ? "Facility Enabled" : "Facility Disabled"}
              </label>
              <input
                className="form-check-input ms-0"
                type="checkbox"
                role="switch"
                id="onlineFoodBookingSwitch"
                style={{ width: "3.2em", height: "1.7em", cursor: "pointer" }}
                checked={onlineFoodBookingEnabled}
                onChange={handleToggleOnlineBooking}
              />
            </div>
          </div>

          {toggleFeedback && (
            <div className="alert alert-success d-flex align-items-center gap-2 mt-3 mb-0 py-2 px-3 small rounded-3 shadow-xs fade show border-0 bg-success text-white">
              <BsCheck2Circle size={18} />
              <span>{toggleFeedback}</span>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1 fw-bold">Food & Beverage Menu</h4>
          <p className="text-muted small mb-0">Manage concession catalog, variants, pricing and real-time stock</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={() => { setEditingItem(null); setShowForm(!showForm); }}>
          <BsPlus size={20} /> {showForm ? "Cancel" : "Add Menu Item"}
        </button>
      </div>

      {showForm && (
        <div className="card card-body bg-light mb-4 border-0">
          <h5 className="mb-3">{editingItem ? "Edit Menu Item" : "New Menu Item"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Item Name</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={formData.category} onChange={handleInputChange}>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Price (₹)</label>
                <input type="number" step="0.01" className="form-control" name="price" value={formData.price} onChange={handleInputChange} required />
              </div>
              <div className="col-md-5">
                <label className="form-label">Image URL</label>
                <input type="text" className="form-control" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://..." />
              </div>
              <div className="col-md-4">
                <label className="form-label">Description / Size</label>
                <input type="text" className="form-control" name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., 500ml, Large, Extra Cheese" />
              </div>
              <div className="col-md-3">
                <label className="form-label">Stock Level (Optional)</label>
                <input type="number" className="form-control" name="stockLevel" value={formData.stockLevel} onChange={handleInputChange} placeholder="Unlimited" />
              </div>
              <div className="col-12">
                <div className="form-check form-switch mt-2">
                  <input className="form-check-input" type="checkbox" role="switch" name="isAvailable" id="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} />
                  <label className="form-check-label" htmlFor="isAvailable">Currently Available for Sale</label>
                </div>
              </div>

              {/* Options Section */}
              <div className="col-12 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold mb-0">Variants / Options (Optional)</label>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOption}>
                    <BsPlus /> Add Option
                  </button>
                </div>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2 align-items-center bg-white p-2 border rounded">
                    <input type="text" className="form-control form-control-sm" placeholder="Option Name (e.g. 500ml)" value={opt.name} onChange={(e) => handleOptionChange(idx, "name", e.target.value)} required />
                    <div className="input-group input-group-sm w-50">
                      <span className="input-group-text">+₹</span>
                      <input type="number" className="form-control" placeholder="Extra Price" value={opt.additionalPrice} onChange={(e) => handleOptionChange(idx, "additionalPrice", e.target.value)} required />
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeOption(idx)}>
                      <BsTrash />
                    </button>
                  </div>
                ))}
              </div>
              <div className="col-12 mt-3 text-end">
                <button type="submit" className="btn btn-success px-4">{editingItem ? "Update Item" : "Save Item"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Image</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No menu items found. Add some!</td>
              </tr>
            ) : (
              menuItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }} />
                    ) : (
                      <div className="bg-light d-flex align-items-center justify-content-center text-muted" style={{ width: "40px", height: "40px", borderRadius: "8px" }}>
                        <BsImage />
                      </div>
                    )}
                  </td>
                  <td className="fw-semibold">{item.name}</td>
                  <td><span className="badge bg-secondary">{item.category}</span></td>
                  <td>₹{item.price}</td>
                  <td>{item.stockLevel !== null ? item.stockLevel : "∞"}</td>
                  <td>
                    <button 
                      onClick={() => toggleAvailability(item)}
                      className={`btn btn-sm ${item.isAvailable ? "btn-outline-success" : "btn-outline-danger"} rounded-pill px-3`}
                      style={{ fontSize: "12px" }}
                    >
                      {item.isAvailable ? "Available" : "Out of Stock"}
                    </button>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-light me-2 text-primary" onClick={() => handleEdit(item)}><BsPencil /></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(item.id)}><BsTrash /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TheaterManagerMenuEditor;
