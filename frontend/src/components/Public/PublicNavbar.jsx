import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaSearch
} from "react-icons/fa";
import UserProfileMenu from "./UserProfileMenu";

function PublicNavbar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    navigate(`/find-events?${params.toString()}`);
  };

  return (
    <nav className="navbar navbar-expand-xl bg-white border-bottom sticky-top py-2">
      <div className="container-fluid px-4">
        <Link
          to="/find-events"
          className="navbar-brand fw-bold text-dark me-4"
          style={{ fontSize: "19px" }}
        >
          FIC Backroom
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNavbar"
          aria-label="Open navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          id="publicNavbar"
          className="collapse navbar-collapse"
        >
          <form
            className="public-search-form d-flex align-items-center bg-light border rounded-pill overflow-hidden my-3 my-xl-0"
            onSubmit={handleSearch}
          >
            <div className="d-flex align-items-center px-3 flex-grow-1">
              <FaSearch
                size={13}
                className="text-secondary me-2"
              />

              <input
                className="form-control border-0 bg-transparent shadow-none p-0"
                placeholder="Search events"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                style={{ fontSize: "13px" }}
              />
            </div>

            <div className="d-flex align-items-center px-3 border-start public-location">
              <FaMapMarkerAlt
                size={13}
                className="text-secondary me-2"
              />

              <input
                className="form-control border-0 bg-transparent shadow-none p-0"
                placeholder="Chennai"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                style={{ fontSize: "13px" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-danger rounded-circle m-1 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: "38px", height: "38px" }}
              aria-label="Search events"
            >
              <FaSearch size={13} />
            </button>
          </form>

          <div className="navbar-nav ms-auto align-items-xl-center gap-xl-1">
            <NavLink to="/updates">Updates</NavLink>
            <NavLink to="/contact-sales">
              Contact Sales
            </NavLink>
            <NavLink to="/create-event">
              Create Events
            </NavLink>
            <NavLink to="/help-center">
              Help Center
            </NavLink>
            <NavLink to="/my-tickets">
              Find My Tickets
            </NavLink>
            <NavLink to="/login">Log In</NavLink>

            <Link
              to="/signup"
              className="btn btn-dark btn-sm px-3 ms-xl-2"
              style={{ fontSize: "13px" }}
            >
              Sign Up
            </Link>

            <UserProfileMenu />
          </div>
        </div>
      </div>

      <style>{`
        .public-search-form {
          width: min(440px, 100%);
          min-height: 44px;
        }

        .public-location {
          width: 155px;
        }

        @media (max-width: 1199px) {
          .public-search-form {
            width: 100%;
          }

          .public-location {
            flex: 1;
          }
        }

        @media (max-width: 560px) {
          .public-search-form {
            align-items: stretch !important;
            border-radius: 8px !important;
            flex-wrap: wrap;
          }

          .public-search-form > div {
            width: 100%;
            min-height: 42px;
          }

          .public-location {
            border-left: 0 !important;
            border-top: 1px solid #dee2e6;
          }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="nav-link px-xl-2 text-dark"
      style={{
        fontSize: "13px",
        fontWeight: 500,
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </Link>
  );
}

export default PublicNavbar;
