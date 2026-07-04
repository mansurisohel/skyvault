import { MapPin, CloudRain, Wind, Sun, Zap, Snowflake, Cloud, Thermometer } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import logoLockup from '../assets/logo-lockup.webp';

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
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',minHeight:'62vh',padding:'clamp(28px,6vw,64px) clamp(12px,4vw,24px)',textAlign:'center',position:'relative',overflow:'hidden' }}>
      {/* Ambient glow blobs behind the hero */}
      <div className="hero-glow-blob" style={{ width:260,height:260,top:-40,left:'12%',background:'radial-gradient(circle,rgba(96,165,250,.22) 0%,transparent 70%)',animationDuration:'7s' }}/>
      <div className="hero-glow-blob" style={{ width:220,height:220,top:10,right:'10%',background:'radial-gradient(circle,rgba(125,211,252,.16) 0%,transparent 70%)',animationDuration:'8.5s',animationDelay:'-3s' }}/>

      {/* Logo mark, with a light sweep and a few twinkling sparkles */}
      <div className="scale-in" style={{ marginBottom:28, position:'relative' }}>
        <div className="logo-shine-wrap">
          <img src={logoLockup} alt="SkyVault — Weather Data" style={{ height:'clamp(52px,9vw,84px)', width:'auto', maxWidth:'92vw', display:'block', filter:'drop-shadow(0 14px 46px rgba(91,156,246,.28))' }} />
        </div>
        <Sparkle style={{ top:-10, left:-16, animationDuration:'2.6s' }} size={12}/>
        <Sparkle style={{ bottom:-8, right:-14, animationDuration:'3.1s', animationDelay:'-1.1s' }} size={9}/>
        <Sparkle style={{ top:'40%', right:-24, animationDuration:'2.9s', animationDelay:'-.5s' }} size={7}/>
      </div>

      <h1 className="fade-up" style={{ fontFamily:'var(--fd)',fontSize:'clamp(20px,4.4vw,32px)',fontWeight:700,letterSpacing:'-0.02em',color:'var(--t1)',marginBottom:10,lineHeight:1.15,maxWidth:520,textShadow:'0 2px 20px rgba(0,0,0,.45)' }}>
        Cinematic, real-time weather for any place on Earth
      </h1>
      <p className="fade-up d1" style={{ fontSize:'clamp(12px,2vw,14px)',color:'var(--t2)',marginBottom:32,maxWidth:400,lineHeight:1.7,padding:'0 8px',textShadow:'0 1px 12px rgba(0,0,0,.4)' }}>
        Live conditions, AI-powered insights, radar and beautifully accurate forecasts — presented with a sky that actually looks like your sky.
      </p>

      <button onClick={detectLocation} disabled={loading} className="cta-shine"
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

      <span className="label" style={{ display:'block',marginBottom:12,textShadow:'0 1px 10px rgba(0,0,0,.4)' }}>Popular Cities</span>
      <div style={{ display:'flex',flexWrap:'wrap',gap:7,justifyContent:'center',maxWidth:560,padding:'0 4px' }}>
        {QUICK.map(({name,Icon})=>(
          <button key={name} onClick={()=>searchWeather(name)}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',background:'var(--card)',border:'1px solid var(--b1)',color:'var(--t2)',borderRadius:99,fontSize:12.5,fontWeight:500,cursor:'pointer',fontFamily:'var(--fb)',transition:'all .2s var(--ease)' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.color='var(--acc)';e.currentTarget.style.background='var(--acc-d)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.color='var(--t2)';e.currentTarget.style.background='var(--card)';e.currentTarget.style.transform='none';}}>
            <Icon size={11}/>{name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Sparkle({ style, size = 10 }) {
  return (
    <span className="sparkle" style={{ ...style }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" fill="#bae6fd"/>
      </svg>
    </span>
  );
}

function CityGroup({label,cities,onSelect,accent}){
  return(
    <div style={{ marginBottom:14,textAlign:'left' }}>
      <span className="label" style={{ display:'block',marginBottom:7,textShadow:'0 1px 10px rgba(0,0,0,.4)' }}>{label}</span>
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
