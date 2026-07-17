import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/axiosConfig";
import "../styles/Admin.css";
import {
  BsBuilding,
  BsCheckCircle,
  BsGear,
  BsImage,
} from "react-icons/bs";

function Settings() {
  const [portal, setPortal] = useState({
    portalName: "",
    portalCode: "",
    description: "",
    category: "",
    logoUrl: "",
    active: true,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPortal();
  }, []);

  const fetchPortal = async () => {
    const portalId = localStorage.getItem("portalId");

    if (!portalId) {
      setMessage("Please login again. Portal details are missing.");
      return;
    }

    try {
      const response = await api.get(`/portals/${portalId}`);
      setPortal({
        portalName: response.data.portalName || "",
        portalCode: response.data.portalCode || "",
        description: response.data.description || "",
        category: response.data.category || "",
        logoUrl: response.data.logoUrl || "",
        active: response.data.active ?? true,
      });
      setMessage("");
    } catch (error) {
      console.log(error);
      setMessage("Unable to load portal settings.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPortal({
      ...portal,
      [name]: value,
    });
  };

  const handleSave = async () => {
    const portalId = localStorage.getItem("portalId");

    try {
      setLoading(true);
      await api.put(`/portals/${portalId}`, {
        portalName: portal.portalName,
        description: portal.description,
        category: portal.category,
        logoUrl: portal.logoUrl,
        active: portal.active,
      });

      localStorage.setItem("portalName", portal.portalName);

      setMessage("Portal settings updated successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Unable to update portal settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="portal-settings-page">
      <div className="portal-settings-heading mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "24px" }}>
          Portal Settings
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Manage portal information, branding and workspace status.
        </p>
      </div>

      {message && (
        <div className="alert alert-info" style={{ fontSize: "15px" }}>
          {message}
        </div>
      )}

      <div className="portal-settings-grid admin-page-grid row g-4">
        <div className="col-md-8">
          <div className="admin-bento-card">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="admin-bento-icon mb-0">
                <BsBuilding />
              </div>

              <div>
                <h2 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
                  Portal Information
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
                  Update your portal details.
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Portal Name</label>
              <input
                className="form-control"
                name="portalName"
                value={portal.portalName}
                onChange={handleChange}
                style={{ height: "44px", fontSize: "15px" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Portal Code</label>
              <input
                className="form-control"
                value={portal.portalCode || "Not generated"}
                readOnly
                style={{ height: "44px", fontSize: "15px", background: "#f4f6f9" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                name="category"
                value={portal.category}
                onChange={handleChange}
                style={{ height: "44px", fontSize: "15px" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="4"
                name="description"
                value={portal.description}
                onChange={handleChange}
                style={{ fontSize: "15px" }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
              style={{
                borderRadius: "10px",
                fontSize: "15px",
                padding: "9px 22px",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="col-md-4">
          <div className="admin-bento-card mb-4">
            <div className="admin-bento-icon">
              <BsCheckCircle />
            </div>

            <p className="admin-bento-label">Portal Status</p>
            <h2 className="admin-bento-value">
              {portal.active ? "Active" : "Inactive"}
            </h2>

            <p className="text-muted mt-3 mb-0" style={{ fontSize: "15px" }}>
              This portal is currently available for event management.
            </p>
          </div>

          <div className="admin-bento-card">
            <div className="admin-bento-icon">
              <BsImage />
            </div>

            <h2 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
              Branding
            </h2>

            <label className="form-label">Logo URL</label>
            <input
              className="form-control mb-3"
              name="logoUrl"
              value={portal.logoUrl}
              onChange={handleChange}
              placeholder="Paste logo URL"
              style={{ height: "44px", fontSize: "15px" }}
            />

            {portal.logoUrl ? (
              <img
                src={portal.logoUrl}
                alt="Portal Logo"
                style={{
                  width: "100%",
                  height: "130px",
                  objectFit: "contain",
                  borderRadius: "16px",
                  background: "#f4f6f9",
                  padding: "12px",
                }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  height: "130px",
                  borderRadius: "16px",
                  background: "#f4f6f9",
                  color: "#6b7280",
                  fontSize: "15px",
                }}
              >
                No logo added
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}

export default Settings;
