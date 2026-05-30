export function FormField({
  children,
  error,
  hint,
  id,
  label,
  required = false,
  type = "text",
  ...props
}) {
  const messageId = hint || error ? `${id}-message` : undefined;

  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children ?? (
        <input
          aria-describedby={messageId}
          aria-invalid={error ? "true" : undefined}
          id={id}
          required={required}
          type={type}
          {...props}
        />
      )}
      {error ? (
        <span className="field-message field-error" id={messageId}>
          {error}
        </span>
      ) : null}
      {!error && hint ? (
        <span className="field-message" id={messageId}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
