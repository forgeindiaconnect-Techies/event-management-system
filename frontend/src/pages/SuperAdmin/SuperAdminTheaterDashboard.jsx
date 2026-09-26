import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  BsBox, BsBuilding, BsFilm, BsWallet2, BsChatDots, BsHouseDoor, 
  BsTicketPerforated, BsEnvelope, BsPeople, BsCashCoin, BsActivity, 
  BsGraphUp, BsSearch, BsArrowClockwise, BsEye, BsXLg, BsCheckCircle, 
  BsClockHistory, BsExclamationTriangle, BsHeadset, BsCheckLg, BsTelephone, 
  BsCheck2Circle, BsReply, BsShieldCheck, BsCashStack, BsQrCode,
  BsBell, BsMegaphone, BsTrash, BsSend, BsLockFill, BsUnlockFill, BsShieldShaded
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
      api.get("/super-admin/theaters/users").then(res => setUsersData(res.data)).catch(err => console.error(err));
    } else if (section === "financials") {
      api.get("/super-admin/theaters/payouts").then(res => setPayoutsData(res.data)).catch(err => console.error(err));
      loadRevenueSettings();
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
  }, [section, loadSupportData, loadEmailData, loadNotifications, loadRevenueSettings, portalsData.length]);

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="sa-page-heading" style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Theater Management</h2>
                <p style={{ color: '#64748b' }}>Overview and detailed metrics of all registered cinema partners.</p>
              </div>

              {/* 3 Metric Cards */}
              <div className="sa-page-cards three">
                <Metric 
                  icon={<BsBuilding />} 
                  label="Total Theaters" 
                  value={portalsData.length} 
                />
                <Metric 
                  icon={<BsActivity />} 
                  label="Active Theaters" 
                  value={portalsData.filter(t => t.status === 'Active').length} 
                />
                <Metric 
                  icon={<BsBox />} 
                  label="Inactive / Deleted" 
                  value={portalsData.filter(t => t.status !== 'Active').length} 
                />
              </div>

              {/* Theaters Data Table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Theater Directory</h3>
                  <input type="text" placeholder="Search theaters..." style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '250px' }} />
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater Name</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screens</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employees</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets Sold</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portalsData.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            No theater records found. Data will appear here once registered.
                          </td>
                        </tr>
                      ) : (
                        portalsData.map((theater) => (
                          <tr key={theater.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{theater.name}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.owner}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.screens}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.employees}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{theater.tickets?.toLocaleString() || 0}</td>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#10b981', fontSize: '0.9rem' }}>₹{theater.revenue?.toLocaleString() || 0}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ 
                                display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: theater.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                color: theater.status === 'Active' ? '#16a34a' : '#dc2626'
                              }}>
                                {theater.status}
                              </span>
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
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Portal Users Directory</h3>
                  <input type="text" placeholder="Search employees..." style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '250px' }} />
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
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            No users found. Users will be listed once added by theaters.
                          </td>
                        </tr>
                      ) : (
                        usersData.map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: '#4f46e5', fontSize: '0.9rem' }}>{user.empId}</td>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{user.name}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{user.email}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>{user.portalId}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{user.theater}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ 
                                display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: user.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                color: user.status === 'Active' ? '#16a34a' : '#dc2626'
                              }}>
                                {user.status}
                              </span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="sa-page-heading" style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Platform Financials</h2>
                <p style={{ color: '#64748b' }}>Manage gross volume, platform profit, and pending payouts to theaters.</p>
              </div>

              {/* 3 Metric Cards */}
              <div className="sa-page-cards three">
                <Metric 
                  icon={<BsCashCoin />} 
                  label="Gross Ticket Volume" 
                  value={`₹${Number(payoutsData.reduce((acc, p) => acc + (p.owed || 0) + ((p.owed || 0) * 0.1), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle="Total processed (Base + Fees)"
                />
                <Metric 
                  icon={<BsWallet2 />} 
                  label="Platform Profit" 
                  value={`₹${Number(payoutsData.reduce((acc, p) => acc + ((p.owed || 0) * 0.1), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle="10% Convenience fees collected"
                />
                <Metric 
                  icon={<BsBuilding />} 
                  label="Pending Payouts" 
                  value={`₹${Number(payoutsData.reduce((acc, p) => acc + (p.owed || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle="Owed to theater partners"
                />
              </div>

              {/* Payouts Ledger Table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Pending Theater Payouts</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Weekly settlement ledger. Mark as paid once wired.</p>
                  </div>
                  <button className="btn" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '600', color: '#334155' }}>Export CSV</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theater</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets Sold</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Comm.</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Owed</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Ref</th>
                        <th style={{ padding: '15px 24px', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutsData.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            No pending payouts to process at this time.
                          </td>
                        </tr>
                      ) : (
                        payoutsData.map((payout) => (
                          <tr key={payout.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' }, opacity: payout.status === 'Paid' ? 0.6 : 1 }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{payout.theater}</td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.9rem' }}>{payout.tickets?.toLocaleString() || 0}</td>
                            <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '0.9rem' }}>{payout.comm}</td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', color: payout.status === 'Paid' ? '#94a3b8' : '#dc2626', fontSize: '1rem' }}>₹{payout.owed?.toLocaleString() || 0}</td>
                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontFamily: 'monospace' }}>{payout.acc}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              {payout.status === 'Pending' ? (
                                <button style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Settle Payment</button>
                              ) : (
                                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#64748b' }}>Settled</span>
                              )}
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
