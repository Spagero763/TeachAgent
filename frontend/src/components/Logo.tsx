export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ta-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35D07F" />
          <stop offset="1" stopColor="#19B35A" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="48" height="48" rx="14" fill="url(#ta-logo-grad)" />

      {/* Subtle hexagon — nod to Celo network */}
      <polygon
        points="24,6 37,13.5 37,28.5 24,36 11,28.5 11,13.5"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* T crossbar */}
      <rect x="10" y="14" width="28" height="5" rx="2.5" fill="white" />

      {/* T stem */}
      <rect x="21.5" y="19" width="5" height="16" rx="2.5" fill="white" />

      {/* Node dot — bottom of stem (blockchain endpoint) */}
      <circle cx="24" cy="35" r="2.5" fill="rgba(255,255,255,0.65)" />
    </svg>
  )
}
