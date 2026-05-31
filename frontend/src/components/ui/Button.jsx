import { Icon } from "../icons/Icon";

export function Button({
  children,
  className = "",
  icon,
  iconRight,
  isLoading = false,
  block = false,
  size = "md",
  type = "button",
  variant = "primary",
  disabled = false,
  ...props
}) {
  const iconSize = size === "sm" ? 16 : 18;
  const classes = ["btn", `btn-${variant}`, `btn-${size}`, block ? "btn-block" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={isLoading || disabled} type={type} {...props}>
      {isLoading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={iconSize} />
      ) : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
}
