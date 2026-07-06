import { Sun, Wind, Droplets, Eye, Gauge, Activity } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { getUVLabel, getAQILabel } from '../services/weatherService';

/* Compact, color-coded glanceable indicators — designed to answer
   "how's the weather right now" in under two seconds. */
export default function WeatherIndicators() {
  const { weather, airQuality, uvIndex, units } = useWeather();
  if (!weather) return null;

  const wu  = units === 'metric' ? 'm/s' : 'mph';
  const uvi = getUVLabel(uvIndex || 0);
  const aqv = airQuality?.main?.aqi;
  const aqi = getAQILabel(aqv);

  const windLevel =
    weather.windSpeed < 4  ? { label:'Calm',     color:'var(--green)'  } :
    weather.windSpeed < 9  ? { label:'Breezy',   color:'var(--blue)'   } :
    weather.windSpeed < 15 ? { label:'Windy',    color:'var(--yellow)' } :
                              { label:'Strong',   color:'var(--red)'    };

  const humLevel =
    weather.humidity < 30 ? { label:'Dry',       color:'var(--yellow)' } :
    weather.humidity < 70 ? { label:'Balanced',  color:'var(--green)'  } :
                              { label:'Humid',     color:'var(--blue)'   };

  const visLevel =
    parseFloat(weather.visibility) >= 10 ? { label:'Excellent', color:'var(--green)'  } :
    parseFloat(weather.visibility) >= 5  ? { label:'Good',      color:'var(--blue)'   } :
                                            { label:'Reduced',   color:'var(--yellow)' };

  const pressLevel =
    weather.pressure > 1020 ? { label:'High',  color:'var(--blue)'   } :
    weather.pressure < 1005 ? { label:'Low',   color:'var(--yellow)' } :
                               { label:'Normal',color:'var(--green)'  };

  const items = [
    { icon:<Sun size={15}/>,      label:'UV Index',    value:(uvIndex||0).toFixed(0), tag:uvi.label,         color:uvi.color },
    { icon:<Activity size={15}/>, label:'Air Quality', value:aqv?`${aqv}`:'—',         tag:aqv?aqi.label:'N/A', color:aqv?aqi.color:'var(--t3)' },
    { icon:<Wind size={15}/>,     label:'Wind',        value:`${weather.windSpeed}${wu}`, tag:windLevel.label, color:windLevel.color },
    { icon:<Droplets size={15}/>, label:'Humidity',    value:`${weather.humidity}%`,   tag:humLevel.label,    color:humLevel.color },
    { icon:<Eye size={15}/>,      label:'Visibility',  value:`${weather.visibility}km`,tag:visLevel.label,    color:visLevel.color },
    { icon:<Gauge size={15}/>,    label:'Pressure',    value:`${weather.pressure}`,    tag:pressLevel.label,  color:pressLevel.color },
  ];

  return (
    <div className="indicator-strip">
      {items.map((it, i) => (
        <IndicatorTile key={i} {...it} idx={i} />
      ))}
    </div>
  );
}

function IndicatorTile({ icon, label, value, tag, color, idx }) {
  return (
    <div className={`card fade-up d${Math.min(idx + 1, 8)}`}
      style={{
        padding:'12px 14px', display:'flex', flexDirection:'column', gap:6,
        borderTop:`2px solid ${color}`, borderRadius:'var(--r2)',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, color }}>
        {icon}
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--t3)' }}>{label}</span>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:6 }}>
        <span style={{ fontSize:'clamp(14px,2.2vw,17px)', fontWeight:800, fontFamily:'var(--fd)', color:'var(--t1)' }}>{value}</span>
        <span style={{ fontSize:10, fontWeight:700, color, whiteSpace:'nowrap' }}>{tag}</span>
      </div>
    </div>
  );
}
