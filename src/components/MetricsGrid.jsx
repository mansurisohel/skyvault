import { Gauge, Wind, Droplets, Eye, Cloud, Sun, Activity, MoonStar, Sunrise, Sunset, Thermometer } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { getUVLabel, getAQILabel, getWindDirection, getMoonPhase, formatTime } from '../services/weatherService';

export default function MetricsGrid() {
  const { weather, airQuality, uvIndex, units } = useWeather();
  if (!weather) return null;
  const u   = units === 'metric' ? '°C' : '°F';
  const wu  = units === 'metric' ? 'm/s' : 'mph';
  const uvi = getUVLabel(uvIndex || 0);
  const aqv = airQuality?.main?.aqi;
  const aqi = getAQILabel(aqv);
  const moon = getMoonPhase();
  const comp = airQuality?.components || {};

  const tiles = [
    { icon:<Gauge size={14}/>,       label:'Pressure',    val:`${weather.pressure}`,                    unit:'hPa', col:'var(--blue)',   sub:weather.pressure>1013?'High':'Low pressure' },
    { icon:<Wind size={14}/>,        label:'Wind',        val:`${weather.windSpeed}`,                   unit:wu,    col:'var(--teal)',   sub:`${getWindDirection(weather.windDeg)} · G:${weather.windGust}${wu}` },
    { icon:<Droplets size={14}/>,    label:'Humidity',    val:`${weather.humidity}`,                    unit:'%',   col:'var(--blue)',   bar:weather.humidity/100,               barC:'var(--blue)',   sub:weather.humidity>75?'Muggy':weather.humidity<30?'Dry':'Good' },
    { icon:<Eye size={14}/>,         label:'Visibility',  val:`${weather.visibility}`,                  unit:'km',  col:'var(--purple)', bar:Math.min(parseFloat(weather.visibility)/10,1), barC:'var(--purple)', sub:parseFloat(weather.visibility)>=10?'Excellent':parseFloat(weather.visibility)>=5?'Good':'Low' },
    { icon:<Cloud size={14}/>,       label:'Cloud Cover', val:`${weather.clouds}`,                      unit:'%',   col:'#94a3b8',       bar:weather.clouds/100,                 barC:'#94a3b8',       sub:weather.clouds<20?'Clear':weather.clouds<60?'Partly':'Overcast' },
    { icon:<Sun size={14}/>,         label:'UV Index',    val:`${(uvIndex||0).toFixed(1)}`,             unit:'',    col:uvi.color,       bar:Math.min((uvIndex||0)/11,1),        barC:uvi.color,       sub:uvi.label },
    { icon:<Activity size={14}/>,    label:'Air Quality', val:aqv?`${aqv}/5`:'--',                      unit:'',    col:aqi.color,       bar:aqv?aqv/5:null,                     barC:aqi.color,       sub:aqv?aqi.label:'No data' },
    { icon:<Thermometer size={14}/>, label:'Dew Point',   val:`${weather.dewPoint}`,                    unit:u,     col:'var(--pink)',   sub:weather.dewPoint>20?'Uncomfortable':weather.dewPoint>13?'Comfortable':'Dry' },
    { icon:<MoonStar size={14}/>,    label:'Moon',        val:moon.name.split(' ').slice(0,2).join(' '),unit:'',    col:'#c4b5fd',       bar:moon.pct/100,                       barC:'#c4b5fd',       sub:`${moon.pct}% lit` },
  ];

  return (
    <div className="card fade-up card-pad">
      <span className="label">Detailed Conditions</span>
      <div className="metrics-grid">
        {tiles.map((t,i) => <Tile key={i} {...t} idx={i}/>)}
      </div>

      {comp.pm2_5 && (
        <div style={{ marginTop:16,paddingTop:14,borderTop:'1px solid var(--b1)' }}>
          <span className="label">Pollutants (μg/m³)</span>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'6px 16px' }}>
            {[['PM2.5',comp.pm2_5],['PM10',comp.pm10],['NO₂',comp.no2],['O₃',comp.o3],['CO',comp.co],['SO₂',comp.so2]].map(([l,v])=>v!=null&&(
              <span key={l} style={{ fontSize:12,color:'var(--t2)' }}>
                <span style={{ color:'var(--t3)' }}>{l} </span><strong>{v?.toFixed(1)}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:16,paddingTop:14,borderTop:'1px solid var(--b1)' }}>
        <span className="label">Daylight Progress</span>
        <DaylightBar weather={weather}/>
      </div>
    </div>
  );
}

function Tile({ icon, label, val, unit, bar, barC, sub, col, idx }) {
  return (
    <div className={`fade-up d${Math.min(idx+1,8)}`}
      style={{ background:'var(--card2)',border:'1px solid var(--b1)',borderRadius:'var(--r3)',padding:'12px 13px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
        <span style={{ color:col }}>{icon}</span>
        <span className="label-sm" style={{ textAlign:'right',maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{label}</span>
      </div>
      <div style={{ display:'flex',alignItems:'baseline',gap:3,marginBottom:bar!=null?5:0 }}>
        <span style={{ fontSize:'clamp(16px,3vw,20px)',fontWeight:800,fontFamily:'var(--fd)',color:'var(--t1)' }}>{val}</span>
        {unit&&<span style={{ fontSize:10,color:'var(--t3)' }}>{unit}</span>}
      </div>
      {bar!=null&&(
        <div className="prog-track" style={{ marginBottom:5 }}>
          <div className="prog-fill" style={{ width:`${Math.round(bar*100)}%`,background:barC }}/>
        </div>
      )}
      <p style={{ fontSize:10,color:'var(--t3)',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sub}</p>
    </div>
  );
}

function DaylightBar({ weather }) {
  const { sunrise, sunset, utcOffset } = weather;
  if (!sunrise||!sunset) return null;
  const now   = Math.floor(Date.now()/1000) + utcOffset;
  const total = sunset - sunrise;
  const pct   = Math.round((Math.max(0,Math.min(now-sunrise,total))/total)*100);
  return (
    <div>
      <div style={{ position:'relative',height:20,background:'linear-gradient(to right,#1e3a5f,#f97316 42%,#f97316 58%,#1e3a5f)',borderRadius:99,overflow:'visible',marginBottom:8 }}>
        <div style={{ position:'absolute',left:`${Math.min(pct,96)}%`,top:'50%',transform:'translate(-50%,-50%)' }}>
          <div style={{ width:14,height:14,background:'#fbbf24',borderRadius:'50%',border:'2px solid rgba(255,255,255,.9)',boxShadow:'0 0 10px rgba(251,191,36,.7)' }}/>
        </div>
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',fontSize:10.5,color:'var(--t3)',flexWrap:'wrap',gap:4 }}>
        <span style={{ display:'flex',alignItems:'center',gap:4 }}><Sunrise size={10} color="#fbbf24"/>{formatTime(sunrise,utcOffset)}</span>
        <span style={{ color:'var(--t2)',fontWeight:600 }}>{pct}% elapsed</span>
        <span style={{ display:'flex',alignItems:'center',gap:4 }}><Sunset size={10} color="#f97316"/>{formatTime(sunset,utcOffset)}</span>
      </div>
    </div>
  );
}
