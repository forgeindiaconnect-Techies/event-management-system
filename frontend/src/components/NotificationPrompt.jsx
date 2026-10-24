import { useState, useEffect } from "react";
import { requestNotificationPermissionAndGetToken, syncWebTokenWithBackend } from "../firebase";
import { Bell, Check, X } from "lucide-react";

export default function NotificationPrompt() {
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // If already granted or unsupported or user dismissed it, don't show prompt
  if (permission === "granted" || dismissed || typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  const handleEnable = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || "web-guest@fic.local";
      const token = await requestNotificationPermissionAndGetToken();
      if (token) {
        setPermission("granted");
        if (email) {
          await syncWebTokenWithBackend(email);
        }
        alert("Push notifications enabled successfully! 🔔");
      } else {
        setPermission(Notification.permission);
      }
    } catch (err) {
      console.error("Error enabling notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        color: "#ffffff",
        padding: "14px 18px",
        borderRadius: "14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "380px",
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <div
        style={{
          background: "#3b82f6",
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={20} color="#fff" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: "600" }}>Get Live Updates</div>
        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
          Enable push notifications for booking confirmations and movie alerts.
        </div>
      </div>

      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          padding: "7px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
      >
        {loading ? "Enabling..." : "Enable"}
      </button>

      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
        }}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
