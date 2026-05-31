import { Icon } from "../icons/Icon";

export function MetricCard({ icon = "chart", label, value, delta }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-icon" aria-hidden="true">
          <Icon name={icon} size={20} stroke={1.85} />
        </span>
        {delta ? <span className="metric-delta">{delta}</span> : null}
      </div>
      <strong className="value t-num">{value}</strong>
      <span className="label">{label}</span>
    </article>
  );
}
