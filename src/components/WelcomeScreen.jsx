import { MapPin, CloudRain, Wind, Sun, Zap, Snowflake, Cloud, Thermometer } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

const QUICK=[
  {name:'London',    Icon:CloudRain},{name:'New York',  Icon:Wind},
  {name:'Tokyo',     Icon:Sun},     {name:'Sydney',    Icon:Sun},
  {name:'Paris',     Icon:Cloud},   {name:'Dubai',     Icon:Thermometer},
  {name:'Mumbai',    Icon:CloudRain},{name:'Toronto',   Icon:Snowflake},
  {name:'Singapore', Icon:Zap},     {name:'Cape Town', Icon:Sun},
];

export default function WelcomeScreen(){
  const {searchWeather,detectLocation,loading,favorites,recentSearches}=useWeather();
  return(
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',minHeight:'62vh',padding:'clamp(28px,6vw,64px) clamp(12px,4vw,24px)',textAlign:'center' }}>
      {/* Icon */}
      <div style={{ width:76,height:76,borderRadius:'50%',marginBottom:22,
        background:'linear-gradient(135deg,rgba(59,130,246,.16),rgba(139,92,246,.16))',
        border:'1px solid var(--b1)',display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 0 52px rgba(91,156,246,.20)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      </div>

      <h1 style={{ fontFamily:'var(--fd)',fontSize:'clamp(22px,5vw,38px)',fontWeight:800,letterSpacing:'-1.2px',color:'var(--t1)',marginBottom:10,lineHeight:1.1,maxWidth:500 }}>
        Your premium weather platform
      </h1>
      <p style={{ fontSize:'clamp(12px,2vw,14px)',color:'var(--t3)',marginBottom:32,maxWidth:380,lineHeight:1.7,padding:'0 8px' }}>
        Real-time conditions, AI-powered insights, live news and beautiful forecasts for any location worldwide.
      </p>

      <button onClick={detectLocation} disabled={loading}
        style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 26px',background:'var(--acc)',color:'#fff',border:'none',fontSize:13.5,fontWeight:700,cursor:loading?'default':'pointer',fontFamily:'var(--fb)',borderRadius:'var(--r99)',opacity:loading?.7:1,transition:'opacity .2s,transform .2s',boxShadow:'0 8px 28px rgba(91,156,246,.38)',marginBottom:36 }}
        onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform='translateY(-2px)';}}
        onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>
        <MapPin size={15}/>{loading?'Detecting…':'Use My Location'}
      </button>

      {(favorites.length>0||recentSearches.length>0)&&(
        <div style={{ marginBottom:28,width:'100%',maxWidth:500 }}>
          {favorites.length>0&&<CityGroup label="Favorites" cities={favorites} onSelect={searchWeather} accent/>}
          {recentSearches.length>0&&<CityGroup label="Recent" cities={recentSearches.slice(0,6)} onSelect={searchWeather}/>}
        </div>
      )}

      <span className="label" style={{ display:'block',marginBottom:12 }}>Popular Cities</span>
      <div style={{ display:'flex',flexWrap:'wrap',gap:7,justifyContent:'center',maxWidth:560,padding:'0 4px' }}>
        {QUICK.map(({name,Icon})=>(
          <button key={name} onClick={()=>searchWeather(name)}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',background:'var(--card)',border:'1px solid var(--b1)',color:'var(--t2)',borderRadius:99,fontSize:12.5,fontWeight:500,cursor:'pointer',fontFamily:'var(--fb)',transition:'all .2s var(--ease)' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.color='var(--acc)';e.currentTarget.style.background='var(--acc-d)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.color='var(--t2)';e.currentTarget.style.background='var(--card)';}}>
            <Icon size={11}/>{name}
          </button>
        ))}
      </div>
    </div>
  );
}

function CityGroup({label,cities,onSelect,accent}){
  return(
    <div style={{ marginBottom:14,textAlign:'left' }}>
      <span className="label" style={{ display:'block',marginBottom:7 }}>{label}</span>
      <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
        {cities.map(c=>(
          <button key={c} onClick={()=>onSelect(c)}
            style={{ padding:'5px 12px',borderRadius:99,cursor:'pointer',fontFamily:'var(--fb)',background:accent?'var(--acc-d)':'var(--card)',border:`1px solid ${accent?'var(--acc)':'var(--b1)'}`,color:accent?'var(--acc)':'var(--t2)',fontSize:12,fontWeight:500 }}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
