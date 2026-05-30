const line = "var(--text-2)";
const faint = "var(--text-3)";
const accent = "var(--accent)";
const accentSoft = "var(--accent-soft)";
const surface = "var(--surface)";
const strokeWidth = 2.4;

function Illu({ children, className = "" }) {
  return (
    <svg
      className={`illustration ${className}`}
      width="200"
      height="150"
      viewBox="0 0 200 150"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Crate({ x, y, width, height, fill = accentSoft, stroke = line }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="6"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={x}
        y1={y + height * 0.26}
        x2={x + width}
        y2={y + height * 0.26}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={x + width / 2}
        y1={y + height * 0.26}
        x2={x + width / 2}
        y2={y + height}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity="0.55"
      />
    </g>
  );
}

export function LoginHero() {
  return (
    <svg
      className="login-hero-illustration"
      width="260"
      height="300"
      viewBox="0 0 260 300"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {[50, 78, 106, 134, 162, 190].map((x, index) => {
        const heights = [150, 176, 158, 184, 150, 170];
        return (
          <rect
            key={x}
            x={x}
            y={210 - heights[index]}
            width="18"
            height={heights[index]}
            rx="9"
            fill={accentSoft}
            stroke={line}
            strokeWidth={strokeWidth}
          />
        );
      })}
      <line x1="30" y1="228" x2="230" y2="228" stroke={line} strokeWidth={strokeWidth} />
      <line
        x1="44"
        y1="244"
        x2="216"
        y2="244"
        stroke={faint}
        strokeWidth="2"
        opacity="0.6"
        strokeDasharray="2 7"
      />
      <rect
        x="60"
        y="160"
        width="70"
        height="66"
        rx="6"
        fill={accentSoft}
        stroke={line}
        strokeWidth={strokeWidth}
      />
      <rect
        x="132"
        y="160"
        width="70"
        height="66"
        rx="6"
        fill={accentSoft}
        stroke={line}
        strokeWidth={strokeWidth}
      />
      <rect
        x="96"
        y="96"
        width="70"
        height="66"
        rx="6"
        fill={accent}
        stroke={accent}
        strokeWidth={strokeWidth}
      />
      <g transform="translate(150 70)">
        <path
          d="M2 16 2 5a3 3 0 0 1 3-3h11a3 3 0 0 1 2.1.9l14 14a3 3 0 0 1 0 4.2l-11 11a3 3 0 0 1-4.2 0l-14-14A3 3 0 0 1 2 16Z"
          fill={surface}
          stroke={line}
          strokeWidth={strokeWidth}
        />
        <circle cx="9" cy="9" r="2.4" stroke={line} strokeWidth={strokeWidth} />
      </g>
    </svg>
  );
}

export function EmptyProducts() {
  return (
    <Illu>
      <path
        d="M58 70h84v52a4 4 0 0 1-4 4H62a4 4 0 0 1-4-4Z"
        fill={accentSoft}
        stroke={line}
        strokeWidth={strokeWidth}
      />
      <line
        x1="100"
        y1="74"
        x2="100"
        y2="126"
        stroke={line}
        strokeWidth={strokeWidth}
        opacity="0.5"
      />
      <path d="M44 62 70 50l86 2-26 14Z" fill={surface} stroke={line} strokeWidth={strokeWidth} />
      <g transform="translate(132 30)">
        <circle cx="14" cy="14" r="13" fill={surface} stroke={accent} strokeWidth={strokeWidth} />
        <path d="M14 8v12M8 14h12" stroke={accent} strokeWidth={strokeWidth} />
      </g>
    </Illu>
  );
}

export function EmptyOrders() {
  return (
    <Illu>
      <rect
        x="62"
        y="30"
        width="76"
        height="92"
        rx="7"
        fill={surface}
        stroke={line}
        strokeWidth={strokeWidth}
      />
      <path
        d="M84 30v-5a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v5"
        fill={surface}
        stroke={line}
        strokeWidth={strokeWidth}
      />
      <line x1="76" y1="58" x2="124" y2="58" stroke={accent} strokeWidth={strokeWidth} />
      <line
        x1="76"
        y1="74"
        x2="124"
        y2="74"
        stroke={faint}
        strokeWidth={strokeWidth}
        strokeDasharray="3 5"
      />
      <line
        x1="76"
        y1="90"
        x2="108"
        y2="90"
        stroke={faint}
        strokeWidth={strokeWidth}
        strokeDasharray="3 5"
      />
      <circle
        cx="150"
        cy="104"
        r="14"
        fill={accentSoft}
        stroke={accent}
        strokeWidth={strokeWidth}
      />
      <path d="M150 98v12M144 104h12" stroke={accent} strokeWidth={strokeWidth} />
    </Illu>
  );
}

export function EmptyCustomers() {
  return (
    <Illu>
      <rect
        x="50"
        y="40"
        width="100"
        height="74"
        rx="9"
        fill={accentSoft}
        stroke={line}
        strokeWidth={strokeWidth}
        strokeDasharray="2 8"
      />
      <circle cx="100" cy="68" r="12" fill={surface} stroke={line} strokeWidth={strokeWidth} />
      <path d="M82 98a18 18 0 0 1 36 0" fill={surface} stroke={line} strokeWidth={strokeWidth} />
      <g transform="translate(132 86)">
        <circle cx="14" cy="14" r="13" fill={surface} stroke={accent} strokeWidth={strokeWidth} />
        <path d="M14 8v12M8 14h12" stroke={accent} strokeWidth={strokeWidth} />
      </g>
    </Illu>
  );
}

export function EmptySearch() {
  return (
    <Illu>
      <line x1="40" y1="112" x2="160" y2="112" stroke={line} strokeWidth={strokeWidth} />
      <rect
        x="52"
        y="84"
        width="26"
        height="28"
        rx="4"
        fill={accentSoft}
        stroke={line}
        strokeWidth={strokeWidth}
      />
      <rect
        x="84"
        y="84"
        width="26"
        height="28"
        rx="4"
        fill="none"
        stroke={faint}
        strokeWidth={strokeWidth}
        strokeDasharray="3 5"
      />
      <g transform="translate(96 36)">
        <circle cx="22" cy="22" r="20" fill={surface} stroke={accent} strokeWidth={strokeWidth} />
        <path d="M37 37l13 13" stroke={accent} strokeWidth={strokeWidth} />
        <path d="M15 22h14" stroke={accent} strokeWidth={strokeWidth} opacity="0.6" />
      </g>
    </Illu>
  );
}

export function FeedbackSuccess() {
  return (
    <Illu>
      <Crate
        x={66}
        y={56}
        width={68}
        height={64}
        fill="var(--success-bg)"
        stroke="var(--success)"
      />
      <g transform="translate(120 30)">
        <circle
          cx="20"
          cy="20"
          r="19"
          fill={surface}
          stroke="var(--success)"
          strokeWidth={strokeWidth}
        />
        <path d="M12 20l5 5 11-12" stroke="var(--success)" strokeWidth={strokeWidth} />
      </g>
    </Illu>
  );
}

export function FeedbackError() {
  return (
    <Illu>
      <line x1="44" y1="118" x2="156" y2="118" stroke={line} strokeWidth={strokeWidth} />
      <g transform="rotate(-16 100 92)">
        <Crate
          x={70}
          y={62}
          width={62}
          height={58}
          fill="var(--danger-bg)"
          stroke="var(--danger)"
        />
      </g>
      <rect
        x="48"
        y="100"
        width="16"
        height="16"
        rx="3"
        fill="var(--danger-bg)"
        stroke="var(--danger)"
        strokeWidth={strokeWidth}
      />
      <g transform="translate(122 28)">
        <circle
          cx="18"
          cy="18"
          r="17"
          fill={surface}
          stroke="var(--danger)"
          strokeWidth={strokeWidth}
        />
        <path d="M18 11v9M18 24h.01" stroke="var(--danger)" strokeWidth={strokeWidth} />
      </g>
    </Illu>
  );
}
