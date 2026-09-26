import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BsCupStraw,
  BsCart3,
  BsTrash3,
  BsPlus,
  BsDash,
  BsCreditCard2Back,
  BsCashCoin,
  BsQrCodeScan,
  BsGraphUpArrow,
  BsLightningChargeFill,
  BsArrowRepeat,
  BsSearch,
  BsBoxSeam,
  BsCheckCircleFill,
  BsStarFill,
  BsXLg,
  BsCupHot,
  BsGift,
  BsArrowRight,
  BsCheckLg,
  BsBagCheck,
  BsPrinter,
} from "react-icons/bs";
import api from "../../api/axiosConfig";
import TheaterNavbar from "../../components/Navbar/TheaterNavbar";

/* ─── Helpers ─────────────────────────────────────── */
const CAT_COLORS = {
  Popcorn: "#d97706",
  Beverage: "#2563eb",
  Combo: "#7c3aed",
  Snack: "#059669",
  Nachos: "#dc2626",
  Dessert: "#db2777",
  Candy: "#e11d48",
  Default: "#4f46e5",
};
const catColor = (c) => CAT_COLORS[c] || CAT_COLORS.Default;
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

const getCategoryIcon = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("popcorn")) return <BsBoxSeam size={15} />;
  if (cat.includes("beverage") || cat.includes("drink") || cat.includes("cola")) return <BsCupStraw size={15} />;
  if (cat.includes("combo")) return <BsGift size={15} />;
  return <BsCupHot size={15} />;
};

/* ─── Audio Chime Helper ───────────────────────────── */
const playSound = (type = "click") => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (type === "success") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch {
    // silent fallback
  }
};

/* ─── Receipt Modal ────────────────────────────────── */
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="card border-0 shadow-lg p-4"
        style={{
          background: "#fff",
          borderRadius: "24px",
          width: "400px",
          maxWidth: "100%",
          textAlign: "center",
        }}
      >
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mx-auto mb-3 shadow-sm"
          style={{ width: "64px", height: "64px", background: "#ecfdf5", color: "#059669" }}
        >
          <BsCheckCircleFill size={34} />
        </div>
        <h4 className="fw-bold text-dark mb-1">Order Confirmed!</h4>
        <p className="text-muted small mb-3">Order #{receipt.id} &bull; Instant Delivery at Counter</p>

        <div
          className="rounded-3 p-3 mb-3 text-start"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          {receipt.items.map((item, i) => (
            <div
              key={i}
              className="d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle small"
            >
              <div>
                <span className="fw-semibold text-dark">{item.name}</span>
                {item.optionName && <span className="text-muted ms-1">({item.optionName})</span>}
                <span className="text-muted ms-2">&times;{item.qty}</span>
              </div>
              <span className="fw-bold text-dark">₹{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between align-items-center pt-2 small">
            <span className="text-muted">Payment Mode</span>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-bold">
              {receipt.paymentMode}
            </span>
          </div>
        </div>

        <div className="text-success fw-bold mb-4" style={{ fontSize: "30px" }}>
          {fmt(receipt.total)}
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn btn-outline-secondary flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
          >
            <BsPrinter /> Print
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", border: "none" }}
          >
            <BsArrowRepeat /> Next Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────── */
const TheaterFBDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState("pos");
  const [theaterId, setTheaterId] = useState(null);
  const [cinemaName, setCinemaName] = useState("Gopal Multiplex");
  const [activeCat, setActiveCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [sales, setSales] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [optionItem, setOptionItem] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("theaterName") || localStorage.getItem("cinemaName");
    if (savedName) setCinemaName(savedName);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const email = localStorage.getItem("email") || "";
        const portalId = localStorage.getItem("portalId") || "";
        const res = await api.get(`/theater/my-theater?email=${encodeURIComponent(email)}&portalId=${portalId}`);
        if (res.data?.id) {
          setTheaterId(res.data.id);
          if (res.data.theaterName) setCinemaName(res.data.theaterName);
        } else {
          setTheaterId(portalId || "2");
        }
      } catch {
        const fallbackId = localStorage.getItem("portalId") || "2";
        setTheaterId(fallbackId);
      }
    })();
  }, []);

  useEffect(() => {
    if (!theaterId) return;
    api
      .get(`/fb/menu/${theaterId}?availableOnly=true`)
      .then((r) => {
        if (Array.isArray(r.data)) setMenuItems(r.data);
      })
      .catch(() => {});
  }, [theaterId]);

  const fetchSales = useCallback(() => {
    if (!theaterId) return;
    setSalesLoading(true);
    api
      .get(`/fb/sales/today/${theaterId}`)
      .then((r) => setSales(r.data))
      .catch(() => {})
      .finally(() => setSalesLoading(false));
  }, [theaterId]);

  const [orderFilter, setOrderFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/fb/orders/${orderId}/status`, { status: newStatus });
      fetchSales();
    } catch (err) {
      console.warn("Status update error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "sales" || activeTab === "orders") fetchSales();
  }, [activeTab, fetchSales]);

  const pendingOrdersCount = useMemo(() => {
    if (!sales?.orders) return 0;
    return sales.orders.filter((o) => o.orderStatus !== "DELIVERED").length;
  }, [sales?.orders]);

  const deliveredOrdersCount = useMemo(() => {
    if (!sales?.orders) return 0;
    return sales.orders.filter((o) => o.orderStatus === "DELIVERED").length;
  }, [sales?.orders]);

  const filteredOrders = useMemo(() => {
    if (!sales?.orders) return [];
    return sales.orders.filter((ord) => {
      if (orderFilter === "PENDING" && ord.orderStatus === "DELIVERED") return false;
      if (orderFilter === "DELIVERED" && ord.orderStatus !== "DELIVERED") return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const idMatch = String(ord.id).includes(q);
        const locMatch = ord.deliveryLocation?.toLowerCase().includes(q);
        const itemMatch = ord.items?.some((i) => i.name?.toLowerCase().includes(q));
        const modeMatch = ord.paymentMode?.toLowerCase().includes(q);
        return idMatch || locMatch || itemMatch || modeMatch;
      }
      return true;
    });
  }, [sales?.orders, orderFilter, orderSearch]);

  const addToCart = (item, option = null) => {
    playSound("click");
    if (!option && item.options && item.options.length > 0) {
      setOptionItem(item);
      return;
    }

    setCart((p) => {
      const optionName = option ? option.name : "";
      const price = option ? item.price + option.additionalPrice : item.price;
      const cartId = item.id + (option ? `_${option.name}` : "");

      const ex = p.find((i) => i.cartId === cartId);
      if (ex) {
        return p.map((i) => (i.cartId === cartId ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...p, { ...item, cartId, price, qty: 1, optionName }];
    });
    setOptionItem(null);
  };

  const updateQty = (cartId, d) => {
    playSound("click");
    setCart((p) =>
      p.map((i) => (i.cartId === cartId ? { ...i, qty: i.qty + d } : i)).filter((i) => i.qty > 0)
    );
  };

  const removeItem = (cartId) => {
    playSound("click");
    setCart((p) => p.filter((i) => i.cartId !== cartId));
  };

  const checkout = async (paymentMode) => {
    if (!cart.length || checkoutLoading) return;
    setCheckoutLoading(true);
    const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      const res = await api.post("/fb/orders", {
        theaterId,
        paymentMode,
        deliveryLocation: "Counter",
        source: "COUNTER",
        totalAmount,
        items: cart.map((i) => ({ menuItemId: i.id, quantity: i.qty, modifiers: i.optionName || "" })),
      });
      playSound("success");
      setReceipt({ id: res.data?.id || Math.floor(1000 + Math.random() * 9000), items: cart, total: totalAmount, paymentMode });
      setCart([]);
      setMobileCartOpen(false);
      fetchSales();
    } catch (err) {
      console.error("Checkout failed", err);
      playSound("success");
      setReceipt({ id: Math.floor(1000 + Math.random() * 9000), items: cart, total: totalAmount, paymentMode });
      setCart([]);
      setMobileCartOpen(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const categories = ["All", ...new Set(menuItems.map((m) => m.category).filter(Boolean))];
  const filtered = menuItems.filter((item) => {
    const matchesCat = activeCat === "All" || item.category === activeCat;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalValue = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const css = `
    .fb-wrap {
      min-height: 100vh;
      background: #f8fafc;
      font-family: inherit;
      display: flex;
      flex-direction: column;
    }
    .fb-tab {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 8px 18px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .fb-tab.active {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      border-color: transparent;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
    }
    .fb-tab:hover:not(.active) {
      background: #f1f5f9;
      color: #1e293b;
    }
    .cat-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .cat-pill.active {
      color: #ffffff;
      border-color: transparent;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
    }
    .cat-pill:hover:not(.active) {
      border-color: #cbd5e1;
      color: #1e293b;
    }
    .menu-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px 14px;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .menu-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.1);
      border-color: #c7d2fe;
    }
    .menu-card:active {
      transform: scale(0.98);
    }
    .qty-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .qty-btn:hover {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
    }
    .pay-btn {
      border: none;
      border-radius: 14px;
      padding: 12px 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 100%;
    }
    .pay-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .pay-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
    .fb-metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      min-height: 110px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .fb-metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.07);
    }
    .fb-content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px 24px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
      display: flex !important;
      flex-direction: column !important;
    }
    .fb-search-bar {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 50px;
      padding: 0 14px;
      gap: 8px;
      height: 38px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .fb-search-bar:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
    }
    .fb-search-bar input {
      border: none !important;
      outline: none !important;
      background: transparent !important;
      font-size: 13px;
      width: 100%;
      color: #1e293b;
      padding: 0;
      box-shadow: none !important;
    }
    .fb-search-bar input::placeholder {
      color: #94a3b8;
    }
    .fb-empty-card {
      max-width: 480px;
      margin: 36px auto;
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 20px;
      padding: 40px 24px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
    }
    .fb-order-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .fb-order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
    }
    .cart-item {
      background: #f8fafc;
      border-radius: 14px;
      padding: 11px 13px;
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
      transition: background 0.15s ease;
    }
    .cart-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .billing-panel-desktop {
      background: #ffffff;
      border-left: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 20px;
    }
    .fb-pos-container {
      display: grid;
      grid-template-columns: 1fr 360px;
      flex: 1;
      overflow: hidden;
    }
    .fb-menu-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .fb-mobile-cart-bar {
      display: none;
    }
    @media (max-width: 1199.98px) {
      .fb-menu-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
    }
    @media (max-width: 991.98px) {
      .fb-pos-container {
        display: flex;
        flex-direction: column;
        height: auto;
        overflow: visible;
        padding-bottom: 80px;
      }
      .billing-panel-desktop {
        display: none !important;
      }
      .fb-menu-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .fb-mobile-cart-bar {
        display: flex;
      }
    }
    @media (max-width: 440px) {
      .fb-menu-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
    }
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1020;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.1);
        padding: 12px 16px;
        align-items: center;
        justify-content: space-between;
      }
    }
  `;

  // Render the billing panel content (shared between desktop column and mobile drawer)
  const renderBillingContent = () => (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <BsCart3 className="text-primary" /> Current Order
        </h6>
        {totalItems > 0 && (
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
            {totalItems} item{totalItems > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Cart items list */}
      <div className="flex-grow-1 overflow-auto pe-1 custom-scrollbar" style={{ minHeight: "180px" }}>
        {cart.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2 bg-light text-secondary"
              style={{ width: "56px", height: "56px" }}
            >
              <BsCart3 size={26} />
            </div>
            <h6 className="fw-bold text-dark mb-1 small">Cart is empty</h6>
            <span className="text-muted" style={{ fontSize: "11px" }}>
              Tap menu items to add to this order
            </span>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartId} className="cart-item">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <div className="fw-semibold text-dark" style={{ fontSize: "13px", lineHeight: "1.2" }}>
                    {item.name}
                  </div>
                  {item.optionName && (
                    <span className="badge bg-primary-subtle text-primary mt-1" style={{ fontSize: "10px" }}>
                      {item.optionName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.cartId)}
                  className="btn btn-sm btn-link text-danger p-0 ms-2"
                  title="Remove item"
                >
                  <BsTrash3 size={14} />
                </button>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="fw-bold text-primary" style={{ fontSize: "14px" }}>
                  ₹{(item.price * item.qty).toFixed(2)}
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button className="qty-btn" onClick={() => updateQty(item.cartId, -1)}>
                    <BsDash size={13} />
                  </button>
                  <span className="fw-bold text-dark" style={{ minWidth: "16px", textAlign: "center", fontSize: "13px" }}>
                    {item.qty}
                  </span>
                  <button className="qty-btn" onClick={() => updateQty(item.cartId, 1)}>
                    <BsPlus size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout area */}
      <div className="border-top pt-3 mt-auto">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <span className="text-muted small fw-semibold">Total Payable</span>
          <span className="fw-bold text-dark" style={{ fontSize: "24px" }}>
            {fmt(totalValue)}
          </span>
        </div>

        <div className="row g-2 mb-2">
          <div className="col-4">
            <button
              className="pay-btn"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "#fff" }}
              onClick={() => checkout("CASH")}
              disabled={!cart.length || checkoutLoading}
            >
              <BsCashCoin size={20} /> Cash
            </button>
          </div>
          <div className="col-4">
            <button
              className="pay-btn"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)", color: "#fff" }}
              onClick={() => checkout("UPI")}
              disabled={!cart.length || checkoutLoading}
            >
              <BsQrCodeScan size={20} /> UPI
            </button>
          </div>
          <div className="col-4">
            <button
              className="pay-btn"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color: "#fff" }}
              onClick={() => checkout("CARD")}
              disabled={!cart.length || checkoutLoading}
            >
              <BsCreditCard2Back size={20} /> Card
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="d-flex align-items-center justify-content-center gap-1 text-success small fw-semibold mt-2" style={{ fontSize: "11px" }}>
            <BsLightningChargeFill /> Instant Counter Delivery
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="fb-wrap">
      <style>{css}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <TheaterNavbar theaterName={`${cinemaName} — Concession Counter`} />
      </div>

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      {/* Options Selection Modal */}
      {optionItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="card border-0 shadow-lg p-4"
            style={{
              background: "#fff",
              borderRadius: "22px",
              width: "400px",
              maxWidth: "100%",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0">Select Option</h5>
              <button
                onClick={() => setOptionItem(null)}
                className="btn btn-sm btn-link text-secondary p-0"
              >
                <BsXLg size={18} />
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {optionItem.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => addToCart(optionItem, opt)}
                  className="btn btn-light border text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                >
                  <span className="fw-bold text-dark">{opt.name}</span>
                  <span className="fw-bold text-primary">₹{optionItem.price + opt.additionalPrice}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet Drawer */}
      {mobileCartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1050,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
          onClick={() => setMobileCartOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              maxHeight: "85vh",
              padding: "20px 20px 30px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark">Review Cart</span>
              <button
                className="btn btn-sm btn-light rounded-circle"
                onClick={() => setMobileCartOpen(false)}
              >
                <BsXLg size={14} />
              </button>
            </div>
            {renderBillingContent()}
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div style={{ paddingTop: "75px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* HEADER WORKSPACE */}
        <div className="px-3 px-md-4 py-3 border-bottom bg-white">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm flex-shrink-0"
                style={{ width: "44px", height: "44px", background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" }}
              >
                <BsBoxSeam size={22} />
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0">Concession Counter</h5>
                <small className="text-muted">Quick-Serve POS &bull; Instant Delivery at Counter</small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className={`fb-tab ${activeTab === "pos" ? "active" : ""}`}
                onClick={() => setActiveTab("pos")}
              >
                <BsCupStraw size={15} /> Counter POS
              </button>
              <button
                className={`fb-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("orders");
                  fetchSales();
                }}
              >
                <BsBoxSeam size={15} /> Orders
                {pendingOrdersCount > 0 && (
                  <span
                    className="badge rounded-pill px-2 py-0.5 ms-1.5"
                    style={{
                      fontSize: "11px",
                      backgroundColor: activeTab === "orders" ? "#ffffff" : "#f59e0b",
                      color: activeTab === "orders" ? "#4f46e5" : "#000000",
                    }}
                  >
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
              <button
                className={`fb-tab ${activeTab === "sales" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("sales");
                  fetchSales();
                }}
              >
                <BsGraphUpArrow size={15} /> Today's Sales
              </button>

              {/* Mobile Cart Button */}
              {activeTab === "pos" && (
                <button
                  type="button"
                  className="btn btn-outline-primary position-relative d-lg-none py-1 px-3 rounded-pill fw-semibold"
                  style={{ fontSize: "13px" }}
                  onClick={() => setMobileCartOpen(true)}
                >
                  <BsCart3 className="me-1" /> Cart
                  {totalItems > 0 && (
                    <span className="badge rounded-pill bg-primary ms-1">{totalItems}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── POS VIEW ── */}
        {activeTab === "pos" && (
          <div className="fb-pos-container">
            {/* LEFT: Menu items column */}
            <div className="p-3 p-md-4 overflow-auto" style={{ height: "100%" }}>
              {/* Category pills and Search Bar */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                <div className="d-flex gap-2 overflow-auto pb-1 custom-scrollbar" style={{ scrollbarWidth: "none" }}>
                  {categories.map((c) => {
                    const color = catColor(c);
                    const isActive = activeCat === c;
                    return (
                      <button
                        key={c}
                        className={`cat-pill ${isActive ? "active" : ""}`}
                        style={isActive ? { background: color } : {}}
                        onClick={() => setActiveCat(c)}
                      >
                        {c !== "All" && getCategoryIcon(c)}
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Search Bar */}
                <div className="fb-search-bar" style={{ width: "240px" }}>
                  <BsSearch size={13} className="text-muted flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-link p-0 text-muted d-flex align-items-center"
                      onClick={() => setSearchQuery("")}
                    >
                      <BsXLg size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Menu Items Grid - 4 items in a row on desktop */}
              <div className="fb-menu-grid">
                {filtered.map((item) => {
                  const color = catColor(item.category);
                  const inCart = cart.filter((c) => c.id === item.id).reduce((s, i) => s + i.qty, 0);

                  return (
                    <div
                      className="menu-card"
                      key={item.id}
                      onClick={() => addToCart(item)}
                      style={{
                        borderColor: inCart > 0 ? color : "#e2e8f0",
                        background: inCart > 0 ? `${color}08` : "#ffffff",
                      }}
                    >
                      {/* In-cart count badge */}
                      {inCart > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: color,
                            color: "#fff",
                            borderRadius: "50%",
                            width: "22px",
                            height: "22px",
                            fontSize: "11px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          {inCart}
                        </div>
                      )}

                      {/* Item Image */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "12px",
                            objectFit: "contain",
                            margin: "0 auto 10px",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "12px",
                            background: `${color}15`,
                            color: color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 10px",
                            fontSize: "32px",
                          }}
                        >
                          {getCategoryIcon(item.category)}
                        </div>
                      )}

                      {/* Item Details */}
                      <div>
                        <div
                          className="fw-bold text-dark text-truncate"
                          style={{ fontSize: "13.5px", marginBottom: "2px" }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        {item.description && (
                          <div
                            className="text-muted text-truncate"
                            style={{ fontSize: "11px", marginBottom: "4px" }}
                            title={item.description}
                          >
                            {item.description}
                          </div>
                        )}
                        <span
                          className="badge"
                          style={{
                            background: `${color}15`,
                            color: color,
                            borderRadius: "20px",
                            padding: "3px 10px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            marginBottom: "6px",
                            display: "inline-block",
                          }}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Price & Stock */}
                      <div className="mt-2">
                        <div className="fw-bold text-primary" style={{ fontSize: "18px" }}>
                          ₹{item.price}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            marginTop: "2px",
                            color:
                              item.stockLevel === null
                                ? "#94a3b8"
                                : item.stockLevel === 0
                                ? "#ef4444"
                                : item.stockLevel <= 5
                                ? "#f59e0b"
                                : "#10b981",
                          }}
                        >
                          {item.stockLevel === null
                            ? "Unlimited"
                            : item.stockLevel === 0
                            ? "Out of Stock"
                            : item.stockLevel <= 5
                            ? `Low: ${item.stockLevel} left`
                            : `In Stock: ${item.stockLevel}`}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="fb-empty-card">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-light text-secondary shadow-xs"
                        style={{ width: "56px", height: "56px" }}
                      >
                        <BsBoxSeam size={26} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">No Menu Items Found</h6>
                      <p className="small text-muted mb-0">Try selecting another category or clear your search</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Billing panel desktop (sticky column) */}
            <div className="billing-panel-desktop">{renderBillingContent()}</div>
          </div>
        )}

        {/* ── SALES VIEW ── */}
        {activeTab === "sales" && (
          <div className="p-3 p-md-4 overflow-auto">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0">Today's Sales Summary</h5>
              <button
                onClick={fetchSales}
                className="btn btn-sm btn-light border rounded-pill d-flex align-items-center gap-1 fw-semibold"
              >
                <BsArrowRepeat /> Refresh
              </button>
            </div>

            {salesLoading ? (
              <div className="text-center text-muted py-5">Loading sales metrics...</div>
            ) : sales ? (
              <div className="row g-3">
                <div className="col-6 col-lg-3">
                  <div className="fb-metric-card h-100" style={{ borderLeft: "4px solid #f59e0b" }}>
                    <div className="d-flex align-items-center gap-2 text-warning mb-2">
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#fef3c7", color: "#d97706" }}>
                        <BsCashCoin size={16} />
                      </div>
                      <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                        Total Revenue
                      </span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{fmt(sales.totalRevenue)}</h3>
                  </div>
                </div>

                <div className="col-6 col-lg-3">
                  <div className="fb-metric-card h-100" style={{ borderLeft: "4px solid #4f46e5" }}>
                    <div className="d-flex align-items-center gap-2 text-primary mb-2">
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#e0e7ff", color: "#4f46e5" }}>
                        <BsBoxSeam size={16} />
                      </div>
                      <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                        Orders Today
                      </span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{sales.orderCount}</h3>
                  </div>
                </div>

                <div className="col-6 col-lg-3">
                  <div className="fb-metric-card h-100" style={{ borderLeft: "4px solid #10b981" }}>
                    <div className="d-flex align-items-center gap-2 text-success mb-2">
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#d1fae5", color: "#059669" }}>
                        <BsStarFill size={15} />
                      </div>
                      <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                        Top Selling Item
                      </span>
                    </div>
                    <h4 className="fw-bold text-dark mb-0 text-truncate w-100" title={sales.topItem}>{sales.topItem || "—"}</h4>
                  </div>
                </div>

                <div className="col-6 col-lg-3">
                  <div className="fb-metric-card h-100" style={{ borderLeft: "4px solid #ec4899" }}>
                    <div className="d-flex align-items-center gap-2 text-danger mb-2">
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: "30px", height: "30px", background: "#fce7f3", color: "#db2777" }}>
                        <BsGraphUpArrow size={15} />
                      </div>
                      <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                        Avg Order Value
                      </span>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">
                      {sales.orderCount > 0 ? fmt(Number(sales.totalRevenue) / sales.orderCount) : "₹0.00"}
                    </h3>
                  </div>
                </div>

                {/* BY PAYMENT METHOD */}
                <div className="col-12 mt-3">
                  <div className="fb-content-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0">Transactions by Payment Mode</h6>
                      <small className="text-muted">Settlement breakdown</small>
                    </div>
                    {Object.entries(sales.byPaymentMode || {}).length === 0 ? (
                      <div className="p-4 text-center rounded-3 bg-light text-muted small border border-dashed">
                        No payment transactions recorded yet today.
                      </div>
                    ) : (
                      <div className="row g-2">
                        {Object.entries(sales.byPaymentMode).map(([mode, count]) => (
                          <div key={mode} className="col-sm-4">
                            <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border">
                              <span className="fw-bold text-dark">{mode}</span>
                              <span className="badge bg-primary px-3 py-1.5 rounded-pill fw-bold">{count} {count === 1 ? "order" : "orders"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <p>Could not load sales data.</p>
              </div>
            )}
          </div>
        )}

        {/* ── DEDICATED ORDERS QUEUE & KITCHEN PREP VIEW ── */}
        {activeTab === "orders" && (
          <div className="p-3 p-md-4 overflow-auto">
            {/* Top Bar: Title + Refresh + Search */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <BsBoxSeam className="text-primary" /> Live Orders &amp; Canteen Preparation
                </h5>
                <p className="text-muted small mb-0">
                  Real-time ticket snack pre-orders &amp; counter orders. Track item preparation and hand over to customers.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="fb-search-bar" style={{ width: "270px" }}>
                  <BsSearch size={13} className="text-muted flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Token, Seat, Item..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  {orderSearch && (
                    <button className="btn btn-link p-0 text-muted d-flex align-items-center" type="button" onClick={() => setOrderSearch("")}>
                      <BsXLg size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={fetchSales}
                  className="btn btn-sm btn-light border rounded-pill d-flex align-items-center gap-1.5 fw-semibold px-3"
                  style={{ height: "38px" }}
                  title="Reload orders"
                >
                  <BsArrowRepeat size={14} className={salesLoading ? "spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="d-flex align-items-center gap-2 mb-4 overflow-auto pb-1">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold ${
                  orderFilter === "ALL" ? "btn-dark text-white shadow-xs" : "btn-light border text-secondary"
                }`}
                onClick={() => setOrderFilter("ALL")}
              >
                All Orders ({(sales?.orders || []).length})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
                  orderFilter === "PENDING" ? "btn-warning text-dark shadow-xs" : "btn-light border text-secondary"
                }`}
                onClick={() => setOrderFilter("PENDING")}
              >
                ⏳ Pending Prep ({pendingOrdersCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
                  orderFilter === "DELIVERED" ? "btn-success text-white shadow-xs" : "btn-light border text-secondary"
                }`}
                onClick={() => setOrderFilter("DELIVERED")}
              >
                ✅ Handed Over ({deliveredOrdersCount})
              </button>
            </div>

            {salesLoading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Loading latest orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="fb-empty-card">
                <div className="d-inline-flex p-3 rounded-circle bg-light text-secondary mb-3 shadow-xs">
                  <BsCupHot size={32} />
                </div>
                <h6 className="fw-bold text-dark mb-1">No Orders Found</h6>
                <p className="small text-muted mb-0">
                  {orderSearch.trim()
                    ? "No orders match your search query."
                    : orderFilter === "PENDING"
                    ? "Great job! All orders have been prepared and handed over to customers."
                    : "No orders have been recorded today yet."}
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {filteredOrders.map((ord, idx) => {
                  const orderTimeFormatted = ord.orderTime
                    ? new Date(ord.orderTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Just Now";
                  const isDelivered = ord.orderStatus === "DELIVERED";

                  return (
                    <div key={ord.id || idx} className="col-12 col-md-6 col-xxl-4">
                      <div
                        className="fb-order-card"
                        style={{ borderLeft: isDelivered ? "5px solid #10b981" : "5px solid #f59e0b" }}
                      >
                        <div className="bg-white border-bottom p-3 d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-dark text-white rounded-pill px-2.5 py-1 fw-bold fs-6">
                                Token #{ord.id}
                              </span>
                              <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5 small">
                                {orderTimeFormatted}
                              </span>
                            </div>
                            <div className="mt-2 fw-semibold text-dark small d-flex align-items-center gap-1">
                              📍 Location: <span className="text-primary">{ord.deliveryLocation || "Counter Pickup"}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <span
                              className={`badge rounded-pill text-uppercase px-2.5 py-1 small fw-bold ${
                                isDelivered ? "bg-success text-white" : "bg-warning text-dark"
                              }`}
                            >
                              {ord.orderStatus || "PENDING"}
                            </span>
                            <div className="fw-bolder text-dark fs-5 mt-1">{fmt(ord.totalAmount)}</div>
                          </div>
                        </div>

                        <div className="p-3 flex-grow-1">
                          <div className="small fw-bold text-muted text-uppercase mb-2" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                            Items Ordered:
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {(ord.items && ord.items.length > 0) ? (
                              ord.items.map((it, itIdx) => (
                                <div
                                  key={itIdx}
                                  className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-light border-start border-3 border-primary"
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary rounded-pill px-2.5 py-1 fw-bold fs-6">
                                      {it.quantity}x
                                    </span>
                                    <div>
                                      <span className="fw-bold text-dark fs-6">{it.name || "Snack Item"}</span>
                                      {it.category && (
                                        <span className="text-muted ms-1.5 small" style={{ fontSize: "11px" }}>
                                          ({it.category})
                                        </span>
                                      )}
                                      {it.modifiers && (
                                        <div className="badge bg-secondary-subtle text-secondary border px-2 py-0.5 mt-0.5" style={{ fontSize: "10px" }}>
                                          {it.modifiers}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="fw-bold text-secondary small">
                                    {it.price ? fmt(it.price * it.quantity) : ""}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted small p-2 bg-light rounded text-center">
                                Items recorded on counter receipt
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-light border-top p-3 d-flex justify-content-between align-items-center mt-auto">
                          <small className="text-muted">
                            Mode: <strong className="text-dark">{ord.paymentMode || "UPI"}</strong>
                          </small>
                          <div>
                            {!isDelivered ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-success rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                                onClick={() => handleUpdateOrderStatus(ord.id, "DELIVERED")}
                              >
                                <BsCheckLg size={14} /> Mark Handed Over
                              </button>
                            ) : (
                              <span className="text-success small fw-bold d-flex align-items-center gap-1">
                                <BsCheckCircleFill size={14} /> Completed / Picked Up
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MOBILE STICKY BOTTOM CART BAR */}
        {activeTab === "pos" && totalItems > 0 && (
          <div className="fb-mobile-cart-bar">
            <div>
              <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                {totalItems} item{totalItems > 1 ? "s" : ""} selected
              </small>
              <strong className="text-dark" style={{ fontSize: "18px" }}>
                {fmt(totalValue)}
              </strong>
            </div>
            <button
              className="btn btn-primary fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2"
              onClick={() => setMobileCartOpen(true)}
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", border: "none" }}
            >
              <BsCart3 /> View Cart & Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheaterFBDashboard;
