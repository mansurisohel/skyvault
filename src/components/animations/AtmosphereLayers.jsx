import { useMemo } from 'react';

// Pure, deterministic pseudo-random generator: same seed + index always
// yields the same value, with no mutable state captured across calls.
// `k` distinguishes each property pulled for the same item (0 = first
// property requested, 1 = second, etc.) so values don't repeat.
function hashRandom(seed, i, k) {
  const x = Math.sin(seed * 12.9898 + i * 78.233 + k * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

function useSeeded(count, seed, fn) {
  return useMemo(
    () => Array.from({ length: count }, (_, i) => fn(i, (k) => hashRandom(seed, i, k))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, seed],
  );
}

export function RainLayer({ intensity = 'medium', windDeg = null }) {
  const count = { light: 40, medium: 80, heavy: 130 }[intensity] ?? 80;
  const speedFactor = { light: 1.3, medium: 1, heavy: 0.75 }[intensity] ?? 1;
  // Real rain rarely falls perfectly vertically — it leans with the wind.
  // windDeg (meteorological: direction the wind blows FROM) becomes a
  // horizontal drift applied *inside* the fall keyframe itself via a CSS
  // custom property (a plain inline rotate() would get silently discarded,
  // since a running CSS animation's own transform fully replaces whatever
  // transform was set inline — they don't compose).
  const driftPx = windDeg === null ? -60 : Math.max(-160, Math.min(160, Math.sin((windDeg * Math.PI) / 180) * 130));

  const drops = useSeeded(count, 3, (i, rand) => {
    // Two depth layers: a handful of large, sharp, fast "near" drops and
    // many small, faint, slightly blurred "far" ones — real rain reads as
    // a field of depth, not one uniform layer of identical streaks.
    const near = rand(5) > 0.82;
    return {
      id: i,
      left: rand(0) * 100,
      delay: rand(1) * 2,
      duration: (0.45 + rand(2) * 0.45) * speedFactor * (near ? 0.85 : 1.1),
      height: near ? 22 + rand(3) * 14 : 10 + rand(3) * 10,
      width: near ? 2 : 1,
      opacity: near ? 0.45 + rand(4) * 0.3 : 0.15 + rand(4) * 0.2,
      blur: near ? 0 : 0.4,
    };
  });

  const splashes = useSeeded(Math.round(count * 0.35), 23, (i, rand) => ({
    id: i,
    left: rand(0) * 100,
    delay: rand(1) * 2.4,
    duration: (0.45 + rand(2) * 0.45) * speedFactor,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ '--rain-drift': `${driftPx}px` }}>
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute top-0 rounded-full bg-gradient-to-b from-transparent via-sky-200 to-transparent"
          style={{
            left: `${d.left}%`,
            height: d.height,
            width: d.width,
            opacity: d.opacity,
            filter: d.blur ? `blur(${d.blur}px)` : undefined,
            animation: `rain-fall ${d.duration}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
      {splashes.map((s) => (
        <span
          key={`splash-${s.id}`}
          className="absolute bottom-0 h-0.5 w-2 rounded-full bg-sky-100"
          style={{
            left: `${s.left}%`,
            animation: `rain-splash ${s.duration}s linear infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SnowLayer({ intensity = 'medium' }) {
  const count = { light: 30, medium: 55, heavy: 95 }[intensity] ?? 55;
  const speedFactor = { light: 1.3, medium: 1, heavy: 0.7 }[intensity] ?? 1;
  const flakes = useSeeded(count, 5, (i, rand) => ({
    id: i,
    left: rand(0) * 100,
    size: 2 + rand(1) * 4,
    delay: rand(2) * 10,
    duration: (8 + rand(3) * 12) * speedFactor,
    opacity: 0.4 + rand(4) * 0.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animation: `snow-fall ${f.duration}s ease-in-out infinite`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

const BOLT_PATH = 'M50 0 L34 46 L52 46 L28 100 L58 42 L40 42 Z';

export function LightningLayer() {
  // Several independently-timed flash layers rather than one metronomic
  // pulse — real lightning strikes at irregular intervals, sometimes with
  // a quick double-flash, never on a clean repeating beat.
  const ambientFlashes = useSeeded(3, 31, (i, rand) => ({
    id: i,
    duration: 6 + rand(0) * 7,
    delay: rand(1) * 6,
  }));

  const bolts = useSeeded(2, 37, (i, rand) => ({
    id: i,
    left: 15 + rand(0) * 70,
    top: -5 + rand(1) * 10,
    scale: 0.7 + rand(2) * 0.9,
    duration: 9 + rand(3) * 8,
    delay: rand(4) * 9,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {ambientFlashes.map((f) => (
        <div
          key={f.id}
          className="absolute inset-0 bg-white mix-blend-overlay"
          style={{ animation: `lightning-flash ${f.duration}s ease-in-out infinite`, animationDelay: `${f.delay}s` }}
        />
      ))}
      {bolts.map((b) => (
        <svg
          key={b.id}
          viewBox="0 0 100 100"
          className="absolute drop-shadow-[0_0_18px_rgba(255,255,255,0.9)]"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: 60 * b.scale,
            height: 60 * b.scale,
            opacity: 0,
            animation: `lightning-bolt ${b.duration}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <path d={BOLT_PATH} fill="white" />
        </svg>
      ))}
    </div>
  );
}

export function StarsLayer() {
  const stars = useSeeded(60, 7, (i, rand) => ({
    id: i,
    left: rand(0) * 100,
    top: rand(1) * 60,
    size: 1 + rand(2) * 2,
    delay: rand(3) * 5,
    duration: 2 + rand(4) * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute rounded-full bg-mist-50 animate-pulse-glow"
        style={{
          width: 90, height: 90, top: '8%', right: '12%',
          boxShadow: '0 0 60px 20px rgba(233,241,255,0.35)',
        }}
      />
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `twinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SunGlowLayer({ intensity = 'normal' }) {
  const hot = intensity === 'hot';
  const particles = useSeeded(hot ? 26 : 18, 11, (i, rand) => ({
    id: i,
    left: rand(0) * 100,
    top: rand(1) * 80,
    size: 2 + rand(2) * 3,
    duration: 6 + rand(3) * 6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {hot && (
        // A soft, hazy wash across the upper sky — the slightly bleached,
        // glare-heavy look of real hot, sunny weather rather than a clean
        // saturated blue.
        <div
          className="absolute inset-x-0 top-0 h-2/3"
          style={{ background: 'linear-gradient(to bottom, rgba(255,225,150,0.22), transparent)' }}
        />
      )}
      <div
        className="absolute rounded-full animate-pulse-glow"
        style={{
          width: hot ? 320 : 220,
          height: hot ? 320 : 220,
          top: '4%',
          right: '10%',
          background: hot
            ? 'radial-gradient(circle, rgba(255,200,110,0.95), rgba(247,185,85,0.15) 60%, rgba(247,185,85,0) 75%)'
            : 'radial-gradient(circle, rgba(247,185,85,0.9), rgba(247,185,85,0) 70%)',
        }}
      />
      {hot && (
        // A tight, brighter core so the sun itself reads as harsher/more
        // intense, not just a bigger soft halo.
        <div
          className="absolute rounded-full"
          style={{
            width: 90, height: 90, top: '9%', right: '17%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,225,150,0.4) 60%, transparent 80%)',
            filter: 'blur(2px)',
          }}
        />
      )}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-mist-50/70 animate-float-slow"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function MistLayer() {
  const bands = useSeeded(5, 13, (i, rand) => ({
    id: i,
    top: 10 + i * 18 + rand(0) * 6,
    duration: 40 + rand(1) * 30,
    opacity: 0.15 + rand(2) * 0.15,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {bands.map((b) => (
        <div
          key={b.id}
          className="absolute left-[-20%] w-[140%] h-24 rounded-full bg-mist-100 blur-2xl"
          style={{
            top: `${b.top}%`,
            opacity: b.opacity,
            animation: `drift ${b.duration}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function FogLayer() {
  const bands = useSeeded(8, 17, (i, rand) => ({
    id: i,
    top: -5 + i * 14 + rand(0) * 6,
    duration: 55 + rand(1) * 40,
    opacity: 0.28 + rand(2) * 0.22,
    reverse: rand(3) > 0.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-slate-400/25" />
      {bands.map((b) => (
        <div
          key={b.id}
          className="absolute left-[-25%] h-32 w-[150%] rounded-full bg-mist-100 blur-3xl"
          style={{
            top: `${b.top}%`,
            opacity: b.opacity,
            animation: `drift ${b.duration}s ease-in-out infinite`,
            animationDirection: b.reverse ? 'reverse' : 'normal',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Fast diagonal streaks layered on top of any condition when the location's
 * actual wind speed crosses a "noticeably windy" threshold — independent of
 * the main weather condition, since it can be windy on a clear day too.
 */
export function WindLinesLayer({ intensity = 1 }) {
  const count = Math.round(14 + intensity * 10);
  const lines = useSeeded(count, 19, (i, rand) => ({
    id: i,
    top: rand(0) * 100,
    width: 60 + rand(1) * 120,
    delay: rand(2) * 4,
    duration: 1.4 + rand(3) * 1.4 - intensity * 0.3,
    opacity: 0.12 + rand(4) * 0.18,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {lines.map((l) => (
        <span
          key={l.id}
          className="absolute h-px rounded-full bg-gradient-to-r from-transparent via-mist-100 to-transparent"
          style={{
            top: `${l.top}%`,
            width: l.width,
            opacity: l.opacity,
            transform: 'rotate(-8deg)',
            animation: `wind-streak ${Math.max(l.duration, 0.6)}s linear infinite`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
