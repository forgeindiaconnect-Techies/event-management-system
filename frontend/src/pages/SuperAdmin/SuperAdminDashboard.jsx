import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BsBarChart,
  BsBox,
  BsBuilding,
  BsCalendarEvent,
  BsCashCoin,
  BsCheckCircle,
  BsClockHistory,
  BsGear,
  BsGrid,
  BsPeople,
  BsPerson,
  BsReceipt,
  BsSearch,
  BsShieldCheck,
  BsTelephone,
  BsEnvelope,
  BsTrash,
  BsPencilSquare,
  BsEye,
  BsArrowClockwise,
  BsXCircle,
  BsList,
  BsCreditCard,
  BsXLg,
  BsHeadset,
  BsChatLeftText,
} from "react-icons/bs";
import api from "../../api/axiosConfig";
import { NotificationBell } from "../../components/Navbar/AdminNavbar";

const navigation = [
  ["Overview", "/super-admin", BsGrid],
  ["Portals", "/super-admin/portals", BsBuilding],
  ["Revenue", "/super-admin/revenue", BsCashCoin],
  ["Subscriptions", "/super-admin/subscriptions", BsReceipt],
  ["Email Delivery", "/super-admin/email-delivery", BsEnvelope],
  ["Support Requests", "/super-admin/support", BsHeadset],
  ["Users", "/super-admin/users", BsPeople],
  ["Reports", "/super-admin/reports", BsBarChart],
  ["Settings", "/super-admin/settings", BsGear],
];

const pageDetails = {
  overview: ["Super Admin Dashboard", "Monitor portals, users, events and registrations across the platform."],
  portals: ["Portal Management", "View and manage every company portal on BackRooms."],
  deletedPortals: ["Portal Management", "Review deleted portal accounts retained for historical records."],
  revenue: ["Revenue", "Track platform earnings and portal revenue performance."],
  subscriptions: ["Subscriptions", "Review portal plans and subscription distribution."],
  emailDelivery: ["Email Delivery", "Monitor queued emails, delivery failures and retry attempts."],
  support: ["Support Requests", "Review feedback, reported problems and support conversations."],
  users: ["Platform Users", "See user activity across all company portals."],
  reports: ["Reports", "A consolidated view of platform performance and activity."],
  settings: ["Settings", "Manage your super admin workspace preferences."],
};

function SuperAdminDashboard({ section = "overview" }) {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const [dashboard, setDashboard] = useState({});
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [deletingPortalId, setDeletingPortalId] = useState(null);
  const [portalPendingDeletion, setPortalPendingDeletion] = useState(null);
  const [portalDeletionReason, setPortalDeletionReason] = useState("");
  const [portalDeletionError, setPortalDeletionError] = useState("");
  const [profile, setProfile] = useState(() => ({
    id: localStorage.getItem("userId") || "",
    firstName: localStorage.getItem("firstName") || "",
    lastName: localStorage.getItem("lastName") || "",
    email: localStorage.getItem("email") || "superadmin@backrooms.com",
    phoneNumber: localStorage.getItem("phoneNumber") || "",
    role: localStorage.getItem("role") || "SUPER_ADMIN",
  }));

  const refreshPlatformData = useCallback(async () => {
    try {
      const [dashboardRes, portalsRes] = await Promise.all([
        api.get("/super-admin/dashboard"),
        api.get("/super-admin/portals"),
      ]);
      setDashboard(dashboardRes.data || {});
      setPortals(portalsRes.data || []);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Unable to load super admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlatformData();
  }, [refreshPlatformData]);

  useEffect(() => {
    if (!profile.id) return;

    api.get(`/users/${profile.id}`)
      .then(({ data }) => {
        const user = data || {};
        setProfile((current) => ({
          ...current,
          ...user,
          role: user.role?.roleName || user.roleName || current.role,
          phoneNumber: user.phoneNumber || user.phone || current.phoneNumber,
        }));
      })
      .catch((error) => console.error("Unable to load super admin profile", error));
  }, [profile.id]);

  useEffect(() => {
    if (!showProfile) return undefined;

    const closeProfileOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", closeProfileOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeProfileOnOutsideClick);
  }, [showProfile]);

  const filteredPortals = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return portals;
    return portals.filter((portal) =>
      [portal.portalName, portal.portalCode, portal.ownerName, portal.ownerEmail]
        .some((field) => String(field || "").toLowerCase().includes(value))
    );
  }, [portals, search]);

  const money = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  const [title, subtitle] = pageDetails[section] || pageDetails.overview;
  const email = profile.email;
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Super Admin";
  const initials = `${profile.firstName?.[0] || "S"}${profile.lastName?.[0] || "A"}`.toUpperCase();

  const logout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.clear();
    navigate("/");
  };

  const requestPortalDeletion = (portal) => {
    setPortalPendingDeletion(portal);
    setPortalDeletionReason("");
    setPortalDeletionError("");
  };

  const closePortalDeletion = () => {
    if (deletingPortalId) return;
    setPortalPendingDeletion(null);
    setPortalDeletionReason("");
    setPortalDeletionError("");
  };

  const deletePortal = async () => {
    const portal = portalPendingDeletion;
    const reason = portalDeletionReason.trim();
    if (!portal) return;
    if (reason.length < 10) {
      setPortalDeletionError("Enter a clear deletion reason of at least 10 characters.");
      return;
    }

    const confirmed = window.confirm(
      `Final confirmation: permanently delete ${portal.portalName}?\n\nReason: ${reason}\n\nAll linked users will be logged out and disabled. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingPortalId(portal.portalId);
      setMessage("");
      await api.delete(`/super-admin/portals/${portal.portalId}`, { params: { reason } });
      await refreshPlatformData();
      setMessage(`${portal.portalName} was deleted. It remains visible for historical reporting, and its payment records are preserved.`);
      setPortalPendingDeletion(null);
      setPortalDeletionReason("");
      setPortalDeletionError("");
    } catch (error) {
      console.error(error);
      setPortalDeletionError(error.response?.data?.message || "Unable to delete this portal.");
    } finally {
      setDeletingPortalId(null);
    }
  };

  return (
    <div className="sa-app-shell">
      <header className="sa-topbar">
        <button className="sa-topbar-brand" onClick={() => navigate("/super-admin")}>
          <BsBox /><strong>BackRooms</strong><i /> <span>Platform Admin</span>
        </button>
        <div className="sa-topbar-profile" ref={profileRef}>
          <NotificationBell />
          <button
            onClick={() => setShowProfile(true)}
            title="Open profile"
            aria-expanded={showProfile}
          >
            <span><strong>{fullName}</strong><small>Super Admin</small></span>
            <b>{initials}</b>
          </button>
          {showProfile && (
            <div className="sa-profile-menu">
              <div className="sa-profile-menu-head">
                <b>{initials}</b>
                <span><strong>{fullName}</strong><small>{email}</small></span>
              </div>
              <div className="sa-profile-details">
                <ProfileDetail icon={<BsPerson />} label="Full name" value={fullName} />
                <ProfileDetail icon={<BsEnvelope />} label="Email address" value={email} />
                <ProfileDetail icon={<BsTelephone />} label="Phone number" value={profile.phoneNumber || "Not added"} />
                <ProfileDetail icon={<BsShieldCheck />} label="Role" value={formatRole(profile.role)} />
                <ProfileDetail icon={<BsBox />} label="Account ID" value={profile.id || "Not available"} />
              </div>
              <button type="button" className="sa-logout-button" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className="super-admin-page">
        <button className="sa-mobile-menu-button" type="button" onClick={() => setShowMobileMenu(true)} aria-label="Open navigation"><BsList /></button>
        <aside className={`super-admin-sidebar ${showMobileMenu ? "mobile-open" : ""}`}>
          <nav aria-label="Super admin navigation">
            {navigation.map(([label, path, Icon]) => (
              <NavLink key={path} to={path} end={path === "/super-admin"} onClick={() => setShowMobileMenu(false)}>
                <Icon /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        {showMobileMenu && <button className="sa-mobile-menu-backdrop" type="button" onClick={() => setShowMobileMenu(false)} aria-label="Close navigation" />}

        <main className="super-admin-main">
          <div className="sa-page-heading"><h1>{title}</h1><p>{subtitle}</p></div>
          {message && <div className="alert alert-info">{message}</div>}
          {loading ? <DashboardLoader /> : (
            <PageContent section={section} dashboard={dashboard} portals={filteredPortals} allPortals={portals} money={money} search={search} setSearch={setSearch} email={email} onDeletePortal={requestPortalDeletion} deletingPortalId={deletingPortalId} onPlatformChange={refreshPlatformData} />
          )}
        </main>
      </div>
      {portalPendingDeletion && (
        <div className="sa-sub-modal-backdrop" onMouseDown={closePortalDeletion}>
          <section className="sa-delete-portal-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-portal-title">
            <header>
              <div><span>Permanent action</span><h2 id="delete-portal-title">Delete {portalPendingDeletion.portalName}?</h2></div>
              <button type="button" onClick={closePortalDeletion} disabled={Boolean(deletingPortalId)} aria-label="Close deletion dialog"><BsXLg /></button>
            </header>
            <div className="sa-delete-portal-modal-body">
              <p>This disables every linked user, removes the portal from active use, and moves its events to trash. Historical payment records remain available.</p>
              <label htmlFor="portal-deletion-reason">Reason for deletion <b>*</b></label>
              <textarea id="portal-deletion-reason" value={portalDeletionReason} onChange={(event) => { setPortalDeletionReason(event.target.value); setPortalDeletionError(""); }} maxLength={1000} placeholder="Example: Portal owner requested permanent account closure." autoFocus />
              <small>{portalDeletionReason.trim().length}/1000 characters · minimum 10</small>
              {portalDeletionError && <div className="alert alert-danger mb-0">{portalDeletionError}</div>}
            </div>
            <footer>
              <button type="button" className="btn btn-light" onClick={closePortalDeletion} disabled={Boolean(deletingPortalId)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={deletePortal} disabled={Boolean(deletingPortalId) || portalDeletionReason.trim().length < 10}>{deletingPortalId ? "Deleting..." : "Continue to final confirmation"}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

function PageContent({ section, dashboard, portals, allPortals, money, search, setSearch, email, onDeletePortal, deletingPortalId, onPlatformChange }) {
  const currentPortals = portals.filter((portal) => portal.status !== "Deleted");
  const deletedPortals = portals.filter((portal) => portal.status === "Deleted");
  const currentAllPortals = allPortals.filter((portal) => portal.status !== "Deleted");

  if (section === "portals") return <div className="sa-portal-sections">
    <PortalPageTabs active="active" />
    <PortalTable
      portals={currentPortals}
      money={money}
      search={search}
      setSearch={setSearch}
      onDeletePortal={onDeletePortal}
      deletingPortalId={deletingPortalId}
      title="Current portals"
      subtitle="Current portal accounts with Active, Expired, or Deactivated subscription access."
      emptyText="No current portals found."
    />
  </div>;

  if (section === "deletedPortals") return <div className="sa-portal-sections">
    <PortalPageTabs active="deleted" />
    <PortalTable
      portals={deletedPortals}
      money={money}
      search={search}
      setSearch={setSearch}
      readOnly
      showEventRevenue={false}
      title="Deleted portals"
      subtitle="Historical portal accounts kept separately for audit and payment records."
      emptyText="No deleted portals found."
    />
  </div>;

  if (section === "revenue") return <>
    <div className="sa-page-cards three"><Metric icon={<BsCashCoin />} label="Platform Revenue" value={money(dashboard.totalRevenue)} /><Metric icon={<BsBarChart />} label="Monthly Platform Revenue" value={money(dashboard.monthlyRevenue)} /><Metric to="/super-admin/portals" icon={<BsBuilding />} label="Active Subscriptions" value={dashboard.activePortals} /></div>
    <Panel title="Event revenue by portal" subtitle="Paid event-registration revenue received by active portal accounts. Deleted portals are excluded, and this amount is not included in platform subscription revenue."><PortalTable portals={currentPortals} money={money} compact /></Panel>
  </>;

  if (section === "subscriptions") {
    return <SuperAdminSubscriptions money={money} onPlatformChange={onPlatformChange} />;
  }

  if (section === "emailDelivery") return <EmailDeliveryMonitor />;

  if (section === "support") return <SupportRequestManagement />;

  if (section === "users") return <>
    <div className="sa-page-cards three"><Metric icon={<BsPeople />} label="Total Users" value={dashboard.totalUsers} /><Metric to="/super-admin/portals" icon={<BsBuilding />} label="Portals" value={dashboard.totalPortals} /><Metric to="/super-admin/reports" icon={<BsCalendarEvent />} label="Registrations" value={dashboard.totalRegistrations} /></div>
    <Panel title="Users by portal" subtitle="User totals for current portals."><SimplePortalList portals={currentAllPortals} field="totalUsers" label="users" /></Panel>
  </>;

  if (section === "reports") return <div className="sa-page-cards four"><Metric to="/super-admin/portals" icon={<BsBuilding />} label="Portals" value={dashboard.totalPortals} /><Metric to="/super-admin/users" icon={<BsPeople />} label="Users" value={dashboard.totalUsers} /><Metric icon={<BsCalendarEvent />} label="Events" value={dashboard.totalEvents} /><Metric icon={<BsCheckCircle />} label="Registrations" value={dashboard.totalRegistrations} /></div>;

  if (section === "settings") return <Panel title="Account preferences" subtitle="Your current super admin account details."><div className="sa-settings-form"><label>Email address<input value={email} readOnly /></label><label>Workspace<input value="BackRooms Platform Admin" readOnly /></label><p>Authentication and security settings are managed by the platform.</p></div></Panel>;

  const activeRate = Number(dashboard.totalPortals || 0)
    ? Math.round((Number(dashboard.activePortals || 0) / Number(dashboard.totalPortals)) * 100)
    : 0;

  return <div className="sa-innovative-overview">
    <section className="sa-glance-card">
      <div className="sa-visual-card-heading"><div><span>Live platform</span><h2>System at a Glance</h2></div><BsGrid /></div>
      <div className="sa-glance-map">
        <GlanceMetric to="/super-admin/portals" className="portals" icon={<BsBuilding />} label="Total portals" value={dashboard.totalPortals} />
        <GlanceMetric to="/super-admin/reports" className="events" icon={<BsCalendarEvent />} label="Total events" value={dashboard.totalEvents} />
        <Link to="/super-admin/users" className="sa-core-metric" aria-label="View platform users"><div><strong>{Number(dashboard.totalUsers || 0).toLocaleString("en-IN")}</strong><span>Total users</span></div></Link>
        <GlanceMetric to="/super-admin/portals" className="active" icon={<BsCheckCircle />} label="Active portals" value={dashboard.activePortals} />
        <GlanceMetric to="/super-admin/reports" className="registrations" icon={<BsPeople />} label="Registrations" value={dashboard.totalRegistrations} />
      </div>
    </section>

    <section className="sa-flow-card">
      <div className="sa-visual-card-heading"><div><span>Financial overview</span><h2>Revenue Flow</h2></div><BsCashCoin /></div>
      <Link to="/super-admin/revenue" className="sa-flow-total sa-quick-metric" aria-label="Open revenue page"><span>Platform revenue</span><strong>{money(dashboard.totalRevenue)}</strong><small>Confirmed subscription payments only</small></Link>
      <div className="sa-flow-track"><i /><i /><i /><i /><i /></div>
      <div className="sa-flow-stats"><Link to="/super-admin/revenue" className="sa-quick-metric" aria-label="View monthly revenue"><div><span>This month</span><strong>{money(dashboard.monthlyRevenue)}</strong></div></Link><Link to="/super-admin/portals" className="sa-quick-metric" aria-label="View portal health"><div><span>Portal health</span><strong>{activeRate}%</strong></div></Link></div>
    </section>

    <section className="sa-activity-card">
      <div className="sa-activity-copy"><span>Progress & activity</span><h2>Platform health</h2><p>{dashboard.activePortals || 0} of {dashboard.totalPortals || 0} portals are active and operating.</p></div>
      <div className="sa-activity-body">
        <div className="sa-activity-ring" style={{ "--progress": `${activeRate * 3.6}deg` }}><div><strong>{activeRate}%</strong><span>Active</span></div></div>
        <div className="sa-activity-metrics">
          <Link to="/super-admin/reports" className="sa-activity-stat sa-quick-metric" aria-label="View event reports"><span>Events created</span><strong>{dashboard.totalEvents || 0}</strong><small>Across all portals</small></Link>
          <Link to="/super-admin/reports" className="sa-activity-stat sa-quick-metric" aria-label="View registration reports"><span>Registrations</span><strong>{dashboard.totalRegistrations || 0}</strong><small>Total participants</small></Link>
        </div>
      </div>
    </section>
  </div>;
}

function EmailDeliveryMonitor() {
  const [deliveries, setDeliveries] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [status, setStatus] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [retryingId, setRetryingId] = useState(null);

  const loadDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const params = { page: 0, size: 100 };
      if (status) params.status = status;
      if (recipientEmail.trim()) params.recipientEmail = recipientEmail.trim();
      const [deliveryResponse, statisticsResponse] = await Promise.all([
        api.get("/email/deliveries", { params }),
        api.get("/email/deliveries/statistics"),
      ]);
      setDeliveries(deliveryResponse.data?.content || []);
      setStatistics(statisticsResponse.data || {});
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Unable to load email delivery records.");
    } finally {
      setLoading(false);
    }
  }, [status, recipientEmail]);

  useEffect(() => {
    const timer = window.setTimeout(loadDeliveries, 250);
    return () => window.clearTimeout(timer);
  }, [loadDeliveries]);

  const retryDelivery = async (delivery) => {
    try {
      setRetryingId(delivery.id);
      setMessage("");
      await api.post(`/email/deliveries/${delivery.id}/retry`);
      setMessage(`Email #${delivery.id} was queued for retry.`);
      await loadDeliveries();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to retry this email.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="sa-subscriptions-page">
      <div className="sa-page-cards four email-delivery-metrics">
        <Metric icon={<BsReceipt />} label="Total Emails" value={statistics.TOTAL || 0} />
        <Metric icon={<BsClockHistory />} label="Pending" value={statistics.PENDING || 0} />
        <Metric icon={<BsCheckCircle />} label="Sent" value={statistics.SENT || 0} />
        <Metric icon={<BsXCircle />} label="Failed" value={statistics.FAILED || 0} />
      </div>

      {message && <div className="alert alert-info mb-0">{message}</div>}

      <Panel title="Email delivery history" subtitle="Inspect SMTP delivery status and retry failed messages.">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <select className="form-select" style={{ width: 190 }} value={status}
            onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <input className="form-control" style={{ maxWidth: 330 }} value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="Filter by recipient email" />
          <button type="button" className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={loadDeliveries}><BsArrowClockwise /> Refresh</button>
        </div>

        <div className="table-responsive">
          <table className="table align-middle sa-native-table email-delivery-table">
            <thead><tr><th>Recipient</th><th>Subject</th><th>Type</th><th>Status</th><th>Attempts</th><th>Created</th><th>Failure</th><th>Action</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="8"><div className="text-center text-muted py-4">Loading email deliveries...</div></td></tr>}
              {!loading && deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td><strong>{delivery.recipientEmail}</strong><small className="d-block text-muted">#{delivery.id}</small></td>
                  <td style={{ minWidth: 190 }}>{delivery.subject}</td>
                  <td><small>{String(delivery.notificationType || "SYSTEM_ALERT").replaceAll("_", " ")}</small></td>
                  <td><span className={`status ${emailStatusClass(delivery.status)}`}>{delivery.status}</span></td>
                  <td>{delivery.retryCount || 0}/{delivery.maxRetries || 3}</td>
                  <td><small>{formatEmailDeliveryDate(delivery.createdAt)}</small></td>
                  <td className="email-failure-cell">
                    <small className={delivery.failureReason ? "text-danger" : "text-muted"}>
                      {friendlyEmailFailure(delivery.failureReason)}
                    </small>
                  </td>
                  <td>
                    {delivery.status === "FAILED" ? (
                      <button type="button" className="btn btn-sm btn-outline-primary"
                        disabled={retryingId === delivery.id}
                        onClick={() => retryDelivery(delivery)}>
                        {retryingId === delivery.id ? "Queuing..." : "Retry"}
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!loading && !deliveries.length && <tr><td colSpan="8"><Empty text="No email deliveries match these filters." /></td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function emailStatusClass(status) {
  if (status === "SENT") return "active";
  if (status === "FAILED") return "cancelled";
  return "pending";
}

function friendlyEmailFailure(reason) {
  if (!reason) return "—";
  const value = String(reason).toLowerCase();
  if (value.includes("mailconnectexception") || value.includes("couldn't connect") || value.includes("connection failed")) {
    return "Unable to connect to the mail server.";
  }
  if (value.includes("authentication") || value.includes("bad credentials") || value.includes("username and password not accepted")) {
    return "Mail account authentication failed.";
  }
  if (value.includes("timed out") || value.includes("timeout")) {
    return "The mail server did not respond in time.";
  }
  if (value.includes("invalid") && value.includes("address")) {
    return "The recipient email address is invalid.";
  }
  return "Email delivery failed. Retry or check the mail configuration.";
}

function formatEmailDeliveryDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN");
}

function SuperAdminSubscriptions({ money, onPlatformChange }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("subscriptions");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [audit, setAudit] = useState(null);
  const [workingId, setWorkingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      api.get("/super-admin/subscriptions"),
      api.get("/super-admin/subscription-plans"),
      api.get("/super-admin/subscription-payments"),
    ]);

    if (results[0].status === "fulfilled") {
      setSubscriptions(Array.isArray(results[0].value.data) ? results[0].value.data : []);
    }
    if (results[1].status === "fulfilled") {
      setPlans(Array.isArray(results[1].value.data) ? results[1].value.data : []);
    }
    if (results[2].status === "fulfilled") {
      setPayments(Array.isArray(results[2].value.data) ? results[2].value.data : []);
    }
    if (results.some((result) => result.status === "rejected")) {
      setNotice({ type: "error", text: "Some subscription data could not be loaded." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscriptions.filter((item) => {
      const matchesSearch = !query || [
        item.portalName, item.portalCode, item.ownerName, item.ownerEmail,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesSearch
        && (!statusFilter || item.status === statusFilter)
        && (!planFilter || item.planCode === planFilter);
    });
  }, [subscriptions, search, statusFilter, planFilter]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((item) => {
      const matchesSearch = !query || [
        item.portalName, item.paymentReference, item.invoiceNumber, item.planName,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesSearch && (!paymentStatus || item.status === paymentStatus);
    });
  }, [payments, search, paymentStatus]);

  const planCounts = useMemo(() => subscriptions.reduce((counts, item) => {
    const key = item.planCode || "NO_PLAN";
    return { ...counts, [key]: (counts[key] || 0) + 1 };
  }, {}), [subscriptions]);

  const updatePlan = async (form) => {
    if (!String(form.displayName || "").trim()) {
      setNotice({ type: "error", text: "Enter a name for the subscription plan." });
      return;
    }
    if (Number(form.monthlyPrice) <= 0 || Number(form.yearlyPrice) <= 0) {
      setNotice({ type: "error", text: "Monthly and yearly prices must be greater than zero." });
      return;
    }
    try {
      setSavingPlan(true);
      const payload = buildPlanPayload(form);
      if (form.isNew) {
        await api.post("/super-admin/subscription-plans", payload);
      } else {
        await api.put("/super-admin/subscription-plans/" + form.code, payload);
      }
      setEditingPlan(null);
      setNotice({ type: "success", text: form.displayName + (form.isNew ? " was created successfully." : " was updated successfully.") });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to update this plan.") });
    } finally {
      setSavingPlan(false);
    }
  };

  const cancelSubscription = async (item) => {
    const reason = window.prompt(
      "Enter the reason for immediately cancelling " + item.portalName + "'s subscription:"
    );
    if (!reason?.trim()) return;
    try {
      setWorkingId("cancel-" + item.portalId);
      await api.post("/super-admin/subscriptions/cancel", {
        portalId: String(item.portalId),
        reason: reason.trim(),
      });
      setNotice({ type: "success", text: item.portalName + "'s subscription was cancelled." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to cancel subscription.") });
    } finally {
      setWorkingId("");
    }
  };

  const cancelScheduledPlan = async (item) => {
    const reason = window.prompt(
      "Enter the reason for cancelling the scheduled " + item.nextPlanName + " plan for " + item.portalName + ":"
    );
    if (!reason?.trim()) return;
    try {
      setWorkingId("cancel-scheduled-" + item.portalId);
      await api.post("/super-admin/subscriptions/cancel-scheduled-plan", {
        portalId: String(item.portalId),
        reason: reason.trim(),
      });
      setNotice({ type: "success", text: item.portalName + "'s scheduled plan change was cancelled." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to cancel scheduled plan change.") });
    } finally {
      setWorkingId("");
    }
  };

  const extendSubscription = async (item) => {
    const daysInput = window.prompt(
      "How many days should " + item.portalName + "'s " + item.planName + " plan be extended?"
    );
    if (daysInput === null) return;
    const days = Number(daysInput);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      setNotice({ type: "error", text: "Enter a whole number of days between 1 and 3650." });
      return;
    }
    const reason = window.prompt("Enter the reason for this extension:");
    if (!reason?.trim()) return;
    try {
      setWorkingId("extend-" + item.portalId);
      await api.post("/super-admin/subscriptions/extend", {
        portalId: String(item.portalId),
        days: String(days),
        reason: reason.trim(),
      });
      setNotice({ type: "success", text: item.portalName + "'s " + item.planName + " plan was extended by " + days + " days." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to extend subscription.") });
    } finally {
      setWorkingId("");
    }
  };

  const reduceSubscriptionDays = async (item) => {
    const daysInput = window.prompt(
      "How many days should be removed from " + item.portalName + "'s plan?"
    );
    if (daysInput === null) return;
    const days = Number(daysInput);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      setNotice({ type: "error", text: "Enter a whole number of days between 1 and 3650." });
      return;
    }
    const reason = window.prompt("Enter the reason for reducing the plan period:");
    if (!reason?.trim()) return;
    try {
      setWorkingId("reduce-" + item.portalId);
      await api.post("/super-admin/subscriptions/reduce-days", {
        portalId: String(item.portalId), days: String(days), reason: reason.trim(),
      });
      setNotice({ type: "success", text: item.portalName + "'s plan was reduced by " + days + " days." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to reduce subscription days.") });
    } finally {
      setWorkingId("");
    }
  };

  const changeCurrentPlan = async (item) => {
    const planCode = window.prompt(
      "Enter the replacement plan: STANDARD, PROFESSIONAL, ENTERPRISE, or CUSTOM",
      item.planCode === "STANDARD" ? "PROFESSIONAL" : "STANDARD"
    );
    if (!planCode?.trim()) return;
    const normalizedPlan = planCode.trim().toUpperCase();
    if (!["STANDARD", "PROFESSIONAL", "ENTERPRISE", "CUSTOM"].includes(normalizedPlan)) {
      setNotice({ type: "error", text: "Choose STANDARD, PROFESSIONAL, ENTERPRISE, or CUSTOM." });
      return;
    }
    const reason = window.prompt("Enter the reason for replacing the current plan:");
    if (!reason?.trim()) return;
    try {
      setWorkingId("change-plan-" + item.portalId);
      await api.post("/super-admin/subscriptions/change-plan", {
        portalId: String(item.portalId), planCode: normalizedPlan, reason: reason.trim(),
      });
      setNotice({ type: "success", text: item.portalName + " was moved to " + normalizedPlan + "." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to change current plan.") });
    } finally {
      setWorkingId("");
    }
  };

  const refundPayment = async (payment) => {
    const reason = window.prompt(
      "Enter the reason for refunding " + payment.paymentReference + ":"
    );
    if (!reason?.trim()) return;
    try {
      setWorkingId("refund-" + payment.paymentId);
      await api.post("/super-admin/subscriptions/refund", {
        paymentReference: payment.paymentReference,
        reason: reason.trim(),
      });
      setNotice({ type: "success", text: "Payment marked as refunded." });
      await loadData();
      await onPlatformChange();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to refund payment.") });
    } finally {
      setWorkingId("");
    }
  };

  const recoverPayment = async (payment) => {
    const reason = window.prompt(
      "Enter the reason for manually recovering this confirmed payment:"
    );
    if (!reason?.trim()) return;
    try {
      setWorkingId("recover-" + payment.paymentId);
      await api.post("/super-admin/subscriptions/recover", {
        paymentReference: payment.paymentReference,
        gatewayPaymentId: payment.gatewayPaymentId,
        reason: reason.trim(),
      });
      setNotice({ type: "success", text: "Paid subscription recovered successfully." });
      await loadData();
      await onPlatformChange();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to recover payment.") });
    } finally {
      setWorkingId("");
    }
  };

  const deletePaymentHistory = async (payment) => {
    const confirmed = window.confirm(
      "Delete payment history " + payment.paymentReference + "? The active subscription will not be deleted."
    );
    if (!confirmed) return;
    const reason = window.prompt("Enter the reason for deleting this payment record:");
    if (!reason?.trim()) return;
    try {
      setWorkingId("delete-payment-" + payment.paymentId);
      await api.delete(
        "/super-admin/subscription-payments/" + encodeURIComponent(payment.paymentReference),
        { params: { reason: reason.trim() } }
      );
      setNotice({ type: "success", text: "Payment history was deleted. The subscription remains unchanged." });
      await loadData();
      await onPlatformChange();
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to delete payment history.") });
    } finally {
      setWorkingId("");
    }
  };

  const openReceipt = async (payment) => {
    try {
      setWorkingId("receipt-" + payment.paymentId);
      const response = await api.get(
        "/super-admin/subscription-payments/" + payment.paymentReference + "/receipt"
      );
      setReceipt(response.data);
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to load receipt.") });
    } finally {
      setWorkingId("");
    }
  };

  const openAudit = async (item) => {
    try {
      setWorkingId("audit-" + item.portalId);
      const response = await api.get(
        "/super-admin/subscriptions/audit/" + item.portalId
      );
      setAudit({ portalName: item.portalName, entries: response.data || [] });
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to load audit history.") });
    } finally {
      setWorkingId("");
    }
  };

  if (loading) return <DashboardLoader />;

  return (
    <div className="sa-subscriptions-page">
      {notice.text && (
        <div className={"sa-subscription-notice " + notice.type}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice({ type: "", text: "" })}><BsXLg /></button>
        </div>
      )}

      <div className="sa-plan-management-heading">
        <div><h2>Subscription plans</h2><p>Configure the plans available to portal administrators.</p></div>
        {!plans.some((plan) => plan.code === "CUSTOM") && (
          <button type="button" onClick={() => setEditingPlan(newCustomPlan())}>+ Add Plan</button>
        )}
      </div>

      <div className="sa-plan-management-grid">
        {plans.map((plan) => (
          <article className={"sa-managed-plan " + String(plan.code).toLowerCase()} key={plan.code}>
            <div className="sa-managed-plan-head">
              <span><BsShieldCheck /></span>
              <button onClick={() => setEditingPlan({ ...plan })}>
                <BsPencilSquare /> Edit
              </button>
            </div>
            <small>{plan.code}</small>
            <h2>{plan.displayName}</h2>
            <strong>{money(plan.monthlyPrice)}<i>/month</i></strong>
            <div>
              <span>{planCounts[plan.code] || 0} portals</span>
              <b className={plan.active ? "active" : "disabled"}>
                {plan.active ? "Available" : "Disabled"}
              </b>
            </div>
          </article>
        ))}
      </div>

      <section className="sa-subscription-workspace">
        <div className="sa-subscription-toolbar">
          <div className="sa-subscription-tabs">
            <button
              className={activeView === "subscriptions" ? "active" : ""}
              onClick={() => setActiveView("subscriptions")}
            >
              <BsShieldCheck /> Portal subscriptions
            </button>
            <button
              className={activeView === "payments" ? "active" : ""}
              onClick={() => setActiveView("payments")}
            >
              <BsCreditCard /> Payment history
            </button>
          </div>
          <label className="sa-subscription-search">
            <BsSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search portal or reference..."
            />
          </label>
        </div>

        {activeView === "subscriptions" ? (
          <>
            <div className="sa-subscription-filters">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
                <option value="">All plans</option>
                {plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.displayName}</option>)}
              </select>
              <span>{filteredSubscriptions.length} subscriptions</span>
            </div>
            <SubscriptionAdminTable
              subscriptions={filteredSubscriptions}
              workingId={workingId}
              onCancel={cancelSubscription}
              onCancelScheduled={cancelScheduledPlan}
              onExtend={extendSubscription}
              onReduce={reduceSubscriptionDays}
              onChangePlan={changeCurrentPlan}
              onAudit={openAudit}
            />
          </>
        ) : (
          <>
            <div className="sa-subscription-filters">
              <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
                <option value="">All payment statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <span>{filteredPayments.length} payments</span>
            </div>
            <SubscriptionPaymentAdminTable
              payments={filteredPayments}
              money={money}
              workingId={workingId}
              onReceipt={openReceipt}
              onRefund={refundPayment}
              onRecover={recoverPayment}
              onDelete={deletePaymentHistory}
            />
          </>
        )}
      </section>

      {editingPlan && (
        <PlanEditorModal
          plan={editingPlan}
          saving={savingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={updatePlan}
        />
      )}
      {receipt && <AdminReceiptModal receipt={receipt} money={money} onClose={() => setReceipt(null)} />}
      {audit && <AuditModal audit={audit} onClose={() => setAudit(null)} />}
    </div>
  );
}

function SubscriptionAdminTable({ subscriptions, workingId, onCancel, onCancelScheduled, onExtend, onReduce, onChangePlan, onAudit }) {
  return (
    <div className="table-responsive">
      <table className="sa-subscription-table">
        <thead><tr><th>Portal</th><th>Plan</th><th>Status</th><th>Period</th><th>Remaining</th><th>Next plan</th><th>Actions</th></tr></thead>
        <tbody>
          {subscriptions.map((item) => (
            <tr key={item.subscriptionId}>
              <td><strong>{item.portalName}</strong><small>{item.ownerEmail || item.portalCode}</small></td>
              <td><strong>{item.planName}</strong><small>{formatSubscriptionLabel(item.billingCycle)}</small></td>
              <td><span className={"sa-sub-status " + String(item.status).toLowerCase()}>{formatSubscriptionLabel(item.status)}</span></td>
              <td><strong>{shortDate(item.startDate)}</strong><small>to {shortDate(item.endDate)}</small></td>
              <td><strong>{item.daysRemaining ?? 0} days</strong></td>
              <td>{item.nextPlanName ? <><strong>{item.nextPlanName}</strong><small>{shortDate(item.nextPlanStartsAt)}</small></> : "—"}</td>
              <td>
                <div className="sa-sub-actions">
                  <button title="Audit history" onClick={() => onAudit(item)} disabled={workingId === "audit-" + item.portalId}><BsEye /></button>
                  {["ACTIVE", "TRIAL"].includes(item.status) && (
                    <button className="recover" title="Extend current plan" onClick={() => onExtend(item)} disabled={workingId === "extend-" + item.portalId}><BsCalendarEvent /></button>
                  )}
                  {["ACTIVE", "TRIAL"].includes(item.status) && (
                    <button title="Reduce plan days" onClick={() => onReduce(item)} disabled={workingId === "reduce-" + item.portalId}><BsClockHistory /></button>
                  )}
                  {["ACTIVE", "TRIAL"].includes(item.status) && (
                    <button title="Replace current plan" onClick={() => onChangePlan(item)} disabled={workingId === "change-plan-" + item.portalId}><BsArrowClockwise /></button>
                  )}
                  {item.nextPlanName && (
                    <button className="danger" title="Cancel scheduled plan change" onClick={() => onCancelScheduled(item)} disabled={workingId === "cancel-scheduled-" + item.portalId}><BsCalendarEvent /></button>
                  )}
                  {["ACTIVE", "TRIAL"].includes(item.status) && (
                    <button className="danger" title="Cancel immediately" onClick={() => onCancel(item)} disabled={workingId === "cancel-" + item.portalId}><BsXCircle /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {!subscriptions.length && <tr><td colSpan="7"><Empty text="No subscriptions match these filters." /></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionPaymentAdminTable({ payments, money, workingId, onReceipt, onRefund, onRecover, onDelete }) {
  return (
    <div className="table-responsive">
      <table className="sa-subscription-table payments">
        <thead><tr><th>Portal</th><th>Reference</th><th>Plan</th><th>Amount</th><th>Status</th><th>Paid</th><th>Actions</th></tr></thead>
        <tbody>
          {payments.map((item) => (
            <tr key={item.paymentId}>
              <td><strong>{item.portalName}</strong><small>Portal #{item.portalId}</small></td>
              <td><strong>{item.paymentReference}</strong><small>{item.invoiceNumber || item.gatewayOrderId}</small></td>
              <td><strong>{item.planName}</strong><small>{formatSubscriptionLabel(item.billingCycle)}</small></td>
              <td><strong>{money(item.amount)}</strong><small>{item.currency}</small></td>
              <td><span className={"sa-sub-status " + String(item.status).toLowerCase()}>{formatSubscriptionLabel(item.status)}</span></td>
              <td>{shortDate(item.paidAt || item.createdAt)}</td>
              <td>
                <div className="sa-sub-actions">
                  {["SUCCESS", "REFUNDED"].includes(item.status) && (
                    <button title="View receipt" onClick={() => onReceipt(item)} disabled={workingId === "receipt-" + item.paymentId}><BsReceipt /></button>
                  )}
                  {item.status === "SUCCESS" && !item.subscriptionId && (
                    <button className="recover" title="Recover subscription" onClick={() => onRecover(item)} disabled={workingId === "recover-" + item.paymentId}><BsArrowClockwise /></button>
                  )}
                  {item.status === "SUCCESS" && (
                    <button className="danger" title="Refund payment" onClick={() => onRefund(item)} disabled={workingId === "refund-" + item.paymentId}><BsCashCoin /></button>
                  )}
                  <button className="danger" title="Delete payment history" onClick={() => onDelete(item)} disabled={workingId === "delete-payment-" + item.paymentId}><BsTrash /></button>
                </div>
              </td>
            </tr>
          ))}
          {!payments.length && <tr><td colSpan="7"><Empty text="No payments match these filters." /></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PlanEditorModal({ plan, saving, onClose, onSave }) {
  const [form, setForm] = useState(plan);
  const limits = [
    ["maxActiveEvents", "Active events"],
    ["maxPortalUsers", "Portal users"],
    ["maxRegistrationsPerEvent", "Registrations / event"],
    ["maxTicketClassesPerEvent", "Ticket classes / event"],
    ["maxStaffInvitations", "Staff invitations"],
    ["maxSpeakersPerEvent", "Speakers / event"],
    ["maxExhibitorsPerEvent", "Exhibitors / event"],
    ["maxCustomRegistrationFields", "Custom form fields"],
    ["maxOrganizers", "Organizers"],
  ];
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="sa-sub-modal-backdrop" onMouseDown={onClose}>
      <div className="sa-plan-editor" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>Plan configuration</span><h2>{plan.isNew ? "Add extra plan" : `Edit ${plan.displayName}`}</h2></div><button onClick={onClose}><BsXLg /></button></header>
        <div className="sa-plan-editor-body">
          <div className="sa-plan-editor-grid">
            <label>Display name<input value={form.displayName || ""} onChange={(event) => change("displayName", event.target.value)} /></label>
            <label>Status<select value={String(form.active)} onChange={(event) => change("active", event.target.value === "true")} disabled={form.code === "STANDARD"}><option value="true">Available</option><option value="false">Disabled</option></select></label>
            <label>Monthly price<input type="number" min="1" value={form.monthlyPrice ?? ""} onChange={(event) => change("monthlyPrice", event.target.value)} /></label>
            <label>Yearly price<input type="number" min="1" value={form.yearlyPrice ?? ""} onChange={(event) => change("yearlyPrice", event.target.value)} /></label>
          </div>
          <label>Description<textarea rows="3" value={form.description || ""} onChange={(event) => change("description", event.target.value)} /></label>
          <h3>Usage limits <small>Use -1 for unlimited</small></h3>
          <div className="sa-plan-limit-grid">
            {limits.map(([key, label]) => <label key={key}>{label}<input type="number" min="-1" value={form[key] ?? ""} onChange={(event) => change(key, event.target.value)} /></label>)}
          </div>
          <h3>Included features</h3>
          <div className="sa-plan-feature-grid">
            {[
              ["customBranding", "Custom branding"],
              ["advancedReports", "Advanced reports"],
              ["whiteLabel", "White label"],
              ["prioritySupport", "Priority support"],
            ].map(([key, label]) => <label key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => change(key, event.target.checked)} />{label}</label>)}
          </div>
        </div>
        <footer><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => onSave(form)} disabled={saving}>{saving ? "Saving..." : form.isNew ? "Create plan" : "Save plan"}</button></footer>
      </div>
    </div>
  );
}

function AdminReceiptModal({ receipt, money, onClose }) {
  return (
    <div className="sa-sub-modal-backdrop" onMouseDown={onClose}>
      <div className="sa-admin-receipt" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>Subscription receipt</span><h2>{receipt.invoiceNumber}</h2></div><button onClick={onClose}><BsXLg /></button></header>
        <div className="sa-admin-receipt-party"><div><span>Portal</span><strong>{receipt.portalName}</strong><small>{receipt.ownerEmail}</small></div><div><span>Issued</span><strong>{shortDate(receipt.invoiceIssuedAt)}</strong><small>{receipt.portalCode}</small></div></div>
        <div className="sa-admin-receipt-line"><div><strong>{receipt.planName}</strong><small>{formatSubscriptionLabel(receipt.billingCycle)} subscription</small></div><strong>{money(receipt.amount)}</strong></div>
        <div className="sa-admin-receipt-meta"><span>Payment reference</span><strong>{receipt.paymentReference}</strong><span>Status</span><strong>{formatSubscriptionLabel(receipt.paymentStatus)}</strong><span>Access</span><strong>{shortDate(receipt.subscriptionStartDate)} – {shortDate(receipt.subscriptionEndDate)}</strong></div>
        <button className="sa-admin-print" onClick={() => window.print()}><BsReceipt /> Print receipt</button>
      </div>
    </div>
  );
}

function AuditModal({ audit, onClose }) {
  return (
    <div className="sa-sub-modal-backdrop" onMouseDown={onClose}>
      <div className="sa-audit-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>Subscription audit</span><h2>{audit.portalName}</h2></div><button onClick={onClose}><BsXLg /></button></header>
        <div className="sa-audit-list">
          {audit.entries.map((entry) => <div key={entry.id}><i /><span><strong>{formatSubscriptionLabel(entry.action)}</strong><small>{entry.previousPlan || "No plan"} → {entry.newPlan || "No change"}</small><p>{entry.reason || "No reason recorded"}</p><time>{shortDateTime(entry.createdAt)}</time></span></div>)}
          {!audit.entries.length && <Empty text="No audit entries for this portal." />}
        </div>
      </div>
    </div>
  );
}

function SupportRequestManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState({ status: "OPEN", priority: "MEDIUM", adminResponse: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await api.get("/support-requests"); setRequests(Array.isArray(data) ? data : []); }
    catch (requestError) { setError(responseMessage(requestError, "Unable to load support requests.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => requests.filter((request) => {
    const text = search.trim().toLowerCase();
    const matchesSearch = !text || [request.referenceCode, request.subject, request.description, request.requesterName, request.contactEmail].some((value) => String(value || "").toLowerCase().includes(text));
    return matchesSearch && (typeFilter === "ALL" || request.type === typeFilter) && (statusFilter === "ALL" || request.status === statusFilter);
  }), [requests, search, typeFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: requests.length,
    open: requests.filter((request) => request.status === "OPEN").length,
    progress: requests.filter((request) => request.status === "IN_PROGRESS").length,
    resolved: requests.filter((request) => ["RESOLVED", "CLOSED"].includes(request.status)).length,
  }), [requests]);

  const openRequest = (request) => {
    setSelected(request);
    setEdit({ status: request.status || "OPEN", priority: request.priority || "MEDIUM", adminResponse: request.adminResponse || "" });
    setMessage(""); setError("");
  };

  const save = async () => {
    if (!selected) return;
    setWorking(true); setError(""); setMessage("");
    try {
      const { data } = await api.patch(`/support-requests/${selected.id}`, edit);
      setRequests((current) => current.map((item) => item.id === data.id ? data : item));
      setSelected(data);
      setEdit({ status: data.status, priority: data.priority, adminResponse: data.adminResponse || "" });
      setMessage("Support request updated successfully.");
    } catch (requestError) { setError(responseMessage(requestError, "Unable to update this support request.")); }
    finally { setWorking(false); }
  };

  const label = (value) => String(value || "Not available").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <div className="sa-support-page">
    <div className="sa-support-metrics">
      <Metric icon={<BsHeadset />} label="Total Requests" value={counts.total} />
      <Metric icon={<BsEnvelope />} label="Open" value={counts.open} />
      <Metric icon={<BsClockHistory />} label="In Progress" value={counts.progress} />
      <Metric icon={<BsCheckCircle />} label="Resolved / Closed" value={counts.resolved} />
    </div>
    {error && <div className="alert alert-danger">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}
    <section className="admin-bento-card sa-support-card">
      <div className="sa-support-tools">
        <label><BsSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, user or subject..." /></label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="ALL">All request types</option><option value="FEEDBACK">Feedback</option><option value="PROBLEM">Problems</option><option value="FEATURE_REQUEST">Feature requests</option><option value="PAYMENT_SUBSCRIPTION">Payment / subscription</option><option value="ACCOUNT_ACCESS">Account / access</option><option value="GENERAL">General support</option></select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select>
        <button type="button" onClick={load}><BsArrowClockwise /> Refresh</button>
      </div>
      <div className="table-responsive"><table className="sa-native-table sa-support-table"><thead><tr><th>Reference</th><th>Requester</th><th>Type</th><th>Subject</th><th>Priority</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>
        {filtered.map((request) => <tr key={request.id}><td><strong>{request.referenceCode || `SUP-${request.id}`}</strong></td><td><strong>{request.requesterName || "Unknown user"}</strong><small>{request.contactEmail}</small></td><td>{label(request.type)}</td><td><strong>{request.subject}</strong><small>{String(request.description || "").slice(0, 70)}</small></td><td><span className={`sa-support-priority ${String(request.priority).toLowerCase()}`}>{label(request.priority)}</span></td><td><span className={`status ${String(request.status).toLowerCase()}`}>{label(request.status)}</span></td><td>{shortDateTime(request.createdAt)}</td><td><button className="sa-support-view" type="button" onClick={() => openRequest(request)}><BsEye /> View</button></td></tr>)}
        {!loading && !filtered.length && <tr><td colSpan="8"><Empty text="No support requests match these filters." /></td></tr>}
        {loading && <tr><td colSpan="8"><Empty text="Loading support requests..." /></td></tr>}
      </tbody></table></div>
    </section>
    {selected && <div className="sa-sub-modal-backdrop" onMouseDown={() => setSelected(null)}><div className="sa-support-modal" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span>{selected.referenceCode || `SUP-${selected.id}`}</span><h2>{selected.subject}</h2></div><button onClick={() => setSelected(null)}><BsXLg /></button></header>
      <div className="sa-support-modal-body">
        <section><div className="sa-support-requester"><BsChatLeftText /><div><b>{selected.requesterName}</b><span>{selected.contactEmail}</span></div></div><dl><div><dt>Type</dt><dd>{label(selected.type)}</dd></div><div><dt>Portal ID</dt><dd>{selected.portalId || "Not linked"}</dd></div><div><dt>Submitted</dt><dd>{shortDateTime(selected.createdAt)}</dd></div><div><dt>Current page</dt><dd>{selected.currentPage ? <a href={selected.currentPage} target="_blank" rel="noreferrer">Open page</a> : "Not provided"}</dd></div><div><dt>Screenshot</dt><dd>{selected.screenshotUrl ? <a href={selected.screenshotUrl} target="_blank" rel="noreferrer">View screenshot</a> : "Not provided"}</dd></div></dl><article><b>Description</b><p>{selected.description}</p></article></section>
        <aside><label>Status<select value={edit.status} onChange={(event) => setEdit((current) => ({ ...current, status: event.target.value }))}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></label><label>Priority<select value={edit.priority} onChange={(event) => setEdit((current) => ({ ...current, priority: event.target.value }))}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label>Response to user<textarea value={edit.adminResponse} onChange={(event) => setEdit((current) => ({ ...current, adminResponse: event.target.value }))} placeholder="Write an update or resolution for the user..." /></label><button onClick={save} disabled={working}>{working ? "Saving..." : "Save Response & Status"}</button>{selected.resolvedAt && <small>Resolved {shortDateTime(selected.resolvedAt)}</small>}</aside>
      </div>
    </div></div>}
    <style>{supportStyles}</style>
  </div>;
}

const supportStyles = `
.sa-support-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:22px}.sa-support-card{overflow:hidden;padding:0}.sa-support-tools{display:grid;grid-template-columns:minmax(260px,1fr) 210px 170px auto;gap:10px;padding:18px}.sa-support-tools label{display:flex;align-items:center;gap:9px;padding:0 12px;border:1px solid #d8dde6;border-radius:9px}.sa-support-tools input{width:100%;padding:10px 0;border:0;outline:0}.sa-support-tools select{padding:10px;border:1px solid #d8dde6;border-radius:9px;background:#fff}.sa-support-tools>button{display:flex;align-items:center;gap:7px;padding:10px 13px;border:1px solid #5548d9;border-radius:9px;background:#fff;color:#5548d9}.sa-support-table td{vertical-align:middle}.sa-support-table td small{display:block;max-width:260px;margin-top:3px;color:#8a94a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sa-support-priority{padding:5px 8px;border-radius:20px;background:#eef0f4;font-size:11px;font-weight:750}.sa-support-priority.high,.sa-support-priority.urgent{background:#fee8e9;color:#bd2631}.sa-support-priority.low{background:#e7f7ef;color:#147a4e}.sa-support-view{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #d8d5ff;border-radius:7px;background:#f7f6ff;color:#5548d9}.sa-support-modal{width:min(940px,94vw);max-height:90vh;overflow:auto;border-radius:18px;background:#fff;box-shadow:0 30px 80px rgba(16,24,40,.3)}.sa-support-modal>header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 23px;border-bottom:1px solid #e9ecf1}.sa-support-modal header span{color:#6557ed;font-size:11px;font-weight:800;letter-spacing:.08em}.sa-support-modal header h2{margin:4px 0 0;font-size:22px}.sa-support-modal header button{padding:7px;border:0;background:transparent}.sa-support-modal-body{display:grid;grid-template-columns:1.25fr .75fr}.sa-support-modal-body>section{padding:22px}.sa-support-requester{display:flex;align-items:center;gap:11px;padding:13px;border-radius:10px;background:#f5f4ff;color:#302a79}.sa-support-requester>svg{font-size:25px}.sa-support-requester div{display:grid}.sa-support-requester span{font-size:12px}.sa-support-modal dl{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:16px 0;border:1px solid #e4e7ec;border-radius:10px}.sa-support-modal dl>div{padding:11px;border-bottom:1px solid #e4e7ec}.sa-support-modal dt{color:#8a94a6;font-size:11px}.sa-support-modal dd{margin:3px 0 0;font-weight:700}.sa-support-modal article{padding:15px;border-radius:10px;background:#f8f9fb}.sa-support-modal article p{margin:7px 0 0;white-space:pre-wrap}.sa-support-modal-body>aside{display:flex;flex-direction:column;gap:13px;padding:22px;background:#f8f9fb}.sa-support-modal aside label{display:grid;gap:6px;font-size:12px;font-weight:750}.sa-support-modal aside select,.sa-support-modal aside textarea{padding:10px;border:1px solid #d8dde6;border-radius:8px;background:#fff}.sa-support-modal aside textarea{min-height:170px;resize:vertical}.sa-support-modal aside>button{padding:11px;border:0;border-radius:9px;background:#5548d9;color:#fff;font-weight:750}.sa-support-modal aside>button:disabled{opacity:.6}.sa-support-modal aside>small{text-align:center;color:#667085}@media(max-width:1050px){.sa-support-metrics{grid-template-columns:repeat(2,1fr)}.sa-support-tools{grid-template-columns:1fr 1fr}.sa-support-modal-body{grid-template-columns:1fr}}@media(max-width:650px){.sa-support-metrics,.sa-support-tools{grid-template-columns:1fr}.sa-support-modal-body>section,.sa-support-modal-body>aside{padding:15px}.sa-support-modal dl{grid-template-columns:1fr}}
`;

function buildPlanPayload(form) {
  const numberFields = [
    "monthlyPrice", "yearlyPrice", "maxActiveEvents", "maxPortalUsers",
    "maxRegistrationsPerEvent", "maxTicketClassesPerEvent",
    "maxStaffInvitations", "maxSpeakersPerEvent", "maxExhibitorsPerEvent",
    "maxCustomRegistrationFields", "maxOrganizers",
  ];
  const payload = {
    displayName: form.displayName,
    description: form.description,
    active: form.active,
    customBranding: form.customBranding,
    advancedReports: form.advancedReports,
    whiteLabel: form.whiteLabel,
    prioritySupport: form.prioritySupport,
  };
  numberFields.forEach((key) => {
    payload[key] = Number(form[key]);
  });
  return payload;
}

function newCustomPlan() {
  return {
    isNew: true,
    code: "CUSTOM",
    displayName: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    maxActiveEvents: 1,
    maxPortalUsers: 1,
    maxRegistrationsPerEvent: 1,
    maxTicketClassesPerEvent: 1,
    maxStaffInvitations: 1,
    maxSpeakersPerEvent: 1,
    maxExhibitorsPerEvent: 1,
    maxCustomRegistrationFields: 1,
    maxOrganizers: 1,
    customBranding: false,
    advancedReports: false,
    whiteLabel: false,
    prioritySupport: false,
    active: true,
  };
}

function formatSubscriptionLabel(value) {
  return String(value || "Not available").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function shortDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function responseMessage(error, fallback) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.error || fallback;
}

function Metric({ icon, label, value, to }) {
  const content = <><span className="admin-bento-icon">{icon}</span><p>{label}</p><h2>{value ?? 0}</h2></>;
  return to
    ? <Link to={to} className="admin-bento-card sa-metric sa-linked-metric" aria-label={`Open ${label}`}>{content}</Link>
    : <div className="admin-bento-card sa-metric">{content}</div>;
}
function GlanceMetric({ to, className, icon, label, value }) { return <Link to={to} className={`sa-glance-metric ${className}`}><span>{icon}</span><div><small>{label}</small><strong>{Number(value || 0).toLocaleString("en-IN")}</strong></div></Link>; }
function Panel({ title, subtitle, children }) { return <section className="admin-bento-card sa-panel"><h2>{title}</h2>{subtitle && <p className="sa-panel-subtitle">{subtitle}</p>}{children}</section>; }
function Empty({ text }) { return <div className="sa-empty"><BsSearch /><strong>{text}</strong></div>; }
function DashboardLoader() { return <div className="sa-dashboard-loader"><span /><p>Loading dashboard...</p></div>; }
function ProfileDetail({ icon, label, value }) { return <div className="sa-profile-detail"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }

function formatRole(role) {
  return String(role || "SUPER_ADMIN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PortalPageTabs({ active }) {
  return <div className="sa-portal-tabs" role="tablist" aria-label="Portal views">
    <NavLink to="/super-admin/portals" className={active === "active" ? "active" : ""}>Current Portals</NavLink>
    <NavLink to="/super-admin/portals/deleted" className={active === "deleted" ? "active" : ""}>Deleted Portals</NavLink>
  </div>;
}

function PortalTable({ portals, money, search, setSearch, compact = false, readOnly = false, onDeletePortal, deletingPortalId, title, subtitle, emptyText = "No portals found.", showEventRevenue = true }) {
  const [selectedPortal, setSelectedPortal] = useState(null);
  const showActions = !compact && !readOnly;
  const columnCount = 7 + (showEventRevenue ? 1 : 0) + (showActions ? 1 : 0);
  return <div className={compact ? "admin-bento-card sa-portal-card sa-portal-history" : "admin-bento-card sa-portal-card"}>
    <div className="sa-table-heading"><div><h2>{title || (compact ? "Portal Companies" : "Active portals")}</h2><p>{subtitle || "Companies and owners using the platform."}</p></div>{!compact && <label><BsSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search portals..." /></label>}</div>
    <div className="table-responsive"><table className="sa-native-table"><thead><tr><th>Portal</th><th>Owner</th><th>Plan</th><th>Status</th><th>Events</th><th>Users</th><th>Registrations</th>{showEventRevenue && <th>Event Revenue</th>}{showActions && <th>Actions</th>}</tr></thead><tbody>
      {portals.map((portal) => <tr key={portal.portalId} onClick={() => setSelectedPortal(portal)} style={{ cursor: "pointer" }}><td><strong>{portal.portalName || "Unnamed portal"}</strong><small>{portal.portalCode || "No code"}</small></td><td><strong>{portal.ownerName || "Not assigned"}</strong><small>{portal.ownerEmail || "No email"}</small></td><td>{portal.plan || "No plan"}</td><td><span className={`status ${String(portal.status || "deactivated").toLowerCase()}`}>{portal.status || "Deactivated"}</span></td><td>{portal.totalEvents || 0}</td><td>{portal.totalUsers || 0}</td><td>{portal.totalRegistrations || 0}</td>{showEventRevenue && <td><strong>{money(portal.revenue)}</strong></td>}{showActions && <td><button type="button" className="sa-delete-portal" onClick={(event) => { event.stopPropagation(); onDeletePortal(portal); }} disabled={deletingPortalId === portal.portalId}><BsTrash />{deletingPortalId === portal.portalId ? "Deleting..." : "Delete"}</button></td>}</tr>)}
      {!portals.length && <tr><td colSpan={columnCount}><Empty text={emptyText} /></td></tr>}
    </tbody></table></div>
    {selectedPortal && <div className="sa-modal-backdrop" onClick={() => setSelectedPortal(null)}><div className="sa-action-modal" onClick={(event) => event.stopPropagation()}><button type="button" className="sa-modal-close" onClick={() => setSelectedPortal(null)}><BsXLg /></button><span className="subscription-eyebrow">Portal details</span><h2>{selectedPortal.portalName || "Unnamed portal"}</h2><div className="sa-admin-receipt-meta"><span>Portal code</span><strong>{selectedPortal.portalCode || "Not available"}</strong><span>Owner</span><strong>{selectedPortal.ownerName || "Not assigned"}</strong><span>Email</span><strong>{selectedPortal.ownerEmail || "Not available"}</strong><span>Phone</span><strong>{selectedPortal.ownerPhone || "Not available"}</strong><span>Current plan</span><strong>{selectedPortal.plan || "No plan"}</strong><span>Status</span><strong>{selectedPortal.status || "Deactivated"}</strong><span>Events</span><strong>{selectedPortal.totalEvents || 0}</strong><span>Users</span><strong>{selectedPortal.totalUsers || 0}</strong><span>Registrations</span><strong>{selectedPortal.totalRegistrations || 0}</strong><span>Event revenue</span><strong>{money(selectedPortal.revenue)}</strong></div></div></div>}
  </div>;
}

function SimplePortalList({ portals, field, label }) { return <div className="sa-simple-list">{portals.map((portal) => <div key={portal.portalId}><span><b>{portal.portalName}</b><small>{portal.ownerEmail || "No owner email"}</small></span><strong>{portal[field] || 0} {label}</strong></div>)}{!portals.length && <Empty text="No portal data available." />}</div>; }

export default SuperAdminDashboard;
