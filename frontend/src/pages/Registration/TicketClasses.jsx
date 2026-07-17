import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaEdit,
  FaPlus,
  FaSave,
  FaTicketAlt,
  FaTrash
} from "react-icons/fa";
import api from "../../api/axiosConfig";

const ticketClassOptions = [
  "Normal Pass",
  "Silver Pass",
  "Gold Pass",
  "Diamond Pass",
  "VIP Pass",
  "Student Pass",
  "Early Bird Pass",
  "Group Pass"
];

const emptyTicketClass = {
  name: "",
  price: "",
  seats: "",
  maxPerBuyer: "1",
  saleStatus: "Active",
  description: "",
  benefits: ""
};

function TicketClasses() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [ticketClasses, setTicketClasses] = useState([]);
  const [form, setForm] = useState(emptyTicketClass);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEventTicketClasses();
  }, [id]);

  const loadEventTicketClasses = async () => {
    try {
      const [eventRes, classesRes, registrationsRes] = await Promise.allSettled([
        api.get(`/events/${id}`),
        api.get(`/ticket-classes/event/${id}`),
        api.get(`/registrations/event/${id}`)
      ]);

      const eventData = eventRes.status === "fulfilled" ? eventRes.value.data : null;
      let classes =
        classesRes.status === "fulfilled" && Array.isArray(classesRes.value.data)
          ? classesRes.value.data
          : [];
      const registrations =
        registrationsRes.status === "fulfilled" && Array.isArray(registrationsRes.value.data)
          ? registrationsRes.value.data
          : [];
      const soldStats = buildSoldStats(registrations);
      const ticketClassApiReady = classesRes.status === "fulfilled";

      if (classes.length === 0 && eventData && ticketClassApiReady) {
        const capacity = Number(eventData.capacity || eventData.availableSeats || 0);
        const sold = soldStats.totalSold;
        const defaultClass = await api.post(`/ticket-classes/event/${id}`, {
          name: "Normal Pass",
          price: Number(eventData.ticketPrice || 0),
          seats: capacity,
          sold,
          maxPerBuyer: 1,
          saleStatus: capacity > 0 && sold >= capacity ? "Sold Out" : "Active",
          description: `Default ticket class for ${eventData.eventName || "this event"}.`,
          benefits: "Event entry, registration confirmation, attendee access",
          active: true
        });

        classes = [defaultClass.data];
      }

      if (classes.length === 0 && eventData) {
        const capacity = Number(eventData.capacity || eventData.availableSeats || 0);
        classes = [
          {
            id: "normal-current-event",
            name: "Normal Pass",
            price: Number(eventData.ticketPrice || 0),
            seats: capacity,
            sold: soldStats.totalSold,
            maxPerBuyer: 1,
            saleStatus: capacity > 0 && soldStats.totalSold >= capacity ? "Sold Out" : "Active",
            description: `Default ticket class for ${eventData.eventName || "this event"}.`,
            benefits: "Event entry, registration confirmation, attendee access",
            active: true
          }
        ];
      }

      setEvent(eventData);
      setTicketClasses(normalizeTicketClasses(classes, soldStats));
    } catch (error) {
      setMessage("Unable to load event ticket data.");
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyTicketClass);
    setShowForm(true);
    setMessage("");
  };

  const editTicketClass = (ticketClass) => {
    setEditingId(ticketClass.id);
    setForm({
      name: ticketClass.name,
      price: ticketClass.price,
      seats: ticketClass.seats,
      maxPerBuyer: ticketClass.maxPerBuyer || 1,
      saleStatus: ticketClass.saleStatus,
      description: ticketClass.description,
      benefits: ticketClass.benefits
    });
    setShowForm(true);
    setMessage("");
  };

  const saveTicketClass = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage("Ticket class name is required.");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setMessage("Enter a valid ticket price.");
      return;
    }

    if (!form.seats || Number(form.seats) <= 0) {
      setMessage("Enter available seats for this class.");
      return;
    }

    const payload = {
      name: form.name,
      price: Number(form.price),
      seats: Number(form.seats),
      maxPerBuyer: Math.max(Number(form.maxPerBuyer || 1), 1),
      sold: ticketClasses.find((item) => item.id === editingId)?.sold || 0,
      saleStatus: form.saleStatus,
      description: form.description,
      benefits: form.benefits,
      active: form.saleStatus !== "Hidden"
    };

    try {
      if (editingId) {
        await api.put(`/ticket-classes/${editingId}`, payload);
      } else {
        await api.post(`/ticket-classes/event/${id}`, payload);
      }

      await loadEventTicketClasses();
      setForm(emptyTicketClass);
      setEditingId(null);
      setShowForm(false);
      setMessage(editingId ? "Ticket class updated." : "Ticket class created.");
    } catch (error) {
      setMessage("Unable to save ticket class.");
    }
  };

  const removeTicketClass = async (ticketClassId) => {
    try {
      await api.delete(`/ticket-classes/${ticketClassId}`);
      await loadEventTicketClasses();
      setMessage("Ticket class removed.");
    } catch (error) {
      setMessage("Unable to remove ticket class.");
    }
  };

  const totalSeats = ticketClasses.reduce((total, item) => total + Number(item.seats || 0), 0);
  const totalSold = ticketClasses.reduce((total, item) => total + Number(item.sold || 0), 0);
  const totalRevenue = ticketClasses.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.sold || 0),
    0
  );

  return (
    <div className="registration-subpage">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h3 className="fw-semibold mb-1" style={{ fontSize: "22px" }}>
            Ticket Classes
          </h3>
          <p className="text-muted mb-0">
            {event?.eventName
              ? `Manage ticket classes for ${event.eventName}.`
              : "Manage ticket classes for this event."}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          onClick={openCreateForm}
        >
          <FaPlus /> Add Ticket Class
        </button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <SummaryCard label="Ticket Classes" value={ticketClasses.length} />
        <SummaryCard label="Total Seats" value={totalSeats} />
        <SummaryCard label="Available Seats" value={totalSeats - totalSold} />
        <SummaryCard label="Revenue" value={`Rs. ${totalRevenue.toLocaleString("en-IN")}`} />
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h4 className="fw-semibold mb-1" style={{ fontSize: "17px" }}>
              {editingId ? "Edit Ticket Class" : "Create Ticket Class"}
            </h4>
            <p className="text-muted small mb-0">
              Set price, seat count, sale status and benefits for this pass.
            </p>
          </div>

          <form className="card-body" onSubmit={saveTicketClass}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Class Name *</label>
                <select
                  className="form-select"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                >
                  <option value="">Select class</option>
                  {ticketClassOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Price *</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="499"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Seats *</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={form.seats}
                  onChange={(e) => updateField("seats", e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Sale Status</label>
                <select
                  className="form-select"
                  value={form.saleStatus}
                  onChange={(e) => updateField("saleStatus", e.target.value)}
                >
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Sold Out</option>
                  <option>Hidden</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Max Per Buyer</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={form.maxPerBuyer}
                  onChange={(e) => updateField("maxPerBuyer", e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe who this pass is for"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Benefits</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.benefits}
                  onChange={(e) => updateField("benefits", e.target.value)}
                  placeholder="Priority entry, seating, event kit"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyTicketClass);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
                <FaSave /> {editingId ? "Update Class" : "Save Class"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3">
        {ticketClasses.map((ticketClass) => {
          const seats = Number(ticketClass.seats || 0);
          const sold = Number(ticketClass.sold || 0);
          const available = Math.max(seats - sold, 0);

          return (
            <div className="col-lg-4" key={ticketClass.id}>
              <div className={`card border-0 shadow-sm h-100 ticket-class-card ${classTheme(ticketClass.name)}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div className="ticket-class-icon">
                      <FaTicketAlt />
                    </div>
                    <span className={`badge ${statusBadge(ticketClass.saleStatus)}`}>
                      {ticketClass.saleStatus}
                    </span>
                  </div>

                  <h4 className="fw-semibold mb-1" style={{ fontSize: "18px" }}>
                    {ticketClass.name}
                  </h4>
                  <div className="ticket-class-price fw-semibold mb-3" style={{ fontSize: "20px" }}>
                    Rs. {Number(ticketClass.price || 0).toLocaleString("en-IN")}
                  </div>

                  <p className="text-muted small mb-3">{ticketClass.description}</p>

                  <div className="row g-2 mb-3">
                    <MiniStat label="Seats" value={seats} />
                    <MiniStat label="Sold" value={sold} />
                    <MiniStat label="Available" value={available} />
                  </div>

                  <div className="border rounded-3 p-3 bg-light mb-3">
                    <div className="fw-semibold small mb-1">Benefits</div>
                    <div className="text-muted small">{ticketClass.benefits || "No benefits added"}</div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border"
                      onClick={() => editTicketClass(ticketClass)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border"
                      onClick={() => removeTicketClass(ticketClass.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{ticketClassStyles}</style>
    </div>
  );
}

function buildSoldStats(registrations) {
  return registrations.reduce(
    (stats, registration) => {
      if (["CANCELLED", "WAITLISTED"].includes(registration.status)) {
        return stats;
      }

      const quantity =
        registration.registrationType === "AUDIENCE"
          ? Math.max(Number(registration.ticketQuantity || 1), 1)
          : 1;
      const ticketClassId = registration.ticketClass?.id;

      stats.totalSold += quantity;

      if (ticketClassId) {
        stats.byClass[ticketClassId] = (stats.byClass[ticketClassId] || 0) + quantity;
      } else {
        stats.unassignedSold += quantity;
      }

      return stats;
    },
    { byClass: {}, totalSold: 0, unassignedSold: 0 }
  );
}

function normalizeTicketClasses(classes, soldStats) {
  return classes.map((ticketClass, index) => {
    const seats = Number(ticketClass.seats || 0);
    const storedSold = Number(ticketClass.sold || 0);
    const classSold = Number(soldStats.byClass[ticketClass.id] || 0);
    const unassignedSold = classes.length === 1 || index === 0 ? soldStats.unassignedSold : 0;
    const sold = Math.max(storedSold, classSold + unassignedSold);
    const saleStatus =
      seats > 0 && sold >= seats && ticketClass.saleStatus === "Active"
        ? "Sold Out"
        : ticketClass.saleStatus || "Active";

    return {
      ...ticketClass,
      price: Number(ticketClass.price || 0),
      seats,
      sold,
      maxPerBuyer: Math.max(Number(ticketClass.maxPerBuyer || 1), 1),
      saleStatus,
      active: ticketClass.active !== false
    };
  });
}

function SummaryCard({ label, value }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <div className="fs-5 fw-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="col-4">
      <div className="border rounded-3 p-2 text-center">
        <div className="text-muted small">{label}</div>
        <div className="fw-semibold">{value}</div>
      </div>
    </div>
  );
}

function statusBadge(status) {
  if (status === "Active") return "bg-success-subtle text-success";
  if (status === "Paused") return "bg-warning-subtle text-warning";
  if (status === "Sold Out") return "bg-danger-subtle text-danger";
  return "bg-secondary-subtle text-secondary";
}

function classTheme(name) {
  const className = name.toLowerCase();

  if (className.includes("silver")) return "ticket-class-silver";
  if (className.includes("gold")) return "ticket-class-gold";
  if (className.includes("diamond")) return "ticket-class-diamond";
  if (className.includes("vip")) return "ticket-class-vip";
  if (className.includes("student")) return "ticket-class-student";
  if (className.includes("early")) return "ticket-class-early";
  if (className.includes("group")) return "ticket-class-group";
  return "ticket-class-normal";
}

const ticketClassStyles = `
  .ticket-class-card {
    border-top: 4px solid var(--ticket-accent) !important;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .ticket-class-card:hover {
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12) !important;
    transform: translateY(-2px);
  }

  .ticket-class-icon {
    align-items: center;
    background: var(--ticket-soft);
    border-radius: 8px;
    color: var(--ticket-accent);
    display: flex;
    height: 42px;
    justify-content: center;
    width: 42px;
  }

  .ticket-class-price {
    color: var(--ticket-accent);
  }

  .ticket-class-normal {
    --ticket-accent: #4f46e5;
    --ticket-soft: #eef2ff;
  }

  .ticket-class-silver {
    --ticket-accent: #64748b;
    --ticket-soft: #f1f5f9;
  }

  .ticket-class-gold {
    --ticket-accent: #ca8a04;
    --ticket-soft: #fef3c7;
  }

  .ticket-class-diamond {
    --ticket-accent: #0891b2;
    --ticket-soft: #cffafe;
  }

  .ticket-class-vip {
    --ticket-accent: #7c3aed;
    --ticket-soft: #ede9fe;
  }

  .ticket-class-student {
    --ticket-accent: #16a34a;
    --ticket-soft: #dcfce7;
  }

  .ticket-class-early {
    --ticket-accent: #ea580c;
    --ticket-soft: #ffedd5;
  }

  .ticket-class-group {
    --ticket-accent: #2563eb;
    --ticket-soft: #dbeafe;
  }
`;

export default TicketClasses;
