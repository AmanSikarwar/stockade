const ICONS = {
  arrow: <path d="M4 12h15.5M13.5 6l6 6-6 6" />,
  backorder: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.3 1.9" />
    </g>
  ),
  box: (
    <g>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </g>
  ),
  chart: (
    <g>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5V13M11.5 20.5V6.5M16.5 20.5v-5" />
    </g>
  ),
  check: <path d="M5 12.5 9.7 17 19 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  customer: (
    <g>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </g>
  ),
  customers: (
    <g>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" />
      <path d="M16 5.4a3 3 0 0 1 0 5.6" />
      <path d="M17.2 13.4a5 5 0 0 1 3.3 5.3" />
    </g>
  ),
  dashboard: (
    <g>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="4.2" rx="1.6" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.6" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.6" />
    </g>
  ),
  edit: <path d="M16.5 3.6a2.12 2.12 0 0 1 3 3L7.2 18.9 3 20l1.1-4.2L16.5 3.6Z" />,
  filter: <path d="M4 4h16l-6.2 7.3v6L10.2 21v-9.7L4 4Z" />,
  inStock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.6 2.6 5-5.4" />
    </g>
  ),
  info: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.7h.01" />
    </g>
  ),
  lock: (
    <g>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </g>
  ),
  login: (
    <g>
      <path d="M13.5 3.5h4a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-4" />
      <path d="M10 12H3.5M7 8l-3.5 4 3.5 4" />
    </g>
  ),
  logout: (
    <g>
      <path d="M10.5 3.5h-4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h4" />
      <path d="M16 12h6.5M19 8l3.5 4-3.5 4" />
    </g>
  ),
  lowStock: (
    <g>
      <path d="M12 3.6 21.2 19.5a1.4 1.4 0 0 1-1.2 2.1H4a1.4 1.4 0 0 1-1.2-2.1L12 3.6Z" />
      <path d="M12 9.5v4.2M12 17.4h.01" />
    </g>
  ),
  orders: (
    <g>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5V6h6V3.5" />
      <path d="M8.5 11h7M8.5 15h4.5" />
    </g>
  ),
  outStock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </g>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <g>
      <path d="M20.5 11.5a8.5 8.5 0 0 0-14.7-5L3 9.5" />
      <path d="M3 4.5v5h5" />
      <path d="M3.5 12.5a8.5 8.5 0 0 0 14.7 5L21 14.5" />
      <path d="M21 19.5v-5h-5" />
    </g>
  ),
  search: (
    <g>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4-4" />
    </g>
  ),
  sku: <path d="M4 6.5v11M6.5 6.5v11M9 6.5v11M12 6.5v11M14.5 6.5v8M17 6.5v11M19.5 6.5v11" />,
  trash: (
    <g>
      <path d="M4 6.5h16M9.5 6.5v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
      <path d="M10.5 10.5v6M13.5 10.5v6" />
    </g>
  ),
  warehouse: (
    <g>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 9.4V20.5h14V9.4" />
      <path d="M9 20.5v-5.5h6v5.5" />
    </g>
  ),
};

export function Icon({ name, size = 20, title, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      role={title ? "img" : undefined}
    >
      {ICONS[name] ?? null}
    </svg>
  );
}
