import { Icon } from "../icons/Icon";

export function SearchField({ label = "Search", ...props }) {
  return (
    <label className="search-field">
      <span className="sr-only">{label}</span>
      <Icon name="search" size={18} />
      <input type="search" {...props} />
    </label>
  );
}
