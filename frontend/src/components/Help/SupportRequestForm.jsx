import { useEffect, useState } from "react";
import { BsArrowLeft, BsCheck2Circle, BsClockHistory, BsEnvelope, BsInbox, BsSend, BsTelephone, BsWhatsapp } from "react-icons/bs";
import api from "../../api/axiosConfig";

const types = [["FEEDBACK","Share feedback"],["PROBLEM","Report a problem"],["FEATURE_REQUEST","Suggest a feature"],["PAYMENT_SUBSCRIPTION","Payment or subscription"],["ACCOUNT_ACCESS","Account or access"],["GENERAL","General support"]];
const emptyForm = { type:"FEEDBACK", subject:"", description:"", priority:"MEDIUM", contactEmail:"", screenshotUrl:"" };
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "support@ficbackrooms.com";
const supportPhone = import.meta.env.VITE_SUPPORT_PHONE || "+919363063276";
const whatsappNumber = (import.meta.env.VITE_SUPPORT_WHATSAPP || supportPhone).replace(/\D/g, "");
const readable = (value="") => value.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
const getError = (error) => error.response?.data?.message || error.response?.data?.error || (typeof error.response?.data === "string" ? error.response.data : "Unable to send your request. Please try again.");

export default function SupportRequestForm({ onBack }) {
  const [tab,setTab] = useState("new");
  const [form,setForm] = useState(emptyForm);
  const [requests,setRequests] = useState([]);
  const [loading,setLoading] = useState(false);
  const [loadingRequests,setLoadingRequests] = useState(false);
  const [error,setError] = useState("");
  const [created,setCreated] = useState(null);

  const loadRequests = async () => {
    setLoadingRequests(true); setError("");
    try { const {data}=await api.get("/support-requests/mine"); setRequests(Array.isArray(data)?data:[]); }
    catch (requestError) { setError(getError(requestError)); }
    finally { setLoadingRequests(false); }
  };
  useEffect(()=>{ if(tab==="mine") loadRequests(); },[tab]);
  const update=(event)=>setForm((current)=>({...current,[event.target.name]:event.target.value}));
  const submit=async(event)=>{
    event.preventDefault(); setError(""); setCreated(null);
    if(!form.subject.trim()||!form.description.trim()){setError("Subject and description are required.");return;}
    setLoading(true);
    try{
      const portalId=Number(localStorage.getItem("portalId"));
      const {data}=await api.post("/support-requests",{...form,subject:form.subject.trim(),description:form.description.trim(),contactEmail:form.contactEmail.trim()||null,screenshotUrl:form.screenshotUrl.trim()||null,currentPage:window.location.href,portalId:Number.isFinite(portalId)&&portalId>0?portalId:null});
      setCreated(data); setForm(emptyForm);
    }catch(requestError){setError(getError(requestError));}finally{setLoading(false);}
  };

  return <div className="fic-support-view">
    <div className="fic-help-view-header"><button type="button" onClick={onBack}><BsArrowLeft/></button><span><b>Feedback & Support</b></span></div>
    <div className="fic-direct-support">
      <a href={`mailto:${supportEmail}?subject=FIC BackRooms Support`}><BsEnvelope/><span><b>Email Support</b><small>{supportEmail}</small></span></a>
      <a href={`tel:${supportPhone}`}><BsTelephone/><span><b>Call Support</b><small>{supportPhone}</small></span></a>
      <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello FIC BackRooms Support, I need assistance with the platform.")}`} target="_blank" rel="noreferrer"><BsWhatsapp/><span><b>WhatsApp Support</b><small>Start a conversation</small></span></a>
    </div>
    <div className="fic-support-tabs"><button type="button" className={tab==="new"?"active":""} onClick={()=>{setTab("new");setError("");}}>New Request</button><button type="button" className={tab==="mine"?"active":""} onClick={()=>{setTab("mine");setError("");}}>My Requests</button></div>
    {error&&<div className="fic-support-error">{error}</div>}
    {tab==="new"&&(created?<div className="fic-support-success"><BsCheck2Circle/><h3>Request sent successfully</h3><p>Our support team can now review your request.</p><div><span>Reference</span><strong>{created.referenceCode||`SUP-${created.id}`}</strong></div><div><span>Status</span><strong>{readable(created.status||"OPEN")}</strong></div><button type="button" onClick={()=>setCreated(null)}>Create another request</button><button type="button" className="secondary" onClick={()=>setTab("mine")}>View my requests</button></div>:<form className="fic-support-form" onSubmit={submit}>
      <label>What can we help with?<select name="type" value={form.type} onChange={update}>{types.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
      <label>Subject<input name="subject" maxLength={200} value={form.subject} onChange={update} placeholder="Briefly describe your request"/></label>
      <label>Description<textarea name="description" maxLength={4000} value={form.description} onChange={update} placeholder="Tell us what happened, what you expected, and useful details."/></label>
      <div className="fic-support-form-row"><label>Priority<select name="priority" value={form.priority} onChange={update}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><label>Contact email <small>Optional</small><input type="email" name="contactEmail" value={form.contactEmail} onChange={update} placeholder="you@example.com"/></label></div>
      <label>Screenshot link <small>Optional</small><input type="url" name="screenshotUrl" value={form.screenshotUrl} onChange={update} placeholder="https://..."/></label>
      <div className="fic-support-page-note">Current page is attached automatically.</div><button className="fic-support-submit" type="submit" disabled={loading}>{loading?"Sending...":<><BsSend/> Send Request</>}</button>
    </form>)}
    {tab==="mine"&&<div className="fic-support-requests">{loadingRequests?<div className="fic-support-empty"><BsClockHistory/>Loading requests...</div>:requests.length===0?<div className="fic-support-empty"><BsInbox/><b>No support requests yet</b><span>Your submitted requests will appear here.</span></div>:requests.map((request)=><article key={request.id}><div><span className={`status ${(request.status||"open").toLowerCase()}`}>{readable(request.status)}</span><small>{request.referenceCode||`SUP-${request.id}`}</small></div><b>{request.subject}</b><p>{request.description}</p><footer><span>{readable(request.type)}</span><time>{request.createdAt?new Date(request.createdAt).toLocaleDateString():""}</time></footer>{request.adminResponse&&<aside><strong>Support response</strong><p>{request.adminResponse}</p></aside>}</article>)}</div>}
  </div>;
}
