import { Icon } from "../icons/Icon";

export function Checkbox({ label, checked = false, onChange, disabled = false, name, value }) {
  return (
    <label className="ctl" aria-disabled={disabled || undefined}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
      />
      <span className="ctl-box">
        {checked ? <Icon name="check" size={13} stroke={2.6} /> : null}
      </span>
      {label != null ? <span>{label}</span> : null}
    </label>
  );
}

export function Radio({ label, checked = false, onChange, disabled = false, name, value }) {
  return (
    <label className="ctl" aria-disabled={disabled || undefined}>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
      />
      <span className="ctl-box round" />
      {label != null ? <span>{label}</span> : null}
    </label>
  );
}
