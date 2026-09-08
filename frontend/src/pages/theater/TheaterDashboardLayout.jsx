import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TheaterNavbar from "../../components/Navbar/TheaterNavbar";
import Select from "react-select";
import api from "../../api/axiosConfig";
import { formatIndianDate, formatIndianTime } from "../../utils/dateTime";
import IndianDatePicker from "../../components/Common/IndianDatePicker";
import "../../styles/Admin.css";
import LiveSeatBookingMain from "../../components/theater/LiveSeatBooking/LiveSeatBookingMain";
import {
  BsFilm,
  BsTv,
  BsGrid3X3,
  BsClockHistory,
  BsCupStraw,
  BsBarChart,
  BsPlusLg,
  BsHouse,
  BsCheckCircle,
  BsCheckCircleFill,
  BsPeople,
  BsCashCoin,
  BsPersonPlus,
  BsTrash,
  BsSave,
  BsPencilSquare,
  BsPlusCircle,
  BsCalendarCheck,
  BsCalendarEvent,
  BsPencil,
  BsTag,
  BsArrowUp,
  BsArrowDown,
  BsPersonBadge,
  BsQrCodeScan,
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
  BsShieldCheck,
} from "react-icons/bs";

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

const ROW_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

export default function TheaterDashboardLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // Default tab: Dashboard overview
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editable Cinema Name
  const [cinemaName, setCinemaName] = useState(() => localStorage.getItem("portalName") || "Cinema Partner");
  const [isEditingCinemaName, setIsEditingCinemaName] = useState(false);

  // --- 1. PERSISTENT PER-SCREEN LAYOUT STORAGE MAP ---
  const initialDefaultLayouts = {
    default_screen_1: {
      sections: [
        {
          id: "sec_1",
          name: "SuperStar Recliner",
          color: "#8B5CF6", // Purple
          rowsCount: 2,
          seatsPerRow: 12,
          centerAisleGap: 2,
          hasAisleBelow: true,
        },
        {
          id: "sec_2",
          name: "Gold Tier",
          color: "#F59E0B", // Amber Gold
          rowsCount: 4,
          seatsPerRow: 16,
          centerAisleGap: 2,
          hasAisleBelow: true,
        },
        {
          id: "sec_3",
          name: "Silver Tier",
          color: "#10B981", // Emerald
          rowsCount: 6,
          seatsPerRow: 20,
          centerAisleGap: 2,
          hasAisleBelow: false,
        },
      ],
      deletedSeats: {},
    },
  };

  const [screenLayoutsMap, setScreenLayoutsMap] = useState(() => {
    try {
      const saved = localStorage.getItem("theater_screen_layouts_map");
      return saved ? JSON.parse(saved) : initialDefaultLayouts;
    } catch (e) {
      return initialDefaultLayouts;
    }
  });

  // Current Active Screen's Layout State
  const [customSections, setCustomSections] = useState([]);
  const [deletedSeatsMap, setDeletedSeatsMap] = useState({});

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

  // Editing Section State
  const [editingSecId, setEditingSecId] = useState(null);

  // Form for adding NEW physical class section in Seat Builder
  const [newClassName, setNewClassName] = useState("");
  const [newClassColor, setNewClassColor] = useState("#3B82F6");
  const [newClassRows, setNewClassRows] = useState(3);
  const [newClassSeatsPerRow, setNewClassSeatsPerRow] = useState(16);
  const [newClassCenterGap, setNewClassCenterGap] = useState(2);
  const [newClassAisleBelow, setNewClassAisleBelow] = useState(true);

  // Deleted seats tracker tool
  const [isDeleteToolActive, setIsDeleteToolActive] = useState(false);

  // --- 2. SHOWTIMES SCHEDULER STATE ---
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [newMovieId, setNewMovieId] = useState(null);
  const [newPosterUrl, setNewPosterUrl] = useState("");
  const [centralMovies, setCentralMovies] = useState([]);
  const [selectedShowScreenId, setSelectedShowScreenId] = useState("");
  const [newShowDate, setNewShowDate] = useState(new Date().toISOString().split("T")[0]);
  const [newShowTimeStr, setNewShowTimeStr] = useState("18:30");

  const [editingShowtimeId, setEditingShowtimeId] = useState(null);
  const [showtimeScreenFilter, setShowtimeScreenFilter] = useState(null);
  const [showtimeDateFilter, setShowtimeDateFilter] = useState("");
  const [showtimeToastMsg, setShowtimeToastMsg] = useState("");
  const [liveMovieSearch, setLiveMovieSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);

  const [dynamicShowPrices, setDynamicShowPrices] = useState({
    sec_1: 350,
    sec_2: 220,
    sec_3: 150,
    default_normal: 150,
    default_gold: 220,
    default_recliner: 350,
  });

  // LIVE SEAT OCCUPANCY BOOKED SEATS MAP (REAL-TIME SYNC)
  const [ownerBookedSeatsMap, setOwnerBookedSeatsMap] = useState({});

  const loadOwnerBookedSeats = async () => {
    try {
      const currentMap = {};


      const currentScrId = selectedShowScreenId || selectedScreen?.id || screens[0]?.id;
      const targetStId = editingShowtimeId || (showtimes.find((s) => String(s.screen?.id || s.screenId) === String(currentScrId))?.id);
      const targetShow = showtimes.find((s) => String(s.id) === String(targetStId));
      const targetScr = screens.find((s) => String(s.id) === String(currentScrId));

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
              currentMap[k] = true;
              // Also decompose keys formatted as sec_xxx-Row-Num (e.g. sec_1788001329407-A-6)
              const parts = String(k).split("-");
              if (parts.length >= 3) {
                const rL = parts[1];
                const cN = parts[2];
                const sNum = `${rL}${cN}`;
                const secIdPart = parts[0];
                currentMap[`${targetStId}-${secIdPart}-${sNum}`] = true;
                currentMap[`${ctxKey}-${secIdPart}-${sNum}`] = true;
                // If this matches gold/silver/balcony sections
                currentMap[`${targetStId}-gold-${sNum}`] = true;
                currentMap[`${ctxKey}-gold-${sNum}`] = true;
                currentMap[`gold_${sNum}`] = true;
                currentMap[`${sNum}`] = true;
              }
            });
          }
        } catch (e) { }
      }

      // Also scan sales history
      try {
        const salesMap = new Map();
        try {
          const res = await api.get("/theater/sales-history");
          if (Array.isArray(res.data)) {
            res.data.forEach((s) => salesMap.set(String(s.ticketId || s.id), s));
          }
        } catch (e) { }



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
                  currentMap[`${cSec}_${seatN}`] = true;
                }
              }
            });
          }
        });
      } catch (e) { }

      setOwnerBookedSeatsMap(currentMap);
    } catch (e) { }
  };

  useEffect(() => {
    loadOwnerBookedSeats();

    const handleStorage = (e) => {
      if (e.key === "pos_booked_seats_map" || e.key === "pos_sales_history" || (e.key && e.key.startsWith("pos_sales_history_"))) {
        loadOwnerBookedSeats();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pos_booking_updated", loadOwnerBookedSeats);

    const interval = setInterval(() => {
      loadOwnerBookedSeats();
    }, 1500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pos_booking_updated", loadOwnerBookedSeats);
      clearInterval(interval);
    };
  }, [editingShowtimeId, selectedScreen, selectedShowScreenId, showtimes]);

  const triggerShowtimeToast = (msg) => {
    setShowtimeToastMsg(msg);
    setTimeout(() => {
      setShowtimeToastMsg("");
    }, 1500);
  };

  // --- 3. F&B FOOD & SNACKS MENU ---
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

  const [fnbItems, setFnbItems] = useState(DEFAULT_FNB_ITEMS);
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
        setFnbItems(JSON.parse(saved));
      } else {
        setFnbItems(DEFAULT_FNB_ITEMS);
        localStorage.setItem(`theater_fnb_menu_${pId}`, JSON.stringify(DEFAULT_FNB_ITEMS));
        localStorage.setItem("theater_fnb_menu", JSON.stringify(DEFAULT_FNB_ITEMS));
      }
    } catch (e) {
      setFnbItems(DEFAULT_FNB_ITEMS);
    }
  };

  const saveFnbMenu = (items) => {
    setFnbItems(items);
    try {
      const pId = localStorage.getItem("portalId") || "2";
      localStorage.setItem(`theater_fnb_menu_${pId}`, JSON.stringify(items));
      localStorage.setItem("theater_fnb_menu", JSON.stringify(items));
    } catch (e) {
      console.warn("F&B save error:", e);
    }
  };

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

  // Forms
  const [editingScreenId, setEditingScreenId] = useState(null);
  const [newScreenName, setNewScreenName] = useState("");
  const [newProjection, setNewProjection] = useState("");
  const [customProjection, setCustomProjection] = useState("");
  const [newSound, setNewSound] = useState("");
  const [customSound, setCustomSound] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [customFormat, setCustomFormat] = useState("");

  // Helper: Calculate Ascending Sequential Emp ID / Username (Reusing IDs from rejected invitations)
  const getNextEmpId = (list = []) => {
    const portalNameStr = (cinemaName || localStorage.getItem("portalName") || "Grand Multiplex").trim();
    const parts = portalNameStr.split(/\s+/).filter(Boolean);
    let prefix = "GM";
    if (parts.length >= 2) {
      prefix = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts[0]?.length >= 2) {
      prefix = parts[0].substring(0, 2).toUpperCase();
    } else if (parts[0]?.length === 1) {
      prefix = (parts[0][0] + "M").toUpperCase();
    }

    // Collect all taken numbers (ignoring rejected staff)
    const takenNumbers = new Set();
    list.forEach((item) => {
      if (item.status === "Rejected" || item.status === "REJECTED") return;
      const empStr = String(item.empId || item.username || "");
      const numMatch = empStr.match(/\d+/);
      if (numMatch) {
        takenNumbers.add(parseInt(numMatch[0], 10));
      }
    });

    // Find lowest available number starting at 1001
    let candidate = 1001;
    while (takenNumbers.has(candidate)) {
      candidate++;
    }
    return `${prefix}-${candidate}`;
  };

  // Staff Form
  const [staffEmpId, setStaffEmpId] = useState("");
  const [staffFirstName, setStaffFirstName] = useState("");
  const [staffLastName, setStaffLastName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("Branch Manager");
  const [addStaffMode, setAddStaffMode] = useState("invite"); // Default: "invite" | "direct"

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

  const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

  useEffect(() => {
    fetchTheaterDetails();
    loadFnbMenu();
    fetchCentralMovies();

    const handleFnbStorage = (e) => {
      if (e.key && e.key.includes("theater_fnb_menu")) {
        loadFnbMenu();
      }
    };
    window.addEventListener("storage", handleFnbStorage);
    return () => window.removeEventListener("storage", handleFnbStorage);
  }, []);

  const fetchCentralMovies = async () => {
    try {
      const res = await api.get("/movies");
      if (res.data && Array.isArray(res.data)) {
        setCentralMovies(res.data);
      }
    } catch (err) {
      console.error("Failed to load central movies library", err);
    }
  };

  useEffect(() => {
    fetchInvitations();
    if (activeTab === "showtimes") {
      fetchAllShowtimes();
    }
    if (activeTab === "concessions") {
      loadFnbMenu();
    }
  }, [selectedTheater, activeTab]);

  const fetchInvitations = async () => {
    try {
      const pId = selectedTheater?.id || localStorage.getItem("portalId");
      const url = pId ? `/theater-invitations/portal/${pId}` : "/theater-invitations/portal/1";
      const res = await api.get(url);
      if (res.data && Array.isArray(res.data)) {
        const mappedList = res.data.map((inv) => {
          let roleDisplay = inv.dutyRole || "Branch Manager";
          if (!inv.dutyRole) {
            if (inv.roleName === "THEATER_MANAGER") {
              roleDisplay = "Branch Manager";
            } else if (inv.roleName && inv.roleName.startsWith("THEATER_STAFF")) {
              roleDisplay = inv.roleName.includes(":") ? inv.roleName.split(":")[1] : "Theater Staff";
            }
          }
          return {
            id: inv.id,
            empId: inv.username || null,
            username: inv.username || null,
            name: inv.speakerName || inv.name || inv.email.split("@")[0],
            email: inv.email,
            role: roleDisplay,
            dutyRole: roleDisplay,
            screen: "All Screens",
            status: inv.status === "PENDING"
              ? "Invited (Pending)"
              : inv.status === "ACCEPTED"
                ? "Accepted (On Duty)"
                : inv.status === "REJECTED"
                  ? "Rejected"
                  : inv.status,
          };
        });
        setStaffList(mappedList);
      }
    } catch (err) {
      console.warn("Staff roster fetch warning:", err);
    }
  };

  // Save layout map to localStorage whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem("theater_screen_layouts_map", JSON.stringify(screenLayoutsMap));
    } catch (e) {
      console.error("LocalStorage save failed", e);
    }
  }, [screenLayoutsMap]);

  const fetchTheaterDetails = async () => {
    try {
      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
      const portalId = localStorage.getItem("portalId") || "";
      const portalName = localStorage.getItem("portalName") || "";

      let queryParams = [];
      if (email) queryParams.push(`email=${encodeURIComponent(email)}`);
      if (portalId) queryParams.push(`portalId=${portalId}`);
      const qs = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const res = await api.get(`/theater/my-theater${qs}`);
      if (res.data) {
        setSelectedTheater(res.data);
        const resolvedName = res.data.name || res.data.theaterPortal?.portalName || portalName || "Cinema Partner";
        setCinemaName(resolvedName);
        localStorage.setItem("portalName", resolvedName);
        if (res.data.id) {
          fetchScreens(res.data.id);
        }
      } else {
        setSelectedTheater({ name: portalName || "Cinema Partner", city: "Chennai" });
        setCinemaName(portalName || "Cinema Partner");
      }
    } catch (err) {
      console.warn("fetchTheaterDetails fallback notice:", err.message);
      const portalName = localStorage.getItem("portalName") || "Cinema Partner";
      setSelectedTheater({ name: portalName, city: "Chennai" });
      setCinemaName(portalName);
    } finally {
      setLoading(false);
    }
  };

  const fetchScreens = async (theaterId) => {
    if (!theaterId || theaterId === "undefined" || Number.isNaN(Number(theaterId))) return;
    try {
      const res = await api.get(`/theater/${theaterId}/screens`);
      const scrList = res.data || [];
      setScreens(scrList);
      if (scrList.length > 0) {
        const firstScr = scrList[0];
        setSelectedScreen(firstScr);
        setSelectedShowScreenId((prev) => prev || firstScr.id);
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
            } catch (e) { }
          }
          loadScreenLayout(scr.id, firstScr.id);
        });
      }
    } catch (err) {
      console.error(err);
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
      console.error("Error fetching all showtimes:", err);
    }
  };

  const fetchShowtimes = fetchAllShowtimes;

  // LOAD EACH SCREEN'S INDEPENDENT UNIQUE LAYOUT
  const loadScreenLayout = async (screenId, targetActiveId = null) => {
    const sId = String(screenId);

    let sectionsToSet = null;
    let deletedToSet = {};

    // 1. Try fetching saved layout from MySQL database backend
    try {
      const res = await api.get(`/theater/screens/${screenId}/layout`);
      let layoutData = res.data;
      if (typeof layoutData === "string") {
        try {
          layoutData = JSON.parse(layoutData);
        } catch (err) {
          console.warn("JSON parse warning:", err);
        }
      }
      if (layoutData && layoutData.sections && Array.isArray(layoutData.sections) && layoutData.sections.length > 0) {
        sectionsToSet = layoutData.sections;
        deletedToSet = layoutData.deletedSeats || {};
      }
    } catch (e) {
      console.warn("Backend layout fetch warning:", e);
    }

    // 2. Check local state or localStorage
    if (!sectionsToSet) {
      if (screenLayoutsMap[sId] && screenLayoutsMap[sId].sections && screenLayoutsMap[sId].sections.length > 0) {
        sectionsToSet = screenLayoutsMap[sId].sections;
        deletedToSet = screenLayoutsMap[sId].deletedSeats || {};
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem("theater_screen_layouts_map") || "{}");
          if (saved[sId] && saved[sId].sections && saved[sId].sections.length > 0) {
            sectionsToSet = saved[sId].sections;
            deletedToSet = saved[sId].deletedSeats || {};
          }
        } catch (err) { }
      }
    }

    // 3. Fallback default sections if screen has no saved layout yet
    if (!sectionsToSet || sectionsToSet.length === 0) {
      sectionsToSet = [
        { id: "sec_1", name: "SuperStar Recliner", color: "#8B5CF6", rowsCount: 2, seatsPerRow: 12, centerAisleGap: 2, hasAisleBelow: true },
        { id: "sec_2", name: "Gold Tier", color: "#F59E0B", rowsCount: 4, seatsPerRow: 16, centerAisleGap: 2, hasAisleBelow: true },
        { id: "sec_3", name: "Silver Tier", color: "#10B981", rowsCount: 6, seatsPerRow: 20, centerAisleGap: 2, hasAisleBelow: false },
      ];
      deletedToSet = {};
    }

    // Update screenLayoutsMap for sId
    setScreenLayoutsMap((prev) => {
      const updated = {
        ...prev,
        [sId]: { sections: sectionsToSet, deletedSeats: deletedToSet },
      };
      try {
        localStorage.setItem("theater_screen_layouts_map", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    // Update active customSections state if this screen matches the active selection
    const currentActiveId = String(targetActiveId || (selectedScreen ? selectedScreen.id : ""));
    if (!currentActiveId || sId === currentActiveId) {
      setCustomSections(sectionsToSet);
      setDeletedSeatsMap(deletedToSet);
    }
  };

  const handleScreenChange = (screenId) => {
    const scr = screens.find((s) => String(s.id) === String(screenId));
    if (scr) {
      // Save current screen layout before switching
      if (selectedScreen) {
        const updatedMap = {
          ...screenLayoutsMap,
          [String(selectedScreen.id)]: {
            sections: customSections,
            deletedSeats: deletedSeatsMap,
          },
        };
        setScreenLayoutsMap(updatedMap);
        try {
          localStorage.setItem("theater_screen_layouts_map", JSON.stringify(updatedMap));
        } catch (e) { }
      }

      setSelectedScreen(scr);
      setSelectedShowScreenId(scr.id);
      loadScreenLayout(scr.id, scr.id);
      fetchShowtimes(scr.id);
    }
  };

  // HELPER FUNCTION: DYNAMIC SEAT CAPACITY CALCULATOR PER SCREEN
  const getScreenCapacity = (scrId) => {
    const scr = screens.find((s) => String(s.id) === String(scrId));
    const sId = String(scrId);

    let sections = null;
    let deletedMap = {};

    if (selectedScreen && String(selectedScreen.id) === sId && customSections && customSections.length > 0) {
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

    if (scr && scr.totalCapacity !== undefined && scr.totalCapacity !== null && scr.totalCapacity > 0) {
      return scr.totalCapacity;
    }

    return 0;
  };

  // ADD NEW CLASS SECTION TO THE CURRENT SCREEN'S LAYOUT
  const handleAddCustomSection = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newSec = {
      id: `sec_${Date.now()}`,
      name: newClassName.trim(),
      color: newClassColor,
      rowsCount: Number(newClassRows),
      seatsPerRow: Number(newClassSeatsPerRow),
      centerAisleGap: Number(newClassCenterGap),
      hasAisleBelow: newClassAisleBelow,
    };

    const updatedSections = [...customSections, newSec];
    setCustomSections(updatedSections);

    if (selectedScreen) {
      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: {
          sections: updatedSections,
          deletedSeats: deletedSeatsMap,
        },
      };
      setScreenLayoutsMap(updatedMap);
    }

    setDynamicShowPrices((prev) => ({ ...prev, [newSec.id]: 150 }));
    setNewClassName("");
  };

  const handleUpdateSection = (id, updatedFields) => {
    const updatedSections = customSections.map((sec) =>
      sec.id === id ? { ...sec, ...updatedFields } : sec
    );
    setCustomSections(updatedSections);

    if (selectedScreen) {
      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: {
          sections: updatedSections,
          deletedSeats: deletedSeatsMap,
        },
      };
      setScreenLayoutsMap(updatedMap);
    }
  };

  const handleRemoveSection = (secId) => {
    const updatedSections = customSections.filter((s) => s.id !== secId);
    setCustomSections(updatedSections);

    if (selectedScreen) {
      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: {
          sections: updatedSections,
          deletedSeats: deletedSeatsMap,
        },
      };
      setScreenLayoutsMap(updatedMap);
    }
  };

  const handleMoveSectionUp = (idx) => {
    if (idx <= 0) return;
    const updated = [...customSections];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setCustomSections(updated);

    if (selectedScreen) {
      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: {
          sections: updated,
          deletedSeats: deletedSeatsMap,
        },
      };
      setScreenLayoutsMap(updatedMap);
    }
  };

  const handleMoveSectionDown = (idx) => {
    if (idx >= customSections.length - 1) return;
    const updated = [...customSections];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setCustomSections(updated);

    if (selectedScreen) {
      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: {
          sections: updated,
          deletedSeats: deletedSeatsMap,
        },
      };
      setScreenLayoutsMap(updatedMap);
    }
  };

  const handleSeatToggle = (secId, rIdx, cIdx) => {
    const key = `${secId}-${rIdx}-${cIdx}`;
    const nextDeleted = {
      ...deletedSeatsMap,
      [key]: !deletedSeatsMap[key],
    };
    setDeletedSeatsMap(nextDeleted);

    if (selectedScreen) {
      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: {
          sections: customSections,
          deletedSeats: nextDeleted,
        },
      };
      setScreenLayoutsMap(updatedMap);
    }
  };

  const handleSaveLayout = async () => {
    if (selectedScreen) {
      const payload = {
        sections: customSections,
        deletedSeats: deletedSeatsMap,
      };

      const updatedMap = {
        ...screenLayoutsMap,
        [selectedScreen.id]: payload,
      };
      setScreenLayoutsMap(updatedMap);
      localStorage.setItem("theater_screen_layouts_map", JSON.stringify(updatedMap));

      // 1. Save Layout JSON to MySQL Screen entity
      try {
        await api.post(`/theater/screens/${selectedScreen.id}/layout`, payload);
      } catch (err) {
        console.error("Failed to save layout JSON to backend:", err);
      }

      // 2. Save 1 Single Row Summary to MySQL Workbench seat_layouts table
      try {
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
          screenName: selectedScreen.screenName,
          classes: classesParts.join(","),
          totalSeatCount: totalSeats,
        }];

        await api.post(`/theater/screens/${selectedScreen.id}/seats/bulk`, singleRowPayload);
      } catch (err) {
        console.error("Failed to save screen layout summary to backend:", err);
      }

      // Also sync capacity to screens list
      const capacity = calculateTotalActiveCapacity();
      setScreens(
        screens.map((s) => (s.id === selectedScreen.id ? { ...s, totalCapacity: capacity } : s))
      );

      alert(`Layout for '${selectedScreen.screenName}' saved successfully to database!`);
    } else {
      alert("Layout saved!");
    }
  };

  // --- SHOWTIMES SCHEDULER ---
  const handleAddOrUpdateShowtime = async (e) => {
    e.preventDefault();
    const targetScreenId = selectedShowScreenId || selectedScreen?.id;
    if (!targetScreenId || !newMovieTitle) return;

    // Enforce limit of maximum 10 shows per screen per day
    if (!editingShowtimeId) {
      const existingCount = showtimes.filter(
        (st) =>
          String(st.screenId || st.screen?.id) === String(targetScreenId) &&
          (st.showDate === newShowDate || (!st.showDate && !newShowDate))
      ).length;
      if (existingCount >= 10) {
        alert(
          `⚠️ Maximum Daily Show Limit Reached!\n\nYou have already scheduled 10 shows for this screen on ${formatIndianDate(newShowDate)}.\n\nThe daily limit is 10 shows per screen.`
        );
        return;
      }
    }

    // Convert dynamicShowPrices to explicit priceNormal, priceExecutive, priceRecliner + classPrices map
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

    // Build classPrices string for MySQL DB: "balcony(220),gold(190),silver(160)"
    let classPricesStr = "";
    if (targetScreenClasses && targetScreenClasses.length > 0) {
      classPricesStr = targetScreenClasses
        .map((sec) => {
          const val =
            dynamicShowPrices[sec.id] !== undefined
              ? dynamicShowPrices[sec.id]
              : dynamicShowPrices[sec.name] !== undefined
                ? dynamicShowPrices[sec.name]
                : dynamicShowPrices[(sec.name || "").toLowerCase()] !== undefined
                  ? dynamicShowPrices[(sec.name || "").toLowerCase()]
                  : 150;
          return `${(sec.name || "").toLowerCase()}(${val})`;
        })
        .join(",");
    } else {
      classPricesStr = `normal(${norm}),executive(${exec}),recliner(${recl})`;
    }

    const showtimeData = {
      screenId: targetScreenId,
      movieTitle: newMovieTitle.trim(),
      movieId: newMovieId,
      posterUrl: newPosterUrl,
      showDate: newShowDate,
      startTime: newShowTimeStr,
      classPrices: classPricesStr,
      priceNormal: norm,
      priceExecutive: exec,
      priceRecliner: recl,
    };

    try {
      if (editingShowtimeId) {
        await api.put(`/theater/showtimes/${editingShowtimeId}`, {
          movieTitle: newMovieTitle,
          showDate: newShowDate,
          startTime: newShowTimeStr,
          classPrices: classPricesStr,
        });
        const updated = showtimes.map((st) => (st.id === editingShowtimeId ? { ...st, ...showtimeData } : st));
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
          classPrices: classPricesStr,
        });
        if (res.data && res.data.id) {
          showtimeData.id = res.data.id;
        }
        const updated = [...showtimes, showtimeData];
        const pId = localStorage.getItem("portalId") || "2";
        localStorage.setItem(`theater_showtimes_${pId}`, JSON.stringify(updated));
      }
      triggerShowtimeToast(editingShowtimeId ? "✓ Showtime & ticket prices updated successfully!" : "✓ New showtime scheduled successfully!");
      setEditingShowtimeId(null);
      setNewMovieTitle("");
    } catch (err) {
      console.warn("Backend sync notice, saving locally:", err);
      const updated = editingShowtimeId
        ? showtimes.map((st) => (st.id === editingShowtimeId ? { ...st, ...showtimeData } : st))
        : [...showtimes, { ...showtimeData, id: Date.now() }];
      setShowtimes(updated);
      const pId = localStorage.getItem("portalId") || "2";
      localStorage.setItem(`theater_showtimes_${pId}`, JSON.stringify(updated));
      triggerShowtimeToast(editingShowtimeId ? "✓ Showtime & ticket prices updated successfully!" : "✓ New showtime scheduled successfully!");
      setEditingShowtimeId(null);
      setNewMovieTitle("");
    }
  };

  const handleEditShowtimeClick = (st) => {
    if (st) {
      setEditingShowtimeId(st.id);
      setNewMovieTitle(st.movieTitle);
      setNewMovieId(st.movieId || null);
      setNewPosterUrl(st.posterUrl || "");
      setSelectedShowScreenId(st.screenId || st.screen?.id || "");
    }
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
        let p = parsedMap[sec.id] !== undefined ? parsedMap[sec.id] : (parsedMap[sec.name] !== undefined ? parsedMap[sec.name] : parsedMap[nameLower]);
        if (p === undefined) {
          if (nameLower.includes("recliner") || nameLower.includes("vip") || nameLower.includes("balcony")) {
            p = st.priceRecliner || 350;
          } else if (nameLower.includes("exec") || nameLower.includes("gold")) {
            p = st.priceExecutive || 220;
          } else {
            p = st.priceNormal || 150;
          }
        }
        parsedMap[sec.id] = p;
        parsedMap[sec.name] = p;
        parsedMap[nameLower] = p;
      });
    }

    setDynamicShowPrices(parsedMap);
  };

  const handleDeleteShowtime = async (stId) => {
    try {
      await api.delete(`/theater/showtimes/${stId}`);
    } catch (e) {
      console.warn("Delete showtime warning:", e);
    }
    const targetScreenId = selectedShowScreenId || selectedScreen?.id;
    if (targetScreenId) {
      fetchShowtimes(targetScreenId);
    } else {
      setShowtimes(showtimes.filter((st) => st.id !== stId));
    }
  };

  // --- F&B HANDLERS ---
  const handleAddFoodItem = (e) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    if (editingFoodId) {
      const updated = fnbItems.map((item) =>
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
      saveFnbMenu([newItem, ...fnbItems]);
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
    const updated = fnbItems.filter((item) => item.id !== id);
    saveFnbMenu(updated);
    if (editingFoodId === id) setEditingFoodId(null);
  };

  const handleToggleFoodStock = (id) => {
    const updated = fnbItems.map((item) =>
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
        `⚠️ Duplicate Staff Member Blocked!\n\n${staffEmail} is already registered as '${existingStaff.role}' in this theater portal.\n\nA single person cannot be added for multiple roles in the same portal.`
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
      let mappedRole = "THEATER_MANAGER";
      if (staffRole !== "Branch Manager") {
        mappedRole = `THEATER_STAFF:${staffRole}`;
      }
      await api.post("/theater-invitations/direct-add", {
        firstName: staffFirstName.trim(),
        lastName: staffLastName.trim(),
        speakerName: fullName,
        email: staffEmail.trim(),
        phone: staffPhone.trim(),
        password: staffPassword.trim(),
        username: assignedEmpId,
        dutyRole: staffRole,
        roleName: mappedRole,
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
      role: staffRole,
      dutyRole: staffRole,
      status: "Accepted (On Duty)",
      screen: "All Screens",
    };

    const updatedList = [newStaffMember, ...staffList];
    setStaffList(updatedList);

    alert(`✅ Staff Added Directly to Database & Roster!\n\nMember Name: ${fullName}\nRole: ${staffRole}\nEmp ID / Username: ${assignedEmpId}\nEmail Address: ${staffEmail}\nPhone: ${staffPhone}`);
    setStaffFirstName("");
    setStaffLastName("");
    setStaffName("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffPassword("");
    setStaffEmpId(getNextEmpId(updatedList));
  };

  // STAFF INVITATION HANDLER USING BACKEND EMAIL SERVICE
  const handleInviteStaff = async (e) => {
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
      let mappedRole = "THEATER_MANAGER";
      if (staffRole !== "Branch Manager") {
        mappedRole = `THEATER_STAFF:${staffRole}`;
      }

      await api.post("/theater-invitations/invite", {
        email: staffEmail.trim(),
        speakerName: staffName.trim(),
        username: assignedEmpId,
        roleName: mappedRole,
        portalId: portalId ? Number(portalId) : null,
        invitedById: userId ? Number(userId) : null,
      });

      alert(`📧 Staff invitation email queued for ${staffName} (${staffRole})!\n\nAssigned Emp ID: ${assignedEmpId}\nRecipient Email: ${staffEmail}`);
      fetchInvitations();
    } catch (err) {
      console.error("Theater invitation API error:", err);
      alert(`Invitation recorded for ${staffEmail}!`);
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

  // DYNAMIC REVENUE & CAPACITY CALCULATIONS ACROSS ALL SCREENS
  const totalCapacitySum = screens.reduce((acc, scr) => acc + getScreenCapacity(scr.id), 0);
  const totalShowtimesCount = showtimes.length;

  const todayISO = new Date().toISOString().split("T")[0];
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

      // 1. Fetch from backend live sales history
      try {
        const res = await api.get("/theater/sales-history");
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach((s) => {
            if (s && (s.ticketId || s.id)) {
              salesMap.set(String(s.ticketId || s.id), s);
            }
          });
        }
      } catch (e) { }

      // 2. Scan and aggregate all localStorage sales keys
      const keys = ["pos_sales_history"];
      const pId = selectedTheater?.id || localStorage.getItem("portalId");
      if (pId) keys.push(`pos_sales_history_${pId}`);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === "pos_sales_history" || k.startsWith("pos_sales_history_"))) {
          if (!keys.includes(k)) keys.push(k);
        }
      }

      keys.forEach((k) => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((s) => {
                if (s && (s.ticketId || s.id)) {
                  salesMap.set(String(s.ticketId || s.id), s);
                }
              });
            }
          }
        } catch (e) { }
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
  }, [selectedTheater]);

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

    const activeSales = salesHistoryData.filter((s) => s.status !== "CANCELLED" && s.status !== "REFUNDED");

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

    const allBookedMap = { ...ownerBookedSeatsMap };
    try {
      const rawB = localStorage.getItem("pos_booked_seats_map");
      if (rawB) Object.assign(allBookedMap, JSON.parse(rawB));
    } catch (e) { }

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
    const allBookedMap = { ...ownerBookedSeatsMap };
    try {
      const rawB = localStorage.getItem("pos_booked_seats_map");
      if (rawB) Object.assign(allBookedMap, JSON.parse(rawB));
    } catch (e) { }

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
    const allBookedMap = { ...ownerBookedSeatsMap };
    try {
      const rawB = localStorage.getItem("pos_booked_seats_map");
      if (rawB) Object.assign(allBookedMap, JSON.parse(rawB));
    } catch (e) { }

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

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: <BsHouse size={16} /> },
    { id: "screens", label: "Screens & Technology", icon: <BsTv size={16} /> },
    { id: "seats", label: "Seat Builder", icon: <BsGrid3X3 size={16} /> },
    { id: "showtimes", label: "Showtimes", icon: <BsClockHistory size={16} /> },
    { id: "live-occupancy", label: "Live Seat booking", icon: <BsGrid3X3 size={16} /> },
    { id: "concessions", label: "Food & Beverage (F&B)", icon: <BsCupStraw size={16} /> },
    { id: "analytics", label: "Box Office Sales", icon: <BsBarChart size={16} /> },
    { id: "staff", label: "Team & Staff", icon: <BsPeople size={16} /> },
  ];

  let globalRowOffset = 0;

  // HELPER FUNCTION: GET EXACT CLASSES CONFIGURED FOR SPECIFIC TARGET SCREEN
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
      } catch (e) { }
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
    } catch (e) { }

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

  const targetScreenClasses = getClassesForTargetScreen(selectedShowScreenId || selectedScreen?.id);

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

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* DEDICATED THEATER NAVBAR */}
      <div className="organizer-layout-navbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <TheaterNavbar theaterName={cinemaName} />
      </div>

      {/* LEFT SIDEBAR */}
      <div
        className="bg-white border-end"
        style={{
          position: "fixed",
          top: "50px",
          left: 0,
          width: "250px",
          height: "calc(100vh - 50px)",
          zIndex: 999,
          overflowY: "auto",
        }}
      >
        <div className="pt-3">
          <div className="px-3 pb-3 mb-2 border-bottom d-flex align-items-center gap-2">
            <BsFilm size={22} className="text-primary" />
            <span className="fw-bold text-dark fs-6">{cinemaName}</span>
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`organizer-sidebar-item w-100 border-0 bg-transparent text-start d-flex align-items-center gap-3 px-3 py-2 mb-2 ${activeTab === item.id ? "active mx-3" : "text-dark mx-3"
                }`}
              style={{ borderRadius: "8px" }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span style={{ fontSize: "15px", fontWeight: 550 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main
        className="p-3"
        style={{
          marginLeft: "250px",
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
        {/* PAGE HEADER (SHOWN ONLY ON OVERVIEW HOME AND SCREENS PAGES) */}
        {(activeTab === "overview" || activeTab === "screens") && (
          <div className="d-flex align-items-center justify-content-between mb-3 bg-white p-3 rounded-3 shadow-sm border flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <BsFilm size={24} className="text-primary" />
              {isEditingCinemaName ? (
                <input
                  type="text"
                  className="form-control form-control-sm fw-bold fs-4 text-dark"
                  value={cinemaName}
                  onChange={(e) => setCinemaName(e.target.value)}
                  onBlur={() => setIsEditingCinemaName(false)}
                  autoFocus
                />
              ) : (
                <h2 className="fw-bold mb-0 text-dark fs-4 d-flex align-items-center gap-2">
                  {cinemaName}
                  <button className="btn btn-sm text-muted p-0 ms-1" onClick={() => setIsEditingCinemaName(true)} title="Edit Cinema Name">
                    <BsPencilSquare size={16} />
                  </button>
                </h2>
              )}
            </div>
            <button className="btn btn-primary px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2" onClick={() => setActiveTab("screens")}>
              <BsPlusLg /> Add Screen
            </button>
          </div>
        )}

        {/* --- 1. OVERVIEW DASHBOARD TAB (DYNAMIC DATA ONLY) --- */}
        {activeTab === "overview" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">TOTAL SCREENS</span>
                    <span className="p-2 bg-light text-primary rounded-3"><BsTv size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{screens.length} Screens</h3>
                  <small className="text-muted">Active halls</small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">TOTAL SEAT CAPACITY</span>
                    <span className="p-2 bg-light text-success rounded-3"><BsPeople size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{totalCapacitySum} Seats</h3>
                  <small className="text-muted">Dynamic seats from customized layouts</small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">TODAY'S SHOWTIMES</span>
                    <span className="p-2 bg-light text-warning rounded-3"><BsClockHistory size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">
                    {todayShowtimesCount} {todayShowtimesCount === 1 ? "Show" : "Shows"}
                  </h3>
                  <small className="text-muted">
                    {totalShowtimesCount} total scheduled shows
                  </small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">REAL BOX OFFICE REVENUE</span>
                    <span className="p-2 bg-light text-info rounded-3"><BsCashCoin size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">₹{realBoxOfficeRevenue.toLocaleString()}</h3>
                  <small className="text-muted">
                    {realTicketsSold > 0 ? `${realTicketsSold} tickets sold (Live POS)` : "Real-time ticket sales (₹0)"}
                  </small>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
              <h5 className="fw-bold text-dark mb-3">Live Active Screens & Projection Tech</h5>
              <div className="row g-3">
                {screens.map((scr) => (
                  <div className="col-md-4" key={scr.id}>
                    <div className="border rounded-3 p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0 text-dark text-truncate me-2">{scr.screenName}</h6>
                        <span className="badge bg-primary px-2 py-1 text-truncate" style={{ maxWidth: "150px" }} title={getProjectionBadge(scr)}>
                          {getProjectionBadge(scr)}
                        </span>
                      </div>
                      <small className="text-muted d-block mb-3">
                        Dynamic Capacity: <b>{getScreenCapacity(scr.id)} Seats</b>
                      </small>
                      <button
                        className="btn btn-sm btn-outline-primary w-100 fw-bold"
                        onClick={() => {
                          handleScreenChange(scr.id);
                          setActiveTab("seats");
                        }}
                      >
                        Customize Layout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- 2. SCREENS & TECHNOLOGY TAB (FORM + ADDED SCREENS LIST BELOW) --- */}
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
                  <label className="form-label fw-bold small text-dark">📽️ Projection Technology *</label>
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
                  <label className="form-label fw-bold small text-dark">🔊 Sound System *</label>
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
                  <label className="form-label fw-bold small text-dark">🎬 Screen Format *</label>
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

            {/* ADDED SCREENS LIST DISPLAYED BELOW THE FORM */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold text-dark mb-3">Configured Theater Screens List</h5>
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
                            <span>📽️</span>
                            <span className="text-muted">Projection:</span>
                            <strong className="text-dark">{scr.projectionType || "4K Dual Laser"}</strong>
                          </div>
                          <div className="d-flex align-items-center gap-2 text-dark mb-2">
                            <span>🔊</span>
                            <span className="text-muted">Sound:</span>
                            <strong className="text-dark">{scr.soundSystem || "Dolby Digital"}</strong>
                          </div>
                          <div className="d-flex align-items-center gap-2 text-dark">
                            <span>🎬</span>
                            <span className="text-muted">Format:</span>
                            <strong className="text-dark">{scr.screenFormat || scr.screenType || "Standard 2D"}</strong>
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between text-muted small mb-3">
                          <span>Dynamic Capacity:</span>
                          <span className="badge bg-secondary-subtle text-dark border px-2 py-1 fs-6 fw-bold">
                            {getScreenCapacity(scr.id)} Seats
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
                            handleScreenChange(scr.id);
                            setActiveTab("seats");
                          }}
                        >
                          <BsGrid3X3 /> Customize Layout
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <p className="text-muted small mb-0">Each screen has its own isolated layout. Saved layouts persist permanently!</p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <label className="fw-bold text-dark small mb-0">Active Screen Layout:</label>
                  <select
                    className="form-select form-select-sm fw-bold border-primary"
                    value={selectedScreen ? selectedScreen.id : ""}
                    onChange={(e) => handleScreenChange(e.target.value)}
                    style={{ width: "230px" }}
                  >
                    {screens.map((scr) => (
                      <option key={scr.id} value={scr.id}>
                        {scr.screenName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* FORM TO ADD PHYSICAL CLASS SECTION */}
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <BsPlusCircle className="text-primary" /> Add Physical Seat Class for {selectedScreen ? selectedScreen.screenName : "Screen"}
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
                      id="aisleBelowCheck"
                      checked={newClassAisleBelow}
                      onChange={(e) => setNewClassAisleBelow(e.target.checked)}
                    />
                    <label className="form-check-input-label fw-bold small text-dark ms-2" htmlFor="aisleBelowCheck">
                      Add Horizontal Aisle Walkway Below This Section
                    </label>
                  </div>
                </div>

                <div className="col-md-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                    <BsPlusLg /> Add Class to {selectedScreen ? selectedScreen.screenName : "Screen"}
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
                  ❌ Delete / Restore Seat {isDeleteToolActive && "✓ (Auto-Renumbering Active)"}
                </button>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold text-warning fs-6">
                  {selectedScreen ? selectedScreen.screenName : "Screen"} Capacity: {calculateTotalActiveCapacity()} Seats
                </span>
                <button className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 px-3 py-2" onClick={handleSaveLayout}>
                  <BsSave /> Save {selectedScreen ? selectedScreen.screenName : "Screen"} Layout
                </button>
              </div>
            </div>

            {/* SEAT BUILDER PREVIEW */}
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
              <div className="text-center bg-dark text-white py-2 mb-4 rounded-3 small fw-bold shadow-sm">
                SCREEN THIS WAY 🎬 ({selectedScreen ? selectedScreen.screenName : "Screen 1"}) — {selectedScreen ? selectedScreen.screenType : "Dolby Atmos 4K"}
              </div>

              {customSections.length === 0 ? (
                <div className="text-center py-5 text-muted border rounded-3 bg-light">
                  <BsTv size={42} className="mb-2 text-primary" />
                  <h5 className="fw-bold text-dark">No seat layout created for '{selectedScreen ? selectedScreen.screenName : "Screen"}' yet.</h5>
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
                          <div className="px-4 py-1 rounded-pill d-flex align-items-center gap-2 shadow-sm" style={{ backgroundColor: sec.color, color: sec.color === "#F59E0B" ? "#000" : "#FFF" }}>
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

                      {sec.hasAisleBelow ? (
                        <div className="w-100 py-2 my-2 text-center bg-light border-top border-bottom rounded-3 d-flex align-items-center justify-content-center gap-3 shadow-sm">
                          <span className="text-muted fw-bold small text-uppercase tracking-wider">
                            🚶 HORIZONTAL AISLE WALKWAY
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2 fw-bold d-flex align-items-center gap-1"
                            onClick={() => handleUpdateSection(sec.id, { hasAisleBelow: false })}
                            title="Remove Horizontal Aisle Walkway"
                            style={{ fontSize: "11px" }}
                          >
                            <BsTrash size={12} /> Remove Walkway
                          </button>
                        </div>
                      ) : (
                        <div className="w-100 text-center my-1">
                          <button
                            type="button"
                            className="btn btn-sm text-muted text-decoration-none small py-0 border-0 bg-transparent"
                            onClick={() => handleUpdateSection(sec.id, { hasAisleBelow: true })}
                            style={{ fontSize: "11px", fontWeight: "500" }}
                          >
                            + Add Horizontal Walkway Below {sec.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- 4. SHOWTIMES SCHEDULER (PRICE INPUTS GUARANTEED ALWAYS) --- */}
        {activeTab === "showtimes" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              {showtimeToastMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3 border-0 shadow-sm rounded-3 fw-bold text-success bg-success-subtle transition-all">
                  <BsCheckCircleFill className="fs-5 text-success" />
                  <span>{showtimeToastMsg}</span>
                </div>
              )}

              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-1">
                    {editingShowtimeId ? "Edit Scheduled Movie Showtime" : "Schedule Movie Showtime & Set Class Prices"}
                  </h5>
                  <p className="text-muted small mb-0">Select any target screen and movie to set ticket prices for the exact seat classes defined on that screen.</p>
                </div>
              </div>

              <form className="row g-3 mb-4 p-3 bg-light border rounded-3" onSubmit={handleAddOrUpdateShowtime}>
                <div className="col-md-3">
                  <label className="form-label fw-bold text-dark small">Target Screen Hall *</label>
                  <select
                    className="form-select fw-bold border-primary"
                    value={selectedShowScreenId || (screens[0]?.id || "")}
                    onChange={(e) => {
                      const sId = Number(e.target.value);
                      setSelectedShowScreenId(sId);
                    }}
                    required
                  >
                    {screens.map((scr) => (
                      <option key={scr.id} value={scr.id}>
                        {scr.screenName} ({scr.screenType || "Standard"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold text-dark small">Movie Title *</label>
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
                        padding: "2px",
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
                  <label className="form-label fw-bold text-dark small">Show Date *</label>
                  <IndianDatePicker
                    value={newShowDate}
                    onChange={(val) => setNewShowDate(val)}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold text-dark small">Exact Showtime *</label>
                  <input
                    type="time"
                    className="form-control fw-bold"
                    value={newShowTimeStr}
                    onChange={(e) => setNewShowTimeStr(e.target.value)}
                    required
                  />
                </div>

                {/* DYNAMIC TICKET PRICE INPUTS - ALWAYS RENDERED CLEARLY */}
                <div className="col-12 mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <BsTag className="text-primary" /> Set Ticket Prices for {screens.find((s) => String(s.id) === String(selectedShowScreenId || screens[0]?.id))?.screenName || "Selected Screen"}
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
                                value={
                                  dynamicShowPrices[sec.id] !== undefined
                                    ? dynamicShowPrices[sec.id]
                                    : dynamicShowPrices[sec.name] !== undefined
                                      ? dynamicShowPrices[sec.name]
                                      : dynamicShowPrices[(sec.name || "").toLowerCase()] !== undefined
                                        ? dynamicShowPrices[(sec.name || "").toLowerCase()]
                                        : 150
                                }
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setDynamicShowPrices((prev) => ({
                                    ...prev,
                                    [sec.id]: val,
                                    [sec.name]: val,
                                    [(sec.name || "").toLowerCase()]: val,
                                  }));
                                }}
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
                          Setting standard classes for {screens.find((s) => String(s.id) === String(selectedShowScreenId || selectedScreen?.id))?.screenName || "this screen"}.
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
          <LiveSeatBookingMain
            screens={screens}
            showtimes={showtimes}
            selectedScreenId={selectedShowScreenId}
            onScreenChange={setSelectedShowScreenId}
            selectedShowtimeId={editingShowtimeId}
            onShowtimeChange={setEditingShowtimeId}
            liveMovieSearch={liveMovieSearch}
            setLiveMovieSearch={setLiveMovieSearch}
            getLayoutForTargetScreen={getLayoutForTargetScreen}
            bookedSeatsMap={ownerBookedSeatsMap}
            formatIndianDate={formatIndianDate}
            ROW_LETTERS={ROW_LETTERS}
            getCanonicalSection={getCanonicalSection}
          />
        )}

        {/* --- 5. BOX OFFICE SALES TAB (DYNAMIC DATA & MOVIE-WISE BREAKDOWN) --- */}
        {activeTab === "analytics" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            {/* KPI SUMMARY CARDS */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">TODAY'S TICKET SALES</span>
                    <span className="p-2 bg-light text-warning rounded-3"><BsClockHistory size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">₹{totalTodayRevenue.toLocaleString()}</h3>
                  <small className="text-muted">{totalTodayTickets} tickets sold today</small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">OVERALL BOX OFFICE</span>
                    <span className="p-2 bg-light text-success rounded-3"><BsCashCoin size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">₹{realBoxOfficeRevenue.toLocaleString()}</h3>
                  <small className="text-muted">{realTicketsSold} total tickets sold in theater</small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">RUNNING MOVIES</span>
                    <span className="p-2 bg-light text-primary rounded-3"><BsFilm size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{movieWiseSales.length} Titles</h3>
                  <small className="text-muted">{todayShowtimesCount} shows running today</small>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold">THEATER CAPACITY</span>
                    <span className="p-2 bg-light text-info rounded-3"><BsTv size={20} /></span>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{totalCapacitySum} Seats</h3>
                  <small className="text-muted">Across {screens.length} active screens</small>
                </div>
              </div>
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

        {/* --- 6. TEAM & STAFF TAB (CORRECT SPELLING & INVITED LIST) --- */}
        {activeTab === "staff" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div>
              <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom pb-2">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    {addStaffMode === "direct" ? (
                      <>
                        <BsPersonCheck className="text-primary" /> Manually Add Staff Member to Roster
                      </>
                    ) : (
                      <>
                        <BsEnvelope className="text-primary" /> Invite Branch Manager or Staff Member
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
                        {staffRole === "Branch Manager" && <BsPersonBadge className="text-primary" />}
                        {staffRole.includes("Cashier") && <BsCashCoin className="text-success" />}
                        {staffRole.includes("Concession") && <BsCupStraw className="text-warning" />}
                        {staffRole.includes("Gate") && <BsQrCodeScan className="text-info" />}
                        <span>Role / Duty Designation *</span>
                      </label>
                      <select className="form-select fw-bold" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                        <option value="Branch Manager">Branch Manager</option>
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
                  <form className="row g-3" onSubmit={handleInviteStaff}>
                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                        <BsPeople /> Member Full Name *
                      </label>
                      <input type="text" className="form-control" placeholder="Enter full name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                        <BsEnvelope /> Email Address *
                      </label>
                      <input type="email" className="form-control" placeholder="Enter email address" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-dark d-flex align-items-center gap-1">
                        {staffRole === "Branch Manager" && <BsPersonBadge className="text-primary" />}
                        {staffRole.includes("Cashier") && <BsCashCoin className="text-success" />}
                        {staffRole.includes("Concession") && <BsCupStraw className="text-warning" />}
                        {staffRole.includes("Gate") && <BsQrCodeScan className="text-info" />}
                        <span>Role / Duty Designation *</span>
                      </label>
                      <select className="form-select fw-bold" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                        <option value="Branch Manager">Branch Manager</option>
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
                <h5 className="fw-bold text-dark mb-3">Cinema Invited Staff & Team Members</h5>
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Emp ID / Username</th>
                      <th>Member Name</th>
                      <th>Default Login Email</th>
                      <th>Assigned Role / Duty</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((m) => (
                      <tr key={m.id}>
                        <td className="fw-bold text-primary">{m.empId || m.username || getNextEmpId([{ id: m.id }])}</td>
                        <td className="fw-bold text-dark">{m.name}</td>
                        <td>{m.email}</td>
                        <td>
                          <span className={`badge px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 ${m.role === "Branch Manager"
                              ? "bg-primary-subtle text-primary border border-primary"
                              : m.role?.includes("Cashier")
                                ? "bg-success-subtle text-success border border-success"
                                : m.role?.includes("Concession")
                                  ? "bg-warning-subtle text-dark border border-warning"
                                  : "bg-info-subtle text-info-emphasis border border-info"
                            }`}>
                            {m.role === "Branch Manager" && <BsPersonBadge />}
                            {m.role?.includes("Cashier") && <BsCashCoin />}
                            {m.role?.includes("Concession") && <BsCupStraw />}
                            {m.role?.includes("Gate") && <BsQrCodeScan />}
                            <span>{m.role}</span>
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${m.status === "Accepted" || m.status === "ACCEPTED" || m.status.includes("On Duty")
                              ? "bg-success"
                              : m.status === "Rejected" || m.status === "REJECTED"
                                ? "bg-danger"
                                : String(m.status).includes("Expired")
                                  ? "bg-secondary"
                                  : "bg-warning text-dark"
                            }`}>
                            {m.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveStaff(m.id)}>
                            <BsTrash /> Delete / Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* F&B CONCESSIONS TAB */}
        {activeTab === "concessions" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div>
              {/* TOP HEADER WITH STATS AND LIVE SYNC */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <BsCupStraw className="text-primary" /> Food & Beverage (F&B) Management
                  </h4>
                  <p className="text-muted small mb-0">
                    Master snack & drink catalog synced in real-time with Branch Manager & Concession Counters.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success border border-success px-3 py-2 fw-bold">
                    ● Live Synced with Manager POS
                  </span>
                  <span className="badge bg-dark text-white px-3 py-2 fw-bold">
                    {fnbItems.length} Total Items
                  </span>
                </div>
              </div>

              {/* ADD / EDIT F&B MENU ITEM FORM */}
              <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <BsCupStraw className="text-primary" /> {editingFoodId ? "Edit F&B Menu Item" : "Add New F&B Snack / Drink Item"}
                  </h5>
                  {editingFoodId && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary fw-bold rounded-pill px-3"
                      onClick={handleCancelFoodEdit}
                    >
                      ✕ Cancel Edit
                    </button>
                  )}
                </div>
                <form onSubmit={handleAddFoodItem} className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-dark">Item Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cheese Popcorn / Cold Coffee"
                      value={newFoodName}
                      onChange={(e) => setNewFoodName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark">Category</label>
                    <select
                      className="form-select"
                      value={newFoodCategory}
                      onChange={(e) => setNewFoodCategory(e.target.value)}
                    >
                      <option value="Snacks">Snacks</option>
                      <option value="Popcorn">Popcorn</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Combos">Combos</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold small text-dark">Portion Size</label>
                    <select
                      className="form-select"
                      value={newFoodSize}
                      onChange={(e) => setNewFoodSize(e.target.value)}
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                      <option value="Regular">Regular</option>
                      <option value="500ml">500ml</option>
                      <option value="Combo Pack">Combo Pack</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold small text-dark">Price (₹) *</label>
                    <input
                      type="number"
                      className="form-control fw-bold"
                      value={newFoodPrice}
                      onChange={(e) => setNewFoodPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-1 d-flex gap-2">
                    <button type="submit" className={`btn ${editingFoodId ? "btn-primary" : "btn-success"} w-100 fw-bold`}>
                      {editingFoodId ? "Save" : "+ Add"}
                    </button>
                  </div>
                </form>
              </div>

              {/* SEARCH & CATEGORY FILTER BAR */}
              <div className="card border-0 shadow-sm p-3 bg-white rounded-3 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {["All", "Popcorn", "Snacks", "Beverages", "Combos", "Desserts"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 fw-bold ${fnbCategoryFilter === cat
                            ? "btn-primary shadow-sm"
                            : "btn-outline-secondary"
                          }`}
                        onClick={() => setFnbCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div style={{ maxWidth: "260px" }} className="w-100">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search menu item..."
                      value={fnbSearchQuery}
                      onChange={(e) => setFnbSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ACTIVE MENU GRID */}
              <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Active Menu Items</h5>
                  <span className="text-muted small fw-bold">
                    Showing {fnbItems.filter((item) => (fnbCategoryFilter === "All" || item.category === fnbCategoryFilter) && (!fnbSearchQuery.trim() || item.name.toLowerCase().includes(fnbSearchQuery.toLowerCase()))).length} items
                  </span>
                </div>

                <div className="row g-3">
                  {fnbItems
                    .filter((item) => {
                      const matchCat = fnbCategoryFilter === "All" || item.category === fnbCategoryFilter;
                      const matchQuery = !fnbSearchQuery.trim() || item.name.toLowerCase().includes(fnbSearchQuery.toLowerCase());
                      return matchCat && matchQuery;
                    })
                    .map((item) => (
                      <div className="col-md-3 col-sm-6" key={item.id}>
                        <div className={`border rounded-3 p-3 bg-light text-center h-100 d-flex flex-column justify-content-between shadow-sm transition-all ${editingFoodId === item.id ? "border-primary border-2 shadow" : ""}`}>
                          <div>
                            <BsCupStraw size={28} className="text-warning mb-2" />
                            <h6 className="fw-bold text-dark mb-1">{item.name}</h6>
                            <div className="d-flex justify-content-center gap-1 mb-2 flex-wrap">
                              <span className="badge bg-secondary">{item.category}</span>
                              <span className="badge bg-info text-dark">{item.size || "Regular"}</span>
                              <span className={`badge ${item.inStock !== false ? "bg-success" : "bg-danger"}`}>
                                {item.inStock !== false ? "In Stock" : "Out of Stock"}
                              </span>
                            </div>
                            <h5 className="fw-bold text-success mb-0">₹{item.price}</h5>
                          </div>
                          <div className="d-flex gap-1 mt-3">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary flex-grow-1 fw-bold"
                              title="Edit item"
                              onClick={() => handleEditFoodItemClick(item)}
                            >
                              <BsPencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm flex-grow-1 fw-bold ${item.inStock !== false ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => handleToggleFoodStock(item.id)}
                            >
                              {item.inStock !== false ? "Out" : "In"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger px-2 fw-bold"
                              title="Delete item"
                              onClick={() => handleRemoveFoodItem(item.id)}
                            >
                              <BsTrash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}