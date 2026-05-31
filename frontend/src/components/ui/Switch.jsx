export function Switch({ checked = false, onChange, label, disabled = false, id }) {
  return (
    <label className="ctl" aria-disabled={disabled || undefined}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
      />
      <span className={`switch ${checked ? "on" : ""}`.trim()} />
      {label != null ? <span>{label}</span> : null}
    </label>
  );
}
