import { useMemo } from 'react';

// Deterministic pseudo-random so particle layouts don't reshuffle on re-render
const R = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

/* ────────────────────────────────────────────────────────────
   Particle primitives
──────────────────────────────────────────────────────────── */
function Rain({ n = 55, fast = false }) {
  const drops = useMemo(() => Array.from({ length: n }, (_, i) => ({
    left:    `${R(i) * 100}%`,
    height:  fast ? `${75 + R(i+10)*45}px` : `${52 + R(i+10)*44}px`,
    width:   fast ? '2px' : '1.5px',
    delay:   `${R(i+20) * 1.5}s`,
    dur:     `${(fast ? 0.3 : 0.55) + R(i+30) * 0.38}s`,
    opacity: 0.28 + R(i+40) * 0.45,
  })), [n, fast]);
  return (
    <div className="particle-layer">
      {drops.map((d, i) => (
        <div key={i} className="rain-drop" style={{ left:d.left, height:d.height, width:d.width, animationDelay:d.delay, animationDuration:d.dur, opacity:d.opacity }} />
      ))}
    </div>
  );
}

function Snow({ n = 52, diagonal = false }) {
  const flakes = useMemo(() => Array.from({ length: n }, (_, i) => ({
    left:  `${R(i)*100}%`,
    size:  `${3 + R(i+10)*5.5}px`,
    delay: `${R(i+20)*5.5}s`,
    dur:   `${(diagonal ? 2.2 : 5) + R(i+30)*(diagonal ? 3 : 7.5)}s`,
    op:    0.40 + R(i+40)*0.52,
  })), [n, diagonal]);
  return (
    <div className="particle-layer">
      {flakes.map((f, i) => (
        <div key={i} className="snow-flake" style={{ left:f.left, width:f.size, height:f.size, animationDelay:f.delay, animationDuration:f.dur, opacity:f.op, filter: diagonal ? 'blur(.3px)' : 'none' }} />
      ))}
    </div>
  );
}

function Stars({ n = 85, dim = false }) {
  const stars = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${R(i) * (dim ? 45 : 72)}%`,
    left:  `${R(i+80) * 100}%`,
    size:  `${1 + R(i+160) * (dim ? 1.2 : 2.5)}px`,
    delay: `${R(i+240) * 4.5}s`,
    dur:   `${2 + R(i+320) * 3.2}s`,
    op:    dim ? 0.5 : 0.9,
  })), [n, dim]);
  return (
    <>
      {stars.map((s, i) => (
        <div key={i} className="star-dot" style={{ top:s.top, left:s.left, width:s.size, height:s.size, animationDelay:s.delay, animationDuration:s.dur, opacity:s.op }} />
      ))}
    </>
  );
}

// A soft cumulus silhouette built from overlapping puffs — reads as an
// actual cloud rather than a blurred blob, at any scale.
// A soft, volumetric cloud built from many overlapping, gradient-shaded
// puffs with per-instance procedural variation (via `seed`) so clouds don't
// read as the same stamped icon repeated at different sizes — each one has
// a slightly different silhouette, and a lit top / shadowed underside for
// a photographic, non-cartoon feel.
function CloudSVG({ tint = 'rgba(226,233,244,0.92)', shadeTint = 'rgba(150,160,178,0.55)', w = 200, seed = 0 }) {
  const h = w * 0.52;
  const gid = `cg${Math.round(seed * 10000)}`;

  // Procedurally place 9-12 puffs along a rough cloud silhouette, jittering
  // position/size per-seed so each cloud instance is genuinely different.
  const puffCount = 10;
  const puffs = Array.from({ length: puffCount }, (_, i) => {
    const t = i / (puffCount - 1);                       // 0..1 across the cloud's width
    const jitterX = (R(seed * 37 + i * 3.1) - 0.5) * 14;
    const jitterY = (R(seed * 53 + i * 5.7) - 0.5) * 10;
    const archY = Math.sin(t * Math.PI) * 30;             // taller in the middle
    const baseR = 22 + R(seed * 19 + i * 2.3) * 20 + archY * 0.35;
    return {
      cx: 12 + t * 176 + jitterX,
      cy: 74 - archY + jitterY,
      rx: baseR * 1.35,
      ry: baseR,
    };
  });

  return (
    <svg width={w} height={h} viewBox="0 0 200 104" style={{ display: 'block', filter: 'blur(1.6px)' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={tint} />
          <stop offset="55%" stopColor={tint} />
          <stop offset="100%" stopColor={shadeTint} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gid})`}>
        {puffs.map((p, i) => (
          <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} />
        ))}
        <rect x="10" y="70" width="180" height="26" rx="13" />
      </g>
      {/* Soft underside shadow for grounding / volume */}
      <ellipse cx="100" cy="90" rx="88" ry="14" fill={shadeTint} opacity="0.35" />
    </svg>
  );
}

function Clouds({ n = 7, light = false, dense = false, fast = false, storm = false, warm = false }) {
  const clouds = useMemo(() => Array.from({ length: n }, (_, i) => {
    const depth = R(i + 200);           // 0 = far/small/slow, 1 = near/big/fast
    const w = (dense ? 260 : 210) + depth * (dense ? 340 : 300);
    const baseOp = light ? 0.32 : dense ? 0.64 : 0.48;
    const baseDur = fast ? 10 : dense ? 48 : 32;
    const lit = storm
      ? { top: `rgba(${96 - depth * 20},${100 - depth * 20},${118 - depth * 16},0.92)`, shade: `rgba(${34 - depth * 10},${36 - depth * 10},${48 - depth * 8},0.85)` }
      : dense
        ? { top: `rgba(${210 - depth * 26},${216 - depth * 24},${226 - depth * 18},0.95)`, shade: `rgba(${142 - depth * 24},${150 - depth * 22},${164 - depth * 18},0.7)` }
        : { top: `rgba(255,252,248,0.95)`, shade: `rgba(198,206,220,0.6)` };
    const shade = warm ? `rgba(${196},${140},${118},0.5)` : lit.shade;
    return {
      top: `${2 + R(i) * (dense ? 40 : 48)}%`,
      w,
      op: (baseOp + depth * 0.22) * (storm ? 1.15 : 1),
      dur: `${baseDur - depth * (fast ? 4.5 : baseDur * 0.45)}s`,
      delay: `${R(i + 40) * -baseDur}s`,
      scale: 0.85 + depth * 0.75,
      seed: i + 1,
      tint: lit.top,
      shade,
    };
  }), [n, light, dense, fast, storm, warm]);
  return (
    <div className="particle-layer">
      {clouds.map((c, i) => (
        <div key={i} className="cloud-shape" style={{
          top: c.top, left: 0, opacity: c.op,
          animationDuration: c.dur, animationDelay: c.delay,
          '--cs': c.scale,
        }}>
          <CloudSVG tint={c.tint} shadeTint={c.shade} w={c.w} seed={c.seed} />
        </div>
      ))}
    </div>
  );
}

function SunOrb({ hot = false, low = false, mood = 'default' }) {
  // mood: 'soft' (gentle morning light) | 'strong' (bright, high-contrast
  // afternoon sun) | 'golden' (low, warm sunrise/sunset) | 'default'
  const pos = low ? { top: '62%', left: '12%' } : { top: -55, left: '10%' };
  const MOODS = {
    soft:    { size: 175, core: 'rgba(255,238,190,.55)', halo: 'rgba(255,214,140,.20)', op: 0.55, rays: 6,  rayColor: '255,225,150', rayOp: 0.045 },
    strong:  { size: 225, core: 'rgba(255,250,225,.92)', halo: 'rgba(255,200,60,.38)',  op: 0.85, rays: 10, rayColor: '255,220,90',  rayOp: 0.075 },
    golden:  { size: 250, core: 'rgba(255,200,120,.70)', halo: 'rgba(255,110,40,.30)',  op: 0.62, rays: 7,  rayColor: '255,150,70',  rayOp: 0.06  },
    default: { size: 195, core: 'rgba(255,222,80,.70)',  halo: 'rgba(255,180,0,.28)',   op: 0.65, rays: 8,  rayColor: '255,205,60',  rayOp: 0.055 },
  };
  const cfg = MOODS[mood] || MOODS.default;
  const size = low ? cfg.size + 30 : cfg.size;

  return (
    <>
      <div className="sun-orb" style={{
        width: size, height: size, opacity: hot ? Math.min(cfg.op + 0.2, 0.92) : cfg.op, ...pos,
        background: `radial-gradient(circle,${cfg.core} 0%,${cfg.halo} 50%,transparent 72%)`,
      }} />
      {!low && Array.from({ length: cfg.rays }, (_, i) => (
        <div key={i} className="sun-ray-el" style={{
          position: 'absolute', top: 52, left: '18%',
          width: `${125 + i * 14}px`, height: 1,
          background: `rgba(${cfg.rayColor},${cfg.rayOp - i * (cfg.rayOp / cfg.rays)})`,
          transform: `rotate(${i * (360 / cfg.rays)}deg)`,
          animationDelay: `${i * 1.3}s`,
        }} />
      ))}
      {mood === 'strong' && (
        <div style={{
          position: 'absolute', top: 90, left: 'calc(10% + 130px)', width: 10, height: 10, borderRadius: '50%',
          background: 'rgba(255,255,255,.55)', filter: 'blur(1px)', boxShadow: '0 0 18px 6px rgba(255,235,150,.35)',
        }} />
      )}
      {hot && <div className="heat-el" />}
    </>
  );
}

function MoonOrb() {
  return (
    <div style={{ position: 'absolute', top: 30, right: '13%', width: 76, height: 76 }}>
      <div className="moon-orb" style={{ position: 'absolute', top: -14, left: -14, right: -14, bottom: -14, width: 'auto', height: 'auto' }} />
      <svg width="76" height="76" viewBox="0 0 76 76" style={{ position: 'relative', filter: 'drop-shadow(0 0 14px rgba(255,246,210,.45))' }}>
        <defs>
          <radialGradient id="moonSurface" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fffdf2" />
            <stop offset="60%" stopColor="#f3ecd2" />
            <stop offset="100%" stopColor="#d9cfa8" />
          </radialGradient>
        </defs>
        <circle cx="38" cy="38" r="34" fill="url(#moonSurface)" />
        <g opacity="0.28" fill="#b8ac82">
          <ellipse cx="27" cy="27" rx="6"   ry="5" />
          <ellipse cx="47" cy="22" rx="4"   ry="3.5" />
          <ellipse cx="50" cy="44" rx="7"   ry="6" />
          <ellipse cx="30" cy="49" rx="3.5" ry="3" />
          <ellipse cx="20" cy="40" rx="3"   ry="2.6" />
        </g>
      </svg>
    </div>
  );
}

function Dust({ n = 22, storm = false }) {
  const streaks = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${8 + R(i)*82}%`,
    width: `${65 + R(i+20)*230}px`,
    op:    (storm ? 0.28 : 0.16) + R(i+40)*0.34,
    dur:   `${(storm ? 2.5 : 6) + R(i+60)*(storm ? 5 : 15)}s`,
    delay: `${R(i+80)*-12}s`,
  })), [n, storm]);
  return (
    <div className="particle-layer">
      {streaks.map((s, i) => (
        <div key={i} className="dust-streak" style={{ top:s.top, width:s.width, opacity:s.op, animationDuration:s.dur, animationDelay:s.delay }} />
      ))}
    </div>
  );
}

function Mist({ n = 4, dense = false }) {
  const tops = [22, 40, 57, 72].slice(0, n);
  return (
    <div className="particle-layer">
      {tops.map((top, i) => (
        <div key={i} className="mist-band" style={{
          top:`${top}%`, height: dense ? 95 : 72,
          opacity:(dense ? 0.52 : 0.38) - i*0.06,
          background:dense ? 'rgba(145,165,182,.09)' : 'rgba(155,175,192,.07)',
          animationDuration:`${20+i*9}s`, animationDelay:`${i*5}s`,
        }} />
      ))}
    </div>
  );
}

function Birds({ n = 3 }) {
  const birds = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${8 + R(i)*22}%`,
    dur:   `${16 + R(i+10)*10}s`,
    delay: `${R(i+20)*-14}s`,
    size:  9 + R(i+30)*5,
  })), [n]);
  return (
    <div className="particle-layer">
      {birds.map((b, i) => (
        <div key={i} className="bird-el" style={{ top:b.top, animationDuration:b.dur, animationDelay:b.delay }}>
          <svg width={b.size*2.2} height={b.size} viewBox="0 0 22 10" fill="none">
            <path d="M1 6 C 5 0, 6 0, 11 5 C 16 0, 17 0, 21 6" stroke="rgba(20,26,40,.55)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function WindStreaks({ n = 10 }) {
  const streaks = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${6 + R(i)*82}%`,
    width: `${110 + R(i+20)*260}px`,
    dur:   `${1.8 + R(i+30)*2.4}s`,
    delay: `${R(i+40)*-4}s`,
  })), [n]);
  return (
    <div className="particle-layer">
      {streaks.map((s, i) => (
        <div key={i} className="wind-streak" style={{ top:s.top, width:s.width, animationDuration:s.dur, animationDelay:s.delay }} />
      ))}
    </div>
  );
}

function FallingBits({ n = 22, kind = 'leaf' }) {
  const palette = kind === 'leaf'
    ? ['#c2621f', '#d9822b', '#8a4a1c', '#e0a33a']
    : ['#f3b8cf', '#f7cfe0', '#eaa0c2'];
  const bits = useMemo(() => Array.from({ length: n }, (_, i) => ({
    left:  `${R(i)*100}%`,
    size:  `${8 + R(i+10)*9}px`,
    color: palette[Math.floor(R(i+15)*palette.length)],
    dur:   `${9 + R(i+20)*10}s`,
    delay: `${R(i+30)*-14}s`,
    op:    0.55 + R(i+40)*0.35,
  })), [n, kind]); // eslint-disable-line
  return (
    <div className="particle-layer">
      {bits.map((b, i) => (
        <div key={i} className={kind === 'leaf' ? 'leaf-el' : 'petal-el'} style={{
          left:b.left, width:b.size, height:b.size, background:b.color,
          animationDuration:b.dur, animationDelay:b.delay, opacity:b.op,
        }} />
      ))}
    </div>
  );
}

function Rainbow() {
  return (
    <div className="particle-layer">
      <div className="rainbow-arc" style={{
        width: 900, height: 900, left: '50%', bottom: '-10%', marginLeft: -450,
        borderWidth: 5,
        borderImage: 'linear-gradient(90deg,#f87171,#fb923c,#fbbf24,#4ade80,#60a5fa,#818cf8,#c084fc) 1',
        boxShadow: '0 0 60px rgba(255,255,255,.05)',
      }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Time-of-day base sky — the underlay every scene sits on top of
──────────────────────────────────────────────────────────── */
const TIME_LAYERS = {
  sunrise:   () => <><SunOrb low mood="golden" /><Clouds n={3} light warm /><Birds n={2} /></>,
  morning:   () => <><SunOrb mood="soft" /><Clouds n={4} light /></>,
  afternoon: () => <SunOrb mood="strong" />,
  sunset:    () => <><div className="horizon-el" style={{ height:'40%', background:'linear-gradient(to top,rgba(220,62,10,.16),rgba(180,40,5,.05),transparent)' }} /><SunOrb low mood="golden" /><Clouds n={3} light warm /><Stars n={14} dim /></>,
  night:     () => <><Stars /><MoonOrb /></>,
  midnight:  () => <><Stars n={110} /><MoonOrb /></>,
};

/* ────────────────────────────────────────────────────────────
   Weather mood — the atmosphere/particle layer above the sky
──────────────────────────────────────────────────────────── */
const MOOD_LAYERS = {
  'sunny':        () => null,
  'hot':          () => <SunOrb hot mood="strong" />,
  'cold':         () => <Clouds light n={3} />,
  'extreme-cold': () => <><Clouds light n={3} /><div className="frost-vignette" /></>,
  'cloudy':       () => <Clouds dense n={8} />,
  'partly':       () => <Clouds light n={5} />,
  'windy':        () => <><Clouds n={10} fast /><WindStreaks /></>,
  'rain':         () => <><Clouds dense n={6} /><Rain /></>,
  'drizzle':      () => <><Clouds light n={5} /><Rain n={30} /></>,
  'heavy-rain':   () => <><Clouds dense storm n={7} /><Rain n={90} fast /></>,
  'thunder':      () => <><Clouds dense storm n={7} /><Rain n={90} fast /><div className="lightning-el" /></>,
  'rain-sun':     () => <><Clouds light n={4} /><Rain n={26} /><SunOrb mood="soft" /></>,
  'snow':         () => <><Clouds light n={5} /><Snow /></>,
  'blizzard':     () => <><Clouds dense storm n={6} fast /><Snow n={110} diagonal /><WindStreaks n={16} /></>,
  'fog':          () => <Mist n={4} dense />,
  'dust':         () => <Dust storm />,
  'rainbow':      () => <><Clouds light n={3} /><Rainbow /><SunOrb mood="soft" /></>,
  'morning':      () => null,
  'night':        () => null,
};

/* Seasonal accent layer — subtle, only where it makes sense */
const SEASON_LAYERS = {
  spring: () => <FallingBits n={16} kind="petal" />,
  summer: () => null,
  autumn: () => <FallingBits n={18} kind="leaf" />,
  winter: () => null,
};

const HEAT_MOODS = new Set(['hot']);

function Layer({ className, animKey, children }) {
  return (
    <div key={animKey} className={`wx-scene ${className}`} style={{ animation:'bgFade 1.8s ease both' }}>
      <div className="particle-layer">{children}</div>
    </div>
  );
}

/**
 * Cinematic weather background: three layers —
 *   1) time-of-day sky (gradient + sun/moon/stars position)
 *   2) weather mood (precipitation, cloud density, fog, storms…)
 *   3) seasonal accents (falling leaves / petals)
 * Each layer keys off its own input, so it fades independently —
 * a sunset that starts raining only cross-fades the mood layer,
 * not the whole background.
 */
export default function WeatherScene({ condition = 'sunny', timeBucket = 'afternoon', season = 'summer' }) {
  const TimeScene   = TIME_LAYERS[timeBucket]   || TIME_LAYERS.afternoon;
  const MoodScene   = MOOD_LAYERS[condition]    || MOOD_LAYERS.sunny;
  const SeasonScene = SEASON_LAYERS[season]     || null;
  const isHeat = HEAT_MOODS.has(condition);

  return (
    <>
      <Layer className={`wx-time-${timeBucket}`} animKey={`t-${timeBucket}`}>
        <TimeScene />
      </Layer>
      <Layer className={`wx-${condition}`} animKey={`m-${condition}`}>
        <MoodScene />
        {isHeat && <div className="heat-shimmer" />}
      </Layer>
      {SeasonScene && (
        <div className="wx-scene" style={{ animation:'fadeIn 2.4s ease both' }}>
          <SeasonScene />
        </div>
      )}
    </>
  );
}
