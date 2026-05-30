import { Icon } from "../icons/Icon";

const toneIcon = {
  danger: "outStock",
  info: "backorder",
  success: "inStock",
  warning: "lowStock",
};

export function StatusBadge({ children, tone = "info" }) {
  return (
    <span className={`status-badge status-${tone}`}>
      <Icon name={toneIcon[tone]} size={14} />
      {children}
    </span>
  );
}
