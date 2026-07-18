import { useEffect, useRef, useState } from "react";
import { BsChatDots, BsCompass, BsHeadset, BsQuestionCircle, BsXLg } from "react-icons/bs";
import HelpAssistant from "./HelpAssistant";
import GuidedTour from "./GuidedTour";

const options = [
  ["assistant", BsChatDots, "Ask FIC Assistant", "Get immediate answers about using the platform."],
  ["tour", BsCompass, "Take a Tour", "Learn this dashboard with a guided walkthrough."],
  ["support", BsHeadset, "Feedback & Support", "Report a problem, suggest a feature or contact support."]
];

function HelpMenu({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu");
  const [tourOpen, setTourOpen] = useState(false);
  const menuRef = useRef(null);

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
      setTourOpen(true);
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
      {tourOpen && <GuidedTour onClose={() => setTourOpen(false)} />}
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
  .fic-assistant-topics{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 12px}.fic-assistant-topics button{padding:6px 9px;border:1px solid #d9ddf7;border-radius:20px;background:#fff;color:#4841a6;font-size:11px}.fic-assistant-topics button:hover{background:#f3f5ff}
  .fic-assistant-input{display:grid;grid-template-columns:1fr 38px;gap:7px;padding:11px 14px 14px;border-top:1px solid #edf0f4}.fic-assistant-input input{min-width:0;padding:9px 10px;border:1px solid #d9dde5;border-radius:9px;font-size:12px;outline:none}.fic-assistant-input input:focus{border-color:#6960dc}.fic-assistant-input button{display:grid;place-items:center;border:0;border-radius:9px;background:#5548d9;color:#fff}
  @media(max-width:576px){.fic-help-popup{position:fixed;top:58px;right:12px;left:12px;width:auto}}
`;

export default HelpMenu;
