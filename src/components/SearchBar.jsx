import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, Clock, Star, Loader } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { searchCities } from '../services/weatherService';

export default function SearchBar() {
  const { searchWeather, detectLocation, loading, recentSearches, favorites } = useWeather();
  const [query,setQuery]=useState('');
  const [suggs,setSuggs]=useState([]);
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const inputRef=useRef(null);
  const wrapRef=useRef(null);
  const timerRef=useRef(null);

  useEffect(()=>{
    if (query.length<2){setSuggs([]);return;}
    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(async()=>{
      setBusy(true);
      try{setSuggs((await searchCities(query)).slice(0,5));}
      catch{setSuggs([]);}
      finally{setBusy(false);}
    },320);
    return()=>clearTimeout(timerRef.current);
  },[query]);

  useEffect(()=>{
    const fn=e=>{if(!wrapRef.current?.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',fn);
    return()=>document.removeEventListener('mousedown',fn);
  },[]);

  const go=city=>{searchWeather(city);setQuery('');setSuggs([]);setOpen(false);inputRef.current?.blur();};
  const submit=e=>{e.preventDefault();if(query.trim())go(query.trim());};

  const hasItems=open&&(busy||suggs.length>0||(query.length<2&&(recentSearches.length>0||favorites.length>0)));

  return (
    <div ref={wrapRef} style={{ position:'relative',width:'100%',maxWidth:540 }}>
      <form onSubmit={submit}>
        <div className="search-box">
          {busy
            ?<Loader size={14} color="var(--acc)" style={{ flexShrink:0,animation:'spin .7s linear infinite' }}/>
            :<Search size={14} color="var(--t3)" style={{ flexShrink:0 }}/>
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e=>{setQuery(e.target.value);setOpen(true);}}
            onFocus={()=>setOpen(true)}
            placeholder="Search city or region…"
            disabled={loading}
          />
          {query&&(
            <button type="button" onClick={()=>{setQuery('');setSuggs([]);}}
              style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',display:'flex',padding:2,flexShrink:0 }}>
              <X size={12}/>
            </button>
          )}
          <div style={{ width:1,height:14,background:'var(--b1)',flexShrink:0 }}/>
          <button type="button" onClick={()=>{detectLocation();setOpen(false);}} title="Use my location"
            style={{ background:'none',border:'none',cursor:'pointer',color:'var(--acc)',display:'flex',padding:2,flexShrink:0 }}>
            <MapPin size={14}/>
          </button>
        </div>
      </form>

      {hasItems&&(
        <div className="search-drop">
          {busy&&(
            <div style={{ padding:'10px 14px',fontSize:12,color:'var(--t3)',display:'flex',alignItems:'center',gap:8 }}>
              <Loader size={11} style={{ animation:'spin .7s linear infinite' }}/> Searching…
            </div>
          )}
          {!busy&&suggs.length>0&&(
            <Group label="Cities">
              {suggs.map((s,i)=>(
                <Row key={i} icon={<MapPin size={11}/>}
                  primary={s.name}
                  secondary={[s.state,s.country].filter(Boolean).join(', ')}
                  onClick={()=>go(`${s.name},${s.country}`)}/>
              ))}
            </Group>
          )}
          {!busy&&query.length<2&&favorites.length>0&&(
            <Group label="Favorites">
              {favorites.map((f,i)=><Row key={i} icon={<Star size={11} color="var(--yellow)"/>} primary={f} onClick={()=>go(f)}/>)}
            </Group>
          )}
          {!busy&&query.length<2&&recentSearches.length>0&&(
            <Group label="Recent">
              {recentSearches.slice(0,6).map((r,i)=><Row key={i} icon={<Clock size={11}/>} primary={r} onClick={()=>go(r)}/>)}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <div style={{ padding:'7px 13px 3px',fontSize:9.5,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--t3)' }}>{label}</div>
      {children}
    </div>
  );
}

function Row({ icon, primary, secondary, onClick }) {
  const [h,setH]=useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'flex',alignItems:'center',gap:9,padding:'8px 13px',cursor:'pointer',background:h?'var(--card-h)':'transparent',transition:'background .14s' }}>
      <span style={{ color:'var(--t3)',flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:13,color:'var(--t1)',fontWeight:500,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{primary}</span>
      {secondary&&<span style={{ fontSize:10.5,color:'var(--t3)',flexShrink:0,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{secondary}</span>}
    </div>
  );
}
