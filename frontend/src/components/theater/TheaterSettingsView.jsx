import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import {
  BsGearFill,
  BsBuilding,
  BsTicketPerforated,
  BsClockHistory,
  BsCupStraw,
  BsBell,
  BsCheckCircleFill,
  BsShieldCheck,
  BsSave,
  BsArrowCounterclockwise,
  BsExclamationCircle,
  BsInfoCircleFill,
} from "react-icons/bs";

export default function TheaterSettingsView({
  portalId: propPortalId,
  theaterName: propTheaterName,
  isManager = false,
  onProfileUpdated,
}) {
  const portalId =
    propPortalId ||
    localStorage.getItem("portalId") ||
    localStorage.getItem("userPortalId") ||
    "2";

  const [activeSubTab, setActiveSubTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    // General Profile
    portalName: propTheaterName || localStorage.getItem("portalName") || "Cinema Partner",
    theaterType: "MULTIPLEX",
    fullName: localStorage.getItem("userName") || localStorage.getItem("fullName") || "Theater Partner",
    email: localStorage.getItem("email") || localStorage.getItem("userEmail") || "",
    mobileNumber: localStorage.getItem("phoneNumber") || localStorage.getItem("mobileNumber") || "",
    city: localStorage.getItem("city") || localStorage.getItem("theaterCity") || "Chennai",
    address: "Grand Central Mall, 4th Floor, Cinema Wing",
    gstNumber: "33AABCT2389P1Z8",
    licenseNumber: "TN-CIN-2024-8841",
    portalCode: localStorage.getItem("portalCode") || `PORTAL_${portalId}`,

    // Ticketing & Policies
    maxTicketsPerBooking: 8,
    seatLockTimeoutMins: 10,
    allowCancellation: true,
    cancellationCutoffHours: 2,
    refundPercentage: 75,
    termsAndConditions: `Outside food and beverages are strictly not allowed inside the cinema auditorium.
Entry is restricted for individuals below 18 years for movies with 'A' (Adults Only) certification. Valid Govt Photo ID must be presented upon request.
Please arrive at least 15 minutes before the scheduled showtime. Cinema gates close 10 minutes after the feature presentation starts.
Tickets once booked are governed by the venue's cancellation policy and cannot be transferred or exchanged.
In case of 3D movie shows, 3D glasses must be returned in good condition after the show. Damages may be charged.
The cinema management reserves the right of admission and security inspection.`,

    // Showtime & Buffers
    turnaroundMins: 25,
    trailerBufferMins: 10,
    intervalMins: 15,
    defaultPriceNormal: 150,
    defaultPriceGold: 220,
    defaultPriceBalcony: 350,

    // F&B Settings
    enableOnlineFoodBooking: true,
    inSeatDelivery: true,
    concessionGSTRate: 5,

    // Realtime & Notifications
    soundAlertOnBooking: true,
    dailyEmailSummary: true,
    scannerSound: true,
  });

  // Load initial settings from backend & local storage
  useEffect(() => {
    loadSettings();
  }, [portalId]);

  const loadSettings = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Load saved local storage customizations if any
      const localCustom = localStorage.getItem(`theater_settings_${portalId}`);
      let cached = {};
      if (localCustom) {
        try {
          cached = JSON.parse(localCustom);
        } catch {
          // ignore error
        }
      }

      // 2. Fetch backend portal profile
      let backendData = {};
      try {
        const res = await api.get(`/theater/portal-profile/${portalId}`);
        if (res.data) {
          backendData = res.data;
        }
      } catch (err) {
        console.warn("Could not fetch backend portal profile:", err);
      }

      setFormData((prev) => ({
        ...prev,
        ...cached,
        portalName:
          backendData.portalName ||
          cached.portalName ||
          propTheaterName ||
          localStorage.getItem("portalName") ||
          prev.portalName,
        theaterType: backendData.theaterType || cached.theaterType || prev.theaterType,
        fullName: backendData.fullName || cached.fullName || prev.fullName,
        email: backendData.email || cached.email || prev.email,
        mobileNumber: backendData.mobileNumber || cached.mobileNumber || prev.mobileNumber,
        enableOnlineFoodBooking:
          backendData.enableOnlineFoodBooking !== undefined
            ? backendData.enableOnlineFoodBooking
            : cached.enableOnlineFoodBooking !== undefined
            ? cached.enableOnlineFoodBooking
            : prev.enableOnlineFoodBooking,
        portalCode: backendData.portalCode || cached.portalCode || prev.portalCode,
      }));
    } catch (e) {
      console.error("Error loading theater settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSavedSuccess(false);

    try {
      // 1. Sync with backend API
      const backendPayload = {
        portalName: formData.portalName,
        theaterType: formData.theaterType,
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        enableOnlineFoodBooking: formData.enableOnlineFoodBooking,
      };

      try {
        await api.put(`/theater/portal-profile/${portalId}`, backendPayload);
      } catch (backendErr) {
        console.warn("Backend update failed, persisting settings locally:", backendErr);
      }

      // 2. Persist extended settings to localStorage
      localStorage.setItem(`theater_settings_${portalId}`, JSON.stringify(formData));
      if (formData.portalName) {
        localStorage.setItem("portalName", formData.portalName);
      }
      if (formData.email) {
        localStorage.setItem("email", formData.email);
      }
      if (formData.mobileNumber) {
        localStorage.setItem("phoneNumber", formData.mobileNumber);
      }
      if (formData.city) {
        localStorage.setItem("city", formData.city);
        localStorage.setItem("theaterCity", formData.city);
      }

      // 3. Dispatch window events for header & sidebar sync
      window.dispatchEvent(new CustomEvent("portal_profile_updated", { detail: formData }));
      if (onProfileUpdated) {
        onProfileUpdated(formData.portalName);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setErrorMessage("An error occurred while saving theater settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const subTabs = [
    { id: "general", label: "General & Venue Profile", icon: <BsBuilding size={16} /> },
    { id: "ticketing", label: "Booking & Policies", icon: <BsTicketPerforated size={16} /> },
    { id: "buffers", label: "Showtime & Buffers", icon: <BsClockHistory size={16} /> },
    { id: "fnb", label: "F&B Concessions", icon: <BsCupStraw size={16} /> },
    { id: "alerts", label: "Alerts & Notifications", icon: <BsBell size={16} /> },
  ];

  return (
    <div className="theater-settings-container flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
      {/* HEADER SECTION */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <BsGearFill className="text-primary" /> Cinema & Theater Settings
            {isManager && (
              <span className="badge bg-secondary-subtle text-secondary border fs-6 fw-normal">
                Manager Console
              </span>
            )}
          </h4>
          <p className="text-muted small mb-0">
            Configure your theater identity, booking rules, show turnaround buffers, and online operations.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={loadSettings}
            disabled={loading || saving}
            title="Reload settings from server"
          >
            <BsArrowCounterclockwise /> Reload
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-2 fw-semibold shadow-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <BsSave /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {savedSuccess && (
        <div
          className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-4 shadow-sm"
          role="alert"
          style={{ borderRadius: "8px" }}
        >
          <BsCheckCircleFill className="text-success flex-shrink-0 fs-5" />
          <div>
            <strong>Settings saved successfully!</strong> All theater booking parameters, buffers, and profile identity are now active.
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4 shadow-sm"
          role="alert"
          style={{ borderRadius: "8px" }}
        >
          <BsExclamationCircle className="text-danger flex-shrink-0 fs-5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div className="card-header bg-white border-bottom p-0">
          <div className="d-flex flex-wrap gap-1 px-3 pt-2">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`btn border-0 py-2 px-3 d-flex align-items-center gap-2 rounded-top-3 fw-semibold ${
                  activeSubTab === tab.id
                    ? "bg-light text-primary border-bottom border-primary border-3"
                    : "text-secondary hover-bg-light"
                }`}
                style={{
                  fontSize: "14px",
                  borderRadius: "8px 8px 0 0",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-body p-4 bg-light-subtle">
          <form onSubmit={handleSave}>
            {/* SUBTAB 1: GENERAL & VENUE PROFILE */}
            {activeSubTab === "general" && (
              <div className="row g-4">
                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsBuilding className="text-primary" /> Cinema Identity & Branding
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Cinema / Portal Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.portalName}
                          onChange={(e) => handleInputChange("portalName", e.target.value)}
                          placeholder="e.g. INOX Cinemas Marina"
                          required
                        />
                        <div className="form-text">
                          Appears across customer ticket bookings, vouchers, and confirmation emails.
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Theater Exhibition Type
                        </label>
                        <select
                          className="form-select"
                          value={formData.theaterType}
                          onChange={(e) => handleInputChange("theaterType", e.target.value)}
                        >
                          <option value="MULTIPLEX">Multiplex (Multiple Auditoriums)</option>
                          <option value="SINGLE_SCREEN">Single Screen / Heritage Cinema</option>
                          <option value="IMAX_PREMIUM">IMAX / Large Format Experience</option>
                          <option value="DRIVE_IN">Open-Air / Drive-In Cinema</option>
                        </select>
                        <div className="form-text">Defines audit layout and screen management behavior.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">City / Territory</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="e.g. Chennai"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Portal Access Code</label>
                        <input
                          type="text"
                          className="form-control bg-light font-monospace"
                          value={formData.portalCode}
                          readOnly
                          title="System-assigned unique Portal identifier"
                        />
                        <div className="form-text">Unique system code mapped to this cinema console.</div>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">Complete Physical Address</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Building, Street, Landmark, Pincode"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsShieldCheck className="text-success" /> Primary Administrative Contact & Legal
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Admin Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Official Contact Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="partner@cinema.com"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Box Office Helpline / Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.mobileNumber}
                          onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">GST Registration Number</label>
                        <input
                          type="text"
                          className="form-control font-monospace"
                          value={formData.gstNumber}
                          onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                          placeholder="e.g. 33AABCT2389P1Z8"
                        />
                        <div className="form-text">Printed on customer GST invoices & concessions billing.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Exhibition License Code</label>
                        <input
                          type="text"
                          className="form-control font-monospace"
                          value={formData.licenseNumber}
                          onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                          placeholder="e.g. TN-CIN-2024-8841"
                        />
                        <div className="form-text">State cinematic entertainment statutory license.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: BOOKING & POLICIES */}
            {activeSubTab === "ticketing" && (
              <div className="row g-4">
                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsTicketPerforated className="text-primary" /> Box Office & Online Ticketing Rules
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Max Tickets per Transaction
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-control"
                            value={formData.maxTicketsPerBooking}
                            onChange={(e) => handleInputChange("maxTicketsPerBooking", Number(e.target.value))}
                          />
                          <span className="input-group-text">Tickets</span>
                        </div>
                        <div className="form-text">Prevents bulk scalping and black market hoarding.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Temporary Seat Lock Duration
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            min="3"
                            max="25"
                            className="form-control"
                            value={formData.seatLockTimeoutMins}
                            onChange={(e) => handleInputChange("seatLockTimeoutMins", Number(e.target.value))}
                          />
                          <span className="input-group-text">Mins</span>
                        </div>
                        <div className="form-text">Seat lock hold window before releasing back to inventory.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsInfoCircleFill className="text-warning" /> Customer Cancellation & Refund Rules
                    </h6>
                    
                    <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 mb-3">
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                          Allow Self-Service Ticket Cancellation by Customer
                        </div>
                        <div className="text-muted small">
                          When disabled, tickets booked online are strictly non-cancellable and non-refundable.
                        </div>
                      </div>
                      <div className="form-check form-switch fs-5 m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="allowCancellationSwitch"
                          checked={formData.allowCancellation}
                          onChange={(e) => handleInputChange("allowCancellation", e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    {formData.allowCancellation && (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">
                            Cancellation Cutoff Window
                          </label>
                          <div className="input-group">
                            <input
                              type="number"
                              min="1"
                              max="48"
                              className="form-control"
                              value={formData.cancellationCutoffHours}
                              onChange={(e) => handleInputChange("cancellationCutoffHours", Number(e.target.value))}
                            />
                            <span className="input-group-text">Hours</span>
                          </div>
                          <div className="form-text">Cutoff deadline before showtime for customer self-cancellations.</div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">
                            Refund Percentage Allowed
                          </label>
                          <div className="input-group">
                            <input
                              type="number"
                              min="10"
                              max="100"
                              className="form-control"
                              value={formData.refundPercentage}
                              onChange={(e) => handleInputChange("refundPercentage", Number(e.target.value))}
                            />
                            <span className="input-group-text">%</span>
                          </div>
                          <div className="form-text">Refund percentage calculated against base ticket price.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Venue Terms & Conditions / House Rules */}
                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <BsShieldCheck className="text-primary" /> Venue Terms & Conditions / House Rules
                      </h6>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-0.5"
                        style={{ fontSize: "11px" }}
                        onClick={() => {
                          handleInputChange(
                            "termsAndConditions",
                            `Outside food and beverages are strictly not allowed inside the cinema auditorium.
Entry is restricted for individuals below 18 years for movies with 'A' (Adults Only) certification. Valid Govt Photo ID must be presented upon request.
Please arrive at least 15 minutes before the scheduled showtime. Cinema gates close 10 minutes after the feature presentation starts.
Tickets once booked are governed by the venue's cancellation policy and cannot be transferred or exchanged.
In case of 3D movie shows, 3D glasses must be returned in good condition after the show. Damages may be charged.
The cinema management reserves the right of admission and security inspection.`
                          );
                        }}
                      >
                        Reset to Standard Rules
                      </button>
                    </div>
                    <p className="text-muted small mb-2.5">
                      These terms will be presented as a mandatory agreement popup to customers right before they enter the payment section. Each rule should be on its own line.
                    </p>
                    <textarea
                      rows={6}
                      className="form-control font-monospace"
                      style={{ fontSize: "12px", lineHeight: "1.6" }}
                      value={formData.termsAndConditions || ""}
                      onChange={(e) => handleInputChange("termsAndConditions", e.target.value)}
                      placeholder="Enter each venue house rule or condition on a new line..."
                    />
                    <div className="form-text mt-1.5 text-muted small">
                      Tip: You can customize rules regarding outside food, age verification for 'A' rated movies, entry times, and 3D glasses.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: SHOWTIME & BUFFERS */}
            {activeSubTab === "buffers" && (
              <div className="row g-4">
                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsClockHistory className="text-primary" /> Turnaround & Interval Buffers
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">
                          Pre-Show Trailers & Advertisements Time (Minutes)
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            className="form-control"
                            value={formData.trailerBufferMins}
                            onChange={(e) => handleInputChange("trailerBufferMins", Number(e.target.value))}
                          />
                          <span className="input-group-text">mins</span>
                        </div>
                        <div className="form-text">
                          Lead time before feature film starts for commercial advertisements and movie trailers.
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">
                          Intermission / Interval Break (Minutes)
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            className="form-control"
                            value={formData.intervalMins}
                            onChange={(e) => handleInputChange("intervalMins", Number(e.target.value))}
                          />
                          <span className="input-group-text">mins</span>
                        </div>
                        <div className="form-text">
                          Midway recess duration for audience intermission, snacks & restroom break.
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">
                          House Cleaning & Turnaround Buffer (Minutes)
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            min="10"
                            max="60"
                            className="form-control"
                            value={formData.turnaroundMins}
                            onChange={(e) => handleInputChange("turnaroundMins", Number(e.target.value))}
                          />
                          <span className="input-group-text">mins</span>
                        </div>
                        <div className="form-text">
                          Gap between consecutive shows for audience exit, cleaning & sanitation.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsTicketPerforated className="text-success" /> Default Tier Pricing Presets (Quick Autofill)
                    </h6>
                    <p className="text-muted small mb-3">
                      These values are prefilled when scheduling new showtimes in the Showtime Manager tab.
                    </p>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Silver / Normal Tier Base (₹)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            min="50"
                            max="1000"
                            className="form-control"
                            value={formData.defaultPriceNormal}
                            onChange={(e) => handleInputChange("defaultPriceNormal", Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Gold / Executive Tier Base (₹)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            min="50"
                            max="2000"
                            className="form-control"
                            value={formData.defaultPriceGold}
                            onChange={(e) => handleInputChange("defaultPriceGold", Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-secondary">Balcony / Recliner Tier Base (₹)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            min="100"
                            max="5000"
                            className="form-control"
                            value={formData.defaultPriceBalcony}
                            onChange={(e) => handleInputChange("defaultPriceBalcony", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: F&B CONCESSIONS */}
            {activeSubTab === "fnb" && (
              <div className="row g-4">
                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsCupStraw className="text-primary" /> Food & Beverage (F&B) Service Configuration
                    </h6>

                    {/* Feature Switches in balanced cards */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 border bg-light h-100 d-flex align-items-center justify-content-between gap-3">
                          <div style={{ flex: 1 }}>
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                              Online F&B Pre-Booking
                            </div>
                            <div className="text-muted small" style={{ lineHeight: "1.4" }}>
                              Allows moviegoers to bundle popcorn, beverages, and snacks while buying tickets online.
                            </div>
                          </div>
                          <div className="form-check form-switch fs-5 m-0 flex-shrink-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="enableFoodBookingSwitch"
                              checked={formData.enableOnlineFoodBooking}
                              onChange={(e) => handleInputChange("enableOnlineFoodBooking", e.target.checked)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="p-3 rounded-3 border bg-light h-100 d-flex align-items-center justify-content-between gap-3">
                          <div style={{ flex: 1 }}>
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                              In-Seat Delivery Service
                            </div>
                            <div className="text-muted small" style={{ lineHeight: "1.4" }}>
                              Ushers deliver packaged snacks directly to customer seats during the intermission.
                            </div>
                          </div>
                          <div className="form-check form-switch fs-5 m-0 flex-shrink-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="inSeatDeliverySwitch"
                              checked={formData.inSeatDelivery}
                              onChange={(e) => handleInputChange("inSeatDelivery", e.target.checked)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Numeric / Policy Fields in balanced row */}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Concessions Tax Policy
                        </label>
                        <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between" style={{ height: "38px" }}>
                          <span className="small fw-semibold text-dark">Menu Prices (MRP)</span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
                            Inclusive of all taxes
                          </span>
                        </div>
                        <div className="form-text">All menu item prices are all-inclusive; customers are not charged extra tax at checkout.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Minimum Order for In-Seat Delivery
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            className="form-control"
                            value={formData.minOrderForDelivery ?? 100}
                            onChange={(e) => handleInputChange("minOrderForDelivery", Number(e.target.value))}
                          />
                        </div>
                        <div className="form-text">Minimum cart total required to qualify for in-seat delivery.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: ALERTS & NOTIFICATIONS */}
            {activeSubTab === "alerts" && (
              <div className="row g-4">
                <div className="col-12">
                  <div className="p-3 bg-white rounded-3 border">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <BsBell className="text-primary" /> Live Operations & Alert Settings
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                        <div style={{ flex: 1 }}>
                          <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                            Audio Chime on Real-time Online Booking
                          </div>
                          <div className="text-muted small">
                            Plays a pleasant chime through the Box Office console whenever a new ticket is booked.
                          </div>
                        </div>
                        <div className="form-check form-switch fs-5 m-0 flex-shrink-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="soundAlertOnBookingSwitch"
                            checked={formData.soundAlertOnBooking}
                            onChange={(e) => handleInputChange("soundAlertOnBooking", e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                        <div style={{ flex: 1 }}>
                          <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                            Send Daily Midnight Box Office Revenue Summary Email
                          </div>
                          <div className="text-muted small">
                            Sends an automated daily report to {formData.email || "the administrative email"} with total occupancy and ticket sales.
                          </div>
                        </div>
                        <div className="form-check form-switch fs-5 m-0 flex-shrink-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="dailyEmailSummarySwitch"
                            checked={formData.dailyEmailSummary}
                            onChange={(e) => handleInputChange("dailyEmailSummary", e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                        <div style={{ flex: 1 }}>
                          <div className="fw-bold text-dark mb-1" style={{ fontSize: "14px" }}>
                            Gate Scanner Verification Audio Feedback
                          </div>
                          <div className="text-muted small">
                            Provides double-beep sound verification when ushers scan customer QR codes at auditorium entry gates.
                          </div>
                        </div>
                        <div className="form-check form-switch fs-5 m-0 flex-shrink-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="scannerSoundSwitch"
                            checked={formData.scannerSound}
                            onChange={(e) => handleInputChange("scannerSound", e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAVE BUTTON FOOTER */}
            <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={loadSettings}
                disabled={loading || saving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <BsSave /> Save Theater Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
