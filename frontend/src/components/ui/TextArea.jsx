export function TextArea({ className = "", error = false, ...props }) {
  return (
    <textarea
      className={`textarea ${error ? "is-error" : ""} ${className}`.trim()}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}
