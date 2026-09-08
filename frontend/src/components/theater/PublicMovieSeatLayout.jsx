import { useState, useEffect, useMemo } from "react";
import api from "../../api/axiosConfig";
import { formatIndianDate, formatIndianTime } from "../../utils/dateTime";
import {
  BsArrowLeft,
  BsCheckCircleFill,
  BsShieldCheck,
  BsTicketPerforated,
  BsQrCode,
  BsDownload,
  BsXCircle,
  BsInfoCircle,
} from "react-icons/bs";

// Helper to extract tier price from classPrices string (e.g. "balcony(190),gold(190),silver(160)")
function getSectionPrice(secName, classPricesStr, fallback = 160) {
  if (!classPricesStr) return fallback;
  if (typeof classPricesStr === "object") {
    return classPricesStr[secName] || classPricesStr["Normal"] || fallback;
  }
  const str = String(classPricesStr).toLowerCase();
  const target = (secName || "").toLowerCase().trim();

  const regex = new RegExp(`${target}[^0-9]*([0-9]+)`, "i");
  const match = str.match(regex);
  if (match && match[1]) {
    return Number(match[1]);
  }

  const anyNum = str.match(/\d+/);
  return anyNum ? Number(anyNum[0]) : fallback;
}

export function getCanonicalSection(str) {
  if (!str) return "gold";
  const s = String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s.includes("balcony")) return "balcony";
  if (s.includes("gold") || s.includes("premium")) return "gold";
  if (s.includes("silver") || s.includes("normal") || s.includes("classic")) return "silver";
  return s;
}

export function getCanonicalMovie(m) {
  return (m || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function PublicMovieSeatLayout({ movie, showtime, onBack, onBookingComplete, onChangeShowtime }) {
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [layout, setLayout] = useState(null);
  const [bookedSeats, setBookedSeats] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("publicUser"));
      return u?.name || "";
    } catch {
      return "";
    }
  });
  const [customerEmail, setCustomerEmail] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("publicUser"));
      return u?.email || "";
    } catch {
      return "";
    }
  });
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [processingPayment, setProcessingPayment] = useState(false);

  const screenId = showtime?.screen?.id || showtime?.screenId;
  const showtimeId = showtime?.id;

  const movieClean = (movie?.title || showtime?.movieTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const screenClean = (showtime?.screenName || showtime?.screen?.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const dateClean = (showtime?.showDate || showtime?.date || "").replace(/[^0-9]/g, "");
  const timeClean = (showtime?.startTime || "").replace(/[^0-9]/g, "").slice(0, 4);
  const showtimeContextKey = `CTX_${movieClean}_${screenClean}_${dateClean}_${timeClean}`;

  // Find other showtimes for the same day and theater
  const sameDayShowtimes = useMemo(() => {
    if (!movie?.showtimes || !showtime) return [];
    
    const currentTheater = showtime.portalName || showtime.theater?.theaterPortal?.portalName || showtime.theaterName || "Naveen Cinemas";
    const currentDate = showtime.showDate || showtime.date;

    return movie.showtimes
      .filter((st) => {
        const tName = st.portalName || st.theater?.theaterPortal?.portalName || st.theaterName || "Naveen Cinemas";
        const tDate = st.showDate || st.date;
        return tName === currentTheater && tDate === currentDate;
      })
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [movie, showtime]);

  // Clear selected seats when showtime changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [showtime?.id]);

  // 1. Fetch Hall Layout and Booked Seats with Real-Time Sync
  useEffect(() => {
    loadHallLayout();
    loadBookedSeats();

    const handleStorageChange = (e) => {
      if (e.key === "pos_booked_seats_map" || e.key === "pos_sales_history" || (e.key && e.key.startsWith("pos_sales_history_"))) {
        loadBookedSeats();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pos_booking_updated", loadBookedSeats);

    const pollInterval = setInterval(() => {
      loadBookedSeats();
    }, 1500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pos_booking_updated", loadBookedSeats);
      clearInterval(pollInterval);
    };
  }, [screenId, showtimeId, showtimeContextKey]);

  const loadHallLayout = async () => {
    try {
      setLoadingLayout(true);
      if (showtime?.screen?.layoutJson) {
        try {
          const parsed = typeof showtime.screen.layoutJson === "string"
            ? JSON.parse(showtime.screen.layoutJson)
            : showtime.screen.layoutJson;
          if (parsed && Array.isArray(parsed.sections)) {
            setLayout(parsed);
            setLoadingLayout(false);
            return;
          }
        } catch (e) {}
      }

      if (screenId) {
        const res = await api.get(`/theater/screens/${screenId}/layout`);
        if (res.data && Array.isArray(res.data.sections)) {
          setLayout(res.data);
          setLoadingLayout(false);
          return;
        }
      }

      // Check localStorage for saved screen layouts
      const pId = localStorage.getItem("portalId") || "2";
      const localLayouts = localStorage.getItem(`theater_screen_layouts_${pId}`);
      if (localLayouts) {
        const map = JSON.parse(localLayouts);
        if (map && map[screenId] && Array.isArray(map[screenId].sections)) {
          setLayout(map[screenId]);
          setLoadingLayout(false);
          return;
        }
      }

      // Default Standard Cinema Layout
      setLayout({
        sections: [
          {
            id: "sec_balcony",
            name: "Balcony",
            color: "#3B82F6",
            rowsCount: 4,
            seatsPerRow: 18,
            centerAisleGap: 1,
            hasAisleBelow: true,
          },
          {
            id: "sec_gold",
            name: "Gold",
            color: "#3B82F6",
            rowsCount: 6,
            seatsPerRow: 20,
            centerAisleGap: 1,
            hasAisleBelow: true,
          },
          {
            id: "sec_silver",
            name: "Silver",
            color: "#3B82F6",
            rowsCount: 10,
            seatsPerRow: 20,
            centerAisleGap: 1,
            hasAisleBelow: false,
          },
        ],
        deletedSeats: {},
      });
    } catch (err) {
      console.warn("Hall layout load notice:", err);
    } finally {
      setLoadingLayout(false);
    }
  };

  const loadBookedSeats = async () => {
    const booked = {};



    // 2. Check Backend Booked Seats endpoint
    if (showtimeId) {
      try {
        const res = await api.get(`/theater/showtimes/${showtimeId}/booked-seats`);
        if (Array.isArray(res.data)) {
          res.data.forEach((k) => {
            booked[`${showtimeId}-${k}`] = true;
            booked[`${showtimeContextKey}-${k}`] = true;
            booked[k] = true;
          });
        }
      } catch (e) {}
    }

    // 3. Scan sales history for this movie/showtime and mark seats as booked
    try {
      const salesMap = new Map();
      try {
        const res = await api.get("/theater/sales-history");
        if (Array.isArray(res.data)) {
          res.data.forEach((s) => salesMap.set(String(s.ticketId || s.id), s));
        }
      } catch (e) {}



      salesMap.forEach((sale) => {
        if (!sale || sale.status === "CANCELLED" || sale.status === "REFUNDED") return;
        const sMatchStId = sale.showtimeId && String(sale.showtimeId) === String(showtimeId);

        if (sMatchStId) {
          const sSeats = Array.isArray(sale.seats)
            ? sale.seats
            : typeof sale.seats === "string"
            ? sale.seats.split(",").map((s) => s.trim())
            : [];

          sSeats.forEach((seatStr) => {
            const match = seatStr.match(/([a-zA-Z\s]+)?\s*([A-Z])(\d+)/i);
            if (match) {
              const rawSec = (match[1] || "").trim();
              const cSec = getCanonicalSection(rawSec);
              const seatN = `${match[2]}${match[3]}`;
              if (cSec) {
                if (showtimeId) {
                  booked[`${showtimeId}-${cSec}-${seatN}`] = true;
                  booked[`${showtimeId}-${rawSec.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${seatN}`] = true;
                }
                booked[`${showtimeContextKey}-${cSec}-${seatN}`] = true;
                booked[`MV_${sMovieClean}_${cSec}_${seatN}`] = true;
                booked[`MV_${curMovieClean}_${cSec}_${seatN}`] = true;
                booked[`${sMovieClean}_${cSec}_${seatN}`] = true;
                booked[`${curMovieClean}_${cSec}_${seatN}`] = true;
                booked[`${cSec}_${seatN}`] = true;
              }
            }
          });
        }
      });
    } catch (e) {}

    setBookedSeats(booked);
  };

  // Seat Click handler (Select / Unselect)
  const handleSeatClick = (seatObj) => {
    const isAlreadySelected = selectedSeats.some((s) => s.key === seatObj.key);

    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.key !== seatObj.key));
    } else {
      if (selectedSeats.length >= 10) {
        alert("You can select up to 10 tickets per transaction.");
        return;
      }
      setSelectedSeats([...selectedSeats, seatObj]);
    }
  };

  // Pricing calculations
  const subtotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selectedSeats]);

  // Nominal Internet Convenience Fee & GST (Standard Indian Cinema Structure)
  const convenienceFee = selectedSeats.length > 0 ? selectedSeats.length * 20 : 0; // ₹20 per ticket
  const gstAmount = Number((convenienceFee * 0.18).toFixed(2)); // 18% GST on convenience fee
  const grandTotal = Number((subtotal + convenienceFee + gstAmount).toFixed(2));

  // Confirm booking & synchronize sold seats
  const handleConfirmBooking = async () => {
    if (!customerName.trim()) {
      alert("Please provide your full name for the booking.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      alert("Please provide a valid 10-digit mobile number for ticket SMS/WhatsApp.");
      return;
    }

    try {
      setProcessingPayment(true);

      const bookingId = `FIC-TKT-${Date.now().toString().slice(-6)}`;
      const bookedKeys = selectedSeats.map((s) => s.key);

      // 1. Update LocalStorage for live Cashier sync
      const currentBooked = { ...bookedSeats };

      selectedSeats.forEach((s) => {
        const secClean = (s.section || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cSec = getCanonicalSection(s.section);
        currentBooked[`${showtimeId}-${s.key}`] = true;
        if (s.altKey) currentBooked[`${showtimeId}-${s.altKey}`] = true;
        currentBooked[`${showtimeId}-${s.section}-${s.num}`] = true;
        currentBooked[`${showtimeId}-${secClean}-${s.num}`] = true;
        currentBooked[`${showtimeId}-${cSec}-${s.num}`] = true;
        currentBooked[`${showtimeContextKey}-${secClean}-${s.num}`] = true;
        currentBooked[`${showtimeContextKey}-${cSec}-${s.num}`] = true;
        currentBooked[`${showtimeContextKey}-${s.key}`] = true;
        currentBooked[`MV_${movieClean}_${cSec}_${s.num}`] = true;
        currentBooked[`${movieClean}_${cSec}_${s.num}`] = true;
        currentBooked[`${cSec}_${s.num}`] = true;


      });

      setBookedSeats(currentBooked);

      try {
        window.dispatchEvent(new Event("pos_booking_updated"));
      } catch (e) {}

      // 2. Add to sales history for Cashier & reports
      const ticketRecord = {
        id: Date.now(),
        ticketId: bookingId,
        movieTitle: movie?.title || showtime?.movieTitle || "Movie",
        screenName: showtime?.screen?.screenName || "Screen",
        screenId: showtime?.screen?.id || showtime?.screenId,
        showtimeId: showtimeId,
        showDate: showtime?.showDate || showtime?.date || new Date().toISOString().split("T")[0],
        showTime: showtime?.startTime || "09:30 AM",
        startTime: showtime?.startTime || "09:30 AM",
        seats: selectedSeats.map((s) => `${s.section} ${s.num}`).join(", "),
        seatsFormatted: selectedSeats.map((s) => `${s.num}`).join(", "),
        seatCount: selectedSeats.length,
        selectedSeatsCount: selectedSeats.length,
        amount: grandTotal,
        totalAmount: grandTotal,
        subtotal: grandTotal,
        paymentMode: paymentMode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        bookedDate: new Date().toISOString().split("T")[0],
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "VALID",
        source: "ONLINE_BOOKING",
      };



      // 3. Post to backend
      try {
        await api.post(`/theater/showtimes/${showtimeId}/book-seats`, {
          seatKeys: bookedKeys,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          paymentMode: paymentMode,
          totalAmount: grandTotal,
          source: "ONLINE_BOOKING",
        }).catch((e) => console.warn("Public book-seats backend error:", e));

        await api.post("/theater/sales-history", ticketRecord).catch((e) => console.warn("Public sales-history post error:", e));
      } catch (err) {
        console.warn("Backend booking sync notice:", err);
      }

      setBookingConfirmed({
        bookingId,
        movieTitle: movie?.title,
        theaterName: showtime?.portalName || showtime?.theaterName || "Gopal Multiplex",
        screenName: showtime?.screen?.screenName || "Screen 1",
        showDate: showtime?.showDate,
        startTime: showtime?.startTime,
        seats: selectedSeats.map((s) => s.num),
        totalAmount: grandTotal,
        customerName,
        customerPhone,
        paymentMode,
      });

      setIsCheckoutOpen(false);
    } catch (err) {
      alert("Payment processing error. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const rowLetters = [
    "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
  ];

  // Balcony has its own independent alphabet (A, B, C...).
  // Down classes start fresh from A and continue sequentially among the floor classes.
  const databaseSections = useMemo(() => {
    if (!layout?.sections) return [];
    let floorRowOffset = 0;

    return layout.sections.map((sec) => {
      const isBalcony = (sec.name || "").toLowerCase().includes("balcony");
      const rows = sec.rowsCount || 4;
      const rowLabels = [];

      if (isBalcony) {
        // Balcony has its own independent alphabet sequence starting at A
        for (let r = 0; r < rows; r++) {
          rowLabels.push(rowLetters[r] || `B-R${r + 1}`);
        }
      } else {
        // Down classes start at A and continue sequentially across floor sections
        for (let r = 0; r < rows; r++) {
          rowLabels.push(rowLetters[floorRowOffset++] || `R${floorRowOffset}`);
        }
      }

      return {
        ...sec,
        isBalcony,
        rowLabels,
      };
    });
  }, [layout]);

  if (!movie || !showtime) return null;

  return (
    <div className="public-seat-selection pb-5" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
      {/* 1. TOP HEADER & MOVIE CONTEXT BAR */}
      <div className="sticky-top" style={{ zIndex: 110 }}>
        <div className="bg-white border-bottom shadow-sm py-2.5 px-4">
          <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2 position-relative">
          <div className="d-flex align-items-center gap-3 ps-lg-4">
            {/* Absolute Back Button pushed to the left edge */}
            <button
              type="button"
              className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-2 position-absolute d-none d-lg-flex transition-all"
              onClick={onBack}
              style={{ fontSize: "15px", fontWeight: "600", left: "0", top: "50%", transform: "translateY(-50%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <BsArrowLeft size={18} /> Back
            </button>

            {/* Mobile Back Button */}
            <button
              type="button"
              className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center gap-2 me-1 d-lg-none transition-all"
              onClick={onBack}
              style={{ fontSize: "15px", fontWeight: "600" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <BsArrowLeft size={18} />
            </button>

            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bolder mb-0 text-dark" style={{ fontSize: "18px" }}>
                  {movie.title}
                </h5>
                <span className="badge bg-light text-dark border px-2 py-0.5 rounded small">
                  UA
                </span>
                <span className="badge bg-primary px-2.5 py-0.5 rounded-pill small fw-semibold">
                  {showtime.screenTech || "2D"}
                </span>
              </div>
              <div className="text-muted small">
                {showtime.portalName || showtime.theaterName || "Cinema"} •{" "}
                {showtime.screen?.screenName || "Screen 1"} |{" "}
                <strong>{formatIndianDate(showtime.showDate)}</strong> at{" "}
                <strong>{formatIndianTime(showtime.startTime)}</strong>
              </div>
            </div>
          </div>

          {/* Seat Status Legend */}
          <div className="d-flex align-items-center gap-3 small">
            <div className="d-flex align-items-center gap-1.5">
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  border: "1px solid #94a3b8",
                  backgroundColor: "#ffffff",
                  display: "inline-block",
                }}
              ></span>
              <span className="text-muted">Available</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  backgroundColor: "#10b981",
                  display: "inline-block",
                }}
              ></span>
              <span className="fw-semibold text-success">Selected</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  backgroundColor: "#cbd5e1",
                  display: "inline-block",
                }}
              ></span>
              <span className="text-muted">Sold</span>
            </div>
          </div>
        </div>
        </div>

        {/* SHOWTIME SELECTOR BAR */}
        {sameDayShowtimes.length > 0 && (
          <div className="bg-light border-bottom py-2 px-4 shadow-sm" style={{ backgroundColor: "#f1f5f9" }}>
            <div className="container d-flex align-items-center gap-2 overflow-auto" style={{ whiteSpace: "nowrap", paddingBottom: "4px" }}>
              {sameDayShowtimes.map((st, idx) => {
                const isActive = st.id === showtime.id;
                return (
                  <button
                    key={st.id || idx}
                    type="button"
                    onClick={() => onChangeShowtime && onChangeShowtime(st)}
                    className={`btn btn-sm d-flex flex-column align-items-center justify-content-center rounded ${
                      isActive ? "bg-success text-white border-success shadow-sm" : "bg-white text-dark border-secondary"
                    }`}
                    style={{ minWidth: "110px", padding: "6px 12px", border: isActive ? "2px solid #10b981" : "1px solid #cbd5e1" }}
                  >
                    <span className="fw-bold mb-1" style={{ fontSize: "14px" }}>
                      {formatIndianTime(st.startTime)}
                    </span>
                    <span style={{ fontSize: "10px", letterSpacing: "0.5px" }} className={isActive ? "text-white" : "text-secondary"}>
                      {(st.screen?.screenName || st.screen?.name || st.screenName || "SCREEN 1").toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. CINEMA HALL SEAT MAP & BOTTOM SCREEN */}
      <div className="container py-4">
        <div className="bg-white rounded-4 border shadow-sm p-4 text-center mb-5 position-relative overflow-hidden">
          {/* LOADING STATE */}
          {loadingLayout ? (
            <div className="py-5 text-center text-muted">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <div>Loading real hall seat layout...</div>
            </div>
          ) : (
            /* SECTIONS & SEATS CONTAINER */
            <div className="overflow-auto pb-2" style={{ maxWidth: "100%" }}>
              {databaseSections.map((sec) => {
                const secPrice = getSectionPrice(sec.name, showtime.classPrices);
                const rows = sec.rowsCount || 4;
                const seatsPerRow = sec.seatsPerRow || 18;
                const halfSeats = Math.ceil(seatsPerRow / 2);

                return (
                  <div key={sec.id} className="mb-4">
                    {/* Tier Header */}
                    <div
                      className="d-flex align-items-center justify-content-between px-3 py-1.5 rounded-3 mb-3"
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        maxWidth: "820px",
                        margin: "0 auto",
                      }}
                    >
                      <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "2px",
                            backgroundColor: sec.color || "#3b82f6",
                          }}
                        ></span>
                        {sec.name} Class
                      </span>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">
                        ₹{secPrice}
                      </span>
                    </div>

                    {/* Rows */}
                    <div className="d-flex flex-column gap-2">
                      {Array.from({ length: rows }).map((_, rIdx) => {
                        const rowLetter = sec.rowLabels?.[rIdx] || String.fromCharCode(65 + rIdx);
                        let activeSeatCounter = 1;

                        return (
                          <div
                            key={rIdx}
                            className="d-flex align-items-center justify-content-center gap-1.5"
                          >
                            {/* Left Row Identifier */}
                            <span
                              className="fw-bold text-muted text-end me-2"
                              style={{ width: "20px", fontSize: "12px" }}
                            >
                              {rowLetter}
                            </span>

                            {/* Left Seat Block */}
                            <div className="d-flex gap-1">
                              {Array.from({ length: halfSeats }).map((_, cIdx) => {
                                const key1 = `${sec.id}-${rowLetter}-${cIdx}`;
                                const key2 = `${sec.id}-${rIdx}-${cIdx}`;
                                const isDeleted = Boolean(
                                  layout.deletedSeats?.[key1] || layout.deletedSeats?.[key2]
                                );

                                if (isDeleted) {
                                  return (
                                    <div
                                      key={cIdx}
                                      style={{ width: "28px", height: "28px", visibility: "hidden" }}
                                    />
                                  );
                                }

                                const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                                const seatKey = key1;
                                const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                                const cSec = getCanonicalSection(sec.name || sec.id);

                                const isSold = Boolean(
                                  bookedSeats[`${showtimeId}-${key1}`] ||
                                  bookedSeats[`${showtimeId}-${key2}`] ||
                                  bookedSeats[`${showtimeId}-${sec.id}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeId}-${secClean}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeId}-${cSec}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeContextKey}-${key1}`] ||
                                  bookedSeats[`${showtimeContextKey}-${key2}`] ||
                                  bookedSeats[`${showtimeContextKey}-${sec.id}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeContextKey}-${secClean}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`] ||
                                  bookedSeats[`MV_${movieClean}_${cSec}_${seatNumDisplay}`] ||
                                  bookedSeats[`${movieClean}_${cSec}_${seatNumDisplay}`] ||
                                  bookedSeats[`${cSec}_${seatNumDisplay}`]
                                );
                                const isSelected = selectedSeats.some((s) => s.key === seatKey);

                                let bg = "#ffffff";
                                let border = "1px solid #cbd5e1";
                                let color = "#334155";

                                if (isSold) {
                                  bg = "#e2e8f0";
                                  border = "1px solid #cbd5e1";
                                  color = "#94a3b8";
                                } else if (isSelected) {
                                  bg = "#10b981";
                                  border = "1px solid #059669";
                                  color = "#ffffff";
                                }

                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    disabled={isSold}
                                    onClick={() =>
                                      handleSeatClick({
                                        key: seatKey,
                                        altKey: key2,
                                        num: seatNumDisplay,
                                        section: sec.name,
                                        price: secPrice,
                                      })
                                    }
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "5px",
                                      fontWeight: "600",
                                      fontSize: "10px",
                                      backgroundColor: bg,
                                      border: border,
                                      color: color,
                                      cursor: isSold ? "not-allowed" : "pointer",
                                      transition: "transform 0.1s ease",
                                    }}
                                    className="p-0 shadow-2xs"
                                    title={
                                      isSold
                                        ? `Seat ${seatNumDisplay} (${sec.name}) - Sold`
                                        : `${sec.name} ${seatNumDisplay} - ₹${secPrice}`
                                    }
                                  >
                                    {seatNumDisplay}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Center Aisle Gap */}
                            <div
                              style={{
                                width: `${Math.max(1, sec.centerAisleGap || 1) * 24}px`,
                              }}
                            />

                            {/* Right Seat Block */}
                            <div className="d-flex gap-1">
                              {Array.from({ length: seatsPerRow - halfSeats }).map((_, cIdx) => {
                                const actualCIdx = halfSeats + cIdx;
                                const key1 = `${sec.id}-${rowLetter}-${actualCIdx}`;
                                const key2 = `${sec.id}-${rIdx}-${actualCIdx}`;
                                const isDeleted = Boolean(
                                  layout.deletedSeats?.[key1] || layout.deletedSeats?.[key2]
                                );

                                if (isDeleted) {
                                  return (
                                    <div
                                      key={cIdx}
                                      style={{ width: "28px", height: "28px", visibility: "hidden" }}
                                    />
                                  );
                                }

                                const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                                const seatKey = key1;
                                const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                                const cSec = getCanonicalSection(sec.name || sec.id);

                                const isSold = Boolean(
                                  bookedSeats[`${showtimeId}-${key1}`] ||
                                  bookedSeats[`${showtimeId}-${key2}`] ||
                                  bookedSeats[`${showtimeId}-${sec.id}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeId}-${secClean}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeId}-${cSec}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeContextKey}-${key1}`] ||
                                  bookedSeats[`${showtimeContextKey}-${key2}`] ||
                                  bookedSeats[`${showtimeContextKey}-${sec.id}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeContextKey}-${secClean}-${seatNumDisplay}`] ||
                                  bookedSeats[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`] ||
                                  bookedSeats[`MV_${movieClean}_${cSec}_${seatNumDisplay}`] ||
                                  bookedSeats[`${movieClean}_${cSec}_${seatNumDisplay}`] ||
                                  bookedSeats[`${cSec}_${seatNumDisplay}`]
                                );
                                const isSelected = selectedSeats.some((s) => s.key === seatKey);

                                let bg = "#ffffff";
                                let border = "1px solid #cbd5e1";
                                let color = "#334155";

                                if (isSold) {
                                  bg = "#e2e8f0";
                                  border = "1px solid #cbd5e1";
                                  color = "#94a3b8";
                                } else if (isSelected) {
                                  bg = "#10b981";
                                  border = "1px solid #059669";
                                  color = "#ffffff";
                                }

                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    disabled={isSold}
                                    onClick={() =>
                                      handleSeatClick({
                                        key: seatKey,
                                        altKey: key2,
                                        num: seatNumDisplay,
                                        section: sec.name,
                                        price: secPrice,
                                      })
                                    }
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "5px",
                                      fontWeight: "600",
                                      fontSize: "10px",
                                      backgroundColor: bg,
                                      border: border,
                                      color: color,
                                      cursor: isSold ? "not-allowed" : "pointer",
                                      transition: "transform 0.1s ease",
                                    }}
                                    className="p-0 shadow-2xs"
                                    title={
                                      isSold
                                        ? `Seat ${seatNumDisplay} (Sold)`
                                        : `${sec.name} ${seatNumDisplay} - ₹${secPrice}`
                                    }
                                  >
                                    {seatNumDisplay}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Right Row Identifier */}
                            <span
                              className="fw-bold text-muted text-start ms-2"
                              style={{ width: "20px", fontSize: "12px" }}
                            >
                              {rowLetter}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* HORIZONTAL AISLE WALKWAY */}
                    {sec.hasAisleBelow && (
                      <div
                        className="w-100 py-1.5 my-3 bg-light border border-dashed rounded text-center small text-secondary fw-semibold"
                        style={{ maxWidth: "820px", margin: "0 auto", letterSpacing: "1px" }}
                      >
                        🚶 HORIZONTAL AISLE WALKWAY
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CURVED SCREEN ARCH AT THE BOTTOM (IN FRONT OF LOWER CLASS) */}
          <div className="mt-4 pt-3 d-flex flex-column align-items-center">
            <svg
              width="60%"
              height="35"
              viewBox="0 0 500 40"
              style={{ filter: "drop-shadow(0 4px 10px rgba(37, 99, 235, 0.25))" }}
            >
              <path
                d="M 20 10 Q 250 35 480 10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
            <div
              className="text-muted fw-bold small mt-1"
              style={{ letterSpacing: "3px", fontSize: "11px" }}
            >
              ALL EYES THIS WAY • SCREEN
            </div>
          </div>
        </div>
      </div>

      {/* 3. STICKY BOTTOM BOOKING BAR */}
      {selectedSeats.length > 0 && (
        <div
          className="fixed-bottom bg-white border-top shadow-lg py-3 px-4"
          style={{ zIndex: 120 }}
        >
          <div className="container d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="small text-muted mb-1 fw-semibold">
                Selected {selectedSeats.length} Ticket{selectedSeats.length > 1 ? "s" : ""}:
              </div>
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                {selectedSeats.map((s) => (
                  <span
                    key={s.key}
                    className="badge bg-success text-white px-2.5 py-1 rounded-pill small fw-bold"
                  >
                    {s.num} ({s.section})
                  </span>
                ))}
              </div>
            </div>

            <div className="d-flex align-items-center gap-4">
              <div className="text-end">
                <div className="small text-muted fw-semibold">Ticket Price:</div>
                <div className="fw-bolder fs-4 text-dark">₹{subtotal}</div>
                <div className="text-muted" style={{ fontSize: "11px" }}>+ Taxes & fees in next step</div>
              </div>

              <button
                type="button"
                className="btn btn-primary px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center gap-2 shadow"
                onClick={() => setIsCheckoutOpen(true)}
              >
                <BsTicketPerforated size={18} /> Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHECKOUT & CONTACT DETAILS MODAL */}
      {isCheckoutOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <BsTicketPerforated className="text-primary" /> Confirm Ticket Booking
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsCheckoutOpen(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Summary Box */}
                <div className="p-3 rounded-3 bg-light border mb-3">
                  <div className="fw-bold text-dark fs-6 mb-1">{movie.title}</div>
                  <div className="text-muted small mb-2">
                    {showtime.portalName || showtime.theaterName} •{" "}
                    {showtime.screen?.screenName || "Screen 1"}
                  </div>
                  <div className="d-flex align-items-center justify-content-between text-secondary small border-top pt-2">
                    <span>
                      Seats: <strong>{selectedSeats.map((s) => s.num).join(", ")}</strong>
                    </span>
                    <span>
                      {selectedSeats.length} Ticket{selectedSeats.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Transparent Price & Tax Breakdown */}
                <div className="p-3 rounded-3 border mb-3" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="small fw-bold text-dark mb-2 text-uppercase" style={{ fontSize: "11px", letterSpacing: "1px" }}>
                    Price & Tax Breakdown
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1.5 small">
                    <span className="text-secondary">Real Ticket Price ({selectedSeats.length} Ticket{selectedSeats.length > 1 ? "s" : ""}):</span>
                    <span className="fw-bold text-dark">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1.5 small">
                    <span className="text-secondary">Convenience / Handling Fee:</span>
                    <span className="fw-semibold text-dark">₹{convenienceFee.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2 small">
                    <span className="text-secondary">Integrated GST (18% on fees):</span>
                    <span className="fw-semibold text-dark">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-1">
                    <span className="fw-bold text-dark fs-6">Total Amount Payable:</span>
                    <span className="fw-bolder text-primary fs-5">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Contact Input Form */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Your Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Mobile Number (for SMS M-Ticket) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    maxLength={10}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark mb-1">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                {/* Payment Mode Selection */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-dark mb-1">Payment Mode</label>
                  <div className="row g-2">
                    {["UPI", "CARD", "COUNTER"].map((mode) => (
                      <div key={mode} className="col-4">
                        <button
                          type="button"
                          className={`btn w-100 py-2 rounded-3 text-center fw-semibold small ${
                            paymentMode === mode
                              ? "btn-primary text-white shadow-xs"
                              : "btn-outline-secondary text-dark bg-white"
                          }`}
                          onClick={() => setPaymentMode(mode)}
                        >
                          {mode === "UPI" ? "UPI / QR" : mode === "CARD" ? "Card" : "Counter Pay"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Badge */}
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <BsShieldCheck className="text-success fs-5" />
                  <span>Real-time seat locking with 100% instant reservation</span>
                </div>
              </div>

              <div className="modal-footer bg-light border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3.5"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 fw-bold d-flex align-items-center gap-2 shadow"
                  disabled={processingPayment}
                  onClick={handleConfirmBooking}
                >
                  {processingPayment ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span> Processing...
                    </>
                  ) : (
                    <>
                      <BsCheckCircleFill /> Pay & Book ₹{grandTotal.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUCCESSFUL BOOKING CONFIRMATION & M-TICKET PASS */}
      {bookingConfirmed && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1100 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white text-dark">
              {/* Top Green Accent */}
              <div className="bg-success text-white p-4 text-center">
                <div
                  className="rounded-circle bg-white text-success d-inline-flex align-items-center justify-content-center mb-2 shadow"
                  style={{ width: "54px", height: "54px" }}
                >
                  <BsCheckCircleFill size={28} />
                </div>
                <h4 className="fw-bolder mb-1">Booking Confirmed!</h4>
                <div className="text-white text-opacity-90 small">
                  Reference ID: <strong>{bookingConfirmed.bookingId}</strong>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-4">
                <div
                  className="p-3.5 rounded-3 border mb-3"
                  style={{
                    backgroundColor: "#f8fafc",
                    borderLeft: "4px solid #16a34a",
                  }}
                >
                  <h5 className="fw-bolder mb-1 text-dark">{bookingConfirmed.movieTitle}</h5>
                  <div className="text-muted small mb-2">
                    {bookingConfirmed.theaterName} • {bookingConfirmed.screenName}
                  </div>

                  <div className="row g-2 pt-2 border-top text-secondary small">
                    <div className="col-6">
                      <span className="text-muted">Date:</span>{" "}
                      <strong>{formatIndianDate(bookingConfirmed.showDate)}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Time:</span>{" "}
                      <strong>{formatIndianTime(bookingConfirmed.startTime)}</strong>
                    </div>
                    <div className="col-12 mt-2">
                      <span className="text-muted">Seats:</span>{" "}
                      <span className="badge bg-success text-white px-2.5 py-1 rounded-pill ms-1 fw-bold fs-6">
                        {bookingConfirmed.seats.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Simulation & M-Ticket Verification */}
                <div className="p-3 rounded-3 bg-light border text-center mb-3">
                  <BsQrCode size={64} className="text-dark mb-1" />
                  <div className="small text-muted">Scan at cinema entry counter for instant admission</div>
                </div>

                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span>Guest: <strong>{bookingConfirmed.customerName}</strong></span>
                  <span>Amount Paid: <strong className="text-dark fs-6">₹{bookingConfirmed.totalAmount}</strong></span>
                </div>
              </div>

              <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <BsDownload size={14} /> Print / Save
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 fw-bold"
                  onClick={() => {
                    setBookingConfirmed(null);
                    if (onBookingComplete) {
                      onBookingComplete();
                    } else {
                      window.location.reload();
                    }
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
