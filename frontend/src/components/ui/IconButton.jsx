import { Icon } from "../icons/Icon";

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      className={`btn btn-icon btn-${variant} btn-${size} ${className}`.trim()}
      aria-label={label}
      title={label}
      type="button"
      {...props}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 18} />
    </button>
  );
}
