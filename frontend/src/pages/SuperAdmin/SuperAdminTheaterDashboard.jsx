import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  BsBox, BsBuilding, BsFilm, BsWallet2, BsChatDots, BsHouseDoor, 
  BsTicketPerforated, BsEnvelope, BsPeople, BsCashCoin, BsActivity, 
  BsGraphUp, BsSearch, BsArrowClockwise, BsEye, BsXLg, BsCheckCircle, 
  BsClockHistory, BsExclamationTriangle, BsHeadset, BsCheckLg, BsTelephone, 
  BsCheck2Circle, BsReply, BsShieldCheck, BsCashStack, BsQrCode,
  BsBell, BsMegaphone, BsTrash, BsSend, BsLockFill, BsUnlockFill, BsShieldShaded,
  BsBank, BsDownload, BsCheck2, BsCopy, BsCheckCircleFill,
  BsCalendarDate, BsCalendarRange, BsFilter, BsPencilSquare, BsReceiptCutoff,
  BsLightningChargeFill, BsPauseCircleFill, BsPlayCircleFill, BsInfoCircleFill,
  BsCupStraw, BsExclamationOctagonFill, BsCheck2All
} from "react-icons/bs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from "../../api/axiosConfig";

function Metric({ icon, label, value, subtitle, onClick, to }) {
  const content = (
    <>
      <span className="admin-bento-icon">{icon}</span>
      <p>{label}</p>
      <h2>{value ?? 0}</h2>
      {subtitle && <span className="sa-metric-sub">{subtitle}</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className="admin-bento-card sa-metric sa-linked-metric" aria-label={`Open ${label}`}>
        {content}
      </Link>
    );
  }
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

export default function SuperAdminTheaterDashboard() {
  const [section, setSection] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [portalsData, setPortalsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [portalUserSearch, setPortalUserSearch] = useState("");
  const [removingUserId, setRemovingUserId] = useState(null);
  const [payoutsData, setPayoutsData] = useState([]);
  const [emailStats, setEmailStats] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailSearch, setEmailSearch] = useState("");
  const [emailTypeFilter, setEmailTypeFilter] = useState("ALL");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipient: "",
    subject: "",
    body: "",
    type: "Alert",
    theaterName: "Thunder Cinemas Chennai"
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState("");

  // Financials & Settlements State
  const [financeSubTab, setFinanceSubTab] = useState("pending"); // "pending" | "daily-collections" | "settled"
  const [selectedTheaterFilter, setSelectedTheaterFilter] = useState("ALL"); // "ALL" or theaterId or theaterName
  const [contractPeriodFilter, setContractPeriodFilter] = useState("ALL"); // "ALL" | "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CUSTOM"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [realSalesHistory, setRealSalesHistory] = useState([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [settleModalPayout, setSettleModalPayout] = useState(null);
  const [settlementForm, setSettlementForm] = useState({
    mode: "NEFT",
    utr: "",
    notes: ""
  });
  const [settlingPayment, setSettlingPayment] = useState(false);
  const [settlementsLedger, setSettlementsLedger] = useState([]);
  const [copiedUtrSuperAdmin, setCopiedUtrSuperAdmin] = useState(null);
  const [selectedSettlementReceipt, setSelectedSettlementReceipt] = useState(null);

  // Payout Hold & Dispute Flag State
  const [heldPayoutsMap, setHeldPayoutsMap] = useState(() => {
    try {
      const raw = localStorage.getItem("platform_held_payouts");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });
  const [holdModalPayout, setHoldModalPayout] = useState(null);
  const [holdReason, setHoldReason] = useState("Bank KYC Discrepancy / IFSC Verification");
  const [holdNotes, setHoldNotes] = useState("");

  // Bulk Settlement Disbursal State
  const [showBulkSettleModal, setShowBulkSettleModal] = useState(false);
  const [bulkSettleMode, setBulkSettleMode] = useState("NEFT");
  const [bulkSettleNotes, setBulkSettleNotes] = useState("");
  const [processingBulkSettle, setProcessingBulkSettle] = useState(false);

  // Bank Linking Modal State
  const [showBankEditModal, setShowBankEditModal] = useState(null); // payout / theater object
  const [bankEditForm, setBankEditForm] = useState({
    bankName: "HDFC Bank",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "HDFC0001234",
    accountHolderName: "",
    accountType: "CURRENT"
  });
  const [savingBank, setSavingBank] = useState(false);

  // Bank Details / KYC Document Request Reminder Modal State
  const [bankReminderModal, setBankReminderModal] = useState(null); // payout / theater object
  const [bankReminderType, setBankReminderType] = useState("BANK_AND_KYC"); // BANK_ONLY, KYC_PAN_ONLY, BANK_AND_KYC
  const [bankReminderNotes, setBankReminderNotes] = useState("");
  const [bankReminderHistory, setBankReminderHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("platform_bank_reminders") || "{}");
    } catch {
      return {};
    }
  });

  // Revenue & Commission Management State
  const [revenueSettings, setRevenueSettings] = useState({
    commissionLocked: true,
    commissionPercentage: 0.0,
    convenienceFeePercentage: 10.0,
    activeStrategy: "Acquisition Mode (Zero Commission for Theaters, 10% Convenience Fee for Users)",
    lastBroadcastSubject: "",
    lastBroadcastNotes: "",
    lastUnlockedAt: null
  });
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [convenienceFeeInput, setConvenienceFeeInput] = useState(10);
  const [commissionRateInput, setCommissionRateInput] = useState(0);
  const [revenueToast, setRevenueToast] = useState("");
  const [savingRevenue, setSavingRevenue] = useState(false);

  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockForm, setUnlockForm] = useState({
    commissionPercentage: 10,
    noteTitle: "Notice: Platform Commission Policy Activated (10%)",
    noteMessage: "Dear Cinema Partners,\n\nPlease be advised that our introductory 0% commission acquisition period has concluded. Effective immediately, a platform commission rate of 10% will be applied to movie ticket sales processed through our platform.\n\nAll ticket settlements, automated ledger records, and payout reports will reflect this updated revenue share. If you have any operational queries, please contact partner support.",
    sendInApp: true,
    sendEmail: true
  });
  const [unlocking, setUnlocking] = useState(false);

  // Lock Modal State
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockForm, setLockForm] = useState({
    noteTitle: "Notice: Promotional 0% Commission Reinstated",
    noteMessage: "Dear Cinema Partners,\n\nWe are pleased to announce that our platform has reinstated the Promotional Acquisition Mode. Ticket commission has been set to 0% with 100% partner retention.",
    sendInApp: true,
    sendEmail: false
  });
  const [locking, setLocking] = useState(false);

  // Theater Portals Management & Deletion State
  const [portalsSubTab, setPortalsSubTab] = useState("active"); // "active" | "deleted"
  const [portalSearch, setPortalSearch] = useState("");
  const [portalStatusFilter, setPortalStatusFilter] = useState("ALL");
  const [showDeletePortalModal, setShowDeletePortalModal] = useState(null);
  const [deleteReasonCategory, setDeleteReasonCategory] = useState("DUPLICATE");
  const [deleteReasonText, setDeleteReasonText] = useState("");
  const [deletePermanent, setDeletePermanent] = useState(true);
  const [deletingPortal, setDeletingPortal] = useState(false);
  const [portalActionToast, setPortalActionToast] = useState("");

  const loadPortalsData = useCallback(() => {
    api.get("/super-admin/theaters/portals")
      .then(res => setPortalsData(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to load theater portals:", err));
  }, []);

  const handleOpenDeletePortalModal = (theater) => {
    setShowDeletePortalModal(theater);
    const hasTickets = (theater.tickets || 0) > 0;
    setDeletePermanent(!hasTickets);
    setDeleteReasonCategory(hasTickets ? "CLOSED" : "DUPLICATE");
    setDeleteReasonText("");
  };

  const handleConfirmDeletePortal = async (e) => {
    e.preventDefault();
    if (!showDeletePortalModal) return;
    setDeletingPortal(true);

    try {
      const categoryLabels = {
        DUPLICATE: "Duplicate Portal",
        INACTIVE: "Inactive / Unused Portal",
        CLOSED: "Permanently Closed Theater",
        OTHER: "Administrative Action"
      };
      const catLabel = categoryLabels[deleteReasonCategory] || "Other Reason";
      const fullReason = deleteReasonText.trim()
        ? `${catLabel} - ${deleteReasonText.trim()}`
        : catLabel;

      await api.delete(`/super-admin/theaters/portals/${showDeletePortalModal.id}`, {
        params: {
          reason: fullReason,
          permanent: deletePermanent
        }
      });

      const message = deletePermanent
        ? `Theater portal "${showDeletePortalModal.name}" was permanently deleted (Reason: ${catLabel}).`
        : `Theater portal "${showDeletePortalModal.name}" has been marked as Inactive / Closed.`;

      setPortalActionToast(message);
      setTimeout(() => setPortalActionToast(""), 6000);

      setShowDeletePortalModal(null);
      loadPortalsData();
      api.get("/super-admin/theaters/dashboard").then(res => setDashboardData(res.data)).catch(console.error);
    } catch (err) {
      console.error(err);
      alert("Failed to delete theater portal: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingPortal(false);
    }
  };

  const activePortalsList = useMemo(() => {
    return portalsData.filter(t => t.status === "Active");
  }, [portalsData]);

  const deletedPortalsList = useMemo(() => {
    return portalsData.filter(t => t.status !== "Active");
  }, [portalsData]);

  const filteredPortals = useMemo(() => {
    const list = portalsSubTab === "active" ? activePortalsList : deletedPortalsList;
    if (!portalSearch.trim()) return list;
    const q = portalSearch.toLowerCase().trim();
    return list.filter((t) => {
      const matchesName = (t.name || "").toLowerCase().includes(q);
      const matchesOwner = (t.owner || "").toLowerCase().includes(q);
      const matchesId = String(t.id || "").includes(q);
      return matchesName || matchesOwner || matchesId;
    });
  }, [portalsSubTab, activePortalsList, deletedPortalsList, portalSearch]);

  const loadUsersData = useCallback(() => {
    api.get("/super-admin/theaters/users")
      .then(res => setUsersData(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to load portal users:", err));
  }, []);

  const handleRemoveEmployee = async (user) => {
    const confirmed = window.confirm(`Are you sure you want to permanently remove employee "${user.name}" (${user.empId}) from ${user.theater}?`);
    if (!confirmed) return;

    setRemovingUserId(user.id);
    try {
      await api.delete(`/super-admin/theaters/users/${user.id}`);
      setPortalActionToast(`Employee "${user.name}" (${user.empId}) was successfully removed from ${user.theater}.`);
      setTimeout(() => setPortalActionToast(""), 5000);
      loadUsersData();
      loadPortalsData();
    } catch (err) {
      console.error(err);
      alert("Failed to remove employee: " + (err.response?.data?.message || err.message));
    } finally {
      setRemovingUserId(null);
    }
  };

  const filteredPortalUsers = useMemo(() => {
    if (!portalUserSearch.trim()) return usersData;
    const q = portalUserSearch.toLowerCase().trim();
    return usersData.filter(u => {
      const matchesEmpId = (u.empId || "").toLowerCase().includes(q);
      const matchesName = (u.name || "").toLowerCase().includes(q);
      const matchesEmail = (u.email || "").toLowerCase().includes(q);
      const matchesTheater = (u.theater || "").toLowerCase().includes(q);
      const matchesPortal = (u.portalId || "").toLowerCase().includes(q);
      return matchesEmpId || matchesName || matchesEmail || matchesTheater || matchesPortal;
    });
  }, [usersData, portalUserSearch]);

  const loadRevenueSettings = useCallback(() => {
    setLoadingRevenue(true);
    api.get("/super-admin/theaters/revenue-settings")
      .then(res => {
        if (res.data) {
          setRevenueSettings(res.data);
          setConvenienceFeeInput(res.data.convenienceFeePercentage ?? 10);
          setCommissionRateInput(res.data.commissionPercentage ?? 0);
        }
      })
      .catch(err => console.error("Failed to load revenue settings:", err))
      .finally(() => setLoadingRevenue(false));
  }, []);

  const handleSaveConvenienceFee = async (e) => {
    e.preventDefault();
    setSavingRevenue(true);
    try {
      const res = await api.put("/super-admin/theaters/revenue-settings", {
        convenienceFeePercentage: Number(convenienceFeeInput)
      });
      setRevenueSettings(res.data);
      setRevenueToast("User convenience fee percentage updated successfully!");
      setTimeout(() => setRevenueToast(""), 4500);
    } catch (err) {
      console.error(err);
      alert("Failed to update convenience fee: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingRevenue(false);
    }
  };

  const handleSaveCommissionRate = async (e) => {
    e.preventDefault();
    if (revenueSettings.commissionLocked) return;
    setSavingRevenue(true);
    try {
      const res = await api.put("/super-admin/theaters/revenue-settings", {
        commissionPercentage: Number(commissionRateInput)
      });
      setRevenueSettings(res.data);
      setRevenueToast("Theater commission rate updated successfully!");
      setTimeout(() => setRevenueToast(""), 4500);
    } catch (err) {
      console.error(err);
      alert("Failed to update commission rate: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingRevenue(false);
    }
  };

  const handleUnlockCommission = async (e) => {
    e.preventDefault();
    if (!unlockForm.noteTitle || !unlockForm.noteMessage) {
      alert("Please enter an announcement title and message content for the theaters.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await api.post("/super-admin/theaters/revenue-settings/unlock", {
        commissionPercentage: Number(unlockForm.commissionPercentage),
        noteTitle: unlockForm.noteTitle,
        noteMessage: unlockForm.noteMessage,
        sendInApp: unlockForm.sendInApp,
        sendEmail: unlockForm.sendEmail
      });
      setRevenueSettings(res.data);
      setCommissionRateInput(res.data.commissionPercentage ?? unlockForm.commissionPercentage);
      setShowUnlockModal(false);
      setRevenueToast("Commission feature unlocked & policy notes dispatched to theaters!");
      setTimeout(() => setRevenueToast(""), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to unlock commission: " + (err.response?.data?.message || err.message));
    } finally {
      setUnlocking(false);
    }
  };

  const handleLockCommission = async (e) => {
    e.preventDefault();
    setLocking(true);
    try {
      const res = await api.post("/super-admin/theaters/revenue-settings/lock", {
        noteTitle: (lockForm.sendInApp || lockForm.sendEmail) ? lockForm.noteTitle : "",
        noteMessage: (lockForm.sendInApp || lockForm.sendEmail) ? lockForm.noteMessage : "",
        sendInApp: lockForm.sendInApp,
        sendEmail: lockForm.sendEmail
      });
      setRevenueSettings(res.data);
      setCommissionRateInput(0);
      setShowLockModal(false);
      setRevenueToast("Commission locked back to 0% (Acquisition Mode)!");
      setTimeout(() => setRevenueToast(""), 4500);
    } catch (err) {
      console.error(err);
      alert("Failed to lock commission: " + (err.response?.data?.message || err.message));
    } finally {
      setLocking(false);
    }
  };

  const loadEmailData = useCallback(() => {
    api.get("/super-admin/theaters/emails/stats").then(res => setEmailStats(res.data)).catch(err => console.error(err));
    api.get("/super-admin/theaters/emails/logs").then(res => setEmailLogs(res.data)).catch(err => console.error(err));
  }, []);

  const handleSendComposeEmail = async (e) => {
    e.preventDefault();
    if (!composeForm.recipient || !composeForm.subject || !composeForm.body) {
      alert("Please enter recipient email, subject, and message content.");
      return;
    }
    setSendingEmail(true);
    try {
      await api.post("/super-admin/theaters/emails/send", composeForm);
      setEmailToast("Email dispatched successfully to " + composeForm.recipient);
      setTimeout(() => setEmailToast(""), 4500);
      setShowComposeModal(false);
      setComposeForm({
        recipient: "",
        subject: "",
        body: "",
        type: "Alert",
        theaterName: "Thunder Cinemas Chennai"
      });
      loadEmailData();
    } catch (err) {
      console.error(err);
      alert("Failed to send email: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredEmailLogs = useMemo(() => {
    return emailLogs.filter((log) => {
      const matchesType = emailTypeFilter === "ALL" || !emailTypeFilter || 
        log.type?.toLowerCase() === emailTypeFilter.toLowerCase();
      const q = emailSearch.toLowerCase();
      const matchesSearch = !emailSearch ||
        log.subject?.toLowerCase().includes(q) ||
        log.recipient?.toLowerCase().includes(q) ||
        log.theater?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [emailLogs, emailTypeFilter, emailSearch]);

  // Financials & Settlements Ledger Handlers
  const loadSettlementsLedger = useCallback(() => {
    try {
      const raw = localStorage.getItem("platform_settlements_ledger");
      if (raw) {
        setSettlementsLedger(JSON.parse(raw));
      } else {
        setSettlementsLedger([]);
      }
    } catch (e) {
      console.error("Error loading settlements ledger:", e);
    }
  }, []);

  const getTheaterBankSettings = useCallback((theaterId) => {
    try {
      if (theaterId) {
        const raw = localStorage.getItem(`theater_payout_settings_${theaterId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.accountNumber) return parsed;
        }
      }
      const raw2 = localStorage.getItem("theater_payout_settings_2");
      if (raw2) {
        const parsed2 = JSON.parse(raw2);
        if (parsed2 && parsed2.accountNumber) return parsed2;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("theater_payout_settings_")) {
          const val = JSON.parse(localStorage.getItem(key) || "{}");
          if (val && val.accountNumber) return val;
        }
      }
    } catch (e) {
      console.warn("Error getting bank settings:", e);
    }
    return null;
  }, []);

  const loadFinancialsData = useCallback(async () => {
    setLoadingFinancials(true);
    try {
      const [payoutsRes, salesRes, portalsRes] = await Promise.all([
        api.get("/super-admin/theaters/payouts").catch(() => ({ data: [] })),
        api.get("/theater/sales-history").catch(() => ({ data: [] })),
        api.get("/super-admin/theaters/portals").catch(() => ({ data: [] }))
      ]);

      const salesList = Array.isArray(salesRes.data) ? salesRes.data : [];
      setRealSalesHistory(salesList);

      const portalsList = Array.isArray(portalsRes.data) ? portalsRes.data : [];
      const rawSettledIds = localStorage.getItem("platform_settled_payout_ids");
      const settledIds = rawSettledIds ? JSON.parse(rawSettledIds) : [];

      const existingPayouts = Array.isArray(payoutsRes.data) ? payoutsRes.data : [];
      const theaterMap = new Map();

      // 1. Add existing backend payouts
      existingPayouts.forEach(p => {
        theaterMap.set(String(p.id), {
          ...p,
          status: settledIds.includes(p.id) || p.status === "Paid" || p.status === "Settled" ? "Paid" : "Pending"
        });
      });

      // 2. Add all portals from portalsList so every registered theater is represented
      portalsList.forEach(portal => {
        const key = String(portal.id);
        if (!theaterMap.has(key)) {
          const tSales = salesList.filter(s => 
            String(s.theaterId) === key || 
            String(s.portalId) === key || 
            (s.theaterName && portal.name && s.theaterName.toLowerCase() === portal.name.toLowerCase())
          );
          const tTickets = tSales.reduce((acc, s) => {
            const seats = s.seats ? (typeof s.seats === "string" ? s.seats.split(",").length : (Array.isArray(s.seats) ? s.seats.length : 1)) : 1;
            return acc + seats;
          }, 0);
          const tGross = tSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
          const tFee = tTickets * 25;
          const tOwed = Math.max(0, tGross - tFee);

          theaterMap.set(key, {
            id: portal.id,
            theater: portal.name,
            ownerEmail: portal.owner,
            tickets: tTickets,
            comm: "0%",
            owed: Math.round(tOwed * 100) / 100,
            acc: "PENDING_SETUP",
            status: settledIds.includes(portal.id) ? "Paid" : "Pending"
          });
        }
      });

      setPayoutsData(Array.from(theaterMap.values()));
    } catch (err) {
      console.error("Failed to load financials data:", err);
    } finally {
      setLoadingFinancials(false);
    }
  }, []);

  // Quick Bank Linking Modal Handler
  const handleOpenBankEdit = (payout) => {
    const existing = getTheaterBankSettings(payout.id);
    setBankEditForm({
      bankName: existing?.bankName || "HDFC Bank",
      accountNumber: existing?.accountNumber || "",
      confirmAccountNumber: existing?.accountNumber || "",
      ifscCode: existing?.ifscCode || "HDFC0001234",
      accountHolderName: existing?.accountHolderName || payout.theater || "",
      accountType: existing?.accountType || "CURRENT"
    });
    setShowBankEditModal(payout);
  };

  const handleSaveTheaterBank = async (e) => {
    e.preventDefault();
    if (!showBankEditModal) return;
    if (bankEditForm.accountNumber !== bankEditForm.confirmAccountNumber) {
      alert("Account numbers do not match. Please verify.");
      return;
    }
    setSavingBank(true);
    try {
      const dataToSave = {
        ...bankEditForm,
        isKycVerified: true,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`theater_payout_settings_${showBankEditModal.id}`, JSON.stringify(dataToSave));
      if (String(showBankEditModal.id) === "2" || showBankEditModal.theater === "Naveen Cinemas") {
        localStorage.setItem("theater_payout_settings_2", JSON.stringify(dataToSave));
      }

      try {
        await api.put(`/theater/payout-settings/${showBankEditModal.id}`, dataToSave);
      } catch (ignored) {}

      window.dispatchEvent(new CustomEvent("platform_settlement_completed", { detail: { type: "BANK_UPDATE", theaterId: showBankEditModal.id } }));
      setEmailToast(`Bank account successfully linked & verified for ${showBankEditModal.theater}!`);
      setTimeout(() => setEmailToast(""), 4500);
      setShowBankEditModal(null);
      loadFinancialsData();
    } catch (err) {
      console.error(err);
      alert("Failed to save bank details.");
    } finally {
      setSavingBank(false);
    }
  };

  // Bank & KYC Document Request Reminder Handlers
  const handleOpenBankReminderModal = (payout) => {
    setBankReminderModal(payout);
    setBankReminderType("BANK_AND_KYC");
    setBankReminderNotes("Please submit your verified business bank account details, IFSC, and Business PAN & GSTIN documents to enable automated T+1 daily payout transfers.");
  };

  const handleSendBankReminder = (e) => {
    e?.preventDefault?.();
    if (!bankReminderModal) return;
    const theaterId = String(bankReminderModal.id);
    const theaterName = bankReminderModal.theater || "Theater Partner";

    const reminderPayload = {
      id: `REM-${Date.now()}`,
      theaterId,
      theaterName,
      type: bankReminderType,
      message: bankReminderNotes,
      sentAt: new Date().toISOString(),
      sentBy: "SuperAdmin Audit Team",
      status: "PENDING_THEATER_ACTION",
      requiresBank: bankReminderType !== "KYC_PAN_ONLY",
      requiresKyc: bankReminderType !== "BANK_ONLY",
    };

    const updatedHistory = { ...bankReminderHistory, [theaterId]: reminderPayload };
    setBankReminderHistory(updatedHistory);
    localStorage.setItem("platform_bank_reminders", JSON.stringify(updatedHistory));

    if (theaterId === "2" || theaterName.toLowerCase().includes("naveen")) {
      updatedHistory["2"] = reminderPayload;
      localStorage.setItem("platform_bank_reminders", JSON.stringify(updatedHistory));
    }

    // Push notification to theater inbox
    try {
      const notifKey = `theater_notifications_${theaterId}`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || "[]");
      const newNotif = {
        id: `NOTIF-${Date.now()}`,
        portalId: theaterId,
        title: "Action Required: Submit Bank Account & KYC Documents",
        message: bankReminderNotes,
        type: "ADMIN_BANK_REQUEST",
        actionUrl: "/theater-dashboard?tab=finances",
        read: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(notifKey, JSON.stringify([newNotif, ...existingNotifs]));
    } catch (err) {
      console.warn("Error saving notification:", err);
    }

    window.dispatchEvent(new CustomEvent("theater_notification_received", {
      detail: { theaterId, type: "ADMIN_BANK_REQUEST", reminder: reminderPayload }
    }));
    window.dispatchEvent(new CustomEvent("platform_settlement_completed", {
      detail: { type: "REMINDER_UPDATE", theaterId }
    }));

    setEmailToast(`In-app notification sent to ${theaterName} for bank & KYC submission!`);
    setTimeout(() => setEmailToast(""), 4500);
    setBankReminderModal(null);
  };

  // Date / Contract Period Filter Checker
  const isDateInPeriod = useCallback((dateStr) => {
    if (!dateStr || contractPeriodFilter === "ALL") return true;
    const cleanDate = dateStr.slice(0, 10);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (contractPeriodFilter === "TODAY") {
      return cleanDate === todayStr;
    }
    if (contractPeriodFilter === "YESTERDAY") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return cleanDate === yest.toISOString().slice(0, 10);
    }
    if (contractPeriodFilter === "WEEK") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return cleanDate >= oneWeekAgo.toISOString().slice(0, 10) && cleanDate <= todayStr;
    }
    if (contractPeriodFilter === "MONTH") {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      return cleanDate >= oneMonthAgo.toISOString().slice(0, 10) && cleanDate <= todayStr;
    }
    if (contractPeriodFilter === "CUSTOM") {
      if (customStartDate && cleanDate < customStartDate) return false;
      if (customEndDate && cleanDate > customEndDate) return false;
      return true;
    }
    return true;
  }, [contractPeriodFilter, customStartDate, customEndDate]);

  // Real Sales History filtered by Theater and Contract Period
  const filteredSales = useMemo(() => {
    return realSalesHistory.filter(s => {
      // 1. Theater filter
      if (selectedTheaterFilter !== "ALL") {
        const matchId = String(s.theaterId) === String(selectedTheaterFilter) || String(s.portalId) === String(selectedTheaterFilter);
        const matchName = s.theaterName && payoutsData.some(p => String(p.id) === String(selectedTheaterFilter) && p.theater && p.theater.toLowerCase() === s.theaterName.toLowerCase());
        if (!matchId && !matchName) return false;
      }
      // 2. Period filter
      const dateToCheck = s.date || (s.createdAt ? s.createdAt.slice(0, 10) : "");
      return isDateInPeriod(dateToCheck);
    });
  }, [realSalesHistory, selectedTheaterFilter, isDateInPeriod, payoutsData]);

  // Theater Payouts dynamically calculated for selected period with Box Office vs F&B and Tax Segregation
  const displayPayouts = useMemo(() => {
    return payoutsData
      .filter(p => selectedTheaterFilter === "ALL" || String(p.id) === String(selectedTheaterFilter))
      .map(p => {
        const tSales = (contractPeriodFilter === "ALL" ? realSalesHistory : filteredSales).filter(s => 
          String(s.theaterId) === String(p.id) || 
          String(s.portalId) === String(p.id) || 
          (s.theaterName && p.theater && s.theaterName.toLowerCase() === p.theater.toLowerCase())
        );

        let boxOfficeTickets = tSales.reduce((acc, s) => {
          const seats = s.seats ? (typeof s.seats === "string" ? s.seats.split(",").length : (Array.isArray(s.seats) ? s.seats.length : 1)) : 1;
          return acc + seats;
        }, 0);

        let boxOfficeGross = tSales.reduce((acc, s) => acc + (Number(s.amount || s.totalAmount || s.ticketPrice || 0)), 0);
        let fnbGross = tSales.reduce((acc, s) => acc + (Number(s.fnbAmount || s.canteenAmount || 0)), 0);

        // Fallback if no individual sales records match but portal has pre-calculated payout
        if (tSales.length === 0 && (p.owed > 0 || p.tickets > 0)) {
          boxOfficeTickets = p.tickets || 0;
          boxOfficeGross = Number(p.grossInPeriod || (p.owed + (p.owed * 0.1)) || (p.owed || 0));
          fnbGross = 0;
        }

        const totalGross = Math.round((boxOfficeGross + fnbGross) * 100) / 100;
        // Platform convenience fee: ₹25 per ticket or 10%
        const convenienceFee = boxOfficeTickets > 0 ? (boxOfficeTickets * 25) : Math.round(totalGross * 0.1 * 100) / 100;
        // 18% GST on convenience fee
        const gstOnFee = Math.round((convenienceFee * 0.18) * 100) / 100;
        // 1% Section 194-O TDS on gross transaction value
        const tdsAmount = Math.round((totalGross * 0.01) * 100) / 100;
        const totalDeductions = Math.round((convenienceFee + gstOnFee + tdsAmount) * 100) / 100;
        const netPayable = Math.max(0, Math.round((totalGross - totalDeductions) * 100) / 100);

        const isHeld = !!(heldPayoutsMap[p.id]?.isHeld);
        const holdData = heldPayoutsMap[p.id] || null;

        return {
          ...p,
          tickets: boxOfficeTickets,
          boxOfficeTickets,
          boxOfficeGross,
          fnbGross,
          totalGross,
          convenienceFee,
          gstOnFee,
          tdsAmount,
          totalDeductions,
          owed: netPayable > 0 ? netPayable : (p.owed || 0),
          isHeld,
          holdData
        };
      });
  }, [payoutsData, selectedTheaterFilter, contractPeriodFilter, realSalesHistory, filteredSales, heldPayoutsMap]);

  // Hold / Dispute Actions
  const handleOpenHoldModal = (payout) => {
    setHoldModalPayout(payout);
    setHoldReason(payout.holdData?.reason || "Bank KYC Discrepancy / IFSC Verification");
    setHoldNotes(payout.holdData?.notes || "");
  };

  const handleSaveHoldStatus = () => {
    if (!holdModalPayout) return;
    const current = { ...heldPayoutsMap };
    current[holdModalPayout.id] = {
      isHeld: true,
      reason: holdReason,
      notes: holdNotes,
      heldAt: new Date().toISOString()
    };
    setHeldPayoutsMap(current);
    localStorage.setItem("platform_held_payouts", JSON.stringify(current));
    setEmailToast(`Payout for ${holdModalPayout.theater} placed on HOLD: ${holdReason}`);
    setTimeout(() => setEmailToast(""), 5000);
    setHoldModalPayout(null);
  };

  const handleReleaseHold = (payout) => {
    const current = { ...heldPayoutsMap };
    delete current[payout.id];
    setHeldPayoutsMap(current);
    localStorage.setItem("platform_held_payouts", JSON.stringify(current));
    setEmailToast(`Hold released for ${payout.theater}. Payout is now eligible for disbursement.`);
    setTimeout(() => setEmailToast(""), 4500);
  };

  // Eligible payouts for 1-Click Bulk Disbursal
  const eligibleBulkPayouts = useMemo(() => {
    return displayPayouts.filter(p => {
      const bank = getTheaterBankSettings(p.id);
      return p.status === "Pending" && !p.isHeld && Boolean(bank && bank.accountNumber) && (p.owed > 0);
    });
  }, [displayPayouts, getTheaterBankSettings]);

  const handleOpenBulkSettle = () => {
    if (eligibleBulkPayouts.length === 0) {
      alert("No eligible pending theater payouts found. Theaters must have linked bank accounts and not be on hold.");
      return;
    }
    setBulkSettleMode("NEFT");
    setBulkSettleNotes(`Automated batch disbursement for ${eligibleBulkPayouts.length} verified theater partner(s)`);
    setShowBulkSettleModal(true);
  };

  const handleConfirmBulkSettle = async (e) => {
    e.preventDefault();
    if (eligibleBulkPayouts.length === 0) return;
    setProcessingBulkSettle(true);

    try {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const batchRef = `CMS-BATCH-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      const periodLabel = contractPeriodFilter === "ALL" ? "All Time Lifetime Batch" : (contractPeriodFilter === "CUSTOM" ? `${customStartDate} to ${customEndDate}` : contractPeriodFilter);

      const newLedgerRecords = [];
      const rawSettledIds = localStorage.getItem("platform_settled_payout_ids");
      const settledIds = rawSettledIds ? JSON.parse(rawSettledIds) : [];

      eligibleBulkPayouts.forEach((p, idx) => {
        const bank = getTheaterBankSettings(p.id);
        const seq = String(idx + 1).padStart(3, "0");
        const utr = `CMS${todayStr}${Math.floor(100000 + Math.random() * 900000)}-${seq}`;

        const record = {
          id: `SET-BATCH-${Date.now().toString().slice(-6)}-${seq}`,
          batchRef,
          theaterId: p.id,
          theaterName: p.theater,
          utr,
          mode: bulkSettleMode,
          boxOfficeGross: Number(p.boxOfficeGross || 0),
          fnbGross: Number(p.fnbGross || 0),
          grossAmount: Number(p.totalGross || (p.owed + (p.owed * 0.1))),
          convenienceFeeDeducted: Number(p.convenienceFee || ((p.owed || 0) * 0.1)),
          gstDeducted: Number(p.gstOnFee || 0),
          tdsDeducted: Number(p.tdsAmount || 0),
          netPaid: Number(p.owed || 0),
          ticketsSold: Number(p.tickets || 0),
          settledAt: new Date().toISOString(),
          dateFormatted: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          forDate: `${periodLabel} (${p.tickets || 0} Tickets)`,
          notes: bulkSettleNotes || `Batch wire transfer authorized via ${bulkSettleMode} by SuperAdmin`,
          bankName: bank?.bankName || "Corporate NetBanking",
          accountMasked: bank?.accountNumber ? `•••• ${bank.accountNumber.slice(-4)}` : "DIRECT_WIRE",
          ifscCode: bank?.ifscCode || "N/A",
          accountHolderName: bank?.accountHolderName || p.theater,
          status: "SETTLED"
        };

        newLedgerRecords.push(record);
        if (!settledIds.includes(p.id)) {
          settledIds.push(p.id);
        }
      });

      // 1. Update Ledger in localStorage
      const currentLedger = JSON.parse(localStorage.getItem("platform_settlements_ledger") || "[]");
      const updatedLedger = [...newLedgerRecords, ...currentLedger];
      localStorage.setItem("platform_settlements_ledger", JSON.stringify(updatedLedger));
      setSettlementsLedger(updatedLedger);

      // 2. Mark settled IDs
      localStorage.setItem("platform_settled_payout_ids", JSON.stringify(settledIds));

      // 3. Update payoutsData state
      const settledIdSet = new Set(eligibleBulkPayouts.map(p => p.id));
      setPayoutsData(prev => prev.map(p => settledIdSet.has(p.id) ? { ...p, status: "Paid" } : p));

      // 4. Dispatch events for real-time theater portal sync
      newLedgerRecords.forEach(rec => {
        window.dispatchEvent(new CustomEvent("platform_settlement_completed", { detail: rec }));
      });

      const totalBatchPaid = newLedgerRecords.reduce((acc, r) => acc + (r.netPaid || 0), 0);
      setEmailToast(`⚡ Batch Disbursed: ₹${totalBatchPaid.toLocaleString("en-IN")} deposited across ${newLedgerRecords.length} theater partners.`);
      setTimeout(() => setEmailToast(""), 6000);

      setShowBulkSettleModal(false);
    } catch (err) {
      console.error("Failed to execute bulk settlement:", err);
      alert("Error processing bulk batch disbursal.");
    } finally {
      setProcessingBulkSettle(false);
    }
  };

  // Historical Settlements filtered by Theater and Period
  const filteredSettlements = useMemo(() => {
    return settlementsLedger.filter(s => {
      if (selectedTheaterFilter !== "ALL") {
        if (String(s.theaterId) !== String(selectedTheaterFilter)) {
          const selP = payoutsData.find(p => String(p.id) === String(selectedTheaterFilter));
          if (!selP || !s.theaterName || s.theaterName.toLowerCase() !== selP.theater.toLowerCase()) {
            return false;
          }
        }
      }
      const sDate = s.settledAt ? s.settledAt.slice(0, 10) : "";
      return isDateInPeriod(sDate);
    });
  }, [settlementsLedger, selectedTheaterFilter, isDateInPeriod, payoutsData]);

  const handleOpenSettleModal = (payout) => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedUtr = `CMS${todayStr}${randomSuffix}`;

    const bank = getTheaterBankSettings(payout.id);
    const periodLabel = contractPeriodFilter === "ALL" ? "All Time" : (contractPeriodFilter === "CUSTOM" ? `${customStartDate || "Start"} to ${customEndDate || "End"}` : contractPeriodFilter);

    setSettlementForm({
      mode: bank?.payoutMode || "NEFT",
      utr: generatedUtr,
      notes: `Settlement for ${payout.theater} (${payout.tickets || 0} tickets - Period: ${periodLabel})`
    });
    setSettleModalPayout(payout);
  };

  const handleConfirmSettlement = async (e) => {
    e.preventDefault();
    if (!settleModalPayout) return;
    setSettlingPayment(true);

    try {
      const bank = getTheaterBankSettings(settleModalPayout.id);
      const periodLabel = contractPeriodFilter === "ALL" ? "Ticket Sales Batch" : (contractPeriodFilter === "CUSTOM" ? `${customStartDate} to ${customEndDate}` : contractPeriodFilter);
      const newRecord = {
        id: `SET-${Date.now().toString().slice(-8)}`,
        theaterId: settleModalPayout.id,
        theaterName: settleModalPayout.theater,
        utr: settlementForm.utr.trim() || `CMS${Date.now().toString().slice(-10)}`,
        grossAmount: Number(settleModalPayout.totalGross || ((settleModalPayout.owed || 0) + ((settleModalPayout.owed || 0) * 0.1))),
        boxOfficeGross: Number(settleModalPayout.boxOfficeGross || 0),
        fnbGross: Number(settleModalPayout.fnbGross || 0),
        convenienceFeeDeducted: Number(settleModalPayout.convenienceFee || ((settleModalPayout.owed || 0) * 0.1)),
        gstDeducted: Number(settleModalPayout.gstOnFee || 0),
        tdsDeducted: Number(settleModalPayout.tdsAmount || 0),
        netPaid: Number(settleModalPayout.owed || 0),
        ticketsSold: Number(settleModalPayout.tickets || 0),
        settledAt: new Date().toISOString(),
        dateFormatted: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        forDate: `${periodLabel} (${settleModalPayout.tickets} Tickets)`,
        notes: settlementForm.notes || `Disbursed via ${settlementForm.mode} by Super Admin`,
        bankName: bank?.bankName || "Corporate NetBanking",
        accountMasked: bank?.accountNumber ? `•••• ${bank.accountNumber.slice(-4)}` : "DIRECT_WIRE",
        ifscCode: bank?.ifscCode || "N/A",
        accountHolderName: bank?.accountHolderName || settleModalPayout.theater,
        status: "SETTLED"
      };

      // 1. Save to ledger
      const currentLedger = JSON.parse(localStorage.getItem("platform_settlements_ledger") || "[]");
      const updatedLedger = [newRecord, ...currentLedger];
      localStorage.setItem("platform_settlements_ledger", JSON.stringify(updatedLedger));
      setSettlementsLedger(updatedLedger);

      // 2. Mark payout as paid in local storage
      const rawSettledIds = localStorage.getItem("platform_settled_payout_ids");
      const settledIds = rawSettledIds ? JSON.parse(rawSettledIds) : [];
      if (!settledIds.includes(settleModalPayout.id)) {
        settledIds.push(settleModalPayout.id);
        localStorage.setItem("platform_settled_payout_ids", JSON.stringify(settledIds));
      }

      // 3. Update payoutsData state
      setPayoutsData(prev => prev.map(p => p.id === settleModalPayout.id ? { ...p, status: "Paid", utr: newRecord.utr } : p));

      // 4. Dispatch custom event for real-time sync with theater owner portal
      window.dispatchEvent(new CustomEvent("platform_settlement_completed", { detail: newRecord }));

      // 5. Broadcast notification to theater owner
      try {
        await api.post("/super-admin/theaters/notifications/broadcast", {
          portalId: settleModalPayout.id,
          targetRole: "ALL",
          type: "PAYOUT_SETTLED",
          title: `Settlement Disbursed: ₹${newRecord.netPaid.toLocaleString("en-IN")}`,
          message: `Your ticket payout batch (${newRecord.ticketsSold} tickets) has been disbursed via ${newRecord.mode}. RBI UTR: ${newRecord.utr}`,
          actionUrl: "/theater/dashboard"
        });
      } catch (notifErr) {
        console.log("Settlement notification fallback:", notifErr);
      }

      // 6. Toast & close modal
      setEmailToast(`Settlement of ₹${newRecord.netPaid.toLocaleString("en-IN")} successfully disbursed to ${newRecord.theaterName}! (UTR: ${newRecord.utr})`);
      setTimeout(() => setEmailToast(""), 6000);
      setSettleModalPayout(null);
    } catch (err) {
      console.error("Failed to process settlement:", err);
      alert("Error processing settlement. Please try again.");
    } finally {
      setSettlingPayment(false);
    }
  };

  const handleExportFinancialsCsv = () => {
    try {
      const activeTheaterName = selectedTheaterFilter === "ALL" ? "All_Theaters" : (payoutsData.find(p => String(p.id) === String(selectedTheaterFilter))?.theater?.replace(/\s+/g, "_") || "Theater");
      const activePeriod = contractPeriodFilter.toLowerCase();

      if (financeSubTab === "daily-collections") {
        if (!filteredSales.length) {
          alert("No daily collection transactions to export for the selected filter.");
          return;
        }
        let csv = "Booking ID,Date,Time,Theater,Movie,Screen,Customer,Phone,Seats,Gross Amount (INR),Platform Fee (INR),Net Share (INR),Payment Mode,Status\n";
        filteredSales.forEach(s => {
          const seatsCount = s.seats ? (typeof s.seats === "string" ? s.seats.split(",").length : 1) : 1;
          const gross = Number(s.amount || 0);
          const fee = seatsCount * 25;
          const net = Math.max(0, gross - fee);
          csv += `"${s.ticketId || s.id}","${s.date || ""}","${s.time || ""}","${s.theaterName || ""}","${s.movieTitle || ""}","${s.screenName || ""}","${s.customerName || ""}","${s.customerPhone || ""}","${s.seats || ""}","${gross}","${fee}","${net}","${s.paymentMode || ""}","${s.status || "VALID"}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `daily_collections_${activeTheaterName}_${activePeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (financeSubTab === "settled") {
        if (!filteredSettlements.length) {
          alert("No completed settlements to export for the selected filter.");
          return;
        }
        let csv = "Settlement ID,Theater,Tickets Sold,Gross Amount (INR),Platform Fee (INR),Net Paid (INR),Transfer Mode,UTR Reference,Bank,Settled Date,Period,Status\n";
        filteredSettlements.forEach(s => {
          csv += `"${s.id}","${s.theaterName || ""}","${s.ticketsSold || 0}","${s.grossAmount || 0}","${s.convenienceFeeDeducted || 0}","${s.netPaid || 0}","${s.mode || ""}","${s.utr || ""}","${s.bankName || ""} ${s.accountMasked || ""}","${s.dateFormatted || s.settledAt || ""}","${s.forDate || ""}","${s.status || "SETTLED"}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `settlements_ledger_${activeTheaterName}_${activePeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        if (!displayPayouts.length) {
          alert("No theater payouts to export for the selected filter.");
          return;
        }
        let csv = "Theater ID,Theater Name,Tickets Sold,Box Office Gross (INR),F&B Gross (INR),Total Gross (INR),Platform Fee (INR),GST 18% (INR),TDS 1% (INR),Total Deductions (INR),Net Payable (INR),Linked Bank,Hold Status,Status\n";
        displayPayouts.forEach(p => {
          const bank = getTheaterBankSettings(p.id);
          const accRef = bank?.accountNumber ? `${bank.bankName} (•••• ${bank.accountNumber.slice(-4)})` : p.acc || "PENDING_SETUP";
          const holdStatus = p.isHeld ? `HELD: ${p.holdData?.reason || 'Dispute'}` : "ACTIVE";
          csv += `"${p.id}","${p.theater}","${p.tickets || 0}","${p.boxOfficeGross || 0}","${p.fnbGross || 0}","${p.totalGross || 0}","${p.convenienceFee || 0}","${p.gstOnFee || 0}","${p.tdsAmount || 0}","${p.totalDeductions || 0}","${p.owed || 0}","${accRef}","${holdStatus}","${p.status || "Pending"}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `theater_payouts_${activeTheaterName}_${activePeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Export CSV failed:", e);
    }
  };

  // Support Module State
  const [supportSubTab, setSupportSubTab] = useState("partner"); // "partner" | "public"
  const [theaterTickets, setTheaterTickets] = useState([]);
  const [publicTickets, setPublicTickets] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [searchSupport, setSearchSupport] = useState("");
  const [supportCategoryFilter, setSupportCategoryFilter] = useState("ALL");
  const [supportStatusFilter, setSupportStatusFilter] = useState("ALL");
  const [supportPriorityFilter, setSupportPriorityFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketType, setTicketType] = useState("partner"); // "partner" | "public"
  const [ticketEdit, setTicketEdit] = useState({ status: "OPEN", priority: "MEDIUM", adminResponse: "", refundProcessed: false });
  const [savingTicket, setSavingTicket] = useState(false);
  const [supportToast, setSupportToast] = useState("");
  const [supportError, setSupportError] = useState("");

  const loadSupportData = useCallback(async () => {
    setLoadingSupport(true);
    setSupportError("");
    try {
      const [theaterRes, publicRes] = await Promise.all([
        api.get("/super-admin/theaters/support"),
        api.get("/super-admin/theaters/public-support?bookingType=MOVIE")
      ]);
      setTheaterTickets(Array.isArray(theaterRes.data) ? theaterRes.data : []);
      setPublicTickets(Array.isArray(publicRes.data) ? publicRes.data : []);
    } catch (err) {
      console.error("Failed to load theater support requests:", err);
      setSupportError("Unable to fetch live support requests.");
    } finally {
      setLoadingSupport(false);
    }
  }, []);

  const openTicketModal = (ticket, type) => {
    setSelectedTicket(ticket);
    setTicketType(type);
    setTicketEdit({
      status: ticket.status || "OPEN",
      priority: ticket.priority || "MEDIUM",
      adminResponse: ticket.adminResponse || "",
      refundProcessed: Boolean(ticket.refundProcessed)
    });
    setSupportToast("");
    setSupportError("");
  };

  const handleSaveTicket = async () => {
    if (!selectedTicket) return;
    setSavingTicket(true);
    setSupportError("");
    setSupportToast("");
    try {
      if (ticketType === "partner") {
        const { data } = await api.patch(`/super-admin/theaters/support/${selectedTicket.id}`, {
          status: ticketEdit.status,
          priority: ticketEdit.priority,
          adminResponse: ticketEdit.adminResponse
        });
        setTheaterTickets(curr => curr.map(t => t.id === data.id ? data : t));
        setSelectedTicket(data);
        setSupportToast("Theater partner ticket updated successfully!");
      } else {
        const { data } = await api.patch(`/super-admin/theaters/public-support/${selectedTicket.id}`, {
          status: ticketEdit.status,
          priority: ticketEdit.priority,
          adminResponse: ticketEdit.adminResponse,
          refundProcessed: ticketEdit.refundProcessed
        });
        setPublicTickets(curr => curr.map(t => t.id === data.id ? data : t));
        setSelectedTicket(data);
        setSupportToast("Public movie ticket updated successfully!");
      }
    } catch (err) {
      setSupportError(err.response?.data?.message || "Failed to update ticket.");
    } finally {
      setSavingTicket(false);
    }
  };

  // Notification Broadcast Module State
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifSearch, setNotifSearch] = useState("");
  const [notifTypeFilter, setNotifTypeFilter] = useState("ALL");
  const [notifRoleFilter, setNotifRoleFilter] = useState("ALL");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifToast, setNotifToast] = useState("");
  const [notifForm, setNotifForm] = useState({
    portalId: "",
    targetRole: "ALL",
    type: "SYSTEM_ALERT",
    title: "",
    message: "",
    actionUrl: ""
  });

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const res = await api.get("/super-admin/theaters/notifications", { params: { page: 0, size: 100 } });
      setNotificationsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      alert("Please provide both an announcement title and message content.");
      return;
    }
    setSendingNotif(true);
    try {
      const payload = {
        portalId: notifForm.portalId ? Number(notifForm.portalId) : null,
        targetRole: notifForm.targetRole,
        type: notifForm.type,
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        actionUrl: notifForm.actionUrl ? notifForm.actionUrl.trim() : null
      };
      const res = await api.post("/super-admin/theaters/notifications/broadcast", payload);
      setNotifToast(res.data?.message || "Notification broadcast dispatched successfully!");
      setTimeout(() => setNotifToast(""), 4500);
      setShowNotifModal(false);
      setNotifForm({
        portalId: "",
        targetRole: "ALL",
        type: "SYSTEM_ALERT",
        title: "",
        message: "",
        actionUrl: ""
      });
      loadNotifications();
    } catch (err) {
      console.error(err);
      alert("Failed to dispatch broadcast: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to revoke/delete this notification?")) return;
    try {
      await api.delete(`/super-admin/theaters/notifications/${id}`);
      setNotificationsList(prev => prev.filter(n => n.id !== id));
      setNotifToast("Notification deleted successfully.");
      setTimeout(() => setNotifToast(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to delete notification.");
    }
  };

  const filteredNotifications = useMemo(() => {
    return notificationsList.filter(n => {
      const matchesType = notifTypeFilter === "ALL" || !notifTypeFilter ||
        n.type?.toUpperCase() === notifTypeFilter.toUpperCase();
      const matchesRole = notifRoleFilter === "ALL" || !notifRoleFilter ||
        n.targetRole?.toUpperCase() === notifRoleFilter.toUpperCase();
      const q = notifSearch.toLowerCase();
      const matchesSearch = !notifSearch ||
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q) ||
        n.theaterPortal?.portalName?.toLowerCase().includes(q);
      return matchesType && matchesRole && matchesSearch;
    });
  }, [notificationsList, notifTypeFilter, notifRoleFilter, notifSearch]);

  useEffect(() => {
    if (section === "overview") {
      api.get("/super-admin/theaters/dashboard").then(res => setDashboardData(res.data)).catch(err => console.error(err));
    } else if (section === "portals") {
      api.get("/super-admin/theaters/portals").then(res => setPortalsData(res.data)).catch(err => console.error(err));
    } else if (section === "users") {
      loadUsersData();
    } else if (section === "financials") {
      loadFinancialsData();
      loadRevenueSettings();
      loadSettlementsLedger();
    } else if (section === "commissions") {
      loadRevenueSettings();
    } else if (section === "emails") {
      loadEmailData();
    } else if (section === "support") {
      loadSupportData();
    } else if (section === "notifications") {
      loadNotifications();
      if (portalsData.length === 0) {
        api.get("/super-admin/theaters/portals").then(res => setPortalsData(res.data)).catch(err => console.error(err));
      }
    }
  }, [section, loadSupportData, loadEmailData, loadNotifications, loadRevenueSettings, loadFinancialsData, loadSettlementsLedger, portalsData.length]);

  return (
    <div className="super-admin-page">
      <aside className="super-admin-sidebar">
        <nav aria-label="Super admin navigation">
          <a href="#" className={section === "overview" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("overview"); }}>
            <BsHouseDoor /><span>Overview</span>
          </a>
          <a href="#" className={section === "portals" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("portals"); }}>
            <BsBuilding /><span>Theater Portals</span>
          </a>
          <a href="#" className={section === "users" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("users"); }}>
            <BsPeople /><span>Portal Users</span>
          </a>
          <a href="#" className={section === "financials" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("financials"); }}>
            <BsWallet2 /><span>Financials</span>
          </a>
          <a href="#" className={section === "commissions" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("commissions"); }}>
            <BsCashCoin /><span>Commissions</span>
          </a>
          <a href="#" className={section === "emails" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("emails"); }}>
            <BsEnvelope /><span>Email Delivery</span>
          </a>
          <a href="#" className={section === "support" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("support"); }}>
            <BsChatDots /><span>Support Requests</span>
          </a>
          <a href="#" className={section === "notifications" ? "active" : ""} onClick={(e) => { e.preventDefault(); setSection("notifications"); }}>
            <BsBell /><span>Notifications</span>
          </a>
        </nav>
      </aside>
      
      <main className="super-admin-main">
        {section === "overview" && (
          <div className="sa-page-heading">
            <h1>Theater Platform</h1>
            <p>Manage cinema partners, movie listings, and theater box office.</p>
          </div>
        )}

        {section === "support" && (
          <div className="sa-page-heading">
            <h1>Support & Helpdesk</h1>
            <p>Operational problem solving for Cinema Partners and Public Moviegoers.</p>
          </div>
        )}

        {section === "notifications" && (
          <div className="sa-page-heading">
            <h1>Broadcast & Notifications</h1>
            <p>Dispatch network-wide notices, maintenance alerts, and role-specific operational directives across theater partners.</p>
          </div>
        )}

        <div className="sa-page-content" style={{ marginTop: '20px' }}>
          {section === "overview" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Top 4 Metrics Cards */}
              <div className="sa-page-cards four">
                <Metric 
                  icon={<BsBuilding />} 
                  label="Active Theaters" 
                  value={dashboardData?.activeTheaters || 0}
                  onClick={() => setSection("portals")}
                />
                <Metric 
                  icon={<BsCashCoin />} 
                  label="Total Revenue (Fees)" 
                  value={`₹${Number(dashboardData?.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  onClick={() => setSection("financials")}
                />
                <Metric 
                  icon={<BsTicketPerforated />} 
                  label="Total Tickets Sold" 
                  value={Number(dashboardData?.totalTicketsSold || 0).toLocaleString("en-IN")}
                />
                <Metric 
                  icon={<BsFilm />} 
                  label="Total Movies Listed" 
                  value={dashboardData?.totalMoviesListed || 0}
                />
              </div>

              {/* Lower Section: Chart & Platform Health */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                
                {/* Monthly Revenue Chart */}
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>Monthly Revenue Flow</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Day-by-day fee collection for the current month.</p>
                    </div>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>September 2026</div>
                  </div>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData?.revenueChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => value >= 1000 ? `₹${(value/1000).toFixed(1)}k` : `₹${value}`} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                          labelStyle={{ color: '#64748b', fontWeight: '600', marginBottom: '5px' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Platform Health / Progress */}
                <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <small style={{ color: '#818cf8', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PROGRESS & ACTIVITY</small>
                    <h3 style={{ margin: '5px 0 5px 0', fontSize: '1.5rem', fontWeight: '700' }}>Platform health</h3>
                    <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem' }}>{dashboardData?.activeTheaters || 0} of {dashboardData?.totalTheaters || 0} theaters are active and operating.</p>
                    
                    <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '30px' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
                      
                      {/* Radial Progress Chart */}
                      <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          {/* Background Circle */}
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="4"
                          />
                          {/* Progress Circle */}
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="4"
                            strokeDasharray={`${(dashboardData?.totalTheaters > 0 ? (dashboardData.activeTheaters / dashboardData.totalTheaters) * 100 : 0).toFixed(0)}, 100`}
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                            {(dashboardData?.totalTheaters > 0 ? (dashboardData.activeTheaters / dashboardData.totalTheaters) * 100 : 0).toFixed(0)}%
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '5px', fontWeight: '600', letterSpacing: '0.05em' }}>ACTIVE</span>
                        </div>
                      </div>

                      {/* Stacked Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%' }}>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '15px 20px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#818cf8', borderRadius: '4px 0 0 4px' }}></div>
                          <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.02em', marginBottom: '5px' }}>MOVIES LISTED</small>
                          <strong style={{ display: 'block', fontSize: '1.75rem', fontWeight: '800', color: '#fff', lineHeight: '1', marginBottom: '5px' }}>{dashboardData?.totalMoviesListed || 0}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Across active theaters</span>
                        </div>

                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '15px 20px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#818cf8', borderRadius: '4px 0 0 4px' }}></div>
                          <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.02em', marginBottom: '5px' }}>TICKETS SOLD</small>
                          <strong style={{ display: 'block', fontSize: '1.75rem', fontWeight: '800', color: '#fff', lineHeight: '1', marginBottom: '5px' }}>{dashboardData?.totalTicketsSold?.toLocaleString() || 0}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Total bookings done</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {section === "commissions" && (
            <div className="sa-commissions-module">
              {revenueToast && (
                <div style={{
                  marginBottom: '20px', padding: '14px 20px', backgroundColor: '#ecfdf5',
                  border: '1px solid #10b981', borderRadius: '10px', color: '#065f46',
                  fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.15)'
                }}>
                  <BsCheckCircle style={{ fontSize: '18px', color: '#10b981' }} />
                  <span>{revenueToast}</span>
                </div>
              )}

              <div className="sa-page-heading" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Platform Revenue Strategy</h2>
                  <p style={{ color: '#64748b' }}>
                    Active Strategy: <strong>{revenueSettings.activeStrategy || (revenueSettings.commissionLocked ? "Acquisition Mode (Zero Commission for Theaters, 10% Convenience Fee for Users)" : "Active Monetization Mode")}</strong>
                  </p>
                </div>
                <div>
                  {revenueSettings.commissionLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        const currentPct = unlockForm.commissionPercentage || 10;
                        setUnlockForm(prev => ({
                          ...prev,
                          commissionPercentage: currentPct,
                          noteTitle: `Notice: Platform Commission Policy Activated (${currentPct}%)`,
                          noteMessage: `Dear Cinema Partners,\n\nPlease be advised that our introductory 0% commission acquisition period has concluded. Effective immediately, a platform commission rate of ${currentPct}% will be applied to movie ticket sales processed through our platform.\n\nAll ticket settlements, automated ledger records, and payout reports will reflect this updated revenue share. If you have any operational queries, please contact partner support.`
                        }));
                        setShowUnlockModal(true);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                        backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px',
                        fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
                        fontSize: '0.9rem', transition: 'all 0.2s ease'
                      }}
                    >
                      <BsUnlockFill style={{ fontSize: '16px' }} />
                      <span>Unlock Commission Feature</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLockModal(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                        backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '10px',
                        fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                      }}
                    >
                      <BsLockFill style={{ fontSize: '16px' }} />
                      <span>Lock to Acquisition Mode (0%)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Commissions Overview KPI Cards */}
              <div className="sa-page-cards three">
                <Metric 
                  icon={<BsCashCoin />} 
                  label="Platform Fee Cut" 
                  value={`${revenueSettings.convenienceFeePercentage ?? 10}%`} 
                  subtitle="Per ticket user convenience fee"
                />
                <Metric 
                  icon={<BsBuilding />} 
                  label="Theater Commission" 
                  value={revenueSettings.commissionLocked ? "0%" : `${revenueSettings.commissionPercentage ?? 0}%`} 
                  subtitle={revenueSettings.commissionLocked ? "Zero commission for partner acquisition" : "Active platform commission cut"}
                />
                <Metric 
                  icon={<BsWallet2 />} 
                  label="Partner Retention" 
                  value={revenueSettings.commissionLocked ? "100%" : `${Math.max(0, 100 - (revenueSettings.commissionPercentage ?? 0))}%`} 
                  subtitle={revenueSettings.commissionLocked ? "Theaters keep full base ticket price" : `Theaters retain ${Math.max(0, 100 - (revenueSettings.commissionPercentage ?? 0))}% of ticket base`}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* 1. Convenience Fee Card */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #10b981', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <BsTicketPerforated style={{ fontSize: '20px', color: '#10b981' }} />
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: '#047857' }}>User Convenience Fee</h3>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                    This is the extra fee added to the user's cart at checkout. You keep 100% of this fee as pure profit.
                  </p>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Global Fee Percentage (%)</label>
                  <form onSubmit={handleSaveConvenienceFee}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.5"
                        value={convenienceFeeInput} 
                        onChange={(e) => setConvenienceFeeInput(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100px', backgroundColor: '#f8fafc' }} 
                      />
                      <button 
                        type="submit" 
                        disabled={savingRevenue}
                        className="btn btn-primary" 
                        style={{ backgroundColor: '#10b981', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer' }}
                      >
                        {savingRevenue ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                  <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', fontSize: '0.85rem', color: '#065f46' }}>
                    <strong>Example:</strong> Ticket is ₹200. We charge {convenienceFeeInput}%. User pays ₹{(200 * (1 + (convenienceFeeInput / 100))).toFixed(0)}. <strong>You keep ₹{(200 * (convenienceFeeInput / 100)).toFixed(0)}.</strong>
                  </div>
                </div>

                {/* 2. Theater Commission Card */}
                {revenueSettings.commissionLocked ? (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BsBuilding style={{ fontSize: '20px', color: '#94a3b8' }} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: '#64748b' }}>Theater Commission Cut</h3>
                      </div>
                      <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BsLockFill /> LOCKED (0%)
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                      The platform cut taken directly from the theater's ticket sales. Currently locked in Acquisition Mode to maximize partner onboarding.
                    </p>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#94a3b8' }}>Global Commission Rate (%)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="number" value="0" disabled style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100px', backgroundColor: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} />
                      <button 
                        type="button" 
                        onClick={() => {
                          const currentPct = unlockForm.commissionPercentage || 10;
                          setUnlockForm(prev => ({
                            ...prev,
                            commissionPercentage: currentPct,
                            noteTitle: `Notice: Platform Commission Policy Activated (${currentPct}%)`,
                            noteMessage: `Dear Cinema Partners,\n\nPlease be advised that our introductory 0% commission acquisition period has concluded. Effective immediately, a platform commission rate of ${currentPct}% will be applied to movie ticket sales processed through our platform.\n\nAll ticket settlements, automated ledger records, and payout reports will reflect this updated revenue share. If you have any operational queries, please contact partner support.`
                          }));
                          setShowUnlockModal(true);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                          backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px',
                          fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        <BsUnlockFill /> Unlock & Broadcast Policy
                      </button>
                    </div>
                    <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                      <strong>Status:</strong> Disabled for Partner Acquisition. Theaters keep 100% of base ticket price. Click <em>Unlock & Broadcast Policy</em> to specify a commission cut and send formal notes to cinema partners.
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fff', border: '1px solid #3b82f6', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BsBuilding style={{ fontSize: '20px', color: '#2563eb' }} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: '#1e40af' }}>Theater Commission Cut (Active)</h3>
                      </div>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BsUnlockFill /> UNLOCKED ({revenueSettings.commissionPercentage}%)
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                      The platform cut taken directly from the theater's ticket sales. Pending payouts and settlements deduct this rate.
                    </p>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Global Commission Rate (%)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.5" 
                        value={commissionRateInput} 
                        onChange={(e) => setCommissionRateInput(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100px', backgroundColor: '#f8fafc' }} 
                      />
                      <button 
                        type="button" 
                        onClick={handleSaveCommissionRate}
                        disabled={savingRevenue}
                        className="btn btn-primary" 
                        style={{ backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}
                      >
                        {savingRevenue ? "Saving..." : "Save Rate"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowLockModal(true)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                          backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        <BsLockFill /> Lock to 0%
                      </button>
                    </div>
                    <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '0.85rem', color: '#1e40af' }}>
                      <strong>Status:</strong> Active Monetization Mode. Platform takes <strong>{revenueSettings.commissionPercentage}%</strong> from ticket sales.
                      {revenueSettings.lastBroadcastSubject && (
                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#475569' }}>
                          Latest Policy Broadcast: <em>"{revenueSettings.lastBroadcastSubject}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Unlock Commission Modal */}
              {showUnlockModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                  }}>
                    {/* Modal Header */}
                    <div style={{
                      padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#eff6ff',
                          color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                        }}>
                          <BsUnlockFill />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
                            Unlock Theater Commission
                          </h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Configure platform cut and broadcast policy notes to partners
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowUnlockModal(false)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: '6px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <form onSubmit={handleUnlockCommission} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Commission Rate Input */}
                      <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '0.9rem' }}>
                          Target Global Commission Rate (%) *
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="number"
                            required
                            min="0.1"
                            max="100"
                            step="0.5"
                            value={unlockForm.commissionPercentage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUnlockForm(prev => ({
                                ...prev,
                                commissionPercentage: val,
                                noteTitle: `Notice: Platform Commission Policy Activated (${val}%)`,
                                noteMessage: `Dear Cinema Partners,\n\nPlease be advised that our introductory 0% commission acquisition period has concluded. Effective immediately, a platform commission rate of ${val}% will be applied to movie ticket sales processed through our platform.\n\nAll ticket settlements, automated ledger records, and payout reports will reflect this updated revenue share. If you have any operational queries, please contact partner support.`
                              }));
                            }}
                            style={{
                              padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                              width: '120px', fontSize: '1rem', fontWeight: '600', backgroundColor: '#f8fafc'
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Theaters will retain <strong>{Math.max(0, 100 - Number(unlockForm.commissionPercentage || 0))}%</strong> of base ticket revenue.
                          </span>
                        </div>
                      </div>

                      {/* Note Subject */}
                      <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '0.9rem' }}>
                          Announcement Subject / Title *
                        </label>
                        <input 
                          type="text"
                          required
                          value={unlockForm.noteTitle}
                          onChange={(e) => setUnlockForm(prev => ({ ...prev, noteTitle: e.target.value }))}
                          placeholder="e.g., Notice: Platform Commission Policy Activated"
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                            border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: '#fff'
                          }}
                        />
                      </div>

                      {/* Note Message */}
                      <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1e293b', fontSize: '0.9rem' }}>
                          Policy Note / Message to Theaters *
                        </label>
                        <textarea 
                          required
                          rows={6}
                          value={unlockForm.noteMessage}
                          onChange={(e) => setUnlockForm(prev => ({ ...prev, noteMessage: e.target.value }))}
                          placeholder="Explain the policy update, timeline, and impact on payouts..."
                          style={{
                            width: '100%', padding: '12px 14px', borderRadius: '8px',
                            border: '1px solid #cbd5e1', fontSize: '0.9rem', lineHeight: '1.5',
                            resize: 'vertical', fontFamily: 'inherit'
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          This note will be transmitted directly to cinema owners and managers across the platform.
                        </span>
                      </div>

                      {/* Dispatch Channels */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
                          Notification Delivery Channels:
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#1e293b', cursor: 'pointer' }}>
                            <input 
                              type="checkbox"
                              checked={unlockForm.sendInApp}
                              onChange={(e) => setUnlockForm(prev => ({ ...prev, sendInApp: e.target.checked }))}
                            />
                            <span>In-App System Notification</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#1e293b', cursor: 'pointer' }}>
                            <input 
                              type="checkbox"
                              checked={unlockForm.sendEmail}
                              onChange={(e) => setUnlockForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                            />
                            <span>Email Broadcast to Theater Owners</span>
                          </label>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setShowUnlockModal(false)}
                          style={{
                            padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={unlocking}
                          style={{
                            padding: '10px 22px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#2563eb', color: '#fff', fontWeight: '600',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', opacity: unlocking ? 0.7 : 1
                          }}
                        >
                          <BsSend />
                          <span>{unlocking ? "Broadcasting & Unlocking..." : "Broadcast Notes & Unlock"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Lock Commission Modal */}
              {showLockModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '540px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef2f2'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fee2e2',
                          color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                        }}>
                          <BsLockFill />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991b1b', fontWeight: '700' }}>
                            Lock to Acquisition Mode
                          </h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                            Revert theater commission to 0% (100% partner retention)
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowLockModal(false)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <form onSubmit={handleLockCommission} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
                        Are you sure you want to lock the Theater Commission feature? This will immediately set the platform commission rate to <strong>0%</strong>, allowing theaters to keep 100% of base ticket revenue.
                      </p>

                      <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
                          Optional Reversion Notice:
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#1e293b', cursor: 'pointer', marginBottom: '8px' }}>
                          <input 
                            type="checkbox"
                            checked={lockForm.sendInApp}
                            onChange={(e) => setLockForm(prev => ({ ...prev, sendInApp: e.target.checked }))}
                          />
                          <span>Send In-App Notification announcing 0% promotional cut</span>
                        </label>
                        {lockForm.sendInApp && (
                          <input 
                            type="text"
                            value={lockForm.noteTitle}
                            onChange={(e) => setLockForm(prev => ({ ...prev, noteTitle: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setShowLockModal(false)}
                          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={locking}
                          style={{
                            padding: '10px 22px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#dc2626', color: '#fff', fontWeight: '600', cursor: 'pointer',
                            opacity: locking ? 0.7 : 1
                          }}
                        >
                          {locking ? "Locking..." : "Confirm Lock (0%)"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {section === "portals" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div className="sa-page-heading" style={{ marginBottom: '5px' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Theater Management</h2>
                <p style={{ color: '#64748b' }}>Overview, search, and lifecycle control (delete duplicate or closed portals) for all registered cinema partners.</p>
              </div>

              {/* Toast Feedback */}
              {portalActionToast && (
                <div style={{
                  padding: '12px 20px', borderRadius: '10px', backgroundColor: '#ecfdf5',
                  border: '1px solid #6ee7b7', color: '#065f46', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600'
                }}>
                  <BsCheckCircle style={{ color: '#059669', fontSize: '1.2rem', flexShrink: 0 }} />
                  <span>{portalActionToast}</span>
                </div>
              )}

              {/* 3 Metric Cards */}
              <div className="sa-page-cards three">
                <div 
                  onClick={() => setPortalsSubTab("active")}
                  style={{ cursor: 'pointer' }}
                  title="View active live portals"
                >
                  <Metric 
                    icon={<BsBuilding />} 
                    label="Active Theaters" 
                    value={activePortalsList.length} 
                    subtitle="Live cinema operations"
                  />
                </div>
                <div 
                  onClick={() => setPortalsSubTab("active")}
                  style={{ cursor: 'pointer' }}
                  title="View active live portals"
                >
                  <Metric 
                    icon={<BsActivity />} 
                    label="Live Portals" 
                    value={activePortalsList.length} 
                    subtitle="Currently operational"
                  />
                </div>
                <div 
                  onClick={() => setPortalsSubTab("deleted")}
                  style={{ cursor: 'pointer' }}
                  title="View purged / deleted portal archive"
                >
                  <Metric 
                    icon={<BsBox />} 
                    label="Inactive / Deleted" 
                    value={deletedPortalsList.length} 
                    subtitle="Click to view purged archive"
                  />
                </div>
              </div>

              {/* Theaters Data Table Container */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                
                {/* Slide / Subtab Navigation Bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '0 16px' }}>
                  <button
                    type="button"
                    onClick={() => { setPortalsSubTab("active"); setPortalSearch(""); }}
                    style={{
                      padding: '14px 20px',
                      border: 'none',
                      borderBottom: portalsSubTab === "active" ? '3px solid #2563eb' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: portalsSubTab === "active" ? '#1d4ed8' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <BsBuilding size={15} /> Active Portals
                    <span style={{
                      backgroundColor: portalsSubTab === "active" ? '#dbeafe' : '#e2e8f0',
                      color: portalsSubTab === "active" ? '#1d4ed8' : '#475569',
                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {activePortalsList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPortalsSubTab("deleted"); setPortalSearch(""); }}
                    style={{
                      padding: '14px 20px',
                      border: 'none',
                      borderBottom: portalsSubTab === "deleted" ? '3px solid #dc2626' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      color: portalsSubTab === "deleted" ? '#b91c1c' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <BsTrash size={15} /> Purged & Deleted Portals
                    <span style={{
                      backgroundColor: portalsSubTab === "deleted" ? '#fee2e2' : '#e2e8f0',
                      color: portalsSubTab === "deleted" ? '#b91c1c' : '#475569',
                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {deletedPortalsList.length}
                    </span>
                  </button>
                </div>

                {/* Subtab Header with Search & Refresh */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                      {portalsSubTab === "active" ? "Active Theater Directory" : "Purged & Inactive Portals Archive"}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      {portalsSubTab === "active" 
                        ? `Showing ${filteredPortals.length} of ${activePortalsList.length} live theater portals`
                        : `Showing ${filteredPortals.length} permanently purged or deactivated portals`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '260px' }}>
                      <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        placeholder={portalsSubTab === "active" ? "Search active theater, owner, ID..." : "Search purged portal or owner..."}
                        value={portalSearch}
                        onChange={(e) => setPortalSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 14px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }} 
                      />
                      {portalSearch && (
                        <button
                          type="button"
                          onClick={() => setPortalSearch("")}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <BsXLg size={11} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={loadPortalsData}
                      title="Refresh theater portals list"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <BsArrowClockwise size={14} />
                    </button>
                  </div>
                </div>

                {/* Table Slides */}
                <div style={{ overflowX: 'auto' }}>
                  {portalsSubTab === "active" ? (
                    /* Slide 1: Active Portals Table */
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater Name & ID</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screens</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employees</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets Sold</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPortals.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <BsBuilding size={32} style={{ color: '#cbd5e1' }} />
                                <span style={{ fontWeight: '600', color: '#334155' }}>No active theater portals found</span>
                                <span style={{ fontSize: '0.82rem' }}>All active live portals will be listed here.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredPortals.map((theater) => (
                            <tr key={theater.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{theater.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>
                                    Portal #{theater.id}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.owner}</td>
                              <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.screens}</td>
                              <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.employees}</td>
                              <td style={{ padding: '16px 24px', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>
                                {theater.tickets?.toLocaleString() || 0}
                              </td>
                              <td style={{ padding: '16px 24px', fontWeight: '700', color: '#10b981', fontSize: '0.95rem' }}>
                                ₹{theater.revenue?.toLocaleString() || 0}
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ 
                                  display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: '#dcfce7', color: '#15803d'
                                }}>
                                  Active
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeletePortalModal(theater)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #fecaca',
                                    backgroundColor: '#fff',
                                    color: '#dc2626',
                                    fontWeight: '600',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#dc2626'; }}
                                  title="Delete or Deactivate Theater Portal"
                                >
                                  <BsTrash size={13} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : (
                    /* Slide 2: Purged & Deleted Portals Archive Table */
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purged Portal Name & ID</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Email</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screens</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Past Tickets</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purge Status</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Audit State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPortals.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <BsTrash size={32} style={{ color: '#cbd5e1' }} />
                                <span style={{ fontWeight: '600', color: '#334155' }}>No purged or inactive portals recorded</span>
                                <span style={{ fontSize: '0.82rem' }}>When a portal is deleted, it will be safely archived here.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredPortals.map((theater) => (
                            <tr key={theater.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfd' }}>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '0.95rem' }}>{theater.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#64748b' }}>
                                    Original Portal #{theater.id}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.9rem' }}>{theater.owner}</td>
                              <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.9rem' }}>{theater.screens} Screens</td>
                              <td style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>
                                {theater.tickets || 0} Tickets
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ 
                                  display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1'
                                }}>
                                  Purged from Database
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <span style={{ 
                                  fontSize: '0.8rem', color: '#16a34a', fontWeight: '600',
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bbf7d0'
                                }}>
                                  <BsCheckCircle size={12} /> Erased from Live Platform
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Delete Theater Portal Modal */}
              {showDeletePortalModal && (
                <div 
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setShowDeletePortalModal(null);
                  }}
                  style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999,
                    padding: '24px 16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', maxWidth: '580px', width: '100%',
                    maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    margin: 'auto', position: 'relative'
                  }}>
                    {/* Fixed Header */}
                    <div style={{
                      padding: '16px 24px', borderBottom: '1px solid #fee2e2', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2',
                      flexShrink: 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fee2e2',
                          color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                        }}>
                          <BsTrash />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991b1b', fontWeight: '700' }}>
                            Delete Theater Portal
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                            SuperAdmin Authorization Action
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowDeletePortalModal(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', padding: '4px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    {/* Scrollable Form Body with Fixed Footer */}
                    <form
                      onSubmit={handleConfirmDeletePortal}
                      style={{
                        display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column',
                        gap: '16px', flex: '1 1 auto', maxHeight: 'calc(100vh - 190px)',
                        scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f8fafc'
                      }}>
                        {/* Target Portal Summary Card */}
                        <div style={{
                          padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Target Theater Portal
                              </span>
                              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>
                                {showDeletePortalModal.name}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                                Owner: <strong>{showDeletePortalModal.owner}</strong> • Portal ID: <code style={{ color: '#2563eb' }}>#{showDeletePortalModal.id}</code>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                                backgroundColor: showDeletePortalModal.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                color: showDeletePortalModal.status === 'Active' ? '#16a34a' : '#dc2626'
                              }}>
                                {showDeletePortalModal.status}
                              </span>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                                {showDeletePortalModal.screens} Screens • {showDeletePortalModal.tickets || 0} Tickets
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Advisory Notice */}
                        {Number(showDeletePortalModal.tickets || 0) === 0 ? (
                          <div style={{
                            padding: '10px 14px', borderRadius: '8px', backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', gap: '8px'
                          }}>
                            <BsCheckCircle style={{ color: '#2563eb', flexShrink: 0 }} />
                            <span>This portal has <strong>0 ticket sales</strong>. It is safe to permanently remove as a duplicate or unused record.</span>
                          </div>
                        ) : (
                          <div style={{
                            padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fffbeb',
                            border: '1px solid #fef3c7', color: '#92400e', fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', gap: '8px'
                          }}>
                            <BsExclamationTriangle style={{ color: '#d97706', flexShrink: 0 }} />
                            <span>This theater has recorded <strong>{showDeletePortalModal.tickets} ticket sales</strong>. Choose "Deactivate & Close" to preserve financial history or "Permanent Removal" to purge all records.</span>
                          </div>
                        )}

                        {/* Select Reason for Deletion */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                            Reason for Deleting this Portal *
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {[
                              { key: "DUPLICATE", icon: "📑", title: "Duplicate Portal", desc: "Accidentally registered multiple times" },
                              { key: "INACTIVE", icon: "⏸️", title: "Inactive / Unused", desc: "Never went live or abandoned test portal" },
                              { key: "CLOSED", icon: "🔒", title: "Closed Theater", desc: "Permanently ceased business operations" },
                              { key: "OTHER", icon: "⚙️", title: "Other Reason", desc: "SuperAdmin administrative cleanup" },
                            ].map((item) => (
                              <div
                                key={item.key}
                                onClick={() => setDeleteReasonCategory(item.key)}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: deleteReasonCategory === item.key ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                  backgroundColor: deleteReasonCategory === item.key ? '#fef2f2' : '#fff',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem', color: deleteReasonCategory === item.key ? '#991b1b' : '#1e293b' }}>
                                  <span>{item.icon}</span> {item.title}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                                  {item.desc}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Mode: Permanent vs Soft Deactivate */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                            Action Type *
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                              borderRadius: '8px', border: deletePermanent ? '2px solid #dc2626' : '1px solid #e2e8f0',
                              backgroundColor: deletePermanent ? '#fef2f2' : '#f8fafc', cursor: 'pointer'
                            }}>
                              <input
                                type="radio"
                                name="deleteMode"
                                checked={deletePermanent}
                                onChange={() => setDeletePermanent(true)}
                                style={{ marginTop: '3px' }}
                              />
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: deletePermanent ? '#991b1b' : '#1e293b' }}>
                                  🗑️ Permanent Removal (Purge from Platform)
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Completely erases this theater portal, its screens, and staff assignments from the directory.
                                </div>
                              </div>
                            </label>

                            <label style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                              borderRadius: '8px', border: !deletePermanent ? '2px solid #ea580c' : '1px solid #e2e8f0',
                              backgroundColor: !deletePermanent ? '#fff7ed' : '#f8fafc', cursor: 'pointer'
                            }}>
                              <input
                                type="radio"
                                name="deleteMode"
                                checked={!deletePermanent}
                                onChange={() => setDeletePermanent(false)}
                                style={{ marginTop: '3px' }}
                              />
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: !deletePermanent ? '#9a3412' : '#1e293b' }}>
                                  ⏸️ Soft Deactivate (Mark as Inactive / Closed)
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Disables the cinema portal and showtimes while preserving historical ledger & revenue records.
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Additional Remarks */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                            Additional Notes / Audit Reference (Optional)
                          </label>
                          <input
                            type="text"
                            value={deleteReasonText}
                            onChange={(e) => setDeleteReasonText(e.target.value)}
                            placeholder="e.g. Duplicate entry of Naveen Cinemas with 0 tickets"
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: '8px',
                              border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      {/* Fixed Footer with Always Visible Buttons */}
                      <div style={{
                        padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                        display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0
                      }}>
                        <button
                          type="button"
                          onClick={() => setShowDeletePortalModal(null)}
                          style={{
                            padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deletingPortal}
                          style={{
                            padding: '9px 22px', borderRadius: '8px', border: 'none',
                            backgroundColor: deletePermanent ? '#dc2626' : '#ea580c', color: '#fff',
                            fontWeight: '700', cursor: deletingPortal ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.25)'
                          }}
                        >
                          {deletingPortal ? "Processing..." : (deletePermanent ? "Permanently Delete Portal" : "Deactivate & Close Portal")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === "users" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="sa-page-heading" style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Portal Users Management</h2>
                <p style={{ color: '#64748b' }}>Manage the employees and managers who have access to the theater portals.</p>
              </div>

              {/* Metric Cards */}
              <div className="sa-page-cards three">
                <Metric 
                  icon={<BsPeople />} 
                  label="Total Portal Users" 
                  value={usersData.length} 
                />
                <Metric 
                  icon={<BsActivity />} 
                  label="Active Staff" 
                  value={usersData.filter(u => u.status === 'Active').length} 
                />
                <Metric 
                  icon={<BsBox />} 
                  label="Inactive / Suspended" 
                  value={usersData.filter(u => u.status !== 'Active').length} 
                />
              </div>

              {/* Portal Users Data Table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Portal Users Directory</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Showing {filteredPortalUsers.length} of {usersData.length} theater managers & employees with portal-specific employee IDs
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', width: '270px' }}>
                      <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        placeholder="Search employee, ID, portal..." 
                        value={portalUserSearch}
                        onChange={(e) => setPortalUserSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 14px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }} 
                      />
                      {portalUserSearch && (
                        <button
                          type="button"
                          onClick={() => setPortalUserSearch("")}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <BsXLg size={11} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={loadUsersData}
                      title="Refresh employee directory"
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <BsArrowClockwise size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emp ID</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Name</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal ID</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater Name</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPortalUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <BsPeople size={32} style={{ color: '#cbd5e1' }} />
                              <span style={{ fontWeight: '600', color: '#334155' }}>No portal employees found</span>
                              <span style={{ fontSize: '0.82rem' }}>Staff and managers will be listed once invited or added by theater portals.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPortalUsers.map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                            <td style={{ padding: '16px 24px', fontWeight: '800', color: '#2563eb', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                              <span style={{ backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                {user.empId}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{user.name}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{user.email}</td>
                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: '500', fontFamily: 'monospace' }}>{user.portalId}</td>
                            <td style={{ padding: '16px 24px', color: '#334155', fontWeight: '500', fontSize: '0.9rem' }}>{user.theater}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ 
                                display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: user.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                color: user.status === 'Active' ? '#16a34a' : '#dc2626'
                              }}>
                                {user.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button
                                type="button"
                                disabled={removingUserId === user.id}
                                onClick={() => handleRemoveEmployee(user)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #fecaca',
                                  backgroundColor: '#fff',
                                  color: '#dc2626',
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  cursor: removingUserId === user.id ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                  transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#dc2626'; }}
                                title={`Remove ${user.name} from portal`}
                              >
                                <BsTrash size={13} /> {removingUserId === user.id ? "Removing..." : "Remove"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === "financials" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 1. Page Header */}
              <div className="sa-page-heading" style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Platform Financials & Theater Settlements</h2>
                  <p style={{ color: '#64748b' }}>Theater-wise box office collections, contract period revenue ledger, verified partner bank accounts, and RBI UTR settlements.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={loadFinancialsData}
                    className="btn" 
                    title="Refresh Financial Data"
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: '#fff', 
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <BsArrowClockwise className={loadingFinancials ? "spin" : ""} size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={handleExportFinancialsCsv}
                    className="btn" 
                    style={{ 
                      padding: '8px 18px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: '#fff', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      cursor: 'pointer'
                    }}
                  >
                    <BsDownload size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* 2. Global Filter Toolbar: Theater Selector + Date / Contract Period Filter */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}>
                {/* Left: Theater Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff',
                    color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <BsBuilding size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Theater Partner
                    </div>
                    <select
                      value={selectedTheaterFilter}
                      onChange={(e) => setSelectedTheaterFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        outline: 'none',
                        marginTop: '2px'
                      }}
                    >
                      <option value="ALL">All Theater Partners ({payoutsData.length} Portals)</option>
                      {payoutsData.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.theater} (Portal #{p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Contract Period / Day Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BsCalendarDate size={15} style={{ color: '#64748b' }} />
                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Period:
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
                    {[
                      { key: "ALL", label: "All Time" },
                      { key: "TODAY", label: "Today" },
                      { key: "YESTERDAY", label: "Yesterday" },
                      { key: "WEEK", label: "This Week" },
                      { key: "MONTH", label: "This Month" },
                      { key: "CUSTOM", label: "Custom Contract Period" },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => setContractPeriodFilter(btn.key)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: contractPeriodFilter === btn.key ? '#fff' : 'transparent',
                          color: contractPeriodFilter === btn.key ? '#2563eb' : '#64748b',
                          fontWeight: contractPeriodFilter === btn.key ? '700' : '600',
                          fontSize: '0.8rem',
                          boxShadow: contractPeriodFilter === btn.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Contract Date Range Inputs */}
                  {contractPeriodFilter === "CUSTOM" && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                        title="Contract Start Date"
                      />
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                        title="Contract End Date"
                      />
                    </div>
                  )}

                  {(selectedTheaterFilter !== "ALL" || contractPeriodFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheaterFilter("ALL");
                        setContractPeriodFilter("ALL");
                        setCustomStartDate("");
                        setCustomEndDate("");
                      }}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#dc2626',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Dynamic 4 Bento Metric Cards (Reflects Active Theater & Period) */}
              <div className="sa-page-cards four">
                <Metric 
                  icon={<BsCashCoin />} 
                  label="Gross Collections (GMV)" 
                  value={`₹${Number(
                    displayPayouts.reduce((acc, p) => acc + (p.totalGross || 0), 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle={`Box Office: ₹${displayPayouts.reduce((acc, p) => acc + (p.boxOfficeGross || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} • F&B: ₹${displayPayouts.reduce((acc, p) => acc + (p.fnbGross || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                />
                <Metric 
                  icon={<BsWallet2 />} 
                  label="Platform Profit & GST" 
                  value={`₹${Number(
                    displayPayouts.reduce((acc, p) => acc + (p.convenienceFee || 0) + (p.gstOnFee || 0), 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle={`Fee: ₹${displayPayouts.reduce((acc, p) => acc + (p.convenienceFee || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} + GST (18%): ₹${displayPayouts.reduce((acc, p) => acc + (p.gstOnFee || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                />
                <Metric 
                  icon={<BsClockHistory />} 
                  label="Net Pending Disbursals" 
                  value={`₹${Number(displayPayouts.filter(p => p.status === 'Pending').reduce((acc, p) => acc + (p.owed || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle={`${displayPayouts.filter(p => p.status === 'Pending' && !p.isHeld).length} eligible • ${displayPayouts.filter(p => p.isHeld).length} on dispute hold`}
                />
                <Metric 
                  icon={<BsShieldCheck />} 
                  label="Disbursed to Banks" 
                  value={`₹${Number(filteredSettlements.reduce((acc, s) => acc + (s.netPaid || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle={`${filteredSettlements.length} verified bank wire transfer(s)`}
                />
              </div>

              {/* 4. Sub-Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab("pending")}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: financeSubTab === "pending" ? '2px solid #2563eb' : '2px solid transparent',
                    color: financeSubTab === "pending" ? '#2563eb' : '#64748b',
                    fontWeight: financeSubTab === "pending" ? '700' : '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <BsBuilding size={15} />
                  Theater Settlement Summary
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: financeSubTab === "pending" ? '#dbeafe' : '#f1f5f9',
                    color: financeSubTab === "pending" ? '#1e40af' : '#64748b',
                    fontWeight: '700'
                  }}>
                    {displayPayouts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFinanceSubTab("daily-collections")}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: financeSubTab === "daily-collections" ? '2px solid #2563eb' : '2px solid transparent',
                    color: financeSubTab === "daily-collections" ? '#2563eb' : '#64748b',
                    fontWeight: financeSubTab === "daily-collections" ? '700' : '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <BsReceiptCutoff size={15} />
                  Daily & Show-wise Collections
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: financeSubTab === "daily-collections" ? '#f3e8ff' : '#f1f5f9',
                    color: financeSubTab === "daily-collections" ? '#7e22ce' : '#64748b',
                    fontWeight: '700'
                  }}>
                    {filteredSales.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFinanceSubTab("settled")}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: financeSubTab === "settled" ? '2px solid #2563eb' : '2px solid transparent',
                    color: financeSubTab === "settled" ? '#2563eb' : '#64748b',
                    fontWeight: financeSubTab === "settled" ? '700' : '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <BsCheckCircleFill size={14} style={{ color: financeSubTab === "settled" ? '#16a34a' : '#94a3b8' }} />
                  Settlement History (Completed)
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: financeSubTab === "settled" ? '#dcfce7' : '#f1f5f9',
                    color: financeSubTab === "settled" ? '#15803d' : '#64748b',
                    fontWeight: '700'
                  }}>
                    {filteredSettlements.length}
                  </span>
                </button>
              </div>

              {/* 5. TAB 1: Theater Settlement Summary Table */}
              {financeSubTab === "pending" && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
                          Theater Partner Settlement Ledger
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                          {displayPayouts.length} Portals
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        Period: <strong>{contractPeriodFilter === "ALL" ? "All Time Lifetime Ledger" : contractPeriodFilter}</strong> • <span style={{ color: '#16a34a', fontWeight: '600' }}>{eligibleBulkPayouts.length} Ready for Disbursal</span> • <span style={{ color: '#ea580c', fontWeight: '600' }}>{displayPayouts.filter(p => p.isHeld).length} On Dispute Hold</span>
                      </p>
                    </div>

                    {/* 1-Click Bulk Disbursal ("Disburse All Eligible") */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={handleOpenBulkSettle}
                        disabled={eligibleBulkPayouts.length === 0}
                        style={{
                          backgroundColor: eligibleBulkPayouts.length > 0 ? '#16a34a' : '#94a3b8',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          fontSize: '0.88rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: eligibleBulkPayouts.length > 0 ? 'pointer' : 'not-allowed',
                          boxShadow: eligibleBulkPayouts.length > 0 ? '0 4px 10px rgba(22, 163, 74, 0.35)' : 'none',
                          transition: 'all 0.2s'
                        }}
                        title={eligibleBulkPayouts.length > 0 ? `Disburse all ${eligibleBulkPayouts.length} eligible theaters in one click` : "No eligible pending theaters to settle (must have linked bank and not be on hold)"}
                      >
                        <BsLightningChargeFill size={15} />
                        Disburse All Eligible ({eligibleBulkPayouts.length})
                        <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800' }}>
                          ₹{eligibleBulkPayouts.reduce((acc, p) => acc + (p.owed || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater Partner & Status</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross (Box Office + F&B)</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Deductions (Fee+GST+TDS)</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Disbursable</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Bank Account</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Controls & Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayPayouts.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <BsCheckCircleFill size={32} style={{ color: '#10b981' }} />
                                <span style={{ fontWeight: '600', color: '#0f172a' }}>No Theater Records Found</span>
                                <span style={{ fontSize: '0.85rem' }}>No theater partners match the selected filter criteria.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayPayouts.map((payout) => {
                            const bank = getTheaterBankSettings(payout.id);
                            const hasBank = Boolean(bank && bank.accountNumber);
                            const isPaid = payout.status === "Paid";
                            const isHeld = payout.isHeld;

                            return (
                              <tr key={payout.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: isHeld ? '#fffdfa' : 'transparent', opacity: isPaid ? 0.65 : 1 }}>
                                {/* 1. Theater Partner & Status */}
                                <td style={{ padding: '14px 20px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.92rem' }}>{payout.theater}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                    <span>Portal #{payout.id}</span>
                                    {payout.ownerEmail && <span>• {payout.ownerEmail}</span>}
                                  </div>
                                  <div style={{ marginTop: '5px' }}>
                                    {isPaid ? (
                                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <BsCheckCircleFill size={10} /> Disbursed
                                      </span>
                                    ) : isHeld ? (
                                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={payout.holdData?.reason}>
                                        <BsPauseCircleFill size={10} /> ON HOLD: {payout.holdData?.reason || 'Dispute'}
                                      </span>
                                    ) : hasBank ? (
                                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <BsCheckCircleFill size={10} /> Ready for Payout
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        ⚠️ Bank Missing
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 2. Admitted Tickets */}
                                <td style={{ padding: '14px 20px', color: '#475569', fontSize: '0.88rem' }}>
                                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{payout.tickets?.toLocaleString() || 0}</span> seats
                                </td>

                                {/* 3. Gross Revenue (Box Office vs F&B Segregation) */}
                                <td style={{ padding: '14px 20px', fontSize: '0.84rem' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.92rem' }}>
                                    ₹{Number(payout.totalGross || (payout.owed + (payout.owed * 0.1)) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <span>🎟️ Box Office: <strong>₹{Number(payout.boxOfficeGross || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></span>
                                    <span>🍿 F&B Canteen: <strong>₹{Number(payout.fnbGross || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></span>
                                  </div>
                                </td>

                                {/* 4. Itemized Platform Deductions (Fee + GST + TDS) */}
                                <td style={{ padding: '14px 20px', fontSize: '0.82rem' }}>
                                  <div style={{ fontWeight: '700', color: '#dc2626' }}>
                                    -₹{Number(payout.totalDeductions || (payout.owed * 0.1) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <span>Fee: ₹{Number(payout.convenienceFee || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                    <span>GST (18%): ₹{Number(payout.gstOnFee || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                    <span>TDS 194-O (1%): ₹{Number(payout.tdsAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                  </div>
                                </td>

                                {/* 5. Net Disbursable Amount */}
                                <td style={{ padding: '14px 20px' }}>
                                  <span style={{ fontWeight: '800', color: isPaid ? '#64748b' : (isHeld ? '#ea580c' : '#16a34a'), fontSize: '1.08rem' }}>
                                    ₹{Number(payout.owed || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Net to Partner Bank</div>
                                </td>

                                {/* 6. Verified Bank Account */}
                                <td style={{ padding: '14px 20px' }}>
                                  {hasBank ? (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>
                                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                          <span>{bank.bankName || "Bank"}</span>
                                          <span style={{ fontFamily: 'monospace', color: '#475569' }}>•••• {bank.accountNumber.slice(-4)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                                          IFSC: <span style={{ fontFamily: 'monospace' }}>{bank.ifscCode}</span> • {bank.accountHolderName || payout.theater}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenBankEdit(payout)}
                                        style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: '2px' }}
                                        title="Edit Bank Account Details"
                                      >
                                        <BsPencilSquare size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        backgroundColor: '#fef3c7',
                                        color: '#b45309',
                                        padding: '4px 9px',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: '600'
                                      }}>
                                        ⚠️ Missing Account
                                      </span>
                                      {bankReminderHistory[String(payout.id)] && (
                                        <span style={{
                                          fontSize: '0.7rem',
                                          color: '#1d4ed8',
                                          backgroundColor: '#eff6ff',
                                          border: '1px solid #bfdbfe',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontWeight: '600',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}>
                                          <BsBell size={10} /> Notice Sent
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* 7. Controls & Actions */}
                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedTheaterFilter(String(payout.id));
                                        setFinanceSubTab("daily-collections");
                                      }}
                                      style={{
                                        backgroundColor: '#f8fafc',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                      }}
                                      title="View day-by-day and show-by-show ticket collection"
                                    >
                                      Collections
                                    </button>

                                    {/* Hold / Release Action */}
                                    {isHeld ? (
                                      <button
                                        type="button"
                                        onClick={() => handleReleaseHold(payout)}
                                        style={{
                                          backgroundColor: '#f0fdf4',
                                          color: '#16a34a',
                                          border: '1px solid #86efac',
                                          padding: '6px 10px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Release hold and make eligible for disbursement"
                                      >
                                        <BsPlayCircleFill size={11} /> Release
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenHoldModal(payout)}
                                        style={{
                                          backgroundColor: '#fff',
                                          color: '#dc2626',
                                          border: '1px solid #fca5a5',
                                          padding: '6px 10px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: '600',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Place payout on dispute hold"
                                      >
                                        <BsPauseCircleFill size={11} /> Hold
                                      </button>
                                    )}

                                    {/* Settle Action */}
                                    {!isPaid ? (
                                      isHeld ? (
                                        <button
                                          type="button"
                                          disabled
                                          style={{
                                            backgroundColor: '#f1f5f9',
                                            color: '#94a3b8',
                                            border: '1px solid #cbd5e1',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            cursor: 'not-allowed',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          title={`Payout is currently on hold: ${payout.holdData?.reason || 'Dispute'}`}
                                        >
                                          <BsLockFill size={11} /> Held
                                        </button>
                                      ) : !hasBank ? (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenBankEdit(payout)}
                                            style={{
                                              backgroundColor: '#fef3c7',
                                              color: '#b45309',
                                              border: '1px solid #fde68a',
                                              padding: '6px 10px',
                                              borderRadius: '6px',
                                              fontSize: '0.75rem',
                                              fontWeight: '700',
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                            title="Admin Link Bank"
                                          >
                                            <BsBank size={11} /> Link Bank
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenBankReminderModal(payout)}
                                            style={{
                                              backgroundColor: bankReminderHistory[String(payout.id)] ? '#eff6ff' : '#fffbeb',
                                              color: bankReminderHistory[String(payout.id)] ? '#1e40af' : '#b45309',
                                              border: `1px solid ${bankReminderHistory[String(payout.id)] ? '#bfdbfe' : '#fde68a'}`,
                                              padding: '6px 10px',
                                              borderRadius: '6px',
                                              fontSize: '0.75rem',
                                              fontWeight: '700',
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                            title="Send In-App Notification to Theater"
                                          >
                                            <BsBell size={11} /> {bankReminderHistory[String(payout.id)] ? "Notified" : "Notify"}
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          type="button"
                                          onClick={() => handleOpenSettleModal(payout)}
                                          style={{ 
                                            backgroundColor: '#16a34a', 
                                            color: '#fff', 
                                            border: 'none', 
                                            padding: '6px 14px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.78rem', 
                                            fontWeight: '700', 
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                                          }}
                                        >
                                          <BsLightningChargeFill size={11} /> Settle
                                        </button>
                                      )
                                    ) : (
                                      <span style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        padding: '4px 10px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '700', 
                                        backgroundColor: '#dcfce7', 
                                        color: '#15803d' 
                                      }}>
                                        <BsCheckCircleFill size={11} /> Settled
                                      </span>
                                    )}
                                  </div>
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

              {/* 6. TAB 2: Daily & Show-wise Collections Breakdown Table */}
              {financeSubTab === "daily-collections" && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                  {/* Summary Bar */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#faf5ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#581c87', fontWeight: '700' }}>
                          Theater-wise Daily & Show Collections
                        </h3>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#7e22ce' }}>
                          Viewing {selectedTheaterFilter === "ALL" ? "All Theaters" : (payoutsData.find(p => String(p.id) === String(selectedTheaterFilter))?.theater || "Selected Theater")} • Period: <strong>{contractPeriodFilter === "ALL" ? "All Recorded Screenings" : contractPeriodFilter}</strong>
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: '700', textTransform: 'uppercase' }}>Bookings</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#581c87' }}>{filteredSales.length}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: '700', textTransform: 'uppercase' }}>Tickets Sold</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#581c87' }}>
                            {filteredSales.reduce((acc, s) => acc + (s.seats ? (typeof s.seats === "string" ? s.seats.split(",").length : 1) : 1), 0)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: '700', textTransform: 'uppercase' }}>Gross Box Office</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#15803d' }}>
                            ₹{filteredSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Show Date & Time</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Movie & Screen</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer / Seats</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Collection</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Fee</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Partner Share</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment</th>
                          <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <BsReceiptCutoff size={36} style={{ color: '#94a3b8' }} />
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>No Collection Transactions in this Period</span>
                                <span style={{ fontSize: '0.85rem' }}>Select a different contract date period or choose "All Time" to view ticket sales history.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredSales.map((sale) => {
                            const seatsCount = sale.seats ? (typeof sale.seats === "string" ? sale.seats.split(",").length : (Array.isArray(sale.seats) ? sale.seats.length : 1)) : 1;
                            const gross = Number(sale.amount || 0);
                            const fee = seatsCount * 25;
                            const net = Math.max(0, gross - fee);
                            return (
                              <tr key={sale.ticketId || sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '14px 20px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>
                                    {sale.date || (sale.createdAt ? sale.createdAt.slice(0, 10) : "Today")}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{sale.time || "Showtime"}</div>
                                </td>
                                <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1e293b', fontSize: '0.88rem' }}>
                                  {sale.theaterName || "Cinema Partner"}
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.88rem' }}>{sale.movieTitle || "Movie"}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sale.screenName || "Main Screen"}</div>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                  <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>{sale.customerName || "Customer"}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>
                                    {sale.seats || "1 seat"} ({seatsCount} tck)
                                  </div>
                                </td>
                                <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                                  ₹{gross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '14px 20px', color: '#dc2626', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                  -₹{fee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '14px 20px', fontWeight: '800', color: '#15803d', fontSize: '0.95rem' }}>
                                  ₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: '600', color: '#475569' }}>
                                    {sale.paymentMode || "UPI"}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '3px 8px', 
                                    borderRadius: '12px', 
                                    backgroundColor: '#dcfce7', 
                                    color: '#15803d', 
                                    fontWeight: '700' 
                                  }}>
                                    ✓ Collected
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

              {/* 7. TAB 3: Settlement History (Completed) Table */}
              {financeSubTab === "settled" && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                        Disbursement Ledger & Settlement History
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Historical bank transfer batches with verified RBI UTR references and itemized advice slips.
                      </p>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settlement ID & Date</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater Partner</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contract / Batch</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Disbursed</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode & Bank</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RBI UTR Ref</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                          <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Advice Slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSettlements.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: '45px 20px', textAlign: 'center', color: '#64748b' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <BsClockHistory size={32} style={{ color: '#94a3b8' }} />
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>No Historical Settlements Found</span>
                                <span style={{ fontSize: '0.85rem' }}>Authorize pending theater payouts to record verified disbursements in the platform ledger.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredSettlements.map((s) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'monospace', fontSize: '0.88rem' }}>{s.id}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.dateFormatted || (s.settledAt ? new Date(s.settledAt).toLocaleDateString("en-IN") : "Today")}</div>
                              </td>
                              <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>
                                {s.theaterName}
                              </td>
                              <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.85rem' }}>
                                {s.forDate || "Ticket Batch"} ({s.ticketsSold || 0} tck)
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '1.05rem' }}>
                                  ₹{Number(s.netPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>{s.mode || "NEFT"}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.bankName || "Linked Bank"} {s.accountMasked || ""}</div>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <code style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#2563eb', fontWeight: '700' }}>
                                    {s.utr}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(s.utr);
                                      setCopiedUtrSuperAdmin(s.id);
                                      setTimeout(() => setCopiedUtrSuperAdmin(null), 2000);
                                    }}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '2px 4px' }}
                                    title="Copy UTR Reference"
                                  >
                                    {copiedUtrSuperAdmin === s.id ? <BsCheck2 style={{ color: '#16a34a' }} /> : <BsCopy size={12} />}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px', 
                                  padding: '4px 10px', 
                                  borderRadius: '20px', 
                                  fontSize: '0.78rem', 
                                  fontWeight: '700', 
                                  backgroundColor: '#dcfce7', 
                                  color: '#15803d' 
                                }}>
                                  <BsCheckCircleFill size={12} /> Disbursed
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedSettlementReceipt(s)}
                                  style={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #cbd5e1',
                                    color: '#2563eb',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  View Slip
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

              {/* 8. Hold / Dispute Flag Modal */}
              {holdModalPayout && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef2f2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BsExclamationOctagonFill size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#991b1b', fontWeight: '700' }}>
                            Place Payout On Dispute Hold
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#b91c1c' }}>
                            {holdModalPayout.theater} (Portal #{holdModalPayout.id})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHoldModalPayout(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', color: '#92400e' }}>
                        Holding this payout prevents accidental automated or manual disbursements until released by Super Admin after review.
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Primary Dispute / Hold Reason
                        </label>
                        <select
                          value={holdReason}
                          onChange={(e) => setHoldReason(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                        >
                          <option value="Bank KYC Discrepancy / IFSC Verification">Bank KYC Discrepancy / IFSC Verification</option>
                          <option value="Chargeback / Disputed Ticket Bookings">Chargeback / Disputed Ticket Bookings</option>
                          <option value="Tax Compliance / GSTIN Verification Pending">Tax Compliance / GSTIN Verification Pending</option>
                          <option value="Contract Renewal / Commission Rate Dispute">Contract Renewal / Commission Rate Dispute</option>
                          <option value="SuperAdmin Administrative Review">SuperAdmin Administrative Review</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Audit Memo / Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={holdNotes}
                          onChange={(e) => setHoldNotes(e.target.value)}
                          placeholder="Provide audit context for why this theater's disbursal is suspended..."
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setHoldModalPayout(null)}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveHoldStatus}
                          style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <BsPauseCircleFill size={14} /> Confirm Hold
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. 1-Click Bulk Payout Disbursal Modal */}
              {showBulkSettleModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '780px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                  }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BsLightningChargeFill size={22} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#14532d', fontWeight: '800' }}>
                            Batch Disburse All Eligible Theaters
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
                            Automated 1-click bank transfer batch for <strong>{eligibleBulkPayouts.length} verified theater partners</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBulkSettleModal(false)}
                        disabled={processingBulkSettle}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <form onSubmit={handleConfirmBulkSettle} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Batch KPI Overview */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Portals in Batch</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>{eligibleBulkPayouts.length}</div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Gross Volume</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                            ₹{eligibleBulkPayouts.reduce((acc, p) => acc + (p.totalGross || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: '700', textTransform: 'uppercase' }}>Fee + GST + TDS</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#dc2626' }}>
                            -₹{eligibleBulkPayouts.reduce((acc, p) => acc + (p.totalDeductions || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '800', textTransform: 'uppercase' }}>Net Disbursement</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#15803d' }}>
                            ₹{eligibleBulkPayouts.reduce((acc, p) => acc + (p.owed || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Recipient Theater List Preview */}
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                          Batch Recipients ({eligibleBulkPayouts.length} Theaters)
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <tbody>
                              {eligibleBulkPayouts.map((p, idx) => {
                                const b = getTheaterBankSettings(p.id);
                                return (
                                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 16px', fontWeight: '600', color: '#0f172a' }}>
                                      {idx + 1}. {p.theater}
                                    </td>
                                    <td style={{ padding: '8px 16px', color: '#64748b' }}>
                                      {b?.bankName} (•••• {b?.accountNumber?.slice(-4)})
                                    </td>
                                    <td style={{ padding: '8px 16px', color: '#475569' }}>
                                      {p.tickets} seats
                                    </td>
                                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                                      ₹{Number(p.owed || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Batch Transfer Mode
                          </label>
                          <select
                            value={bulkSettleMode}
                            onChange={(e) => setBulkSettleMode(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                          >
                            <option value="NEFT">NEFT (National Electronic Funds Transfer)</option>
                            <option value="RTGS">RTGS (Real-Time Gross Settlement)</option>
                            <option value="IMPS">IMPS (Immediate Payment Service)</option>
                            <option value="UPI">UPI (Corporate Bulk Payments)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Batch Reference Memo
                          </label>
                          <input
                            type="text"
                            value={bulkSettleNotes}
                            onChange={(e) => setBulkSettleNotes(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                            placeholder="e.g. Weekly settlement batch"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setShowBulkSettleModal(false)}
                          disabled={processingBulkSettle}
                          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={processingBulkSettle}
                          style={{
                            padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#fff',
                            fontWeight: '700', cursor: processingBulkSettle ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 10px rgba(22, 163, 74, 0.35)'
                          }}
                        >
                          {processingBulkSettle ? (
                            <span>Processing Batch Transfer...</span>
                          ) : (
                            <>
                              <BsCheck2All size={16} /> Authorize Batch Transfer (₹{eligibleBulkPayouts.reduce((acc, p) => acc + (p.owed || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 10. Individual Settle Payment Modal */}
              {settleModalPayout && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                  }}>
                    <div style={{
                      padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#eff6ff',
                          color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                        }}>
                          <BsBank />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
                            Authorize Theater Disbursement
                          </h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Disburse net ticket & concession payout to <strong>{settleModalPayout.theater}</strong>
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSettleModalPayout(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: '6px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <form onSubmit={handleConfirmSettlement} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Itemized Net Disbursable Card */}
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>Net Payable Amount (INR)</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#15803d', margin: '4px 0', letterSpacing: '-0.5px' }}>
                          ₹{Number(settleModalPayout.owed || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        
                        {/* Revenue & Tax Breakdown Strip */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #bbf7d0', fontSize: '0.78rem' }}>
                          <div>
                            <div style={{ color: '#4b5563' }}>Box Office</div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{Number(settleModalPayout.boxOfficeGross || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                          </div>
                          <div>
                            <div style={{ color: '#4b5563' }}>F&B Canteen</div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{Number(settleModalPayout.fnbGross || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                          </div>
                          <div>
                            <div style={{ color: '#dc2626' }}>Fee + 18% GST</div>
                            <div style={{ fontWeight: '700', color: '#dc2626' }}>-₹{Number((settleModalPayout.convenienceFee || 0) + (settleModalPayout.gstOnFee || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                          </div>
                          <div>
                            <div style={{ color: '#dc2626' }}>1% Sec 194-O TDS</div>
                            <div style={{ fontWeight: '700', color: '#dc2626' }}>-₹{Number(settleModalPayout.tdsAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const bank = getTheaterBankSettings(settleModalPayout.id);
                        if (bank && bank.accountNumber) {
                          return (
                            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Verified Partner Bank Details
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                                  ✓ KYC Verified
                                </span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                                <div>
                                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Bank Name</div>
                                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{bank.bankName}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Account Number</div>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>•••• {bank.accountNumber.slice(-4)}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>IFSC Code</div>
                                  <div style={{ fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{bank.ifscCode}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Account Holder</div>
                                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{bank.accountHolderName || settleModalPayout.theater}</div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <BsExclamationTriangle style={{ color: '#d97706', fontSize: '20px', flexShrink: 0 }} />
                              <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                <div style={{ fontWeight: '700' }}>No Verified Bank Linked Yet</div>
                                Partner has not linked their bank account.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenBankEdit(settleModalPayout);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #b45309',
                                backgroundColor: '#fff',
                                color: '#b45309',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              + Link Bank Now
                            </button>
                          </div>
                        );
                      })()}

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Transfer / Disbursement Mode
                        </label>
                        <select 
                          value={settlementForm.mode}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, mode: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                        >
                          <option value="NEFT">NEFT (National Electronic Funds Transfer)</option>
                          <option value="RTGS">RTGS (Real-Time Gross Settlement)</option>
                          <option value="IMPS">IMPS (Immediate Payment Service)</option>
                          <option value="UPI">UPI (Unified Payments Interface)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          RBI UTR / Bank Transaction Reference Code
                        </label>
                        <input 
                          type="text"
                          required
                          value={settlementForm.utr}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, utr: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: '600', outline: 'none' }}
                          placeholder="e.g. CMS20260929849201"
                        />
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          Auto-generated reference number. You can replace this with your bank portal's actual wire UTR.
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Settlement Remarks / Reference
                        </label>
                        <input 
                          type="text"
                          value={settlementForm.notes}
                          onChange={(e) => setSettlementForm(prev => ({ ...prev, notes: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                          placeholder="e.g. Weekly box office settlement batch"
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSettleModalPayout(null)}
                          disabled={settlingPayment}
                          style={{
                            padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={settlingPayment}
                          style={{
                            padding: '10px 24px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#16a34a', color: '#fff', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: settlingPayment ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)'
                          }}
                        >
                          {settlingPayment ? (
                            <span>Processing...</span>
                          ) : (
                            <>
                              <BsCheckCircleFill size={15} /> Authorize & Disburse (₹{Number(settleModalPayout.owed || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 9. Quick Bank Account Link / Edit Modal */}
              {showBankEditModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{
                      padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BsBank size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                            Link Partner Bank Account
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                            {showBankEditModal.theater} (Portal #{showBankEditModal.id})
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowBankEditModal(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <form onSubmit={handleSaveTheaterBank} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          required
                          value={bankEditForm.bankName}
                          onChange={(e) => setBankEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                          placeholder="e.g. HDFC Bank, State Bank of India"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={bankEditForm.accountHolderName}
                          onChange={(e) => setBankEditForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                          placeholder="e.g. Naveen Cinemas Entertainment Pvt Ltd"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                            Account Number
                          </label>
                          <input
                            type="text"
                            required
                            value={bankEditForm.accountNumber}
                            onChange={(e) => setBankEditForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                            placeholder="e.g. 50100481920419"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                            Confirm Account Number
                          </label>
                          <input
                            type="text"
                            required
                            value={bankEditForm.confirmAccountNumber}
                            onChange={(e) => setBankEditForm(prev => ({ ...prev, confirmAccountNumber: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                            placeholder="Re-enter Account No"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            required
                            value={bankEditForm.ifscCode}
                            onChange={(e) => setBankEditForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'monospace' }}
                            placeholder="e.g. HDFC0001234"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                            Account Type
                          </label>
                          <select
                            value={bankEditForm.accountType}
                            onChange={(e) => setBankEditForm(prev => ({ ...prev, accountType: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                          >
                            <option value="CURRENT">Current Account</option>
                            <option value="SAVINGS">Savings Account</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowBankEditModal(null)}
                          disabled={savingBank}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingBank}
                          style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                        >
                          {savingBank ? "Saving..." : "Save & Verify Account"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 9.1 Bank & KYC Details Request Notification Modal */}
              {bankReminderModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{
                      padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffbeb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BsBell size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#92400e', fontWeight: '700' }}>
                            Send Bank & KYC Request
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>
                            Target Cinema: <strong>{bankReminderModal.theater}</strong> (Portal #{bankReminderModal.id})
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setBankReminderModal(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <form onSubmit={handleSendBankReminder} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                        This sends an official in-app alert banner & notification badge directly to the theater owner's dashboard in place of their Bank Account card to prompt immediate submission.
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                          Request Category
                        </label>
                        <select
                          value={bankReminderType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBankReminderType(val);
                            if (val === "BANK_AND_KYC") {
                              setBankReminderNotes("Please submit your verified business bank account details, IFSC, and Business PAN & GSTIN documents to enable automated T+1 daily payout transfers.");
                            } else if (val === "BANK_ONLY") {
                              setBankReminderNotes("Please link your bank account number and IFSC code for daily ticket sales settlements.");
                            } else if (val === "KYC_PAN_ONLY") {
                              setBankReminderNotes("Please submit your cinema's Business PAN card details for Section 194-O TDS compliance and Form 26AS tax credits.");
                            }
                          }}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        >
                          <option value="BANK_AND_KYC">Bank Account & Tax KYC (PAN/GSTIN) Required</option>
                          <option value="BANK_ONLY">Bank Account Details Only</option>
                          <option value="KYC_PAN_ONLY">Business PAN & Tax Documents Only</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                          Notification Message to Theater Owner
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={bankReminderNotes}
                          onChange={(e) => setBankReminderNotes(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          placeholder="Type instruction or reason..."
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setBankReminderModal(null)}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#d97706', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <BsBell size={13} /> Send Notification to Theater
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 10. Settlement Advice Slip Modal */}
              {selectedSettlementReceipt && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BsShieldCheck size={20} style={{ color: '#16a34a' }} />
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                          Settlement Advice Slip
                        </h4>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedSettlementReceipt(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '600' }}>Net Amount Deposited to Bank</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#15803d', margin: '2px 0' }}>
                          ₹{Number(selectedSettlementReceipt.netPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                          RBI UTR: <code style={{ fontWeight: '700', color: '#0f172a' }}>{selectedSettlementReceipt.utr}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Theater Partner:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{selectedSettlementReceipt.theaterName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Settlement Date:</span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedSettlementReceipt.dateFormatted || "Today"}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Contract Batch:</span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedSettlementReceipt.forDate || "Box Office Batch"}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Tickets Admitted:</span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedSettlementReceipt.ticketsSold || 0} Tickets</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Gross Processed (GMV):</span>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{Number(selectedSettlementReceipt.grossAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {Boolean(selectedSettlementReceipt.boxOfficeGross || selectedSettlementReceipt.fnbGross) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#475569' }}>
                            <span>Revenue Segregation:</span>
                            <span>🎟️ Box Office: ₹{Number(selectedSettlementReceipt.boxOfficeGross || 0).toLocaleString("en-IN")} • 🍿 F&B: ₹{Number(selectedSettlementReceipt.fnbGross || 0).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#dc2626' }}>Platform Convenience Fee:</span>
                          <span style={{ fontWeight: '600', color: '#dc2626', fontFamily: 'monospace' }}>-₹{Number(selectedSettlementReceipt.convenienceFeeDeducted || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#dc2626' }}>GST on Platform Fee (18%):</span>
                          <span style={{ fontWeight: '600', color: '#dc2626', fontFamily: 'monospace' }}>-₹{Number(selectedSettlementReceipt.gstDeducted || ((selectedSettlementReceipt.convenienceFeeDeducted || 0) * 0.18)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#dc2626' }}>TDS under Sec 194-O (1%):</span>
                          <span style={{ fontWeight: '600', color: '#dc2626', fontFamily: 'monospace' }}>-₹{Number(selectedSettlementReceipt.tdsDeducted || ((selectedSettlementReceipt.grossAmount || 0) * 0.01)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#64748b' }}>Disbursed Bank Account:</span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedSettlementReceipt.bankName} {selectedSettlementReceipt.accountMasked}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontWeight: '900', color: '#16a34a', fontSize: '1.05rem', backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '6px' }}>
                          <span>Net Bank Deposit:</span>
                          <span>₹{Number(selectedSettlementReceipt.netPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSettlementReceipt(null)}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Print Advice Slip
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === "emails" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="sa-page-heading" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Theater Email Delivery Logs</h2>
                  <p style={{ color: '#64748b' }}>Monitor system emails, ticket confirmations, reports, and staff alerts sent across theater portals.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={loadEmailData}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px',
                      border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontWeight: '600',
                      cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <BsArrowClockwise /> Refresh
                  </button>
                  <button
                    onClick={() => setShowComposeModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px',
                      border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: '600',
                      cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <BsEnvelope /> Compose Email
                  </button>
                </div>
              </div>

              {emailToast && (
                <div style={{
                  backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46',
                  padding: '12px 20px', borderRadius: '10px', fontWeight: '500', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <BsCheckCircle style={{ color: '#059669', fontSize: '1.2rem' }} />
                  {emailToast}
                </div>
              )}

              {/* Metric Cards */}
              <div className="sa-page-cards three">
                <Metric 
                  icon={<BsEnvelope />} 
                  label="Total Emails Sent" 
                  value={Number(emailStats?.totalSent || 0).toLocaleString("en-IN")} 
                />
                <Metric 
                  icon={<BsActivity />} 
                  label="Delivery Rate" 
                  value={`${emailStats?.deliveryRate != null ? emailStats.deliveryRate : 100}%`} 
                />
                <Metric 
                  icon={<BsBox />} 
                  label="Bounced / Failed" 
                  value={Number(emailStats?.bouncedFailed || 0).toLocaleString("en-IN")} 
                />
              </div>

              {/* Email Logs Table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Recent Dispatch Logs</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing {filteredEmailLogs.length} of {emailLogs.length} total dispatches</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select 
                      value={emailTypeFilter}
                      onChange={(e) => setEmailTypeFilter(e.target.value)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', backgroundColor: '#fff' }}
                    >
                      <option value="ALL">All Types</option>
                      <option value="Ticket Confirmation">Ticket Confirmation</option>
                      <option value="Staff Invitation">Staff Invitation</option>
                      <option value="Settlement Report">Settlement Report</option>
                      <option value="Alert">Alert</option>
                      <option value="Support Resolution">Support Resolution</option>
                    </select>
                    <input 
                      type="text" 
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      placeholder="Search subject, recipient, theater..." 
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '250px' }} 
                    />
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmailLogs.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            No email logs match the criteria. Dispatched notifications and tickets will appear here automatically.
                          </td>
                        </tr>
                      ) : (
                        filteredEmailLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{log.subject}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{log.recipient}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{log.theater}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#334155' }}>
                                {log.type}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem' }}>{log.time}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ 
                                display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: log.status === 'Delivered' ? '#dcfce7' : '#fee2e2',
                                color: log.status === 'Delivered' ? '#16a34a' : '#dc2626'
                              }}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compose Email Modal */}
              {showComposeModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', maxWidth: '560px', width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
                  }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Compose Theater Email</h3>
                      <button 
                        onClick={() => setShowComposeModal(false)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem' }}
                      >
                        <BsXLg />
                      </button>
                    </div>
                    <form onSubmit={handleSendComposeEmail} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Theater Portal / Branch
                        </label>
                        <input
                          type="text"
                          value={composeForm.theaterName}
                          onChange={(e) => setComposeForm({ ...composeForm, theaterName: e.target.value })}
                          placeholder="e.g. Thunder Cinemas Chennai"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Email Category / Type *
                          </label>
                          <select
                            value={composeForm.type}
                            onChange={(e) => setComposeForm({ ...composeForm, type: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#fff' }}
                          >
                            <option value="Alert">Alert</option>
                            <option value="Settlement Report">Settlement Report</option>
                            <option value="Support Resolution">Support Resolution</option>
                            <option value="Policy Notice">Policy Notice</option>
                            <option value="General Notification">General Notification</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Recipient Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={composeForm.recipient}
                            onChange={(e) => setComposeForm({ ...composeForm, recipient: e.target.value })}
                            placeholder="manager@theater.com"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Subject *
                        </label>
                        <input
                          type="text"
                          required
                          value={composeForm.subject}
                          onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                          placeholder="e.g. Scheduled Maintenance / Settlement Report Finalized"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Message Body *
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={composeForm.body}
                          onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                          placeholder="Write your email message here..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowComposeModal(false)}
                          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={sendingEmail}
                          style={{
                            padding: '10px 22px', borderRadius: '8px', border: 'none',
                            backgroundColor: sendingEmail ? '#94a3b8' : '#0284c7', color: '#fff',
                            fontWeight: '600', cursor: sendingEmail ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {sendingEmail ? "Dispatching..." : "Send Email"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === "support" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Dual Sub-Tab Switcher: Partner vs Public */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <button 
                  type="button"
                  onClick={() => { setSupportSubTab("partner"); setSupportCategoryFilter("ALL"); setSearchSupport(""); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '0.92rem',
                    cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                    backgroundColor: supportSubTab === "partner" ? '#4f46e5' : '#f1f5f9',
                    color: supportSubTab === "partner" ? '#fff' : '#475569',
                    boxShadow: supportSubTab === "partner" ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                  }}
                >
                  <BsBuilding /> 🎬 Theater Partner Tickets ({theaterTickets.length})
                </button>
                <button 
                  type="button"
                  onClick={() => { setSupportSubTab("public"); setSupportCategoryFilter("ALL"); setSearchSupport(""); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '0.92rem',
                    cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                    backgroundColor: supportSubTab === "public" ? '#e11d48' : '#f1f5f9',
                    color: supportSubTab === "public" ? '#fff' : '#475569',
                    boxShadow: supportSubTab === "public" ? '0 4px 12px rgba(225, 29, 72, 0.25)' : 'none'
                  }}
                >
                  <BsTicketPerforated /> 🍿 Public Moviegoer Tickets ({publicTickets.length})
                </button>
              </div>

              {/* Bento Metric Cards (APK Style) */}
              <div className="sa-page-cards four">
                {supportSubTab === "partner" ? (
                  <>
                    <Metric 
                      icon={<BsChatDots />} 
                      label="Total Partner Tickets" 
                      value={theaterTickets.length} 
                    />
                    <Metric 
                      icon={<BsClockHistory />} 
                      label="Open Issues" 
                      value={theaterTickets.filter(t => t.status === "OPEN").length}
                      subtitle="Awaiting response" 
                    />
                    <Metric 
                      icon={<BsExclamationTriangle />} 
                      label="Urgent & Crises" 
                      value={theaterTickets.filter(t => t.priority === "URGENT" || t.category === "EMERGENCY_SHOW_STOPPER").length}
                      subtitle="Live show / Gate stoppers" 
                    />
                    <Metric 
                      icon={<BsCheckCircle />} 
                      label="Resolved Tickets" 
                      value={theaterTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length} 
                    />
                  </>
                ) : (
                  <>
                    <Metric 
                      icon={<BsTicketPerforated />} 
                      label="Total Public Tickets" 
                      value={publicTickets.length} 
                    />
                    <Metric 
                      icon={<BsClockHistory />} 
                      label="Payment / Open Issues" 
                      value={publicTickets.filter(t => t.status === "OPEN").length} 
                    />
                    <Metric 
                      icon={<BsQrCode />} 
                      label="Gate & Payment Snags" 
                      value={publicTickets.filter(t => t.category === "PAYMENT_DEBITED_NO_TICKET" || t.category === "GATE_SCAN_FAILURE").length}
                      subtitle="Immediate patron assistance" 
                    />
                    <Metric 
                      icon={<BsCheckCircle />} 
                      label="Resolved / Refunded" 
                      value={publicTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED" || t.refundProcessed).length} 
                    />
                  </>
                )}
              </div>

              {/* Alert / Toast Messages */}
              {supportToast && (
                <div style={{ padding: '12px 18px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: '600', fontSize: '0.88rem' }}>
                  ✓ {supportToast}
                </div>
              )}
              {supportError && (
                <div style={{ padding: '12px 18px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600', fontSize: '0.88rem' }}>
                  ⚠ {supportError}
                </div>
              )}

              {/* Filter & Search Bar */}
              <div style={{ 
                backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0',
                display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder={supportSubTab === "partner" ? "Search reference, theater, role or subject..." : "Search reference, customer, booking ID or issue..."}
                      value={searchSupport}
                      onChange={e => setSearchSupport(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px',
                        border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={supportCategoryFilter}
                    onChange={e => setSupportCategoryFilter(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="ALL">All Categories</option>
                    {supportSubTab === "partner" ? (
                      <>
                        <option value="EMERGENCY_SHOW_STOPPER">🚨 Emergency Show Snag</option>
                        <option value="GATE_SCANNER_HARDWARE">🎟️ Gate Scanner Hardware</option>
                        <option value="BOX_OFFICE_POS">📠 Box Office POS Printer</option>
                        <option value="PAYOUT_FINANCIAL">💳 Payout & Fee Settlement</option>
                        <option value="SEAT_LAYOUT">💺 Seat Layout / Broken Seats</option>
                        <option value="FOOD_CONCESSIONS">🍿 F&B Concessions Vouchers</option>
                        <option value="GENERAL">ℹ️ General / Portal Access</option>
                      </>
                    ) : (
                      <>
                        <option value="PAYMENT_DEBITED_NO_TICKET">💸 Payment Deducted, No Ticket</option>
                        <option value="TICKET_NOT_RECEIVED">📩 SMS / WhatsApp QR Not Received</option>
                        <option value="GATE_SCAN_FAILURE">🚪 Gate Scanner Rejection</option>
                        <option value="CANCEL_REFUND_REQUEST">🔄 Show Cancelled / Refund</option>
                        <option value="SEAT_ISSUE">💺 Seat Conflict</option>
                        <option value="FOOD_CONCESSIONS">🍿 F&B Voucher Problem</option>
                        <option value="GENERAL">ℹ️ Other Inquiries</option>
                      </>
                    )}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={supportStatusFilter}
                    onChange={e => setSupportStatusFilter(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={supportPriorityFilter}
                    onChange={e => setSupportPriorityFilter(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={loadSupportData}
                  disabled={loadingSupport}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#fff', color: '#4f46e5', fontWeight: '600', fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <BsArrowClockwise /> {loadingSupport ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {/* Data Table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '16px 20px' }}>Reference</th>
                        {supportSubTab === "partner" ? (
                          <>
                            <th style={{ padding: '16px 20px' }}>Theater & City</th>
                            <th style={{ padding: '16px 20px' }}>Requester (Role)</th>
                            <th style={{ padding: '16px 20px' }}>Category & Subject</th>
                          </>
                        ) : (
                          <>
                            <th style={{ padding: '16px 20px' }}>Customer Info</th>
                            <th style={{ padding: '16px 20px' }}>Booking / Venue</th>
                            <th style={{ padding: '16px 20px' }}>Category & Subject</th>
                          </>
                        )}
                        <th style={{ padding: '16px 20px' }}>Priority</th>
                        <th style={{ padding: '16px 20px' }}>Status</th>
                        <th style={{ padding: '16px 20px' }}>Submitted</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportSubTab === "partner" ? (
                        theaterTickets
                          .filter(t => {
                            const query = searchSupport.toLowerCase().trim();
                            const matchesSearch = !query || [t.referenceCode, t.theaterName, t.requesterName, t.subject, t.description].some(v => String(v || '').toLowerCase().includes(query));
                            const matchesCategory = supportCategoryFilter === "ALL" || t.category === supportCategoryFilter;
                            const matchesStatus = supportStatusFilter === "ALL" || t.status === supportStatusFilter;
                            const matchesPriority = supportPriorityFilter === "ALL" || t.priority === supportPriorityFilter;
                            return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
                          })
                          .map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8rem', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '3px 8px', borderRadius: '4px' }}>
                                  {t.referenceCode || `THTR-${t.id}`}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>{t.theaterName || "Cinema"}</strong>
                                <small style={{ color: '#64748b' }}>{t.city || "Branch"}</small>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.88rem' }}>{t.requesterName}</div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                  {String(t.dutyRole || 'STAFF').replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px', maxWidth: '280px' }}>
                                <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.subject}
                                </strong>
                                <small style={{ color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.description}
                                </small>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: t.priority === "URGENT" ? '#fee2e2' : t.priority === "HIGH" ? '#ffedd5' : '#e0e7ff',
                                  color: t.priority === "URGENT" ? '#b91c1c' : t.priority === "HIGH" ? '#c2410c' : '#4338ca'
                                }}>
                                  {t.priority}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: t.status === "RESOLVED" || t.status === "CLOSED" ? '#dcfce7' : t.status === "IN_PROGRESS" ? '#fef3c7' : '#fee2e2',
                                  color: t.status === "RESOLVED" || t.status === "CLOSED" ? '#15803d' : t.status === "IN_PROGRESS" ? '#b45309' : '#dc2626'
                                }}>
                                  {t.status}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b' }}>
                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }) : "Recent"}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => openTicketModal(t, "partner")}
                                  style={{
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                    backgroundColor: '#fff', color: '#4f46e5', fontWeight: '600', fontSize: '0.82rem',
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
                                  }}
                                >
                                  <BsEye /> Review
                                </button>
                              </td>
                            </tr>
                          ))
                      ) : (
                        publicTickets
                          .filter(t => {
                            const query = searchSupport.toLowerCase().trim();
                            const matchesSearch = !query || [t.referenceCode, t.customerName, t.customerEmail, t.customerPhone, t.bookingReference, t.subject, t.description].some(v => String(v || '').toLowerCase().includes(query));
                            const matchesCategory = supportCategoryFilter === "ALL" || t.category === supportCategoryFilter;
                            const matchesStatus = supportStatusFilter === "ALL" || t.status === supportStatusFilter;
                            const matchesPriority = supportPriorityFilter === "ALL" || t.priority === supportPriorityFilter;
                            return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
                          })
                          .map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8rem', color: '#e11d48', backgroundColor: '#ffe4e6', padding: '3px 8px', borderRadius: '4px' }}>
                                  {t.referenceCode || `PUB-${t.id}`}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>{t.customerName}</strong>
                                <small style={{ color: '#64748b' }}>{t.customerEmail} • {t.customerPhone || 'No phone'}</small>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>
                                  Ref: {t.bookingReference || "Unattached"}
                                </div>
                                <small style={{ color: '#64748b' }}>{t.titleOrVenueName || "Movie booking"}</small>
                              </td>
                              <td style={{ padding: '16px 20px', maxWidth: '280px' }}>
                                <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.subject}
                                </strong>
                                <small style={{ color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.description}
                                </small>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: t.priority === "URGENT" ? '#fee2e2' : t.priority === "HIGH" ? '#ffedd5' : '#e0e7ff',
                                  color: t.priority === "URGENT" ? '#b91c1c' : t.priority === "HIGH" ? '#c2410c' : '#4338ca'
                                }}>
                                  {t.priority}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: t.status === "RESOLVED" || t.status === "CLOSED" ? '#dcfce7' : t.status === "IN_PROGRESS" ? '#fef3c7' : '#fee2e2',
                                  color: t.status === "RESOLVED" || t.status === "CLOSED" ? '#15803d' : t.status === "IN_PROGRESS" ? '#b45309' : '#dc2626'
                                }}>
                                  {t.status}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b' }}>
                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }) : "Recent"}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => openTicketModal(t, "public")}
                                  style={{
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                    backgroundColor: '#fff', color: '#e11d48', fontWeight: '600', fontSize: '0.82rem',
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
                                  }}
                                >
                                  <BsEye /> Inspect
                                </button>
                              </td>
                            </tr>
                          ))
                      )}

                      {/* Empty States */}
                      {supportSubTab === "partner" && !loadingSupport && theaterTickets.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <BsBuilding style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '10px' }} />
                            <p style={{ margin: 0, fontWeight: '600' }}>No Theater Partner tickets logged yet.</p>
                          </td>
                        </tr>
                      )}
                      {supportSubTab === "public" && !loadingSupport && publicTickets.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <BsTicketPerforated style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '10px' }} />
                            <p style={{ margin: 0, fontWeight: '600' }}>No Public Moviegoer tickets logged yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Super Admin Ticket Resolution Modal */}
              {selectedTicket && (
                <div
                  style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', backdropFilter: 'blur(4px)'
                  }}
                  onClick={() => setSelectedTicket(null)}
                >
                  <div
                    style={{
                      width: 'min(920px, 95vw)', maxHeight: '90vh', backgroundColor: '#fff',
                      borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div style={{
                      padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: ticketType === 'partner' ? '#1e1b4b' : '#1e293b', color: '#fff'
                    }}>
                      <div>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '700',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '3px 8px', borderRadius: '4px',
                          color: '#fff', marginRight: '10px'
                        }}>
                          {selectedTicket.referenceCode || (ticketType === 'partner' ? `THTR-${selectedTicket.id}` : `PUB-${selectedTicket.id}`)}
                        </span>
                        <h2 style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
                          {selectedTicket.subject}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    {/* Modal Body: 2 Columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', flex: 1, overflowY: 'auto' }}>
                      
                      {/* Left: Ticket Information */}
                      <div style={{ padding: '24px', borderRight: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          {ticketType === 'partner' ? (
                            <>
                              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Reporting Theater Partner:</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '2px 0 4px 0' }}>
                                {selectedTicket.theaterName} {selectedTicket.city && `(${selectedTicket.city})`}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                                Requester: <strong>{selectedTicket.requesterName}</strong> • Role: <strong>{selectedTicket.dutyRole}</strong>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '2px' }}>
                                Contact: {selectedTicket.contactEmail} {selectedTicket.contactPhone && `• ${selectedTicket.contactPhone}`}
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Public Movie Patron:</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '2px 0 4px 0' }}>
                                {selectedTicket.customerName}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                                Contact: {selectedTicket.customerEmail} {selectedTicket.customerPhone && `• ${selectedTicket.customerPhone}`}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '4px' }}>
                                Booking Ref: <strong>{selectedTicket.bookingReference || "Not provided"}</strong> • Venue: {selectedTicket.titleOrVenueName || "Cinema"}
                              </div>
                            </>
                          )}
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                            Issue Category
                          </label>
                          <div style={{ fontSize: '0.92rem', fontWeight: '600', color: '#1e293b', marginTop: '3px' }}>
                            {String(selectedTicket.category || 'General').replace(/_/g, ' ')}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                            Full Problem Description
                          </label>
                          <div style={{ marginTop: '6px', padding: '14px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#334155', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                            {selectedTicket.description}
                          </div>
                        </div>

                        {selectedTicket.screenshotUrl && (
                          <div style={{ marginTop: '16px' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                              Attachment / Screenshot
                            </label>
                            <div style={{ marginTop: '4px' }}>
                              <a href={selectedTicket.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontSize: '0.88rem', fontWeight: '600' }}>
                                Open screenshot in new tab ↗
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Super Admin Resolution Control */}
                      <div style={{ padding: '24px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                          Admin Action & Resolution
                        </h4>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Ticket Status
                          </label>
                          <select
                            value={ticketEdit.status}
                            onChange={e => setTicketEdit({ ...ticketEdit, status: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#fff' }}
                          >
                            <option value="OPEN">Open (Pending)</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Priority Level
                          </label>
                          <select
                            value={ticketEdit.priority}
                            onChange={e => setTicketEdit({ ...ticketEdit, priority: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#fff' }}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent (Crisis)</option>
                          </select>
                        </div>

                        {ticketType === "public" && (
                          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={ticketEdit.refundProcessed}
                                onChange={e => setTicketEdit({ ...ticketEdit, refundProcessed: e.target.checked })}
                              />
                              <span>Mark Payment Refund as Processed</span>
                            </label>
                          </div>
                        )}

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Response to User / Partner
                          </label>
                          <textarea
                            rows={5}
                            placeholder="Write resolution notes, explanation, or instructions..."
                            value={ticketEdit.adminResponse}
                            onChange={e => setTicketEdit({ ...ticketEdit, adminResponse: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(null)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveTicket}
                            disabled={savingTicket}
                            style={{
                              flex: 2, padding: '10px', borderRadius: '8px', border: 'none',
                              backgroundColor: ticketType === 'partner' ? '#4f46e5' : '#e11d48',
                              color: '#fff', fontWeight: '600', cursor: 'pointer'
                            }}
                          >
                            {savingTicket ? "Saving..." : "Save Resolution"}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {section === "notifications" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Toast Feedback */}
              {notifToast && (
                <div style={{
                  padding: '12px 20px', borderRadius: '10px', backgroundColor: '#ecfdf5',
                  border: '1px solid #6ee7b7', color: '#065f46', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600'
                }}>
                  <BsCheckCircle style={{ color: '#059669', fontSize: '1.2rem' }} />
                  {notifToast}
                </div>
              )}

              {/* Bento Metrics (4 Cards) */}
              <div className="sa-page-cards four">
                <Metric 
                  icon={<BsBell />} 
                  label="Total Broadcasts" 
                  value={notificationsList.length}
                  subtitle="Platform announcements"
                />
                <Metric 
                  icon={<BsBuilding />} 
                  label="Theaters Covered" 
                  value={new Set(notificationsList.map(n => n.theaterPortal?.id).filter(Boolean)).size || (portalsData.length > 0 ? portalsData.length : "Network")}
                  subtitle="Active cinema partners"
                />
                <Metric 
                  icon={<BsMegaphone />} 
                  label="Maintenance & Updates" 
                  value={notificationsList.filter(n => n.type === 'MAINTENANCE' || n.type === 'UPDATE').length}
                  subtitle="Operational alerts"
                />
                <Metric 
                  icon={<BsExclamationTriangle />} 
                  label="Urgent Advisories" 
                  value={notificationsList.filter(n => n.type === 'URGENT').length}
                  subtitle="High priority notices"
                />
              </div>

              {/* Action Toolbar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '15px', backgroundColor: '#fff', padding: '16px 20px',
                borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '280px' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                    <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="Search title, message, or cinema..."
                      value={notifSearch}
                      onChange={(e) => setNotifSearch(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
                        border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none'
                      }}
                    />
                  </div>

                  <select 
                    value={notifTypeFilter} 
                    onChange={(e) => setNotifTypeFilter(e.target.value)}
                    style={{
                      padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                      fontSize: '0.85rem', backgroundColor: '#fff', color: '#334155', outline: 'none'
                    }}
                  >
                    <option value="ALL">All Notice Types</option>
                    <option value="SYSTEM_ALERT">System Alert</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="UPDATE">Feature Update</option>
                    <option value="URGENT">Urgent Advisory</option>
                    <option value="TICKET_BOOKED">Ticket Bookings</option>
                  </select>

                  <select 
                    value={notifRoleFilter} 
                    onChange={(e) => setNotifRoleFilter(e.target.value)}
                    style={{
                      padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                      fontSize: '0.85rem', backgroundColor: '#fff', color: '#334155', outline: 'none'
                    }}
                  >
                    <option value="ALL">All Target Roles</option>
                    <option value="THEATER_OWNER">Theater Owners</option>
                    <option value="THEATER_MANAGER">Theater Managers</option>
                    <option value="CASHIER">Cashiers</option>
                    <option value="USHER">Ushers</option>
                  </select>

                  <button 
                    type="button" 
                    onClick={loadNotifications}
                    title="Refresh notices"
                    style={{
                      padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <BsArrowClockwise style={{ fontSize: '1rem', transform: loadingNotifications ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                  </button>
                </div>

                <div>
                  <button 
                    type="button" 
                    onClick={() => setShowNotifModal(true)}
                    style={{
                      padding: '10px 18px', borderRadius: '8px', border: 'none',
                      background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#fff',
                      fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.25)'
                    }}
                  >
                    <BsMegaphone style={{ fontSize: '1rem' }} />
                    <span>Dispatch Broadcast Alert</span>
                  </button>
                </div>
              </div>

              {/* Notification Table */}
              <div style={{
                backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination Portal</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alert Type</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headline & Notice Message</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Link</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingNotifications ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            Loading notifications and broadcasts...
                          </td>
                        </tr>
                      ) : filteredNotifications.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                            <BsBell style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '10px' }} />
                            <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>No broadcast notifications found</div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Dispatch a new alert announcement above to reach theater partners.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredNotifications.map((notif) => {
                          const dateStr = notif.createdAt
                            ? new Date(notif.createdAt).toLocaleString("en-IN", {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                              })
                            : "Recent";

                          // Type pill colors
                          let typeBg = "#f1f5f9";
                          let typeColor = "#475569";
                          if (notif.type === 'URGENT') {
                            typeBg = "#fee2e2"; typeColor = "#b91c1c";
                          } else if (notif.type === 'MAINTENANCE') {
                            typeBg = "#fef3c7"; typeColor = "#b45309";
                          } else if (notif.type === 'UPDATE') {
                            typeBg = "#dbeafe"; typeColor = "#1d4ed8";
                          } else if (notif.type === 'SYSTEM_ALERT') {
                            typeBg = "#ede9fe"; typeColor = "#6d28d9";
                          } else if (notif.type === 'TICKET_BOOKED') {
                            typeBg = "#ecfdf5"; typeColor = "#047857";
                          }

                          // Role badge
                          let roleLabel = notif.targetRole || "ALL";
                          if (roleLabel === "ALL") roleLabel = "All Staff";
                          else if (roleLabel === "THEATER_OWNER") roleLabel = "Owners";
                          else if (roleLabel === "THEATER_MANAGER") roleLabel = "Managers";
                          else if (roleLabel === "CASHIER") roleLabel = "Cashiers";
                          else if (roleLabel === "USHER") roleLabel = "Ushers";

                          return (
                            <tr key={notif.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                              <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {dateStr}
                              </td>
                              <td style={{ padding: '16px 20px', fontSize: '0.88rem', fontWeight: '600', color: '#1e293b' }}>
                                {notif.theaterPortal?.portalName || "All Theaters"}
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem',
                                  fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569'
                                }}>
                                  {roleLabel}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem',
                                  fontWeight: '700', backgroundColor: typeBg, color: typeColor,
                                  letterSpacing: '0.02em'
                                }}>
                                  {notif.type || "ALERT"}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px', maxWidth: '380px' }}>
                                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.88rem', marginBottom: '3px' }}>
                                  {notif.title}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {notif.message}
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px', fontSize: '0.82rem' }}>
                                {notif.actionUrl ? (
                                  <span style={{
                                    padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eef2ff',
                                    color: '#4338ca', fontFamily: 'monospace', fontSize: '0.78rem'
                                  }}>
                                    {notif.actionUrl}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>None</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteNotification(notif.id)}
                                  title="Revoke / Delete Notification"
                                  style={{
                                    padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca',
                                    backgroundColor: '#fff', color: '#dc2626', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem'
                                  }}
                                >
                                  <BsTrash style={{ fontSize: '0.88rem' }} />
                                  <span>Revoke</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compose Broadcast Modal */}
              {showNotifModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050,
                  padding: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#fff', width: '100%', maxWidth: '640px', borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                  }}>
                    {/* Modal Header */}
                    <div style={{
                      padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          backgroundColor: '#eef2ff', color: '#4f46e5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <BsMegaphone style={{ fontSize: '1.1rem' }} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
                            Dispatch Network Broadcast Alert
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                            Deliver immediate announcements to cinema dashboards and bells.
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowNotifModal(false)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                      >
                        <BsXLg />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <form onSubmit={handleSendBroadcast} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Destination Portal
                          </label>
                          <select 
                            value={notifForm.portalId} 
                            onChange={(e) => setNotifForm({ ...notifForm, portalId: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#fff' }}
                          >
                            <option value="">All Theaters (Network-wide)</option>
                            {portalsData.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name || `Theater #${p.id}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Target Audience
                          </label>
                          <select 
                            value={notifForm.targetRole} 
                            onChange={(e) => setNotifForm({ ...notifForm, targetRole: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#fff' }}
                          >
                            <option value="ALL">All Theater Staff</option>
                            <option value="THEATER_OWNER">Theater Owners Only</option>
                            <option value="THEATER_MANAGER">Theater Managers Only</option>
                            <option value="CASHIER">Cashiers / Box Office</option>
                            <option value="USHER">Ushers / Gate Staff</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Notice Classification
                          </label>
                          <select 
                            value={notifForm.type} 
                            onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#fff' }}
                          >
                            <option value="SYSTEM_ALERT">System Alert (General)</option>
                            <option value="MAINTENANCE">Scheduled Maintenance</option>
                            <option value="UPDATE">Feature / Policy Update</option>
                            <option value="URGENT">Urgent Operational Advisory</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                            Action Path (Optional)
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. /theater/showtimes"
                            value={notifForm.actionUrl}
                            onChange={(e) => setNotifForm({ ...notifForm, actionUrl: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Announcement Headline <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Platform Maintenance Window tonight at 02:00 AM IST"
                          value={notifForm.title}
                          onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#334155' }}>
                            Detailed Message <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {notifForm.message.length} / 1000 characters
                          </span>
                        </div>
                        <textarea 
                          rows={4}
                          required
                          maxLength={1000}
                          placeholder="Provide clear details, instructions, or operational recommendations for the theater team..."
                          value={notifForm.message}
                          onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                        />
                      </div>

                      {/* Live Staff Notification Bell Preview Box */}
                      <div style={{
                        marginTop: '5px', padding: '14px 16px', borderRadius: '10px',
                        backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                          Live Preview: Theater Staff Bell Dropdown
                        </div>
                        <div style={{
                          backgroundColor: '#fff', borderRadius: '8px', padding: '12px 14px',
                          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                              backgroundColor: notifForm.type === 'URGENT' ? '#fee2e2' : notifForm.type === 'MAINTENANCE' ? '#fef3c7' : '#ede9fe',
                              color: notifForm.type === 'URGENT' ? '#b91c1c' : notifForm.type === 'MAINTENANCE' ? '#b45309' : '#6d28d9'
                            }}>
                              {notifForm.type}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Just now</span>
                          </div>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', margin: '4px 0 2px 0' }}>
                            {notifForm.title || "Headline preview will appear here"}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                            {notifForm.message || "Message details preview will appear here."}
                          </div>
                          {notifForm.actionUrl && (
                            <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#4f46e5', fontWeight: '600' }}>
                              Action Link: {notifForm.actionUrl}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modal Footer Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setShowNotifModal(false)}
                          style={{
                            padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={sendingNotif}
                          style={{
                            padding: '10px 22px', borderRadius: '8px', border: 'none',
                            background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#fff',
                            fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.25)',
                            opacity: sendingNotif ? 0.7 : 1
                          }}
                        >
                          <BsSend style={{ fontSize: '0.95rem' }} />
                          <span>{sendingNotif ? "Dispatching..." : "Dispatch Broadcast"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {section !== "overview" && section !== "commissions" && section !== "portals" && section !== "users" && section !== "financials" && section !== "emails" && section !== "support" && section !== "notifications" && (
            <div className="sa-empty" style={{ marginTop: '40px', textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <BsBox style={{ fontSize: '40px', color: '#94a3b8', marginBottom: '15px' }} />
              <strong style={{ display: 'block', fontSize: '18px', color: '#334155' }}>{section.charAt(0).toUpperCase() + section.slice(1)} Module</strong>
              <p style={{ color: '#64748b', margin: '10px 0 0 0' }}>This module is currently under development.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
