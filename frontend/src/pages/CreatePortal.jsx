import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { clearAssistantSession } from "../utils/assistantSession";
import {
  BsBox,
  BsBuilding,
  BsPerson,
  BsEnvelope,
  BsPhone,
  BsShieldCheck,
  BsTags,
  BsArrowRight,
} from "react-icons/bs";
import { Eye, EyeOff, MapPin, Clock3, ChevronDown, Check } from "lucide-react";
import ficLogo from "../assets/images/fic-logo.png";

const LOCATION_OPTIONS = {
  India: [
    ["Karnataka", "Asia/Kolkata"],
    ["Tamil Nadu", "Asia/Kolkata"],
    ["Telangana", "Asia/Kolkata"],
    ["Maharashtra", "Asia/Kolkata"],
    ["Delhi", "Asia/Kolkata"],
    ["Kerala", "Asia/Kolkata"],
    ["Andhra Pradesh", "Asia/Kolkata"],
    ["Gujarat", "Asia/Kolkata"],
    ["West Bengal", "Asia/Kolkata"],
    ["Rajasthan", "Asia/Kolkata"],
    ["Uttar Pradesh", "Asia/Kolkata"],
    ["Punjab", "Asia/Kolkata"],
    ["Odisha", "Asia/Kolkata"],
  ],
  "United Arab Emirates": [
    ["Dubai", "Asia/Dubai"],
    ["Abu Dhabi", "Asia/Dubai"],
    ["Sharjah", "Asia/Dubai"],
  ],
  Singapore: [["Singapore", "Asia/Singapore"]],
  "United Kingdom": [
    ["England", "Europe/London"],
    ["Scotland", "Europe/London"],
    ["Wales", "Europe/London"],
    ["Northern Ireland", "Europe/London"],
  ],
  "United States": [
    ["New York", "America/New_York"],
    ["Florida", "America/New_York"],
    ["Texas", "America/Chicago"],
    ["Illinois", "America/Chicago"],
    ["Colorado", "America/Denver"],
    ["California", "America/Los_Angeles"],
    ["Washington", "America/Los_Angeles"],
  ],
  Canada: [
    ["Ontario", "America/Toronto"],
    ["Quebec", "America/Toronto"],
    ["Alberta", "America/Edmonton"],
    ["British Columbia", "America/Vancouver"],
  ],
  Australia: [
    ["New South Wales", "Australia/Sydney"],
    ["Victoria", "Australia/Melbourne"],
    ["Queensland", "Australia/Brisbane"],
    ["Western Australia", "Australia/Perth"],
  ],
  Germany: [["Berlin", "Europe/Berlin"], ["Bavaria", "Europe/Berlin"], ["Hesse", "Europe/Berlin"]],
  France: [["Île-de-France", "Europe/Paris"], ["Provence", "Europe/Paris"]],
  Japan: [["Tokyo", "Asia/Tokyo"], ["Osaka", "Asia/Tokyo"]],
  "Saudi Arabia": [["Riyadh Province", "Asia/Riyadh"], ["Makkah Province", "Asia/Riyadh"]],
  Qatar: [["Doha", "Asia/Qatar"]],
};

const COUNTRY_PHONE_RULES = {
  India: { code: "+91", min: 10, max: 10, example: "9876543210" },
  "United Arab Emirates": { code: "+971", min: 9, max: 9, example: "501234567" },
  Singapore: { code: "+65", min: 8, max: 8, example: "81234567" },
  "United Kingdom": { code: "+44", min: 10, max: 10, example: "7700900123" },
  "United States": { code: "+1", min: 10, max: 10, example: "2025550123" },
  Canada: { code: "+1", min: 10, max: 10, example: "4165550123" },
  Australia: { code: "+61", min: 9, max: 9, example: "412345678" },
  Germany: { code: "+49", min: 10, max: 11, example: "15123456789" },
  France: { code: "+33", min: 9, max: 9, example: "612345678" },
  Japan: { code: "+81", min: 10, max: 10, example: "9012345678" },
  "Saudi Arabia": { code: "+966", min: 9, max: 9, example: "512345678" },
  Qatar: { code: "+974", min: 8, max: 8, example: "33123456" },
};

const browserTimeZone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

function CreatePortal() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    portalName: "",
    description: "",
    category: "COLLEGE",
    organizationLocation: "",
    timeZone: browserTimeZone,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState({ country: "", city: "" });
  const [phoneCountry, setPhoneCountry] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });
  };

  const handleLocationChange = (field, value) => {
    const nextLocation = {
      country: field === "country" ? value : location.country,
      city: field === "city" ? value : "",
    };

    const selectedCity = LOCATION_OPTIONS[nextLocation.country]
      ?.find(([city]) => city === nextLocation.city);
    const completeLocation = selectedCity
      ? `${nextLocation.city}, ${nextLocation.country}`
      : "";

    setLocation(nextLocation);
    setForm((current) => ({
      ...current,
      organizationLocation: completeLocation,
      timeZone: selectedCity?.[1] || browserTimeZone,
    }));
  };

  const handlePhoneChange = (event) => {
    const phoneRule = COUNTRY_PHONE_RULES[phoneCountry];
    if (!phoneRule) return;

    const digits = event.target.value.replace(/\D/g, "").slice(0, phoneRule.max);
    setPhoneDigits(digits);
    setForm((current) => ({
      ...current,
      phoneNumber: digits ? `${phoneRule.code}${digits}` : "",
    }));
  };

  const handlePhoneCountryChange = (event) => {
    setPhoneCountry(event.target.value);
    setPhoneDigits("");
    setForm((current) => ({ ...current, phoneNumber: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location.country || !location.city) {
      setMessage("Please select the organization country and state/region.");
      return;
    }

    try {
      const response = await api.post("/auth/create-portal", form);

      localStorage.clear();
      clearAssistantSession();
      localStorage.setItem("token", response.data.token || "");
      localStorage.setItem("role", response.data.role || "");
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("userId", response.data.userId || "");
      localStorage.setItem("portalId", response.data.portalId || "");
      localStorage.setItem("portalCode", response.data.portalCode || "");
      localStorage.setItem("portalName", response.data.portalName || form.portalName);
      localStorage.setItem("firstName", response.data.firstName || form.firstName);
      localStorage.setItem("lastName", response.data.lastName || form.lastName);
      localStorage.setItem("phoneNumber", response.data.phoneNumber || form.phoneNumber);

      navigate(response.data.redirectPath || "/subscription");
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message ||
        (error.response?.status === 409
          ? "This email address or portal name already exists."
          : "Unable to create portal. Please check your details.")
      );
    }
  };

  return (
    <div className="create-portal-page" style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <nav
        className="create-portal-navbar d-flex align-items-center justify-content-between px-5"
        style={{ height: "66px", background: "#12085c", color: "#fff" }}
      >
        <Link to="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
          <img className="create-portal-navbar-logo" src={ficLogo} alt="FIC BackRooms logo" />
          <span className="create-portal-brand fw-bold" style={{ fontSize: "24px" }}>
            FIC BackRooms
          </span>
        </Link>

        <Link to="/login" className="btn btn-light public-user-btn">
          Back to Login
        </Link>
      </nav>

      <div className="create-portal-container container py-5">
        <div className="row g-4">
          <div className="create-portal-intro-column col-lg-4">
            <div
              className="create-portal-intro p-4 h-100"
              style={{
                borderRadius: "28px",
                color: "#fff",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center mb-4"
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "22px",
                  background: "rgba(255,255,255,.14)",
                  fontSize: "34px",
                }}
              >
                <BsBuilding />
              </div>

              <h1 className="fw-bold mb-3" style={{ fontSize: "32px" }}>
                Create Your Portal
              </h1>

              <p style={{ color: "#dbeafe", fontSize: "16px" }}>
                Set up your organization workspace and start managing events,
                registrations, teams, tickets and reports from one dashboard.
              </p>

              <div className="mt-4 d-grid gap-3">
                <InfoBox
                  delay="0.1s"
                  icon={<BsShieldCheck />}
                  title="Secure workspace"
                  text="Every portal has its own users, events and role access."
                />
                <InfoBox
                  delay="0.2s"
                  icon={<BsPerson />}
                  title="Owner account"
                  text="The first user becomes the portal admin."
                />
                <InfoBox
                  delay="0.3s"
                  icon={<BsTags />}
                  title="Why choose a category?"
                  text="It identifies your workspace as College, Corporate, Public or All, keeping portals organized for the right type of events."
                />
              </div>
            </div>
          </div>

          <div className="create-portal-form-column col-lg-8">
            <div
              className="create-portal-form-card bg-white shadow-sm p-4"
              style={{ borderRadius: "28px", border: "1px solid #e8ecf4" }}
            >
              <h2 className="fw-bold mb-2" style={{ fontSize: "28px" }}>
                Portal Details
              </h2>

              <p className="text-muted mb-4">
                Create your organization portal and owner account.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Portal Name</label>
                    <input
                      className="form-control"
                      name="portalName"
                      placeholder="Enter your organization name"
                      value={form.portalName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="COLLEGE">College</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="PUBLIC">Public</option>
                      <option value="ALL">All</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="3"
                      placeholder="Describe your organization or event portal"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Organization Location
                    </label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <LocationDropdown
                          label="Select country"
                          value={location.country}
                          options={Object.keys(LOCATION_OPTIONS)}
                          onChange={(value) => handleLocationChange("country", value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <LocationDropdown
                          label="Select state/region"
                          value={location.city}
                          options={(LOCATION_OPTIONS[location.country] || []).map(
                            ([region]) => region
                          )}
                          onChange={(value) => handleLocationChange("city", value)}
                          disabled={!location.country}
                        />
                      </div>
                    </div>
                    <small className="d-flex align-items-center gap-2 text-muted mt-2">
                      {form.organizationLocation ? <MapPin size={15} /> : <Clock3 size={15} />}
                      {form.organizationLocation ? (
                        <><span>{form.organizationLocation}</span> · Time zone: <strong>{form.timeZone}</strong></>
                      ) : (
                        "Used only to determine the correct timezone for schedules and notifications."
                      )}
                    </small>
                  </div>
                </div>

                <hr className="my-4" />

                <h3 className="fw-bold mb-3" style={{ fontSize: "22px" }}>
                  Owner Account
                </h3>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">First Name</label>
                    <input
                      className="form-control"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Last Name</label>
                    <input
                      className="form-control"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <div className="input-group">
                      <select
                        className="form-select fw-semibold"
                        style={{ maxWidth: "155px" }}
                        value={phoneCountry}
                        onChange={handlePhoneCountryChange}
                        aria-label="Phone country code"
                        required
                      >
                        <option value="">Country code</option>
                        {Object.entries(COUNTRY_PHONE_RULES).map(([country, rule]) => (
                          <option key={country} value={country}>
                            {rule.code} {country}
                          </option>
                        ))}
                      </select>
                      <input
                        className="form-control"
                        type="tel"
                        inputMode="numeric"
                        placeholder={
                          COUNTRY_PHONE_RULES[phoneCountry]?.example ||
                          "Select country code"
                        }
                        value={phoneDigits}
                        onChange={handlePhoneChange}
                        minLength={COUNTRY_PHONE_RULES[phoneCountry]?.min}
                        maxLength={COUNTRY_PHONE_RULES[phoneCountry]?.max}
                        pattern={
                          phoneCountry
                            ? `\\d{${COUNTRY_PHONE_RULES[phoneCountry].min},${COUNTRY_PHONE_RULES[phoneCountry].max}}`
                            : undefined
                        }
                        disabled={!phoneCountry}
                        required
                      />
                    </div>
                    <small className="text-muted">
                      {phoneCountry
                        ? `${COUNTRY_PHONE_RULES[phoneCountry].min}${
                            COUNTRY_PHONE_RULES[phoneCountry].min !==
                            COUNTRY_PHONE_RULES[phoneCountry].max
                              ? `–${COUNTRY_PHONE_RULES[phoneCountry].max}`
                              : ""
                          } digits required for ${phoneCountry}.`
                        : "Choose the owner's phone country independently from the portal location."}
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="position-relative">
                      <input
                        className="form-control pe-5"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                      <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((current) => !current)}
                        className="btn border-0 bg-transparent position-absolute"
                        style={{ top: "50%", right: 12, transform: "translateY(-50%)", padding: 0, color: "#6b7280" }}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {message && <div className="alert alert-danger mt-4">{message}</div>}

                <button className="create-portal-submit btn btn-primary mt-4 px-4">
                  Create Portal <BsArrowRight className="ms-2" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationDropdown({ label, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`portal-location-dropdown ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="portal-location-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span className={value ? "" : "text-muted"}>{value || label}</span>
        <ChevronDown size={18} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="portal-location-backdrop"
            aria-label="Close location options"
            onClick={() => setOpen(false)}
          />
          <div className="portal-location-menu">
            {options.map((option) => (
              <button
                type="button"
                className={option === value ? "is-selected" : ""}
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <span>{option}</span>
                {option === value && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InfoBox({ icon, title, text, delay = "0s" }) {
  return (
    <div
      className="create-portal-info-card p-3"
      style={{
        "--info-delay": delay,
        borderRadius: "18px",
        background: "rgba(255,255,255,.12)",
        border: "1px solid rgba(255,255,255,.18)",
      }}
    >
      <div className="create-portal-info-icon" style={{ fontSize: "24px" }}>{icon}</div>
      <h6 className="fw-bold mt-2 mb-1">{title}</h6>
      <p className="mb-0" style={{ color: "#dbeafe", fontSize: "14px" }}>
        {text}
      </p>
    </div>
  );
}

export default CreatePortal;
