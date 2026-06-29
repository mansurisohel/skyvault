import { useState } from 'react';
import { AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,BarChart,Bar } from 'recharts';
import { CloudRain } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

const TT = {
  background:'rgba(8,12,24,.94)',border:'1px solid rgba(255,255,255,.14)',
  borderRadius:8,fontSize:12,color:'#eef2ff',
  backdropFilter:'blur(20px)',boxShadow:'0 8px 32px rgba(0,0,0,.4)'
};

const CHARTS = {
  temp:     { key:'temp',     label:'Temp',    color:'#5b9cf6' },
  rain:     { key:'rainProb', label:'Rain %',  color:'#34d399' },
  wind:     { key:'windSpeed',label:'Wind',    color:'#a78bfa' },
  humidity: { key:'humidity', label:'Humidity',color:'#f9a8d4' },
};

export function HourlyForecast() {
  const { forecast, units } = useWeather();
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('temp');
  if (!forecast?.hourly?.length) return null;
  const u  = units === 'metric' ? '°C' : '°F';
  const wu = units === 'metric' ? 'm/s' : 'mph';
  const cfg = CHARTS[tab];

  const tabLabels = { temp:`Temp`, rain:'Rain', wind:'Wind', humidity:'Humid' };

  return (
    <div className="card fade-up card-pad">
      <div className="forecast-header">
        <span className="label" style={{ marginBottom:0 }}>48-Hour Forecast</span>
        <div className="pill-tabs">
          {Object.entries(CHARTS).map(([k,c])=>(
            <button key={k} className={`pill-tab${tab===k?' on':''}`}
              onClick={()=>setTab(k)}
              style={tab===k?{color:c.color}:{}}>
              {isMobile ? tabLabels[k] : (k==='temp'?`Temp(${u})`:k==='wind'?`Wind(${wu})`:k.charAt(0).toUpperCase()+k.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {/* Hourly scroll strip */}
      <div className="scroll-x" style={{ marginBottom:14,paddingBottom:6 }}>
        {forecast.hourly.map((h,i)=>(
          <div key={i} style={{ minWidth:isMobile?44:50,textAlign:'center',flexShrink:0 }}>
            <div style={{ fontSize:9.5,color:'var(--t3)',marginBottom:2 }}>{h.timeLabel}</div>
            <img src={`https://openweathermap.org/img/wn/${h.iconCode}.png`} alt="" style={{ width:26,height:26 }}/>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--t1)' }}>{h.temp}{u}</div>
            {h.rainProb>0&&(
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:1,fontSize:9.5,color:'var(--blue)' }}>
                <CloudRain size={8}/>{h.rainProb}%
              </div>
            )}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={isMobile?100:120}>
        <AreaChart data={forecast.hourly} margin={{ top:4,right:4,bottom:0,left:isMobile?-28:-22 }}>
          <defs>
            <linearGradient id={`hg${tab}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={cfg.color} stopOpacity={.25}/>
              <stop offset="100%" stopColor={cfg.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false}/>
          <XAxis dataKey="timeLabel" tick={{ fill:'rgba(238,242,255,.35)',fontSize:9 }} axisLine={false} tickLine={false} interval={isMobile?3:1}/>
          <YAxis tick={{ fill:'rgba(238,242,255,.35)',fontSize:9 }} axisLine={false} tickLine={false} width={26}/>
          <Tooltip contentStyle={TT} labelStyle={{ color:'rgba(238,242,255,.6)',marginBottom:3 }}/>
          <Area type="monotone" dataKey={cfg.key} name={cfg.label} stroke={cfg.color} strokeWidth={2}
            fill={`url(#hg${tab})`} dot={false} activeDot={{ r:4,fill:cfg.color }}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyForecast() {
  const { forecast, units } = useWeather();
  const { isMobile } = useBreakpoint();
  if (!forecast?.daily?.length) return null;
  const u = units === 'metric' ? '°C' : '°F';

  return (
    <div className="card fade-up d2 card-pad">
      <span className="label">7-Day Forecast</span>
      <div style={{ display:'flex',flexDirection:'column',gap:2,marginBottom:18 }}>
        {forecast.daily.map((d,i)=><DayRow key={i} day={d} unit={u} today={i===0} isMobile={isMobile}/>)}
      </div>

      <span className="label">Temperature Range</span>
      <ResponsiveContainer width="100%" height={isMobile?90:105}>
        <BarChart data={forecast.daily} margin={{ top:0,right:4,bottom:0,left:isMobile?-28:-22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false}/>
          <XAxis dataKey="dayLabel" tick={{ fill:'rgba(238,242,255,.35)',fontSize:9 }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fill:'rgba(238,242,255,.35)',fontSize:9 }} axisLine={false} tickLine={false} width={26}/>
          <Tooltip contentStyle={TT}/>
          <Bar dataKey="tempMin" name={`Low ${u}`}  fill="#60a5fa" opacity={.55} radius={[4,4,0,0]}/>
          <Bar dataKey="tempMax" name={`High ${u}`} fill="#f97316" opacity={.78} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DayRow({ day, unit, today, isMobile }) {
  const [h,setH]=useState(false);
  const range = Math.max(1, day.tempMax - day.tempMin);
  return (
    <div className="day-row"
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        background:today?'var(--acc-d)':h?'var(--card-h)':'transparent',
        border:`1px solid ${today?'var(--acc)':'transparent'}`,
      }}>
      <div style={{ width:isMobile?46:58,fontSize:11.5,fontWeight:today?700:500,color:today?'var(--acc)':'var(--t1)',flexShrink:0 }}>
        {today?'Today':day.dayLabel}
      </div>
      <img src={`https://openweathermap.org/img/wn/${day.iconCode}.png`} alt="" style={{ width:26,height:26,flexShrink:0 }}/>
      <div className="day-desc">{day.description}</div>
      {day.rainProb>0&&<span style={{ fontSize:10.5,color:'var(--blue)',fontWeight:600,minWidth:24,textAlign:'right',flexShrink:0 }}>{day.rainProb}%</span>}
      <div className="day-range">
        <span style={{ fontSize:10.5,color:'var(--t3)',minWidth:isMobile?18:24,textAlign:'right' }}>{day.tempMin}{unit}</span>
        <div className="prog-track" style={{ flex:1 }}>
          <div className="prog-fill" style={{ width:`${Math.max(15,range*5)}%`,background:'linear-gradient(to right,#60a5fa,#f97316)' }}/>
        </div>
        <span style={{ fontSize:10.5,fontWeight:700,color:'var(--t1)',minWidth:isMobile?18:24 }}>{day.tempMax}{unit}</span>
      </div>
    </div>
  );
}
