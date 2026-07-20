import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BsPlusLg, BsPencil, BsTrash, BsX } from "react-icons/bs";
import api from "../../api/axiosConfig";

const configs = {
  tasks: {
    title: "Tasks & Checklists",
    description: "Plan operational work, assign ownership and track completion.",
    singular: "Task",
    endpoint: "tasks",
    empty: { title: "", description: "", taskType: "TASK", category: "", priority: "MEDIUM", status: "NOT_STARTED", assignedUserName: "", dueDateTime: "", completionNotes: "" },
    fields: [
      ["title", "Title", "text", true], ["taskType", "Type", "select", true, ["TASK", "CHECKLIST_ITEM"]],
      ["category", "Category"], ["priority", "Priority", "select", true, ["LOW", "MEDIUM", "HIGH", "URGENT"]],
      ["status", "Status", "select", true, ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]],
      ["assignedUserName", "Assigned person"], ["dueDateTime", "Due date", "datetime-local"],
      ["description", "Description", "textarea"], ["completionNotes", "Completion notes", "textarea"],
    ],
    columns: [["title", "Task"], ["taskType", "Type"], ["assignedUserName", "Owner"], ["priority", "Priority"], ["status", "Status"], ["dueDateTime", "Due"]],
  },
  incidents: {
    title: "Incidents",
    description: "Record issues, assign responders and document resolutions.",
    singular: "Incident",
    endpoint: "incidents",
    empty: { title: "", description: "", category: "", severity: "MEDIUM", status: "OPEN", location: "", assignedUserName: "", resolutionNotes: "" },
    fields: [
      ["title", "Title", "text", true], ["category", "Category"],
      ["severity", "Severity", "select", true, ["LOW", "MEDIUM", "HIGH", "CRITICAL"]],
      ["status", "Status", "select", true, ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]],
      ["location", "Location"], ["assignedUserName", "Assigned responder"],
      ["description", "Description", "textarea"], ["resolutionNotes", "Resolution notes", "textarea"],
    ],
    columns: [["title", "Incident"], ["category", "Category"], ["severity", "Severity"], ["status", "Status"], ["location", "Location"], ["reportedAt", "Reported"]],
  },
  resources: {
    title: "Resources",
    description: "Track equipment, stock, allocations, locations and shortages.",
    singular: "Resource",
    endpoint: "resources",
    empty: { name: "", category: "", ownershipType: "OWNED", totalQuantity: 0, requiredQuantity: 0, availableQuantity: 0, allocatedQuantity: 0, condition: "GOOD", status: "REQUESTED", location: "", responsibleUserName: "", notes: "" },
    fields: [
      ["name", "Resource name", "text", true], ["category", "Category"],
      ["ownershipType", "Ownership", "select", true, ["OWNED", "RENTED", "VENUE_PROVIDED", "SPONSORED", "BORROWED"]],
      ["status", "Status", "select", true, ["REQUESTED", "CONFIRMED", "DELIVERED", "READY", "CHECKED_OUT", "RETURNED"]],
      ["condition", "Condition", "select", true, ["EXCELLENT", "GOOD", "FAIR", "DAMAGED", "UNDER_MAINTENANCE"]],
      ["totalQuantity", "Total quantity", "number"], ["requiredQuantity", "Required quantity", "number"],
      ["availableQuantity", "Available quantity", "number"], ["allocatedQuantity", "Allocated quantity", "number"],
      ["location", "Location"], ["responsibleUserName", "Responsible person"], ["notes", "Notes", "textarea"],
    ],
    columns: [["name", "Resource"], ["category", "Category"], ["ownershipType", "Ownership"], ["requiredQuantity", "Required"], ["availableQuantity", "Available"], ["status", "Status"]],
  },
  vendors: {
    title: "Vendors",
    description: "Manage suppliers, contracts, deliveries and vendor payments.",
    singular: "Vendor",
    endpoint: "vendors",
    empty: { companyName: "", contactPerson: "", email: "", phone: "", serviceCategory: "", status: "PENDING", contractAmount: 0, advancePaid: 0, deliveryDeadline: "", deliveryStatus: "NOT_SCHEDULED", paymentStatus: "NOT_STARTED", notes: "" },
    fields: [
      ["companyName", "Company name", "text", true], ["serviceCategory", "Service category"],
      ["contactPerson", "Contact person"], ["email", "Email", "email"], ["phone", "Phone"],
      ["status", "Vendor status", "select", true, ["PROSPECT", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]],
      ["contractAmount", "Contract amount", "number"], ["advancePaid", "Advance paid", "number"],
      ["deliveryDeadline", "Delivery deadline", "datetime-local"],
      ["deliveryStatus", "Delivery status", "select", true, ["NOT_SCHEDULED", "SCHEDULED", "IN_TRANSIT", "DELIVERED", "DELAYED"]],
      ["paymentStatus", "Payment status", "select", true, ["NOT_STARTED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]],
      ["notes", "Notes", "textarea"],
    ],
    columns: [["companyName", "Vendor"], ["serviceCategory", "Service"], ["contactPerson", "Contact"], ["contractAmount", "Contract"], ["deliveryStatus", "Delivery"], ["paymentStatus", "Payment"]],
  },
};

const expenseEmpty = { title: "", category: "", description: "", vendorId: "", subtotal: 0, taxAmount: 0, amountPaid: 0, currency: "INR", paymentStatus: "", approvalStatus: "PENDING", paymentMethod: "", paymentDate: "", invoiceNumber: "", receiptUrl: "", notes: "" };

function OperationsWorkspace({ section }) {
  if (section === "overview") return <Overview />;
  if (section === "budget") return <BudgetExpenses />;
  return <CrudSection config={configs[section]} />;
}

function Overview() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/events/${id}/operations/overview`).then((res) => setData(res.data)).catch((err) => setError(apiError(err)));
  }, [id]);

  const cards = data ? [
    ["Total tasks", data.totalTasks], ["Pending tasks", data.pendingTasks], ["Completed tasks", data.completedTasks],
    ["Open incidents", data.openIncidents], ["Resources", data.totalResources], ["Ready resources", data.availableResources],
    ["Vendors", data.totalVendors], ["Active vendors", data.activeVendors],
  ] : [];

  return (
    <PageShell title="Operations Overview" description="A live view of event readiness, incidents, resources, vendors and spending." error={error}>
      {!data ? <Loading /> : <>
        <div className="row g-3 mb-4">{cards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>
        <div className="card border-0 shadow-sm"><div className="card-body">
          <h2 className="h5 fw-semibold mb-3">Budget health</h2>
          <div className="row g-3">
            <Money label="Approved budget" value={data.approvedBudget} currency={data.currency} />
            <Money label="Approved expenses" value={data.approvedExpenses} currency={data.currency} />
            <Money label="Amount paid" value={data.amountPaid} currency={data.currency} />
            <Money label="Remaining budget" value={data.remainingBudget} currency={data.currency} />
          </div>
        </div></div>
      </>}
    </PageShell>
  );
}

function CrudSection({ config }) {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const base = `/events/${id}/operations/${config.endpoint}`;

  const load = async () => {
    try { setItems((await api.get(base)).data || []); setError(""); }
    catch (err) { setError(apiError(err)); }
  };
  useEffect(() => { load(); }, [id, config.endpoint]);

  const openNew = () => { setForm(config.empty); setEditingId(null); setShowForm(true); setError(""); };
  const edit = (item) => { setForm(toForm(item, config.fields)); setEditingId(item.id); setShowForm(true); setError(""); };
  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = normalizePayload(form, config.fields);
      if (editingId) await api.put(`${base}/${editingId}`, payload); else await api.post(base, payload);
      setMessage(`${config.singular} ${editingId ? "updated" : "created"} successfully.`);
      setShowForm(false); setEditingId(null); await load();
    } catch (err) { setError(apiError(err)); }
  };
  const remove = async (itemId) => {
    if (!window.confirm(`Delete this ${config.singular.toLowerCase()}?`)) return;
    try { await api.delete(`${base}/${itemId}`); setMessage(`${config.singular} deleted.`); await load(); }
    catch (err) { setError(apiError(err)); }
  };

  return (
    <PageShell title={config.title} description={config.description} error={error} message={message}
      action={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={openNew}><BsPlusLg /> Add {config.singular}</button>}>
      {showForm && <Editor title={`${editingId ? "Edit" : "Add"} ${config.singular}`} fields={config.fields} form={form} setForm={setForm} save={save} close={() => setShowForm(false)} />}
      <DataTable items={items} columns={config.columns} edit={edit} remove={remove} empty={`No ${config.title.toLowerCase()} added yet.`} />
    </PageShell>
  );
}

function BudgetExpenses() {
  const { id } = useParams();
  const base = `/events/${id}/operations`;
  const [budget, setBudget] = useState({ approvedBudget: 0, currency: "INR", notes: "" });
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(expenseEmpty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [budgetRes, expenseRes, vendorRes] = await Promise.all([api.get(`${base}/budget`), api.get(`${base}/expenses`), api.get(`${base}/vendors`)]);
      setBudget(budgetRes.data); setExpenses(expenseRes.data || []); setVendors(vendorRes.data || []); setError("");
    } catch (err) { setError(apiError(err)); }
  };
  useEffect(() => { load(); }, [id]);

  const saveBudget = async (event) => {
    event.preventDefault();
    try { await api.put(`${base}/budget`, { ...budget, approvedBudget: Number(budget.approvedBudget || 0) }); setMessage("Budget saved successfully."); await load(); }
    catch (err) { setError(apiError(err)); }
  };
  const saveExpense = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, vendorId: form.vendorId ? Number(form.vendorId) : null, subtotal: Number(form.subtotal || 0), taxAmount: Number(form.taxAmount || 0), amountPaid: Number(form.amountPaid || 0), paymentStatus: form.paymentStatus || null, paymentDate: form.paymentDate || null };
      if (editingId) await api.put(`${base}/expenses/${editingId}`, payload); else await api.post(`${base}/expenses`, payload);
      setMessage(`Expense ${editingId ? "updated" : "created"} successfully.`); setShowForm(false); setEditingId(null); await load();
    } catch (err) { setError(apiError(err)); }
  };
  const editExpense = (item) => { setForm({ ...expenseEmpty, ...item, vendorId: item.vendor?.id || "", paymentDate: item.paymentDate || "" }); setEditingId(item.id); setShowForm(true); };
  const deleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await api.delete(`${base}/expenses/${expenseId}`); setMessage("Expense deleted."); await load(); }
    catch (err) { setError(apiError(err)); }
  };
  const total = useMemo(() => expenses.filter((e) => e.approvalStatus === "APPROVED").reduce((sum, e) => sum + Number(e.totalAmount || 0), 0), [expenses]);

  return (
    <PageShell title="Budget & Expenses" description="Set the event budget, approve costs and monitor payments." error={error} message={message}
      action={<button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => { setForm(expenseEmpty); setEditingId(null); setShowForm(true); }}><BsPlusLg /> Add Expense</button>}>
      <div className="row g-3 mb-4"><Money label="Approved budget" value={budget.approvedBudget} currency={budget.currency} /><Money label="Approved expenses" value={total} currency={budget.currency} /><Money label="Remaining" value={Number(budget.approvedBudget || 0) - total} currency={budget.currency} /></div>
      <form className="card border-0 shadow-sm mb-4" onSubmit={saveBudget}><div className="card-body">
        <h2 className="h5 fw-semibold mb-3">Event budget</h2><div className="row g-3">
          <div className="col-md-4"><label className="form-label fw-semibold">Approved amount</label><input type="number" min="0" step="0.01" className="form-control" value={budget.approvedBudget ?? 0} onChange={(e) => setBudget({ ...budget, approvedBudget: e.target.value })} /></div>
          <div className="col-md-2"><label className="form-label fw-semibold">Currency</label><input className="form-control" maxLength="10" value={budget.currency || "INR"} onChange={(e) => setBudget({ ...budget, currency: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Notes</label><input className="form-control" value={budget.notes || ""} onChange={(e) => setBudget({ ...budget, notes: e.target.value })} /></div>
        </div><button className="btn btn-outline-primary mt-3">Save Budget</button>
      </div></form>
      {showForm && <ExpenseEditor form={form} setForm={setForm} vendors={vendors} save={saveExpense} close={() => setShowForm(false)} editing={Boolean(editingId)} />}
      <DataTable items={expenses} columns={[["title", "Expense"], ["category", "Category"], ["totalAmount", "Total"], ["amountPaid", "Paid"], ["approvalStatus", "Approval"], ["paymentStatus", "Payment"]]} edit={editExpense} remove={deleteExpense} empty="No expenses recorded yet." />
    </PageShell>
  );
}

function Editor({ title, fields, form, setForm, save, close }) {
  return <form className="card border-0 shadow-sm mb-4" onSubmit={save}><div className="card-header bg-white d-flex justify-content-between align-items-center py-3"><h2 className="h5 mb-0">{title}</h2><button type="button" className="btn btn-sm btn-light" onClick={close}><BsX size={22} /></button></div><div className="card-body"><div className="row g-3">{fields.map((field) => <Field key={field[0]} field={field} value={form[field[0]] ?? ""} change={(value) => setForm({ ...form, [field[0]]: value })} />)}</div><div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-light" onClick={close}>Cancel</button><button className="btn btn-primary">Save</button></div></div></form>;
}

function ExpenseEditor({ form, setForm, vendors, save, close, editing }) {
  const fields = [["title", "Expense title", "text", true], ["category", "Category", "text", true], ["subtotal", "Subtotal", "number"], ["taxAmount", "Tax amount", "number"], ["amountPaid", "Amount paid", "number"], ["currency", "Currency"], ["approvalStatus", "Approval", "select", true, ["DRAFT", "PENDING", "APPROVED", "REJECTED", "CHANGES_REQUESTED"]], ["paymentStatus", "Payment status", "select", false, ["", "NOT_STARTED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]], ["paymentMethod", "Payment method"], ["paymentDate", "Payment date", "date"], ["invoiceNumber", "Invoice number"], ["receiptUrl", "Receipt URL"], ["description", "Description", "textarea"], ["notes", "Notes", "textarea"]];
  return <form className="card border-0 shadow-sm mb-4" onSubmit={save}><div className="card-header bg-white d-flex justify-content-between py-3"><h2 className="h5 mb-0">{editing ? "Edit" : "Add"} Expense</h2><button type="button" className="btn btn-sm btn-light" onClick={close}><BsX size={22} /></button></div><div className="card-body"><div className="row g-3"><div className="col-md-6"><label className="form-label fw-semibold">Vendor</label><select className="form-select" value={form.vendorId || ""} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}><option value="">No vendor</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.companyName}</option>)}</select></div>{fields.map((field) => <Field key={field[0]} field={field} value={form[field[0]] ?? ""} change={(value) => setForm({ ...form, [field[0]]: value })} />)}</div><div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-light" onClick={close}>Cancel</button><button className="btn btn-primary">Save Expense</button></div></div></form>;
}

function Field({ field, value, change }) {
  const [name, label, type = "text", required = false, options = []] = field;
  const cls = type === "textarea" ? "col-12" : "col-md-6";
  return <div className={cls}><label className="form-label fw-semibold">{label}{required && " *"}</label>{type === "select" ? <select className="form-select" required={required} value={value} onChange={(e) => change(e.target.value)}>{options.map((option) => <option key={option || "empty"} value={option}>{option ? pretty(option) : "Automatic"}</option>)}</select> : type === "textarea" ? <textarea className="form-control" rows="3" required={required} value={value} onChange={(e) => change(e.target.value)} /> : <input className="form-control" type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} required={required} value={value} onChange={(e) => change(e.target.value)} />}</div>;
}

function DataTable({ items, columns, edit, remove, empty }) {
  return <div className="card border-0 shadow-sm"><div className="table-responsive">{items.length === 0 ? <div className="text-center text-muted py-5">{empty}</div> : <table className="table table-hover align-middle mb-0"><thead className="table-light"><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}<th className="text-end">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>{columns.map(([key]) => <td key={key}>{display(item[key], key)}</td>)}<td className="text-end text-nowrap"><button className="btn btn-sm btn-light border me-2" onClick={() => edit(item)}><BsPencil /></button><button className="btn btn-sm btn-light border text-danger" onClick={() => remove(item.id)}><BsTrash /></button></td></tr>)}</tbody></table>}</div></div>;
}

function PageShell({ title, description, action, error, message, children }) {
  return <section className="operations-page"><div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4"><div><p className="text-primary fw-bold small text-uppercase mb-1">Event Operations</p><h1 className="h3 fw-bold mb-1">{title}</h1><p className="text-muted mb-0">{description}</p></div>{action}</div>{error && <div className="alert alert-danger">{error}</div>}{message && <div className="alert alert-success">{message}</div>}{children}</section>;
}
function Metric({ label, value }) { return <div className="col-sm-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted small mb-1">{label}</div><div className="fs-3 fw-bold">{value ?? 0}</div></div></div></div>; }
function Money({ label, value, currency }) { return <div className="col-sm-6 col-xl-3"><div className="border rounded-3 p-3 h-100 bg-light"><div className="text-muted small">{label}</div><div className="fs-5 fw-bold">{currency || "INR"} {Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div></div></div>; }
function Loading() { return <div className="text-center text-muted py-5">Loading operations data...</div>; }
function pretty(value) { return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function display(value, key) { if (value === null || value === undefined || value === "") return "—"; if (key.toLowerCase().includes("amount")) return `₹${Number(value).toLocaleString("en-IN")}`; if (key.toLowerCase().includes("date") || key.endsWith("At")) return new Date(value).toLocaleString(); return pretty(value); }
function toForm(item, fields) { const next = {}; fields.forEach(([name, , type]) => { let value = item[name] ?? ""; if (type === "datetime-local" && value) value = String(value).slice(0, 16); next[name] = value; }); return next; }
function normalizePayload(form, fields) { const payload = { ...form }; fields.forEach(([name, , type]) => { if (type === "number") payload[name] = Number(payload[name] || 0); if ((type === "datetime-local" || type === "date") && !payload[name]) payload[name] = null; }); return payload; }
function apiError(error) { return error.response?.data?.message || error.response?.data?.error || (typeof error.response?.data === "string" ? error.response.data : "Unable to complete the request."); }

export default OperationsWorkspace;
