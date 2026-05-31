function MarkB({ size = 48, c1 = "currentColor", c2 = "rgba(255,255,255,.34)" }) {
  const crates = [
    { x: 5.5, y: 24.5 },
    { x: 25.5, y: 24.5 },
    { x: 15.5, y: 5.5 },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {crates.map((crate) => (
        <g key={`${crate.x}-${crate.y}`}>
          <rect x={crate.x} y={crate.y} width="17" height="17" rx="3.6" fill={c1} />
          <rect x={crate.x + 3} y={crate.y + 5.4} width="11" height="1.9" rx="0.95" fill={c2} />
        </g>
      ))}
    </svg>
  );
}

export function MarkBadge({ size = 32 }) {
  return (
    <span className="mark-badge" style={{ width: size, height: size }}>
      <MarkB size={Math.round(size * 0.78)} c1="var(--text-on-accent)" c2="rgba(255,255,255,.42)" />
    </span>
  );
}

export function Logo({ compact = false, markSize = 32 }) {
  return (
    <span className="brand">
      <MarkBadge size={markSize} />
      {!compact ? <span className="wordmark">Stockade</span> : null}
    </span>
  );
}
