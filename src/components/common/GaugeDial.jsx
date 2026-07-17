/**
 * The signature visual element of SkyVault, a radial instrument dial that
 * echoes the compass needle in the brand mark. Reused for UV index, AQI,
 * and wind direction so the whole dashboard feels like a single instrument
 * panel rather than a set of unrelated cards.
 */
export default function GaugeDial({
  value,
  max = 10,
  label,
  sublabel,
  color = '#7fabff',
  size = 96,
  needleDeg = null, // if provided, renders a compass needle instead of a fill arc
}) {
  const stroke = size * 0.07;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));
  const arcLength = circumference * 0.75; // 270° sweep, matches logo's dial
  const offset = arcLength - pct * arcLength;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[135deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={needleDeg === null ? offset : 0}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {needleDeg !== null && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${needleDeg}deg)`, transition: 'transform 0.8s ease' }}
          >
            <div
              className="rounded-full"
              style={{
                width: 3,
                height: size * 0.32,
                background: `linear-gradient(to top, transparent, ${color})`,
                transformOrigin: 'bottom center',
              }}
            />
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="data-mono text-lg font-semibold text-mist-50">{sublabel}</span>
        </div>
      </div>
      {label && <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>}
    </div>
  );
}
