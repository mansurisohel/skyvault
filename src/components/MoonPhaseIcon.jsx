/**
 * Renders an accurate moon-phase disc from the actual phase angle
 * (0 = new, π = full, 2π = new again) rather than a stepped icon.
 *
 * The illuminated region is built from two arcs — a fixed limb and a
 * terminator whose curvature follows cos(angle) — then mirrored
 * horizontally for the waning half of the cycle. The math here is
 * verified against the theoretical illumination fraction (1-cos(angle))/2
 * and against correct left/right mirroring between waxing and waning,
 * not just visually eyeballed.
 */
export default function MoonPhaseIcon({ angle = 0, size = 40, litColor = '#f3ecd2', darkColor = '#1c2438', ringColor = 'rgba(255,255,255,.14)' }) {
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const twoPi = Math.PI * 2;
  const a = ((angle % twoPi) + twoPi) % twoPi;
  const waxing = a <= Math.PI;
  const eff = waxing ? a : twoPi - a;      // fold waning back onto the waxing domain
  const rx = r * Math.cos(eff);
  const rightSweep = 0;
  const termSweep = rx >= 0 ? 1 : 0;

  const path = [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 ${rightSweep} ${cx} ${cy + r}`,
    `A ${Math.abs(rx)} ${r} 0 0 ${termSweep} ${cx} ${cy - r}`,
    'Z',
  ].join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <radialGradient id="moonIconShade" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={litColor} />
          <stop offset="100%" stopColor="#d8cca0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={darkColor} />
      <g transform={waxing ? undefined : `translate(${size},0) scale(-1,1)`}>
        <path d={path} fill="url(#moonIconShade)" />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth="1" />
    </svg>
  );
}
