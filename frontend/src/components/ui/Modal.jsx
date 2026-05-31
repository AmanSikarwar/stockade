import { createPortal } from "react-dom";

import { Icon } from "../icons/Icon";
import { Button } from "./Button";
import { useOverlay } from "./useOverlay";

export function Modal({ title, children, footer, onClose, width = 460 }) {
  const dialogRef = useOverlay(onClose);

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
      >
        <div className="modal-head">
          <span className="t-h3">{title}</span>
          <button type="button" className="overlay-close" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            type="button"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="t-body text-2">{message}</p>
    </Modal>
  );
}
