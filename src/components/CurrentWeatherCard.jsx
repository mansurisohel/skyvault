import { useState } from 'react';
import { Star, RefreshCw, Droplets, Eye, Thermometer, Sunrise, Sunset, Navigation, ArrowUp, ArrowDown } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { formatTime, getWindDirection } from '../services/weatherService';

export default function CurrentWeatherCard() {
  const { weather, units, favorites, toggleFavorite, refreshWeather, loading } = useWeather();
  if (!weather) return null;
  const isFav = favorites.includes(weather.city);
  const u  = units === 'metric' ? '°C' : '°F';
  const wu = units === 'metric' ? 'm/s' : 'mph';

  return (
    <div className="card fade-up card-pad" style={{ position:'relative', overflow:'hidden' }}>
      {/* Glow blobs */}
      <div style={{ position:'absolute',top:-80,right:-80,width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(91,156,246,.18) 0%,transparent 70%)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',bottom:-60,left:-40,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.10) 0%,transparent 70%)',pointerEvents:'none' }}/>

      <div className="wx-card-inner" style={{ position:'relative' }}>

        {/* LEFT */}
        <div style={{ flex:'1 1 200px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <span className="live-dot"/>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--t3)' }}>Live</span>
            <span style={{ fontSize:11, color:'var(--t3)' }}>·</span>
            <span style={{ fontSize:11, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
              {weather.localTime.toUTCString().split(',')[1]?.slice(0,-4).trim()}
            </span>
          </div>

          <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
            <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(18px,4vw,28px)', fontWeight:800, letterSpacing:'-.5px', color:'var(--t1)', lineHeight:1.1 }}>{weather.city}</h1>
            <span style={{ fontSize:14, color:'var(--t3)', fontWeight:500 }}>{weather.country}</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'flex-start', lineHeight:1 }}>
              <span style={{ fontFamily:'var(--fd)', fontSize:'clamp(56px,12vw,88px)', fontWeight:300, letterSpacing:'-4px', color:'var(--t1)' }}>{weather.temperature}</span>
              <span style={{ fontSize:24, fontWeight:400, paddingTop:12, color:'var(--t2)' }}>{u}</span>
            </div>
            <img src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`} alt={weather.description}
              style={{ width:64, height:64, filter:'drop-shadow(0 0 14px rgba(91,156,246,.38))', flexShrink:0 }}/>
          </div>

          <p style={{ fontSize:14, fontWeight:600, textTransform:'capitalize', color:'var(--t2)', marginTop:4 }}>{weather.description}</p>
          <div style={{ display:'flex', gap:12, marginTop:5, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'var(--t3)' }}>Feels {weather.feelsLike}{u}</span>
            <span style={{ fontSize:11, color:'var(--orange)', display:'flex', alignItems:'center', gap:2 }}><ArrowUp size={10}/>{weather.tempMax}{u}</span>
            <span style={{ fontSize:11, color:'var(--blue)', display:'flex', alignItems:'center', gap:2 }}><ArrowDown size={10}/>{weather.tempMin}{u}</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="wx-card-right">
          <div className="wx-action-btns">
            <ABtn onClick={() => toggleFavorite(weather.city)} active={isFav} title={isFav?'Unfavorite':'Favorite'}>
              <Star size={13} fill={isFav?'currentColor':'none'}/>
            </ABtn>
            <ABtn onClick={refreshWeather} disabled={loading} title="Refresh">
              <RefreshCw size={13} style={{ animation:loading?'spin .8s linear infinite':'none' }}/>
            </ABtn>
          </div>

          <div className="wx-stat-grid">
            <Stat icon={<Droplets size={12}/>}    label="Humidity"   value={`${weather.humidity}%`}/>
            <Stat icon={<Navigation size={12}/>}  label="Wind"       value={`${weather.windSpeed}${wu}`} sub={getWindDirection(weather.windDeg)}/>
            <Stat icon={<Eye size={12}/>}         label="Visibility" value={`${weather.visibility}km`}/>
            <Stat icon={<Thermometer size={12}/>} label="Dew Pt"     value={`${weather.dewPoint}${u}`}/>
          </div>

          <div className="wx-sun-row">
            <SunTime Icon={Sunrise} label="Sunrise" time={formatTime(weather.sunrise, weather.utcOffset)} color="#fbbf24"/>
            <SunTime Icon={Sunset}  label="Sunset"  time={formatTime(weather.sunset,  weather.utcOffset)} color="#f97316"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function ABtn({ children, onClick, disabled, title, active }) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ width:33,height:33,display:'flex',alignItems:'center',justifyContent:'center',
        background:active?'var(--acc-d)':h?'var(--card2)':'transparent',
        border:`1px solid ${active?'var(--acc)':'var(--b1)'}`,
        borderRadius:'var(--r1)',cursor:disabled?'default':'pointer',
        color:active?'var(--acc)':'var(--t2)',transition:'all .2s var(--ease)' }}>
      {children}
    </button>
  );
}

function Stat({ icon, label, value, sub }) {
  return (
    <div style={{ background:'var(--card2)',border:'1px solid var(--b1)',borderRadius:'var(--r2)',padding:'8px 10px',minWidth:0 }}>
      <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:3,color:'var(--t3)' }}>
        {icon}<span className="label-sm">{label}</span>
      </div>
      <div style={{ fontSize:13,fontWeight:700,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{value}</div>
      {sub && <div style={{ fontSize:10,color:'var(--t3)',marginTop:1 }}>{sub}</div>}
    </div>
  );
}

function SunTime({ Icon, label, time, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ display:'flex',justifyContent:'center',marginBottom:3,color }}><Icon size={14}/></div>
      <div style={{ fontSize:12,fontWeight:700,color:'var(--t1)' }}>{time}</div>
      <div className="label-sm" style={{ marginTop:1 }}>{label}</div>
    </div>
  );
}
