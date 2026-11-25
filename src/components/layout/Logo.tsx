export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" className="fill-accent" />
      <path d="M18 18c6 0 10.5 1.6 14 4.6V47c-3.5-3-8-4.6-14-4.6V18z" fill="white" opacity=".95" />
      <path d="M46 18c-6 0-10.5 1.6-14 4.6V47c3.5-3 8-4.6 14-4.6V18z" fill="white" opacity=".7" />
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
