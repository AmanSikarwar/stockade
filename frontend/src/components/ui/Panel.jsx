export function Panel({ actions, children, className = "", description, title }) {
  return (
    <section className={`panel ${className}`}>
      {title || actions || description ? (
        <div className="panel-heading">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
