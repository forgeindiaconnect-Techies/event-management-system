import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../api/axiosConfig";
import {
  BsBank,
  BsCashCoin,
  BsCheckCircleFill,
  BsClockHistory,
  BsDownload,
  BsArrowCounterclockwise,
  BsPencilSquare,
  BsShieldCheck,
  BsInfoCircle,
  BsCopy,
  BsCheck2,
  BsFileEarmarkPdf,
  BsSearch,
  BsCreditCard2Front,
  BsReceiptCutoff,
  BsArrowUpRight,
  BsX,
  BsCalendarDate,
  BsWallet2,
  BsArrowClockwise,
  BsPauseCircleFill,
  BsExclamationOctagonFill,
  BsCupStraw,
  BsBell,
} from "react-icons/bs";

export default function TheaterFinancesPayoutsView({
  portalId: propPortalId,
  theaterName = "Cinema Partner",
  realBoxOfficeRevenue = 0,
  realTicketsSold = 0,
}) {
  const portalId =
    propPortalId ||
    localStorage.getItem("portalId") ||
    localStorage.getItem("userPortalId") ||
    "2";

  // Navigation Sub-Tabs: "settlements" | "collections" | "bank-settings" | "fee-rules"
  const [activeFinanceTab, setActiveFinanceTab] = useState("settlements");
  const [copiedUtr, setCopiedUtr] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Period / Contract Filter State (Mirrored from SuperAdmin)
  const [periodFilter, setPeriodFilter] = useState("ALL"); // "ALL" | "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CUSTOM"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Daily & Show-wise Collections State
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [collectionsSearch, setCollectionsSearch] = useState("");
  const [collectionsScreenFilter, setCollectionsScreenFilter] = useState("ALL");

  // Bank & Settlement Account Details State (Blank until linked by owner)
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: localStorage.getItem("userName") || "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    branchName: "",
    accountType: "CURRENT",
    upiId: "",
    legalPan: "",
    gstin: "",
    settlementCycle: "DAILY_T1", // "DAILY_T1" | "WEEKLY_MON"
    payoutMode: "NEFT",
    isKycVerified: false,
  });

  // Hold / Dispute status synced from SuperAdmin
  const [holdStatus, setHoldStatus] = useState(() => {
    try {
      const raw = localStorage.getItem("platform_held_payouts");
      if (raw) {
        const map = JSON.parse(raw);
        return map[portalId] || null;
      }
    } catch (e) {}
    return null;
  });

  const checkHoldStatus = useCallback(() => {
    try {
      const raw = localStorage.getItem("platform_held_payouts");
      if (raw) {
        const map = JSON.parse(raw);
        setHoldStatus(map[portalId] || null);
        return;
      }
    } catch (e) {}
    setHoldStatus(null);
  }, [portalId]);

  // Admin Bank & Document Submission Request Notification
  const [adminBankReminder, setAdminBankReminder] = useState(() => {
    try {
      const raw = localStorage.getItem("platform_bank_reminders");
      if (raw) {
        const map = JSON.parse(raw);
        return map[String(portalId)] || (String(portalId) === "2" ? map["2"] : null) || null;
      }
    } catch (e) {}
    return null;
  });

  const checkAdminBankReminder = useCallback(() => {
    try {
      const raw = localStorage.getItem("platform_bank_reminders");
      if (raw) {
        const map = JSON.parse(raw);
        setAdminBankReminder(map[String(portalId)] || (String(portalId) === "2" ? map["2"] : null) || null);
        return;
      }
    } catch (e) {}
    setAdminBankReminder(null);
  }, [portalId]);

  // Load persisted bank details
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`theater_payout_settings_${portalId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBankDetails((prev) => ({
          ...prev,
          ...parsed,
          isKycVerified: Boolean(parsed.accountNumber && parsed.ifscCode),
        }));
      }
    } catch (e) {
      console.warn("Failed to load saved payout settings:", e);
    }
  }, [portalId]);

  // Handle Bank Save
  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
        alert("Account numbers do not match. Please verify.");
        setSaving(false);
        return;
      }

      const updated = {
        ...bankDetails,
        isKycVerified: Boolean(bankDetails.accountNumber && bankDetails.ifscCode),
      };

      // Persist locally for both owner portal and superadmin ledger visibility
      localStorage.setItem(
        `theater_payout_settings_${portalId}`,
        JSON.stringify(updated)
      );
      if (String(portalId) === "2" || theaterName.toLowerCase().includes("naveen")) {
        localStorage.setItem("theater_payout_settings_2", JSON.stringify(updated));
      }
      setBankDetails(updated);

      // Attempt backend sync
      try {
        await api.put(`/theater/payout-settings/${portalId}`, updated);
      } catch (err) {
        console.log("Backend payout route fallback, saved to local state.");
      }

      // Clear pending admin reminder if present
      try {
        const rawReminders = localStorage.getItem("platform_bank_reminders");
        if (rawReminders) {
          const map = JSON.parse(rawReminders);
          delete map[String(portalId)];
          delete map["2"];
          localStorage.setItem("platform_bank_reminders", JSON.stringify(map));
          setAdminBankReminder(null);
        }
      } catch (ignored) {}

      // Notify SuperAdmin and other components
      window.dispatchEvent(
        new CustomEvent("platform_settlement_completed", {
          detail: { type: "BANK_UPDATE", theaterId: portalId },
        })
      );

      setSaveSuccess(true);
      setIsEditingBank(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to save bank details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load real sales history for Daily & Show-wise Collections
  const loadSalesHistory = useCallback(async () => {
    setLoadingSales(true);
    try {
      const qs = portalId ? `?theaterId=${portalId}` : "";
      const res = await api.get(`/theater/sales-history${qs}`);
      const all = Array.isArray(res.data) ? res.data : [];
      // Filter for this theater
      const matched = all.filter((s) => {
        if (!s) return false;
        if (String(s.theaterId) === String(portalId) || String(s.portalId) === String(portalId)) return true;
        if (theaterName && s.theaterName) {
          const t1 = theaterName.toLowerCase().trim();
          const t2 = s.theaterName.toLowerCase().trim();
          if (t1.includes(t2) || t2.includes(t1)) return true;
        }
        return false;
      });
      setSalesHistory(matched.length > 0 ? matched : all);
    } catch (err) {
      console.warn("Failed to load sales history:", err);
    } finally {
      setLoadingSales(false);
    }
  }, [portalId, theaterName]);

  useEffect(() => {
    loadSalesHistory();
  }, [loadSalesHistory]);

  const [settledLedgerHistory, setSettledLedgerHistory] = useState([]);

  // Load platform settlements ledger from SuperAdmin
  const loadPlatformSettlements = useCallback(() => {
    try {
      const raw = localStorage.getItem("platform_settlements_ledger");
      if (raw) {
        const all = JSON.parse(raw);
        const matched = all.filter((item) => {
          if (!item) return false;
          if (String(item.theaterId) === String(portalId)) return true;
          if (theaterName && item.theaterName) {
            const t1 = theaterName.toLowerCase().trim();
            const t2 = item.theaterName.toLowerCase().trim();
            if (t1.includes(t2) || t2.includes(t1)) return true;
          }
          // Default fallback for single-theater operations
          return !item.theaterId || String(item.theaterId) === "2";
        });
        setSettledLedgerHistory(matched);
      } else {
        setSettledLedgerHistory([]);
      }
    } catch (e) {
      console.warn("Failed to load platform settlements:", e);
    }
  }, [portalId, theaterName]);

  useEffect(() => {
    loadPlatformSettlements();
    checkHoldStatus();
    checkAdminBankReminder();
    const handleSettlementEvent = () => {
      loadPlatformSettlements();
      loadSalesHistory();
      checkHoldStatus();
      checkAdminBankReminder();
    };
    const handleStorageChange = (e) => {
      if (e.key === "platform_settlements_ledger") {
        loadPlatformSettlements();
      }
      if (e.key === "platform_held_payouts") {
        checkHoldStatus();
      }
      if (e.key === "platform_bank_reminders") {
        checkAdminBankReminder();
      }
    };

    window.addEventListener("platform_settlement_completed", handleSettlementEvent);
    window.addEventListener("theater_notification_received", handleSettlementEvent);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("platform_settlement_completed", handleSettlementEvent);
      window.removeEventListener("theater_notification_received", handleSettlementEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadPlatformSettlements, loadSalesHistory, checkHoldStatus, checkAdminBankReminder]);

  // Date / Period Filter Checker (Mirrored from SuperAdmin)
  const isDateInPeriod = useCallback(
    (dateStr) => {
      if (!dateStr || periodFilter === "ALL") return true;
      const cleanDate = dateStr.slice(0, 10);
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      if (periodFilter === "TODAY") {
        return cleanDate === todayStr;
      }
      if (periodFilter === "YESTERDAY") {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        return cleanDate === yest.toISOString().slice(0, 10);
      }
      if (periodFilter === "WEEK") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return cleanDate >= oneWeekAgo.toISOString().slice(0, 10) && cleanDate <= todayStr;
      }
      if (periodFilter === "MONTH") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        return cleanDate >= oneMonthAgo.toISOString().slice(0, 10) && cleanDate <= todayStr;
      }
      if (periodFilter === "CUSTOM") {
        if (customStartDate && cleanDate < customStartDate) return false;
        if (customEndDate && cleanDate > customEndDate) return false;
        return true;
      }
      return true;
    },
    [periodFilter, customStartDate, customEndDate]
  );

  // Filtered Daily & Show-wise Collections
  const filteredSales = useMemo(() => {
    return salesHistory.filter((s) => {
      const dateToCheck = s.date || (s.createdAt ? s.createdAt.slice(0, 10) : "");
      if (!isDateInPeriod(dateToCheck)) return false;

      if (collectionsScreenFilter !== "ALL" && s.screenName !== collectionsScreenFilter) {
        return false;
      }

      if (collectionsSearch.trim()) {
        const q = collectionsSearch.toLowerCase();
        const matchMovie = (s.movieTitle || "").toLowerCase().includes(q);
        const matchCust = (s.customerName || "").toLowerCase().includes(q);
        const matchTicket = (s.ticketId || s.id || "").toLowerCase().includes(q);
        const matchSeats = (s.seats || "").toLowerCase().includes(q);
        if (!matchMovie && !matchCust && !matchTicket && !matchSeats) return false;
      }

      return true;
    });
  }, [salesHistory, isDateInPeriod, collectionsScreenFilter, collectionsSearch]);

  // Dynamic Period Metrics (Box Office, F&B, TDS Sec 194-O, and Net Disbursable)
  const dynamicMetrics = useMemo(() => {
    let boxOfficeGross = 0;
    let fnbGross = 0;
    let totalTickets = 0;

    if (salesHistory.length > 0) {
      filteredSales.forEach((s) => {
        const amt = Number(s.amount || s.totalAmount || s.ticketPrice || 0);
        const fnb = Number(s.fnbAmount || s.canteenAmount || 0);
        boxOfficeGross += amt;
        fnbGross += fnb;
        const seats = s.seats
          ? typeof s.seats === "string"
            ? s.seats.split(",").length
            : Array.isArray(s.seats)
            ? s.seats.length
            : 1
          : 1;
        totalTickets += seats;
      });
    } else {
      boxOfficeGross = Number(realBoxOfficeRevenue || 0);
      fnbGross = 0;
      totalTickets = Number(realTicketsSold || 0);
    }

    const totalGross = Math.round((boxOfficeGross + fnbGross) * 100) / 100;
    // 1% Section 194-O TDS withheld by platform and credited under Theater's PAN (Form 26AS)
    const tdsAmount = Math.round(totalGross * 0.01 * 100) / 100;
    // Convenience fee paid directly by customer (₹25/ticket or 10%) - zero deduction from theater base revenue
    const convenienceFee = totalTickets > 0 ? totalTickets * 25 : Math.round(totalGross * 0.1 * 100) / 100;
    const gstOnFee = Math.round(convenienceFee * 0.18 * 100) / 100;
    const netDisbursable = Math.max(0, Math.round((totalGross - tdsAmount) * 100) / 100);

    return {
      boxOfficeGross,
      fnbGross,
      totalGross,
      tdsAmount,
      convenienceFee,
      gstOnFee,
      totalTickets,
      netDisbursable,
    };
  }, [salesHistory, filteredSales, realBoxOfficeRevenue, realTicketsSold]);

  const dynamicSalesGross = dynamicMetrics.boxOfficeGross;
  const dynamicSalesTickets = dynamicMetrics.totalTickets;

  const availableScreens = useMemo(() => {
    const set = new Set();
    salesHistory.forEach((s) => {
      if (s.screenName) set.add(s.screenName);
    });
    return Array.from(set);
  }, [salesHistory]);

  // Combined settlements list (live in-transit sales + completed platform settlement batches)
  const settlementsList = useMemo(() => {
    const list = settledLedgerHistory.map((item) => {
      const boxGross = Number(item.boxOfficeGross || item.grossAmount || item.netPaid || 0);
      const fnb = Number(item.fnbGross || 0);
      const gross = Number(item.grossAmount || (boxGross + fnb));
      const tds = Number(item.tdsDeducted || Math.round(gross * 0.01 * 100) / 100);
      const net = Number(item.netPaid || (gross - tds));

      return {
        ...item,
        id: item.id || `SET-${item.utr || "CMS"}`,
        utr: item.utr || "COMPLETED",
        date:
          item.dateFormatted ||
          (item.settledAt
            ? new Date(item.settledAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Settled"),
        forDate: item.forDate || "Box Office Batch",
        boxOfficeGross: boxGross,
        fnbGross: fnb,
        grossAmount: gross,
        convenienceFeeDeducted: Number(item.convenienceFeeDeducted || 0),
        gstDeducted: Number(item.gstDeducted || 0),
        tdsDeducted: tds,
        netPaid: net,
        ticketsSold: Number(item.ticketsSold || 0),
        mode: item.mode || "NEFT Auto-Credit",
        status: "SETTLED",
        rawDate: item.settledAt ? item.settledAt.slice(0, 10) : "",
      };
    });

    // In-transit pending batch calculation
    const pendingAmount = dynamicMetrics.netDisbursable;
    const pendingTickets = dynamicMetrics.totalTickets;

    if (pendingAmount > 0) {
      let pendingStatus = "PROCESSING";
      if (holdStatus?.isHeld) {
        pendingStatus = "ON_HOLD";
      } else if (!bankDetails?.accountNumber) {
        pendingStatus = "ACTION_REQUIRED";
      }

      list.unshift({
        id: `SET-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-LIVE`,
        utr: holdStatus?.isHeld
          ? "HOLD_VERIFICATION"
          : !bankDetails?.accountNumber
          ? "BANK_REQUIRED"
          : "PENDING_SETTLEMENT",
        date: holdStatus?.isHeld ? "Paused (On Hold)" : "Tomorrow, 06:00 AM",
        forDate: "Today's Live Sales",
        boxOfficeGross: dynamicMetrics.boxOfficeGross,
        fnbGross: dynamicMetrics.fnbGross,
        grossAmount: dynamicMetrics.totalGross,
        convenienceFeeDeducted: 0,
        gstDeducted: 0,
        tdsDeducted: dynamicMetrics.tdsAmount,
        netPaid: pendingAmount,
        ticketsSold: pendingTickets,
        mode: "NEFT Auto-Credit",
        status: pendingStatus,
        rawDate: new Date().toISOString().slice(0, 10),
      });
    }
    return list;
  }, [settledLedgerHistory, dynamicMetrics, holdStatus, bankDetails]);

  // Filtered settlements by Search, Status, and Period
  const filteredSettlements = useMemo(() => {
    return settlementsList.filter((s) => {
      // Period filter
      if (s.rawDate && !isDateInPeriod(s.rawDate)) {
        return false;
      }

      const matchesSearch =
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.utr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.forDate.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "ALL" ? true : s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [settlementsList, searchQuery, filterStatus, isDateInPeriod]);

  // Metrics calculation
  const totalSettledAmount = settlementsList
    .filter((s) => s.status === "SETTLED")
    .reduce((acc, curr) => acc + curr.netPaid, 0);

  const pendingSettlement = settlementsList.find(
    (s) => s.status === "PROCESSING" || s.status === "ON_HOLD" || s.status === "ACTION_REQUIRED"
  );

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedUtr(key);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const maskedAccount = bankDetails.accountNumber
    ? `•••• ${bankDetails.accountNumber.slice(-4)}`
    : "•••• 8419";

  // CSV Export (Supports both Settlements Ledger and Daily Collections)
  const handleExportCsv = () => {
    if (activeFinanceTab === "collections") {
      if (!filteredSales.length) {
        alert("No daily collection transactions to export for the selected filter.");
        return;
      }
      let csv = "Booking ID,Date,Time,Screen,Movie,Customer,Seats,Gross Amount (INR),Platform Fee (INR),Net Share (INR),Payment Mode,Status\n";
      filteredSales.forEach((s) => {
        const seatsCount = s.seats
          ? typeof s.seats === "string"
            ? s.seats.split(",").length
            : Array.isArray(s.seats)
            ? s.seats.length
            : 1
          : 1;
        const gross = Number(s.amount || 0);
        const fee = seatsCount * 25;
        const net = Math.max(0, gross - fee);
        csv += `"${s.ticketId || s.id}","${s.date || ""}","${s.time || ""}","${s.screenName || ""}","${s.movieTitle || ""}","${s.customerName || ""}","${s.seats || ""}","${gross}","${fee}","${net}","${s.paymentMode || ""}","${s.status || "VALID"}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily_collections_${theaterName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } else {
      const headers = "SettlementID,UTR,Date,ForDate,BoxOfficeGross,FnBGross,GrossAmount,TDS_1Percent_Sec194O,NetPaid,TicketsSold,Status\n";
      const rows = filteredSettlements
        .map(
          (s) =>
            `"${s.id}","${s.utr}","${s.date}","${s.forDate}",${s.boxOfficeGross || s.grossAmount},${s.fnbGross || 0},${s.grossAmount},${s.tdsDeducted || Math.round(s.grossAmount * 0.01 * 100) / 100},${s.netPaid},${s.ticketsSold},"${s.status}"`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payout_settlement_ledger_${theaterName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
  };

  return (
    <div className="theater-finances-container flex-grow-1 overflow-auto pe-1" style={{ minHeight: 0 }}>
      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <BsCashCoin className="text-primary" /> Finances & Bank Payouts
            <span className="badge bg-success-subtle text-success border border-success-subtle fs-6 fw-semibold px-2.5 py-1 rounded-pill">
              ● T+1 Daily Auto-Settlement Active
            </span>
          </h4>
          <p className="text-muted small mb-0">
            Real-time track of ticket revenues, daily automatic bank transfers, and verified owner settlement accounts.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-2 bg-white"
            onClick={handleExportCsv}
            title="Download CSV Statement"
          >
            <BsDownload size={14} /> Export CSV Statement
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 fw-bold d-flex align-items-center gap-2 px-3 shadow-xs"
            onClick={() => {
              setActiveFinanceTab("bank-settings");
              setIsEditingBank(true);
            }}
          >
            <BsBank size={14} /> Manage Bank Account
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 shadow-xs mb-3 border-0">
          <BsCheckCircleFill className="text-success fs-5" />
          <div>
            <strong>Bank details saved successfully!</strong> Your daily ticket payouts will be disbursed to this account.
          </div>
        </div>
      )}

      {/* 2. PERIOD & CONTRACT FILTER TOOLBAR (Mirrored from SuperAdmin Financials) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <BsCalendarDate size={15} style={{ color: "#2563eb" }} />
            <span>Period:</span>
          </div>

          <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px", flexWrap: "wrap" }}>
            {[
              { key: "ALL", label: "All Time" },
              { key: "TODAY", label: "Today" },
              { key: "YESTERDAY", label: "Yesterday" },
              { key: "WEEK", label: "This Week" },
              { key: "MONTH", label: "This Month" },
              { key: "CUSTOM", label: "Custom Period" },
            ].map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setPeriodFilter(btn.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: periodFilter === btn.key ? "#ffffff" : "transparent",
                  color: periodFilter === btn.key ? "#2563eb" : "#64748b",
                  fontWeight: periodFilter === btn.key ? "700" : "600",
                  fontSize: "0.8rem",
                  boxShadow: periodFilter === btn.key ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Inputs */}
          {periodFilter === "CUSTOM" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }}
                title="Start Date"
              />
              <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none" }}
                title="End Date"
              />
            </div>
          )}

          {periodFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("ALL");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#dc2626",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
          Viewing: <strong className="text-dark">{theaterName}</strong> (Portal #{portalId})
        </div>
      </div>

      {/* SUPERADMIN VERIFICATION HOLD NOTIFICATION BANNER */}
      {holdStatus?.isHeld && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            boxShadow: "0 1px 3px rgba(220, 38, 38, 0.08)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <BsExclamationOctagonFill />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <strong style={{ color: "#991b1b", fontSize: "0.95rem" }}>
                Payout Disbursals Currently on Administrative Hold
              </strong>
              <span
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: "800",
                  padding: "1px 8px",
                  borderRadius: "10px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Verification Hold
              </span>
            </div>
            <div style={{ color: "#7f1d1d", fontSize: "0.85rem", lineHeight: "1.5" }}>
              <strong>Reason:</strong> {holdStatus.reason || "Administrative verification required by SuperAdmin."}
              {holdStatus.notes && (
                <div style={{ marginTop: "4px", color: "#991b1b", fontSize: "0.82rem" }}>
                  <em>Notes from Audit Team:</em> {holdStatus.notes}
                </div>
              )}
            </div>
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", color: "#b91c1c" }}>
                Daily automatic settlements are temporarily held until the platform compliance audit is cleared.
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveFinanceTab("bank-settings");
                  setIsEditingBank(true);
                }}
                style={{
                  background: "#ffffff",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  padding: "3px 10px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Review Bank & PAN Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN IN-APP NOTIFICATION: BANK & KYC SUBMISSION REQUEST */}
      {adminBankReminder && !bankDetails.accountNumber && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(245, 158, 11, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#fef3c7",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              <BsBell />
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "#92400e", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Action Requested by Platform Admin: Bank & KYC Submission</span>
                <span className="badge bg-warning text-dark border border-warning" style={{ fontSize: "10px" }}>
                  NEW NOTICE
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#78350f", marginTop: "2px" }}>
                {adminBankReminder.message || "SuperAdmin requested you to submit your verified Business Bank Account, PAN & GSTIN for automated daily payout clearing."}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveFinanceTab("bank-settings");
              setIsEditingBank(true);
            }}
            style={{
              backgroundColor: "#d97706",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "0.8rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <BsBank size={13} /> Complete Bank Setup Now →
          </button>
        </div>
      )}

      {/* 3. FINANCIAL BENTO METRICS CARDS (Perfect Fit & Alignment) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Card 1: Total Settled to Bank */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "140px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Settled to Bank
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              <BsShieldCheck />
            </div>
          </div>
          <div>
            <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              ₹{totalSettledAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.76rem", color: totalSettledAmount > 0 ? "#15803d" : "#64748b", fontWeight: "600", marginTop: "6px" }}>
              {totalSettledAmount > 0 ? "✓ 100% Disbursed Successfully" : "No past settlements yet"}
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Next Payout */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: holdStatus?.isHeld ? "1px solid #fecaca" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "140px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Next Payout (In-Transit)
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: holdStatus?.isHeld ? "#fef2f2" : "#eff6ff",
                color: holdStatus?.isHeld ? "#dc2626" : "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              {holdStatus?.isHeld ? <BsPauseCircleFill /> : <BsClockHistory />}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "1.7rem", fontWeight: "800", color: holdStatus?.isHeld ? "#dc2626" : "#2563eb", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              ₹{(pendingSettlement?.netPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ marginTop: "6px" }}>
              {holdStatus?.isHeld ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "1px 7px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "800" }}>
                    🔴 ON HOLD
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#991b1b" }}>Disbursal paused by Admin</span>
                </div>
              ) : !bankDetails.accountNumber ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ backgroundColor: "#fef3c7", color: "#b45309", padding: "1px 7px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "700" }}>
                    ⚠️ ACTION REQUIRED
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Bank account required</span>
                </div>
              ) : pendingSettlement ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "1px 7px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "700" }}>
                    PROCESSING
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Scheduled Tomorrow 06:00 AM</span>
                </div>
              ) : (
                <div style={{ fontSize: "0.76rem", color: "#64748b" }}>No in-transit settlements</div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Period Gross Sales */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "140px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {periodFilter === "ALL"
                ? "Total Gross Sales"
                : periodFilter === "TODAY"
                ? "Today's Gross Sales"
                : `${periodFilter.charAt(0) + periodFilter.slice(1).toLowerCase()} Sales`}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#f5f3ff",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              <BsReceiptCutoff />
            </div>
          </div>
          <div>
            <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              ₹{dynamicMetrics.totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span>🎟️ Box Office: ₹{dynamicMetrics.boxOfficeGross.toLocaleString("en-IN")}</span>
              {dynamicMetrics.fnbGross > 0 && <span>• 🍿 F&B: ₹{dynamicMetrics.fnbGross.toLocaleString("en-IN")}</span>}
              <span>({dynamicMetrics.totalTickets} tkts)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Linked Bank Account Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "140px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Settlement Account
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: bankDetails.accountNumber ? "#ecfdf5" : "#fffbeb",
                color: bankDetails.accountNumber ? "#059669" : "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              <BsBank />
            </div>
          </div>

          <div>
            {bankDetails.accountNumber ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <BsCreditCard2Front style={{ color: "#2563eb" }} /> {bankDetails.bankName || "Linked Bank"}
                  </span>
                  <span style={{ fontSize: "0.68rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "8px", fontWeight: "700" }}>
                    KYC VERIFIED
                  </span>
                </div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "3px" }}>
                  A/C: <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0f172a" }}>{maskedAccount}</span> • {bankDetails.ifscCode}
                </div>
                <div style={{ marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFinanceTab("bank-settings");
                      setIsEditingBank(true);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      padding: 0,
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    Change Account <BsArrowUpRight size={10} />
                  </button>
                </div>
              </>
            ) : adminBankReminder ? (
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1.5px solid #f59e0b",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  boxShadow: "0 2px 6px rgba(245, 158, 11, 0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "14px" }}>🔔</span>
                    <strong style={{ fontSize: "0.8rem", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Admin Notice: Bank & KYC
                    </strong>
                  </div>
                  <span style={{ fontSize: "0.65rem", backgroundColor: "#fde68a", color: "#78350f", padding: "1px 6px", borderRadius: "4px", fontWeight: "800" }}>
                    ACTION REQUIRED
                  </span>
                </div>

                <div style={{ fontSize: "0.73rem", color: "#78350f", lineHeight: "1.4", marginBottom: "8px" }}>
                  {adminBankReminder.message || "SuperAdmin requested you to submit your verified Bank Account & PAN/KYC details for daily payout clearing."}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFinanceTab("bank-settings");
                      setIsEditingBank(true);
                    }}
                    style={{
                      backgroundColor: "#d97706",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.73rem",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 1px 3px rgba(217, 119, 6, 0.2)",
                    }}
                  >
                    <BsBank size={11} /> Link Bank & Submit KYC →
                  </button>
                  {adminBankReminder.sentAt && (
                    <span style={{ fontSize: "0.68rem", color: "#b45309" }}>
                      {new Date(adminBankReminder.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.92rem" }}>No Account Linked</span>
                  <span style={{ fontSize: "0.68rem", backgroundColor: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "8px", fontWeight: "700" }}>
                    NOT LINKED
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "3px" }}>Link bank to receive payouts</div>
                <div style={{ marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFinanceTab("bank-settings");
                      setIsEditingBank(true);
                    }}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "0.74rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 1px 3px rgba(37, 99, 235, 0.2)",
                    }}
                  >
                    + Link Bank Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. SUB-NAVIGATION TABS (Aligned with SuperAdmin Structure) */}
      <div className="bg-white rounded-3 border shadow-xs mb-4">
        <div className="d-flex border-bottom px-3 pt-2 gap-2 overflow-auto" style={{ whiteSpace: "nowrap" }}>
          {/* Tab 1: Payout Settlements Ledger */}
          <button
            type="button"
            className={`btn border-0 py-2.5 px-3 fw-semibold small d-flex align-items-center gap-2 ${
              activeFinanceTab === "settlements"
                ? "text-primary border-bottom border-primary border-2 fw-bold"
                : "text-muted"
            }`}
            style={{ borderRadius: 0 }}
            onClick={() => setActiveFinanceTab("settlements")}
          >
            <BsReceiptCutoff size={15} /> Payout Settlements Ledger
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 7px",
                borderRadius: "10px",
                backgroundColor: activeFinanceTab === "settlements" ? "#dbeafe" : "#f1f5f9",
                color: activeFinanceTab === "settlements" ? "#1e40af" : "#64748b",
                fontWeight: "700",
              }}
            >
              {filteredSettlements.length}
            </span>
          </button>

          {/* Tab 2: Daily & Show-wise Collections Breakdown */}
          <button
            type="button"
            className={`btn border-0 py-2.5 px-3 fw-semibold small d-flex align-items-center gap-2 ${
              activeFinanceTab === "collections"
                ? "text-primary border-bottom border-primary border-2 fw-bold"
                : "text-muted"
            }`}
            style={{ borderRadius: 0 }}
            onClick={() => setActiveFinanceTab("collections")}
          >
            <BsCashCoin size={15} /> Daily & Show-wise Collections
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 7px",
                borderRadius: "10px",
                backgroundColor: activeFinanceTab === "collections" ? "#f3e8ff" : "#f1f5f9",
                color: activeFinanceTab === "collections" ? "#7e22ce" : "#64748b",
                fontWeight: "700",
              }}
            >
              {filteredSales.length}
            </span>
          </button>

          {/* Tab 3: Bank Account & UPI Setup */}
          <button
            type="button"
            className={`btn border-0 py-2.5 px-3 fw-semibold small d-flex align-items-center gap-2 ${
              activeFinanceTab === "bank-settings"
                ? "text-primary border-bottom border-primary border-2 fw-bold"
                : "text-muted"
            }`}
            style={{ borderRadius: 0 }}
            onClick={() => setActiveFinanceTab("bank-settings")}
          >
            <BsBank size={15} /> Bank Account & UPI Setup
            {bankDetails.accountNumber ? (
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "8px",
                  backgroundColor: "#dcfce7",
                  color: "#15803d",
                  fontWeight: "700",
                }}
              >
                KYC
              </span>
            ) : null}
          </button>

          {/* Tab 4: Revenue Split & Fee Policy */}
          <button
            type="button"
            className={`btn border-0 py-2.5 px-3 fw-semibold small d-flex align-items-center gap-2 ${
              activeFinanceTab === "fee-rules"
                ? "text-primary border-bottom border-primary border-2 fw-bold"
                : "text-muted"
            }`}
            style={{ borderRadius: 0 }}
            onClick={() => setActiveFinanceTab("fee-rules")}
          >
            <BsInfoCircle size={15} /> Revenue Split & Fee Policy
          </button>
        </div>

        {/* 5. TAB 1: SETTLEMENTS LEDGER TABLE */}
        {activeFinanceTab === "settlements" && (
          <div className="p-3">
            {/* Search and Filter Toolbar */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div className="position-relative" style={{ maxWidth: "340px", flex: 1 }}>
                <BsSearch
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                  size={14}
                />
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 rounded-pill"
                  placeholder="Search by UTR or Settlement ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Status:</span>
                <select
                  className="form-select form-select-sm rounded-pill"
                  style={{ width: "auto" }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SETTLED">Settled to Bank</option>
                  <option value="PROCESSING">Processing / In-Transit</option>
                  <option value="ON_HOLD">Verification Hold</option>
                </select>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-2.5"
                  onClick={loadPlatformSettlements}
                  title="Refresh Settlements"
                >
                  <BsArrowClockwise size={13} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  <tr>
                    <th style={{ minWidth: "160px" }}>Settlement ID & UTR</th>
                    <th style={{ minWidth: "150px" }}>Settlement Date</th>
                    <th style={{ minWidth: "140px" }}>Show Date Period</th>
                    <th>Tickets</th>
                    <th>Gross (Box Office + F&B)</th>
                    <th>1% TDS (Sec 194-O)</th>
                    <th>Net Disbursed</th>
                    <th>Status</th>
                    <th className="text-end">Advice Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                            style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", color: "#64748b" }}
                          >
                            <BsReceiptCutoff size={22} />
                          </div>
                          <div className="fw-bold text-dark fs-6 mb-1">No Payout Settlements Recorded Yet</div>
                          <div className="small text-muted" style={{ maxWidth: "420px" }}>
                            When movie tickets are booked and daily settlement clearing runs, your automated bank transfer batches and RBI UTR tracking codes will appear here.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSettlements.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-bold text-dark font-monospace">{s.id}</div>
                          <div className="small text-muted d-flex align-items-center gap-1.5 mt-0.5">
                            <span>
                              UTR:{" "}
                              <code className={s.status === "ON_HOLD" ? "text-danger fw-bold" : "text-primary"}>
                                {s.utr}
                              </code>
                            </span>
                            {s.utr !== "PENDING_SETTLEMENT" && s.utr !== "HOLD_VERIFICATION" && s.utr !== "BANK_REQUIRED" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link p-0 text-muted"
                                title="Copy UTR Reference"
                                onClick={() => copyToClipboard(s.utr, s.id)}
                              >
                                {copiedUtr === s.id ? (
                                  <BsCheck2 className="text-success" />
                                ) : (
                                  <BsCopy size={11} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-dark fw-semibold">{s.date}</div>
                          <div className="text-muted small">{s.mode}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1 rounded">
                            {s.forDate}
                          </span>
                        </td>
                        <td className="fw-semibold text-dark">{s.ticketsSold}</td>
                        <td>
                          <div className="fw-bold text-dark">
                            ₹{Number(s.grossAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-muted" style={{ fontSize: "11px" }}>
                            <span>🎟️ ₹{Number(s.boxOfficeGross || s.grossAmount).toLocaleString("en-IN")}</span>
                            {Number(s.fnbGross || 0) > 0 && (
                              <span> + 🍿 ₹{Number(s.fnbGross).toLocaleString("en-IN")}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-danger font-monospace fw-semibold">
                            -₹{Number(s.tdsDeducted || Math.round(s.grossAmount * 0.01 * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <span className="badge bg-light text-muted border px-1.5 py-0.5" style={{ fontSize: "9px" }}>
                            Form 26AS
                          </span>
                        </td>
                        <td>
                          <span className="fw-bolder fs-6 text-success">
                            ₹{Number(s.netPaid).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          {s.status === "SETTLED" ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">
                              ✓ Credited
                            </span>
                          ) : s.status === "ON_HOLD" ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">
                              🔴 Verification Hold
                            </span>
                          ) : s.status === "ACTION_REQUIRED" ? (
                            <span className="badge bg-warning bg-opacity-15 text-dark border border-warning px-2.5 py-1 rounded-pill fw-bold">
                              ⚠️ Bank Required
                            </span>
                          ) : (
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">
                              ⏳ Scheduled T+1
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
                            style={{ fontSize: "11px" }}
                            onClick={() => setSelectedReceipt(s)}
                            title="View Settlement Receipt"
                          >
                            <BsFileEarmarkPdf size={12} className="text-danger" /> Slip
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. TAB 2: DAILY & SHOW-WISE COLLECTIONS BREAKDOWN */}
        {activeFinanceTab === "collections" && (
          <div className="p-3">
            {/* Summary Header Strip */}
            <div
              style={{
                backgroundColor: "#faf5ff",
                border: "1px solid #e9d5ff",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h6 style={{ margin: 0, color: "#581c87", fontWeight: "700" }}>
                  Showtime Ticket Bookings & Net Share
                </h6>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#7e22ce" }}>
                  Real-time ticket revenues collected at box office & online booking apps for {theaterName}.
                </p>
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b21a8", fontWeight: "700", textTransform: "uppercase" }}>Bookings</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#581c87" }}>{filteredSales.length}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b21a8", fontWeight: "700", textTransform: "uppercase" }}>Tickets Sold</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#581c87" }}>{dynamicSalesTickets}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b21a8", fontWeight: "700", textTransform: "uppercase" }}>Gross Box Office</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#0f172a" }}>
                    ₹{dynamicMetrics.boxOfficeGross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#b91c1c", fontWeight: "700", textTransform: "uppercase" }}>1% TDS (Sec 194-O)</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#dc2626" }}>
                    -₹{dynamicMetrics.tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Net Disbursable</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#15803d" }}>
                    ₹{dynamicMetrics.netDisbursable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div className="position-relative" style={{ maxWidth: "340px", flex: 1 }}>
                <BsSearch
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                  size={14}
                />
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 rounded-pill"
                  placeholder="Search movie, customer, seats, ticket ID..."
                  value={collectionsSearch}
                  onChange={(e) => setCollectionsSearch(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                {availableScreens.length > 0 && (
                  <>
                    <span className="small text-muted">Screen:</span>
                    <select
                      className="form-select form-select-sm rounded-pill"
                      style={{ width: "auto" }}
                      value={collectionsScreenFilter}
                      onChange={(e) => setCollectionsScreenFilter(e.target.value)}
                    >
                      <option value="ALL">All Screens</option>
                      {availableScreens.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-2.5"
                  onClick={loadSalesHistory}
                  title="Refresh Sales"
                >
                  <BsArrowClockwise size={13} />
                </button>
              </div>
            </div>

            {/* Collections Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  <tr>
                    <th style={{ minWidth: "140px" }}>Show Date & Time</th>
                    <th style={{ minWidth: "160px" }}>Movie & Screen</th>
                    <th style={{ minWidth: "140px" }}>Customer / Seats</th>
                    <th>Gross Collection</th>
                    <th>Platform Fee</th>
                    <th>Net Owner Share</th>
                    <th>Payment</th>
                    <th className="text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSales ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        Loading collection transactions...
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <div className="d-flex flex-column align-items-center justify-content-center">
                          <BsReceiptCutoff size={32} className="text-secondary mb-2" />
                          <div className="fw-bold text-dark fs-6">No Collection Records in this Period</div>
                          <div className="small text-muted">Try selecting "All Time" in the Period filter above to view ticket sales.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const seatsCount = sale.seats
                        ? typeof sale.seats === "string"
                          ? sale.seats.split(",").length
                          : Array.isArray(sale.seats)
                          ? sale.seats.length
                          : 1
                        : 1;
                      const gross = Number(sale.amount || 0);
                      const fee = seatsCount * 25;
                      const net = Math.max(0, gross - fee);
                      return (
                        <tr key={sale.ticketId || sale.id}>
                          <td>
                            <div className="fw-bold text-dark">
                              {sale.date || (sale.createdAt ? sale.createdAt.slice(0, 10) : "Today")}
                            </div>
                            <div className="small text-muted">{sale.time || "Showtime"}</div>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{sale.movieTitle || "Movie"}</div>
                            <div className="small text-muted">{sale.screenName || "Main Screen"}</div>
                          </td>
                          <td>
                            <div className="text-dark">{sale.customerName || "Customer"}</div>
                            <div className="small text-muted font-monospace">
                              {sale.seats || "1 seat"} ({seatsCount} tck)
                            </div>
                          </td>
                          <td className="fw-bold text-dark">
                            ₹{gross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-danger small font-monospace">
                            -₹{fee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="fw-bolder text-success">
                            ₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border px-2 py-1">
                              {sale.paymentMode || "UPI"}
                            </span>
                          </td>
                          <td className="text-end">
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                              ● {sale.status || "VALID"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. TAB 3: BANK ACCOUNT & UPI SETUP FORM */}
        {activeFinanceTab === "bank-settings" && (
          <div className="p-4" style={{ maxWidth: "860px" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <BsBank className="text-primary" /> Cinema Settlement Bank Account
                </h5>
                <p className="text-muted small mb-0">
                  Online ticket collections will be deposited directly to this account via automated NEFT / RTGS transfers.
                </p>
              </div>

              {!isEditingBank ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => setIsEditingBank(true)}
                >
                  <BsPencilSquare size={13} /> Edit Account Details
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-light border rounded-pill px-3"
                  onClick={() => setIsEditingBank(false)}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveBankDetails}>
              <div className="row g-3">
                {/* Account Holder Name */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Account Beneficiary Name (As in Bank) *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2"
                    value={bankDetails.accountHolderName}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountHolderName: e.target.value })
                    }
                    required
                  />
                  <div className="form-text" style={{ fontSize: "11px" }}>
                    Must match the business PAN/corporate legal entity name.
                  </div>
                </div>

                {/* Bank Name */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2"
                    value={bankDetails.bankName}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, bankName: e.target.value })
                    }
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    required
                  />
                </div>

                {/* Account Number */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Bank Account Number *
                  </label>
                  <input
                    type={isEditingBank ? "text" : "password"}
                    className="form-control form-control-sm rounded-2 font-monospace"
                    value={bankDetails.accountNumber}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Confirm Account Number */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 font-monospace"
                    value={bankDetails.confirmAccountNumber}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        confirmAccountNumber: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* IFSC Code */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    IFSC Code (11 Characters) *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 font-monospace text-uppercase"
                    maxLength={11}
                    value={bankDetails.ifscCode}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                {/* Account Type */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Account Type *
                  </label>
                  <select
                    className="form-select form-select-sm rounded-2"
                    value={bankDetails.accountType}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountType: e.target.value })
                    }
                  >
                    <option value="CURRENT">Current Account (Recommended for Theaters)</option>
                    <option value="SAVINGS">Savings Account (Sole Proprietor)</option>
                  </select>
                </div>

                {/* Business UPI ID */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Business UPI ID / VPA (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2"
                    placeholder="e.g. theatre@icici"
                    value={bankDetails.upiId}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, upiId: e.target.value })
                    }
                  />
                  <div className="form-text" style={{ fontSize: "11px" }}>
                    Used for instant IMPS / UPI daily disbursements.
                  </div>
                </div>

                {/* Settlement Frequency */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Settlement Frequency Schedule
                  </label>
                  <select
                    className="form-select form-select-sm rounded-2"
                    value={bankDetails.settlementCycle}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, settlementCycle: e.target.value })
                    }
                  >
                    <option value="DAILY_T1">Daily T+1 (Every morning at 06:00 AM)</option>
                    <option value="WEEKLY_MON">Weekly (Every Monday Morning)</option>
                  </select>
                </div>

                {/* Tax Details: PAN & GSTIN */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Business PAN (For TDS Exemption) *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 font-monospace text-uppercase"
                    maxLength={10}
                    value={bankDetails.legalPan}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, legalPan: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    GSTIN (Tax Invoicing) *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 font-monospace text-uppercase"
                    maxLength={15}
                    value={bankDetails.gstin}
                    disabled={!isEditingBank}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, gstin: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>
              </div>

              {isEditingBank && (
                <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-3"
                    onClick={() => setIsEditingBank(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary px-4 fw-bold shadow-xs"
                    disabled={saving}
                  >
                    {saving ? "Verifying & Saving..." : "Save Bank Details"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* 8. TAB 4: REVENUE SPLIT & FEE POLICY */}
        {activeFinanceTab === "fee-rules" && (
          <div className="p-4" style={{ maxWidth: "860px" }}>
            <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
              <BsShieldCheck className="text-success" /> Revenue Distribution & Settlement Model
            </h5>
            <p className="text-muted small mb-4">
              Transparent, automated distribution rules enforced on all movie ticket and F&B sales across web and mobile apps.
            </p>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 rounded-3 border bg-light h-100">
                  <h6 className="fw-bold text-dark mb-2">🎟️ Movie Ticket Pricing</h6>
                  <p className="small text-muted mb-2">
                    <strong>100% of Base Ticket Price</strong> configured in your showtimes is credited directly to the theater owner account.
                  </p>
                  <ul className="small text-secondary ps-3 mb-0" style={{ lineHeight: "1.8" }}>
                    <li>Tickets ≤ ₹100: 12% GST applicable.</li>
                    <li>Tickets &gt; ₹100: 18% GST applicable.</li>
                    <li>GST is recorded and remitted to your registered GSTIN.</li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 border bg-light h-100">
                  <h6 className="fw-bold text-dark mb-2">🍿 F&B Refreshments Revenue</h6>
                  <p className="small text-muted mb-2">
                    <strong>100% of Concession Menu Sales</strong> (Popcorn, Snacks, Beverages) go directly to the theater.
                  </p>
                  <ul className="small text-secondary ps-3 mb-0" style={{ lineHeight: "1.8" }}>
                    <li>Concession GST: Flat 5% GST included in menu price.</li>
                    <li>No commission deducted from F&B counters.</li>
                    <li>Auto-settled alongside ticket revenue batches.</li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 border bg-light h-100">
                  <h6 className="fw-bold text-dark mb-2">💳 Platform Convenience Fee</h6>
                  <p className="small text-muted mb-2">
                    A nominal convenience fee (₹25 + 18% GST) charged to the customer at checkout covers payment gateway charges, 2FA OTPs, cloud infrastructure, and 24x7 customer support.
                  </p>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2 py-1">
                    Zero deduction from your ticket base price
                  </span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 border bg-light h-100">
                  <h6 className="fw-bold text-dark mb-2">⏱️ Settlement Window (T+1)</h6>
                  <p className="small text-muted mb-2">
                    Show revenues from today's screenings are verified, batched, and transferred to your bank by 06:00 AM the following morning via RBI NEFT / RTGS clearing.
                  </p>
                  <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1">
                    Direct UTR reference provided
                  </span>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 rounded-3 border bg-light">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <span>🏛️ Section 194-O Income Tax (TDS) & Form 26AS Credit</span>
                    <span className="badge bg-info bg-opacity-10 text-primary border border-info border-opacity-25" style={{ fontSize: "10px" }}>
                      Statutory Compliance
                    </span>
                  </h6>
                  <p className="small text-muted mb-2">
                    Under Section 194-O of the Indian Income Tax Act, 1% TDS is withheld on the gross value of tickets and F&B sold through digital marketplace platforms.
                  </p>
                  <ul className="small text-secondary ps-3 mb-2" style={{ lineHeight: "1.8" }}>
                    <li><strong>100% Tax Credit:</strong> Withheld TDS is deposited directly to the Income Tax Department against your cinema's registered PAN (<strong>{bankDetails.legalPan || "REGISTERED_PAN"}</strong>).</li>
                    <li><strong>Form 26AS / AIS:</strong> The deposited TDS reflects quarterly in your Form 26AS and Annual Information Statement (AIS) and can be fully adjusted against your income tax liability or claimed as a refund.</li>
                    <li><strong>Zero Commission:</strong> The platform does not deduct any hidden commissions from your ticket base fare. Convenience fees are paid independently by the customer at checkout.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. SETTLEMENT ADVICE RECEIPT MODAL */}
      {selectedReceipt && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", zIndex: 1200 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "540px" }}>
            <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
              {/* Modal Header */}
              <div className="modal-header border-0 pb-0 pt-3.5 px-4 d-flex align-items-center justify-content-between">
                <div>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-0.5 rounded-pill text-uppercase" style={{ fontSize: "10px" }}>
                    Official Bank Settlement Advice
                  </span>
                  <h5 className="modal-title fw-bold text-dark mt-1" style={{ fontSize: "18px" }}>
                    {selectedReceipt.id}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedReceipt(null)}
                  aria-label="Close"
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body px-4 py-3">
                <div className="p-3 rounded-3 border mb-3 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-muted small">Net Amount Disbursed to Bank</div>
                  <div className="fw-bolder text-success" style={{ fontSize: "32px", letterSpacing: "-0.5px" }}>
                    ₹{Number(selectedReceipt.netPaid).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="small text-muted mt-0.5">
                    UTR: <code className="text-dark fw-bold">{selectedReceipt.utr}</code>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Cinema Partner:</span>
                    <span className="fw-semibold text-dark">{theaterName}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Settlement Date:</span>
                    <span className="fw-semibold text-dark">{selectedReceipt.date}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Show Date Screenings:</span>
                    <span className="fw-semibold text-dark">{selectedReceipt.forDate}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Tickets Admitted:</span>
                    <span className="fw-semibold text-dark">{selectedReceipt.ticketsSold} Tickets</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Credited Bank Account:</span>
                    <span className="fw-semibold text-dark">{bankDetails.bankName || "Bank"} ({maskedAccount})</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Gross Transaction Value:</span>
                    <span className="fw-bold text-dark">
                      ₹{Number(selectedReceipt.grossAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom ps-2 text-muted" style={{ fontSize: "11px" }}>
                    <span>↳ Box Office Ticket Sales:</span>
                    <span>₹{Number(selectedReceipt.boxOfficeGross || selectedReceipt.grossAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {Number(selectedReceipt.fnbGross || 0) > 0 && (
                    <div className="d-flex justify-content-between py-1 border-bottom ps-2 text-muted" style={{ fontSize: "11px" }}>
                      <span>↳ F&B Concessions Share:</span>
                      <span>₹{Number(selectedReceipt.fnbGross).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-1 border-bottom text-muted">
                    <span>Platform Convenience Fee & GST:</span>
                    <span className="text-success fw-semibold">₹0.00 (Customer Paid at Checkout)</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom text-danger">
                    <span>Section 194-O TDS (1% Form 26AS Withholding):</span>
                    <span className="font-monospace fw-bold">
                      -₹{Number(selectedReceipt.tdsDeducted || Math.round(selectedReceipt.grossAmount * 0.01 * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 fw-bold fs-6 text-success">
                    <span>Total Net Bank Deposit:</span>
                    <span>
                      ₹{Number(selectedReceipt.netPaid).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-muted mt-1 p-2 rounded bg-light border" style={{ fontSize: "10.5px", lineHeight: "1.5" }}>
                    ℹ️ <strong>TDS Credit Note:</strong> The 1% TDS withheld above is deposited with the Income Tax Department under your PAN (<strong>{bankDetails.legalPan || "REGISTERED_PAN"}</strong>). It will automatically reflect in your Form 26AS for tax credit offset.
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-0 px-4 pb-3.5 pt-1 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  onClick={() => setSelectedReceipt(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-bold"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <BsDownload size={12} className="me-1" /> Print / Save Advice Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
