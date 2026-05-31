const ICONS = {
  /* nav */
  dashboard: (
    <g>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="4.2" rx="1.6" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.6" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.6" />
    </g>
  ),
  box: (
    <g>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </g>
  ),
  orders: (
    <g>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5V6h6V3.5" />
      <path d="M8.5 11h7M8.5 15h4.5" />
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
  customer: (
    <g>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </g>
  ),
  settings: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15.4a1.7 1.7 0 0 0-1.56-1H2a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 3.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H8a1.7 1.7 0 0 0 1-1.56V2a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.6V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </g>
  ),

  /* search / filter / data */
  search: (
    <g>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4-4" />
    </g>
  ),
  filter: <path d="M4 4h16l-6.2 7.3v6L10.2 21v-9.7L4 4Z" />,
  list: (
    <g>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" />
    </g>
  ),
  chart: (
    <g>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5V13M11.5 20.5V6.5M16.5 20.5v-5" />
    </g>
  ),
  sku: <path d="M4 6.5v11M6.5 6.5v11M9 6.5v11M12 6.5v11M14.5 6.5v8M17 6.5v11M19.5 6.5v11" />,

  /* CRUD + controls */
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M16.5 3.6a2.12 2.12 0 0 1 3 3L7.2 18.9 3 20l1.1-4.2L16.5 3.6Z" />,
  trash: (
    <g>
      <path d="M4 6.5h16M9.5 6.5v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
      <path d="M10.5 10.5v6M13.5 10.5v6" />
    </g>
  ),
  check: <path d="M5 12.5 9.7 17 19 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  more: (
    <g fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </g>
  ),
  chevron: <path d="M9 5l7 7-7 7" />,
  arrow: <path d="M4 12h15.5M13.5 6l6 6-6 6" />,
  download: (
    <g>
      <path d="M12 3.5v12M7.5 11 12 15.5 16.5 11" />
      <path d="M4.5 20.5h15" />
    </g>
  ),
  refresh: (
    <g>
      <path d="M20.5 11.5a8.5 8.5 0 0 0-14.7-5L3 9.5" />
      <path d="M3 4.5v5h5" />
      <path d="M3.5 12.5a8.5 8.5 0 0 0 14.7 5L21 14.5" />
      <path d="M21 19.5v-5h-5" />
    </g>
  ),
  calendar: (
    <g>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </g>
  ),

  /* stock status */
  layers: (
    <g>
      <path d="M12 2.6 21 7l-9 4.4L3 7l9-4.4Z" />
      <path d="M3 12l9 4.4L21 12" />
      <path d="M3 17l9 4.4L21 17" />
    </g>
  ),
  inStock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.6 2.6 5-5.4" />
    </g>
  ),
  lowStock: (
    <g>
      <path d="M12 3.6 21.2 19.5a1.4 1.4 0 0 1-1.2 2.1H4a1.4 1.4 0 0 1-1.2-2.1L12 3.6Z" />
      <path d="M12 9.5v4.2M12 17.4h.01" />
    </g>
  ),
  outStock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </g>
  ),
  backorder: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.3 1.9" />
    </g>
  ),

  /* order / commerce */
  cart: (
    <g>
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3.5H5l2.1 12.2a1.3 1.3 0 0 0 1.3 1.1h8.2a1.3 1.3 0 0 0 1.3-1l1.6-7.3H6" />
    </g>
  ),
  truck: (
    <g>
      <path d="M2.5 6.5h11v9.5h-11z" />
      <path d="M13.5 9.5h3.6l2.9 3v3.5h-6.5" />
      <circle cx="6.5" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </g>
  ),
  tag: (
    <g>
      <path d="M3.6 11.4V4.6a1 1 0 0 1 1-1h6.8a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" />
      <circle cx="8" cy="8" r="1.4" />
    </g>
  ),
  building: (
    <g>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.6" />
      <path d="M9 7.5h.01M15 7.5h.01M9 11h.01M15 11h.01M10 20.5v-3.5h4v3.5" />
    </g>
  ),

  /* auth / feedback */
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
  eye: (
    <g>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  bell: (
    <g>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.7 8.5-2.7 8.5h17.4S18 15 18 8.5" />
      <path d="M10.2 21a2 2 0 0 0 3.6 0" />
    </g>
  ),
  info: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.7h.01" />
    </g>
  ),
  warehouse: (
    <g>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 9.4V20.5h14V9.4" />
      <path d="M9 20.5v-5.5h6v5.5" />
    </g>
  ),
  sun: (
    <g>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </g>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11Z" />,
};

export function Icon({ name, size = 20, stroke = 1.75, title, className = "" }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
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
