import { Icon } from "../icons/Icon";

export function SearchField({ label = "Search", className = "", ...props }) {
  return (
    <div className={`input-affix ${className}`.trim()}>
      <span className="affix-icon">
        <Icon name="search" size={16} />
      </span>
      <span className="sr-only">{label}</span>
      <input className="input" type="search" aria-label={label} {...props} />
    </div>
  );
}
