import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";

const CANDIDATE_QUERY = "(max-width: 1024px)";

export default function MobileSelectEnhancer() {
  const [activeSelect, setActiveSelect] = useState(null);
  const [menuStyle, setMenuStyle] = useState({});
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef(null);
  const justClosedTimeRef = useRef(0);

  const isEligible = () => {
    return (
      window.innerWidth <= 1024 ||
      window.matchMedia(CANDIDATE_QUERY).matches ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  };

  // Measure and position the dropdown menu directly beneath (or above) the active select
  const positionMenu = (select) => {
    const target = select || activeSelect;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const padding = 8;

    // Constrain width to never exceed the mobile viewport
    let width = Math.min(rect.width, screenWidth - 2 * padding);
    if (width < 220 && screenWidth > 240) {
      width = Math.min(280, screenWidth - 2 * padding);
    }

    // Horizontal alignment clamped inside screen bounds
    let left = rect.left;
    if (left + width > screenWidth - padding) {
      left = screenWidth - width - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Vertical positioning: default downwards from select ("native down")
    const spaceBelow = screenHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUpward = spaceBelow < 180 && spaceAbove > spaceBelow;

    let top;
    let maxHeight;

    if (shouldOpenUpward) {
      maxHeight = Math.min(300, Math.max(140, spaceAbove - 16));
      top = Math.max(padding, rect.top - maxHeight - 4);
    } else {
      maxHeight = Math.min(300, Math.max(140, spaceBelow - 16));
      top = rect.bottom + 4;
    }

    setOpenUpward(shouldOpenUpward);
    setMenuStyle({
      position: "fixed",
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(width)}px`,
      maxWidth: `calc(100vw - ${2 * padding}px)`,
      maxHeight: `${Math.round(maxHeight)}px`,
      zIndex: 99999,
    });
  };

  useEffect(() => {
    // 1. Intercept pointerdown on selects
    const handlePointerDown = (event) => {
      if (event.target.closest?.(".native-dropdown-menu")) return;

      const select = event.target.closest?.("select");
      if (!select || select.multiple || select.disabled || !isEligible()) return;

      // Prevent native browser default so OS popup never opens
      event.preventDefault();
      event.stopPropagation();
      select.blur();

      const now = Date.now();
      if (now - justClosedTimeRef.current < 250) {
        return;
      }

      if (activeSelect === select) {
        justClosedTimeRef.current = now;
        setActiveSelect(null);
      } else {
        positionMenu(select);
        setActiveSelect(select);
      }
    };

    // 2. Intercept mousedown on selects (Desktop Chrome native trigger)
    const handleMouseDown = (event) => {
      if (event.target.closest?.(".native-dropdown-menu")) return;

      const select = event.target.closest?.("select");
      if (!select || select.multiple || select.disabled || !isEligible()) return;

      event.preventDefault();
      event.stopPropagation();
      select.blur();
    };

    // 3. Intercept click on selects
    const handleClick = (event) => {
      if (event.target.closest?.(".native-dropdown-menu")) return;

      const select = event.target.closest?.("select");
      if (!select || select.multiple || select.disabled || !isEligible()) return;

      event.preventDefault();
      event.stopPropagation();
      select.blur();
    };

    // 4. Intercept keydown on selects
    const handleKeyDown = (event) => {
      const select = event.target.closest?.("select");
      if (!select || select.multiple || select.disabled || !isEligible()) return;

      if ([" ", "Enter", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        if (!activeSelect) {
          positionMenu(select);
          setActiveSelect(select);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [activeSelect]);

  // Recalculate position on scroll or resize while open
  useLayoutEffect(() => {
    if (!activeSelect) return;
    positionMenu(activeSelect);

    const handleScrollOrResize = () => {
      positionMenu(activeSelect);
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeSelect]);

  // Keyboard navigation when open
  useEffect(() => {
    if (!activeSelect) return;

    const handleGlobalKey = (event) => {
      if (event.key === "Escape" || event.key === "Tab") {
        justClosedTimeRef.current = Date.now();
        setActiveSelect(null);
      }
    };

    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
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

  const closeDropdown = () => {
    justClosedTimeRef.current = Date.now();
    setActiveSelect(null);
  };

  const chooseOption = (option) => {
    if (option.disabled) return;

    const targetSelect = activeSelect;
    closeDropdown();

    if (targetSelect) {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(targetSelect, option.value);

      targetSelect.dispatchEvent(new Event("input", { bubbles: true }));
      targetSelect.dispatchEvent(new Event("change", { bubbles: true }));
      targetSelect.blur(); // Never re-focus, explicitly blur to stop native popup
    }
  };

  return (
    <>
      {/* Invisible backdrop to dismiss when tapping outside */}
      <div
        className="native-dropdown-backdrop"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeDropdown();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeDropdown();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Downward-anchored dropdown options table */}
      <div
        ref={menuRef}
        className={`native-dropdown-menu ${openUpward ? "open-upward" : "open-downward"}`}
        style={menuStyle}
        role="listbox"
      >
        <div className="native-dropdown-table">
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              role="option"
              aria-selected={option.selected}
              disabled={option.disabled}
              className={`native-dropdown-row ${option.selected ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                chooseOption(option);
              }}
            >
              <span className="native-dropdown-label">{option.label}</span>
              {option.selected && (
                <span className="native-dropdown-check">
                  <FiCheck />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
