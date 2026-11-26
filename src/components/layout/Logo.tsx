export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="logo-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0F4C5C" />
          <stop offset="1" stopColor="#08303A" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="url(#logo-night)" />
      <g transform="translate(256 256) scale(.86) translate(-256 -256)">
        <path d="M330 92a84 84 0 1 0 74 124 70 70 0 1 1-74-124z" fill="#F7E3B0" />
        <path d="M96 290c64-12 120 0 160 30v120c-40-30-96-42-160-30z" fill="#FFFFFF" />
        <path d="M416 290c-64-12-120 0-160 30v120c40-30 96-42 160-30z" fill="#DCEFF2" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="h-display text-[22px] font-semibold">Livre</span>
    </div>
  );
}
