import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BsChevronRight } from "react-icons/bs";

const SELECTOR = [
  ".manage-subnav",
  ".registration-subnav",
  ".event-workspace-subnav",
  ".admin-scroll-tabs",
  ".organizer-scroll-tabs",
  ".admin-mode-tabs",
  ".organizer-mode-tabs",
].join(",");

export default function HorizontalMenuArrows() {
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const discover = () => {
      const next = Array.from(document.querySelectorAll(SELECTOR));
      setMenus((current) => {
        if (current.length === next.length && current.every((node, index) => node === next[index])) return current;
        return next;
      });
    };

    discover();
    const observer = new MutationObserver(discover);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return menus.map((menu, index) => (
    <MenuControls key={`${menu.className}-${index}`} menu={menu} />
  ));
}

function MenuControls({ menu }) {
  const [state, setState] = useState({ mobile: false, overflow: false, start: true, end: false, top: 0 });

  useEffect(() => {
    const update = () => {
      const mobile = window.matchMedia("(max-width: 767.98px)").matches;
      const overflow = menu.scrollWidth > menu.clientWidth + 4;
      setState({
        mobile,
        overflow,
        start: menu.scrollLeft <= 4,
        end: menu.scrollLeft + menu.clientWidth >= menu.scrollWidth - 4,
        top: menu.offsetTop + menu.offsetHeight / 2,
      });
    };

    update();
    menu.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(menu);
    return () => {
      menu.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
    };
  }, [menu]);

  if (!state.mobile || !state.overflow || !menu.parentElement) return null;

  const moveNext = () => {
    const items = Array.from(menu.children).filter((child) =>
      child.matches("a, button") && !child.classList.contains("horizontal-menu-arrow")
    );
    const current = menu.scrollLeft;
    const offsets = items.map((item) => item.offsetLeft);
    let target;

    target = offsets.find((offset) => offset > current + 8);
    if (target === undefined) target = menu.scrollWidth - menu.clientWidth;

    menu.scrollTo({ left: target, behavior: "smooth" });
  };

  menu.parentElement.classList.add("horizontal-menu-arrow-host");

  return createPortal(
    <div className="horizontal-menu-arrow-controls" style={{ top: state.top }} aria-hidden="false">
      {!state.end && (
        <button type="button" className="horizontal-menu-arrow next" onClick={moveNext} aria-label="Next menu page">
          <BsChevronRight />
        </button>
      )}
    </div>,
    menu.parentElement,
  );
}
