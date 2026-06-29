import { AlertTriangle, CloudRain, Thermometer, Wind, Zap, Eye, Activity, MoonStar, Sun } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { getUVLabel, getAQILabel, getMoonPhase } from '../services/weatherService';

export default function AlertsPanel() {
  const { weather, airQuality, uvIndex } = useWeather();
  if (!weather) return null;
  const alerts = buildAlerts(weather, airQuality, uvIndex);
  const moon   = getMoonPhase();
  const aqv    = airQuality?.main?.aqi;

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      {alerts.length>0 && (
        <div className="card fade-up card-pad">
          <span className="label">Active Alerts</span>
          <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
            {alerts.map((a,i)=><AlertBadge key={i} {...a} idx={i}/>)}
          </div>
        </div>
      )}

      <div className="card fade-up d2 card-pad">
        <span className="label">Health Index</span>
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <IndexBar label="UV Index"    icon={<Sun size={11}/>}           val={`${(uvIndex||0).toFixed(1)}`} pct={(uvIndex||0)/11*100}            fill={getUVLabel(uvIndex||0).color} tag={getUVLabel(uvIndex||0).label}/>
          {aqv&&<IndexBar label="Air Quality" icon={<Activity size={11}/>}    val={`${aqv}/5`}               pct={aqv/5*100}                       fill={getAQILabel(aqv).color}        tag={getAQILabel(aqv).label}/>}
          <IndexBar label="Humidity"    icon={<AlertTriangle size={11}/>} val={`${weather.humidity}%`}      pct={weather.humidity}                 fill="var(--blue)"                  tag={weather.humidity>75?'High':weather.humidity<30?'Low':'Good'}/>
          <IndexBar label="Wind"        icon={<Wind size={11}/>}           val={`${weather.windSpeed} m/s`} pct={Math.min(weather.windSpeed/20*100,100)} fill="var(--teal)"           tag={weather.windSpeed>15?'Strong':weather.windSpeed>8?'Moderate':'Light'}/>
        </div>
      </div>

      <div className="card fade-up d3 card-pad">
        <span className="label">Moon Phase</span>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:12 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:700,color:'var(--t1)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{moon.name}</div>
            <div style={{ fontSize:11,color:'var(--t3)' }}>{moon.pct}% illuminated</div>
          </div>
          <MoonStar size={32} color="#c4b5fd" strokeWidth={1.4} style={{ flexShrink:0 }}/>
        </div>
        <div className="prog-track" style={{ marginTop:12 }}>
          <div className="prog-fill" style={{ width:`${moon.pct}%`,background:'linear-gradient(to right,#c4b5fd,#f9a8d4)' }}/>
        </div>
      </div>
    </div>
  );
}

function buildAlerts(w, aq, uvi) {
  const out=[], c=(w.mainCondition||'').toLowerCase();
  if (c.includes('thunder')||c.includes('storm')) out.push({ icon:<Zap size={12}/>,          sev:'high',   title:'Thunderstorm',      desc:'Stay indoors, avoid open areas.' });
  if (c.includes('rain')||c.includes('drizzle'))  out.push({ icon:<CloudRain size={12}/>,    sev:'low',    title:'Rain Expected',     desc:'Carry rain gear outdoors.' });
  if (w.temperature>=38)                          out.push({ icon:<Thermometer size={12}/>,  sev:'high',   title:'Extreme Heat',      desc:`${w.temperature}° — limit exposure.` });
  if (w.temperature<=0)                           out.push({ icon:<Thermometer size={12}/>,  sev:'medium', title:'Freezing',          desc:'Ice possible on roads.' });
  if (w.windSpeed>15)                             out.push({ icon:<Wind size={12}/>,          sev:'medium', title:'High Winds',        desc:`Gusts to ${w.windGust} m/s.` });
  if ((uvi||0)>=8)                               out.push({ icon:<Eye size={12}/>,            sev:'high',   title:'Very High UV',      desc:'Limit exposure 10am–4pm.' });
  if (aq?.main?.aqi>=4)                          out.push({ icon:<Activity size={12}/>,       sev:'medium', title:'Poor Air Quality',  desc:'Sensitive groups stay indoors.' });
  return out;
}

const SEV={ high:'#f87171', medium:'#fb923c', low:'#60a5fa' };
const SEV_BG={ high:'rgba(248,113,113,', medium:'rgba(251,146,60,', low:'rgba(96,165,250,' };

function AlertBadge({ icon, sev, title, desc, idx }) {
  const c=SEV[sev]||SEV.low, bg=SEV_BG[sev]||SEV_BG.low;
  return (
    <div className={`fade-up d${Math.min(idx+1,6)}`}
      style={{ display:'flex',gap:9,padding:'9px 11px',background:`${bg}.10)`,border:`1px solid ${bg}.25)`,borderLeft:`3px solid ${c}`,borderRadius:'var(--r2)' }}>
      <span style={{ color:c,flexShrink:0,paddingTop:1 }}>{icon}</span>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:11.5,fontWeight:700,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{title}</div>
        <div style={{ fontSize:10.5,color:'var(--t3)',marginTop:2,lineHeight:1.4 }}>{desc}</div>
      </div>
    </div>
  );
}

function IndexBar({ label, icon, val, pct, fill, tag }) {
  return (
    <div>
      <div className="index-bar-header">
        <span style={{ fontSize:11.5,color:'var(--t2)',display:'flex',alignItems:'center',gap:5 }}>{icon}{label}</span>
        <div style={{ display:'flex',gap:7,alignItems:'center',flexShrink:0 }}>
          <span style={{ fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:99,background:'rgba(91,156,246,.12)',color:fill,whiteSpace:'nowrap' }}>{tag}</span>
          <span style={{ fontSize:11.5,fontWeight:700,color:'var(--t1)' }}>{val}</span>
        </div>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width:`${Math.min(pct,100)}%`,background:fill }}/>
      </div>
    </div>
  );
}
