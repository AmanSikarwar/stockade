import { Icon } from "../icons/Icon";

export function Select({ className = "", children, ...props }) {
  return (
    <span className="select-wrap">
      <select className={`select ${className}`.trim()} {...props}>
        {children}
      </select>
      <span className="chev">
        <Icon name="chevron" size={14} stroke={2} />
      </span>
    </span>
  );
}
