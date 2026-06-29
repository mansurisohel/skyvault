import { Activity, Bike, Flower2, TreePine, Waves, Mountain } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { getLifestyleRatings } from '../services/weatherService';

const ICONS = {
  Running:<Activity size={18}/>, Cycling:<Bike size={18}/>, Gardening:<Flower2 size={18}/>,
  Picnic:<TreePine size={18}/>,  Swimming:<Waves size={18}/>, Hiking:<Mountain size={18}/>
};
const RATINGS = {
  Excellent:{ dot:'#4ade80', bg:'rgba(74,222,128,.13)',  bd:'rgba(74,222,128,.28)'  },
  Good:     { dot:'#86efac', bg:'rgba(134,239,172,.11)', bd:'rgba(134,239,172,.24)' },
  Fair:     { dot:'#fbbf24', bg:'rgba(251,191,36,.11)',  bd:'rgba(251,191,36,.24)'  },
  Poor:     { dot:'#f87171', bg:'rgba(248,113,113,.11)', bd:'rgba(248,113,113,.24)' },
};

export default function LifestylePanel() {
  const { weather, airQuality } = useWeather();
  if (!weather) return null;
  const ratings = getLifestyleRatings(weather, airQuality);
  return (
    <div className="card fade-up card-pad">
      <span className="label">Activity Conditions</span>
      <div className="lifestyle-grid">
        {ratings.map((r,i) => <Card key={i} {...r} idx={i}/>)}
      </div>
    </div>
  );
}

function Card({ activity, label, color, idx }) {
  const Icon  = ICONS[activity] || <Activity size={18}/>;
  const style = RATINGS[label] || RATINGS.Fair;
  return (
    <div className={`card-lift fade-up d${Math.min(idx+1,8)}`}
      style={{ background:style.bg,border:`1px solid ${style.bd}`,borderRadius:'var(--r3)',padding:'14px 10px',textAlign:'center',cursor:'default' }}>
      <div style={{ color,marginBottom:7,display:'flex',justifyContent:'center' }}>{Icon}</div>
      <div style={{ fontSize:11.5,fontWeight:700,color:'var(--t2)',marginBottom:8 }}>{activity}</div>
      <div style={{ display:'inline-flex',alignItems:'center',gap:5,background:'var(--card2)',border:`1px solid ${style.bd}`,borderRadius:99,padding:'3px 9px' }}>
        <div style={{ width:6,height:6,borderRadius:'50%',background:style.dot,boxShadow:`0 0 6px ${style.dot}`,flexShrink:0 }}/>
        <span style={{ fontSize:10.5,fontWeight:700,color }}>{label}</span>
      </div>
    </div>
  );
}
