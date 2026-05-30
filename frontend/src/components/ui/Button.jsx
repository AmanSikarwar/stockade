import { Icon } from "../icons/Icon";

export function Button({
  children,
  className = "",
  icon,
  isLoading = false,
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      disabled={isLoading || props.disabled}
      type={type}
      {...props}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{isLoading ? "Working..." : children}</span>
    </button>
  );
}
