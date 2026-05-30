import { Icon } from "../icons/Icon";

export function MetricCard({ icon = "chart", label, meta, value }) {
  return (
    <article className="metric-card">
      <span className="metric-icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <span>{label}</span>
        <strong className="t-num">{value}</strong>
        {meta ? <p>{meta}</p> : null}
      </div>
    </article>
  );
}
