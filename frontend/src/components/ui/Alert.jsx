import { Icon } from "../icons/Icon";

const toneIcon = {
  danger: "lowStock",
  info: "info",
  success: "check",
  warning: "lowStock",
};

export function Alert({ children, className = "", role, tone = "info", title }) {
  return (
    <div
      className={`alert alert-${tone} ${className}`.trim()}
      role={role ?? (tone === "danger" ? "alert" : "status")}
    >
      <Icon name={toneIcon[tone]} size={18} stroke={2} />
      <div className="alert-body">
        {title ? <strong>{title}</strong> : null}
        <span>{children}</span>
      </div>
    </div>
  );
}
