import React, { useRef } from "react";
import { BsCalendarEvent } from "react-icons/bs";

export default function IndianDatePicker({
  value,
  onChange,
  className = "form-control",
  placeholder = "DD/MM/YYYY",
  required = false,
  min = new Date().toISOString().split("T")[0],
  style = {},
}) {
  const hiddenInputRef = useRef(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for visible display
  const displayValue = React.useMemo(() => {
    if (!value) return "";
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-");
      return `${d}/${m}/${y}`;
    }
    return str;
  }, [value]);

  const handleDisplayChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    // Allow user to edit DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split("/");
      onChange(`${y}-${m}-${d}`);
    }
  };

  const handleCalendarChange = (e) => {
    onChange(e.target.value);
  };

  const triggerPicker = () => {
    if (hiddenInputRef.current) {
      if (typeof hiddenInputRef.current.showPicker === "function") {
        hiddenInputRef.current.showPicker();
      } else {
        hiddenInputRef.current.click();
      }
    }
  };

  return (
    <div className="position-relative d-flex align-items-center w-100" style={style}>
      <input
        type="text"
        className={`${className} pe-5`}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleDisplayChange}
        onClick={triggerPicker}
        readOnly
        style={{ cursor: "pointer", background: "#ffffff" }}
        required={required}
      />
      <button
        type="button"
        className="btn position-absolute end-0 top-50 translate-middle-y border-0 text-primary p-2 d-flex align-items-center justify-content-center"
        onClick={triggerPicker}
        title="Click to select date"
        style={{ zIndex: 5, background: "transparent" }}
        tabIndex="-1"
      >
        <BsCalendarEvent size={18} />
      </button>
      <input
        ref={hiddenInputRef}
        type="date"
        min={min || undefined}
        value={value || ""}
        onChange={handleCalendarChange}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: "1px",
          height: "1px",
          top: 0,
          left: 0,
        }}
        tabIndex="-1"
      />
    </div>
  );
}
