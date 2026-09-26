import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import TheaterNavbar from "../../components/Navbar/TheaterNavbar";
import api from "../../api/axiosConfig";
import { formatIndianDate, formatIndianTime } from "../../utils/dateTime";
import IndianDatePicker from "../../components/Common/IndianDatePicker";
import "../../styles/Admin.css";
import {
  BsFilm,
  BsClockHistory,
  BsGrid3X3,
  BsCashCoin,
  BsQrCodeScan,
  BsReceipt,
  BsCheckCircle,
  BsPrinter,
  BsDownload,
  BsPerson,
  BsCreditCard,
  BsPhone,
  BsArrowLeft,
  BsXCircle,
  BsSearch,
  BsBarChart,
  BsCalendarCheck,
  BsCashStack,
  BsTrash,
  BsCheckLg,
  BsExclamationCircle,
  BsPlayCircle,
  BsTv,
  BsTicketPerforated,
  BsPower,
  BsPeople,
  BsXLg,
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

const CASHIER_ROW_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

export default function TheaterCashierDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("live-movies"); // Default first page: "live-movies"
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [cinemaName, setCinemaName] = useState("Gopal Multiplex");
  const [screens, setScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");

  // Selected Movie for Page 1 (Live Theater Movies)
  const [selectedMovieTitle, setSelectedMovieTitle] = useState("");

  // Page 1 Search & Filter States
  const [page1SearchTitle, setPage1SearchTitle] = useState("");
  const [page1SearchDate, setPage1SearchDate] = useState("");
  const [page1SearchTime, setPage1SearchTime] = useState("");

  // POS Tab Search Bar Filter State
  const [movieSearchQuery, setMovieSearchQuery] = useState("");

  const [screenLayoutsMap, setScreenLayoutsMap] = useState({});
  const [bookedSeatsMap, setBookedSeatsMap] = useState({});
  const [heldSeatsMap, setHeldSeatsMap] = useState({}); // 5-min online payment hold

  const [selectedSeats, setSelectedSeats] = useState([]); // { key, num, section, price }
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [cashTendered, setCashTendered] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState(null);
  const cashierTicketRef = useRef(null);
  const [isDownloadingCashierTicket, setIsDownloadingCashierTicket] = useState(false);

  const handleDownloadCashierTicketPdf = async () => {
    if (!cashierTicketRef.current || isDownloadingCashierTicket) return;
    try {
      setIsDownloadingCashierTicket(true);
      const element = cashierTicketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = Math.min(120, pdfWidth - 30);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = imgHeight < pdfHeight - 30 ? 20 : 10;
      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`Ticket-${lastIssuedTicket?.ticketId || "Receipt"}.pdf`);
    } catch (err) {
      console.error("Failed to download cashier ticket PDF:", err);
      alert("Failed to generate PDF ticket. Please use Print Ticket.");
    } finally {
      setIsDownloadingCashierTicket(false);
    }
  };

  // Counter Active / Inactive Manual Toggle State (Persisted)
  const [isCounterActive, setIsCounterActive] = useState(() => {
    const saved = localStorage.getItem("theater_counter_active");
    return saved !== null ? saved === "true" : true;
  });

  const toggleCounterActive = () => {
    setIsCounterActive((prev) => {
      const next = !prev;
      localStorage.setItem("theater_counter_active", String(next));
      return next;
    });
  };

  // Staff & Counter Info
  const loggedInStaffName = `${localStorage.getItem("firstName") || "Cashier"} ${localStorage.getItem("lastName") || ""}`.trim();
  const loggedInStaffEmail = localStorage.getItem("email") || "cashier@cinema.com";
  const [openingFloat, setOpeningFloat] = useState(() => {
    const saved = localStorage.getItem("cashier_openingFloat");
    return saved ? Number(saved) : 2000;
  });
  const [manualCashSales, setManualCashSales] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);

  // Search state for Ticket Management
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [searchedTicketResult, setSearchedTicketResult] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const pId = localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2";

      // 1. Fetch screens
      const scrRes = await api.get(`/theater/${pId}/screens`);
      let loadedScreens = [];
      if (scrRes.data && Array.isArray(scrRes.data) && scrRes.data.length > 0) {
        loadedScreens = scrRes.data;
      } else {
        loadedScreens = [
          { id: 1, screenName: "SILVI", screenType: "4K Dual Laser", totalSeats: 418 },
          { id: 2, screenName: "LOKI", screenType: "IMAX 3D", totalSeats: 380 },
          { id: 3, screenName: "THOR", screenType: "Standard 2K", totalSeats: 384 },
        ];
      }
      setScreens(loadedScreens);

      if (loadedScreens.length > 0) {
        const firstScrId = loadedScreens[0].id;
        setSelectedScreenId(firstScrId);
        fetchShowtimesForScreen(firstScrId, pId);
      }

      // 2. Fetch screen layouts from localStorage/backend
      const savedLayouts = localStorage.getItem(`theater_screen_layouts_${pId}`);
      if (savedLayouts) {
        setScreenLayoutsMap(JSON.parse(savedLayouts));
      }

      // 3. Fetch initial sales history for the counter
      try {
        const salesRes = await api.get("/theater/sales-history");
        if (salesRes.data && Array.isArray(salesRes.data)) {
          // Filter to only show sales made at the counter (allow null/undefined for older tickets)
          const counterSales = salesRes.data.filter((s) => s.source === "COUNTER_POS" || s.source === "COUNTER" || !s.source);
          setSalesHistory(counterSales);
        }
      } catch (err) {
        console.warn("Failed to load counter sales:", err);
      }
    } catch (err) {
      console.warn("Cashier initial data fetch error:", err);
    }
  };

  const currentShow = showtimes.find((s) => String(s.id) === String(selectedShowtimeId));
  const currentScreenObj = screens.find((s) => String(s.id) === String(selectedScreenId)) || (screens.length > 0 ? screens[0] : null);
  const movieClean = (currentShow?.movieTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const screenClean = (currentScreenObj?.screenName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const dateClean = (currentShow?.showDate || currentShow?.date || "").replace(/[^0-9]/g, "");
  const timeClean = (currentShow?.startTime || "").replace(/[^0-9]/g, "").slice(0, 4);
  const showtimeContextKey = `CTX_${movieClean}_${screenClean}_${dateClean}_${timeClean}`;

  const loadBookedSeatsForCashier = async () => {
    try {
      const currentMap = {};



      if (selectedShowtimeId) {
        try {
          const res = await api.get(`/theater/showtimes/${selectedShowtimeId}/booked-seats`);
          if (Array.isArray(res.data)) {
            res.data.forEach((k) => {
              currentMap[`${selectedShowtimeId}-${k}`] = true;
              currentMap[`${showtimeContextKey}-${k}`] = true;
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
            const counterSales = res.data.filter((s) => s.source === "COUNTER_POS" || s.source === "COUNTER" || !s.source);
            setSalesHistory(counterSales);
          }
        } catch (e) { }

        salesMap.forEach((sale) => {
          if (!sale || sale.status === "CANCELLED" || sale.status === "REFUNDED") return;
          const sMatchStId = sale.showtimeId && String(sale.showtimeId) === String(selectedShowtimeId);

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
                  if (selectedShowtimeId) {
                    currentMap[`${selectedShowtimeId}-${cSec}-${seatN}`] = true;
                    currentMap[`${selectedShowtimeId}-${rawSec.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${seatN}`] = true;
                  }
                  currentMap[`${showtimeContextKey}-${cSec}-${seatN}`] = true;
                  currentMap[`${showtimeContextKey}-${rawSec.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${seatN}`] = true;
              }
            });
          }
        });
      } catch (e) { }

      setBookedSeatsMap(currentMap);
    } catch (e) { }
  };

  useEffect(() => {
    loadBookedSeatsForCashier();

    const handleStorageChange = (e) => {
      if (e.key === "pos_booked_seats_map" || (e.key && e.key.startsWith("pos_sales_history_"))) {
        loadBookedSeatsForCashier();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pos_booking_updated", loadBookedSeatsForCashier);

    const interval = setInterval(() => {
      loadBookedSeatsForCashier();
    }, 1500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pos_booking_updated", loadBookedSeatsForCashier);
      clearInterval(interval);
    };
  }, [selectedShowtimeId, selectedScreenId, showtimeContextKey]);

  const fetchShowtimesForScreen = async (scrId, pId) => {
    try {
      const portalId = pId || localStorage.getItem("portalId") || "2";
      let allShows = [];

      try {
        const res = await api.get(`/theater/${portalId}/showtimes`);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          allShows = res.data;
        }
      } catch (e) {
        console.warn("Theater showtimes endpoint error:", e);
      }

      if (screens.length > 0) {
        const perScreenPromises = screens.map((s) =>
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

      if (!allShows || allShows.length === 0) {
        const localShowtimesStr = localStorage.getItem(`theater_showtimes_${portalId}`);
        if (localShowtimesStr) {
          try {
            allShows = JSON.parse(localShowtimesStr);
          } catch (e) { }
        }
      }

      setShowtimes(allShows);
      setSelectedMovieTitle("");
      const todayIso = new Date().toISOString().split("T")[0];
      const validShows = allShows.filter((s) => !s.showDate || s.showDate >= todayIso);
      if (validShows.length > 0) {
        setSelectedShowtimeId(validShows[0].id);
      } else if (allShows.length > 0) {
        setSelectedShowtimeId(allShows[0].id);
      }
    } catch (err) {
      console.warn("Showtimes fetch warning:", err);
    }
  };

  const fetchScreenLayout = async (scrId) => {
    if (!scrId) return;
    const sId = String(scrId);
    try {
      const savedMapStr = localStorage.getItem("theater_screen_layouts_map");
      if (savedMapStr) {
        try {
          const map = JSON.parse(savedMapStr);
          if (map[sId] && map[sId].sections && map[sId].sections.length > 0) {
            setScreenLayoutsMap((prev) => ({ ...prev, [sId]: map[sId] }));
          }
        } catch (e) { }
      }

      const res = await api.get(`/theater/screens/${scrId}/layout`);
      let layoutData = res.data;
      if (typeof layoutData === "string") {
        try {
          layoutData = JSON.parse(layoutData);
        } catch (e) { }
      }
      if (layoutData && layoutData.sections && Array.isArray(layoutData.sections) && layoutData.sections.length > 0) {
        setScreenLayoutsMap((prev) => ({
          ...prev,
          [sId]: { sections: layoutData.sections, deletedSeats: layoutData.deletedSeats || {} },
        }));
      }
    } catch (err) {
      console.warn("Screen layout fetch warning:", err);
    }
  };

  const handleScreenChange = (scrId) => {
    setSelectedScreenId(scrId);
    setSelectedSeats([]);
    fetchScreenLayout(scrId);
  };

  const handleOpenPosForShowtime = (showObj) => {
    const sId = showObj.screen?.id || showObj.screenId || screens[0]?.id || 1;
    setSelectedScreenId(sId);
    setSelectedShowtimeId(showObj.id);
    setSelectedSeats([]);
    fetchScreenLayout(sId);
    setActiveTab("pos");
  };

  const getActiveLayout = () => {
    const sId = String(selectedScreenId);
    if (screenLayoutsMap[sId] && screenLayoutsMap[sId].sections && screenLayoutsMap[sId].sections.length > 0) {
      return screenLayoutsMap[sId].sections;
    }

    const activeShow = showtimes.find((s) => String(s.id) === String(selectedShowtimeId));
    const pricesMap = parseClassPricesMap(activeShow);
    const classKeys = Object.keys(pricesMap);

    if (classKeys.length > 0) {
      const colors = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];
      return classKeys.map((key, idx) => {
        const capName = key.charAt(0).toUpperCase() + key.slice(1);
        return {
          id: `sec-${idx + 1}`,
          name: `${capName}`,
          color: colors[idx % colors.length],
          rowsCount: idx === 0 ? 2 : 4,
          rows: idx === 0 ? 2 : 4,
          seatsPerRow: 16,
          centerAisleGap: 2,
          hasAisleBelow: idx === 0,
        };
      });
    }

    return [
      { id: "sec-1", name: "Balcony", color: "#F59E0B", rowsCount: 2, rows: 2, seatsPerRow: 12, centerAisleGap: 2, hasAisleBelow: true },
      { id: "sec-2", name: "Gold", color: "#3B82F6", rowsCount: 4, rows: 4, seatsPerRow: 16, centerAisleGap: 2, hasAisleBelow: false },
      { id: "sec-3", name: "Silver", color: "#10B981", rowsCount: 4, rows: 4, seatsPerRow: 16, centerAisleGap: 2, hasAisleBelow: false },
    ];
  };

  // Helper to parse class prices whether string "balcony(220),gold(190),silver(160)" or object { Balcony: 220 }
  const parseClassPricesMap = (st) => {
    if (!st) return {};

    // 1. If it's a map/object
    const rawObj = st.classPrices || st.dynamicShowPrices || st.priceMap;
    if (rawObj && typeof rawObj === "object" && !Array.isArray(rawObj)) {
      const res = {};
      Object.entries(rawObj).forEach(([k, v]) => {
        if (!k.startsWith("default_")) {
          const capKey = k.charAt(0).toUpperCase() + k.slice(1);
          res[capKey.toLowerCase()] = Number(v);
        }
      });
      if (Object.keys(res).length > 0) return res;
    }

    // 2. If it's a string like "balcony(220),gold(190),silver(160)" or "balcony:220,gold:190"
    const rawStr = typeof st.classPrices === "string" ? st.classPrices : (typeof st.classPricesStr === "string" ? st.classPricesStr : "");
    if (rawStr && rawStr.trim()) {
      const res = {};
      const parts = rawStr.split(",");
      parts.forEach((item) => {
        if (item.includes("(") && item.includes(")")) {
          const name = item.split("(")[0].trim().toLowerCase();
          const price = Number(item.split("(")[1].replace(")", "").trim());
          if (name) res[name] = price;
        } else if (item.includes(":")) {
          const name = item.split(":")[0].trim().toLowerCase();
          const price = Number(item.split(":")[1].trim());
          if (name) res[name] = price;
        }
      });
      if (Object.keys(res).length > 0) return res;
    }

    // 3. Fallback to default fields
    const res = {};
    if (st.priceNormal) res["normal"] = Number(st.priceNormal);
    if (st.priceExecutive) res["executive"] = Number(st.priceExecutive);
    if (st.priceRecliner) res["recliner"] = Number(st.priceRecliner);
    return res;
  };

  const getSectionPrice = (secName) => {
    const activeShow = showtimes.find((s) => String(s.id) === String(selectedShowtimeId));
    if (!activeShow) return 180;

    const pricesMap = parseClassPricesMap(activeShow);
    const secLower = (secName || "").trim().toLowerCase();

    // 1. Direct match by section name
    if (pricesMap[secLower] !== undefined) {
      return pricesMap[secLower];
    }

    // 2. Fuzzy match section name keywords (balcony, gold, silver, recliner, vip, exec, normal)
    for (const [k, p] of Object.entries(pricesMap)) {
      if (secLower.includes(k) || k.includes(secLower)) {
        return p;
      }
    }

    return 180;
  };

  const getFormattedClassesAndPrices = (scrObj, st) => {
    if (!st) return "";

    const pricesMap = parseClassPricesMap(st);
    const entries = Object.entries(pricesMap);

    if (entries.length > 0) {
      return entries
        .map(([k, v]) => {
          const capName = k.charAt(0).toUpperCase() + k.slice(1);
          return `${capName}: ₹${v}`;
        })
        .join(" | ");
    }

    return "Balcony: ₹220 | Gold: ₹190 | Silver: ₹160";
  };

  const handleSeatClick = (seatObj) => {
    if (!isCounterActive) {
      alert("Counter is currently OFF / Closed! Please click 'Turn Counter ON' above to start booking seats.");
      return;
    }
    const exists = selectedSeats.find((s) => s.key === seatObj.key);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.key !== seatObj.key));
    } else {
      setSelectedSeats([...selectedSeats, seatObj]);
    }
  };

  const calculateTotalBill = () => {
    return selectedSeats.reduce((sum, s) => sum + s.price, 0);
  };

  const handleProcessTicketBooking = () => {
    if (!isCounterActive) {
      alert("Counter is currently OFF / Closed! Please click 'Turn Counter ON' above to issue tickets.");
      return;
    }
    if (selectedSeats.length === 0) {
      alert("Please select at least 1 seat on the layout to sell a ticket!");
      return;
    }

    const activeShow = showtimes.find((s) => String(s.id) === String(selectedShowtimeId)) || {
      movieTitle: "Avatar: Fire and Ash",
      startTime: "02:30 PM",
      showDate: "2026-08-31",
    };
    const activeScr = screens.find((s) => String(s.id) === String(selectedScreenId)) || { screenName: "SILVI" };

    const totalBill = calculateTotalBill();

    const ticketRecord = {
      id: Date.now(),
      ticketId: `TIC-${Date.now().toString().slice(-6)}`,
      movieTitle: activeShow.movieTitle,
      screenName: activeScr.screenName,
      screenId: activeScr.id,
      showtimeId: activeShow.id,
      showDate: activeShow.showDate || new Date().toISOString().split("T")[0],
      startTime: activeShow.startTime || "02:30 PM",
      seats: selectedSeats.map((s) => `${s.section} ${s.num}`).join(", "),
      seatsFormatted: selectedSeats.map((s) => `${s.num}`).join(", "),
      seatCount: selectedSeats.length,
      selectedSeatsCount: selectedSeats.length,
      amount: totalBill,
      totalAmount: totalBill,
      subtotal: totalBill,
      paymentMode: paymentMode,
      customerName: customerName || "Walk-In Guest",
      customerPhone: customerPhone || "N/A",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      bookedDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      status: "VALID",
      source: "COUNTER_POS",
      theaterPortalId: localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2",
      portalId: localStorage.getItem("portalId") || localStorage.getItem("userPortalId") || "2",
    };

    const newBooked = { ...bookedSeatsMap };
    selectedSeats.forEach((s) => {
      const secClean = (s.section || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const cSec = getCanonicalSection(s.section);
      newBooked[`${selectedShowtimeId}-${s.key}`] = true;
      if (s.altKey) newBooked[`${selectedShowtimeId}-${s.altKey}`] = true;
      newBooked[`${selectedShowtimeId}-${s.section}-${s.num}`] = true;
      newBooked[`${selectedShowtimeId}-${secClean}-${s.num}`] = true;
      newBooked[`${selectedShowtimeId}-${cSec}-${s.num}`] = true;
      newBooked[`${showtimeContextKey}-${secClean}-${s.num}`] = true;
      newBooked[`${showtimeContextKey}-${cSec}-${s.num}`] = true;
      newBooked[`${showtimeContextKey}-${s.key}`] = true;
    });
    setBookedSeatsMap(newBooked);

    try {
      window.dispatchEvent(new Event("pos_booking_updated"));
    } catch (e) {}

    // Post to backend live sync
    try {
      const bookedKeys = selectedSeats.map((s) => s.key);
      api.post(`/theater/showtimes/${selectedShowtimeId}/book-seats`, {
        seatKeys: bookedKeys,
        customerName: customerName || "Walk-In Guest",
        customerPhone: customerPhone || "N/A",
        paymentMode: paymentMode,
        source: "COUNTER_POS",
      }).catch((e) => console.warn("POS backend book error:", e));

      api.post("/theater/sales-history", ticketRecord).catch((e) => console.warn("Sales history record error:", e));
    } catch (e) { }

    const updatedSales = [ticketRecord, ...salesHistory];
    setSalesHistory(updatedSales);
    const pId = localStorage.getItem("portalId") || "2";
    try {
      window.dispatchEvent(new Event("pos_booking_updated"));
    } catch (e) {}

    setLastIssuedTicket(ticketRecord);
    setIsReceiptModalOpen(true);
  };

  const handleFinishReceipt = () => {
    setIsReceiptModalOpen(false);
    setSelectedSeats([]);
    setCustomerName("");
    setCustomerPhone("");
    setCashTendered("");
  };

  const handleSearchTicket = (e) => {
    e.preventDefault();
    if (!ticketSearchQuery.trim()) return;
    const query = ticketSearchQuery.trim().toUpperCase();
    const found = salesHistory.find(
      (item) => item.ticketId.toUpperCase() === query || item.customerPhone.includes(query)
    );
    if (found) {
      setSearchedTicketResult(found);
    } else {
      setSearchedTicketResult({ error: `No ticket record found for query '${query}'.` });
    }
  };

  const handleCancelTicket = (ticketId) => {
    if (window.confirm(`Are you sure you want to cancel Ticket '${ticketId}' and process refund?`)) {
      const updatedSales = salesHistory.map((item) =>
        item.ticketId === ticketId ? { ...item, status: "CANCELLED" } : item
      );
      setSalesHistory(updatedSales);


      const targetTicket = salesHistory.find((item) => item.ticketId === ticketId);
      if (targetTicket) {
        const newBooked = { ...bookedSeatsMap };
        Object.keys(newBooked).forEach((k) => {
          if (k.includes(targetTicket.ticketId)) {
            delete newBooked[k];
          }
        });
        setBookedSeatsMap(newBooked);

      }

      if (searchedTicketResult && searchedTicketResult.ticketId === ticketId) {
        setSearchedTicketResult({ ...searchedTicketResult, status: "CANCELLED" });
      }
      alert(`Ticket ${ticketId} cancelled. Refund processed & seats released back to AVAILABLE!`);
    }
  };

  // Filter showtimes for Page 1 based on Movie Title, Date, and Time search
  const todayIso = new Date().toISOString().split("T")[0];
  const filteredShowtimesForPage1 = showtimes.filter((st) => {
    const isFutureOrToday = !st.showDate || st.showDate >= todayIso;
    const titleMatch = !page1SearchTitle.trim() || (st.movieTitle || "").toLowerCase().includes(page1SearchTitle.toLowerCase());
    const dateMatch = !page1SearchDate || (st.showDate || "").includes(page1SearchDate);
    const timeMatch = !page1SearchTime || (st.startTime || "").includes(page1SearchTime);
    return isFutureOrToday && titleMatch && dateMatch && timeMatch;
  });

  // Group filtered showtimes by movie title
  const uniqueMoviesList = Array.from(new Set(filteredShowtimesForPage1.map((st) => st.movieTitle)));

  // Filter showtimes for the selected movie on Page 1 (only when selectedMovieTitle is set)
  const showtimesForSelectedMovie = selectedMovieTitle
    ? filteredShowtimesForPage1.filter((st) => st.movieTitle === selectedMovieTitle)
    : [];

  // Sales totals
  const totalShiftSales = salesHistory
    .filter((s) => s.status !== "CANCELLED")
    .reduce((sum, item) => sum + item.amount, 0);

  const calculatedCashSales = salesHistory
    .filter((s) => s.status !== "CANCELLED" && s.paymentMode === "Cash")
    .reduce((sum, item) => sum + item.amount, 0);

  const cashSalesTotal = manualCashSales !== null ? manualCashSales : calculatedCashSales;

  const upiSalesTotal = salesHistory
    .filter((s) => s.status !== "CANCELLED" && s.paymentMode === "UPI")
    .reduce((sum, item) => sum + item.amount, 0);

  const cardSalesTotal = salesHistory
    .filter((s) => s.status !== "CANCELLED" && s.paymentMode === "Card")
    .reduce((sum, item) => sum + item.amount, 0);

  const salesByMovieMap = {};
  salesHistory
    .filter((s) => s.status !== "CANCELLED")
    .forEach((item) => {
      if (!salesByMovieMap[item.movieTitle]) {
        salesByMovieMap[item.movieTitle] = { count: 0, revenue: 0 };
      }
      salesByMovieMap[item.movieTitle].count += 1;
      salesByMovieMap[item.movieTitle].revenue += item.amount;
    });

  const filteredShowtimesForPos = showtimes.filter((st) => {
    const isFutureOrToday = !st.showDate || st.showDate >= todayIso;
    const screenMatch = (st.screen?.id && String(st.screen.id) === String(selectedScreenId)) || (st.screenId && String(st.screenId) === String(selectedScreenId));
    if (!movieSearchQuery.trim()) return isFutureOrToday && screenMatch;
    const q = movieSearchQuery.toLowerCase();
    return (
      isFutureOrToday &&
      screenMatch &&
      ((st.movieTitle || "").toLowerCase().includes(q) ||
        (st.showDate || "").toLowerCase().includes(q) ||
        (st.startTime || "").toLowerCase().includes(q))
    );
  });

  const sidebarMenuItems = [
    { id: "live-movies", label: "Live Theater Movies", icon: <BsFilm size={16} /> },
    { id: "pos", label: "Box Office Ticket POS", icon: <BsCashCoin size={16} /> },
    { id: "sales", label: "Today's Counter Sales", icon: <BsBarChart size={16} /> },
    { id: "reconciliation", label: "Cash Drawer Settlement", icon: <BsCashStack size={16} /> },
    { id: "tickets", label: "Ticket Search & Refunds", icon: <BsReceipt size={16} /> },
  ];

  const sections = getActiveLayout();

  return (
    <div style={{ backgroundColor: "#f8fafc", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* TOP NAVBAR */}
      <div className="organizer-layout-navbar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1050 }}>
        <TheaterNavbar 
          theaterName={`${cinemaName} — Box Office Cashier Console`} 
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} 
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

      {/* LEFT SIDEBAR NAVIGATION (DESKTOP FIXED + MOBILE SLIDE-OVER DRAWER) */}
      <aside
        className={`bg-white border-end theater-owner-sidebar ${isMobileSidebarOpen ? "theater-owner-sidebar-open" : ""}`}
        style={{
          position: "fixed",
          top: "50px",
          left: 0,
          width: "250px",
          height: "calc(100vh - 50px)",
          zIndex: 1050,
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
            {sidebarMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`organizer-sidebar-item w-100 border-0 bg-transparent text-start d-flex align-items-center gap-3 px-3 py-2 mb-2 ${
                  activeTab === item.id ? "active" : "text-dark"
                }`}
                style={{ borderRadius: "8px" }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ fontSize: "14px", fontWeight: 550 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CASHIER CONTENT AREA */}
      <main
        className="theater-owner-main p-2 p-md-3"
        style={{
          marginTop: "50px",
          height: "calc(100vh - 50px)",
          maxHeight: "calc(100vh - 50px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* COUNTER ACTIVE / INACTIVE TOGGLE BAR */}
        <div className="bg-white border rounded-3 p-2 px-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2 flex-shrink-0 shadow-sm">
          <div className="d-flex flex-wrap align-items-center gap-2">
            {isCounterActive ? (
              <span className="badge bg-success-subtle text-success border border-success px-3 py-2 d-flex align-items-center gap-2 fs-6 fw-bold">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: "8px", height: "8px" }}></span>
                COUNTER ACTIVE (OPEN)
              </span>
            ) : (
              <span className="badge bg-danger-subtle text-danger border border-danger px-3 py-2 d-flex align-items-center gap-2 fs-6 fw-bold">
                <span className="spinner-grow spinner-grow-sm text-danger" style={{ width: "8px", height: "8px" }}></span>
                COUNTER INACTIVE (CLOSED / ON BREAK)
              </span>
            )}

            <button
              type="button"
              className={`btn btn-sm ${isCounterActive ? "btn-outline-danger" : "btn-success"} fw-bold px-3 py-1.5 rounded-pill d-flex align-items-center gap-2 shadow-xs`}
              onClick={toggleCounterActive}
            >
              <BsPower size={14} />
              {isCounterActive ? "Turn Counter OFF (Take Break)" : "Turn Counter ON (Open Counter)"}
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
              Today's Desk Sales: <strong className="text-success ms-1">₹{totalShiftSales}</strong>
            </span>
          </div>
        </div>
        {/* --- PAGE 1: LIVE THEATER MOVIES & SHOWTIMES LIST --- */}
        {activeTab === "live-movies" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div>
              {/* PAGE 1 SEARCH & FILTER BAR */}
              <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <BsSearch className="text-primary" /> Search & Filter Movies
                </h6>
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-dark mb-1">Movie Title</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0" style={{ height: "42px" }}>
                        <BsSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        style={{ height: "42px" }}
                        placeholder="Search movie title (e.g. Avatar / Coolie)..."
                        value={page1SearchTitle}
                        onChange={(e) => {
                          setPage1SearchTitle(e.target.value);
                          setSelectedMovieTitle("");
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark mb-1">Show Date</label>
                    <IndianDatePicker
                      value={page1SearchDate}
                      onChange={(val) => {
                        setPage1SearchDate(val);
                        setSelectedMovieTitle("");
                      }}
                      style={{ height: "42px" }}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold small text-dark mb-1">Showtime</label>
                    <input
                      type="time"
                      className="form-control"
                      style={{ height: "42px" }}
                      value={page1SearchTime}
                      onChange={(e) => {
                        setPage1SearchTime(e.target.value);
                        setSelectedMovieTitle("");
                      }}
                    />
                  </div>

                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 fw-bold d-flex align-items-center justify-content-center"
                      style={{ height: "42px" }}
                      title="Reset Search Filters"
                      onClick={() => {
                        setPage1SearchTitle("");
                        setPage1SearchDate("");
                        setPage1SearchTime("");
                        setSelectedMovieTitle("");
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* NOW SHOWING & ADVANCE BOOKING MOVIES SELECTION CARD */}
              <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                  <div>
                    <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                      <BsFilm className="text-primary" /> Now Showing & Advance Booking Movies
                    </h5>
                    <p className="text-muted small mb-0">
                      Select a movie card below to view scheduled showtimes across screens for current and advance bookings.
                    </p>
                  </div>

                  <div className="badge bg-success-subtle text-success border border-success px-3 py-2 fs-6">
                    {uniqueMoviesList.length} Movies Available
                  </div>
                </div>

                {/* TOP SECTION: MOVIE CARDS */}
                <h6 className="fw-bold text-dark mb-3">Listed Movies for Booking (Click to Select Movie):</h6>
                <div className="row g-3 mb-4">
                  {uniqueMoviesList.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0">No movies found matching your search filter.</p>
                  ) : (
                    uniqueMoviesList.map((mTitle) => {
                      const isSelected = selectedMovieTitle === mTitle;
                      const movieShows = filteredShowtimesForPage1.filter((st) => st.movieTitle === mTitle);
                      const sampleShow = movieShows[0] || {};
                      const movieDesc = sampleShow.description || sampleShow.genre || "Action / Drama • 4K Laser Projection • Dolby Atmos";

                      return (
                        <div className="col-md-4" key={mTitle}>
                          <div
                            className={`p-3 rounded-3 border transition-all ${isSelected ? "border-2 border-primary bg-primary-subtle shadow-sm" : "bg-white hover-shadow"
                              }`}
                            onClick={() => setSelectedMovieTitle(mTitle)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h5 className="fw-bold text-dark mb-0">{mTitle}</h5>
                              <span className="badge bg-primary">{movieShows.length} Shows Scheduled</span>
                            </div>
                            <p className="text-muted small mb-0">
                              {movieDesc}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* BOTTOM SECTION: SHOWTIMES LIST FOR SELECTED MOVIE ONLY */}
                {selectedMovieTitle ? (
                  <div className="pt-3 border-top">
                    <h6 className="fw-bold text-dark mb-3">
                      Scheduled Screens & Showtime Slots for <strong className="text-primary">{selectedMovieTitle}</strong>:
                    </h6>

                    <div className="row g-3">
                      {showtimesForSelectedMovie.length === 0 ? (
                        <p className="text-muted text-center py-3">No showtime slots found for this movie.</p>
                      ) : (
                        showtimesForSelectedMovie.map((st) => {
                          const scrObj = screens.find((s) => String(s.id) === String(st.screen?.id || st.screenId)) || { screenName: "SILVI", screenType: "4K Dual Laser" };
                          const shortTech = (scrObj.screenType || "4K Dual Laser").split("•")[0].split("(")[0].trim();

                          return (
                            <div className="col-auto mb-3" key={st.id}>
                              {/* HUG CONTENT BLUE BORDER BOX */}
                              <div
                                className="p-3 bg-white border border-2 border-primary rounded-3 shadow-sm hover-shadow transition-all"
                                onClick={() => handleOpenPosForShowtime(st)}
                                style={{ cursor: "pointer", width: "fit-content" }}
                                title="Click to open POS seat map for this showtime"
                              >
                                {/* OUTSIDE TOP INSIDE BOX FLEX: SCREEN NAME (LEFT), DATE (RIGHT) */}
                                <div className="d-flex justify-content-between align-items-center mb-2 gap-4">
                                  <span className="fw-bold text-dark small d-flex align-items-center gap-1">
                                    <BsTv className="text-primary" /> {scrObj.screenName} Screen
                                  </span>
                                  <span className="fw-bold text-secondary small">{formatIndianDate(st.showDate) || "Today"}</span>
                                </div>

                                {/* LINE 1 INSIDE BOX: TIME (LEFT), PROJECTION TECH (RIGHT) */}
                                <div className="d-flex justify-content-between align-items-center mb-2 gap-4">
                                  <span className="fw-bold fs-5 text-dark">{formatIndianTime(st.startTime)}</span>
                                  <span className="badge bg-primary-subtle text-primary border border-primary px-2 py-1 small fw-bold">
                                    {shortTech}
                                  </span>
                                </div>

                                {/* LINE 2 INSIDE BOX: DYNAMIC SEAT CLASSES AND PRICES */}
                                <div className="border-top pt-2 mt-1 small fw-bold text-success text-nowrap">
                                  {getFormattedClassesAndPrices(scrObj, st)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-top text-center py-4 bg-light rounded-3 border text-muted">
                    <BsFilm size={32} className="text-primary mb-2" />
                    <h6 className="fw-bold text-dark mb-1">No Movie Selected Yet</h6>
                    <p className="small mb-0">Select a movie card above to view available screens, showtime slots & seat map.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE 2: LIVE TICKET POS TAB --- */}
        {activeTab === "pos" && (
          <div className="d-flex flex-column h-100 overflow-hidden">
            {/* SEARCH & SCREEN SELECTION HEADER (FIXED AT TOP) */}
            <div className="card border-0 shadow-sm p-3 bg-white rounded-3 mb-3 flex-shrink-0">
              <div className="row align-items-center g-3">
                <div className="col-md-5">
                  <label className="fw-bold small text-dark mb-1 d-flex align-items-center gap-1">
                    <BsSearch className="text-primary" /> Search Movie, Show Date or Showtime:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Avatar / 02:30 PM / 2026-08-31..."
                    value={movieSearchQuery}
                    onChange={(e) => setMovieSearchQuery(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="fw-bold small text-dark mb-1">Target Screen Hall:</label>
                  <select
                    className="form-select fw-bold border-primary"
                    value={selectedScreenId}
                    onChange={(e) => handleScreenChange(Number(e.target.value))}
                  >
                    {screens.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.screenName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="fw-bold small text-dark mb-1">Scheduled Showtime:</label>
                  <select
                    className="form-select fw-bold border-success"
                    value={selectedShowtimeId}
                    onChange={(e) => {
                      setSelectedShowtimeId(e.target.value);
                      setSelectedSeats([]);
                    }}
                  >
                    {filteredShowtimesForPos.length === 0 ? (
                      <option value="">No matching showtimes</option>
                    ) : (
                      filteredShowtimesForPos.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.movieTitle} ({formatIndianTime(st.startTime)}) — Date: {formatIndianDate(st.showDate) || "Today"}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* MAIN POS TWO-COLUMN SCROLLABLE AREA */}
            <div className="row g-3 flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
              {/* LEFT COLUMN: 4-STATE LIVE PHYSICAL SEAT MAP */}
              <div className="col-lg-8 mb-3 mb-lg-0">
                <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                      <h6 className="fw-bold text-dark mb-0">
                        Live Seat booking — {currentScreenObj?.screenName || "Screen"}
                      </h6>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-primary-subtle text-primary border border-primary px-2 py-1 small fw-bold">
                          Movie: {currentShow?.movieTitle || "Mandadi"}
                        </span>
                        <span className="badge bg-success-subtle text-success border border-success px-2 py-1 small fw-bold">
                          Showtime: {formatIndianTime(currentShow?.startTime) || "09:30 AM"}
                        </span>
                        <span className="badge bg-secondary-subtle text-dark border px-2 py-1 small fw-bold">
                          Date: {formatIndianDate(currentShow?.showDate) || "Today"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-end gap-3 small flex-wrap pt-2 border-top">
                      <div className="d-flex align-items-center gap-1">
                        <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "#9ca3af" }}></span>
                        <span className="text-muted fw-bold small">Available</span>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "#10B981" }}></span>
                        <span className="text-success fw-bold small">Selected</span>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "#ef4444" }}></span>
                        <span className="text-danger fw-bold small">Sold / Booked</span>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "#f59e0b" }}></span>
                        <span className="text-warning fw-bold small">Holded (5-min Online)</span>
                      </div>
                    </div>
                  </div>

                  {/* SEAT GRID RENDERER */}
                  <div className="p-3 bg-light rounded-3 border overflow-auto text-center" style={{ minHeight: "380px" }}>
                    {(() => {
                      let cashierFloorRowOffset = 0;
                      const sId = String(selectedScreenId);
                      const currentDeletedSeats = (screenLayoutsMap[sId] && screenLayoutsMap[sId].deletedSeats) || {};

                      return sections.map((sec) => {
                        const secPrice = getSectionPrice(sec.name);
                        const isBalcony = (sec.name || "").toLowerCase().includes("balcony");
                        const secRows = sec.rowsCount || sec.rows || 4;
                        const sectionRowLabels = [];
                        if (isBalcony) {
                          for (let r = 0; r < secRows; r++) {
                            sectionRowLabels.push(CASHIER_ROW_LETTERS[r] || `B-R${r + 1}`);
                          }
                        } else {
                          for (let r = 0; r < secRows; r++) {
                            sectionRowLabels.push(CASHIER_ROW_LETTERS[cashierFloorRowOffset++] || `R${cashierFloorRowOffset}`);
                          }
                        }

                        return (
                          <div key={sec.id} className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2 px-2 border-bottom pb-1">
                              <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                                <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: sec.color || "#3B82F6" }}></span>
                                {sec.name} {isBalcony ? "• Upper Balcony" : ""}
                              </span>
                              <span className="badge bg-success-subtle text-success border border-success fw-bold">
                                ₹{secPrice} / Ticket
                              </span>
                            </div>

                            {Array.from({ length: secRows }).map((_, rIdx) => {
                              const rowLetter = sectionRowLabels[rIdx] || String.fromCharCode(65 + rIdx);
                              const halfSeats = Math.floor((sec.seatsPerRow || 16) / 2);
                              let activeSeatCounter = 1;

                              return (
                                <div
                                  className="d-flex align-items-center justify-content-center gap-2 mb-2"
                                  key={`${sec.id}-${rIdx}`}
                                >
                                  <span className="fw-bold small text-dark me-2" style={{ width: "25px" }}>
                                    {rowLetter}
                                  </span>

                                  <div className="d-flex gap-1">
                                    {Array.from({ length: halfSeats }).map((_, cIdx) => {
                                      const key1 = `${sec.id}-${rowLetter}-${cIdx}`;
                                      const key2 = `${sec.id}-${rIdx}-${cIdx}`;
                                      const isDeleted = Boolean(
                                        currentDeletedSeats[key1] || currentDeletedSeats[key2]
                                      );

                                      if (isDeleted) {
                                        return (
                                          <div
                                            key={cIdx}
                                            style={{ width: "32px", height: "32px", visibility: "hidden" }}
                                          />
                                        );
                                      }

                                      const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                                      const seatKey = key1;
                                      const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                                      const cSec = getCanonicalSection(sec.name || sec.id);

                                      const isSold = Boolean(
                                        bookedSeatsMap[`${showtimeContextKey}-${key1}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${key2}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${sec.id}-${seatNumDisplay}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${secClean}-${seatNumDisplay}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`]
                                      );
                                      const isHeld = Boolean(
                                        heldSeatsMap[`${showtimeContextKey}-${key1}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${key2}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${sec.id}-${seatNumDisplay}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${secClean}-${seatNumDisplay}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`]
                                      );
                                      const isSelected = selectedSeats.some((s) => s.key === seatKey);

                                      let bgColor = "#9ca3af";
                                      if (isSold) bgColor = "#ef4444";
                                      else if (isHeld) bgColor = "#f59e0b";
                                      else if (isSelected) bgColor = "#10B981";

                                      return (
                                        <button
                                          key={cIdx}
                                          type="button"
                                          disabled={isSold || isHeld}
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
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "5px",
                                            fontWeight: "700",
                                            fontSize: "10px",
                                            cursor: isSold || isHeld ? "not-allowed" : "pointer",
                                            backgroundColor: bgColor,
                                            color: "#ffffff",
                                            border: "none",
                                            boxShadow: isSelected ? "0 0 0 2px #047857" : "none",
                                            transition: "all 0.15s ease",
                                          }}
                                          title={
                                            isSold
                                              ? `Seat ${seatNumDisplay} (${sec.name}) - Sold`
                                              : isHeld
                                                ? `Seat ${seatNumDisplay} (${sec.name}) - Holded (Online)`
                                                : `Seat ${seatNumDisplay} (${sec.name}) - ₹${secPrice}`
                                          }
                                        >
                                          {seatNumDisplay}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {sec.centerAisleGap > 0 && (
                                    <div style={{ width: `${(sec.centerAisleGap || 2) * 20}px` }}></div>
                                  )}

                                  <div className="d-flex gap-1">
                                    {Array.from({ length: (sec.seatsPerRow || 16) - halfSeats }).map((_, cIdx) => {
                                      const actualCIdx = halfSeats + cIdx;
                                      const key1 = `${sec.id}-${rowLetter}-${actualCIdx}`;
                                      const key2 = `${sec.id}-${rIdx}-${actualCIdx}`;
                                      const isDeleted = Boolean(
                                        currentDeletedSeats[key1] || currentDeletedSeats[key2]
                                      );

                                      if (isDeleted) {
                                        return (
                                          <div
                                            key={actualCIdx}
                                            style={{ width: "32px", height: "32px", visibility: "hidden" }}
                                          />
                                        );
                                      }

                                      const seatNumDisplay = `${rowLetter}${activeSeatCounter++}`;
                                      const seatKey = key1;
                                      const secClean = (sec.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                                      const cSec = getCanonicalSection(sec.name || sec.id);

                                      const isSold = Boolean(
                                        bookedSeatsMap[`${showtimeContextKey}-${key1}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${key2}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${sec.id}-${seatNumDisplay}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${secClean}-${seatNumDisplay}`] ||
                                        bookedSeatsMap[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`]
                                      );
                                      const isHeld = Boolean(
                                        heldSeatsMap[`${showtimeContextKey}-${key1}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${key2}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${sec.id}-${seatNumDisplay}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${secClean}-${seatNumDisplay}`] ||
                                        heldSeatsMap[`${showtimeContextKey}-${cSec}-${seatNumDisplay}`]
                                      );
                                      const isSelected = selectedSeats.some((s) => s.key === seatKey);

                                      let bgColor = "#9ca3af";
                                      if (isSold) bgColor = "#ef4444";
                                      else if (isHeld) bgColor = "#f59e0b";
                                      else if (isSelected) bgColor = "#10B981";

                                      return (
                                        <button
                                          key={actualCIdx}
                                          type="button"
                                          disabled={isSold || isHeld}
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
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "5px",
                                            fontWeight: "700",
                                            fontSize: "10px",
                                            cursor: isSold || isHeld ? "not-allowed" : "pointer",
                                            backgroundColor: bgColor,
                                            color: "#ffffff",
                                            border: "none",
                                            boxShadow: isSelected ? "0 0 0 2px #047857" : "none",
                                            transition: "all 0.15s ease",
                                          }}
                                          title={
                                            isSold
                                              ? `Seat ${seatNumDisplay} (Sold)`
                                              : isHeld
                                                ? `Seat ${seatNumDisplay} (Holded - Online)`
                                                : `Seat ${seatNumDisplay} - ₹${secPrice}`
                                          }
                                        >
                                          {seatNumDisplay}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {(sec.hasAisleBelow || sec.aisleBelow) && (
                              <div className="w-100 text-center my-3 py-1.5 bg-white rounded border border-dashed shadow-xs">
                                <small className="text-muted fw-bold d-flex align-items-center justify-content-center gap-1" style={{ fontSize: "10px", letterSpacing: "2px" }}>
                                  <BsPeople /> HORIZONTAL AISLE WALKWAY <BsPeople />
                                </small>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* CINEMA SCREEN PROJECTION ARCH AT THE BOTTOM */}
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
                        ALL EYES THIS WAY • CINEMA SCREEN
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: POS TICKET CART */}
              <div className="col-lg-4 mb-4 mb-lg-0">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2 border-bottom pb-2">
                    <BsReceipt className="text-primary" /> Counter Ticket Summary
                  </h6>

                  <div className="p-2 bg-light rounded-2 border mb-2">
                    <h6 className="fw-bold text-dark mb-0 small">
                      {currentShow?.movieTitle || selectedMovieTitle || (showtimes.length > 0 ? showtimes[0].movieTitle : "No Showtime Selected")}
                    </h6>
                    <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: "11px" }}>
                      <span>Screen: <strong className="text-dark">{currentScreenObj?.screenName || (screens.length > 0 ? screens[0].screenName : "Hall")}</strong></span>
                      <span>Time: <strong className="text-primary">{currentShow?.startTime || (showtimes.length > 0 ? showtimes[0].startTime : "--:--")}</strong></span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>
                      Selected Seats ({selectedSeats.length}):
                    </label>
                    {selectedSeats.length === 0 ? (
                      <p className="text-muted small text-center py-2 border rounded-2 bg-light mb-0" style={{ fontSize: "11px" }}>
                        Click seats on physical layout to select tickets.
                      </p>
                    ) : (
                      <div className="d-flex flex-wrap gap-1 p-2 bg-light border rounded-2 max-vh-25 overflow-auto">
                        {selectedSeats.map((s) => (
                          <span key={s.key} className="badge bg-primary px-2 py-1 small fw-bold d-flex align-items-center gap-1">
                            {s.num} ({s.section}) - ₹{s.price}
                            <BsXCircle
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedSeats(selectedSeats.filter((item) => item.key !== s.key))}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>Customer Name (Optional)</label>
                    <div className="input-group input-group-sm mb-2">
                      <span className="input-group-text bg-light"><BsPerson /></span>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Walk-In Guest"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        disabled={selectedSeats.length === 0}
                      />
                    </div>

                    <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>Customer Phone (Optional)</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light"><BsPhone /></span>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="+91 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        disabled={selectedSeats.length === 0}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>Payment Mode *</label>
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm py-1 fw-bold ${paymentMode === "Cash" ? "btn-success" : "btn-outline-secondary"}`}
                        onClick={() => setPaymentMode("Cash")}
                        disabled={selectedSeats.length === 0}
                      >
                        <BsCashCoin className="me-1" /> Cash
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm py-1 fw-bold ${paymentMode === "UPI" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setPaymentMode("UPI")}
                        disabled={selectedSeats.length === 0}
                      >
                        <BsQrCodeScan className="me-1" /> UPI / QR
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm py-1 fw-bold ${paymentMode === "Card" ? "btn-dark" : "btn-outline-secondary"}`}
                        onClick={() => setPaymentMode("Card")}
                        disabled={selectedSeats.length === 0}
                      >
                        <BsCreditCard className="me-1" /> Card
                      </button>
                    </div>
                  </div>

                  {paymentMode === "Cash" && (
                    <div className="mb-2 p-2 bg-light rounded-2 border">
                      <label className="fw-bold text-dark mb-1 d-block" style={{ fontSize: "11px" }}>Cash Tendered by Customer</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold bg-white">₹</span>
                        <input
                          type="number"
                          className="form-control form-control-sm fw-bold"
                          placeholder="e.g. 500"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          disabled={selectedSeats.length === 0}
                        />
                      </div>
                      {cashTendered && Number(cashTendered) >= calculateTotalBill() && (
                        <div className="mt-1 text-success fw-bold small" style={{ fontSize: "11px" }}>
                          Change to Return: ₹{Number(cashTendered) - calculateTotalBill()}
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMode === "UPI" && (
                    <div className="mb-2 p-2 bg-info-subtle border border-info rounded-2 text-center">
                      <small className="fw-bold text-info-emphasis d-block mb-1" style={{ fontSize: "11px" }}>Customer scans UPI QR to Pay:</small>
                      <BsQrCodeScan size={60} className="text-dark mb-1" />
                      <div className="fw-bold text-dark" style={{ fontSize: "11px" }}>
                        UPI ID: {cinemaName ? `${cinemaName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi` : "cinema@upi"}
                      </div>
                    </div>
                  )}

                  <div className="border-top pt-2 mb-2 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold text-dark mb-0 small">Total Payable:</h6>
                    <h4 className="fw-bold text-success mb-0">₹{calculateTotalBill()}</h4>
                  </div>

                  {!isCounterActive && (
                    <div className="alert alert-danger py-1.5 px-2 mb-2 small text-center fw-bold border-danger d-flex align-items-center justify-content-center gap-1 shadow-xs" style={{ fontSize: "11px" }}>
                      <BsExclamationCircle /> Counter is OFF (Turn ON above to Sell)
                    </div>
                  )}

                  <button
                    type="button"
                    className={`btn ${isCounterActive ? "btn-success" : "btn-secondary"} btn-sm w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2`}
                    onClick={handleProcessTicketBooking}
                    disabled={selectedSeats.length === 0 || !isCounterActive}
                  >
                    <BsPrinter /> {isCounterActive ? "Process Payment & Print Receipt" : "Counter Closed (Turn ON to Sell)"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE 3: MOVIE-WISE & SHIFT SALES REPORT TAB --- */}
        {activeTab === "sales" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div>
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                    <small className="text-muted fw-bold">Today's Total Shift Sales</small>
                    <h3 className="fw-bold text-success mt-2 mb-0">₹{totalShiftSales}</h3>
                    <small className="text-muted">{salesHistory.filter((s) => s.status !== "CANCELLED").length} Tickets Issued</small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                    <small className="text-muted fw-bold d-flex align-items-center"><BsCashCoin className="text-success me-1" /> Cash Sales Total</small>
                    <h3 className="fw-bold text-dark mt-2 mb-0">₹{cashSalesTotal}</h3>
                    <small className="text-muted">Physically in Cash Drawer</small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                    <small className="text-muted fw-bold d-flex align-items-center"><BsQrCodeScan className="text-primary me-1" /> UPI Sales Total</small>
                    <h3 className="fw-bold text-primary mt-2 mb-0">₹{upiSalesTotal}</h3>
                    <small className="text-muted">Instant Bank Transfers</small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                    <small className="text-muted fw-bold d-flex align-items-center"><BsCreditCard className="text-info me-1" /> Card Sales Total</small>
                    <h3 className="fw-bold text-info-emphasis mt-2 mb-0">₹{cardSalesTotal}</h3>
                    <small className="text-muted">POS Machine Sales</small>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
                <h5 className="fw-bold text-dark mb-3">Movie-Wise Sales Breakdown (Today's Desk)</h5>
                <div className="row g-3">
                  {Object.keys(salesByMovieMap).length === 0 ? (
                    <p className="text-muted text-center py-3">No sales logged yet today.</p>
                  ) : (
                    Object.keys(salesByMovieMap).map((mTitle) => (
                      <div className="col-md-6" key={mTitle}>
                        <div className="p-3 bg-light border rounded-3 d-flex justify-content-between align-items-center shadow-sm">
                          <div>
                            <h6 className="fw-bold text-dark mb-1">{mTitle}</h6>
                            <span className="badge bg-secondary">{salesByMovieMap[mTitle].count} Transactions</span>
                          </div>
                          <div className="text-end">
                            <h4 className="fw-bold text-success mb-0">₹{salesByMovieMap[mTitle].revenue}</h4>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                <h5 className="fw-bold text-dark mb-3">Counter Transaction History</h5>
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Movie Title</th>
                      <th>Screen & Showtime</th>
                      <th>Seats</th>
                      <th>Payment Mode</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((s) => (
                      <tr key={s.id}>
                        <td className="fw-bold">{s.ticketId}</td>
                        <td className="fw-bold text-dark">{s.movieTitle}</td>
                        <td>{s.screenName} | {formatIndianTime(s.startTime)}</td>
                        <td><span className="badge bg-light text-dark border">{s.seats}</span></td>
                        <td>
                          <span className={`badge ${s.paymentMode === "Cash" ? "bg-success" : s.paymentMode === "UPI" ? "bg-primary" : "bg-dark"}`}>
                            {s.paymentMode}
                          </span>
                        </td>
                        <td className="fw-bold text-success">₹{s.amount}</td>
                        <td>
                          <span className={`badge ${s.status === "VALID" ? "bg-success-subtle text-success border border-success" : "bg-danger"}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE 4: CASH DRAWER SETTLEMENT TAB --- */}
        {activeTab === "reconciliation" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 max-w-75 mx-auto">
              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                <BsCashStack className="text-primary" /> Cash Drawer Settlement & Reconciliation
              </h5>

              <div className="p-3 bg-light rounded-3 border mb-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="fw-bold small text-dark mb-1">Starting Cash Float (Opening Drawer Balance)</label>
                    <div className="input-group">
                      <span className="input-group-text fw-bold bg-white text-secondary">₹</span>
                      <input
                        type="number"
                        className="form-control fw-bold text-dark"
                        value={openingFloat}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOpeningFloat(val);
                          localStorage.setItem("cashier_openingFloat", String(val));
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="fw-bold small text-dark mb-1">Total Counter Cash Ticket Sales</label>
                    <div className="input-group">
                      <span className="input-group-text fw-bold bg-white text-success">₹</span>
                      <input
                        type="number"
                        className="form-control fw-bold text-success bg-white"
                        value={cashSalesTotal}
                        onChange={(e) => setManualCashSales(Number(e.target.value))}
                        placeholder="Enter counter cash sales"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-3 bg-white mb-4 shadow-sm">
                <h6 className="fw-bold text-dark mb-3">Expected Cash in Counter Drawer:</h6>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Opening Cash Float:</span>
                  <span className="fw-bold">₹{openingFloat}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">+ Counter Cash Ticket Sales:</span>
                  <span className="fw-bold text-success">+ ₹{cashSalesTotal}</span>
                </div>
                <div className="border-top pt-2 d-flex justify-content-between align-items-center fs-4 fw-bold text-dark">
                  <span>Total Expected Cash in Drawer:</span>
                  <span className="text-success">₹{openingFloat + cashSalesTotal}</span>
                </div>
              </div>

              <button
                className="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  const totalCashInDrawer = openingFloat + cashSalesTotal;
                  alert(`Cash Settlement Report:\n\nStaff: ${loggedInStaffName} (${loggedInStaffEmail})\nStarting Float: ₹${openingFloat}\nCash Sales: ₹${cashSalesTotal}\nTotal Expected Cash in Drawer: ₹${totalCashInDrawer}\n\nReport generated for Branch Manager review.`);
                }}
              >
                <BsCheckLg /> Print Cash Settlement Summary
              </button>
            </div>
          </div>
        )}

        {/* --- PAGE 5: TICKET LOOKUP & CANCELLATION TAB --- */}
        {activeTab === "tickets" && (
          <div className="flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                <BsReceipt className="text-primary" /> Ticket Lookup, Reprint & Cancellation
              </h5>

              <form onSubmit={handleSearchTicket} className="row g-3 mb-4">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control form-control-lg fw-bold"
                    placeholder="Enter Ticket ID (e.g. TIC-849201) or Customer Phone Number..."
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                    <BsSearch /> Search Ticket Record
                  </button>
                </div>
              </form>

              {searchedTicketResult && (
                <div className="p-4 border rounded-3 bg-light shadow-sm">
                  {searchedTicketResult.error ? (
                    <div className="text-danger fw-bold text-center py-3 d-flex align-items-center justify-content-center gap-2">
                      <BsExclamationCircle size={24} /> {searchedTicketResult.error}
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <h5 className="fw-bold text-dark mb-0">Ticket Details: {searchedTicketResult.ticketId}</h5>
                        <span className={`badge fs-6 ${searchedTicketResult.status === "VALID" ? "bg-success" : "bg-danger"}`}>
                          {searchedTicketResult.status}
                        </span>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-4"><strong>Movie:</strong> {searchedTicketResult.movieTitle}</div>
                        <div className="col-md-4"><strong>Screen:</strong> {searchedTicketResult.screenName}</div>
                        <div className="col-md-4"><strong>Showtime:</strong> {formatIndianTime(searchedTicketResult.startTime)}</div>
                        <div className="col-md-4"><strong>Seats:</strong> {searchedTicketResult.seats}</div>
                        <div className="col-md-4"><strong>Amount Paid:</strong> ₹{searchedTicketResult.amount} ({searchedTicketResult.paymentMode})</div>
                        <div className="col-md-4"><strong>Guest:</strong> {searchedTicketResult.customerName}</div>
                      </div>

                      <div className="d-flex gap-3">
                        <button
                          className="btn btn-primary fw-bold d-flex align-items-center gap-2"
                          onClick={() => {
                            setLastIssuedTicket(searchedTicketResult);
                            setIsReceiptModalOpen(true);
                          }}
                        >
                          <BsPrinter /> Reprint Thermal Slip
                        </button>
                        {searchedTicketResult.status !== "CANCELLED" && (
                          <button
                            className="btn btn-danger fw-bold d-flex align-items-center gap-2"
                            onClick={() => handleCancelTicket(searchedTicketResult.ticketId)}
                          >
                            <BsTrash /> Cancel Ticket & Refund ₹{searchedTicketResult.amount}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* PRINTABLE THERMAL TICKET RECEIPT MODAL */}
      {isReceiptModalOpen && lastIssuedTicket && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-body p-4 text-center bg-white rounded-4">
                <div className="d-flex justify-content-center mb-2 text-success">
                  <BsCheckCircle size={44} />
                </div>
                <h5 className="fw-bold text-dark mb-1">Ticket Issued Successfully!</h5>
                <p className="text-muted small mb-3">Counter Walk-In Thermal Receipt</p>

                {/* THERMAL TICKET SLIP SIMULATION */}
                <div ref={cashierTicketRef} className="p-3 bg-light border border-dark border-dashed rounded-3 text-start mb-3 font-monospace small">
                  <div className="text-center fw-bold text-dark border-bottom pb-2 mb-2">
                    <h5>{cinemaName}</h5>
                    <small>BOX OFFICE RECEIPT</small>
                  </div>

                  <div className="mb-2">
                    <div><strong>Ticket ID:</strong> {lastIssuedTicket.ticketId}</div>
                    <div><strong>Movie:</strong> {lastIssuedTicket.movieTitle}</div>
                    <div><strong>Screen:</strong> {lastIssuedTicket.screenName}</div>
                    <div><strong>Date & Time:</strong> {formatIndianDate(lastIssuedTicket.showDate)} | {formatIndianTime(lastIssuedTicket.startTime)}</div>
                    <div><strong>Seats:</strong> <span className="text-primary fw-bold">{lastIssuedTicket.seatsFormatted || lastIssuedTicket.seats}</span></div>
                    <div><strong>Guest:</strong> {lastIssuedTicket.customerName}</div>
                    <div><strong>Payment:</strong> {lastIssuedTicket.paymentMode}</div>
                  </div>

                  <div className="border-top border-bottom py-2 my-2 d-flex justify-content-between fw-bold fs-6 text-dark">
                    <span>TOTAL PAID:</span>
                    <span>₹{lastIssuedTicket.amount || lastIssuedTicket.totalAmount}</span>
                  </div>

                  {/* QR CODE SIMULATION */}
                  <div className="text-center mt-3 pt-2 border-top">
                    <BsQrCodeScan size={60} className="text-dark mb-1" />
                    <small className="d-block text-muted" style={{ fontSize: "9px" }}>
                      Scan at {lastIssuedTicket.screenName} Gate for Entry
                    </small>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success w-100 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                      onClick={handleDownloadCashierTicketPdf}
                      disabled={isDownloadingCashierTicket}
                    >
                      <BsDownload /> {isDownloadingCashierTicket ? "Downloading..." : "Download Ticket"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-1"
                      onClick={() => window.print()}
                    >
                      <BsPrinter /> Print Ticket
                    </button>
                  </div>
                  <button type="button" className="btn btn-outline-secondary w-100 fw-bold" onClick={handleFinishReceipt}>
                    Close & Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
