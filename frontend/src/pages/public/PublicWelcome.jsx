import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { BsCalendarEvent, BsPerson, BsEnvelope, BsPhone, BsFilm } from "react-icons/bs";

function PublicWelcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMovieMode = searchParams.get("tab") === "movie" || searchParams.get("redirect") === "movie";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const savedUser = sessionStorage.getItem("publicUser");

    if (savedUser) {
      navigate(isMovieMode ? "/find-events?tab=movie" : "/find-events");
    }
  }, [navigate, isMovieMode]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const continueToEvents = (e) => {
    e.preventDefault();

    sessionStorage.setItem("publicUser", JSON.stringify(form));

    navigate(isMovieMode ? "/find-events?tab=movie" : "/find-events");
  };

  const skipDetails = () => {
    sessionStorage.removeItem("publicUser");
    navigate(isMovieMode ? "/find-events?tab=movie" : "/find-events");
  };

  return (
    <div
      className="public-welcome-page min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #030712, #1e1b4b, #4c1d95)",
      }}
    >
      <div
        className="public-welcome-card bg-white shadow-lg p-4"
        style={{
          width: "460px",
          borderRadius: "24px",
        }}
      >
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: isMovieMode ? "#eff6ff" : "#ede9fe",
              color: isMovieMode ? "#2563eb" : "#7c3aed",
              fontSize: "30px",
            }}
          >
            {isMovieMode ? <BsFilm /> : <BsCalendarEvent />}
          </div>

          <h1 className="fw-bold mb-2 text-dark" style={{ fontSize: "26px" }}>
            Welcome to FIC BackRooms
          </h1>

          <p className="text-muted mb-0" style={{ fontSize: "15px" }}>
            {isMovieMode
              ? "Enter your details to explore blockbusters & book movie tickets."
              : "Enter your details to explore public events & activities."}
          </p>
        </div>

        <form onSubmit={continueToEvents}>
          <label className="form-label fw-semibold">Full Name</label>
          <div className="input-group mb-3">
            <span className="input-group-text">
              <BsPerson />
            </span>
            <input
              className="form-control"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <label className="form-label fw-semibold">Email Address</label>
          <div className="input-group mb-3">
            <span className="input-group-text">
              <BsEnvelope />
            </span>
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

          <label className="form-label fw-semibold">Phone Number</label>
          <div className="input-group mb-4">
            <span className="input-group-text">
              <BsPhone />
            </span>
            <input
              className="form-control"
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm">
            {isMovieMode ? "Continue to Movies" : "Continue to Events"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/" className="text-decoration-none">
            Back to home
          </Link>
          <span className="mx-2 text-muted">|</span>
          <Link to="/terms" className="text-decoration-none text-muted small">
            Terms of Service
          </Link>
        </div>

        <div className="d-flex justify-content-end mt-2">
          <button
            type="button"
            className="public-skip-button"
            onClick={skipDetails}
          >
            Skip
          </button>
        </div>
      </div>

      <style>{`
        .public-skip-button {
          background: transparent;
          border: 0;
          color: #6b7280;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0;
          padding: 4px 0;
          transition: color 0.18s ease, transform 0.18s ease;
        }

        .public-skip-button:hover {
          color: #4f46e5;
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
}

export default PublicWelcome;
