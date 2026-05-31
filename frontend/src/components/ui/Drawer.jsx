import { createPortal } from "react-dom";

import { Icon } from "../icons/Icon";
import { useOverlay } from "./useOverlay";

export function Drawer({ title, subtitle, children, footer, onClose, width = 480 }) {
  const dialogRef = useOverlay(onClose);

  return createPortal(
    <div
      className="overlay overlay-end"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
      >
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-h3">{title}</div>
            {subtitle ? <div className="t-caption muted">{subtitle}</div> : null}
          </div>
          <button type="button" className="overlay-close" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
