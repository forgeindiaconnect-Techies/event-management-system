import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { getDefaultBanner } from "../../utils/bannerUtils";
import {
  BsCalendarEvent,
  BsFilm,
  BsGeoAlt,
  BsFire,
  BsStarFill,
  BsArrowRight,
  BsTicketPerforated,
} from "react-icons/bs";

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80";

export default function PublicForYouFeed({ events = [], searchQuery = "" }) {
  const navigate = useNavigate();
  const [dbShowtimes, setDbShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatabaseShowtimes();
  }, []);

  const loadDatabaseShowtimes = async () => {
    try {
      setLoading(true);
      const pubRes = await api.get("/theater/public/showtimes").catch(() => ({ data: [] }));
      let allShows = Array.isArray(pubRes.data) ? pubRes.data : [];

      const thRes = await api.get("/theater/list").catch(() => ({ data: [] }));
      const thList = Array.isArray(thRes.data) ? thRes.data : [];
      
      const thMap = new Map();
      thList.forEach((th) => {
        if (th.id) thMap.set(String(th.id), th);
        if (th.portal?.id) thMap.set(String(th.portal.id), th);
        if (th.theaterPortal?.id) thMap.set(String(th.theaterPortal.id), th);
      });

      // Filter and deduplicate
      const dedupMap = new Map();
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 15);

      allShows.forEach((st) => {
        if (!st || !st.movieTitle) return;
        
        if (st.showDate && st.startTime) {
           try {
             const showDateTime = new Date(`${st.showDate} ${st.startTime}`);
             if (!isNaN(showDateTime.getTime()) && showDateTime < cutoffTime) {
               return; // Skip past showtimes
             }
           } catch (e) {
             // ignore parse errors
           }
        }

        const dedupeKey = st.id ? String(st.id) : `${st.movieTitle}_${st.showDate}_${st.startTime}`;
        if (!dedupMap.has(dedupeKey)) dedupMap.set(dedupeKey, st);
      });

      setDbShowtimes(Array.from(dedupMap.values()));
    } catch (err) {
      console.warn("Error loading showtimes", err);
    } finally {
      setLoading(false);
    }
  };

  const databaseMovies = useMemo(() => {
    const map = new Map();
    dbShowtimes.forEach((st) => {
      if (!st || !st.movieTitle) return;
      const key = st.movieTitle.trim();
      const existing = map.get(key) || {
        id: `movie_${key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        title: key,
        movieId: st.movieId || null,
        poster: st.posterUrl || DEFAULT_POSTER,
        showtimes: [],
        minPrice: 120,
      };
      if (!existing.poster || existing.poster === DEFAULT_POSTER) {
        if (st.posterUrl) existing.poster = st.posterUrl;
      }
      if (!existing.movieId && st.movieId) existing.movieId = st.movieId;
      
      existing.showtimes.push(st);
      
      if (st.classPrices) {
        const prices = String(st.classPrices).match(/\d+/g);
        if (prices && prices.length > 0) {
           const parsed = prices.map(Number);
           existing.minPrice = Math.min(existing.minPrice, ...parsed);
        }
      }
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [dbShowtimes]);

  const featuredEvent = events[0] || null;
  const popularEvents = events.slice(0, 8);
  const trendingMovies = databaseMovies
    .filter(movie => {
       if (!searchQuery.trim()) return true;
       return movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, 8);

  const heroItem = featuredEvent; 

  const navigateToMovie = (movie) => {
    const movieIdParam = movie.movieId ? `&movieId=${movie.movieId}` : "";
    navigate(`/find-events?tab=movie&view=DETAILS${movieIdParam}`);
  };

  const formatDate = (date) => {
    if (!date) return "Date not added";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="public-for-you-feed pb-5 fade-in-up">
      {/* Hero Section */}
      {heroItem && (
        <section
          className="position-relative overflow-hidden mb-5 rounded-bottom-4 shadow"
          style={{
            minHeight: "440px",
            background: `linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 100%), url(${heroItem.bannerUrl || getDefaultBanner(heroItem.eventType)}) center/cover`,
            color: "#fff",
            marginTop: "-20px"
          }}
        >
          <div className="container py-5 h-100 d-flex align-items-center">
             <div style={{ maxWidth: "600px", marginTop: "2rem" }}>
                <span className="badge bg-primary px-3 py-2 rounded-pill mb-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2">
                  <BsFire /> HIGHLIGHT
                </span>
                <h1 className="display-5 fw-bold mb-3">{heroItem.eventName}</h1>
                <p className="lead text-light text-opacity-75 mb-4" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {heroItem.description || "Don't miss out on this amazing upcoming experience."}
                </p>
                <div className="d-flex gap-4 mb-4">
                   <span className="d-flex align-items-center gap-2 text-info fw-semibold"><BsCalendarEvent /> {formatDate(heroItem.startDateTime)}</span>
                   <span className="d-flex align-items-center gap-2 text-warning fw-semibold"><BsGeoAlt /> {heroItem.venue || "Online"}</span>
                </div>
                <Link to={`/public/events/${heroItem.id}`} className="btn btn-light btn-lg px-4 py-2 fw-bold rounded-pill shadow-lg transition-all hover-scale">
                  Explore Now <BsArrowRight className="ms-2" />
                </Link>
             </div>
          </div>
        </section>
      )}

      <div className="container">
         {/* Trending Events Row */}
         <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
                <BsCalendarEvent className="text-primary" /> Trending Events
              </h3>
              <Link to="/find-events?tab=events" className="text-decoration-none fw-bold text-primary">View All Events</Link>
            </div>
            
            <div className="d-flex flex-nowrap gap-4 overflow-auto pb-4 custom-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
              {popularEvents.map(event => (
                 <Link
                   key={event.id}
                   to={`/public/events/${event.id}`}
                   className="card border-0 rounded-4 shadow-sm text-decoration-none text-dark flex-shrink-0 position-relative event-hover bg-white"
                   style={{ width: "280px", scrollSnapAlign: "start" }}
                 >
                   <img src={event.bannerUrl || getDefaultBanner(event.eventType)} alt={event.eventName} className="card-img-top" style={{ height: "160px", objectFit: "cover" }} />
                   <div className="card-body p-3">
                      <h6 className="fw-bold text-truncate mb-2" style={{ fontSize: "16px" }}>{event.eventName}</h6>
                      <p className="text-muted small mb-1"><BsCalendarEvent className="me-1 text-primary"/> {formatDate(event.startDateTime)}</p>
                      <p className="text-muted small mb-0 text-truncate"><BsGeoAlt className="me-1 text-danger"/> {event.venue || "Online"}</p>
                   </div>
                 </Link>
              ))}
              {popularEvents.length === 0 && <p className="text-muted w-100 p-4 text-center bg-white rounded-4 shadow-sm">No events right now.</p>}
            </div>
         </section>

         {/* Trending Movies Row */}
         <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
                <BsFilm className="text-danger" /> Popular Movies
              </h3>
              <Link to="/find-events?tab=movie" className="text-decoration-none fw-bold text-danger">Explore Movies</Link>
            </div>

            {loading ? (
               <div className="text-center py-5 bg-white rounded-4 shadow-sm"><div className="spinner-border text-danger"></div></div>
            ) : (
               <div className="d-flex flex-nowrap gap-4 overflow-auto pb-4 custom-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
                 {trendingMovies.map(movie => (
                    <div
                      key={movie.id}
                      className="card border-0 rounded-4 shadow-sm flex-shrink-0 position-relative event-hover cursor-pointer bg-white"
                      style={{ width: "240px", scrollSnapAlign: "start" }}
                      onClick={() => navigateToMovie(movie)}
                    >
                      <div className="position-relative overflow-hidden rounded-top-4">
                        <img src={movie.poster} alt={movie.title} className="card-img-top" style={{ height: "320px", objectFit: "cover", transition: "transform 0.4s ease" }} />
                        <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
                           <span className="badge bg-dark bg-opacity-75 text-warning fw-bold d-inline-flex align-items-center gap-1 border border-secondary">
                             <BsStarFill /> 8.5/10
                           </span>
                        </div>
                      </div>
                      <div className="card-body p-3">
                         <h6 className="fw-bold text-truncate mb-3" style={{ fontSize: "16px" }}>{movie.title}</h6>
                         <button className="btn btn-outline-danger btn-sm w-100 fw-bold rounded-pill transition-all hover-solid">
                           <BsTicketPerforated className="me-1"/> Book Now
                         </button>
                      </div>
                    </div>
                 ))}
                 {trendingMovies.length === 0 && <p className="text-muted w-100 p-4 text-center bg-white rounded-4 shadow-sm">No movies are currently showing.</p>}
               </div>
            )}
         </section>
      </div>

      <style>{`
        .event-hover {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
          cursor: pointer;
        }
        .event-hover:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
        }
        .event-hover:hover img {
          transform: scale(1.05);
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .hover-solid:hover {
          background-color: #dc3545 !important;
          color: white !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .fade-in-up {
          animation: fadeInUp 0.6s ease forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
