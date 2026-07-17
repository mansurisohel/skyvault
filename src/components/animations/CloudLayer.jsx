import { useMemo } from 'react';

// Pure, deterministic pseudo-random generator: same seed + index always
// yields the same value, with no mutable state captured across calls.
function hashRandom(seed, i, k) {
  const x = Math.sin(seed * 12.9898 + i * 78.233 + k * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Renders a parallax system of irregular, layered clouds using pure CSS
 * transforms (no per-frame JS) for performance. Density and tone are
 * configurable so the same component can serve cloudy, rainy, and stormy skies.
 */
export default function CloudLayer({ density = 'medium', tone = 'light', seed = 1 }) {
  const counts = { low: 4, medium: 7, high: 11 };
  const count = counts[density] ?? 6;

  const clouds = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const rand = (k) => hashRandom(seed, i, k);
      const size = 90 + rand(0) * 220;
      return {
        id: i,
        size,
        top: rand(1) * 65,
        left: rand(2) * 100,
        opacity: 0.25 + rand(3) * 0.35,
        duration: 35 + rand(4) * 45,
        delay: -rand(5) * 40,
        blur: 8 + rand(6) * 14,
      };
    }),
    [count, seed],
  );

  const cloudColor = tone === 'dark'
    ? 'radial-gradient(circle at 30% 30%, rgba(140,150,175,0.55), rgba(60,68,90,0.15) 70%)'
    : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.15) 70%)';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {clouds.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full"
          style={{
            width: c.size,
            height: c.size * 0.5,
            top: `${c.top}%`,
            left: `${c.left}%`,
            opacity: c.opacity,
            background: cloudColor,
            filter: `blur(${c.blur}px)`,
            animation: `drift ${c.duration}s ease-in-out infinite`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
