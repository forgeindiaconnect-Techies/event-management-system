import { useState, useMemo, useEffect, useRef } from "react";
import api from "../../api/axiosConfig";
import {
  BsArrowLeft,
  BsStarFill,
  BsClock,
  BsFilm,
  BsTicketPerforated,
  BsShare,
  BsHeart,
  BsHeartFill,
  BsCameraVideo,
  BsCheckCircleFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsPersonCircle,
  BsChevronLeft,
  BsChevronRight,
  BsPencilSquare,
} from "react-icons/bs";

export default function PublicMovieDetails({ movie, onBack, onProceedToTheaters }) {
  const [isLiked, setIsLiked] = useState(false);
  const [fullMovieData, setFullMovieData] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Review modal and review submission state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(9);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(() => {
    return localStorage.getItem("userName") || localStorage.getItem("firstName") || "";
  });
  const [reviewHeadline, setReviewHeadline] = useState("");
  const [reviewText, setReviewText] = useState("");

  // Resolve ID for fetching and reviews storage
  const effectiveId = movie?.movieId || movie?.id;

  // Storage key for user reviews per movie
  const storageKey = `movie_reviews_${effectiveId || (movie?.title || "movie").toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

  // Real user reviews only - strictly no hardcoded demo reviews!
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(r => 
            !String(r.id).startsWith("seed-") &&
            !String(r.id).startsWith("rev-top-") &&
            r.userName !== "Karthik R." &&
            r.userName !== "Divya Prakash" &&
            r.userName !== "Arun Kumar" &&
            r.userName !== "Nitesh" &&
            r.userName !== "Ananya" &&
            !(r.userName === "User" && r.headline?.includes("Super Direction"))
          );
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Ensure any cached demo reviews are stripped on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(r => 
            !String(r.id).startsWith("seed-") &&
            !String(r.id).startsWith("rev-top-") &&
            r.userName !== "Karthik R." &&
            r.userName !== "Divya Prakash" &&
            r.userName !== "Arun Kumar" &&
            r.userName !== "Nitesh" &&
            r.userName !== "Ananya" &&
            !(r.userName === "User" && r.headline?.includes("Super Direction"))
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(storageKey, JSON.stringify(cleaned));
            setReviews(cleaned);
          }
        }
      }
    } catch (e) {}
  }, [storageKey]);

  const reviewScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkReviewScroll = () => {
    if (reviewScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = reviewScrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
    }
  };

  useEffect(() => {
    checkReviewScroll();
    const el = reviewScrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkReviewScroll, { passive: true });
      window.addEventListener("resize", checkReviewScroll);
      return () => {
        el.removeEventListener("scroll", checkReviewScroll);
        window.removeEventListener("resize", checkReviewScroll);
      };
    }
  }, [reviews]);

  const scrollReviews = (direction) => {
    if (reviewScrollRef.current) {
      const scrollAmount = direction === "left" ? -390 : 390;
      reviewScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkReviewScroll, 320);
    }
  };

  useEffect(() => {
    if (effectiveId) {
      api.get(`/movies/${effectiveId}`)
        .then(res => setFullMovieData(res.data))
        .catch(err => console.error("Failed to fetch full movie details", err));
    }
  }, [effectiveId]);

  // Match cast & crew metadata exclusively from database, NO hardcoded fallback people
  const movieDetails = useMemo(() => {
    if (!movie) return null;
    
    const m = fullMovieData || {};

    const rawCastCrew = m.castAndCrew || movie.castAndCrew || [];

    const dbCast = rawCastCrew
      .filter(c => !c.primaryRole?.toLowerCase().includes("director") && !c.primaryRole?.toLowerCase().includes("producer") && !c.primaryRole?.toLowerCase().includes("music"))
      .map(c => ({
        name: c.name,
        role: c.primaryRole || "Cast",
        photo: c.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
      }));

    const dbCrew = rawCastCrew
      .filter(c => c.primaryRole?.toLowerCase().includes("director") || c.primaryRole?.toLowerCase().includes("producer") || c.primaryRole?.toLowerCase().includes("music"))
      .map(c => ({
        name: c.name,
        role: c.primaryRole || "Crew",
        photo: c.profileImageUrl || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80"
      }));

    const rawDuration = m.durationMinutes || movie.durationMinutes;
    const formattedDuration = rawDuration 
      ? `${Math.floor(rawDuration / 60)}h ${rawDuration % 60}m` 
      : (movie.duration || "2h 15m");

    const genre = m.genre || movie.genre || "Action / Adventure";
    const certification = m.certification || movie.certification || movie.certificate || "UA / 13+";
    const poster = m.posterUrl || movie.posterUrl || movie.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80";
    const trailerUrl = m.trailerUrl || movie.trailerUrl || null;
    const synopsis = m.synopsis || movie.synopsis || movie.description || `Experience the gripping cinematic tale of "${movie.title}". Scheduled with high-definition digital projection and immersive multi-channel sound in theaters.`;

    return {
      synopsis,
      cast: dbCast,
      crew: dbCrew,
      genre,
      duration: formattedDuration,
      certification,
      poster,
      trailerUrl,
    };
  }, [movie, fullMovieData]);

  // Read configured rating from Content Dashboard / Backend
  const dashboardRatingMeta = useMemo(() => {
    let local = {};
    try {
      local = JSON.parse(localStorage.getItem(`movie_rating_meta_${effectiveId}`) || "{}");
    } catch (e) {}

    const cfgRating = fullMovieData?.rating !== undefined && fullMovieData?.rating !== null
      ? Number(fullMovieData.rating)
      : (movie?.rating !== undefined && movie?.rating !== null
        ? Number(movie.rating)
        : (local.rating !== undefined && local.rating !== null ? Number(local.rating) : null));

    const cfgVotes = fullMovieData?.totalVotes || movie?.totalVotes || local.totalVotes || null;
    const cfgLikes = fullMovieData?.likes || movie?.likes || local.likes || null;

    const titleKey = movie?.title || fullMovieData?.title || "";
    let hash = 0;
    for (let i = 0; i < titleKey.length; i++) {
      hash = (hash * 31 + titleKey.charCodeAt(i)) % 1000;
    }
    const fallbackLikes = `${(12 + (hash % 38) + ((hash % 10) / 10)).toFixed(1)}K`;

    return {
      configuredRating: cfgRating,
      configuredVotes: cfgVotes,
      configuredLikes: cfgLikes || fallbackLikes,
    };
  }, [fullMovieData, movie, effectiveId]);



  // Calculate dynamic rating and total votes based on Content Dashboard + real user reviews
  const { displayRating, displayVotes, hasRating } = useMemo(() => {
    const { configuredRating, configuredVotes } = dashboardRatingMeta;

    if (configuredRating !== null) {
      let votesText = "";
      if (configuredVotes) {
        votesText = configuredVotes.toLowerCase().includes("vote")
          ? configuredVotes
          : `${configuredVotes} Votes`;
      } else if (reviews.length > 0) {
        votesText = `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`;
      } else {
        votesText = "";
      }

      return { 
        displayRating: configuredRating.toFixed(1), 
        displayVotes: votesText, 
        hasRating: true 
      };
    }

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
      const avg = (sum / reviews.length).toFixed(1);
      const votes = `${reviews.length} ${reviews.length === 1 ? 'Review' : 'Reviews'}`;
      return { displayRating: avg, displayVotes: votes, hasRating: true };
    }

    return { displayRating: null, displayVotes: null, hasRating: false };
  }, [dashboardRatingMeta, reviews]);

  const handleLikeReview = (reviewId) => {
    const updated = reviews.map((r) => {
      if (r.id === reviewId) {
        const nextLiked = !r.userLiked;
        return {
          ...r,
          userLiked: nextLiked,
          likes: nextLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 1) - 1),
          userDisliked: false,
        };
      }
      return r;
    });
    setReviews(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDislikeReview = (reviewId) => {
    const updated = reviews.map((r) => {
      if (r.id === reviewId) {
        const nextDisliked = !r.userDisliked;
        return {
          ...r,
          userDisliked: nextDisliked,
          dislikes: nextDisliked ? (r.dislikes || 0) + 1 : Math.max(0, (r.dislikes || 1) - 1),
          userLiked: false,
        };
      }
      return r;
    });
    setReviews(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      userName: reviewerName.trim() || "Cinephile User",
      rating: newRating,
      headline: reviewHeadline.trim() || "",
      comment: reviewText.trim(),
      date: "Just now",
      likes: 1,
      userLiked: true,
      dislikes: 0,
      userDisliked: false,
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setReviewText("");
    setReviewHeadline("");
    setReviewModalOpen(false);

    alert(`Thank you ${newRev.userName}! Your review has been added.`);
  };

  const getRatingLabel = (score) => {
    if (score >= 10) return "Masterpiece / Phenomenal! 🌟";
    if (score >= 9) return "Loved it / High-Octane Thrill! 🔥";
    if (score >= 8) return "Really Good / Well Worth Watching! 👍";
    if (score >= 7) return "Good / Solid Entertainer 😊";
    if (score >= 5) return "Average / Decent One-Time Watch 🍿";
    return "Below Average / Skip 👎";
  };

  if (!movie) return null;

  return (
    <div className="public-movie-details pb-5" style={{ backgroundColor: "#f8fafc", color: "#0f172a", minHeight: "100vh" }}>
      {/* 1. TOP NAVBAR / BACK BAR */}
      <div
        className="sticky-top bg-white border-bottom shadow-sm py-3 px-4 position-relative"
        style={{ zIndex: 110 }}
      >
        <button
          type="button"
          className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-2 position-absolute d-none d-lg-flex transition-all"
          onClick={onBack}
          style={{ fontSize: "15px", fontWeight: "600", left: "24px", top: "50%", transform: "translateY(-50%)" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <BsArrowLeft size={18} /> Back
        </button>

        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <button
              type="button"
              className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-2 me-3 d-lg-none transition-all"
              onClick={onBack}
              style={{ fontSize: "15px", fontWeight: "600" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <BsArrowLeft size={18} />
            </button>
            <span className="fw-bolder text-dark d-lg-none">{movie.title}</span>
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              type="button"
              className={`btn btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center border ${
                isLiked ? "btn-danger text-white" : "btn-outline-secondary"
              }`}
              onClick={() => setIsLiked(!isLiked)}
              title={isLiked ? "Interested" : "Mark as Interested"}
            >
              {isLiked ? <BsHeartFill size={15} /> : <BsHeart size={15} />}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center border"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert("Movie link copied to clipboard!");
              }}
              title="Share Movie"
            >
              <BsShare size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. HERO MOVIE BANNER & HEADER */}
      <section
        className="position-relative overflow-hidden text-white shadow-sm"
        style={{
          minHeight: "420px",
          backgroundColor: "#090d16",
        }}
      >
        {/* Subtle Ambient Blurred Poster Backdrop */}
        {movieDetails?.poster && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage: `url(${movieDetails.poster})`,
              backgroundSize: "cover",
              backgroundPosition: "center 25%",
              filter: "blur(26px) brightness(0.24) saturate(1.3)",
              transform: "scale(1.15)",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          />
        )}
        {/* Rich Dark Gradient Overlay */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: "linear-gradient(90deg, rgba(9, 13, 22, 0.97) 0%, rgba(15, 23, 42, 0.88) 55%, rgba(15, 23, 42, 0.95) 100%)",
            pointerEvents: "none",
          }}
        />

        <div className="container py-5 position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-4">
            {/* Poster Card */}
            <div className="col-lg-3 col-md-4 text-center text-md-start">
              <div
                className="rounded-4 overflow-hidden position-relative shadow-lg d-inline-block"
                style={{
                  width: "230px",
                  height: "330px",
                  border: "2px solid rgba(255,255,255,0.25)",
                  backgroundColor: "#1e293b",
                }}
              >
                <img
                  src={movieDetails?.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80"}
                  alt={movie.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div
                  className="position-absolute bottom-0 start-0 end-0 p-2 text-center"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)" }}
                >
                  <span className={`badge ${movie.isUpcoming ? "bg-warning text-dark" : "bg-danger text-white"} px-2.5 py-1 rounded-pill small fw-bold`}>
                    {movie.isUpcoming ? "Upcoming" : "In Cinemas"}
                  </span>
                </div>
              </div>
            </div>

            {/* Movie Title & Info */}
            <div className="col-lg-9 col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                {movie.screensList?.map((sc) => (
                  <span key={sc} className="badge bg-light text-dark px-3 py-1 rounded-pill fw-semibold shadow-sm">
                    {sc}
                  </span>
                ))}
                {movie.formatsList?.map((fmt) => (
                  <span key={fmt} className="badge bg-primary px-3 py-1 rounded-pill fw-semibold shadow-sm">
                    {fmt}
                  </span>
                ))}
                <span className="badge bg-dark bg-opacity-50 text-white border border-secondary px-2.5 py-1 rounded-pill">
                  {movieDetails?.certification || "UA / 13+"}
                </span>
              </div>

              <h1 className="fw-bolder mb-2 text-white display-5" style={{ letterSpacing: "-0.5px" }}>
                {movie.title}
              </h1>

              <div className="d-flex align-items-center gap-3 mb-3 text-light text-opacity-80 flex-wrap" style={{ fontSize: "15px" }}>
                {hasRating ? (
                  <>
                    <span className="text-warning fw-bold d-flex align-items-center gap-1">
                      <BsStarFill /> {displayRating}/10
                    </span>
                    {displayVotes && (
                      <span>({displayVotes})</span>
                    )}
                    <span>•</span>
                  </>
                ) : (
                  <>
                    <span className="text-white fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: "14px" }}>
                      <BsHandThumbsUpFill className="text-success" size={14} /> {dashboardRatingMeta.configuredLikes} Likes
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{movieDetails?.genre || "Action / Thriller"}</span>
                <span>•</span>
                <span><BsClock className="me-1" />{movieDetails?.duration || "2h 45m"}</span>
              </div>

              {/* INTERACTIVE RATING & REVIEW CARD */}
              <div
                className="p-3 rounded-4 border border-white border-opacity-15 mb-4 shadow-sm"
                style={{
                  maxWidth: "680px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                }}
                onClick={() => setReviewModalOpen(true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
              >
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{
                        width: "42px",
                        height: "42px",
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        color: "#fff",
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
                      }}
                    >
                      <BsStarFill size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-white fs-6 d-flex align-items-center gap-2">
                        Add your rating & review
                        <span className="badge bg-warning text-dark rounded-pill fw-semibold" style={{ fontSize: "11px" }}>
                          Interactive
                        </span>
                      </div>
                      <div className="text-light text-opacity-75 small">
                        Your review helps other movie enthusiasts book the right seats.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm px-3.5 py-1.5 rounded-pill fw-bold text-dark shadow-sm d-flex align-items-center gap-1.5"
                    style={{ fontSize: "13px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewModalOpen(true);
                    }}
                  >
                    <BsPencilSquare size={13} /> Rate Now
                  </button>
                </div>
              </div>

              {/* ACTION BUTTON TO PROCEED TO THEATERS PAGE */}
              <div className="d-flex align-items-center gap-3">
                {!movie.isUpcoming ? (
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2.5 fw-bold rounded-pill d-flex align-items-center gap-2 shadow"
                    style={{ fontSize: "16px" }}
                    onClick={() => onProceedToTheaters(movie)}
                  >
                    <BsTicketPerforated size={18} /> Book Tickets
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn ${isLiked ? "btn-light text-dark" : "btn-outline-light"} px-4 py-2.5 fw-bold rounded-pill d-flex align-items-center gap-2 shadow`}
                    style={{ fontSize: "16px", backgroundColor: isLiked ? "#fff" : "rgba(255,255,255,0.1)", backdropFilter: "blur(5px)" }}
                    onClick={() => {
                      setIsLiked(!isLiked);
                      if (!isLiked) alert(`We will notify you when bookings open for ${movie.title}!`);
                    }}
                  >
                    {isLiked ? <BsCheckCircleFill className="text-success" size={18} /> : <BsHeart size={18} />} {isLiked ? "Interested" : "I'm Interested"}
                  </button>
                )}

                {movieDetails?.trailerUrl && (
                  <button
                    type="button"
                    className="btn btn-outline-light px-4 py-2.5 fw-bold rounded-pill d-flex align-items-center gap-2 shadow"
                    style={{ fontSize: "16px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(5px)" }}
                    onClick={() => setTrailerOpen(true)}
                  >
                    <BsCameraVideo size={18} /> Watch Trailer
                  </button>
                )}

                {!movieDetails?.trailerUrl && (
                  <span className="text-light text-opacity-80 small ms-2">
                    Tickets starting from <strong>₹{movie.minPrice || 150}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN BODY DETAILS: ABOUT, CAST, CREW, REVIEWS */}
      <div className="container mt-4">
        <div className="row g-4">
          <div className="col-lg-12">
            {/* ABOUT THE MOVIE */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
              <h4 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2" style={{ fontSize: "20px" }}>
                <BsFilm className="text-primary" /> About the Movie
              </h4>
              <p className="text-secondary mb-0" style={{ fontSize: "15px", lineHeight: "1.7" }}>
                {movieDetails.synopsis}
              </p>
            </div>

            {/* CAST SECTION */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "20px" }}>
                  Cast
                </h4>
                {movieDetails.cast.length > 0 && (
                  <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill">
                    {movieDetails.cast.length} Actors
                  </span>
                )}
              </div>

              {movieDetails.cast.length > 0 ? (
                <div className="row g-3">
                  {movieDetails.cast.map((actor, idx) => (
                    <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2 text-center">
                      <div className="p-2 rounded-3 hover-shadow transition-all">
                        <div
                          className="rounded-circle overflow-hidden mx-auto mb-2 shadow-sm border border-2 border-primary border-opacity-25"
                          style={{ width: "85px", height: "85px" }}
                        >
                          <img
                            src={actor.photo}
                            alt={actor.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                        <div className="fw-bold text-dark small text-truncate" title={actor.name}>
                          {actor.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: "12px" }}>
                          {actor.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-muted bg-light rounded-3 small">
                  Cast members have not been updated yet for this movie.
                </div>
              )}
            </div>

            {/* CREW SECTION */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "20px" }}>
                  Crew
                </h4>
                {movieDetails.crew.length > 0 && (
                  <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill">
                    {movieDetails.crew.length} Technicians
                  </span>
                )}
              </div>

              {movieDetails.crew.length > 0 ? (
                <div className="row g-3">
                  {movieDetails.crew.map((member, idx) => (
                    <div key={idx} className="col-6 col-sm-4 col-md-3 text-center">
                      <div className="p-2 rounded-3 hover-shadow transition-all">
                        <div
                          className="rounded-circle overflow-hidden mx-auto mb-2 shadow-sm border border-2 border-secondary border-opacity-25"
                          style={{ width: "85px", height: "85px" }}
                        >
                          <img
                            src={member.photo}
                            alt={member.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                        <div className="fw-bold text-dark small text-truncate" title={member.name}>
                          {member.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: "12px" }}>
                          {member.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-muted bg-light rounded-3 small">
                  Crew members have not been updated yet for this movie.
                </div>
              )}
            </div>

            {/* TOP REVIEWS SECTION (Card Carousel Pattern) */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4" id="reviews-section">
              <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold mb-1 text-dark" style={{ fontSize: "22px", letterSpacing: "-0.3px" }}>
                    Top reviews
                  </h4>
                  <div className="text-muted small">
                    {reviews.length > 0 
                      ? `Summary of ${displayVotes || (reviews.length + ' reviews')}.`
                      : (hasRating ? `Movie rating: ${displayRating}/10${displayVotes ? ` (${displayVotes})` : ''}` : "Be the first to share your review for this movie.")}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  {hasRating && displayVotes && (
                    <span className="fw-bold" style={{ color: "#2563eb", fontSize: "15px", cursor: "pointer" }}>
                      {displayVotes} &gt;
                    </span>
                  )}

                  {/* Header Arrow Controls */}
                  {reviews.length > 2 && (
                    <div className="d-flex align-items-center gap-1.5 me-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "32px",
                          height: "32px",
                          opacity: canScrollLeft ? 1 : 0.4,
                          cursor: canScrollLeft ? "pointer" : "default",
                          borderColor: "#e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                        disabled={!canScrollLeft}
                        onClick={() => scrollReviews("left")}
                        aria-label="Previous reviews"
                      >
                        <BsChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "32px",
                          height: "32px",
                          opacity: canScrollRight ? 1 : 0.4,
                          cursor: canScrollRight ? "pointer" : "default",
                          borderColor: "#e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                        disabled={!canScrollRight}
                        onClick={() => scrollReviews("right")}
                        aria-label="Next reviews"
                      >
                        <BsChevronRight size={13} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-primary rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                    style={{ fontSize: "14px" }}
                    onClick={() => setReviewModalOpen(true)}
                  >
                    <BsPencilSquare size={14} /> Write a Review
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Cards Container */}
              {reviews.length === 0 ? (
                <div className="text-center py-5 px-4 rounded-4 bg-light border border-dashed my-3">
                  <div className="mb-2 text-warning">
                    <BsStarFill size={32} />
                  </div>
                  <h6 className="fw-bold text-dark mb-1">No community reviews written yet</h6>
                  <p className="text-muted small mb-3" style={{ maxWidth: "380px", margin: "0 auto" }}>
                    Be the first to share your thoughts and help fellow movie enthusiasts book the right seats.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-4 fw-bold text-white shadow-sm btn-sm"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    <BsPencilSquare className="me-1" /> Write First Review
                  </button>
                </div>
              ) : (
                <div className="position-relative mt-3">
                  {/* Floating Left Arrow: only visible when scrolled right */}
                  {canScrollLeft && (
                    <button
                      type="button"
                      className="btn rounded-circle shadow position-absolute d-none d-md-flex align-items-center justify-content-center"
                      style={{
                        left: "-14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "38px",
                        height: "38px",
                        zIndex: 10,
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        backdropFilter: "blur(6px)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                      }}
                      onClick={() => scrollReviews("left")}
                      aria-label="Scroll left"
                    >
                      <BsChevronLeft size={16} />
                    </button>
                  )}

                  {/* Floating Right Arrow: only visible when more items exist to scroll */}
                  {canScrollRight && (
                    <button
                      type="button"
                      className="btn rounded-circle shadow position-absolute d-none d-md-flex align-items-center justify-content-center"
                      style={{
                        right: "-14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "38px",
                        height: "38px",
                        zIndex: 10,
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        backdropFilter: "blur(6px)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                      }}
                      onClick={() => scrollReviews("right")}
                      aria-label="Scroll right"
                    >
                      <BsChevronRight size={16} />
                    </button>
                  )}

                  {/* Scrollable Row */}
                  <style>
                    {`
                      .reviews-scroll-container::-webkit-scrollbar {
                        display: none;
                      }
                      .reviews-scroll-container {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                    `}
                  </style>
                  <div
                    ref={reviewScrollRef}
                    className="d-flex flex-nowrap gap-3.5 overflow-auto py-2 px-1 reviews-scroll-container"
                    style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                  >
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="card flex-shrink-0 border rounded-4 d-flex flex-column justify-content-between"
                        style={{
                          width: "360px",
                          minHeight: "220px",
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
                          scrollSnapAlign: "start",
                          padding: "18px 20px",
                          transition: "box-shadow 0.25s ease, transform 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.08)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "0 2px 12px rgba(15, 23, 42, 0.04)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {/* Top: Avatar, User Name, Booked Tag, Rating */}
                        <div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center gap-2.5">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-secondary bg-light border flex-shrink-0"
                                style={{ width: "40px", height: "40px", fontSize: "22px" }}
                              >
                                <BsPersonCircle />
                              </div>
                              <div>
                                <div className="fw-bold text-dark text-truncate" style={{ fontSize: "14.5px", maxWidth: "165px" }}>
                                  {rev.userName || "Verified User"}
                                </div>
                                <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "11.5px", marginTop: "1px" }}>
                                  Booked on <span className="fw-semibold text-primary">FIC BackRooms</span>
                                </div>
                              </div>
                            </div>

                            {/* Rating Star Badge */}
                            <div className="d-flex align-items-center gap-1.5 fw-bold" style={{ fontSize: "14.5px" }}>
                              <BsStarFill size={15} color="#f59e0b" />
                              <span className="text-dark">{rev.rating}/10</span>
                            </div>
                          </div>

                          {/* Middle: Headline & Comment Text (Clean text, no hashtags) */}
                          {rev.headline && (
                            <h6 className="fw-bold text-dark mb-1.5 text-truncate" style={{ fontSize: "14.5px" }}>
                              {rev.headline}
                            </h6>
                          )}
                          <p
                            className="text-secondary small mb-3"
                            style={{
                              fontSize: "13px",
                              lineHeight: "1.55",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {rev.comment}
                          </p>
                        </div>

                        {/* Bottom Footer: Thumbs up, Dislike, Date, Share with generous gap */}
                        <div
                          className="d-flex align-items-center justify-content-between pt-2.5 border-top mt-auto"
                          style={{ fontSize: "12.5px", borderColor: "#f1f5f9" }}
                        >
                          {/* Likes & Dislikes group with proper spacing */}
                          <div className="d-flex align-items-center gap-2.5">
                            <button
                              type="button"
                              className={`btn btn-sm py-1 px-2.5 rounded-pill d-flex align-items-center gap-1.5 border transition-all ${
                                rev.userLiked 
                                  ? "btn-primary text-white border-primary shadow-sm" 
                                  : "btn-light text-secondary border-0"
                              }`}
                              style={{ 
                                fontSize: "12px", 
                                fontWeight: "600",
                                backgroundColor: rev.userLiked ? "" : "#f8fafc" 
                              }}
                              onClick={() => handleLikeReview(rev.id)}
                              title="Helpful review"
                            >
                              {rev.userLiked ? <BsHandThumbsUpFill size={13} /> : <BsHandThumbsUp size={13} />}
                              <span>{rev.likes || 0}</span>
                            </button>

                            <button
                              type="button"
                              className={`btn btn-sm py-1 px-2 rounded-pill d-flex align-items-center border transition-all ${
                                rev.userDisliked 
                                  ? "btn-danger text-white border-danger shadow-sm" 
                                  : "btn-light text-secondary border-0"
                              }`}
                              style={{ 
                                fontSize: "12px",
                                backgroundColor: rev.userDisliked ? "" : "#f8fafc" 
                              }}
                              onClick={() => handleDislikeReview(rev.id)}
                              title="Not helpful"
                            >
                              {rev.userDisliked ? <BsHandThumbsDownFill size={13} /> : <BsHandThumbsDown size={13} />}
                            </button>
                          </div>

                          {/* Date and Share button with clean gap */}
                          <div className="d-flex align-items-center gap-3">
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                              {rev.date || "3 Days ago"}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm p-1.5 rounded-circle text-secondary border-0 d-flex align-items-center justify-content-center"
                              style={{ 
                                width: "30px", 
                                height: "30px", 
                                backgroundColor: "#f8fafc",
                                transition: "all 0.2s" 
                              }}
                              title="Share review"
                              onClick={() => {
                                navigator.clipboard?.writeText(`"${rev.headline || rev.comment}" - ${rev.userName} on FIC BackRooms`);
                                alert("Review copied to clipboard!");
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                            >
                              <BsShare size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TRAILER MODAL */}
      {trailerOpen && movieDetails?.trailerUrl && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content bg-transparent border-0">
              <div className="modal-header border-0 pb-0 justify-content-end">
                <button type="button" className="btn-close btn-close-white" onClick={() => setTrailerOpen(false)}></button>
              </div>
              <div className="modal-body p-0 d-flex justify-content-center">
                {movieDetails.trailerUrl.includes("youtube.com") || movieDetails.trailerUrl.includes("youtu.be") ? (
                  <div className="ratio ratio-16x9 w-100 rounded shadow-lg overflow-hidden" style={{ maxWidth: "1000px" }}>
                    <iframe
                      src={(() => {
                        let videoId = "";
                        const match = movieDetails.trailerUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
                        if (match && match[2].length === 11) {
                          videoId = match[2];
                        }
                        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : movieDetails.trailerUrl;
                      })()}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="ratio ratio-16x9 w-100 rounded shadow-lg overflow-hidden" style={{ maxWidth: "1000px" }}>
                    <video src={movieDetails.trailerUrl} controls autoPlay className="w-100 h-100 bg-black"></video>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RATE & REVIEW MODAL (Clean, no hashtags) */}
      {reviewModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div
                className="modal-header border-0 px-4 pt-4 pb-3"
                style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "#fff" }}
              >
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <span
                      className="d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: "32px", height: "32px", background: "#f59e0b", color: "#0f172a" }}
                    >
                      <BsStarFill size={15} />
                    </span>
                    Rate & Review &ldquo;{movie.title}&rdquo;
                  </h5>
                  <p className="text-light text-opacity-75 small mb-0 mt-1">
                    Share your authentic rating and thoughts with fellow movie fans.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setReviewModalOpen(false)}
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-light">
                <form onSubmit={handleReviewSubmit}>
                  {/* Rating Selector */}
                  <div className="bg-white p-3.5 rounded-4 border shadow-sm mb-3.5 text-center">
                    <label className="form-label fw-bold text-dark d-block mb-1">
                      How would you rate this movie?
                    </label>
                    <div className="d-flex align-items-center justify-content-center gap-1.5 my-2 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn p-1 border-0"
                          style={{
                            transform: (hoverRating || newRating) >= star ? "scale(1.2)" : "scale(1)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(star)}
                        >
                          <BsStarFill
                            size={28}
                            color={(hoverRating || newRating) >= star ? "#f59e0b" : "#cbd5e1"}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fs-6 fw-bold">
                        {hoverRating || newRating || 10}/10
                      </span>
                      <span className="text-muted small fw-medium">
                        {getRatingLabel(hoverRating || newRating || 10)}
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Name */}
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small mb-1">Your Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g. Rahul Sharma"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Review Headline */}
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small mb-1">
                      Review Title / Headline <span className="text-muted fw-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g. Masterclass action and sensational visuals!"
                      value={reviewHeadline}
                      onChange={(e) => setReviewHeadline(e.target.value)}
                    />
                  </div>

                  {/* Review Text */}
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small mb-1">
                      Detailed Review & Thoughts
                    </label>
                    <textarea
                      className="form-control rounded-3"
                      rows="4"
                      placeholder="Write what you loved about the direction, choreography, music, performances or cinematography..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  {/* Footer Buttons */}
                  <div className="d-flex align-items-center justify-content-end gap-2 pt-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => setReviewModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning rounded-pill px-4 fw-bold text-dark shadow-sm d-flex align-items-center gap-1.5"
                    >
                      <BsCheckCircleFill size={15} /> Submit Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
