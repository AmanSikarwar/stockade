export function BarChart({ data, height = 180, formatValue = (value) => value, emptyLabel }) {
  const values = data.map((point) => point.value);
  const max = Math.max(1, ...values);
  const hasData = values.some((value) => value > 0);
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  if (!data.length) {
    return <div className="empty-state">{emptyLabel ?? "No data for this range."}</div>;
  }

  return (
    <div className="bar-chart" style={{ "--chart-h": `${height}px` }}>
      <div className="bars" role="img" aria-label={emptyLabel ?? "Bar chart"}>
        {data.map((point, index) => {
          const pct = hasData ? (point.value / max) * 100 : 0;
          const showLabel = index === 0 || index === data.length - 1 || index % labelEvery === 0;
          return (
            <div className="bar-col" key={point.key ?? index}>
              <div className="bar-track">
                <div
                  className={`bar-fill ${point.value > 0 ? "" : "is-zero"}`.trim()}
                  style={{ height: `${pct}%` }}
                  title={`${point.label}: ${formatValue(point.value)}`}
                />
              </div>
              <span className="bar-x">{showLabel ? (point.short ?? point.label) : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
