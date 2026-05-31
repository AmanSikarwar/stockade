import { Icon } from "../icons/Icon";

export function FormField({
  children,
  error,
  hint,
  id,
  label,
  required = false,
  type = "text",
  className = "",
  ...props
}) {
  const messageId = hint || error ? `${id}-message` : undefined;

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="req" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children ?? (
        <input
          className={`input ${error ? "is-error" : ""}`.trim()}
          aria-describedby={messageId}
          aria-invalid={error ? "true" : undefined}
          id={id}
          required={required}
          type={type}
          {...props}
        />
      )}
      {error ? (
        <span className="field-error" id={messageId}>
          <Icon name="lowStock" size={13} stroke={2} />
          {error}
        </span>
      ) : null}
      {!error && hint ? (
        <span className="field-hint" id={messageId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
