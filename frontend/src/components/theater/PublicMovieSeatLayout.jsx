import { useState, useEffect, useMemo, useRef } from "react";
import api from "../../api/axiosConfig";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatIndianDate, formatIndianTime } from "../../utils/dateTime";
import {
  BsArrowLeft,
  BsCheckCircleFill,
  BsShieldCheck,
  BsTicketPerforated,
  BsQrCode,
  BsDownload,
  BsPrinter,
  BsXCircle,
  BsInfoCircle,
  BsPlus,
  BsDash,
  BsBagCheckFill,
  BsCupStraw,
  BsCheck2Circle,
  BsSlashCircle,
  BsPersonCircle,
  BsChevronDown,
  BsZoomIn,
  BsZoomOut,
  BsArrowCounterclockwise,
} from "react-icons/bs";


const DEFAULT_FALLBACK_SNACKS = [
  { id: "snack-1", name: "Classic Salted Popcorn (Regular)", category: "Popcorn", price: 180, description: "Freshly popped warm golden cinema popcorn", imageUrl: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&q=80" },
  { id: "snack-2", name: "Caramel Gourmet Popcorn (Large)", category: "Popcorn", price: 240, description: "Crispy sweet glazed gourmet caramel popcorn", imageUrl: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80" },
  { id: "snack-3", name: "Blockbuster Combo (Popcorn + Soda)", category: "Combo", price: 299, description: "1 Large Butter Popcorn + 1 Chilled Fountain Beverage", imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80" },
  { id: "snack-4", name: "Chilled Pepsi Fountain Drink (500ml)", category: "Beverage", price: 120, description: "Refreshing sparkling fountain soda served chilled", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
  { id: "snack-5", name: "Crispy Nachos with Warm Cheese Dip", category: "Snack", price: 190, description: "Crispy tortilla chips served with rich jalapeño cheese", imageUrl: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80" },
];

const DEFAULT_VENUE_TERMS = [
  "Outside food and beverages are strictly not allowed inside the cinema auditorium.",
  "Entry is restricted for individuals below 18 years for movies with 'A' (Adults Only) certification. Valid Govt Photo ID must be presented upon request.",
  "Please arrive at least 15 minutes before the scheduled showtime. Cinema gates close 10 minutes after the feature presentation starts.",
  "Tickets once booked are governed by the venue's cancellation policy and cannot be transferred or exchanged.",
  "For 3D movie shows, 3D glasses must be returned in good condition after the show. Damages may be charged.",
  "The cinema management reserves the right of admission and security inspection."
];

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

function getCanonicalMovie(m) {
  return (m || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function PublicMovieSeatLayout({ movie, showtime, onBack, onBookingComplete, onChangeShowtime }) {
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [layout, setLayout] = useState(null);
  const [bookedSeats, setBookedSeats] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [maxSeatsAllowed, setMaxSeatsAllowed] = useState(8);
  const [targetSeatCount, setTargetSeatCount] = useState(2);
  const [isSeatCountModalOpen, setIsSeatCountModalOpen] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const ticketCardRef = useRef(null);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);

  // Zoom & Touch/Mouse Pan state for interactive seat map
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const seatMapWrapperRef = useRef(null);
  const [isPinching, setIsPinching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = seatMapWrapperRef.current;
    if (!el) return;

    let initialPinchDist = null;
    let initialPinchZoom = 1;
    let isPointerDown = false;
    let startX = 0;
    let startY = 0;
    let scrollStartLeft = 0;
    let scrollStartTop = 0;

    // 1. Mouse wheel zoom / Trackpad pinch
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomDelta = e.ctrlKey || e.metaKey
        ? -e.deltaY * 0.01
        : e.deltaY < 0 ? 0.1 : -0.1;

      setZoomLevel((prev) => {
        const next = Math.min(2.2, Math.max(0.6, +(prev + zoomDelta).toFixed(2)));
        return next;
      });
    };

    // 2. Touch pinch zoom (2 fingers on mobile / touchscreen)
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialPinchZoom = zoomLevelRef.current;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDist) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = currentDist / initialPinchDist;
        const newZoom = Math.min(2.2, Math.max(0.6, +(initialPinchZoom * ratio).toFixed(2)));
        setZoomLevel(newZoom);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
        setIsPinching(false);
      }
    };

    // 3. Mouse click & drag pan when zoomed in
    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      scrollStartLeft = el.scrollLeft;
      scrollStartTop = el.scrollTop;
    };

    const handleMouseMove = (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setIsDragging(true);
        el.scrollLeft = scrollStartLeft - dx;
        el.scrollTop = scrollStartTop - dy;
      }
    };

    const handleMouseUp = () => {
      isPointerDown = false;
      setTimeout(() => setIsDragging(false), 50);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleDownloadTicketPdf = async () => {
    if (!ticketCardRef.current || isDownloadingTicket) return;
    try {
      setIsDownloadingTicket(true);
      const element = ticketCardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30; // 15mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const yOffset = imgHeight < pdfHeight - 30 ? 15 : 10;
      pdf.addImage(imgData, "PNG", 15, yOffset, imgWidth, imgHeight);
      pdf.save(`MovieTicket-${bookingConfirmed?.bookingId || "Booking"}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF ticket:", err);
      alert("Failed to generate PDF ticket. Please use the Print option.");
    } finally {
      setIsDownloadingTicket(false);
    }
  };

  // Online Food Pre-booking Facility & Menu State
  const currentTheaterId = showtime?.theater?.theaterPortal?.id || showtime?.theaterPortalId || showtime?.theater?.id || localStorage.getItem("portalId") || "2";
  const [theaterOnlineFoodEnabled, setTheaterOnlineFoodEnabled] = useState(false);
  const [inSeatDeliveryEnabled, setInSeatDeliveryEnabled] = useState(true);
  const [concessionGSTRate, setConcessionGSTRate] = useState(5);
  const [minOrderForDelivery, setMinOrderForDelivery] = useState(100);
  const [deliveryMode, setDeliveryMode] = useState("COUNTER"); // "COUNTER" | "IN_SEAT"
  const [availableSnacks, setAvailableSnacks] = useState([]);
  const [selectedSnacks, setSelectedSnacks] = useState({}); // { [itemId]: { item, quantity } }
  const [isSnackModalOpen, setIsSnackModalOpen] = useState(false);
  const [selectedSnackCategory, setSelectedSnackCategory] = useState("All");

  // Venue Terms & Conditions Agreement State
  const [theaterTerms, setTheaterTerms] = useState(DEFAULT_VENUE_TERMS);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // Booking session countdown timer (8 minutes = 480 seconds)
  const [bookingTimeRemaining, setBookingTimeRemaining] = useState(480);
  const [theaterCancellation, setTheaterCancellation] = useState({
    allowCancellation: false,
    cancellationCutoffHours: 2,
    refundPercentage: 75,
  });

  useEffect(() => {
    if (!isCheckoutOpen || bookingConfirmed) return;
    const interval = setInterval(() => {
      setBookingTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckoutOpen, bookingConfirmed]);

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
  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("publicUser"));
      return u?.phone || u?.mobile || "";
    } catch {
      return "";
    }
  });
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isBookingChargeExpanded, setIsBookingChargeExpanded] = useState(false);
  const [isOrderAmountExpanded, setIsOrderAmountExpanded] = useState(false);
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

  // Fetch Theater Online F&B Facility & Active Menu
  useEffect(() => {
    const fetchTheaterFBSettings = async () => {
      const candidateIds = [
        showtime?.theater?.id,
        showtime?.theaterId,
        showtime?.theaterPortalId,
        showtime?.theater?.theaterPortal?.id,
        currentTheaterId,
        localStorage.getItem("portalId"),
        localStorage.getItem("userPortalId"),
      ].filter(Boolean);

      // 1. Check local storage across candidate IDs
      let localVal = null;
      for (const cid of candidateIds) {
        const item = localStorage.getItem(`theater_online_fb_enabled_${cid}`);
        if (item !== null) {
          localVal = item === "true";
          break;
        }
      }
      if (localVal === null) {
        const latestGlobal = localStorage.getItem("theater_online_fb_enabled_latest") || localStorage.getItem("theater_online_fb_enabled_global");
        if (latestGlobal !== null) {
          localVal = latestGlobal === "true";
        }
      }

      // 2. Fetch from backend portal profile API
      let apiVal = null;
      for (const cid of candidateIds) {
        try {
          const profileRes = await api.get(`/theater/portal-profile/${cid}`);
          if (profileRes.data && profileRes.data.enableOnlineFoodBooking !== undefined) {
            apiVal = Boolean(profileRes.data.enableOnlineFoodBooking);
            break;
          }
        } catch (e) {
          // ignore
        }
      }

      // 3. Resolve status: API > Local > showtime.theater.enableOnlineFoodBooking > default FALSE
      let isEnabled = false;
      if (apiVal !== null) {
        isEnabled = apiVal;
      } else if (localVal !== null) {
        isEnabled = localVal;
      } else if (showtime?.theater?.enableOnlineFoodBooking !== undefined) {
        isEnabled = Boolean(showtime.theater.enableOnlineFoodBooking);
      } else {
        isEnabled = false; // Strictly default to false so disabled option is respected
      }

      setTheaterOnlineFoodEnabled(isEnabled);

      // Check extended theater settings (inSeatDelivery, concessionGSTRate, minOrderForDelivery, termsAndConditions)
      let resolvedInSeat = true;
      let resolvedGstRate = 5;
      let resolvedMinOrder = 100;
      let resolvedTerms = DEFAULT_VENUE_TERMS;
      for (const cid of candidateIds) {
        const settingsStr = localStorage.getItem(`theater_settings_${cid}`) || localStorage.getItem("theater_settings");
        if (settingsStr) {
          try {
            const parsed = JSON.parse(settingsStr);
            if (parsed.inSeatDelivery !== undefined) resolvedInSeat = Boolean(parsed.inSeatDelivery);
            if (parsed.concessionGSTRate !== undefined && !isNaN(Number(parsed.concessionGSTRate))) resolvedGstRate = Number(parsed.concessionGSTRate);
            if (parsed.minOrderForDelivery !== undefined && !isNaN(Number(parsed.minOrderForDelivery))) resolvedMinOrder = Number(parsed.minOrderForDelivery);
            if (parsed.enableOnlineFoodBooking !== undefined && apiVal === null && localVal === null) {
              isEnabled = Boolean(parsed.enableOnlineFoodBooking);
            }
            if (parsed.termsAndConditions) {
              const list = typeof parsed.termsAndConditions === "string"
                ? parsed.termsAndConditions.split("\n").map((s) => s.trim()).filter(Boolean)
                : Array.isArray(parsed.termsAndConditions) ? parsed.termsAndConditions : DEFAULT_VENUE_TERMS;
              if (list.length > 0) resolvedTerms = list;
            }
            if (parsed.allowCancellation !== undefined) {
              setTheaterCancellation({
                allowCancellation: Boolean(parsed.allowCancellation),
                cancellationCutoffHours: Number(parsed.cancellationCutoffHours || 2),
                refundPercentage: Number(parsed.refundPercentage || 75),
              });
            }
            if (parsed.maxTicketsPerBooking !== undefined && !isNaN(Number(parsed.maxTicketsPerBooking))) {
              setMaxSeatsAllowed(Math.max(1, Math.min(10, Number(parsed.maxTicketsPerBooking))));
            }
            break;
          } catch (e) {}
        }
      }
      setInSeatDeliveryEnabled(resolvedInSeat);
      setConcessionGSTRate(resolvedGstRate);
      setMinOrderForDelivery(resolvedMinOrder);
      setTheaterTerms(resolvedTerms);

      // 4. If facility is enabled, fetch active items
      if (isEnabled) {
        try {
          let foundItems = null;
          for (const cid of candidateIds) {
            try {
              const menuRes = await api.get(`/fb/menu/${cid}`);
              if (Array.isArray(menuRes.data) && menuRes.data.length > 0) {
                foundItems = menuRes.data.filter((item) => item.isAvailable !== false);
                break;
              }
            } catch (err) {}
          }
          setAvailableSnacks(foundItems && foundItems.length > 0 ? foundItems : DEFAULT_FALLBACK_SNACKS);
        } catch (e) {
          setAvailableSnacks(DEFAULT_FALLBACK_SNACKS);
        }
      } else {
        setAvailableSnacks([]);
        setSelectedSnacks({});
        setIsSnackModalOpen(false);
      }
    };

    fetchTheaterFBSettings();

    const handleToggleEvent = (e) => {
      if (e?.detail?.enabled !== undefined) {
        const en = Boolean(e.detail.enabled);
        setTheaterOnlineFoodEnabled(en);
        if (!en) {
          setIsSnackModalOpen(false);
          setAvailableSnacks([]);
          setSelectedSnacks({});
        }
      } else {
        fetchTheaterFBSettings();
      }
    };

    window.addEventListener("theater_online_fb_changed", handleToggleEvent);
    window.addEventListener("theater_online_fb_status_update", handleToggleEvent);
    return () => {
      window.removeEventListener("theater_online_fb_changed", handleToggleEvent);
      window.removeEventListener("theater_online_fb_status_update", handleToggleEvent);
    };
  }, [currentTheaterId, showtime?.id]);

  // Clear selected seats & snacks when showtime changes
  useEffect(() => {
    setSelectedSeats([]);
    setSelectedSnacks({});
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
                booked[`${showtimeContextKey}-${rawSec.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${seatN}`] = true;
              }
            }
          });
        }
      });
    } catch (e) {}

    setBookedSeats(booked);
  };

  // Seat Click handler:
  // 1. Initial pick when no seats selected -> automatically selects contiguous seats in that row.
  // 2. Clicking any already selected seat -> deselects ONLY that individual seat.
  // 3. When partially selected (< targetSeatCount) -> user can freely click ANY seat anywhere (zig-zag, different row).
  // 4. When target limit reached -> clicking a new seat replaces within limit or picks a new block.
  const handleSeatClick = (seatObj, rowAvailableSeats = []) => {
    if (isDragging) return;
    const isAlreadySelected = selectedSeats.some((s) => s.key === seatObj.key);

    // 1. If clicking an already selected seat, ALWAYS deselect ONLY this single seat!
    // This allows the user to unselect any seat and pick their own wish (zig-zag / anywhere).
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.key !== seatObj.key));
      return;
    }

    // 2. If target is 1 seat, simply select this single seat (replacing any previous)
    if (targetSeatCount === 1) {
      setSelectedSeats([seatObj]);
      return;
    }

    // 3. FIRST TIME SELECTION (when no seats currently selected):
    // Automatically select contiguous seats in the row to save time for standard bookings.
    if (selectedSeats.length === 0 && targetSeatCount > 1) {
      if (rowAvailableSeats && rowAvailableSeats.length > 0) {
        const seatIndex = rowAvailableSeats.findIndex((s) => s.key === seatObj.key);
        if (seatIndex !== -1) {
          const isContiguous = (slice) => {
            if (slice.length < targetSeatCount) return false;
            for (let i = 0; i < slice.length - 1; i++) {
              const numA = parseInt(slice[i].num.replace(/\D/g, ""), 10);
              const numB = parseInt(slice[i + 1].num.replace(/\D/g, ""), 10);
              if (isNaN(numA) || isNaN(numB) || numB !== numA + 1) return false;
            }
            return true;
          };

          // Look for a contiguous window of size targetSeatCount containing seatIndex
          let candidate = null;
          for (let offset = 0; offset < targetSeatCount; offset++) {
            const start = seatIndex - offset;
            const end = start + targetSeatCount;
            if (start >= 0 && end <= rowAvailableSeats.length) {
              const slice = rowAvailableSeats.slice(start, end);
              if (isContiguous(slice)) {
                candidate = slice;
                break;
              }
            }
          }

          if (candidate && candidate.length === targetSeatCount) {
            setSelectedSeats(candidate);
            return;
          }
        }
      }

      // If contiguous group can't be found in this row, start with this single seat
      setSelectedSeats([seatObj]);
      return;
    }

    // 4. CUSTOM / ZIG-ZAG SELECTION (when user has already selected 1 or more seats, but < targetSeatCount):
    // Allow user to freely pick any available seat anywhere (different row, zig-zag, separate).
    if (selectedSeats.length < targetSeatCount) {
      setSelectedSeats([...selectedSeats, seatObj]);
      return;
    }

    // 5. IF TARGET SEAT COUNT IS ALREADY REACHED:
    // If the user clicks a new seat, check if they want a new contiguous block in this row,
    // otherwise replace the last seat with this new seat so limit is never exceeded.
    if (rowAvailableSeats && rowAvailableSeats.length > 0) {
      const seatIndex = rowAvailableSeats.findIndex((s) => s.key === seatObj.key);
      if (seatIndex !== -1) {
        const isContiguous = (slice) => {
          if (slice.length < targetSeatCount) return false;
          for (let i = 0; i < slice.length - 1; i++) {
            const numA = parseInt(slice[i].num.replace(/\D/g, ""), 10);
            const numB = parseInt(slice[i + 1].num.replace(/\D/g, ""), 10);
            if (isNaN(numA) || isNaN(numB) || numB !== numA + 1) return false;
          }
          return true;
        };

        let candidate = null;
        for (let offset = 0; offset < targetSeatCount; offset++) {
          const start = seatIndex - offset;
          const end = start + targetSeatCount;
          if (start >= 0 && end <= rowAvailableSeats.length) {
            const slice = rowAvailableSeats.slice(start, end);
            if (isContiguous(slice)) {
              candidate = slice;
              break;
            }
          }
        }

        if (candidate && candidate.length === targetSeatCount) {
          setSelectedSeats(candidate);
          return;
        }
      }
    }

    // Fallback: replace the last selected seat with the new seat so limit is strictly respected
    setSelectedSeats([...selectedSeats.slice(0, targetSeatCount - 1), seatObj]);
  };

  // Snack helper functions
  const handleUpdateSnackQty = (snackItem, delta) => {
    setSelectedSnacks((prev) => {
      const currentQty = prev[snackItem.id]?.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);
      if (nextQty === 0) {
        const next = { ...prev };
        delete next[snackItem.id];
        return next;
      }
      return {
        ...prev,
        [snackItem.id]: {
          item: snackItem,
          quantity: nextQty,
        },
      };
    });
  };

  const snackTotal = useMemo(() => {
    return Object.values(selectedSnacks).reduce((sum, entry) => {
      return sum + (Number(entry.item.price || 0) * entry.quantity);
    }, 0);
  }, [selectedSnacks]);

  const snackItemsCount = useMemo(() => {
    return Object.values(selectedSnacks).reduce((sum, entry) => sum + entry.quantity, 0);
  }, [selectedSnacks]);

  // Pricing calculations
  const subtotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selectedSeats]);

  // Nominal Internet Convenience Fee & GST (Standard Indian Cinema Structure)
  // Convenience fee charged ONLY on tickets (₹20 per seat), NOT on Food & Beverages
  const convenienceFee = selectedSeats.length > 0 ? selectedSeats.length * 20 : 0; // ₹20 per ticket
  const convenienceFeeGst = Number((convenienceFee * 0.18).toFixed(2)); // 18% GST on convenience fee

  // Food & Beverage menu prices are All-Inclusive (inclusive of statutory taxes).
  // No extra F&B taxes added on top at checkout.
  // Back-office 5% GST component extracted for accounting:
  const snackIncludedGst = useMemo(() => {
    if (snackTotal <= 0) return 0;
    return Number(((snackTotal * 5) / 105).toFixed(2));
  }, [snackTotal]);

  const gstAmount = convenienceFeeGst; // Only platform convenience GST added as external fee
  const grandTotal = Number((subtotal + snackTotal + convenienceFee + convenienceFeeGst).toFixed(2));

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
        theaterPortalId: showtime?.theater?.theaterPortal?.id || showtime?.theaterPortalId || localStorage.getItem("portalId") || 2,
        portalId: showtime?.theater?.theaterPortal?.id || showtime?.theaterPortalId || localStorage.getItem("portalId") || 2,
        snacks: Object.values(selectedSnacks).map((s) => ({
          id: s.item.id,
          name: s.item.name,
          category: s.item.category,
          price: s.item.price,
          quantity: s.quantity,
          subtotal: Number(s.item.price || 0) * s.quantity,
        })),
        snackTotal: snackTotal,
        snackGstAmount: snackIncludedGst,
        snackCount: snackItemsCount,
        deliveryMode: snackItemsCount > 0 ? deliveryMode : null,
        deliveryLocation: snackItemsCount > 0 
          ? (deliveryMode === "IN_SEAT" ? `Seat ${selectedSeats.map((s) => s.num).join(", ")}` : "Express Counter Pickup") 
          : null,
        concessionGSTRate: concessionGSTRate,
        convenienceFee: convenienceFee,
        convenienceFeeGst: convenienceFeeGst,
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

        // If snacks were pre-ordered, post to F&B order management
        if (snackItemsCount > 0) {
          try {
            const validSnackItems = Object.values(selectedSnacks)
              .filter((s) => !isNaN(Number(s.item.id)))
              .map((s) => ({
                menuItemId: Number(s.item.id),
                quantity: s.quantity,
                modifiers: `Ticket #${bookingId} • ${deliveryMode === "IN_SEAT" ? "In-Seat Delivery" : "Counter Pickup"}`,
              }));

            if (validSnackItems.length > 0) {
              await api.post("/fb/orders", {
                theaterId: Number(showtime?.theater?.id || showtime?.theaterPortalId || localStorage.getItem("portalId") || 2),
                paymentMode: paymentMode,
                deliveryLocation: deliveryMode === "IN_SEAT" ? `Seat ${selectedSeats.map((s) => s.num).join(", ")}` : "Express Counter Pickup",
                source: "ONLINE_TICKET_BUNDLE",
                totalAmount: Number(snackTotal.toFixed(2)),
                items: validSnackItems,
              }).catch((e) => console.warn("FB order sync notice:", e));
            }
          } catch (e) {
            // non-blocking
          }
        }
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
        snacks: Object.values(selectedSnacks).map((s) => ({
          name: s.item.name,
          quantity: s.quantity,
          price: s.item.price,
        })),
        snackTotal: snackTotal,
        snackGstAmount: snackIncludedGst,
        deliveryMode: snackItemsCount > 0 ? deliveryMode : null,
        deliveryLocation: snackItemsCount > 0 
          ? (deliveryMode === "IN_SEAT" ? `Seat ${selectedSeats.map((s) => s.num).join(", ")}` : "Express Counter Pickup") 
          : null,
      });

      setIsCheckoutOpen(false);
      setIsSnackModalOpen(false);
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

  const renderTermsModal = () => {
    if (!isTermsModalOpen) return null;
    return (
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", zIndex: 2200 }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "460px" }}>
          <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
            <div 
              className="modal-header px-3.5 py-2.5 border-bottom d-flex align-items-center justify-content-between"
              style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}
            >
              <div>
                <h6 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0 text-white" style={{ fontSize: "15px" }}>
                  <BsShieldCheck className="text-warning" /> Terms & Conditions
                </h6>
                <div className="text-white-50 mt-0.5" style={{ fontSize: "11px" }}>
                  {showtime?.portalName || showtime?.theaterName || "Cinema Venue"} • House Rules
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setIsTermsModalOpen(false)}
              />
            </div>

            <div className="modal-body p-3">
              <div className="p-2.5 rounded-3 mb-2.5 d-flex align-items-center gap-2" style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a" }}>
                <BsInfoCircle className="text-warning-emphasis flex-shrink-0" size={15} />
                <span className="text-dark small" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  Please review <strong>{showtime?.portalName || showtime?.theaterName || "the theater"}</strong>&apos;s house rules before proceeding.
                </span>
              </div>

              <div 
                className="d-flex flex-column gap-2.5 px-1 py-1" 
                style={{ 
                  maxHeight: "220px", 
                  overflowY: "auto",
                  scrollbarWidth: "thin"
                }}
              >
                {theaterTerms.map((term, idx) => (
                  <div 
                    key={idx} 
                    className="d-flex align-items-start gap-2 text-dark"
                    style={{ fontSize: "12.5px", lineHeight: "1.5" }}
                  >
                    <span className="text-primary fw-bold flex-shrink-0" style={{ fontSize: "18px", lineHeight: "1" }}>•</span>
                    <span>{term}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer bg-light border-top px-3.5 py-2.5 d-flex align-items-center justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-3.5 py-1.5 fw-semibold small"
                onClick={() => setIsTermsModalOpen(false)}
              >
                Go Back
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                onClick={() => {
                  setHasAgreedToTerms(true);
                  setIsTermsModalOpen(false);
                  setIsCheckoutOpen(true);
                }}
              >
                <BsCheckCircleFill size={14} /> Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // "How Many Seats?" Initial Prompt Modal (Matching BookMyShow / District)
  const renderSeatCountModal = () => {
    if (!isSeatCountModalOpen || isCheckoutOpen || bookingConfirmed) return null;

    return (
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 2200 }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "460px" }}>
          <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
            {/* Header */}
            <div className="modal-header border-0 pb-0 pt-3.5 px-4 d-flex align-items-center justify-content-between">
              <div>
                <span
                  className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-0.5 rounded-pill text-uppercase"
                  style={{ fontSize: "10px", letterSpacing: "0.5px" }}
                >
                  Seat Selection
                </span>
                <h5 className="modal-title fw-bold text-dark mt-1" style={{ fontSize: "19px" }}>
                  How Many Seats?
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsSeatCountModalOpen(false)}
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body px-4 py-3 text-center">
              {/* Number Pills from 1 to maxSeatsAllowed */}
              <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap my-3">
                {Array.from({ length: maxSeatsAllowed }).map((_, idx) => {
                  const num = idx + 1;
                  const isSelected = targetSeatCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setTargetSeatCount(num);
                        setSelectedSeats([]); // clear selections so customer gets fresh contiguous pick
                      }}
                      className={`btn rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${
                        isSelected
                          ? "btn-primary text-white shadow-xs"
                          : "btn-outline-secondary bg-white text-dark border"
                      }`}
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "14px",
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                        borderWidth: isSelected ? "2px" : "1px",
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Tier Prices Summary - Modern Horizontal Cards */}
              {layout?.sections && layout.sections.length > 0 && (
                <div className="mt-3.5 mb-1 text-start">
                  <div
                    className="text-muted fw-bold text-uppercase mb-2 text-center"
                    style={{ fontSize: "10.5px", letterSpacing: "0.6px" }}
                  >
                    Available Classes & Pricing
                  </div>
                  <div className="row g-2 justify-content-center">
                    {layout.sections.map((sec) => {
                      const price = getSectionPrice(sec.name, showtime?.classPrices);
                      const colSize =
                        layout.sections.length === 1 ? "12" : layout.sections.length === 2 ? "6" : layout.sections.length === 3 ? "4" : "6";
                      return (
                        <div key={sec.id || sec.name} className={`col-${colSize}`}>
                          <div
                            className="p-2.5 rounded-3 border text-center transition-all h-100 d-flex flex-column justify-content-between"
                            style={{
                              backgroundColor: "#f8fafc",
                              borderColor: "#e2e8f0",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                            }}
                          >
                            {/* Class Name */}
                            <div
                              className="text-uppercase fw-bold text-truncate mb-1"
                              style={{
                                fontSize: "11px",
                                letterSpacing: "0.4px",
                                color: "#64748b",
                              }}
                              title={sec.name}
                            >
                              {sec.name}
                            </div>

                            {/* Price */}
                            <div
                              className="fw-bolder text-dark my-0.5"
                              style={{ fontSize: "16px", letterSpacing: "-0.2px", lineHeight: 1.2 }}
                            >
                              ₹{price}
                            </div>

                            {/* Status badge */}
                            <div className="d-flex align-items-center justify-content-center gap-1 mt-1">
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: "#10b981",
                                  display: "inline-block",
                                }}
                              />
                              <span
                                className="fw-semibold"
                                style={{ fontSize: "10px", color: "#059669", letterSpacing: "0.3px" }}
                              >
                                AVAILABLE
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Button */}
            <div className="modal-footer border-0 px-4 pb-3.5 pt-1">
              <button
                type="button"
                className="btn btn-primary w-100 py-2.5 rounded-pill fw-bold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => setIsSeatCountModalOpen(false)}
              >
                <span>Select {targetSeatCount} {targetSeatCount === 1 ? "Seat" : "Seats"}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!movie || !showtime) return null;

  // VIEW STEP 3: SUCCESSFUL BOOKING CONFIRMATION & M-TICKET PASS
  if (bookingConfirmed) {
    return (
      <div className="booking-confirmed-page bg-light min-vh-100 py-4 py-md-5 d-flex align-items-center justify-content-center">
        <div className="container" style={{ maxWidth: "560px" }}>
          <div className="card rounded-4 border-0 shadow-lg overflow-hidden bg-white text-dark">
            <div ref={ticketCardRef} className="bg-white">
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

                {/* Pre-Ordered Snacks (If Any) */}
                {bookingConfirmed.snacks && bookingConfirmed.snacks.length > 0 && (
                  <div 
                    className="p-3 rounded-3 border mb-3" 
                    style={{ 
                      backgroundColor: bookingConfirmed.deliveryMode === "IN_SEAT" ? "#f0fdf4" : "#fffbeb", 
                      borderColor: bookingConfirmed.deliveryMode === "IN_SEAT" ? "#bbf7d0" : "#fde68a", 
                      borderLeft: bookingConfirmed.deliveryMode === "IN_SEAT" ? "4px solid #16a34a" : "4px solid #f59e0b" 
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                        🍿 Pre-Ordered Refreshments
                      </span>
                      <div className="d-flex align-items-center gap-1.5">
                        {bookingConfirmed.deliveryMode === "IN_SEAT" ? (
                          <span className="badge bg-success text-white fw-bold px-2 py-1" style={{ fontSize: "11px" }}>
                            💺 In-Seat Delivery
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: "11px" }}>
                            🥤 Express Counter Pickup
                          </span>
                        )}
                        <span className="badge bg-dark text-white fw-bold px-2 py-1" style={{ fontSize: "11px" }}>
                          Paid ₹{bookingConfirmed.snackTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-1.5 mb-2.5">
                      {bookingConfirmed.snacks.map((snk, idx) => (
                        <span key={idx} className="badge bg-white text-dark border px-2.5 py-1 shadow-xs fw-semibold">
                          {snk.quantity}x {snk.name}
                        </span>
                      ))}
                    </div>
                    {bookingConfirmed.deliveryMode === "IN_SEAT" ? (
                      <div className="d-flex align-items-center gap-2 p-2 rounded bg-white border border-success-subtle text-success small" style={{ fontSize: "12px" }}>
                        <span className="fs-6">💺</span>
                        <div>
                          <strong>In-Seat Delivery:</strong> Cinema ushers will bring your refreshments directly to Seat <strong>{bookingConfirmed.seats.join(", ")}</strong> during interval!
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-2 p-2 rounded bg-white border border-warning-subtle text-dark small" style={{ fontSize: "12px" }}>
                        <span className="fs-6">🥤</span>
                        <div>
                          <strong>Express Counter Pickup:</strong> Show this digital ticket at the snack counter during intermission for priority order collection!
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
            </div>

            <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between flex-wrap gap-2">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-success rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={handleDownloadTicketPdf}
                  disabled={isDownloadingTicket}
                >
                  <BsDownload size={14} /> {isDownloadingTicket ? "Downloading..." : "Download Ticket"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <BsPrinter size={14} /> Print
                </button>
              </div>
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
    );
  }

  // VIEW STEP 2: DEDICATED FULL-PAGE "REVIEW YOUR BOOKING" (Matching District/Zomato style in Image 2)
  if (isCheckoutOpen) {
    const timerMins = Math.floor(bookingTimeRemaining / 60);
    const timerSecs = String(bookingTimeRemaining % 60).padStart(2, "0");
    const posterImage = movie?.posterUrl || movie?.poster || showtime?.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80";

    return (
      <div className="review-booking-page pb-5" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
        {/* TOP BRAND & TITLE NAVBAR */}
        <header className="bg-white border-bottom shadow-xs py-3 px-4 position-relative">
          <div className="container-fluid px-lg-5 d-flex align-items-center justify-content-between">
            {/* Left: Back Arrow */}
            <div className="d-flex align-items-center">
              <button
                type="button"
                className="btn btn-link text-dark p-0 d-flex align-items-center gap-2 text-decoration-none fw-semibold"
                onClick={() => setIsCheckoutOpen(false)}
                title="Return to Seat Map"
              >
                <BsArrowLeft size={18} />
                <span className="small fw-bold">Back to Seats</span>
              </button>
            </div>

            {/* Center Title */}
            <h5 className="mb-0 fw-bold text-dark text-center" style={{ fontSize: "18px" }}>
              Review your booking
            </h5>

            {/* Right: User Avatar Circle */}
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle bg-dark text-white fw-bold d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: "36px", height: "36px", fontSize: "14px" }}
              >
                {(customerName || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* LAVENDER COUNTDOWN BANNER (Matching Image 2) */}
        <div 
          className="text-center py-2 px-3 fw-semibold small"
          style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", fontSize: "13px" }}
        >
          Complete your booking in <strong className="text-primary fw-bolder">{timerMins}:{timerSecs}</strong> mins
        </div>

        {/* MAIN TWO-COLUMN CONTENT CONTAINER */}
        <main className="container py-4" style={{ maxWidth: "1120px" }}>
          <div className="row g-4">
            {/* LEFT COLUMN: MOVIE, SEATS, SNACKS, CANCELLATION */}
            <div className="col-12 col-lg-7">
              {/* 1. Movie Information Card */}
              <div className="bg-white rounded-4 border p-4 shadow-xs mb-3">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <h4 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: "21px", letterSpacing: "-0.3px" }}>
                      {movie.title}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap text-secondary small mb-2">
                      <span className="badge bg-light text-dark border px-2 py-0.5 rounded font-monospace">
                        UA13+
                      </span>
                      <span>•</span>
                      <span>{movie.language || "Tamil"}</span>
                      <span>•</span>
                      <span>{showtime.screenTech || "2D"}</span>
                      <span>•</span>
                      <span>Dolby Atmos</span>
                    </div>
                    <div className="text-secondary small">
                      {showtime.portalName || showtime.theaterName || "Cinema Hall"} ({showtime.screen?.screenName || "Screen 1"}) • Mount Road, Chennai
                    </div>
                  </div>

                  {/* Movie Poster Thumbnail */}
                  <img
                    src={posterImage}
                    alt={movie.title}
                    className="rounded-3 shadow-xs flex-shrink-0"
                    style={{ width: "68px", height: "92px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80";
                    }}
                  />
                </div>

                <hr className="my-3 text-secondary opacity-15" />

                <div className="text-secondary small">
                  <div className="fw-bold text-dark mb-0.5">
                    {formatIndianDate(showtime.showDate)}
                  </div>
                  <div className="text-muted">
                    {formatIndianTime(showtime.startTime)} onwards (approx 2 hrs 30 mins)
                  </div>
                </div>
              </div>

              {/* 2. Tickets & Cancellation Summary Card */}
              <div className="bg-white rounded-4 border p-4 shadow-xs mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark fs-6">
                    {selectedSeats.length} ticket{selectedSeats.length > 1 ? "s" : ""}
                  </span>
                  <span className="fw-bold text-dark fs-6">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-secondary small mb-1">
                  {selectedSeats[0]?.section || "Standard"} - {selectedSeats.map((s) => s.num).join(", ")}
                </div>
                <div className="text-muted text-uppercase mb-3" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  {(showtime.portalName || showtime.theaterName || "CINEMA").toUpperCase()}
                </div>

                {/* Cancellation Policy Pill */}
                <div 
                  className="p-2.5 rounded-3 border d-flex align-items-center gap-2 small"
                  style={{ backgroundColor: "#f8fafc", color: "#64748b" }}
                >
                  {theaterCancellation.allowCancellation ? (
                    <>
                      <BsCheckCircleFill className="text-success flex-shrink-0" />
                      <span>
                        Cancellation available up to {theaterCancellation.cancellationCutoffHours}h before showtime ({theaterCancellation.refundPercentage}% refund).
                      </span>
                    </>
                  ) : (
                    <>
                      <BsSlashCircle className="text-secondary flex-shrink-0" />
                      <span>Cancellation is unavailable for this booking</span>
                    </>
                  )}
                </div>
              </div>

              {/* 3. Pre-Ordered Snacks (If Any) */}
              {snackTotal > 0 && (
                <div className="bg-white rounded-4 border p-4 shadow-xs mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-1.5">
                      🍿 Refreshments ({snackItemsCount} items)
                    </span>
                    <span className="fw-bold text-dark fs-6">
                      ₹{snackTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-secondary small mb-3">
                    {Object.values(selectedSnacks).map((s) => `${s.quantity}x ${s.item.name}`).join(", ")}
                  </div>

                  {/* Delivery Mode Toggle */}
                  <div className="pt-2.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="small fw-semibold text-dark">Delivery Preference:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${deliveryMode === "COUNTER" ? "btn-warning text-dark fw-bold" : "btn-outline-secondary bg-white text-dark"}`}
                        onClick={() => setDeliveryMode("COUNTER")}
                        style={{ fontSize: "11px" }}
                      >
                        🥤 Counter Pickup
                      </button>
                      <button
                        type="button"
                        disabled={!inSeatDeliveryEnabled || snackTotal < minOrderForDelivery}
                        className={`btn ${deliveryMode === "IN_SEAT" ? "btn-warning text-dark fw-bold" : "btn-outline-secondary bg-white text-dark"}`}
                        onClick={() => setDeliveryMode("IN_SEAT")}
                        style={{ fontSize: "11px" }}
                      >
                        💺 In-Seat Delivery
                      </button>
                    </div>
                  </div>

                  <div className="text-muted mt-1.5" style={{ fontSize: "11px" }}>
                    {deliveryMode === "IN_SEAT" ? (
                      <span className="text-success fw-semibold">
                        ✓ Cinema ushers deliver to Seat <strong>{selectedSeats.map((s) => s.num).join(", ")}</strong> at intermission
                      </span>
                    ) : (
                      <span>Express counter pickup with ticket token at interval snack counter</span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Terms & Conditions Verified Note */}
              <div className="bg-white rounded-4 border p-3 shadow-xs d-flex align-items-center justify-content-between small">
                <div className="d-flex align-items-center gap-2 text-success fw-semibold">
                  <BsCheck2Circle size={17} />
                  <span>Agreed to Venue House Rules ({showtime.portalName || "Theater"})</span>
                </div>
                <button
                  type="button"
                  className="btn btn-link text-primary p-0 text-decoration-none fw-semibold small"
                  onClick={() => setIsTermsModalOpen(true)}
                >
                  View Rules &gt;
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: PAYMENT SUMMARY & CHECKOUT */}
            <div className="col-12 col-lg-5">
              {/* Payment Summary Card */}
              <div className="bg-white rounded-4 border p-4 shadow-xs mb-3">
                <h6 className="fw-bolder text-dark mb-3" style={{ fontSize: "16px" }}>
                  Payment summary
                </h6>

                {/* Order Amount with Down Arrow Expansion */}
                <div className="mb-2">
                  <div
                    className="d-flex justify-content-between align-items-center small py-1 px-1 rounded-2 transition-all"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => setIsOrderAmountExpanded(!isOrderAmountExpanded)}
                    title="Click to view ticket breakdown"
                  >
                    <span className="text-secondary d-flex align-items-center gap-1.5">
                      Order amount
                      <BsChevronDown
                        size={11}
                        className="text-muted"
                        style={{
                          transform: isOrderAmountExpanded ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease"
                        }}
                      />
                    </span>
                    <span className="fw-semibold text-dark">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {isOrderAmountExpanded && (
                    <div className="py-1 px-2.5 my-1 rounded-2 border-start border-2 border-primary bg-light" style={{ fontSize: "11px", color: "#475569" }}>
                      <div className="d-flex justify-content-between align-items-center py-0.5">
                        <span>Base Ticket Price ({selectedSeats.length} ticket{selectedSeats.length > 1 ? "s" : ""})</span>
                        <span className="fw-semibold text-dark">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: "10px" }}>
                        Seats: {selectedSeats.map(s => s.num).join(", ")} ({selectedSeats[0]?.section || "Standard"})
                      </div>
                    </div>
                  )}
                </div>

                {snackTotal > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-2 small py-1 px-1">
                    <span className="text-secondary">
                      Snacks & Refreshments (incl. taxes)
                    </span>
                    <span className="fw-semibold text-dark">₹{snackTotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Convenience Fee / Booking Charge with Down Arrow Expansion */}
                <div className="mb-3">
                  <div
                    className="d-flex justify-content-between align-items-center small py-1 px-1 rounded-2 transition-all"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => setIsBookingChargeExpanded(!isBookingChargeExpanded)}
                    title="Click to view convenience fee and GST breakdown"
                  >
                    <span className="text-secondary d-flex align-items-center gap-1.5">
                      Booking charge (incl. of GST)
                      <BsChevronDown
                        size={11}
                        className="text-muted"
                        style={{
                          transform: isBookingChargeExpanded ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease"
                        }}
                      />
                    </span>
                    <span className="fw-semibold text-dark">₹{(convenienceFee + convenienceFeeGst).toFixed(2)}</span>
                  </div>

                  {isBookingChargeExpanded && (
                    <div className="py-1.5 px-2.5 my-1 rounded-2 border-start border-2 border-primary bg-light" style={{ fontSize: "11px", color: "#475569" }}>
                      <div className="d-flex justify-content-between align-items-center py-0.5">
                        <span>Base Convenience Fee (₹20 × {selectedSeats.length} ticket{selectedSeats.length > 1 ? "s" : ""})</span>
                        <span className="fw-semibold text-dark">₹{convenienceFee.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-0.5">
                        <span>Platform GST (18% on convenience fee)</span>
                        <span className="fw-semibold text-dark">₹{convenienceFeeGst.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="my-2.5 text-secondary opacity-15" />

                <div className="d-flex justify-content-between align-items-center pt-1">
                  <span className="fw-bold text-dark fs-6">To be paid</span>
                  <span className="fw-bolder text-dark fs-5">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Your Details Card (Matching Image 2) */}
              <div className="bg-white rounded-4 border p-4 shadow-xs mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bolder text-dark mb-0" style={{ fontSize: "16px" }}>
                    Your details
                  </h6>
                  {customerPhone ? (
                    <button
                      type="button"
                      className="btn btn-link text-primary p-0 text-decoration-none fw-semibold small"
                      onClick={() => setIsEditingDetails(!isEditingDetails)}
                    >
                      {isEditingDetails ? "Done" : "Edit"}
                    </button>
                  ) : (
                    <span className="text-muted small">SMS / WhatsApp M-Ticket</span>
                  )}
                </div>

                {!isEditingDetails && customerPhone.length >= 10 ? (
                  <div className="d-flex align-items-center gap-3 pt-1">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "42px", height: "42px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" }}
                    >
                      <BsPersonCircle size={24} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: "15px", letterSpacing: "0.2px" }}>
                        +91-{customerPhone}
                      </div>
                      <div className="text-secondary small">
                        {customerName ? `${customerName}` : "Guest"} {customerEmail ? `• ${customerEmail}` : "• Tamil Nadu"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <div className="mb-2.5">
                      <label className="form-label small fw-bold text-secondary mb-1">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="mb-2.5">
                      <label className="form-label small fw-bold text-secondary mb-1">
                        Mobile Number <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted small fw-semibold">+91</span>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="10-digit mobile number"
                          value={customerPhone}
                          maxLength={10}
                          onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-bold text-secondary mb-1">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="name@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>

                    {customerPhone.length === 10 && isEditingDetails && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 mt-1 fw-semibold"
                        onClick={() => setIsEditingDetails(false)}
                      >
                        Save Details
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Mode Selection */}
              <div className="bg-white rounded-4 border p-4 shadow-xs mb-3">
                <h6 className="fw-bolder text-dark mb-3" style={{ fontSize: "16px" }}>
                  Payment Method
                </h6>
                <div className="row g-2">
                  {[
                    { id: "UPI", label: "UPI / QR" },
                    { id: "CARD", label: "Card" },
                    { id: "COUNTER", label: "Counter Pay" },
                  ].map((mode) => (
                    <div key={mode.id} className="col-4">
                      <button
                        type="button"
                        className={`btn w-100 py-2 rounded-3 text-center fw-semibold small ${
                          paymentMode === mode.id
                            ? "btn-primary text-white shadow-xs"
                            : "btn-outline-secondary text-dark bg-white"
                        }`}
                        onClick={() => setPaymentMode(mode.id)}
                      >
                        {mode.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Black District/Zomato Style Pay Button (Matching Image 2) */}
              <button
                type="button"
                disabled={processingPayment}
                onClick={handleConfirmBooking}
                className="w-100 py-3 px-4 rounded-3 text-white d-flex align-items-center justify-content-between border-0 shadow-sm transition-all"
                style={{
                  backgroundColor: "#111827",
                  cursor: processingPayment ? "not-allowed" : "pointer",
                }}
              >
                <div className="text-start">
                  <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "0.2px" }}>
                    ₹{grandTotal.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.8px", opacity: 0.75 }}>
                    TOTAL
                  </div>
                </div>
                <div className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: "15px" }}>
                  {processingPayment ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay now</span>
                      <span style={{ fontSize: "18px" }}>&rarr;</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </main>

        {renderTermsModal()}
      </div>
    );
  }

  return (
    <div className="public-seat-selection pb-5" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
      {/* 1. TOP HEADER & MOVIE CONTEXT BAR */}
      <div className="sticky-top" style={{ zIndex: 110 }}>
        <div className="bg-white border-bottom shadow-sm py-2.5 px-4 position-relative">
          {/* Desktop Back Button (Far Left Edge) */}
          <button
            type="button"
            className="btn btn-outline-dark btn-sm d-none d-lg-flex align-items-center gap-2 rounded-3 px-3 fw-semibold transition-all position-absolute"
            onClick={onBack}
            style={{ left: "25px", top: "50%", transform: "translateY(-50%)", zIndex: 10 }}
          >
            <BsArrowLeft size={16} /> Back
          </button>

          <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
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

            <div className="ms-lg-5 ps-lg-3">
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

          <div className="d-flex align-items-center gap-3">
            {/* Seat Count Selector Pill Button */}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5 shadow-2xs"
              onClick={() => setIsSeatCountModalOpen(true)}
              title="Click to change number of tickets to book"
            >
              <BsTicketPerforated size={15} />
              <span>{targetSeatCount} {targetSeatCount > 1 ? "Seats" : "Seat"}</span>
              <span className="badge bg-primary bg-opacity-10 text-primary ms-0.5" style={{ fontSize: "10px" }}>Edit</span>
            </button>

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
          {/* FLOATING ZOOM CONTROLS (RIGHT SIDE - ICONS ONLY) */}
          <div
            className="position-absolute end-0 top-50 translate-middle-y me-3 d-flex flex-column gap-1.5 p-1 rounded-pill shadow-lg bg-white border"
            style={{
              zIndex: 40,
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(6px)",
            }}
          >
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center text-dark border-0 shadow-2xs"
              style={{ width: "36px", height: "36px" }}
              onClick={() => setZoomLevel((prev) => Math.min(2.2, +(prev + 0.15).toFixed(2)))}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <BsZoomIn size={16} />
            </button>

            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center text-dark border-0 shadow-2xs"
              style={{ width: "36px", height: "36px" }}
              onClick={() => setZoomLevel((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)))}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <BsZoomOut size={16} />
            </button>

            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center text-primary border-0 shadow-2xs"
              style={{ width: "36px", height: "36px" }}
              onClick={() => setZoomLevel(1)}
              title="Reset View"
              aria-label="Reset View"
            >
              <BsArrowCounterclockwise size={15} />
            </button>
          </div>

          {/* LOADING STATE */}
          {loadingLayout ? (
            <div className="py-5 text-center text-muted">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <div>Loading real hall seat layout...</div>
            </div>
          ) : (
            /* SECTIONS & SEATS ZOOMABLE VIEWPORT */
            <div
              ref={seatMapWrapperRef}
              className="overflow-auto pb-3 position-relative"
              style={{
                maxWidth: "100%",
                cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-x pan-y",
              }}
            >
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center top",
                  transition: isPinching || isDragging ? "none" : "transform 0.15s cubic-bezier(0.2, 0, 0, 1)",
                  minWidth: `${Math.max(100, Math.round(zoomLevel * 100))}%`,
                  paddingBottom: zoomLevel > 1 ? `${Math.round((zoomLevel - 1) * 350)}px` : "0px",
                  display: "inline-block",
                }}
              >
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

                        // Precalculate available seats in this row for intelligent contiguous auto-selection
                        const rowAvailableSeats = [];
                        let seatCounterForCalc = 1;
                        for (let c = 0; c < halfSeats; c++) {
                          const k1 = `${sec.id}-${rowLetter}-${c}`;
                          const k2 = `${sec.id}-${rIdx}-${c}`;
                          const isDel = Boolean(layout.deletedSeats?.[k1] || layout.deletedSeats?.[k2]);
                          if (!isDel) {
                            const sNum = `${rowLetter}${seatCounterForCalc++}`;
                            const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            const cSec = getCanonicalSection(sec.name || sec.id);
                            const isS = Boolean(
                              bookedSeats[`${showtimeId}-${k1}`] ||
                              bookedSeats[`${showtimeId}-${k2}`] ||
                              bookedSeats[`${showtimeId}-${sec.id}-${sNum}`] ||
                              bookedSeats[`${showtimeId}-${secClean}-${sNum}`] ||
                              bookedSeats[`${showtimeId}-${cSec}-${sNum}`] ||
                              bookedSeats[`${showtimeContextKey}-${k1}`] ||
                              bookedSeats[`${showtimeContextKey}-${k2}`] ||
                              bookedSeats[`${showtimeContextKey}-${sec.id}-${sNum}`] ||
                              bookedSeats[`${showtimeContextKey}-${secClean}-${sNum}`] ||
                              bookedSeats[`${showtimeContextKey}-${cSec}-${sNum}`]
                            );
                            if (!isS) {
                              rowAvailableSeats.push({
                                key: k1,
                                altKey: k2,
                                num: sNum,
                                section: sec.name,
                                price: secPrice,
                              });
                            }
                          }
                        }
                        for (let c = 0; c < seatsPerRow - halfSeats; c++) {
                          const actC = halfSeats + c;
                          const k1 = `${sec.id}-${rowLetter}-${actC}`;
                          const k2 = `${sec.id}-${rIdx}-${actC}`;
                          const isDel = Boolean(layout.deletedSeats?.[k1] || layout.deletedSeats?.[k2]);
                          if (!isDel) {
                            const sNum = `${rowLetter}${seatCounterForCalc++}`;
                            const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            const cSec = getCanonicalSection(sec.name || sec.id);
                            const isS = Boolean(
                              bookedSeats[`${showtimeId}-${k1}`] ||
                              bookedSeats[`${showtimeId}-${k2}`] ||
                              bookedSeats[`${showtimeId}-${sec.id}-${sNum}`] ||
                              bookedSeats[`${showtimeId}-${secClean}-${sNum}`] ||
                              bookedSeats[`${showtimeId}-${cSec}-${sNum}`] ||
                              bookedSeats[`${showtimeContextKey}-${k1}`] ||
                              bookedSeats[`${showtimeContextKey}-${k2}`] ||
                              bookedSeats[`${showtimeContextKey}-${sec.id}-${sNum}`] ||
                              bookedSeats[`${showtimeContextKey}-${secClean}-${sNum}`] ||
                              bookedSeats[`${showtimeContextKey}-${cSec}-${sNum}`]
                            );
                            if (!isS) {
                              rowAvailableSeats.push({
                                key: k1,
                                altKey: k2,
                                num: sNum,
                                section: sec.name,
                                price: secPrice,
                              });
                            }
                          }
                        }

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
                                  bookedSeats[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`]
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
                                      handleSeatClick(
                                        {
                                          key: seatKey,
                                          altKey: key2,
                                          num: seatNumDisplay,
                                          section: sec.name,
                                          price: secPrice,
                                        },
                                        rowAvailableSeats
                                      )
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
                                  bookedSeats[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`]
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
                                      handleSeatClick(
                                        {
                                          key: seatKey,
                                          altKey: key2,
                                          num: seatNumDisplay,
                                          section: sec.name,
                                          price: secPrice,
                                        },
                                        rowAvailableSeats
                                      )
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
          )}
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
                {selectedSeats.length === targetSeatCount ? (
                  <span className="text-success fw-bold">✓ {selectedSeats.length} of {targetSeatCount} Seats Selected</span>
                ) : (
                  <span>Selected {selectedSeats.length} of {targetSeatCount} Seats (Pick {targetSeatCount - selectedSeats.length} more anywhere)</span>
                )}
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
                onClick={() => {
                  if (theaterOnlineFoodEnabled && availableSnacks.length > 0) {
                    setIsSnackModalOpen(true);
                  } else if (!hasAgreedToTerms) {
                    setIsTermsModalOpen(true);
                  } else {
                    setIsCheckoutOpen(true);
                  }
                }}
              >
                <BsTicketPerforated size={18} /> Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.5 OPTIONAL ONLINE FOOD & BEVERAGES PRE-ORDER MODAL */}
      {isSnackModalOpen && theaterOnlineFoodEnabled && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 2100 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
              {/* Header */}
              <div 
                className="modal-header px-4 py-3 border-bottom d-flex align-items-center justify-content-between"
                style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}
              >
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0 text-white">
                    🍿 Add Food & Refreshments
                    <span className="badge bg-warning text-dark text-uppercase ms-1" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>Optional</span>
                  </h5>
                  <p className="small text-white-50 mb-0 mt-0.5">
                    Pre-order snacks for express counter pickup or in-seat delivery during interval
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-white border-white-50"
                  onClick={() => {
                    setIsSnackModalOpen(false);
                    if (!hasAgreedToTerms) {
                      setIsTermsModalOpen(true);
                    } else {
                      setIsCheckoutOpen(true);
                    }
                  }}
                  title="Skip refreshments and continue directly to payment"
                >
                  Skip Snacks &gt;
                </button>
              </div>

              {/* Category Pills & Item Cards */}
              <div className="modal-body p-3 p-md-4" style={{ maxHeight: "62vh", overflowY: "auto" }}>
                {/* Category Nav */}
                <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
                  {["All", "Popcorn", "Beverage", "Combo", "Snack", "Candy"].map((cat) => {
                    const count = cat === "All" ? availableSnacks.length : availableSnacks.filter(s => s.category?.toLowerCase() === cat.toLowerCase()).length;
                    if (count === 0 && cat !== "All") return null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold text-nowrap transition-all ${
                          selectedSnackCategory === cat
                            ? "btn-dark shadow-sm text-white"
                            : "btn-light text-secondary border"
                        }`}
                        onClick={() => setSelectedSnackCategory(cat)}
                      >
                        {cat === "All" && "🍿 "}
                        {cat === "Popcorn" && "🍿 "}
                        {cat === "Beverage" && "🥤 "}
                        {cat === "Combo" && "✨ "}
                        {cat === "Snack" && "🥨 "}
                        {cat === "Candy" && "🍫 "}
                        {cat} <span className="opacity-75 ms-1" style={{ fontSize: "11px" }}>({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Items Grid */}
                <div className="row g-3">
                  {availableSnacks
                    .filter((item) => selectedSnackCategory === "All" || item.category?.toLowerCase() === selectedSnackCategory.toLowerCase())
                    .map((item) => {
                      const qty = selectedSnacks[item.id]?.quantity || 0;
                      return (
                        <div key={item.id} className="col-12 col-sm-6">
                          <div 
                            className={`card h-100 border rounded-3 overflow-hidden shadow-xs ${
                              qty > 0 ? "border-primary bg-primary bg-opacity-10" : "border-light-subtle"
                            }`}
                          >
                            <div className="card-body p-3 d-flex gap-3 align-items-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="rounded-3 flex-shrink-0"
                                  style={{ width: "72px", height: "72px", objectFit: "cover" }}
                                />
                              ) : (
                                <div 
                                  className="rounded-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0 text-muted"
                                  style={{ width: "72px", height: "72px", fontSize: "28px" }}
                                >
                                  {item.category === "Beverage" ? "🥤" : item.category === "Popcorn" ? "🍿" : "🥨"}
                                </div>
                              )}

                              <div className="flex-grow-1 min-w-0">
                                <div className="d-flex align-items-center justify-content-between mb-0.5">
                                  <span className="badge bg-secondary bg-opacity-25 text-secondary border rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>
                                    {item.category || "Refreshment"}
                                  </span>
                                  <span className="fw-bolder text-dark fs-6">₹{item.price}</span>
                                </div>
                                <h6 className="fw-bold mb-1 text-truncate text-dark" title={item.name} style={{ fontSize: "14px" }}>
                                  {item.name}
                                </h6>
                                <p className="text-muted small mb-2 text-truncate" style={{ fontSize: "12px" }}>
                                  {item.description || "Fresh cinema refreshment"}
                                </p>

                                <div className="d-flex align-items-center justify-content-end">
                                  {qty > 0 ? (
                                    <div className="input-group input-group-sm w-auto rounded-pill overflow-hidden border border-primary shadow-xs">
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary px-2.5 py-1 border-0"
                                        onClick={() => handleUpdateSnackQty(item, -1)}
                                      >
                                        <BsDash size={14} />
                                      </button>
                                      <span className="input-group-text bg-white border-0 fw-bold px-3 py-1 text-primary">
                                        {qty}
                                      </span>
                                      <button
                                        type="button"
                                        className="btn btn-primary px-2.5 py-1 border-0"
                                        onClick={() => handleUpdateSnackQty(item, 1)}
                                      >
                                        <BsPlus size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1"
                                      onClick={() => handleUpdateSnackQty(item, 1)}
                                    >
                                      <BsPlus size={16} /> Add
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Delivery Preference Selector Bar */}
              {snackItemsCount > 0 && (
                <div className="px-4 py-2.5 bg-light border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="small fw-bold text-dark">Delivery Preference:</span>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${deliveryMode === "COUNTER" ? "btn-primary fw-bold" : "btn-outline-secondary bg-white text-dark"}`}
                        onClick={() => setDeliveryMode("COUNTER")}
                      >
                        🥤 Counter Pickup
                      </button>
                      <button
                        type="button"
                        disabled={!inSeatDeliveryEnabled || snackTotal < minOrderForDelivery}
                        className={`btn ${deliveryMode === "IN_SEAT" ? "btn-primary fw-bold" : "btn-outline-secondary bg-white text-dark"}`}
                        onClick={() => setDeliveryMode("IN_SEAT")}
                        title={
                          !inSeatDeliveryEnabled
                            ? "In-seat delivery service is currently not offered at this theater"
                            : snackTotal < minOrderForDelivery
                            ? `Min snack order of ₹${minOrderForDelivery} required for seat delivery`
                            : `Delivered to Seat ${selectedSeats.map(s => s.num).join(", ")} during interval`
                        }
                      >
                        💺 In-Seat Delivery
                      </button>
                    </div>
                  </div>
                  <div className="small text-muted" style={{ fontSize: "11px" }}>
                    {deliveryMode === "IN_SEAT" ? (
                      <span className="text-success fw-semibold">
                        ✓ Ushers deliver to Seat {selectedSeats.map((s) => s.num).join(", ")} at interval
                      </span>
                    ) : (
                      <span>Express counter pickup with digital token at interval</span>
                    )}
                    {snackTotal < minOrderForDelivery && inSeatDeliveryEnabled && (
                      <span className="text-muted ms-1">(Seat delivery min ₹{minOrderForDelivery})</span>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Sticky Footer */}
              <div className="modal-footer bg-light border-top px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="small text-muted fw-semibold">
                    {snackItemsCount > 0 ? (
                      <span className="text-dark fw-bold">
                        {snackItemsCount} snack{snackItemsCount > 1 ? "s" : ""} added (+₹{snackTotal.toFixed(2)})
                      </span>
                    ) : (
                      "No refreshments added yet"
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: "11px" }}>
                    Total (Tickets + Snacks): <strong className="text-primary fs-6">₹{grandTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-3.5 py-2 fw-semibold small"
                    onClick={() => {
                      setIsSnackModalOpen(false);
                      if (!hasAgreedToTerms) {
                        setIsTermsModalOpen(true);
                      } else {
                        setIsCheckoutOpen(true);
                      }
                    }}
                  >
                    Skip Snacks
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
                    onClick={() => {
                      setIsSnackModalOpen(false);
                      if (!hasAgreedToTerms) {
                        setIsTermsModalOpen(true);
                      } else {
                        setIsCheckoutOpen(true);
                      }
                    }}
                  >
                    Continue to Pay ₹{grandTotal.toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderSeatCountModal()}
      {renderTermsModal()}
    </div>
  );
}
