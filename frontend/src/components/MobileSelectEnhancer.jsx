import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";

const MOBILE_QUERY = "(max-width: 767.98px)";

function getSelectLabel(select) {
  if (!select) return "Select an option";

  if (select.id) {
    const explicitLabel = document.querySelector(
      `label[for="${CSS.escape(select.id)}"]`,
    );
    if (explicitLabel?.textContent?.trim()) {
      return explicitLabel.textContent.replace(/\s*\*\s*$/, "").trim();
    }
  }

  const nearbyLabel =
    select.closest("label") ||
    select.parentElement?.querySelector(":scope > label, :scope > .form-label") ||
    select.parentElement?.previousElementSibling;

  return nearbyLabel?.textContent?.replace(/\s*\*\s*$/, "").trim() ||
    select.getAttribute("aria-label") ||
    "Select an option";
}

export default function MobileSelectEnhancer() {
  const [activeSelect, setActiveSelect] = useState(null);
  const [, setVersion] = useState(0);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const select = event.target.closest?.("select");
      if (
        !select ||
        select.multiple ||
        select.disabled ||
        !window.matchMedia(MOBILE_QUERY).matches
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      select.blur();
      setActiveSelect(select);
      setVersion((value) => value + 1);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);

  useEffect(() => {
    if (!activeSelect) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveSelect(null);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSelect]);

  const options = useMemo(() => {
    if (!activeSelect) return [];
    return Array.from(activeSelect.options).map((option) => ({
      value: option.value,
      label: option.textContent.trim(),
      disabled: option.disabled,
      selected: option.selected,
    }));
  }, [activeSelect]);

  if (!activeSelect) return null;

  const chooseOption = (option) => {
    if (option.disabled) return;

    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(activeSelect, option.value);
    activeSelect.dispatchEvent(new Event("input", { bubbles: true }));
    activeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    activeSelect.focus({ preventScroll: true });
    setActiveSelect(null);
  };

  return (
    <div
      className="mobile-select-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setActiveSelect(null);
      }}
    >
      <section
        className="mobile-select-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={getSelectLabel(activeSelect)}
      >
        <header className="mobile-select-header">
          <div>
            <small>Choose option</small>
            <strong>{getSelectLabel(activeSelect)}</strong>
          </div>
          <button
            type="button"
            aria-label="Close options"
            onClick={() => setActiveSelect(null)}
          >
            <FiX />
          </button>
        </header>

        <div className="mobile-select-options" role="listbox">
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              role="option"
              aria-selected={option.selected}
              disabled={option.disabled}
              className={option.selected ? "selected" : ""}
              onClick={() => chooseOption(option)}
            >
              <span>{option.label}</span>
              {option.selected ? <FiCheck /> : <FiChevronDown />}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
