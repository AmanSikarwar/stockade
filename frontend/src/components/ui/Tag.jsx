import { Icon } from "../icons/Icon";

export function Tag({ children, icon, onClose, closeLabel = "Remove" }) {
  return (
    <span className="tag">
      {icon ? <Icon name={icon} size={13} stroke={1.9} /> : null}
      {children}
      {onClose ? (
        <button type="button" className="tag-x" aria-label={closeLabel} onClick={onClose}>
          <Icon name="close" size={12} stroke={2.2} />
        </button>
      ) : null}
    </span>
  );
}
