export function Card({ title, count, toolbar, footer, pad = false, className = "", children }) {
  const hasHead = title != null || toolbar != null || count != null;

  return (
    <section className={`card ${className}`.trim()}>
      {hasHead ? (
        <div className="card-head">
          {title != null ? <span className="card-title">{title}</span> : null}
          {count != null ? <span className="count t-num">{count}</span> : null}
          {toolbar != null ? <div className="card-toolbar">{toolbar}</div> : null}
        </div>
      ) : null}
      {pad ? <div className="card-pad">{children}</div> : children}
      {footer != null ? <div className="card-foot">{footer}</div> : null}
    </section>
  );
}
