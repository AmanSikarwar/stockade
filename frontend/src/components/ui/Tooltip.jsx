import { cloneElement, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight tooltip that renders into a body portal so it is never clipped
 * by scrolling/overflow ancestors (e.g. the collapsed nav rail). Wraps a single
 * focusable/hoverable child and positions itself to the child's right edge.
 */
export function Tooltip({ label, disabled = false, children }) {
  const [pos, setPos] = useState(null);

  function open(event) {
    if (disabled || !label) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  }

  function close() {
    setPos(null);
  }

  const trigger = cloneElement(children, {
    onMouseEnter: open,
    onMouseLeave: close,
    onFocus: open,
    onBlur: close,
  });

  return (
    <>
      {trigger}
      {pos
        ? createPortal(
            <span className="tooltip" role="tooltip" style={{ top: pos.top, left: pos.left }}>
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
