export function Pill({ tone = "neutral", dot = true, children }) {
  return (
    <span className={`pill pill-${tone}`}>
      {dot ? <span className="dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function StockPill({ quantity, threshold = 5 }) {
  if (quantity <= 0) {
    return <Pill tone="danger">Out of stock</Pill>;
  }
  if (quantity <= threshold) {
    return <Pill tone="warning">{quantity} low</Pill>;
  }
  return <Pill tone="success">{quantity} in stock</Pill>;
}
