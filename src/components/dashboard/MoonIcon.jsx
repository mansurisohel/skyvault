export default function MoonIcon({ illumination = 50, waxing = true, size = 72 }) {
  const t = illumination / 100;
  const translatePct = waxing ? (t - 1) * 100 : (1 - t) * 100;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #1c2846, #0b1224 75%)',
        boxShadow: '0 0 24px rgba(169,201,255,0.15)',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 38% 32%, #ffffff, #cdddf7 65%, #a9c9ff 100%)',
          transform: `translateX(${translatePct}%)`,
          transition: 'transform 0.6s ease',
        }}
      />
    </div>
  );
}
