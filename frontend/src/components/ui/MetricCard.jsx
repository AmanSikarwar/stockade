import { Icon } from "../icons/Icon";

export function MetricCard({ icon = "chart", label, value, meta, metaTone }) {
  return (
    <article className="metric-card">
      <span className="metric-icon" aria-hidden="true">
        <Icon name={icon} size={22} stroke={1.85} />
      </span>
      <div>
        <span className="label">{label}</span>
        <strong className="value t-num">{value}</strong>
        {meta ? <p className={`meta ${metaTone === "up" ? "up" : ""}`.trim()}>{meta}</p> : null}
      </div>
    </article>
  );
}
