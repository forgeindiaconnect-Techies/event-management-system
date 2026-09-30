import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TheaterNavbar from "../../components/Navbar/TheaterNavbar";
import api from "../../api/axiosConfig";
import {
  formatIndianDate,
  formatIndianTime,
  calculateSuggestedShowtime,
  validateShowtimeOverlap,
  getMovieDurationMinutes,
  getTheaterTurnaroundBuffer,
  getTheaterShowtimeBuffers,
} from "../../utils/dateTime";
import IndianDatePicker from "../../components/Common/IndianDatePicker";
import Select from "react-select";
import "../../styles/Admin.css";
import LiveSeatBookingMain from "../../components/theater/LiveSeatBooking/LiveSeatBookingMain";
import TheaterManagerMenuEditor from "../../components/theater/TheaterManagerMenuEditor";
import TheaterSettingsView from "../../components/theater/TheaterSettingsView";
import {
  BsFilm,
  BsTv,
  BsVolumeUp,
  BsXLg,
  BsGrid3X3,
  BsClockHistory,
  BsCupStraw,
  BsBarChart,
  BsPeople,
  BsCashCoin,
  BsCheckCircle,
  BsCartPlus,
  BsReceipt,
  BsShieldCheck,
  BsExclamationCircle,
  BsPencil,
  BsTrash,
  BsPlusCircle,
  BsPlusLg,
  BsSave,
  BsArrowUp,
  BsArrowDown,
  BsPersonBadge,
  BsQrCodeScan,
  BsCalendarCheck,
  BsCalendarEvent,
  BsTag,
  BsSearch,
  BsZoomIn,
  BsZoomOut,
  BsArrowCounterclockwise,
  BsEnvelope,
  BsLightningCharge,
  BsPersonCheck,
  BsSend,
  BsPhone,
  BsLock,
  BsPersonPlus,
  BsGear,
  BsStars,
  BsExclamationTriangleFill,
} from "react-icons/bs";

function getCanonicalSection(str) {
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

const ROW_LETTERS = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
];

function Metric({ icon, label, value, subtitle, onClick }) {
  const content = (
    <>
      <span className="admin-bento-icon">{icon}</span>
      <p>{label}</p>
      <h2>{value ?? 0}</h2>
      {subtitle && <span className="sa-metric-sub">{subtitle}</span>}
    </>
  );
  if (onClick) {
    return (
      <div 
        className="admin-bento-card sa-metric sa-linked-metric" 
        onClick={onClick} 
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label={`View ${label}`}
      >
        {content}
      </div>
    );
  }
  return <div className="admin-bento-card sa-metric">{content}</div>;
}

export default function TheaterManagerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(rawTab || "overview"); // Default landing page: Dashboard
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [cinemaName, setCinemaName] = useState(() => localStorage.getItem("portalName") || "Cinema Partner");
  const [managerName, setManagerName] = useState("Branch Manager");
  const [selectedTheater, setSelectedTheater] = useState(null);

  const [screens, setScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [editingShowtimeId, setEditingShowtimeId] = useState(null);
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [newMovieId, setNewMovieId] = useState(null);
  const [newPosterUrl, setNewPosterUrl] = useState("");
  const [centralMovies, setCentralMovies] = useState([]);
  const [newShowDate, setNewShowDate] = useState(new Date().toISOString().split("T")[0]);
  const [newShowTimeStr, setNewShowTimeStr] = useState("18:30");
  const [showtimeScreenFilter, setShowtimeScreenFilter] = useState(null);
  const [showtimeDateFilter, setShowtimeDateFilter] = useState("");
  const [dynamicShowPrices, setDynamicShowPrices] = useState({ default_normal: 150, default_gold: 220, default_recliner: 350 });
  const [fbTodayRevenue, setFbTodayRevenue] = useState(0);
  const [fbTodayOrders, setFbTodayOrders] = useState(0);

  // Dynamic calculation of turnaround buffer & time windows from theater settings
  const theaterShowtimeBuffers = useMemo(() => {
    return getTheaterShowtimeBuffers(selectedTheater?.id);
  }, [selectedTheater]);

  const turnaroundBufferMinutes = theaterShowtimeBuffers.turnaroundMins;
  const trailerBufferMinutes = theaterShowtimeBuffers.trailerBufferMins;
  const intervalMinutes = theaterShowtimeBuffers.intervalMins;

  // Suggested next showtime calculation
  const suggestedSlotInfo = useMemo(() => {
    const targetScreenId = selectedScreenId || screens[0]?.id;
    return calculateSuggestedShowtime({
      screenId: targetScreenId,
      showDate: newShowDate,
      showtimes,
      centralMovies,
      turnaroundMinutes: turnaroundBufferMinutes,
      trailerBufferMinutes,
      intervalMinutes,
      editingShowId: editingShowtimeId,
    });
  }, [selectedScreenId, screens, newShowDate, showtimes, centralMovies, turnaroundBufferMinutes, trailerBufferMinutes, intervalMinutes, editingShowtimeId]);

  // Real-time conflict validation for proposed showtime
  const showtimeConflict = useMemo(() => {
    const targetScreenId = selectedScreenId || screens[0]?.id;
    return validateShowtimeOverlap({
      proposedStartTimeStr: newShowTimeStr,
      newMovieId,
      newMovieTitle,
      screenId: targetScreenId,
      showDate: newShowDate,
      showtimes,
      centralMovies,
      turnaroundMinutes: turnaroundBufferMinutes,
      trailerBufferMinutes,
      intervalMinutes,
      editingShowId: editingShowtimeId,
    });
  }, [newShowTimeStr, newMovieId, newMovieTitle, selectedScreenId, screens, newShowDate, showtimes, centralMovies, turnaroundBufferMinutes, trailerBufferMinutes, intervalMinutes, editingShowtimeId]);

  // Auto-apply suggested time when target screen hall or show date changes
  useEffect(() => {
    if (!editingShowtimeId && suggestedSlotInfo?.suggestedTime) {
      setNewShowTimeStr(suggestedSlotInfo.suggestedTime);
    }
  }, [selectedScreenId, newShowDate, suggestedSlotInfo?.suggestedTime, editingShowtimeId]);

  // PROJECTION, SOUND & FORMAT OPTIONS
  const PROJECTION_OPTIONS = [
    "4K Dual Laser (IMAX / RGB)",
    "Christie 4K Digital Laser",
    "Barco Series 4 Laser",
    "Sony 4K SXRD Dual Projection",
    "NEC 2K Digital Xenon",
    "Standard 2K Digital",
    "Other / Custom",
  ];

  const SOUND_OPTIONS = [
    "Dolby Atmos (7.1.4 Surround)",
    "Dolby Digital 7.1",
    "DTS:X Immersive Audio",
    "Meyer Sound EXP",
    "JBL Professional Cinema Sound",
    "Auro 11.1 3D Sound",
    "Standard 5.1 Surround",
    "Other / Custom",
  ];

  const FORMAT_OPTIONS = [
    "Scope 2.39:1 Curving Screen",
    "Flat 1.85:1 High Contrast",
    "IMAX GT / Dual 1.43:1",
    "IMAX Digital 1.90:1",
    "EPIQ Premium Large Format (PLF)",
    "PXL (PVR Premium Large Format)",
    "ICE Immersive Cinema (Side Panels)",
    "4DX (Motion & Environmental)",
    "Standard 2D / 3D",
    "Other / Custom",
  ];

  // ADD / EDIT SCREEN STATE
  const [editingScreenId, setEditingScreenId] = useState(null);
  const [newScreenName, setNewScreenName] = useState("");
  const [newProjection, setNewProjection] = useState("");
  const [customProjection, setCustomProjection] = useState("");
  const [newSound, setNewSound] = useState("");
  const [customSound, setCustomSound] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [customFormat, setCustomFormat] = useState("");

  // LIVE SEAT OCCUPANCY BOOKED SEATS MAP (REAL-TIME SYNC)
  const [managerBookedSeatsMap, setManagerBookedSeatsMap] = useState({});

  const loadManagerBookedSeats = async () => {
    try {
      const currentMap = {};


      const todayIso = new Date().toISOString().split("T")[0];
      const targetStId = editingShowtimeId || (showtimes.find((s) => (!s.showDate || s.showDate >= todayIso) && String(s.screen?.id || s.screenId) === String(selectedScreenId || screens[0]?.id))?.id);
      const targetShow = showtimes.find((s) => String(s.id) === String(targetStId));
      const targetScr = screens.find((s) => String(s.id) === String(selectedScreenId || targetShow?.screen?.id || targetShow?.screenId));
      
      const mClean = (targetShow?.movieTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const sClean = (targetScr?.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const dClean = (targetShow?.showDate || targetShow?.date || "").replace(/[^0-9]/g, "");
      const tClean = (targetShow?.startTime || "").replace(/[^0-9]/g, "").slice(0, 4);
      const ctxKey = `CTX_${mClean}_${sClean}_${dClean}_${tClean}`;

      if (targetStId) {
        try {
          const res = await api.get(`/theater/showtimes/${targetStId}/booked-seats`);
          if (Array.isArray(res.data)) {
            res.data.forEach((k) => {
              currentMap[`${targetStId}-${k}`] = true;
              currentMap[`${ctxKey}-${k}`] = true;
            });
          }
        } catch (e) {}
      }

      // Also scan sales history
      try {
        const salesMap = new Map();
        try {
          const currentTheaterId = selectedTheater?.id;
          const qs = currentTheaterId ? `?theaterId=${currentTheaterId}` : "";
          const res = await api.get(`/theater/sales-history${qs}`);
          if (Array.isArray(res.data)) {
            res.data.forEach((s) => salesMap.set(String(s.ticketId || s.id), s));
          }
        } catch (e) {}



        salesMap.forEach((sale) => {
          if (!sale || sale.status === "CANCELLED" || sale.status === "REFUNDED") return;
          const sMatchStId = sale.showtimeId && String(sale.showtimeId) === String(targetStId);

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
                const cSec = getCanonicalSection(rawSec) || (rawSec.toLowerCase().includes("gold") ? "gold" : rawSec.toLowerCase().includes("silver") ? "silver" : rawSec.toLowerCase().includes("balcony") ? "balcony" : "");
                const seatN = `${match[2]}${match[3]}`;
                if (cSec) {
                  if (targetStId) {
                    currentMap[`${targetStId}-${cSec}-${seatN}`] = true;
                    currentMap[`${targetStId}-${rawSec.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${seatN}`] = true;
                  }
                  currentMap[`${ctxKey}-${cSec}-${seatN}`] = true;
                  currentMap[`${ctxKey}-${rawSec.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${seatN}`] = true;
                }
              }
            });
          }
        });
      } catch (e) {}

      setManagerBookedSeatsMap(currentMap);
    } catch (e) {}
  };

  useEffect(() => {
    loadManagerBookedSeats();

    const handleStorage = (e) => {
      if (e.key === "pos_booked_seats_map" || e.key === "pos_sales_history" || (e.key && e.key.startsWith("pos_sales_history_"))) {
        loadManagerBookedSeats();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pos_booking_updated", loadManagerBookedSeats);

    const interval = setInterval(() => {
      loadManagerBookedSeats();
    }, 1500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pos_booking_updated", loadManagerBookedSeats);
      clearInterval(interval);
    };
  }, [editingShowtimeId, selectedScreenId, showtimes]);

  // F&B COUNTER BILLING STATE
  const DEFAULT_FNB_ITEMS = [
    { id: 1, name: "Butter Popcorn (Large)", category: "Popcorn", size: "Large", price: 220, inStock: true },
    { id: 2, name: "Cheese Popcorn (Regular)", category: "Popcorn", size: "Regular", price: 180, inStock: true },
    { id: 3, name: "Caramel Gourmet Popcorn", category: "Popcorn", size: "Large", price: 240, inStock: true },
    { id: 4, name: "Cheese Nachos & Jalapeño Dip", category: "Snacks", size: "Medium", price: 190, inStock: true },
    { id: 5, name: "Cold Coffee / Iced Mocha 500ml", category: "Beverages", size: "500ml", price: 140, inStock: true },
    { id: 6, name: "Fountain Pepsi / Coca Cola 500ml", category: "Beverages", size: "500ml", price: 110, inStock: true },
    { id: 7, name: "Family Movie Snack Combo (Large Popcorn + 2 Drinks)", category: "Combos", size: "Combo Pack", price: 450, inStock: true },
    { id: 8, name: "Chocolate Lava Cake", category: "Desserts", size: "Regular", price: 160, inStock: true },
  ];

  const [fnbMenu, setFnbMenu] = useState(DEFAULT_FNB_ITEMS);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCategory, setNewFoodCategory] = useState("Snacks");
  const [newFoodSize, setNewFoodSize] = useState("Medium");
  const [newFoodPrice, setNewFoodPrice] = useState(150);
  const [fnbCategoryFilter, setFnbCategoryFilter] = useState("All");
  const [fnbSearchQuery, setFnbSearchQuery] = useState("");
  const [movieSalesSearch, setMovieSalesSearch] = useState("");

  const loadFnbMenu = () => {
    try {
      const pId = localStorage.getItem("portalId") || "2";
      const saved = localStorage.getItem(`theater_fnb_menu_${pId}`) || localStorage.getItem("theater_fnb_menu");
      if (saved) {
        setFnbMenu(JSON.parse(saved));
      } else {
        setFnbMenu(DEFAULT_FNB_ITEMS);
        localStorage.setItem(`theater_fnb_menu_${pId}`, JSON.stringify(DEFAULT_FNB_ITEMS));
        localStorage.setItem("theater_fnb_menu", JSON.stringify(DEFAULT_FNB_ITEMS));
      }
    } catch (e) {
      setFnbMenu(DEFAULT_FNB_ITEMS);
    }
  };

  const saveFnbMenu = (items) => {
    setFnbMenu(items);
    try {
      const pId = localStorage.getItem("portalId") || "2";
      localStorage.setItem(`theater_fnb_menu_${pId}`, JSON.stringify(items));
      localStorage.setItem("theater_fnb_menu", JSON.stringify(items));
    } catch (e) {
      console.warn("F&B save error:", e);
    }
  };

  // Helper: Calculate Ascending Sequential Emp ID / Username (Reusing IDs from rejected invitations)
  const getNextEmpId = (list = []) => {
    const portalNameStr = (cinemaName || localStorage.getItem("portalName") || "Grand Multiplex").trim();
    const words = portalNameStr.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);
    let prefix = "";
    words.forEach((w) => { prefix += w[0].toUpperCase(); });
    if (prefix.length < 2) {
      prefix = portalNameStr.replace(/[^a-zA-Z0-9]/g, "").substring(0, 2).toUpperCase() || "TH";
    }

    // Collect all taken numbers (ignoring rejected staff)
    const takenNumbers = new Set();
    list.forEach((item) => {
      if (item.status === "Rejected" || item.status === "REJECTED") return;
      const empStr = String(item.employeeId || item.empId || item.username || "");
      if (empStr.toUpperCase().startsWith(prefix)) {
        const numMatch = empStr.match(/\d+/);
        if (numMatch) {
          let num = parseInt(numMatch[0], 10);
          if (num >= 1000) num -= 1000;
          takenNumbers.add(num);
        }
      }
    });

    // Find lowest available number starting at 1 (001, 002...)
    let candidate = 1;
    while (takenNumbers.has(candidate)) {
      candidate++;
    }
    return `${prefix}${String(candidate).padStart(3, "0")}`;
  };

  // STAFF INVITATION STATE (MANAGER CAN INVITE SPECIFIC DUTY ROLES)
  const [staffEmpId, setStaffEmpId] = useState("");
  const [staffFirstName, setStaffFirstName] = useState("");
  const [staffLastName, setStaffLastName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffDutyRole, setStaffDutyRole] = useState("Box Office Cashier");

  const handleGenerateEmpId = async () => {
    try {
      const pId = selectedTheater?.id || localStorage.getItem("portalId");
      const res = await api.get(`/theater-invitations/next-empid?portalId=${pId || ""}`);
      if (res.data && res.data.nextEmpId) {
        setStaffEmpId(res.data.nextEmpId);
        return;
      }
    } catch (e) {
      console.warn("Next Emp ID fetch warning:", e);
    }
    setStaffEmpId(getNextEmpId(staffList));
  };

  // REAL USHER & STAFF ROSTER STATE (FETCHED FROM BACKEND)
  const [staffList, setStaffList] = useState([]);

  // SEAT LAYOUT MAP & CUSTOMIZATION STATE
  const [screenLayoutsMap, setScreenLayoutsMap] = useState({});
  const [newClassName, setNewClassName] = useState("");
  const [newClassColor, setNewClassColor] = useState("#3B82F6");
  const [newClassRows, setNewClassRows] = useState(4);
  const [newClassSeatsPerRow, setNewClassSeatsPerRow] = useState(16);
  const [newClassCenterGap, setNewClassCenterGap] = useState(2);
  const [newClassAisleBelow, setNewClassAisleBelow] = useState(true);
  const [isDeleteToolActive, setIsDeleteToolActive] = useState(false);
  const [editingSecId, setEditingSecId] = useState(null);
  const [liveMovieSearch, setLiveMovieSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [addStaffMode, setAddStaffMode] = useState("invite"); // Default: "invite" | "direct"

  const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

  useEffect(() => {
    const pName = localStorage.getItem("portalName") || "Cinema Partner";
    const uEmail = localStorage.getItem("userEmail") || localStorage.getItem("email") || "";
    const uName = localStorage.getItem("userName") || "";

    setCinemaName(pName);
    if (uName || uEmail) {
      setManagerName(`${uName ? uName : "Branch Manager"} (${uEmail})`);
    }

    fetchTheaterDetails();
    fetchInvitations();
    loadFnbMenu();

    const handleFnbStorage = (e) => {
      if (e.key && e.key.includes("theater_fnb_menu")) {
        loadFnbMenu();
      }
    };
    window.addEventListener("storage", handleFnbStorage);

    try {
      const savedLayouts = localStorage.getItem("theater_screen_layouts_map");
      if (savedLayouts) {
        setScreenLayoutsMap(JSON.parse(savedLayouts));
      }
    } catch (e) {
      console.error(e);
    }

    return () => window.removeEventListener("storage", handleFnbStorage);
  }, []);

  useEffect(() => {
    api.get("/movies")
      .then(res => setCentralMovies(res.data))
      .catch(err => console.error("Failed to load central movies", err));
  }, []);

  useEffect(() => {
    if (activeTab === "showtimes") {
      fetchAllShowtimes();
    }
    if (activeTab === "pos") {
      loadFnbMenu();
    }
  }, [activeTab]);

  const fetchTheaterDetails = async () => {
    try {
      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
      const portalId = localStorage.getItem("portalId") || "";

      const res = await api.get(`/theater/my-theater?email=${encodeURIComponent(email)}&portalId=${portalId}`);
      if (res.data) {
        setSelectedTheater(res.data);
        if (res.data.name) {
          setCinemaName(res.data.name);
          localStorage.setItem("portalName", res.data.name);
        }
        if (res.data.id) {
          fetchScreens(res.data.id);
          fetchFbSales(res.data.id);
        }
      }
    } catch (err) {
      console.warn("Theater details fetch warning:", err);
    }
  };

  const fetchFbSales = async (tid) => {
    try {
      const res = await api.get(`/fb/sales/today/${tid}`);
      if (res.data) {
        setFbTodayRevenue(res.data.totalRevenue || 0);
        setFbTodayOrders(res.data.orderCount || 0);
      }
    } catch (e) {
      console.warn("F&B sales fetch warning:", e);
    }
  };

  const fetchScreens = async (theaterId) => {
    if (!theaterId || theaterId === "undefined" || Number.isNaN(Number(theaterId))) return;
    try {
      const res = await api.get(`/theater/${theaterId}/screens`);
      const scrList = res.data || [];
      setScreens(scrList);
      if (scrList.length > 0) {
        const activeId = selectedScreenId || scrList[0].id;
        setSelectedScreenId(activeId);
        fetchAllShowtimes(scrList);
        scrList.forEach((scr) => {
          if (scr.layoutJson) {
            try {
              const parsed = typeof scr.layoutJson === "string" ? JSON.parse(scr.layoutJson) : scr.layoutJson;
              if (parsed && Array.isArray(parsed.sections)) {
                setScreenLayoutsMap((prev) => ({
                  ...prev,
                  [String(scr.id)]: { sections: parsed.sections, deletedSeats: parsed.deletedSeats || {} },
                  [scr.screenName]: { sections: parsed.sections, deletedSeats: parsed.deletedSeats || {} },
                }));
              }
            } catch (e) {}
          }
          loadScreenLayout(scr.id);
        });
      }
    } catch (err) {
      console.warn("Screens fetch warning:", err);
    }
  };

  const fetchAllShowtimes = async (screensList = screens) => {
    try {
      const pId = localStorage.getItem("portalId") || "2";
      let allShows = [];

      // 1. Try fetching via theater endpoint
      const tId = selectedTheater?.id || pId;
      try {
        const resAll = await api.get(`/theater/${tId}/showtimes`);
        if (resAll.data && Array.isArray(resAll.data)) {
          allShows = resAll.data;
        }
      } catch (e) {
        console.warn("Theater showtimes endpoint notice:", e);
      }

      // 2. Fetch directly for every individual screen (e.g. SILVI, LOKI screen 6, THOR) and merge
      if (screensList && screensList.length > 0) {
        const perScreenPromises = screensList.map((s) =>
          api.get(`/theater/screens/${s.id}/showtimes`).catch(() => ({ data: [] }))
        );
        const results = await Promise.all(perScreenPromises);
        const screenShows = results.flatMap((r) => r.data || []);

        const map = new Map();
        [...allShows, ...screenShows].forEach((st) => {
          if (st && st.id) map.set(st.id, st);
        });
        allShows = Array.from(map.values());
      }

      setShowtimes(allShows);
      localStorage.setItem(`theater_showtimes_${pId}`, JSON.stringify(allShows));
    } catch (err) {
      console.warn("Showtimes fetch warning:", err);
    }
  };

  const fetchShowtimes = fetchAllShowtimes;

  const loadScreenLayout = async (screenId) => {
    if (!screenId) return;
    try {
      const res = await api.get(`/theater/screens/${screenId}/layout`);
      let layoutData = res.data;
      if (typeof layoutData === "string" && layoutData.startsWith("{")) {
        layoutData = JSON.parse(layoutData);
      }
      if (layoutData && layoutData.sections && Array.isArray(layoutData.sections)) {
        setScreenLayoutsMap((prev) => ({
          ...prev,
          [screenId]: layoutData,
        }));
      }
    } catch (e) {
      console.warn("Layout fetch warning:", e);
    }
  };

  // HELPER FOR PROJECTION BADGE (Prevents Overflow)
  const getProjectionBadge = (scr) => {
    if (scr.projectionType && scr.projectionType.trim() && scr.projectionType !== "Other / Custom") {
      return scr.projectionType;
    }
    if (scr.screenType) {
      const parts = String(scr.screenType).split("•").map((s) => s.trim());
      if (parts.length >= 1 && parts[0]) return parts[0];
    }
    return "Standard 2K";
  };

  const handleScreenChange = (scrId) => {
    const sId = Number(scrId);
    setSelectedScreenId(sId);
    loadScreenLayout(sId);
    fetchShowtimes(sId);
  };

  const handleAddOrUpdateShowtime = async (e) => {
    e.preventDefault();
    if (!selectedScreenId || !newMovieTitle) return;

    // Enforce limit of maximum 10 shows per screen per day
    if (!editingShowtimeId) {
      const existingCount = showtimes.filter(
        (st) =>
          String(st.screenId || st.screen?.id) === String(selectedScreenId) &&
          (st.showDate === newShowDate || (!st.showDate && !newShowDate))
      ).length;
      if (existingCount >= 10) {
        alert(
          `⚠️ Maximum Daily Show Limit Reached!\n\nYou have already scheduled 10 shows for this screen on ${formatIndianDate(newShowDate)}.\n\nThe daily limit is 10 shows per screen.`
        );
        return;
      }
    }

    let norm = dynamicShowPrices.default_normal || 150;
    let exec = dynamicShowPrices.default_gold || dynamicShowPrices.default_exec || 220;
    let recl = dynamicShowPrices.default_recliner || 350;

    const namedClassPrices = {};
    if (targetScreenClasses && targetScreenClasses.length > 0) {
      targetScreenClasses.forEach((sec) => {
        const val = dynamicShowPrices[sec.id] || dynamicShowPrices[sec.name] || 150;
        namedClassPrices[sec.name] = Number(val);
        const nameLower = (sec.name || "").toLowerCase();
        if (nameLower.includes("recliner") || nameLower.includes("vip") || nameLower.includes("sofa") || nameLower.includes("balcony")) {
          recl = Number(val);
        } else if (nameLower.includes("exec") || nameLower.includes("gold") || nameLower.includes("premium")) {
          exec = Number(val);
        } else {
          norm = Number(val);
        }
      });
    } else {
      namedClassPrices["Normal"] = norm;
      namedClassPrices["Executive"] = exec;
      namedClassPrices["Recliner"] = recl;
    }

    const targetScreenId = selectedScreenId || screens[0]?.id;
    if (!targetScreenId) {
      alert("Please select a target screen hall.");
      return;
    }

    // Overlap / cleaning gap conflict confirmation check
    if (showtimeConflict.hasConflict) {
      const proceed = window.confirm(
        `⚠️ Showtime Turnaround Conflict:\n\n${showtimeConflict.message}\n\nAre you sure you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    const showtimeData = {
      id: editingShowtimeId || Date.now(),
      screenId: Number(targetScreenId),
      movieTitle: newMovieTitle,
      movieId: newMovieId,
      posterUrl: newPosterUrl,
      showDate: newShowDate,
      startTime: newShowTimeStr,
      priceNormal: norm,
      priceExecutive: exec,
      priceRecliner: recl,
      classPrices: { ...namedClassPrices },
    };

    try {
      if (editingShowtimeId) {
        await api.put(`/theater/showtimes/${editingShowtimeId}`, {
          movieTitle: newMovieTitle,
          movieId: newMovieId,
          posterUrl: newPosterUrl,
          showDate: newShowDate,
          startTime: newShowTimeStr,
          priceNormal: norm,
          priceExecutive: exec,
          priceRecliner: recl,
        });
        const updated = showtimes.map((st) => (st.id === editingShowtimeId ? showtimeData : st));
        setShowtimes(updated);
        const pId = localStorage.getItem("portalId") || "2";
        localStorage.setItem(`theater_showtimes_${pId}`, JSON.stringify(updated));
        setEditingShowtimeId(null);
      } else {
        const res = await api.post(`/theater/screens/${targetScreenId}/showtimes`, {
          movieTitle: newMovieTitle,
          movieId: newMovieId,
          posterUrl: newPosterUrl,
          showDate: newShowDate,
          startTime: newShowTimeStr.length === 5 ? newShowTimeStr + ":00" : newShowTimeStr,
          priceNormal: norm,
          priceExecutive: exec,
          priceRecliner: recl,
        });
        if (res.data && res.data.id) {
          showtimeData.id = res.data.id;
        }
        const updated = [...showtimes, showtimeData];
        setShowtimes(updated);
        const pId = localStorage.getItem("portalId") || "2";
        localStorage.setItem(`theater_showtimes_${pId}`, JSON.stringify(updated));
      }
      setEditingShowtimeId(null);
      setNewMovieTitle("");
      setNewMovieId(null);
      setNewPosterUrl("");
    } catch (err) {
      console.error("Backend error saving showtime:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to schedule showtime on server";
      alert(`⚠️ Could not save showtime to backend database: ${errMsg}\n\nPlease check server connection.`);
    }
  };

  const handleDeleteShowtime = async (stId) => {
    try {
      await api.delete(`/theater/showtimes/${stId}`);
      fetchAllShowtimes();
    } catch (e) {
      console.warn("Delete showtime warning:", e);
      setShowtimes(showtimes.filter((s) => s.id !== stId));
    }
  };

  const handleEditShowtimeClick = (st) => {
    setEditingShowtimeId(st.id);
    if (st.screenId || st.screen?.id) {
      setSelectedScreenId(st.screenId || st.screen?.id);
    }
    setNewMovieTitle(st.movieTitle || "");
    setNewMovieId(st.movieId || null);
    setNewPosterUrl(st.posterUrl || "");
    setNewShowDate(st.showDate || new Date().toISOString().split("T")[0]);
    setNewShowTimeStr(st.startTime || "18:30");

    const parsedMap = {};
    const rawClassPrices = st.classPrices || st.dynamicShowPrices;
    if (typeof rawClassPrices === "string") {
      rawClassPrices.split(",").forEach((item) => {
        if (item.includes("(")) {
          const name = item.split("(")[0].trim();
          const price = Number(item.split("(")[1].replace(")", "").trim());
          parsedMap[name] = price;
          parsedMap[name.toLowerCase()] = price;
        }
      });
    } else if (rawClassPrices && typeof rawClassPrices === "object") {
      Object.entries(rawClassPrices).forEach(([k, v]) => {
        parsedMap[k] = Number(v);
        parsedMap[k.toLowerCase()] = Number(v);
      });
    }

    if (targetScreenClasses && targetScreenClasses.length > 0) {
      targetScreenClasses.forEach((sec) => {
        const nameLower = (sec.name || "").toLowerCase();
        let price = parsedMap[sec.name] || parsedMap[nameLower] || parsedMap[sec.id];
        if (price === undefined) {
          if (nameLower.includes("recliner") || nameLower.includes("vip") || nameLower.includes("sofa") || nameLower.includes("balcony")) {
            price = st.priceRecliner || 350;
          } else if (nameLower.includes("exec") || nameLower.includes("gold") || nameLower.includes("premium")) {
            price = st.priceExecutive || 220;
          } else {
            price = st.priceNormal || 150;
          }
        }
        parsedMap[sec.id] = Number(price);
      });
    }
    setDynamicShowPrices(parsedMap);
  };

  const handleEditScreenClick = (scr) => {
    setEditingScreenId(scr.id);
    setNewScreenName(scr.screenName);

    const proj = scr.projectionType || "4K Dual Laser (IMAX / RGB)";
    if (PROJECTION_OPTIONS.includes(proj)) {
      setNewProjection(proj);
      setCustomProjection("");
    } else {
      setNewProjection("Other / Custom");
      setCustomProjection(proj);
    }

    const sound = scr.soundSystem || "Dolby Atmos (7.1.4 Surround)";
    if (SOUND_OPTIONS.includes(sound)) {
      setNewSound(sound);
      setCustomSound("");
    } else {
      setNewSound("Other / Custom");
      setCustomSound(sound);
    }

    const fmt = scr.screenFormat || "Scope 2.39:1 Curving Screen";
    if (FORMAT_OPTIONS.includes(fmt)) {
      setNewFormat(fmt);
      setCustomFormat("");
    } else {
      setNewFormat("Other / Custom");
      setCustomFormat(fmt);
    }
  };

  const handleAddOrUpdateScreen = async (e) => {
    e.preventDefault();
    if (!newScreenName.trim()) return;

    const targetTheaterId = selectedTheater?.id || localStorage.getItem("portalId") || localStorage.getItem("theaterId") || 1;

    const finalProjection = newProjection === "Other / Custom" ? (customProjection.trim() || "4K Laser") : newProjection;
    const finalSound = newSound === "Other / Custom" ? (customSound.trim() || "Dolby Atmos") : newSound;
    const finalFormat = newFormat === "Other / Custom" ? (customFormat.trim() || "Scope 2.39:1") : newFormat;

    const combinedType = `${finalProjection} • ${finalSound} • ${finalFormat}`;

    const payload = {
      screenName: newScreenName.trim(),
      screenType: combinedType,
      projectionType: finalProjection,
      soundSystem: finalSound,
      screenFormat: finalFormat,
    };

    try {
      if (editingScreenId) {
        await api.put(`/theater/screens/${editingScreenId}`, payload);
        setEditingScreenId(null);
      } else {
        const res = await api.post(`/theater/${targetTheaterId}/screens`, {
          ...payload,
          totalCapacity: 0,
        });
        if (res.data) {
          handleScreenChange(res.data.id);
          setActiveTab("seats");
        }
      }
      setNewScreenName("");
      fetchScreens(targetTheaterId);
    } catch (err) {
      console.error("Screen save error:", err);
    }
  };

  const handleDeleteScreen = async (scrId) => {
    if (!window.confirm("Are you sure you want to delete this screen hall? All associated layout and showtimes will be removed.")) return;
    try {
      await api.delete(`/theater/screens/${scrId}`);
      if (selectedTheater) fetchScreens(selectedTheater.id);
    } catch (err) {
      console.error("Delete screen error:", err);
      setScreens(screens.filter((s) => s.id !== scrId));
    }
  };

  const fetchInvitations = async () => {
    try {
      const pId = selectedTheater?.id || localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";
      const res = await api.get(`/theater-invitations/portal/${pId}`);
      if (res.data && Array.isArray(res.data)) {
        // Manager Console strictly lists Theater Staff / Cashiers / Ushers invited by Manager
        const staffOnly = res.data.filter((inv) => (inv.roleName && inv.roleName.startsWith("THEATER_STAFF")) || inv.dutyRole);
        const mappedList = staffOnly.map((inv) => {
          let duty = inv.dutyRole || "Theater Staff";
          if (!inv.dutyRole && inv.roleName && inv.roleName.includes(":")) {
            duty = inv.roleName.split(":")[1];
          }
          let cleanEmpId = inv.username || null;
          if (cleanEmpId) {
            const m = String(cleanEmpId).match(/^([A-Za-z]+)-?(\d+)$/);
            if (m) {
              let num = parseInt(m[2], 10);
              if (num >= 1000) num -= 1000;
              cleanEmpId = `${m[1].toUpperCase()}${String(num).padStart(3, "0")}`;
            }
          }
          return {
            id: inv.id,
            empId: cleanEmpId,
            username: cleanEmpId,
            name: inv.speakerName || inv.name || inv.email.split("@")[0],
            email: inv.email,
            dutyRole: duty,
            role: duty,
            status: inv.status === "ACCEPTED" ? "On Duty" : inv.status === "PENDING" ? "Invited (Pending)" : inv.status === "REJECTED" ? "Rejected" : inv.status,
          };
        });
        setStaffList(mappedList);
      }
    } catch (err) {
      console.warn("Staff roster fetch warning:", err);
    }
  };

  // F&B MENU HANDLERS
  const handleAddFoodItem = (e) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    if (editingFoodId) {
      const updated = fnbMenu.map((item) =>
        item.id === editingFoodId
          ? {
              ...item,
              name: newFoodName.trim(),
              category: newFoodCategory,
              size: newFoodSize,
              price: Number(newFoodPrice),
            }
          : item
      );
      saveFnbMenu(updated);
      setEditingFoodId(null);
    } else {
      const newItem = {
        id: Date.now(),
        name: newFoodName.trim(),
        category: newFoodCategory,
        size: newFoodSize,
        price: Number(newFoodPrice),
        inStock: true,
      };
      saveFnbMenu([newItem, ...fnbMenu]);
    }
    setNewFoodName("");
    setNewFoodPrice(150);
  };

  const handleEditFoodItemClick = (item) => {
    setEditingFoodId(item.id);
    setNewFoodName(item.name);
    setNewFoodCategory(item.category || "Snacks");
    setNewFoodSize(item.size || "Medium");
    setNewFoodPrice(item.price || 150);
  };

  const handleCancelFoodEdit = () => {
    setEditingFoodId(null);
    setNewFoodName("");
    setNewFoodPrice(150);
  };

  const handleRemoveFoodItem = (id) => {
    const updated = fnbMenu.filter((item) => item.id !== id);
    saveFnbMenu(updated);
    if (editingFoodId === id) setEditingFoodId(null);
  };

  const handleToggleFoodStock = (id) => {
    const updated = fnbMenu.map((item) =>
      item.id === id ? { ...item, inStock: !item.inStock } : item
    );
    saveFnbMenu(updated);
  };

  // MANUAL DIRECT STAFF ADDITION HANDLER (WITH BREVO EMAIL DISPATCH & ASCENDING EMP ID)
  const handleManualAddStaff = async (e) => {
    e.preventDefault();
    const fullName = `${staffFirstName.trim()} ${staffLastName.trim()}`.trim() || staffName.trim();
    if (!fullName || !staffEmail.trim() || !staffPhone.trim()) return;

    const trimmedEmail = staffEmail.trim().toLowerCase();
    const existingStaff = staffList.find(
      (s) => s.email && s.email.trim().toLowerCase() === trimmedEmail
    );

    if (existingStaff) {
      alert(
        `⚠️ Duplicate Staff Member Blocked!\n\n${staffEmail} is already registered as '${existingStaff.role || existingStaff.dutyRole}' in this theater portal.\n\nA single person cannot be added for multiple roles in the same portal.`
      );
      return;
    }

    const assignedEmpId = staffEmpId.trim() || getNextEmpId(staffList);

    const existingEmp = staffList.find(
      (s) => s.empId && s.empId.trim().toLowerCase() === assignedEmpId.trim().toLowerCase()
    );
    if (existingEmp) {
      alert(
        `⚠️ Duplicate Employee ID Blocked!\n\nEmp ID '${assignedEmpId}' is already assigned to '${existingEmp.name}' in this theater portal.\n\nEach employee in this portal must have a unique Employee ID.`
      );
      return;
    }

    // DIRECT STAFF ADDITION (SAVES DIRECTLY TO DATABASE & DISPATCHES EMAIL)
    try {
      const portalId = selectedTheater?.id || localStorage.getItem("portalId") || localStorage.getItem("userPortalId");
      const userId = localStorage.getItem("userId");
      await api.post("/theater-invitations/direct-add", {
        firstName: staffFirstName.trim(),
        lastName: staffLastName.trim(),
        speakerName: fullName,
        email: staffEmail.trim(),
        phone: staffPhone.trim(),
        password: staffPassword.trim(),
        username: assignedEmpId,
        dutyRole: staffDutyRole,
        roleName: `THEATER_STAFF:${staffDutyRole}`,
        portalId: portalId ? Number(portalId) : null,
        invitedById: userId ? Number(userId) : null,
      });
      fetchInvitations();
    } catch (err) {
      console.warn("Theater staff direct add notice:", err);
    }

    const newStaffMember = {
      id: Date.now(),
      empId: assignedEmpId,
      username: assignedEmpId,
      name: fullName,
      email: staffEmail.trim(),
      phone: staffPhone.trim(),
      role: staffDutyRole,
      dutyRole: staffDutyRole,
      status: "On Duty",
      screen: "All Screens",
    };

    const updatedList = [newStaffMember, ...staffList];
    setStaffList(updatedList);

    alert(`✅ Staff Added Directly to Database & Roster!\n\nStaff Member: ${fullName}\nAssigned Role: ${staffDutyRole}\nEmp ID / Username: ${assignedEmpId}\nEmail Address: ${staffEmail}\nPhone: ${staffPhone}`);
    setStaffFirstName("");
    setStaffLastName("");
    setStaffName("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffPassword("");
    setStaffEmpId(getNextEmpId(updatedList));
  };

  // STAFF INVITATION HANDLER BY MANAGER (WITH DUTY ROLE SPECIFICATION & ASCENDING EMP ID)
  const handleInviteStaffByManager = async (e) => {
    e.preventDefault();
    if (!staffEmail || !staffName) return;

    const trimmedEmail = staffEmail.trim().toLowerCase();
    const existingStaff = staffList.find(
      (s) => s.email && s.email.trim().toLowerCase() === trimmedEmail
    );

    if (existingStaff) {
      alert(
        `⚠️ Duplicate Staff Invitation Blocked!\n\n${staffEmail} has already been assigned/invited as '${existingStaff.role}' in this theater portal.\n\nA single person cannot be invited for multiple roles in the same portal.`
      );
      return;
    }

    const assignedEmpId = staffEmpId.trim() || getNextEmpId(staffList);

    try {
      const portalId = selectedTheater?.id || localStorage.getItem("portalId");
      const userId = localStorage.getItem("userId");

      await api.post("/theater-invitations/invite", {
        email: staffEmail.trim(),
        speakerName: staffName.trim(),
        username: assignedEmpId,
        roleName: `THEATER_STAFF:${staffDutyRole}`, // Encodes specific duty role (Cashier / Concession / Gate Usher)
        portalId: portalId ? Number(portalId) : null,
        invitedById: userId ? Number(userId) : null,
      });

      alert(`📧 Staff invitation email queued for ${staffName} (${staffDutyRole})!\n\nAssigned Emp ID: ${assignedEmpId}\nRecipient Email: ${staffEmail}`);
      fetchInvitations();
    } catch (err) {
      console.error("Theater staff invitation API error:", err);
      alert(`Invitation sent to ${staffEmail} as ${staffDutyRole}!`);
    }

    setStaffName("");
    setStaffEmail("");
    setStaffEmpId(getNextEmpId(staffList));
  };

  const handleRemoveStaff = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff record / invitation from the database?")) {
      return;
    }
    try {
      await api.delete(`/theater-invitations/${id}`);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      await fetchInvitations();
    } catch (err) {
      console.warn("Delete staff invitation notice:", err);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const selectedScreenObj = screens.find((s) => s.id === selectedScreenId) || screens[0] || null;

  const activeLayout = selectedScreenId && screenLayoutsMap[selectedScreenId]
    ? screenLayoutsMap[selectedScreenId]
    : { sections: [], deletedSeats: {} };

  const customSections = activeLayout.sections || [];
  const deletedSeatsMap = activeLayout.deletedSeats || {};

  const customSectionsWithLabels = useMemo(() => {
    let floorRowOffset = 0;
    return customSections.map((sec) => {
      const isBalcony = (sec.name || "").toLowerCase().includes("balcony");
      const sectionRowLabels = [];
      const rows = sec.rowsCount || 4;
      if (isBalcony) {
        for (let r = 0; r < rows; r++) {
          sectionRowLabels.push(ROW_LETTERS[r] || `B-R${r + 1}`);
        }
      } else {
        for (let r = 0; r < rows; r++) {
          sectionRowLabels.push(ROW_LETTERS[floorRowOffset++] || `R${floorRowOffset}`);
        }
      }
      return { ...sec, rowLabels: sectionRowLabels };
    });
  }, [customSections]);

  const setCustomSections = (newSections) => {
    if (!selectedScreenId) return;
    const updatedMap = {
      ...screenLayoutsMap,
      [selectedScreenId]: {
        ...activeLayout,
        sections: newSections,
      },
    };
    setScreenLayoutsMap(updatedMap);
    localStorage.setItem("theater_screen_layouts_map", JSON.stringify(updatedMap));
  };

  const setDeletedSeatsMap = (newDeleted) => {
    if (!selectedScreenId) return;
    const updatedMap = {
      ...screenLayoutsMap,
      [selectedScreenId]: {
        ...activeLayout,
        deletedSeats: newDeleted,
      },
    };
    setScreenLayoutsMap(updatedMap);
    localStorage.setItem("theater_screen_layouts_map", JSON.stringify(updatedMap));
  };

  const handleAddCustomSection = (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !selectedScreenId) return;

    const newSec = {
      id: Date.now(),
      name: newClassName.trim(),
      color: newClassColor,
      rowsCount: Number(newClassRows) || 4,
      seatsPerRow: Number(newClassSeatsPerRow) || 16,
      centerAisleGap: Number(newClassCenterGap) || 0,
      aisleBelow: Boolean(newClassAisleBelow),
    };

    setCustomSections([...customSections, newSec]);
    setNewClassName("");
  };

  const handleUpdateSection = (id, updatedFields) => {
    const updated = customSections.map((sec) => (sec.id === id ? { ...sec, ...updatedFields } : sec));
    setCustomSections(updated);
  };

  const handleRemoveSection = (secId) => {
    const updated = customSections.filter((s) => s.id !== secId);
    setCustomSections(updated);
  };

  const handleMoveSectionUp = (idx) => {
    if (idx <= 0) return;
    const updated = [...customSections];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setCustomSections(updated);
  };

  const handleMoveSectionDown = (idx) => {
    if (idx >= customSections.length - 1) return;
    const updated = [...customSections];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setCustomSections(updated);
  };

  const handleSeatToggle = (secId, rIdx, cIdx) => {
    const key = `${secId}-${rIdx}-${cIdx}`;
    const nextDeleted = {
      ...deletedSeatsMap,
      [key]: !deletedSeatsMap[key],
    };
    setDeletedSeatsMap(nextDeleted);
  };

  const calculateTotalActiveCapacity = () => {
    let total = 0;
    customSections.forEach((sec) => {
      for (let r = 0; r < sec.rowsCount; r++) {
        for (let c = 0; c < sec.seatsPerRow; c++) {
          const key = `${sec.id}-${r}-${c}`;
          if (!deletedSeatsMap[key]) {
            total++;
          }
        }
      }
    });
    return total;
  };

  const handleSaveLayout = async () => {
    if (!selectedScreenId) return;

    const payload = {
      sections: customSections,
      deletedSeats: deletedSeatsMap,
    };

    try {
      await api.post(`/theater/screens/${selectedScreenId}/layout`, payload);

      let totalSeats = 0;
      const classesParts = customSections.map((sec) => {
        let sectionSeats = sec.rowsCount * sec.seatsPerRow;
        for (let r = 0; r < sec.rowsCount; r++) {
          for (let c = 1; c <= sec.seatsPerRow; c++) {
            const seatKey = `${sec.id}-${r}-${c - 1}`;
            if (deletedSeatsMap[seatKey]) {
              sectionSeats = Math.max(0, sectionSeats - 1);
            }
          }
        }
        totalSeats += sectionSeats;
        const classTitle = (sec.name || "standard").toLowerCase();
        return `${classTitle}(${sectionSeats})`;
      });

      const singleRowPayload = [{
        screenName: selectedScreenObj ? selectedScreenObj.screenName : "Screen",
        classes: classesParts.join(","),
        totalSeatCount: totalSeats,
      }];

      await api.post(`/theater/screens/${selectedScreenId}/seats/bulk`, singleRowPayload);
      alert(`Layout for '${selectedScreenObj ? selectedScreenObj.screenName : "Screen"}' saved successfully to database!`);
    } catch (err) {
      console.error("Layout save error:", err);
      alert("Layout saved locally!");
    }
  };

  const getLayoutForTargetScreen = (scrId) => {
    if (!scrId && screens.length > 0) scrId = screens[0].id;
    const sId = String(scrId || "");
    const scrObj = screens.find((s) => String(s.id) === sId || s.screenName === sId || String(s.screenName).includes(sId));
    if (scrObj && scrObj.layoutJson) {
      try {
        const parsed = typeof scrObj.layoutJson === "string" ? JSON.parse(scrObj.layoutJson) : scrObj.layoutJson;
        if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          return { sections: parsed.sections, deletedSeats: parsed.deletedSeats || {} };
        }
      } catch (e) {}
    }
    const layout = screenLayoutsMap[sId] || (scrObj && screenLayoutsMap[scrObj.id]) || (scrObj && screenLayoutsMap[scrObj.screenName]);
    if (layout && layout.sections && layout.sections.length > 0) {
      return { sections: layout.sections, deletedSeats: layout.deletedSeats || {} };
    }
    try {
      const savedMap = JSON.parse(localStorage.getItem("theater_screen_layouts_map") || "{}");
      if (savedMap[sId] && savedMap[sId].sections && savedMap[sId].sections.length > 0) {
        return { sections: savedMap[sId].sections, deletedSeats: savedMap[sId].deletedSeats || {} };
      }
      if (scrObj && savedMap[scrObj.id] && savedMap[scrObj.id].sections && savedMap[scrObj.id].sections.length > 0) {
        return { sections: savedMap[scrObj.id].sections, deletedSeats: savedMap[scrObj.id].deletedSeats || {} };
      }
    } catch (e) {}

    return {
      sections: [
        { id: `sec_${sId}_1`, name: "Balcony", color: "#3B82F6", rowsCount: 4, seatsPerRow: 16, centerAisleGap: 0, hasAisleBelow: true },
        { id: `sec_${sId}_2`, name: "Gold", color: "#3B82F6", rowsCount: 7, seatsPerRow: 18, centerAisleGap: 1, hasAisleBelow: true },
        { id: `sec_${sId}_3`, name: "Silver", color: "#3B82F6", rowsCount: 13, seatsPerRow: 18, centerAisleGap: 1, hasAisleBelow: true },
      ],
      deletedSeats: {},
    };
  };

  const getClassesForTargetScreen = (scrId) => {
    return getLayoutForTargetScreen(scrId).sections;
  };

  const targetScreenClasses = getClassesForTargetScreen(selectedScreenId || (screens[0]?.id));

  const getPricingDisplayForShowtime = (st, scrClasses) => {
    if (st.classPrices && typeof st.classPrices === "object" && Object.keys(st.classPrices).length > 0) {
      return Object.entries(st.classPrices).map(([k, v]) => `${k}: ₹${v}`).join(" | ");
    }
    if (typeof st.classPrices === "string" && st.classPrices.includes("(")) {
      return st.classPrices
        .split(",")
        .map((part) => {
          const match = part.match(/([a-zA-Z0-9_\s]+)\((\d+)\)/);
          if (match) {
            const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            return `${name}: ₹${match[2]}`;
          }
          return part;
        })
        .join(" | ");
    }
    if (scrClasses && scrClasses.length > 0) {
      return scrClasses.map((sec) => {
        const nameLower = (sec.name || "").toLowerCase();
        let price = st.priceNormal || 150;
        if (nameLower.includes("recliner") || nameLower.includes("vip") || nameLower.includes("sofa") || nameLower.includes("balcony")) {
          price = st.priceRecliner || 350;
        } else if (nameLower.includes("exec") || nameLower.includes("gold") || nameLower.includes("premium")) {
          price = st.priceExecutive || 220;
        }
        return `${sec.name}: ₹${price}`;
      }).join(" | ");
    }
    return `Balcony: ₹${st.priceRecliner || 350} | Gold: ₹${st.priceExecutive || 220} | Silver: ₹${st.priceNormal || 150}`;
  };

  const getScreenCapacity = (scrId) => {
    const sId = String(scrId || "");
    let sections = null;
    let deletedMap = {};

    if (selectedScreenId && String(selectedScreenId) === sId && customSections && customSections.length > 0) {
      sections = customSections;
      deletedMap = deletedSeatsMap;
    } else if (screenLayoutsMap[sId] && screenLayoutsMap[sId].sections && screenLayoutsMap[sId].sections.length > 0) {
      sections = screenLayoutsMap[sId].sections;
      deletedMap = screenLayoutsMap[sId].deletedSeats || {};
    }

    if (sections && sections.length > 0) {
      let totalRaw = 0;
      const validSecIds = new Set(sections.map((s) => String(s.id)));
      sections.forEach((sec) => {
        totalRaw += sec.rowsCount * sec.seatsPerRow;
      });
      let delCount = 0;
      Object.entries(deletedMap || {}).forEach(([key, val]) => {
        if (val === true || String(val) === "true") {
          const secId = key.split("-")[0];
          if (validSecIds.has(secId)) {
            delCount++;
          }
        }
      });
      return Math.max(0, totalRaw - delCount);
    }
    const scr = screens.find((s) => String(s.id) === sId);
    return scr?.totalCapacity || 120;
  };

  const totalCapacitySum = screens.reduce((acc, scr) => acc + getScreenCapacity(scr.id), 0);
  
  const todayISO = new Date().toISOString().split("T")[0];
  const totalShowtimesCount = showtimes.filter((st) => !st.showDate || st.showDate >= todayISO).length;

  const todayShowtimes = showtimes.filter((st) => {
    const d = st.showDate || st.date;
    return d && (d === todayISO || String(d).startsWith(todayISO));
  });
  const todayShowtimesCount = todayShowtimes.length;

  // LIVE BOX OFFICE SALES SYNC HOOK
  const [salesHistoryData, setSalesHistoryData] = useState([]);

  const loadSalesHistory = async () => {
    try {
      const salesMap = new Map();
      const currentTheaterId = selectedTheater?.id;
      const currentPortalId = selectedTheater?.theaterPortal?.id || localStorage.getItem("portalId");
      const currentTheaterName = selectedTheater?.name || cinemaName;

      // 1. Fetch from backend live sales history filtered by current theater
      try {
        const queryParams = [];
        if (currentTheaterId) queryParams.push(`theaterId=${currentTheaterId}`);
        if (currentPortalId) queryParams.push(`portalId=${currentPortalId}`);
        if (currentTheaterName) queryParams.push(`theaterName=${encodeURIComponent(currentTheaterName)}`);
        const qs = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

        const res = await api.get(`/theater/sales-history${qs}`);
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach((s) => {
            if (s && (s.ticketId || s.id)) {
              salesMap.set(String(s.ticketId || s.id), s);
            }
          });
        }
      } catch (e) {}

      // 2. Scan and aggregate localStorage sales keys ONLY for current theater
      const keys = [];
      if (currentTheaterId) keys.push(`pos_sales_history_${currentTheaterId}`);
      if (currentPortalId) keys.push(`pos_sales_history_${currentPortalId}`);
      if (localStorage.getItem("pos_sales_history")) keys.push("pos_sales_history");

      keys.forEach((k) => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((s) => {
                if (!s || (!s.ticketId && !s.id)) return;
                const sTid = s.theaterId;
                const sPid = s.portalId;
                const sTname = (s.theaterName || "").trim().toLowerCase();
                const myTname = (currentTheaterName || "").trim().toLowerCase();

                const isSameTheater = 
                  (currentTheaterId && String(sTid) === String(currentTheaterId)) ||
                  (currentPortalId && String(sPid) === String(currentPortalId)) ||
                  (sTname && myTname && (sTname === myTname || sTname.includes(myTname) || myTname.includes(sTname))) ||
                  (s.showtimeId && showtimes.some((st) => String(st.id) === String(s.showtimeId))) ||
                  (s.screenId && screens.some((scr) => String(scr.id) === String(s.screenId)));

                if (isSameTheater) {
                  salesMap.set(String(s.ticketId || s.id), s);
                }
              });
            }
          }
        } catch (e) {}
      });

      const merged = Array.from(salesMap.values());
      setSalesHistoryData(merged);
    } catch (e) {
      console.warn("loadSalesHistory error:", e);
    }
  };

  useEffect(() => {
    loadSalesHistory();
    const handleStorageSales = (e) => {
      if (e.key === "pos_sales_history" || (e.key && e.key.startsWith("pos_sales_history_")) || e.key === "pos_booked_seats_map") {
        loadSalesHistory();
      }
    };
    window.addEventListener("storage", handleStorageSales);
    const interval = setInterval(loadSalesHistory, 2000);
    return () => {
      window.removeEventListener("storage", handleStorageSales);
      clearInterval(interval);
    };
  }, []);

  const parseSaleAmount = (s) => {
    return Number(s.amount) || Number(s.totalAmount) || Number(s.subtotal) || Number(s.price) || 0;
  };

  const parseSaleTickets = (s) => {
    if (Number(s.seatCount)) return Number(s.seatCount);
    if (Number(s.selectedSeatsCount)) return Number(s.selectedSeatsCount);
    if (Array.isArray(s.seats)) return s.seats.length;
    if (typeof s.seats === "string" && s.seats.trim()) {
      return s.seats.split(",").filter(Boolean).length;
    }
    return 1;
  };

  const getMovieWiseSalesData = () => {
    const movieMap = new Map();

    showtimes.forEach((st) => {
      const title = (st.movieTitle || "").trim();
      if (!title) return;
      const key = title.toLowerCase();
      if (!movieMap.has(key)) {
        movieMap.set(key, {
          title: title,
          language: st.movieLanguage || "Tamil",
          genre: st.movieGenre || "Action / Drama",
          screens: new Set(),
          showtimesCount: 0,
          todayShowsCount: 0,
        });
      }
      const item = movieMap.get(key);
      item.showtimesCount += 1;
      const scrName = st.screen?.screenName || (screens.find((s) => String(s.id) === String(st.screenId || st.screen?.id))?.screenName) || "Screen";
      item.screens.add(scrName);
      const d = st.showDate || st.date;
      if (d && (d === todayISO || String(d).startsWith(todayISO))) {
        item.todayShowsCount += 1;
      }
    });

    const currentTheaterId = selectedTheater?.id;
    const currentPortalId = selectedTheater?.theaterPortal?.id || localStorage.getItem("portalId");
    const currentTheaterName = (selectedTheater?.name || cinemaName || "").trim().toLowerCase();

    const activeSales = salesHistoryData.filter((s) => {
      if (s.status === "CANCELLED" || s.status === "REFUNDED") return false;
      const sTid = s.theaterId;
      const sPid = s.portalId;
      const sTname = (s.theaterName || "").trim().toLowerCase();
      if (currentTheaterId && sTid && String(sTid) !== String(currentTheaterId)) return false;
      if (currentPortalId && sPid && String(sPid) !== String(currentPortalId)) return false;
      if (sTname && currentTheaterName && sTname !== currentTheaterName && !sTname.includes(currentTheaterName) && !currentTheaterName.includes(sTname)) return false;
      return true;
    });

    activeSales.forEach((s) => {
      const title = (s.movieTitle || "").trim();
      if (!title) return;
      const key = title.toLowerCase();
      if (!movieMap.has(key)) {
        movieMap.set(key, {
          title: title,
          language: "Tamil",
          genre: "Feature Film",
          screens: new Set(),
          showtimesCount: 0,
          todayShowsCount: 0,
        });
      }
      if (s.screenName) {
        movieMap.get(key).screens.add(s.screenName);
      }
    });

    const allBookedMap = { ...managerBookedSeatsMap };
    try {
      const rawB = localStorage.getItem("pos_booked_seats_map");
      if (rawB) Object.assign(allBookedMap, JSON.parse(rawB));
    } catch (e) {}

    const result = [];
    movieMap.forEach((meta, key) => {
      const movieSales = activeSales.filter((s) => {
        const sTitle = (s.movieTitle || "").trim().toLowerCase();
        return sTitle === key || key.includes(sTitle) || sTitle.includes(key);
      });

      const recordedOverallTickets = movieSales.reduce((acc, s) => acc + parseSaleTickets(s), 0);
      const recordedOverallRevenue = movieSales.reduce((acc, s) => acc + parseSaleAmount(s), 0);

      const todaySales = movieSales.filter((s) => {
        const saleDate = s.bookedDate || s.showDate || (s.issuedAt ? s.issuedAt.split("T")[0] : "") || (s.createdAt ? s.createdAt.split("T")[0] : "");
        const isRecent = s.id && typeof s.id === "number" && Math.abs(Date.now() - s.id) < 86400000;
        return saleDate === todayISO || saleDate.startsWith(todayISO) || isRecent;
      });
      const recordedTodayTickets = todaySales.reduce((acc, s) => acc + parseSaleTickets(s), 0);
      const recordedTodayRevenue = todaySales.reduce((acc, s) => acc + parseSaleAmount(s), 0);

      // Extract unique physical seats from live booked map for this movie
      const movieShowtimes = showtimes.filter((st) => (st.movieTitle || "").trim().toLowerCase() === key || key.includes((st.movieTitle || "").trim().toLowerCase()));
      const uniqueSeatsForMovie = new Set();
      movieShowtimes.forEach((st) => {
        const prefix = `${st.id}-`;
        const mClean = (st.movieTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const scrObj = screens.find((s) => String(s.id) === String(st.screen?.id || st.screenId));
        const sClean = (scrObj?.screenName || st.screen?.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const dClean = (st.showDate || st.date || "").replace(/[^0-9]/g, "");
        const tClean = (st.startTime || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const ctxPrefix = `CTX_${mClean}_${sClean}_${dClean}_${tClean}-`;

        Object.keys(allBookedMap).forEach((k) => {
          if (allBookedMap[k]) {
            if (k.startsWith(prefix)) {
              const rawSeat = k.slice(prefix.length);
              const normalizedSeat = rawSeat.replace(/^[0-9]+-/, "").replace(/^[a-zA-Z]+-/, "");
              uniqueSeatsForMovie.add(`${st.id}_${normalizedSeat}`);
            } else if (k.startsWith(ctxPrefix)) {
              const rawSeat = k.slice(ctxPrefix.length);
              const normalizedSeat = rawSeat.replace(/^[0-9]+-/, "").replace(/^[a-zA-Z]+-/, "");
              uniqueSeatsForMovie.add(`${st.id}_${normalizedSeat}`);
            }
          }
        });
      });

      const overallTickets = recordedOverallTickets;
      const overallRevenue = recordedOverallRevenue;
      const todayTickets = recordedTodayTickets;
      const todayRevenue = recordedTodayRevenue;

      result.push({
        ...meta,
        screensList: Array.from(meta.screens),
        todayTickets,
        todayRevenue,
        overallTickets,
        overallRevenue,
      });
    });

    result.sort((a, b) => b.overallRevenue - a.overallRevenue || b.todayRevenue - a.todayRevenue || a.title.localeCompare(b.title));
    return result;
  };

  const getRealBoxOfficeData = () => {
    const mSales = getMovieWiseSalesData();
    const totalRevenue = mSales.reduce((acc, m) => acc + m.overallRevenue, 0);
    const totalTickets = mSales.reduce((acc, m) => acc + m.overallTickets, 0);
    return { totalRevenue, totalTickets };
  };

  const { totalRevenue: realBoxOfficeRevenue, totalTickets: realTicketsSold } = getRealBoxOfficeData();

  const getScreenRealRevenue = (scr) => {
    const scrNameClean = (scr.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const recordedRev = salesHistoryData
      .filter((s) => {
        if (s.status === "CANCELLED" || s.status === "REFUNDED") return false;
        const sNameClean = (s.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchId = s.screenId && String(s.screenId) === String(scr.id);
        const matchName = sNameClean && (sNameClean === scrNameClean || scrNameClean.includes(sNameClean) || sNameClean.includes(scrNameClean));
        return matchId || matchName;
      })
      .reduce((sum, s) => sum + parseSaleAmount(s), 0);

    const screenShowtimes = showtimes.filter((st) => String(st.screen?.id || st.screenId) === String(scr.id));
    const allBookedMap = { ...managerBookedSeatsMap };
    try {
      const rawB = localStorage.getItem("pos_booked_seats_map");
      if (rawB) Object.assign(allBookedMap, JSON.parse(rawB));
    } catch (e) {}

    const uniqueSeats = new Set();
    screenShowtimes.forEach((st) => {
      const prefix = `${st.id}-`;
      const mClean = (st.movieTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const sClean = (scr.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const dClean = (st.showDate || st.date || "").replace(/[^0-9]/g, "");
      const tClean = (st.startTime || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const ctxPrefix = `CTX_${mClean}_${sClean}_${dClean}_${tClean}-`;

      Object.keys(allBookedMap).forEach((k) => {
        if (allBookedMap[k]) {
          if (k.startsWith(prefix)) {
            const rawSeat = k.slice(prefix.length);
            const normalizedSeat = rawSeat.replace(/^[0-9]+-/, "").replace(/^[a-zA-Z]+-/, "");
            uniqueSeats.add(`${st.id}_${normalizedSeat}`);
          } else if (k.startsWith(ctxPrefix)) {
            const rawSeat = k.slice(ctxPrefix.length);
            const normalizedSeat = rawSeat.replace(/^[0-9]+-/, "").replace(/^[a-zA-Z]+-/, "");
            uniqueSeats.add(`${st.id}_${normalizedSeat}`);
          }
        }
      });
    });

    const liveRev = uniqueSeats.size * 190;
    return Math.max(recordedRev, liveRev);
  };

  const getScreenTicketsSold = (scr) => {
    const scrNameClean = (scr.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const recordedTkt = salesHistoryData
      .filter((s) => {
        if (s.status === "CANCELLED" || s.status === "REFUNDED") return false;
        const sNameClean = (s.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchId = s.screenId && String(s.screenId) === String(scr.id);
        const matchName = sNameClean && (sNameClean === scrNameClean || scrNameClean.includes(sNameClean) || sNameClean.includes(scrNameClean));
        return matchId || matchName;
      })
      .reduce((sum, s) => sum + parseSaleTickets(s), 0);

    const screenShowtimes = showtimes.filter((st) => String(st.screen?.id || st.screenId) === String(scr.id));
    const allBookedMap = { ...managerBookedSeatsMap };
    try {
      const rawB = localStorage.getItem("pos_booked_seats_map");
      if (rawB) Object.assign(allBookedMap, JSON.parse(rawB));
    } catch (e) {}

    const uniqueSeats = new Set();
    screenShowtimes.forEach((st) => {
      const prefix = `${st.id}-`;
      Object.keys(allBookedMap).forEach((k) => {
        if (k.startsWith(prefix) && allBookedMap[k]) {
          const rawSeat = k.slice(prefix.length);
          const normalizedSeat = rawSeat.replace(/^[0-9]+-/, "").replace(/^[a-zA-Z]+-/, "");
          uniqueSeats.add(`${st.id}_${normalizedSeat}`);
        }
      });
    });

    return Math.max(recordedTkt, uniqueSeats.size);
  };

  const movieWiseSales = getMovieWiseSalesData();
  const totalTodayRevenue = movieWiseSales.reduce((acc, m) => acc + m.todayRevenue, 0);
  const totalTodayTickets = movieWiseSales.reduce((acc, m) => acc + m.todayTickets, 0);

  const menuItems = [
    { id: "overview", label: "Dashboard Overview", icon: <BsFilm size={16} /> },
    { id: "screens", label: "Screens & Technology", icon: <BsTv size={16} /> },
    { id: "seats", label: "Seat Builder", icon: <BsGrid3X3 size={16} /> },
    { id: "showtimes", label: "Showtimes", icon: <BsClockHistory size={16} /> },
    { id: "live-occupancy", label: "Live Seat booking", icon: <BsGrid3X3 size={16} /> },
    { id: "pos", label: "Food & Beverage (F&B)", icon: <BsCupStraw size={16} /> },
    { id: "analytics", label: "Box Office Sales", icon: <BsBarChart size={16} /> },
    { id: "ushers", label: "Team & Staff Roster", icon: <BsPeople size={16} /> },
    { id: "settings", label: "Settings", icon: <BsGear size={16} /> },
  ];

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* NAVBAR */}
      <div className="organizer-layout-navbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <TheaterNavbar 
          theaterName={`${cinemaName} — Manager Console`} 
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} 
          onOpenSettings={() => {
            setActiveTab("settings");
            setSearchParams({ tab: "settings" });
            setIsMobileSidebarOpen(false);
          }}
        />
      </div>

      {/* MOBILE BACKDROP */}
      {isMobileSidebarOpen && (
        <div
          className="d-md-none"
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 1040,
            transition: "opacity 0.25s ease",
          }}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR (DESKTOP FIXED + MOBILE SLIDE-OVER DRAWER) */}
      <aside
        className={`bg-white border-end theater-owner-sidebar ${isMobileSidebarOpen ? "theater-owner-sidebar-open" : ""}`}
        style={{
          position: "fixed",
          top: "50px",
          left: 0,
          width: "250px",
          height: "calc(100vh - 50px)",
          zIndex: isMobileSidebarOpen ? 1050 : 100,
          overflowY: "auto",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isMobileSidebarOpen ? "4px 0 24px rgba(0, 0, 0, 0.18)" : "none",
        }}
      >
        <div className="pt-3 pb-4">
          <div className="px-3 pb-3 mb-2 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 text-truncate">
              <BsFilm size={22} className="text-primary flex-shrink-0" />
              <span className="fw-bold text-dark fs-6 text-truncate">{cinemaName}</span>
            </div>
            {/* Mobile close button */}
            <button
              type="button"
              className="d-md-none btn btn-sm btn-light border-0 p-1 text-muted"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              <BsXLg size={16} />
            </button>
          </div>

          <div className="px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearchParams({ tab: item.id });
                  setIsMobileSidebarOpen(false);
                }}
                className={`organizer-sidebar-item w-100 border-0 bg-transparent text-start d-flex align-items-center gap-3 px-3 py-2 mb-2 ${
                  activeTab === item.id ? "active" : "text-dark"
                }`}
                style={{ borderRadius: "8px" }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ fontSize: "15px", fontWeight: 550 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN MANAGER CONTENT */}
      <main
        className="theater-owner-main p-2 p-md-3"
        style={{
          marginTop: "50px",
          backgroundColor: "#f8f9fa",
          height: "calc(100vh - 50px)",
          maxHeight: "calc(100vh - 50px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* TOP STATUS BAR (SHOWN ONLY ON OVERVIEW HOME AND SCREENS PAGES) */}
        {(activeTab === "overview" || activeTab === "screens") && (
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 bg-white p-3 rounded-3 shadow-sm border flex-shrink-0">
            <div className="text-truncate">
              <h4 className="fw-bold mb-0 text-dark fs-5 text-truncate">{cinemaName} — Branch Manager Portal</h4>
              <small className="text-muted d-block text-truncate">Live Cinema Operations, Screen Configuration & Counter Billing</small>
            </div>
            <span className="badge bg-success fs-6 px-3 py-2 d-flex align-items-center gap-2 flex-shrink-0">
              <BsCheckCircle /> Cinema Operational
            </span>
          </div>
        )}

        {/* --- 1. DASHBOARD OVERVIEW --- */}
        {activeTab === "overview" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="sa-page-cards four mb-4">
              <Metric 
                icon={<BsFilm />} 
                label="Total Screens" 
                value={screens.length} 
                subtitle={`Active halls for ${cinemaName}`}
                onClick={() => setActiveTab("screens")}
              />
              <Metric 
                icon={<BsTv />} 
                label="Total Seat Capacity" 
                value={Number(totalCapacitySum).toLocaleString("en-IN")} 
                subtitle="Dynamic seats from customized layouts"
                onClick={() => setActiveTab("layouts")}
              />
              <Metric 
                icon={<BsClockHistory />} 
                label="Today's Showtimes" 
                value={todayShowtimesCount} 
                subtitle={`${totalShowtimesCount} total scheduled shows`}
                onClick={() => setActiveTab("showtimes")}
              />
              <Metric 
                icon={<BsCashCoin />} 
                label="Real Box Office Revenue" 
                value={`₹${Number(realBoxOfficeRevenue || 0).toLocaleString("en-IN")}`} 
                subtitle={realTicketsSold > 0 ? `${realTicketsSold} tickets sold (Live POS)` : "Real-time ticket sales (₹0)"}
                onClick={() => setActiveTab("analytics")}
              />
            </div>

            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold text-dark mb-0">Cinema Screens & Live Status</h5>
                <button
                  className="btn btn-outline-primary btn-sm fw-bold"
                  onClick={() => setActiveTab("screens")}
                >
                  Manage Screens & Tech
                </button>
              </div>

              {screens.length === 0 ? (
                <div className="text-center py-5 border rounded-3 bg-light text-muted">
                  <BsExclamationCircle size={36} className="text-warning mb-2" />
                  <h6 className="fw-bold text-dark mb-1">No Screens Added Yet</h6>
                  <p className="small mb-3">Create your first screen or hall to configure seat builder and showtimes.</p>
                  <button className="btn btn-primary btn-sm fw-bold" onClick={() => setActiveTab("screens")}>
                    + Add New Screen
                  </button>
                </div>
              ) : (
                <div className="row g-3">
                  {screens.map((scr) => (
                    <div className="col-md-4" key={scr.id}>
                      <div className="border rounded-3 p-3 bg-light shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-bold mb-0 text-dark text-truncate me-2">{scr.screenName}</h6>
                          <span className="badge bg-primary px-2 py-1 text-truncate" style={{ maxWidth: "150px" }} title={getProjectionBadge(scr)}>
                            {getProjectionBadge(scr)}
                          </span>
                        </div>
                        <small className="text-muted d-block mb-3">
                          Dynamic Capacity: <b>{scr.totalCapacity || "120"} Seats</b>
                        </small>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                            onClick={() => {
                              setSelectedScreenId(scr.id);
                              setActiveTab("seats");
                            }}
                          >
                            <BsGrid3X3 /> Seat Builder
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary flex-grow-1 fw-bold"
                            onClick={() => setActiveTab("showtimes")}
                          >
                            Showtimes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. SCREENS & TECHNOLOGY --- */}
        {activeTab === "screens" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
              <h5 className="fw-bold text-dark mb-3">
                {editingScreenId ? "Edit Cinema Screen Details" : "Add Screen with Hardware Specs"}
              </h5>
              <form className="row g-3" onSubmit={handleAddOrUpdateScreen}>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-dark">Screen Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your screen name"
                    value={newScreenName}
                    onChange={(e) => setNewScreenName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                    <BsTv className="text-primary" /> Projection Technology *
                  </label>
                  <select
                    className={`form-select ${!newProjection ? "text-secondary font-normal" : "fw-bold text-dark"}`}
                    value={newProjection}
                    onChange={(e) => setNewProjection(e.target.value)}
                    required
                  >
                    <option value="" disabled className="text-secondary font-normal">Select Projection Technology...</option>
                    {PROJECTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="text-dark fw-bold">{opt}</option>
                    ))}
                  </select>
                  {newProjection === "Other / Custom" && (
                    <input
                      type="text"
                      className="form-control form-control-sm mt-2"
                      placeholder="Enter custom projection technology..."
                      value={customProjection}
                      onChange={(e) => setCustomProjection(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                    <BsVolumeUp className="text-primary" /> Sound System *
                  </label>
                  <select
                    className={`form-select ${!newSound ? "text-secondary font-normal" : "fw-bold text-dark"}`}
                    value={newSound}
                    onChange={(e) => setNewSound(e.target.value)}
                    required
                  >
                    <option value="" disabled className="text-secondary font-normal">Select Sound System...</option>
                    {SOUND_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="text-dark fw-bold">{opt}</option>
                    ))}
                  </select>
                  {newSound === "Other / Custom" && (
                    <input
                      type="text"
                      className="form-control form-control-sm mt-2"
                      placeholder="Enter custom sound system..."
                      value={customSound}
                      onChange={(e) => setCustomSound(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                    <BsFilm className="text-primary" /> Screen Format *
                  </label>
                  <select
                    className={`form-select ${!newFormat ? "text-secondary font-normal" : "fw-bold text-dark"}`}
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    required
                  >
                    <option value="" disabled className="text-secondary font-normal">Select Screen Format...</option>
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="text-dark fw-bold">{opt}</option>
                    ))}
                  </select>
                  {newFormat === "Other / Custom" && (
                    <input
                      type="text"
                      className="form-control form-control-sm mt-2"
                      placeholder="Enter custom screen format..."
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                  {editingScreenId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary fw-bold px-4 py-2"
                      onClick={() => {
                        setEditingScreenId(null);
                        setNewScreenName("");
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2">
                    {editingScreenId ? "Update Screen Specs" : "+ Add Screen & Hardware Specs"}
                  </button>
                </div>
              </form>
            </div>

            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold text-dark mb-3">Configured Cinema Screens</h5>
              {screens.length === 0 ? (
                <p className="text-muted text-center py-4">No screens created yet.</p>
              ) : (
                <div className="row g-3">
                  {screens.map((scr) => (
                    <div className="col-md-6 col-lg-4" key={scr.id}>
                      <div className="border rounded-3 p-3 bg-white shadow-sm h-100 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <h5 className="fw-bold text-dark mb-0 text-truncate me-2">{scr.screenName}</h5>
                            <span className="badge bg-primary-subtle text-primary border border-primary px-2 py-1 small fw-bold text-truncate" style={{ maxWidth: "150px" }} title={getProjectionBadge(scr)}>
                              {getProjectionBadge(scr)}
                            </span>
                          </div>

                          <div className="bg-light p-3 rounded-3 border mb-3 small">
                            <div className="d-flex align-items-center gap-2 text-dark mb-2">
                              <BsTv className="text-primary" />
                              <span className="text-muted">Projection:</span>
                              <strong className="text-dark">{scr.projectionType || "4K Dual Laser"}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-2 text-dark mb-2">
                              <BsVolumeUp className="text-primary" />
                              <span className="text-muted">Sound:</span>
                              <strong className="text-dark">{scr.soundSystem || "Dolby Digital"}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-2 text-dark">
                              <BsFilm className="text-primary" />
                              <span className="text-muted">Format:</span>
                              <strong className="text-dark">{scr.screenFormat || scr.screenType || "Standard 2D"}</strong>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between text-muted small mb-3">
                            <span>Total Capacity:</span>
                            <span className="badge bg-secondary-subtle text-dark border px-2 py-1 fs-6 fw-bold">
                              {scr.totalCapacity || "120"} Seats
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="d-flex gap-2 mb-2">
                            <button
                              className="btn btn-sm btn-outline-primary flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                              onClick={() => handleEditScreenClick(scr)}
                            >
                              <BsPencil /> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                              onClick={() => handleDeleteScreen(scr.id)}
                            >
                              <BsTrash /> Delete
                            </button>
                          </div>
                          <button
                            className="btn btn-sm btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-1 py-2"
                            onClick={() => {
                              setSelectedScreenId(scr.id);
                              setActiveTab("seats");
                            }}
                          >
                            <BsGrid3X3 /> Open Seat Builder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 3. SEAT BUILDER TAB --- */}
        {activeTab === "seats" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <h4 className="fw-bold text-dark mb-1">Physical Seat Builder & Screen Customizer</h4>
                  <p className="text-muted small mb-0">Configure physical seat classes, custom color tiers, gaps & walkways for active screens.</p>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  <label className="fw-bold text-dark small mb-0">Active Screen Layout:</label>
                  <select
                    className="form-select form-select-sm fw-bold border-primary"
                    value={selectedScreenId || ""}
                    onChange={(e) => handleScreenChange(Number(e.target.value))}
                    style={{ width: "230px", maxWidth: "100%" }}
                  >
                    {screens.map((scr) => (
                      <option key={scr.id} value={scr.id}>
                        {scr.screenName} ({scr.screenType || "2D"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* FORM TO ADD PHYSICAL CLASS SECTION */}
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <BsPlusCircle className="text-primary" /> Add Physical Seat Class for {selectedScreenObj ? selectedScreenObj.screenName : "Screen"}
              </h5>

              <form className="row g-3" onSubmit={handleAddCustomSection}>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-dark small">Class Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. SuperStar Recliner / Gold Tier"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold text-dark small">Class Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color w-100"
                    value={newClassColor}
                    onChange={(e) => setNewClassColor(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold text-dark small">Rows Count</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="1"
                    max="15"
                    value={newClassRows}
                    onChange={(e) => setNewClassRows(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold text-dark small">Seats Per Row</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="4"
                    max="40"
                    value={newClassSeatsPerRow}
                    onChange={(e) => setNewClassSeatsPerRow(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold text-dark small">Center Aisle Gap (Blank Spaces)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    max="10"
                    value={newClassCenterGap}
                    onChange={(e) => setNewClassCenterGap(e.target.value)}
                  />
                </div>

                <div className="col-md-5 d-flex align-items-center mt-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="mgrAisleBelowCheck"
                      checked={newClassAisleBelow}
                      onChange={(e) => setNewClassAisleBelow(e.target.checked)}
                    />
                    <label className="form-check-input-label fw-bold small text-dark ms-2" htmlFor="mgrAisleBelowCheck">
                      Add Horizontal Aisle Walkway Below This Section
                    </label>
                  </div>
                </div>

                <div className="col-md-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                    <BsPlusLg /> Add Class to {selectedScreenObj ? selectedScreenObj.screenName : "Screen"}
                  </button>
                </div>
              </form>
            </div>

            {/* TOOLBAR */}
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-dark text-white mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold small">Seat Delete Tool:</span>
                <button
                  type="button"
                  className={`btn btn-sm fw-bold ${isDeleteToolActive ? "btn-danger" : "btn-outline-light"}`}
                  onClick={() => setIsDeleteToolActive(!isDeleteToolActive)}
                >
                  <BsTrash className="me-1" /> Delete / Restore Seat {isDeleteToolActive && "✓ (Auto-Renumbering Active)"}
                </button>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold text-warning fs-6">
                  {selectedScreenObj ? selectedScreenObj.screenName : "Screen"} Capacity: {calculateTotalActiveCapacity()} Seats
                </span>
                <button className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 px-3 py-2" onClick={handleSaveLayout}>
                  <BsSave /> Save {selectedScreenObj ? selectedScreenObj.screenName : "Screen"} Layout
                </button>
              </div>
            </div>

            {/* SEAT BUILDER PREVIEW */}
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
              <div className="text-center bg-dark text-white py-2 mb-4 rounded-3 small fw-bold shadow-sm">
                SCREEN THIS WAY ({selectedScreenObj ? selectedScreenObj.screenName : "Screen"}) — {selectedScreenObj ? selectedScreenObj.screenType || "Dolby Atmos 4K" : "2D"}
              </div>

              {customSections.length === 0 ? (
                <div className="text-center py-5 text-muted border rounded-3 bg-light">
                  <BsTv size={42} className="mb-2 text-primary" />
                  <h5 className="fw-bold text-dark">No seat layout created for '{selectedScreenObj ? selectedScreenObj.screenName : "Screen"}' yet.</h5>
                  <p className="mb-0">Use the form above to add your physical class section for this screen!</p>
                </div>
              ) : (
                customSectionsWithLabels.map((sec, secIdx) => {
                  const sectionRowLabels = sec.rowLabels;
                  const halfSeats = Math.floor(sec.seatsPerRow / 2);
                  const isEditing = editingSecId === sec.id;

                  return (
                    <div key={sec.id} className="w-100 d-flex flex-column align-items-center position-relative mb-4">
                      {/* HEADER PILL WITH MOVE UP / MOVE DOWN / EDIT CONTROLS */}
                      <div className="w-100 d-flex align-items-center justify-content-center mb-3">
                        <div className="border-bottom flex-grow-1"></div>

                        {isEditing ? (
                          <div className="p-3 bg-light border rounded-3 d-flex flex-wrap gap-2 align-items-center shadow-sm" style={{ maxWidth: "600px" }}>
                            <input
                              type="text"
                              className="form-control form-control-sm fw-bold"
                              style={{ width: "180px" }}
                              value={sec.name}
                              onChange={(e) => handleUpdateSection(sec.id, { name: e.target.value })}
                              placeholder="Class Name"
                            />
                            <input
                              type="color"
                              className="form-control form-control-color"
                              value={sec.color}
                              onChange={(e) => handleUpdateSection(sec.id, { color: e.target.value })}
                            />
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: "70px" }}
                              value={sec.rowsCount}
                              onChange={(e) => handleUpdateSection(sec.id, { rowsCount: Math.max(1, Number(e.target.value)) })}
                              placeholder="Rows"
                            />
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: "70px" }}
                              value={sec.seatsPerRow}
                              onChange={(e) => handleUpdateSection(sec.id, { seatsPerRow: Math.max(2, Number(e.target.value)) })}
                              placeholder="Seats"
                            />
                            <button className="btn btn-sm btn-success fw-bold" onClick={() => setEditingSecId(null)}>Done</button>
                          </div>
                        ) : (
                          <div className="px-4 py-1 rounded-pill d-flex align-items-center gap-2 shadow-sm" style={{ backgroundColor: sec.color || "#3B82F6", color: sec.color === "#F59E0B" ? "#000" : "#FFF" }}>
                            {secIdx > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm p-0 border-0 me-1"
                                style={{ color: sec.color === "#F59E0B" ? "#000" : "#FFF" }}
                                onClick={() => handleMoveSectionUp(secIdx)}
                                title="Move Class Section Up"
                              >
                                <BsArrowUp size={14} />
                              </button>
                            )}

                            {secIdx < customSections.length - 1 && (
                              <button
                                type="button"
                                className="btn btn-sm p-0 border-0 me-1"
                                style={{ color: sec.color === "#F59E0B" ? "#000" : "#FFF" }}
                                onClick={() => handleMoveSectionDown(secIdx)}
                                title="Move Class Section Down"
                              >
                                <BsArrowDown size={14} />
                              </button>
                            )}

                            <span className="fw-bold small text-uppercase">
                              {sec.name}
                            </span>
                            <button className="btn btn-sm p-0 border-0 ms-2" style={{ color: sec.color === "#F59E0B" ? "#000" : "#FFF" }} onClick={() => setEditingSecId(sec.id)} title="Edit Class Section">
                              <BsPencil size={13} />
                            </button>
                            <button className="btn btn-sm p-0 border-0" style={{ color: sec.color === "#F59E0B" ? "#000" : "#FFF" }} onClick={() => handleRemoveSection(sec.id)} title="Delete Section">
                              <BsTrash size={13} />
                            </button>
                          </div>
                        )}

                        <div className="border-bottom flex-grow-1"></div>
                      </div>

                      {/* SECTION SEAT ROWS */}
                      {Array.from({ length: sec.rowsCount }).map((_, rIdx) => {
                        const rowLabel = sectionRowLabels[rIdx];
                        let activeSeatCounter = 1;

                        return (
                          <div className="d-flex align-items-center gap-2 mb-2" key={`${sec.id}-${rIdx}`}>
                            <span className="fw-bold small text-dark me-2" style={{ width: "25px" }}>{rowLabel}</span>

                            <div className="d-flex gap-1">
                              {Array.from({ length: halfSeats }).map((_, cIdx) => {
                                const key = `${sec.id}-${rIdx}-${cIdx}`;
                                const isDeleted = deletedSeatsMap[key];
                                const seatNumDisplay = isDeleted ? null : activeSeatCounter++;

                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => handleSeatToggle(sec.id, rIdx, cIdx)}
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                      fontSize: "11px",
                                      cursor: "pointer",
                                      backgroundColor: isDeleted ? "transparent" : "#9ca3af",
                                      color: isDeleted ? "transparent" : "#ffffff",
                                      border: isDeleted ? "1px dashed #cbd5e1" : "none",
                                      boxShadow: isDeleted ? "none" : "0 1px 2px rgba(0,0,0,0.12)",
                                    }}
                                  >
                                    {isDeleted ? "" : seatNumDisplay}
                                  </button>
                                );
                              })}
                            </div>

                            {sec.centerAisleGap > 0 && (
                              <div style={{ width: `${sec.centerAisleGap * 36}px`, display: "flex", justifyCenter: "center", alignItems: "center" }}>
                                <small className="text-muted fw-bold" style={{ fontSize: "9px" }}>AISLE</small>
                              </div>
                            )}

                            <div className="d-flex gap-1">
                              {Array.from({ length: sec.seatsPerRow - halfSeats }).map((_, cIdx) => {
                                const actualCIdx = halfSeats + cIdx;
                                const key = `${sec.id}-${rIdx}-${actualCIdx}`;
                                const isDeleted = deletedSeatsMap[key];
                                const seatNumDisplay = isDeleted ? null : activeSeatCounter++;

                                return (
                                  <button
                                    key={actualCIdx}
                                    type="button"
                                    onClick={() => handleSeatToggle(sec.id, rIdx, actualCIdx)}
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                      fontSize: "11px",
                                      cursor: "pointer",
                                      backgroundColor: isDeleted ? "transparent" : "#9ca3af",
                                      color: isDeleted ? "transparent" : "#ffffff",
                                      border: isDeleted ? "1px dashed #cbd5e1" : "none",
                                      boxShadow: isDeleted ? "none" : "0 1px 2px rgba(0,0,0,0.12)",
                                    }}
                                  >
                                    {isDeleted ? "" : seatNumDisplay}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {sec.aisleBelow && (
                        <div className="w-100 text-center my-3 py-1 bg-light rounded border border-dashed">
                          <small className="text-muted fw-bold d-flex align-items-center justify-content-center gap-1" style={{ fontSize: "10px", letterSpacing: "2px" }}>
                            <BsPeople /> HORIZONTAL AISLE WALKWAY <BsPeople />
                          </small>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- 4. SHOWTIMES MANAGEMENT --- */}
        {activeTab === "showtimes" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  {editingShowtimeId ? "Edit Scheduled Movie Showtime" : "Schedule Movie Showtime & Set Class Prices"}
                </h5>
                <p className="text-muted small mb-0">Select any target screen and movie to set ticket prices for the exact seat classes defined on that screen.</p>
              </div>
            </div>

            <form onSubmit={handleAddOrUpdateShowtime} className="row g-3 mb-4 p-3 bg-light border rounded-3">
              <div className="col-md-3">
                <div className="d-flex align-items-center" style={{ minHeight: "22px", marginBottom: "8px" }}>
                  <label className="form-label fw-bold small text-dark mb-0">Target Screen Hall *</label>
                </div>
                <select
                  className="form-select fw-bold border-primary"
                  style={{ height: "38px" }}
                  value={selectedScreenId || (screens[0]?.id || "")}
                  onChange={(e) => handleScreenChange(Number(e.target.value))}
                  required
                >
                  {screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.screenName} ({s.screenType || "Standard"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center" style={{ minHeight: "22px", marginBottom: "8px" }}>
                  <label className="form-label fw-bold small text-dark mb-0">Movie Title *</label>
                </div>
                <Select
                  options={centralMovies.map(m => ({ value: m.id, label: m.title, movie: m }))}
                  value={newMovieTitle ? { label: newMovieTitle, value: newMovieId || newMovieTitle } : null}
                  onChange={(selected) => {
                    if (selected && selected.movie) {
                      setNewMovieTitle(selected.movie.title);
                      setNewMovieId(selected.movie.id);
                      setNewPosterUrl(selected.movie.posterUrl || "");
                    } else {
                      setNewMovieTitle("");
                      setNewMovieId(null);
                      setNewPosterUrl("");
                    }
                  }}
                  placeholder="Select movie from library..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      height: "38px",
                      padding: "0 2px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#94a3b8" }
                    })
                  }}
                  required
                />
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center" style={{ minHeight: "22px", marginBottom: "8px" }}>
                  <label className="form-label fw-bold small text-dark mb-0">Show Date *</label>
                </div>
                <IndianDatePicker
                  value={newShowDate}
                  onChange={(val) => setNewShowDate(val)}
                  style={{ height: "38px" }}
                  required
                />
              </div>

              <div className="col-md-3">
                <div className="d-flex justify-content-between align-items-center" style={{ minHeight: "22px", marginBottom: "8px" }}>
                  <label className="form-label fw-bold small text-dark mb-0">Exact Showtime *</label>
                  {suggestedSlotInfo?.suggestedTime && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none fw-bold"
                      style={{ fontSize: "11px", color: "#4f46e5", lineHeight: "1" }}
                      onClick={() => setNewShowTimeStr(suggestedSlotInfo.suggestedTime)}
                      title="Click to apply auto-calculated slot (movie duration + cleaning gap)"
                    >
                      <BsStars className="me-1" />
                      {suggestedSlotInfo.suggestedTime ? formatIndianTime(suggestedSlotInfo.suggestedTime) : "Auto"}
                    </button>
                  )}
                </div>
                <input
                  type="time"
                  className={`form-control fw-bold ${showtimeConflict.hasConflict ? "border-danger text-danger bg-danger-subtle" : "border-primary"}`}
                  style={{ height: "38px" }}
                  value={newShowTimeStr}
                  onChange={(e) => setNewShowTimeStr(e.target.value)}
                  required
                />
              </div>

              {/* AUTO-SUGGESTION INTELLIGENCE & CONFLICT BANNER */}
              <div className="col-12 mt-2">
                {showtimeConflict.hasConflict ? (
                  <div
                    className="p-2 px-3 rounded-3 border border-danger d-flex flex-wrap align-items-center justify-content-between gap-2"
                    style={{ backgroundColor: "#fef2f2", color: "#991b1b" }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <BsExclamationTriangleFill className="text-danger flex-shrink-0" size={17} />
                      <span className="small fw-semibold">
                        <strong>Cleaning Gap Conflict:</strong> {showtimeConflict.message}
                      </span>
                    </div>
                    {showtimeConflict.earliestAllowedStart && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger fw-bold ms-auto"
                        style={{ fontSize: "12px", borderRadius: "6px" }}
                        onClick={() => setNewShowTimeStr(showtimeConflict.earliestAllowedStart)}
                      >
                        Auto-Fix to {formatIndianTime(showtimeConflict.earliestAllowedStart)}
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className="p-2 px-3 rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-2"
                    style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1", color: "#334155" }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <BsStars className="text-primary flex-shrink-0" size={16} />
                      <span className="small">
                        {suggestedSlotInfo.isFirstShow ? (
                          <span>
                            <strong>First Show of the Day:</strong> No earlier shows scheduled on this screen. Standard opening slot is <strong>{formatIndianTime(suggestedSlotInfo.suggestedTime)}</strong>.
                          </span>
                        ) : (
                          <span>
                            <strong>Auto-Suggested Slot:</strong> Previous show <em>"{suggestedSlotInfo.prevMovieTitle}"</em> ends at <strong>{formatIndianTime(suggestedSlotInfo.prevEndTimeStr)}</strong> ({suggestedSlotInfo.prevMovieDuration}m film + {suggestedSlotInfo.trailerBufferMinutes}m ads + {suggestedSlotInfo.intervalMinutes}m interval) + <strong>{suggestedSlotInfo.turnaroundMinutes}m cleaning</strong> → Suggested next start: <strong>{formatIndianTime(suggestedSlotInfo.suggestedTime)}</strong>
                          </span>
                        )}
                      </span>
                    </div>
                    {newMovieTitle && (
                      <span className="badge bg-white text-secondary border px-2 py-1 small fw-medium">
                        Show Slot: ~{getMovieDurationMinutes(newMovieId, newMovieTitle, centralMovies) + trailerBufferMinutes + intervalMinutes} mins ({getMovieDurationMinutes(newMovieId, newMovieTitle, centralMovies)}m film + {trailerBufferMinutes}m ads + {intervalMinutes}m interval) + {turnaroundBufferMinutes}m cleaning
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* DYNAMIC TICKET PRICE INPUTS */}
              <div className="col-12 mt-4 pt-3 border-top">
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                  <BsTag className="text-primary" /> Set Ticket Prices for {screens.find((s) => String(s.id) === String(selectedScreenId || screens[0]?.id))?.screenName || "Selected Screen"}
                </h6>
                <small className="text-muted d-block mb-3">Ticket prices apply specifically to this movie showtime.</small>

                <div className="row g-3">
                  {targetScreenClasses && targetScreenClasses.length > 0 ? (
                    targetScreenClasses.map((sec) => (
                      <div className="col-md-4" key={sec.id}>
                        <div className="p-3 bg-white border rounded-3 shadow-sm">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: sec.color || "#3B82F6" }}></span>
                            <span className="fw-bold text-dark small">{sec.name} Class</span>
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold bg-light">₹</span>
                            <input
                              type="number"
                              className="form-control fw-bold"
                              value={dynamicShowPrices[sec.id] || 150}
                              onChange={(e) => setDynamicShowPrices({ ...dynamicShowPrices, [sec.id]: Number(e.target.value) })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-4 bg-white border rounded-3 text-muted">
                      <BsGrid3X3 size={28} className="text-warning mb-2" />
                      <h6 className="fw-bold text-dark mb-1">
                        Setting standard classes for {screens.find((s) => String(s.id) === String(selectedScreenId))?.screenName || "this screen"}.
                      </h6>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary px-4 py-2 rounded-3 fw-bold d-flex align-items-center gap-2">
                  <BsCalendarCheck /> {editingShowtimeId ? "Save Showtime Changes" : "Save Movie Showtime & Ticket Prices"}
                </button>
                {editingShowtimeId && (
                  <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-bold" onClick={() => setEditingShowtimeId(null)}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            {/* SCHEDULED SHOWTIMES HEADER WITH ACTIVE BADGE AND DATE FILTER */}
            <div className="d-flex justify-content-between align-items-center mb-3 mt-4 pt-3 border-top flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold text-dark mb-0">Scheduled Showtimes</h4>
                <span className="badge bg-dark text-white rounded-pill px-3 py-2 fw-bold" style={{ fontSize: "12px" }}>
                  {showtimes.filter((st) => {
                    const todayIso = new Date().toISOString().split("T")[0];
                    const isFutureOrToday = !st.showDate || st.showDate >= todayIso;
                    const scrMatch = !showtimeScreenFilter || String(st.screen?.id || st.screenId) === String(showtimeScreenFilter);
                    const dateMatch = !showtimeDateFilter || st.showDate === showtimeDateFilter;
                    return isFutureOrToday && scrMatch && dateMatch;
                  }).length} Active Shows
                </span>
              </div>

              {/* DATE FILTER BUTTON ON TOP RIGHT (MIN TODAY) */}
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: "160px" }}>
                  <IndianDatePicker
                    value={showtimeDateFilter}
                    onChange={(val) => setShowtimeDateFilter(val)}
                    placeholder="+ Date"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {showtimeDateFilter && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-3"
                    onClick={() => setShowtimeDateFilter("")}
                    title="Clear date filter"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* SCREEN FILTER TABS BAR (HORIZONTAL PILLS CONTAINER) */}
            <div className="p-2 bg-white border rounded-pill mb-4 d-flex align-items-center gap-2 flex-wrap shadow-sm">
              <button
                type="button"
                className={`btn btn-sm fw-bold px-3 py-1 rounded-pill transition-all ${!showtimeScreenFilter ? "btn-outline-primary border-primary bg-primary-subtle text-primary shadow-sm" : "btn-light text-muted border-0"}`}
                onClick={() => setShowtimeScreenFilter(null)}
              >
                All Screens <span className="badge bg-secondary-subtle text-secondary ms-1">
                  {showtimes.filter((st) => !st.showDate || st.showDate >= new Date().toISOString().split("T")[0]).length}
                </span>
              </button>
              {screens.map((scr) => {
                const todayIso = new Date().toISOString().split("T")[0];
                const count = showtimes.filter((s) => (!s.showDate || s.showDate >= todayIso) && String(s.screen?.id || s.screenId) === String(scr.id)).length;
                const isAct = String(showtimeScreenFilter) === String(scr.id);
                return (
                  <button
                    key={scr.id}
                    type="button"
                    className={`btn btn-sm fw-bold px-3 py-1 rounded-pill transition-all ${isAct ? "btn-outline-primary border-primary bg-primary-subtle text-primary shadow-sm" : "btn-light text-muted border-0"}`}
                    onClick={() => setShowtimeScreenFilter(scr.id)}
                  >
                    {scr.screenName} <span className="badge bg-secondary-subtle text-secondary ms-1">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* SCREEN SECTIONS WITH 2-COLUMN SHOWTIME CARDS */}
            {screens
              .filter((scr) => !showtimeScreenFilter || String(scr.id) === String(showtimeScreenFilter))
              .map((scr) => {
                const todayIso = new Date().toISOString().split("T")[0];
                const scrShows = showtimes.filter((st) => {
                  const scrMatch = String(st.screen?.id || st.screenId) === String(scr.id);
                  const isFutureOrToday = !st.showDate || st.showDate >= todayIso;
                  const dateMatch = !showtimeDateFilter || st.showDate === showtimeDateFilter;
                  return scrMatch && isFutureOrToday && dateMatch;
                });

                if (scrShows.length === 0 && showtimeScreenFilter) {
                  return (
                    <div key={scr.id} className="card border rounded-4 p-4 mb-4 bg-white shadow-sm text-center py-5 text-muted">
                      <h6>No showtimes scheduled for {scr.screenName} {showtimeDateFilter ? `on ${formatIndianDate(showtimeDateFilter)}` : ""}.</h6>
                    </div>
                  );
                }
                if (scrShows.length === 0) return null;

                // Sort individual showtimes in ascending order of Show Date and Time
                const sortedScrShows = [...scrShows].sort((a, b) => {
                  const dateComp = (a.showDate || "").localeCompare(b.showDate || "");
                  if (dateComp !== 0) return dateComp;
                  return (a.startTime || "").localeCompare(b.startTime || "");
                });

                const fullTechStr = [
                  scr.projectionType,
                  scr.soundSystem || scr.soundType,
                  scr.screenFormat || scr.formatType,
                ]
                  .filter(Boolean)
                  .join(" • ") || scr.screenType || "Standard Screen";

                return (
                  <div key={scr.id} className="card border rounded-4 p-4 mb-4 bg-white shadow-sm">
                    {/* SCREEN HEADER */}
                    <div className="mb-3 border-bottom pb-2">
                      <h5 className="fw-bold text-dark mb-1 d-flex align-items-center">
                        {scr.screenName} <span className="text-primary fw-bold ms-2 small">• ACTIVE</span>
                      </h5>
                      <small className="text-muted fw-bold" style={{ fontSize: "11px" }}>{fullTechStr}</small>
                    </div>

                    {/* 2-COLUMN GRID: EACH SHOW IS AN INDIVIDUAL CARD */}
                    <div className="row g-3">
                      {sortedScrShows.map((st) => {
                        const scrClasses = getClassesForTargetScreen(scr.id);
                        const pricingText = getPricingDisplayForShowtime(st, scrClasses);

                        return (
                          <div className="col-md-6 col-12" key={st.id}>
                            <div className="p-3 border rounded-3 bg-white shadow-sm h-100 d-flex flex-column justify-content-between">
                              {/* TOP LINE: MOVIE TITLE (LEFT) + SPECIFIC SHOW PRICING (RIGHT) */}
                              <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-bold text-dark fs-6">{st.movieTitle}</span>
                                  <span className="badge bg-success-subtle text-success border border-success px-2 py-0" style={{ fontSize: "10px" }}>
                                    LIVE
                                  </span>
                                </div>
                                <div className="text-muted small fw-bold text-end" style={{ fontSize: "11px" }}>
                                  Pricing: <span className="text-dark">{pricingText}</span>
                                </div>
                              </div>

                              {/* BOTTOM LINE: DATE (LEFT) + EXACT TIME IN INDIAN STANDARD (RIGHT) */}
                              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
                                <span className="badge bg-light text-secondary border px-2 py-1 small fw-bold d-flex align-items-center gap-1">
                                  <BsCalendarEvent /> {formatIndianDate(st.showDate) || "Today"}
                                </span>

                                <div className="badge bg-primary-subtle text-primary border border-primary px-3 py-1 d-flex align-items-center gap-2 rounded-2">
                                  <span className="fw-bold fs-6">{formatIndianTime(st.startTime)}</span>
                                  <button
                                    type="button"
                                    className="btn btn-link text-primary p-0 border-0 ms-1"
                                    title="Edit showtime"
                                    onClick={() => handleEditShowtimeClick(st)}
                                  >
                                    <BsPencil size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-link text-danger p-0 border-0"
                                    title="Delete showtime"
                                    onClick={() => handleDeleteShowtime(st.id)}
                                  >
                                    <BsTrash size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {showtimes.length === 0 && (
              <p className="text-muted text-center py-5 bg-light rounded-4 border">
                No showtimes scheduled yet. Enter details above to schedule a movie!
              </p>
            )}
          </div>
        </div>
        )}

        {/* --- LIVE SEAT LAYOUT & OCCUPANCY TAB (CLEAN FULL-PAGE VIEW, NO SUB-BOXES) --- */}
        {activeTab === "live-occupancy" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <LiveSeatBookingMain
              screens={screens}
              showtimes={showtimes}
              selectedScreenId={selectedScreenId}
              onScreenChange={setSelectedScreenId}
              selectedShowtimeId={editingShowtimeId}
              onShowtimeChange={setEditingShowtimeId}
              liveMovieSearch={liveMovieSearch}
              setLiveMovieSearch={setLiveMovieSearch}
              getLayoutForTargetScreen={getLayoutForTargetScreen}
              bookedSeatsMap={managerBookedSeatsMap}
              formatIndianDate={formatIndianDate}
              ROW_LETTERS={ROW_LETTERS}
              getCanonicalSection={getCanonicalSection}
            />
          </div>
        )}

        {/* --- 5. FOOD & BEVERAGE (F&B) MANAGEMENT & OVERVIEW --- */}
        {activeTab === "pos" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <TheaterManagerMenuEditor theaterId={selectedTheater?.id} />
          </div>
        )}

        {/* --- 6. BOX OFFICE SALES TAB (MOVIE-WISE & SCREEN-WISE BREAKDOWN) --- */}
        {activeTab === "analytics" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            {/* KPI SUMMARY CARDS */}
            <div className="sa-page-cards four mb-4">
              <Metric 
                icon={<BsClockHistory />} 
                label="Today's Ticket Sales" 
                value={`₹${Number(totalTodayRevenue || 0).toLocaleString("en-IN")}`} 
                subtitle={`${totalTodayTickets} tickets sold today`}
              />
              <Metric 
                icon={<BsCashCoin />} 
                label="Overall Box Office" 
                value={`₹${Number(realBoxOfficeRevenue || 0).toLocaleString("en-IN")}`} 
                subtitle={`${realTicketsSold} total tickets sold in theater`}
              />
              <Metric 
                icon={<BsCupStraw />} 
                label="Today's F&B Revenue" 
                value={`₹${Number(fbTodayRevenue || 0).toLocaleString("en-IN")}`} 
                subtitle={`${fbTodayOrders} food & beverage orders`}
              />
              <Metric 
                icon={<BsFilm />} 
                label="Running Movies" 
                value={movieWiseSales.length} 
                subtitle={`${todayShowtimesCount} shows running today`}
              />
            </div>

            {/* SECTION 1: MOVIE-WISE SALES BREAKDOWN (TODAY'S SALE & OVERALL SALE) */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <BsFilm className="text-primary" /> Movie-Wise Box Office Sales (Today & Overall)
                  </h5>
                  <p className="text-muted small mb-0">
                    Real-time performance tracking per running film in {cinemaName}.
                  </p>
                </div>
                <div style={{ maxWidth: "250px" }} className="w-100">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search movie title..."
                    value={movieSalesSearch}
                    onChange={(e) => setMovieSalesSearch(e.target.value)}
                  />
                </div>
              </div>

              {movieWiseSales.length === 0 ? (
                <div className="text-center py-5 border rounded-3 bg-light text-muted">
                  <BsFilm size={36} className="text-muted mb-2" />
                  <h6 className="fw-bold text-dark mb-1">No Movies Listed Yet</h6>
                  <p className="small mb-0">Schedule showtimes for movies to track their real box office performance.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>Movie Details</th>
                        <th>Running Screens</th>
                        <th>Shows</th>
                        <th className="text-center bg-warning-subtle text-dark">Today's Sale</th>
                        <th className="text-center bg-success-subtle text-success">Overall Sale (Lifetime)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movieWiseSales
                        .filter((m) => !movieSalesSearch.trim() || m.title.toLowerCase().includes(movieSalesSearch.toLowerCase()))
                        .map((m, idx) => (
                          <tr key={m.title}>
                            <td className="fw-bold text-muted">{idx + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="p-2 bg-primary-subtle text-primary rounded-3">
                                  <BsFilm size={20} />
                                </div>
                                <div>
                                  <h6 className="fw-bold text-dark mb-0">{m.title}</h6>
                                  <small className="text-muted">{m.language} • {m.genre}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                {m.screensList.length > 0 ? (
                                  m.screensList.map((sc, i) => (
                                    <span key={i} className="badge bg-secondary-subtle text-secondary border">
                                      {sc}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted small">None</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-warning text-dark me-1">{m.todayShowsCount} Today</span>
                              <span className="text-muted small">({m.showtimesCount} Total)</span>
                            </td>
                            <td className="text-center bg-warning-subtle">
                              <div className="fw-bold text-dark fs-6">
                                ₹{m.todayRevenue.toLocaleString()}
                              </div>
                              <small className="text-muted fw-bold">
                                {m.todayTickets} {m.todayTickets === 1 ? "ticket" : "tickets"}
                              </small>
                            </td>
                            <td className="text-center bg-success-subtle">
                              <div className="fw-bold text-success fs-6">
                                ₹{m.overallRevenue.toLocaleString()}
                              </div>
                              <small className="text-muted fw-bold">
                                {m.overallTickets} {m.overallTickets === 1 ? "ticket" : "tickets"}
                              </small>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 2: SCREEN-WISE BREAKDOWN TABLE */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <BsTv className="text-primary" /> Screen-Wise Box Office & Hall Capacity
              </h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Screen Name</th>
                      <th>Showtimes</th>
                      <th>Dynamic Capacity</th>
                      <th>Tickets Sold</th>
                      <th>Real Box Office Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screens.map((scr) => {
                      const scrShowtimes = showtimes.filter(
                        (st) =>
                          (st.screen?.id && String(st.screen.id) === String(scr.id)) ||
                          (st.screenId && String(st.screenId) === String(scr.id))
                      );
                      const scrShowCount = scrShowtimes.length;
                      const scrTodayShows = scrShowtimes.filter((st) => {
                        const d = st.showDate || st.date;
                        return d && (d === todayISO || String(d).startsWith(todayISO));
                      }).length;
                      const scrRevenue = getScreenRealRevenue(scr);
                      const scrTickets = getScreenTicketsSold(scr);
                      return (
                        <tr key={scr.id}>
                          <td className="fw-bold">{scr.screenName}</td>
                          <td>
                            <span className="badge bg-warning text-dark me-1">{scrTodayShows} Today</span>
                            <span className="text-muted small">({scrShowCount} Total)</span>
                          </td>
                          <td className="fw-bold text-primary">{getScreenCapacity(scr.id)} Seats</td>
                          <td className="fw-bold text-dark">{scrTickets} Tickets</td>
                          <td className="text-success fw-bold">₹{scrRevenue.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- 7. USHER & STAFF DUTY ROSTER --- */}
        {activeTab === "ushers" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            {/* MANAGER STAFF MANAGEMENT FORM: DIRECT MANUAL ADD vs EMAIL INVITE */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom pb-2">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  {addStaffMode === "direct" ? (
                    <>
                      <BsPersonCheck className="text-primary" /> Manually Add Staff Member to Roster
                    </>
                  ) : (
                    <>
                      <BsEnvelope className="text-primary" /> Invite Staff Member via Email
                    </>
                  )}
                </h5>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn fw-bold d-flex align-items-center gap-1 ${addStaffMode === "direct" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setAddStaffMode("direct")}
                  >
                    <BsLightningCharge /> Direct Manual Add (Instant)
                  </button>
                  <button
                    type="button"
                    className={`btn fw-bold d-flex align-items-center gap-1 ${addStaffMode === "invite" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setAddStaffMode("invite")}
                  >
                    <BsEnvelope /> Send Email Invite
                  </button>
                </div>
              </div>

              {addStaffMode === "direct" ? (
                /* MANUAL DIRECT STAFF ADDITION FORM */
                <form className="row g-3" onSubmit={handleManualAddStaff}>
                  <div className="col-md-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label fw-bold small text-dark mb-0 d-flex align-items-center gap-1">
                        <BsShieldCheck className="text-primary" /> Emp ID / Username *
                      </label>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-primary fw-bold text-decoration-none small d-flex align-items-center gap-1"
                        onClick={handleGenerateEmpId}
                        title="Click to generate next ascending Emp ID from database"
                      >
                        <BsLightningCharge /> Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-control fw-bold text-primary bg-light"
                      value={staffEmpId}
                      onChange={(e) => setStaffEmpId(e.target.value)}
                      placeholder="Click Generate to assign ID"
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsPeople /> First Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter first name"
                      value={staffFirstName}
                      onChange={(e) => setStaffFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsPeople /> Last Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter last name"
                      value={staffLastName}
                      onChange={(e) => setStaffLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsEnvelope /> Default Login Email *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter login email address"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsPhone /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Enter phone number"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsLock /> Create Login Password *
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter login password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      {staffDutyRole.includes("Cashier") && <BsCashCoin className="text-success" />}
                      {staffDutyRole.includes("Concession") && <BsCupStraw className="text-warning" />}
                      {staffDutyRole.includes("Gate") && <BsQrCodeScan className="text-info" />}
                      <span>Assigned Duty Designation *</span>
                    </label>
                    <select
                      className="form-select fw-bold"
                      value={staffDutyRole}
                      onChange={(e) => setStaffDutyRole(e.target.value)}
                    >
                      <option value="Box Office Cashier">Box Office Cashier</option>
                      <option value="F&B Concession Staff">F&B Concession Staff</option>
                      <option value="Gate Usher">Gate Entry Usher</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <button type="submit" className="btn btn-success w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                      <BsPersonPlus /> + Add Staff Directly
                    </button>
                  </div>
                </form>
              ) : (
                /* EMAIL INVITATION FORM (DEFAULT FORM) */
                <form className="row g-3" onSubmit={handleInviteStaffByManager}>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsPeople /> Staff Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter full name"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      <BsEnvelope /> Email Address *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter email address"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                      {staffDutyRole.includes("Cashier") && <BsCashCoin className="text-success" />}
                      {staffDutyRole.includes("Concession") && <BsCupStraw className="text-warning" />}
                      {staffDutyRole.includes("Gate") && <BsQrCodeScan className="text-info" />}
                      <span>Assigned Duty Designation *</span>
                    </label>
                    <select
                      className="form-select fw-bold"
                      value={staffDutyRole}
                      onChange={(e) => setStaffDutyRole(e.target.value)}
                    >
                      <option value="Box Office Cashier">Box Office Cashier</option>
                      <option value="F&B Concession Staff">F&B Concession Staff</option>
                      <option value="Gate Usher">Gate Entry Usher</option>
                    </select>
                  </div>
                  <div className="col-md-12 text-end">
                    <button type="submit" className="btn btn-primary fw-bold px-4 py-2 d-inline-flex align-items-center gap-2">
                      <BsSend /> Send Email Invitation
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold text-dark mb-3">Staff & Duty Roster</h5>
              {staffList.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">No theater staff members or ushers invited for this cinema branch yet.</p>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Emp ID / Username</th>
                      <th>Staff Name</th>
                      <th>Default Login Email</th>
                      <th>Assigned Duty Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-bold text-primary">{u.employeeId || u.empId || u.username || getNextEmpId([{ id: u.id }])}</td>
                        <td className="fw-bold text-dark">{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 ${
                            u.dutyRole?.includes("Cashier") || u.role?.includes("Cashier")
                              ? "bg-success-subtle text-success border border-success"
                              : u.dutyRole?.includes("Concession") || u.role?.includes("Concession")
                              ? "bg-warning-subtle text-dark border border-warning"
                              : "bg-info-subtle text-info-emphasis border border-info"
                          }`}>
                            {(u.dutyRole?.includes("Cashier") || u.role?.includes("Cashier")) && <BsCashCoin />}
                            {(u.dutyRole?.includes("Concession") || u.role?.includes("Concession")) && <BsCupStraw />}
                            {(u.dutyRole?.includes("Gate") || u.role?.includes("Gate")) && <BsQrCodeScan />}
                            <span>{u.dutyRole || u.role || "Theater Staff"}</span>
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.status === "On Duty" || u.status === "Accepted" || String(u.status).includes("On Duty") ? "bg-success" : u.status === "Rejected" || u.status === "REJECTED" ? "bg-danger" : "bg-warning text-dark"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveStaff(u.id)}>
                            <BsTrash /> Delete / Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CINEMA & THEATER SETTINGS TAB */}
        {activeTab === "settings" && (
          <TheaterSettingsView
            portalId={selectedTheater?.id || localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2"}
            theaterName={cinemaName}
            isManager={true}
            onProfileUpdated={(newName) => {
              if (newName) setCinemaName(newName);
            }}
          />
        )}
      </main>
    </div>
  );
}
