import { useState, useMemo, useEffect } from "react";
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
  BsShieldCheck,
  BsTv,
  BsCameraVideo,
  BsCheckCircleFill,
} from "react-icons/bs";

// Curated cast and crew dictionary for known movies + intelligent fallback
const KNOWN_MOVIE_DATA = {
  goat: {
    synopsis:
      "Gandhi is a former leader of the Special Anti-Terrorist Squad (SATS). Years after a disastrous assignment in Thailand, his past resurfaces to threaten the peace of his family as an estranged operative seeks personal retribution.",
    cast: [
      { name: "Thalapathy Vijay", role: "Gandhi & Jeeva", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
      { name: "Prashanth", role: "Sunil Thiagarajan", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Prabhu Deva", role: "Kalyan Sundaram", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
      { name: "Sneha", role: "Anuradha Gandhi", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80" },
      { name: "Mohan", role: "Menon", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80" },
      { name: "Meenakshi Chaudhary", role: "Srinidhi", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
    ],
    crew: [
      { name: "Venkat Prabhu", role: "Director & Writer", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80" },
      { name: "Yuvan Shankar Raja", role: "Music Director", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80" },
      { name: "Siddhartha Nuni", role: "Cinematographer", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80" },
      { name: "Aghoram & Ganesh", role: "Producer", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80" },
    ],
  },
  coolie: {
    synopsis:
      "A veteran harbor worker finds himself at the crossroads of survival and vengeance when an international gold trafficking syndicate infiltrates his neighborhood and disrupts the peace of innocent dock laborers.",
    cast: [
      { name: "Rajinikanth", role: "Deva", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
      { name: "Nagarjuna", role: "Simon", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Soubin Shahir", role: "Dayal", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
      { name: "Shruti Haasan", role: "Preethi", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
      { name: "Sathyaraj", role: "Rajasekhar", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80" },
      { name: "Upendra", role: "Kaleesha", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80" },
    ],
    crew: [
      { name: "Lokesh Kanagaraj", role: "Director & Story", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80" },
      { name: "Anirudh Ravichander", role: "Music Composer", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80" },
      { name: "Girish Gangadharan", role: "Cinematographer", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80" },
      { name: "Kalanithi Maran", role: "Producer (Sun Pictures)", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80" },
    ],
  },
  loki: {
    synopsis:
      "The mercurial villain Loki resumes his role as the God of Mischief following an alternate timeline escape with the Tesseract, stepping into mysterious temporal anomalies across space and reality in Screen 2.",
    cast: [
      { name: "Tom Hiddleston", role: "Loki Laufeyson", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
      { name: "Sophia Di Martino", role: "Sylvie", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80" },
      { name: "Owen Wilson", role: "Mobius M. Mobius", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Ke Huy Quan", role: "Ouroboros 'O.B.'", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
      { name: "Gugu Mbatha-Raw", role: "Ravonna Renslayer", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
      { name: "Wunmi Mosaku", role: "Hunter B-15", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80" },
    ],
    crew: [
      { name: "Justin Benson & Aaron Moorhead", role: "Director", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80" },
      { name: "Natalie Holt", role: "Original Score & Music", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80" },
      { name: "Isaac Bauman", role: "Cinematography", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80" },
      { name: "Kevin Feige", role: "Executive Producer", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80" },
    ],
  },
};

const DEFAULT_CAST = [
  { name: "Lead Actor", role: "Protagonist", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
  { name: "Co-Star", role: "Supporting Role", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
  { name: "Lead Actress", role: "Main Character", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
  { name: "Antagonist", role: "Villain", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
];

const DEFAULT_CREW = [
  { name: "Chief Director", role: "Director & Writer", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80" },
  { name: "Music Maestro", role: "Music Director", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80" },
  { name: "Director of Photography", role: "Cinematographer", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80" },
  { name: "Producer Studios", role: "Producer", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80" },
];

export default function PublicMovieDetails({ movie, onBack, onProceedToTheaters }) {
  const [isLiked, setIsLiked] = useState(false);
  const [fullMovieData, setFullMovieData] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    if (movie?.movieId) {
      api.get(`/movies/${movie.movieId}`)
        .then(res => setFullMovieData(res.data))
        .catch(err => console.error("Failed to fetch full movie details", err));
    }
  }, [movie]);

  // Match cast & crew metadata from dictionary or generate smart fallback
  const movieDetails = useMemo(() => {
    if (!movie) return null;
    
    if (fullMovieData) {
      const dbCast = fullMovieData.castAndCrew?.filter(c => !c.primaryRole.toLowerCase().includes("director") && !c.primaryRole.toLowerCase().includes("producer") && !c.primaryRole.toLowerCase().includes("music")) || [];
      const dbCrew = fullMovieData.castAndCrew?.filter(c => c.primaryRole.toLowerCase().includes("director") || c.primaryRole.toLowerCase().includes("producer") || c.primaryRole.toLowerCase().includes("music")) || [];
      
      return {
        synopsis: fullMovieData.synopsis || `Experience the gripping cinematic tale of "${movie.title}".`,
        cast: dbCast.length > 0 ? dbCast.map(c => ({ name: c.name, role: c.primaryRole, photo: c.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" })) : DEFAULT_CAST,
        crew: dbCrew.length > 0 ? dbCrew.map(c => ({ name: c.name, role: c.primaryRole, photo: c.profileImageUrl || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80" })) : DEFAULT_CREW,
        genre: fullMovieData.genre || "Action / Thriller",
        duration: fullMovieData.durationMinutes ? `${Math.floor(fullMovieData.durationMinutes/60)}h ${fullMovieData.durationMinutes%60}m` : "2h 15m",
        certification: fullMovieData.certification || "UA",
        poster: fullMovieData.posterUrl || movie.poster,
        trailerUrl: fullMovieData.trailerUrl || movie.trailerUrl || null,
      };
    }

    const titleLower = movie.title.toLowerCase();
    let matchedKey = null;
    if (titleLower.includes("goat")) matchedKey = "goat";
    else if (titleLower.includes("coolie")) matchedKey = "coolie";
    else if (titleLower.includes("loki")) matchedKey = "loki";

    const base = matchedKey ? KNOWN_MOVIE_DATA[matchedKey] : null;
    return {
      synopsis:
        base?.synopsis ||
        `Experience the gripping cinematic tale of "${movie.title}". Scheduled with high-definition digital projection and immersive multi-channel sound in theaters now.`,
      cast: base?.cast || DEFAULT_CAST,
      crew: base?.crew || DEFAULT_CREW,
      genre: "Action / Thriller / Sci-Fi",
      duration: "2h 45m",
      certification: "UA / 13+",
      poster: movie.poster,
      trailerUrl: movie.trailerUrl || null,
    };
  }, [movie, fullMovieData]);

  if (!movie) return null;

  return (
    <div className="public-movie-details pb-5" style={{ backgroundColor: "#f8fafc", color: "#0f172a", minHeight: "100vh" }}>
      {/* 1. TOP NAVBAR / BACK BAR */}
      <div
        className="sticky-top bg-white border-bottom shadow-sm py-3 px-4 position-relative"
        style={{ zIndex: 110 }}
      >
        {/* Absolute Back Button pushed to the left edge */}
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
            {/* Mobile Back Button */}
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
          minHeight: "380px",
          background: "linear-gradient(90deg, #0f172a 35%, #1e293b 70%, #334155 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            {/* Poster Card */}
            <div className="col-lg-3 col-md-4 text-center text-md-start">
              <div
                className="rounded-4 overflow-hidden position-relative shadow-lg d-inline-block"
                style={{
                  width: "230px",
                  height: "330px",
                  border: "3px solid rgba(255,255,255,0.2)",
                  backgroundColor: "#1e293b",
                }}
              >
                <img
                  src={movieDetails?.poster || movie.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80"}
                  alt={movie.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  className="position-absolute bottom-0 start-0 end-0 p-2 text-center"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)" }}
                >
                  <span className="badge bg-danger px-2.5 py-1 rounded-pill small fw-bold">In Cinemas</span>
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
                <span className="text-warning fw-bold d-flex align-items-center gap-1">
                  <BsStarFill /> 9.2/10
                </span>
                <span>(34.8K Votes)</span>
                <span>•</span>
                <span>{movieDetails?.genre || "Action / Thriller"}</span>
                <span>•</span>
                <span><BsClock className="me-1" />{movieDetails?.duration || "2h 45m"}</span>
              </div>

              <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-15 mb-4" style={{ maxWidth: "680px" }}>
                <div className="d-flex align-items-center gap-2 text-warning fw-bold small mb-1">
                  <BsStarFill /> Add your rating & review
                </div>
                <div className="text-light text-opacity-75 small">
                  Your review helps other movie enthusiasts book the right seats.
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

      {/* 3. MAIN CONTENT: ABOUT THE MOVIE, CAST, AND CREW */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Centered Column: About, Cast, Crew */}
          <div className="col-lg-10 mx-auto">
            {/* ABOUT THE MOVIE */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
              <h4 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2" style={{ fontSize: "20px" }}>
                <BsFilm className="text-primary" /> About the Movie
              </h4>
              <p className="text-secondary leading-relaxed mb-0" style={{ fontSize: "15px", lineHeight: "1.7" }}>
                {movieDetails.synopsis}
              </p>
            </div>

            {/* CAST SECTION */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "20px" }}>
                  Cast
                </h4>
                <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill">
                  {movieDetails.cast.length} Actors
                </span>
              </div>

              <div className="row g-3">
                {movieDetails.cast.map((actor, idx) => (
                  <div key={idx} className="col-6 col-sm-4 col-md-3 text-center">
                    <div className="p-2 rounded-3 hover-shadow transition-all">
                      <div
                        className="rounded-circle overflow-hidden mx-auto mb-2 shadow-sm border border-2 border-primary border-opacity-25"
                        style={{ width: "90px", height: "90px" }}
                      >
                        <img
                          src={actor.photo}
                          alt={actor.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
            </div>

            {/* CREW SECTION */}
            <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "20px" }}>
                  Crew
                </h4>
                <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill">
                  {movieDetails.crew.length} Technicians
                </span>
              </div>

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
    </div>
  );
}
