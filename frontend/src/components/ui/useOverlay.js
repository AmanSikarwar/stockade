import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Shared chrome for portal overlays (Modal, Drawer):
 * - Escape closes
 * - body scroll lock while open
 * - moves focus into the dialog, traps Tab inside it, and restores focus to
 *   the previously focused element on close.
 * Returns a ref to attach to the dialog container (give it tabIndex={-1}).
 */
export function useOverlay(onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const node = ref.current;

    // Respect an autofocused control inside; otherwise focus the dialog itself.
    if (node && !node.contains(document.activeElement)) {
      node.focus();
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab" || !node) return;

      const items = node.querySelectorAll(FOCUSABLE);
      if (!items.length) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === node || !node.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  return ref;
}
