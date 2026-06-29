import { useMemo, useEffect, useRef, useState } from 'react';

// Deterministic random
const R = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

/* ── Particle components ── */
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

function Snow({ n = 52 }) {
  const flakes = useMemo(() => Array.from({ length: n }, (_, i) => ({
    left:  `${R(i)*100}%`,
    size:  `${3 + R(i+10)*5.5}px`,
    delay: `${R(i+20)*5.5}s`,
    dur:   `${5 + R(i+30)*7.5}s`,
    op:    0.40 + R(i+40)*0.52,
  })), [n]);
  return (
    <div className="particle-layer">
      {flakes.map((f, i) => (
        <div key={i} className="snow-flake" style={{ left:f.left, width:f.size, height:f.size, animationDelay:f.delay, animationDuration:f.dur, opacity:f.op }} />
      ))}
    </div>
  );
}

function Stars({ n = 85, early = false }) {
  const stars = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${R(i) * (early ? 45 : 72)}%`,
    left:  `${R(i+80) * 100}%`,
    size:  `${1 + R(i+160) * (early ? 1.2 : 2.5)}px`,
    delay: `${R(i+240) * 4.5}s`,
    dur:   `${2 + R(i+320) * 3.2}s`,
    op:    early ? 0.5 : 0.9,
  })), [n, early]);
  return (
    <>
      {stars.map((s, i) => (
        <div key={i} className="star-dot" style={{ top:s.top, left:s.left, width:s.size, height:s.size, animationDelay:s.delay, animationDuration:s.dur, opacity:s.op }} />
      ))}
    </>
  );
}

function Clouds({ n = 7, light = false }) {
  const clouds = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${5 + R(i)*55}%`,
    left:  `${R(i+6)*55}%`,
    w:     170 + R(i+12)*230,
    h:     58 + R(i+18)*68,
    op:    light ? 0.035 + R(i+24)*0.045 : 0.065 + R(i+24)*0.085,
    dur:   `${28 + R(i+30)*50}s`,
    delay: `${R(i+36)*-24}s`,
  })), [n, light]);
  return (
    <div className="particle-layer">
      {clouds.map((c, i) => (
        <div key={i} className="cloud-puff" style={{ top:c.top, left:c.left, width:c.w, height:c.h, background:'rgba(200,215,230,1)', opacity:c.op, animationDuration:c.dur, animationDelay:c.delay }} />
      ))}
    </div>
  );
}

function SunOrb({ hot = false, setting = false, rising = false }) {
  const pos = rising ? { bottom:-80, left:'8%' } : setting ? { bottom:-100, right:'8%' } : { top:-55, left:'10%' };
  const size = (rising || setting) ? 230 : 195;
  return (
    <>
      <div className="sun-orb" style={{ width:size, height:size, opacity:hot ? 0.88 : rising||setting ? 0.48 : 0.65, ...pos }} />
      {!rising && !setting && Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="sun-ray-el" style={{
          position:'absolute', top:52, left:'18%',
          width:`${125 + i*14}px`, height:1,
          background:`rgba(255,205,60,${0.055 - i*0.005})`,
          transform:`rotate(${i*45}deg)`,
          animationDelay:`${i*1.3}s`,
        }} />
      ))}
      {hot && <div className="heat-el" />}
    </>
  );
}

function MoonOrb() {
  return <div className="moon-orb" style={{ width:68, height:68, top:36, right:'13%' }} />;
}

function Dust({ n = 22 }) {
  const streaks = useMemo(() => Array.from({ length: n }, (_, i) => ({
    top:   `${8 + R(i)*82}%`,
    width: `${65 + R(i+20)*230}px`,
    op:    0.16 + R(i+40)*0.34,
    dur:   `${6 + R(i+60)*15}s`,
    delay: `${R(i+80)*-12}s`,
  })), [n]);
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

/* ── Scene definitions ── */
const SCENES = {
  sunny:   () => <div className="particle-layer"><SunOrb /></div>,
  hot:     () => <div className="particle-layer"><SunOrb hot /></div>,
  cold:    () => <div className="particle-layer"><Snow /></div>,
  cloudy:  () => <><div className="particle-layer"><Clouds /></div></>,
  partly:  () => <><div className="particle-layer"><SunOrb /><Clouds light n={5} /></div></>,
  rain:    () => <><div className="particle-layer"><Rain /></div><div className="particle-layer"><Clouds light /></div></>,
  drizzle: () => <><div className="particle-layer"><Rain n={30} /></div></>,
  thunder: () => <><div className="particle-layer"><Rain n={90} fast /></div><div className="lightning-el" /></>,
  snow:    () => <div className="particle-layer"><Snow /></div>,
  fog:     () => <div className="particle-layer"><Mist n={4} dense /></div>,
  dust:    () => <div className="particle-layer"><Dust /></div>,
  morning: () => (
    <div className="particle-layer">
      <SunOrb rising />
      <Mist n={3} />
    </div>
  ),
  evening: () => (
    <div className="particle-layer">
      <div className="horizon-el" style={{ height:'38%', background:'linear-gradient(to top,rgba(220,62,10,.18),rgba(180,40,5,.06),transparent)' }} />
      <SunOrb setting />
      <Stars n={18} early />
    </div>
  ),
  night:   () => (
    <div className="particle-layer">
      <Stars />
      <MoonOrb />
    </div>
  ),
};

/* ── Transition wrapper — cross-fades between conditions ── */
export default function WeatherScene({ condition }) {
  const [active,  setActive]  = useState(condition);
  const [prev,    setPrev]    = useState(null);
  const [fading,  setFading]  = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (condition === active) return;
    clearTimeout(timerRef.current);
    setPrev(active);
    setFading(true);
    setActive(condition);
    timerRef.current = setTimeout(() => { setPrev(null); setFading(false); }, 1800);
    return () => clearTimeout(timerRef.current);
  }, [condition]); // eslint-disable-line

  const Scene     = SCENES[active] || SCENES.sunny;
  const PrevScene = prev ? (SCENES[prev] || SCENES.sunny) : null;

  return (
    <>
      {/* Outgoing scene fades out */}
      {PrevScene && fading && (
        <div className={`wx-scene wx-${prev}`} style={{ opacity:0, transition:'opacity 1.6s ease' }}>
          <PrevScene />
        </div>
      )}
      {/* Incoming scene fades in */}
      <div className={`wx-scene wx-${active}`} style={{ animation:'bgFade 1.6s ease both' }}>
        <Scene />
      </div>
    </>
  );
}
