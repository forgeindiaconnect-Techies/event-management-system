import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import api from "../api/axiosConfig";

const passwordMessage =
  "Use at least 8 characters with one uppercase letter, one lowercase letter and one number.";

const isValidPassword = (value) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [details, setDetails] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      if (!token) {
        setError("This set-password link is missing or invalid.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/auth/password-setup/details", { token });
        setDetails(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "This set-password link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [token]);

  const submitPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidPassword(password)) {
      setError(passwordMessage);
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/auth/password-setup/complete", {
        token,
        password,
        confirmPassword,
      });
      setSuccess(response.data?.message || "Password set successfully. You can now sign in.");
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to set your password. Please request a new link.");
    } finally {
      setSubmitting(false);
    }
  };

  const resendLink = async () => {
    setError("");
    setSuccess("");
    try {
      setResending(true);
      const response = await api.post("/auth/password-setup/resend", { token });
      setSuccess(response.data?.message || "A new set-password link was sent to your registered email address.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send a new link right now.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="set-password-page">
      <section className="set-password-card">
        <div className="set-password-icon"><KeyRound size={26} /></div>
        <p className="set-password-kicker">ACCOUNT ACTIVATION</p>
        <h1>Set your password</h1>
        <p className="set-password-intro">Create your password to activate your BackRooms account.</p>

        {loading && <p className="set-password-message">Checking your secure link...</p>}

        {!loading && error && !details && (
          <div className="set-password-alert set-password-alert-error">
            <p>{error}</p>
            {token && <button type="button" onClick={resendLink} disabled={resending}>{resending ? "Sending..." : "Send a new link"}</button>}
          </div>
        )}

        {!loading && details && (
          <>
            <div className="set-password-details">
              <div><Mail size={17} /><span>{details.email}</span></div>
              <div><ShieldCheck size={17} /><span>{details.role}{details.portalName ? ` - ${details.portalName}` : ""}</span></div>
              {details.eventName && <p>Assigned event: <strong>{details.eventName}</strong></p>}
            </div>

            {error && <div className="set-password-alert set-password-alert-error"><p>{error}</p></div>}
            {success && <div className="set-password-alert set-password-alert-success"><p>{success}</p></div>}

            <form onSubmit={submitPassword} className="set-password-form">
              <label>
                New password
                <span className="set-password-input-wrap">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </span>
              </label>
              <small>{passwordMessage}</small>
              <label>
                Confirm password
                <span className="set-password-input-wrap">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
                  <button type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((current) => !current)}>{showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </span>
              </label>
              <button className="set-password-submit" disabled={submitting}>{submitting ? "Saving..." : "Set password and activate account"}</button>
            </form>
          </>
        )}
        <p className="set-password-login">Already have access? <Link to="/login">Back to login</Link></p>
      </section>

      <style>{`
        .set-password-page { min-height: 100vh; display: grid; place-items: center; padding: 32px 16px; background: linear-gradient(135deg, #f5f3ff, #eef5ff); }
        .set-password-card { width: min(100%, 480px); padding: 34px; border-radius: 22px; background: #fff; box-shadow: 0 18px 50px rgba(45, 42, 100, .15); color: #112244; }
        .set-password-icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 16px; background: #ede9fe; color: #6246ea; margin-bottom: 14px; }
        .set-password-kicker { margin: 0; color: #6246ea; font-size: .78rem; font-weight: 800; letter-spacing: .09em; }
        .set-password-card h1 { margin: 6px 0 8px; font-size: clamp(1.8rem, 5vw, 2.2rem); }
        .set-password-intro { margin: 0 0 24px; color: #60708c; line-height: 1.5; }
        .set-password-details { display: grid; gap: 9px; padding: 15px; margin-bottom: 18px; border-radius: 14px; background: #f7f8ff; color: #46536c; font-size: .92rem; }
        .set-password-details div { display: flex; gap: 8px; align-items: center; overflow-wrap: anywhere; }
        .set-password-details p { margin: 4px 0 0; }
        .set-password-form { display: grid; gap: 12px; }
        .set-password-form label { display: grid; gap: 7px; font-weight: 700; color: #1f2a44; }
        .set-password-form small { margin-top: -5px; color: #6c7890; line-height: 1.35; }
        .set-password-input-wrap { display: flex; border: 1px solid #ccd5e5; border-radius: 10px; overflow: hidden; background: #fff; }
        .set-password-input-wrap:focus-within { border-color: #6851e8; box-shadow: 0 0 0 3px rgba(104, 81, 232, .14); }
        .set-password-input-wrap input { min-width: 0; flex: 1; border: 0; outline: 0; padding: 13px 14px; font-size: 1rem; }
        .set-password-input-wrap button { width: 48px; border: 0; border-left: 1px solid #e0e5ef; background: #fff; color: #667085; cursor: pointer; }
        .set-password-submit, .set-password-alert button { border: 0; border-radius: 10px; cursor: pointer; font-weight: 700; }
        .set-password-submit { margin-top: 6px; padding: 14px; background: #216df3; color: #fff; font-size: 1rem; }
        .set-password-submit:disabled, .set-password-alert button:disabled { cursor: wait; opacity: .65; }
        .set-password-alert { margin: 0 0 18px; padding: 13px; border-radius: 10px; line-height: 1.45; }
        .set-password-alert p { margin: 0; }
        .set-password-alert-error { background: #fff0f0; color: #aa2736; }
        .set-password-alert-success { background: #eaf8ef; color: #147344; }
        .set-password-alert button { margin-top: 10px; padding: 9px 12px; background: #216df3; color: #fff; }
        .set-password-message { color: #60708c; }
        .set-password-login { margin: 22px 0 0; text-align: center; color: #60708c; }
        .set-password-login a { color: #216df3; font-weight: 700; text-decoration: none; }
        @media (max-width: 480px) { .set-password-page { padding: 18px 12px; } .set-password-card { padding: 26px 20px; border-radius: 16px; } }
      `}</style>
    </main>
  );
}
