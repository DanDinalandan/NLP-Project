export function ReviewBotLogo({ size = 40 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: Math.round(size * 0.25), flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="rb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#rb-grad)" />

      {/* Open book shape */}
      <path
        d="M20 12 C20 12 14 10 9 11 L9 28 C14 27 20 29 20 29 C20 29 26 27 31 28 L31 11 C26 10 20 12 20 12Z"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Spine */}
      <line x1="20" y1="12" x2="20" y2="29" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      {/* Left page lines */}
      <line x1="11" y1="15" x2="18" y2="14.5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="11" y1="18" x2="18" y2="17.5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="11" y1="21" x2="18" y2="20.5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      {/* Right page lines */}
      <line x1="22" y1="14.5" x2="29" y2="15" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="22" y1="17.5" x2="29" y2="18" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="22" y1="20.5" x2="28" y2="21" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

      {/* Sparkle — AI indicator */}
      <g transform="translate(30, 8)">
        <path d="M0 -4L.8 -0.8L4 0L.8 .8L0 4L-.8 .8L-4 0L-.8 -.8Z"
          fill="white" opacity="0.95" />
      </g>
    </svg>
  );
}
