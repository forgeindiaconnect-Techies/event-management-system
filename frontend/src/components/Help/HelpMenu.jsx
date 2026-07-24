import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsChatDots, BsCompass, BsHeadset, BsQuestionCircle, BsXLg } from "react-icons/bs";
import HelpAssistant from "./HelpAssistant";
import SupportRequestForm from "./SupportRequestForm";

const options = [
  ["assistant", BsChatDots, "Ask FIC Assistant", "Get immediate answers about using the platform."],
  ["tour", BsCompass, "Take a Tour", "Learn this dashboard with a guided walkthrough."],
  ["support", BsHeadset, "Feedback & Support", "Report a problem, suggest a feature or contact support."]
];

function HelpMenu({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu");
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const select = (key) => {
    if (key === "assistant") {
      setView("assistant");
      return;
    }
    if (key === "tour") {
      setOpen(false);
      setView("menu");
      navigate("/help/tour");
      return;
    }
    if (key === "support") {
      setView("support");
      return;
    }
    onSelect?.(key);
  };

  return (
    <div className="fic-help-menu" ref={menuRef}>
      <button type="button" className="fic-help-trigger" aria-label="Open Help and Support" aria-expanded={open} title="Help and Support" onClick={() => setOpen((value) => !value)}>
        <BsQuestionCircle size={23} />
      </button>

      {open && (
        <div className="fic-help-popup" role="dialog" aria-label="Help and Support">
          {view === "assistant" ? (
            <HelpAssistant onBack={() => setView("menu")} />
          ) : view === "support" ? (
            <SupportRequestForm onBack={() => setView("menu")} />
          ) : (
            <>
              <div className="fic-help-popup-header">
                <div><strong>How can we help?</strong><small>Choose the support you need.</small></div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close Help and Support"><BsXLg /></button>
              </div>
              <div className="fic-help-options">
                {options.map(([key, Icon, title, description]) => (
                  <button type="button" key={key} onClick={() => select(key)}>
                    <span><Icon /></span>
                    <div><strong>{title}</strong><small>{description}</small></div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .fic-help-menu{position:relative;display:inline-flex;align-items:center}
  .fic-help-trigger{display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;background:transparent;color:inherit;transition:.18s ease}
  .fic-help-trigger:hover{opacity:.82;transform:scale(1.06)}
  .fic-help-popup{position:absolute;top:calc(100% + 14px);right:0;z-index:3000;width:340px;overflow:hidden;border:1px solid #e4e7ec;border-radius:14px;background:#fff;color:#172033;box-shadow:0 18px 45px rgba(15,23,42,.22)}
  .fic-help-popup-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:17px 18px 14px;border-bottom:1px solid #edf0f4}
  .fic-help-popup-header>div,.fic-help-options button>div{display:grid;min-width:0;text-align:left}
  .fic-help-popup-header strong{font-size:16px}.fic-help-popup-header small,.fic-help-options small{margin-top:3px;color:#697386;font-size:12px;line-height:1.4}
  .fic-help-popup-header button{display:inline-flex;padding:5px;border:0;background:transparent;color:#667085}
  .fic-help-options{display:grid;gap:4px;padding:8px}
  .fic-help-options>button{display:grid;grid-template-columns:40px 1fr;align-items:center;gap:12px;width:100%;padding:11px;border:0;border-radius:10px;background:transparent;color:#172033;text-align:left;transition:background .18s ease}
  .fic-help-options>button:hover{background:#f3f5ff}.fic-help-options>button>span{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:#eeecff;color:#5548d9;font-size:19px}.fic-help-options strong{font-size:13px}
  .fic-help-view-header{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #edf0f4}.fic-help-view-header>button{display:inline-flex;padding:6px;border:0;border-radius:8px;background:#f2f4f7;color:#344054}.fic-help-view-header>span{display:flex;align-items:center;gap:8px}
  .fic-assistant-messages{display:grid;gap:8px;max-height:230px;overflow-y:auto;padding:14px}.fic-assistant-message{max-width:88%;padding:9px 11px;border-radius:11px;font-size:12px;line-height:1.45}.fic-assistant-message.bot{justify-self:start;background:#f1f3ff;color:#25205f}.fic-assistant-message.user{justify-self:end;background:#5548d9;color:#fff}
  .fic-assistant-input{display:grid;grid-template-columns:1fr 38px;gap:7px;padding:11px 14px 14px;border-top:1px solid #edf0f4}.fic-assistant-input input{min-width:0;padding:9px 10px;border:1px solid #d9dde5;border-radius:9px;font-size:12px;outline:none}.fic-assistant-input input:focus{border-color:#6960dc}.fic-assistant-input button{display:grid;place-items:center;border:0;border-radius:9px;background:#5548d9;color:#fff}
  .fic-assistant-input input:disabled,.fic-assistant-input button:disabled{cursor:not-allowed;opacity:.58}
  .fic-support-view{max-height:min(680px,calc(100vh - 90px));overflow-y:auto}.fic-direct-support{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:10px 10px 0}.fic-direct-support>a{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:10px 5px;border:1px solid #e3e5ef;border-radius:9px;background:#fafaff;color:#5548d9;text-align:center;text-decoration:none;transition:.18s}.fic-direct-support>a:hover{border-color:#bdb7ff;background:#f2f0ff;transform:translateY(-1px)}.fic-direct-support>a>svg{font-size:18px}.fic-direct-support>a>span{display:grid;min-width:0}.fic-direct-support b{color:#302a79;font-size:10px}.fic-direct-support small{overflow:hidden;color:#7c8495;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.fic-support-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:10px;padding:4px;border-radius:10px;background:#f2f4f7}.fic-support-tabs button{padding:8px;border:0;border-radius:7px;background:transparent;color:#667085;font-size:12px}.fic-support-tabs button.active{background:#fff;color:#5548d9;font-weight:750;box-shadow:0 2px 7px rgba(16,24,40,.08)}.fic-support-error{margin:0 12px 10px;padding:9px 10px;border:1px solid #f5b9bd;border-radius:8px;background:#fff1f2;color:#b4232c;font-size:11px}.fic-support-form{display:grid;gap:10px;padding:2px 14px 15px}.fic-support-form label{display:grid;gap:5px;color:#344054;font-size:11px;font-weight:700}.fic-support-form label small{color:#98a2b3;font-weight:400}.fic-support-form input,.fic-support-form select,.fic-support-form textarea{width:100%;padding:9px 10px;border:1px solid #d9dde5;border-radius:8px;background:#fff;color:#172033;font-size:12px;outline:none}.fic-support-form textarea{min-height:88px;resize:vertical}.fic-support-form input:focus,.fic-support-form select:focus,.fic-support-form textarea:focus{border-color:#6960dc;box-shadow:0 0 0 3px rgba(105,96,220,.1)}.fic-support-form-row{display:grid;grid-template-columns:.75fr 1.25fr;gap:8px}.fic-support-page-note{padding:7px 9px;border-radius:7px;background:#f7f7fc;color:#667085;font-size:10px}.fic-support-submit{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border:0;border-radius:9px;background:#5548d9;color:#fff;font-size:12px;font-weight:750}.fic-support-submit:disabled{opacity:.65}.fic-support-success{display:flex;flex-direction:column;align-items:center;padding:22px 18px;text-align:center}.fic-support-success>svg{color:#15935f;font-size:36px}.fic-support-success h3{margin:9px 0 2px;font-size:16px}.fic-support-success>p{margin:0 0 13px;color:#667085;font-size:12px}.fic-support-success>div{display:flex;justify-content:space-between;width:100%;padding:9px;border-top:1px solid #edf0f4;font-size:11px}.fic-support-success>button{width:100%;margin-top:10px;padding:9px;border:0;border-radius:8px;background:#5548d9;color:#fff;font-size:11px}.fic-support-success>button.secondary{margin-top:6px;background:#eeecff;color:#5548d9}.fic-support-requests{display:grid;gap:8px;padding:2px 12px 14px}.fic-support-requests>article{padding:11px;border:1px solid #e4e7ec;border-radius:9px;background:#fff}.fic-support-requests article>div{display:flex;align-items:center;justify-content:space-between}.fic-support-requests .status{padding:3px 7px;border-radius:20px;background:#fff1d6;color:#a15c00;font-size:9px;font-weight:800}.fic-support-requests .status.resolved,.fic-support-requests .status.closed{background:#e6f7ee;color:#15784e}.fic-support-requests article>div small,.fic-support-requests footer{color:#98a2b3;font-size:9px}.fic-support-requests article>b{display:block;margin-top:7px;font-size:12px}.fic-support-requests article>p{display:-webkit-box;overflow:hidden;margin:4px 0 8px;color:#667085;font-size:10px;line-height:1.4;-webkit-line-clamp:2;-webkit-box-orient:vertical}.fic-support-requests footer{display:flex;justify-content:space-between}.fic-support-requests aside{margin-top:9px;padding:8px;border-radius:7px;background:#f1f3ff;color:#302a79}.fic-support-requests aside strong{font-size:10px}.fic-support-requests aside p{margin:3px 0 0;font-size:10px}.fic-support-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:30px 12px;color:#98a2b3;text-align:center;font-size:11px}.fic-support-empty svg{font-size:27px}.fic-support-empty b{color:#475467}
  @media(max-width:576px){.fic-help-popup{position:fixed;top:58px;right:12px;left:12px;width:auto}}
`;

export default HelpMenu;
