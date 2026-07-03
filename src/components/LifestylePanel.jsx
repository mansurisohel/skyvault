import { Activity, Bike, Flower2, TreePine, Waves, Mountain } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { getLifestyleRatings } from '../services/weatherService';

const ICONS = {
  Running: Activity, Cycling: Bike, Gardening: Flower2,
  Picnic: TreePine, Swimming: Waves, Hiking: Mountain,
};

export default function LifestylePanel() {
  const { weather, airQuality } = useWeather();
  if (!weather) return null;
  const ratings = getLifestyleRatings(weather, airQuality);
  return (
    <div className="card fade-up card-pad">
      <span className="label">Activity Conditions</span>
      <div className="lifestyle-grid">
        {ratings.map((r, i) => <Card key={i} {...r} idx={i} />)}
      </div>
    </div>
  );
}

function Card({ activity, score, label, color, idx }) {
  const Icon = ICONS[activity] || Activity;
  // Ring geometry — circumference for r=20
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className={`card-lift fade-up d${Math.min(idx + 1, 8)}`}
      style={{
        background: `color-mix(in srgb, ${color} 10%, var(--card2))`,
        border: `1px solid color-mix(in srgb, ${color} 28%, var(--b1))`,
        borderRadius: 'var(--r3)', padding: '15px 10px 13px',
        textAlign: 'center', cursor: 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}
    >
      {/* Score ring with icon centered */}
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <svg width="52" height="52" viewBox="0 0 52 52" className="score-ring-svg">
          <circle cx="26" cy="26" r={r} className="score-ring-track" stroke="var(--b1)" />
          <circle
            cx="26" cy="26" r={r} className="score-ring-fill"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color,
        }}>
          <Icon size={18} />
        </div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)' }}>{activity}</div>

      {/* Numeric score + label */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="score-num" style={{ fontSize: 18, color }}>{score}</span>
        <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>/100</span>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'var(--card2)',
        border: `1px solid color-mix(in srgb, ${color} 30%, var(--b1))`,
        borderRadius: 99, padding: '2px 9px',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color }}>{label}</span>
      </div>
    </div>
  );
}
