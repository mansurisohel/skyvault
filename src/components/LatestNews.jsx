import { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink, RefreshCw, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

const FALLBACK = [
  { title:'Extreme Heat Alerts Across Multiple Regions', description:'Meteorologists warn of sustained high temperatures exceeding 40°C urging residents to stay hydrated and limit outdoor activity during peak hours.', url:'https://www.noaa.gov', source:'NOAA', publishedAt:new Date().toISOString(), category:'Heat', color:'var(--orange)' },
  { title:'Atlantic Hurricane Season Forecast Updated', description:'The National Hurricane Center projects above-normal storm activity driven by warm sea surface temperatures and reduced wind shear this season.', url:'https://www.nhc.noaa.gov', source:'NHC', publishedAt:new Date(Date.now()-86400000).toISOString(), category:'Storms', color:'var(--purple)' },
  { title:'Air Quality Concerns Rise in Urban Centers', description:'Wildfire smoke and vehicle emissions are pushing PM2.5 into the Unhealthy range across dozens of cities. Masks recommended for sensitive groups.', url:'https://www.airnow.gov', source:'AirNow', publishedAt:new Date(Date.now()-172800000).toISOString(), category:'Air Quality', color:'var(--teal)' },
  { title:'Record Rainfall Causes Flash Flooding', description:'Torrential rains exceeding 150mm in 24 hours have triggered flash flood warnings. Emergency services urge residents to move to higher ground.', url:'https://www.weather.gov', source:'NWS', publishedAt:new Date(Date.now()-259200000).toISOString(), category:'Flooding', color:'var(--blue)' },
  { title:'UV Index Expected to Hit Extreme Levels', description:'The UV index is forecast to reach 11+ this weekend. Dermatologists urge SPF 50+ sunscreen and protective clothing for anyone outdoors after 10am.', url:'https://www.epa.gov/sunsafety', source:'EPA', publishedAt:new Date(Date.now()-345600000).toISOString(), category:'UV', color:'var(--yellow)' },
  { title:'Winter Storm Watch Issued for Northern States', description:'A powerful Arctic front is expected to bring 20–40cm of snow with near-zero visibility possible. Motorists urged to delay non-essential travel.', url:'https://www.weather.gov', source:'NWS', publishedAt:new Date(Date.now()-432000000).toISOString(), category:'Winter', color:'var(--indigo)' },
];

function timeAgo(iso) {
  const s=(Date.now()-new Date(iso).getTime())/1000;
  if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

async function fetchGNews(city) {
  const q = city ? `weather ${city}` : 'weather alert forecast';

  // 1) Serverless proxy (Vercel /api/news) — the production path. Keeps the
  //    GNews key server-side only. Silently 404s on `npm run dev` since
  //    plain Vite doesn't run serverless functions (use `vercel dev` for
  //    that), which is expected and handled below.
  try {
    const res = await fetch(`/api/news?city=${encodeURIComponent(city || '')}`);
    if (res.ok) {
      const d = await res.json();
      if (d.articles?.length) return mapArticles(d.articles);
    }
  } catch { /* fall through */ }

  // 2) Direct client-side call — local-dev convenience only. Requires
  //    VITE_GNEWS_API_KEY in .env; never relied on in production since the
  //    key would ship in the bundle.
  const key = import.meta.env.VITE_GNEWS_API_KEY;
  if (key) {
    try {
      const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=6&apikey=${key}`);
      if (res.ok) {
        const d = await res.json();
        if (d.articles?.length) return mapArticles(d.articles);
      }
    } catch { /* fall through */ }
  }

  return null;
}

function mapArticles(articles) {
  return articles.map(a => ({
    title: a.title, description: a.description, url: a.url,
    source: a.source?.name || 'News', publishedAt: a.publishedAt,
    image: a.image, category: 'News', color: 'var(--blue)',
  }));
}

export default function LatestNews() {
  const { weather } = useWeather();
  const { isMobile } = useBreakpoint();
  const [items,   setItems]   = useState(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(0);
  const [apiErr,  setApiErr]  = useState(false);
  const [listMode,setListMode]= useState(false);

  const load = useCallback(async () => {
    setLoading(true); setApiErr(false);
    try {
      const news = await fetchGNews(weather?.city);
      setItems(news?.length ? news : FALLBACK);
      if (!news) setApiErr(true);
    } catch { setItems(FALLBACK); }
    finally { setLoading(false); }
  },[weather?.city]);

  useEffect(()=>{load();},[load]);

  useEffect(()=>{
    const t=setInterval(()=>setActive(a=>(a+1)%Math.min(items.length,6)),6000);
    return()=>clearInterval(t);
  },[items.length]);

  const featured = items[active]||items[0];
  const rest = items.filter((_,i)=>i!==active).slice(0,isMobile?2:4);

  return (
    <div className="card fade-up card-pad">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,gap:10,flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,minWidth:0 }}>
          <div style={{ width:26,height:26,borderRadius:'var(--r1)',background:'rgba(96,165,250,.15)',border:'1px solid rgba(96,165,250,.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Newspaper size={13} color="var(--blue)"/>
          </div>
          <span style={{ fontSize:13,fontWeight:700,color:'var(--t1)',whiteSpace:'nowrap' }}>Latest News</span>
          {weather?.city&&<span style={{ fontSize:11,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>· {weather.city}</span>}
          {apiErr&&<span style={{ fontSize:10,color:'var(--t3)',background:'var(--card2)',padding:'2px 7px',borderRadius:99,border:'1px solid var(--b1)',flexShrink:0 }}>Curated</span>}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:7,flexShrink:0 }}>
          {/* Dots */}
          <div style={{ display:'flex',gap:4 }}>
            {items.slice(0,6).map((_,i)=>(
              <button key={i} onClick={()=>setActive(i)}
                style={{ width:i===active?16:5,height:5,borderRadius:99,border:'none',cursor:'pointer',background:i===active?'var(--acc)':'var(--b1)',transition:'all .3s var(--ease)',padding:0 }}/>
            ))}
          </div>
          <button onClick={load} disabled={loading} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',display:'flex',padding:3 }}>
            <RefreshCw size={12} style={{ animation:loading?'spin .8s linear infinite':'none' }}/>
          </button>
          <button onClick={()=>setListMode(v=>!v)}
            style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:10.5,fontWeight:600,fontFamily:'var(--fb)',padding:3,whiteSpace:'nowrap' }}>
            {listMode?'Cards':'List'}
          </button>
        </div>
      </div>

      {loading ? <Skeleton isMobile={isMobile}/> : listMode ? <ListView items={items.slice(0,8)}/> : <CardView featured={featured} rest={rest} isMobile={isMobile}/>}

      {apiErr&&(
        <p style={{ fontSize:10,color:'var(--t3)',marginTop:12,paddingTop:10,borderTop:'1px solid var(--b1)',lineHeight:1.6 }}>
          Showing curated content. On Vercel, set <code style={{ background:'var(--card2)',padding:'1px 5px',borderRadius:3 }}>GNEWS_API_KEY</code> in Project Settings → Environment Variables and redeploy. For local dev without <code style={{ background:'var(--card2)',padding:'1px 5px',borderRadius:3 }}>vercel dev</code>, add <code style={{ background:'var(--card2)',padding:'1px 5px',borderRadius:3 }}>VITE_GNEWS_API_KEY</code> to .env instead (free at gnews.io — 100 req/day).
        </p>
      )}
    </div>
  );
}

function CardView({ featured, rest, isMobile }) {
  if (!featured) return null;
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
      {/* Featured */}
      <a href={featured.url} target="_blank" rel="noopener noreferrer" className="scale-in news-featured"
        style={{ textDecoration:'none',display:'block',background:'var(--card2)',border:'1px solid var(--b2)',borderRadius:'var(--r3)',overflow:'hidden',transition:'border-color .2s,transform .2s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.transform='translateY(-2px)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b2)';e.currentTarget.style.transform='none';}}>
        {featured.image&&(
          <div className="news-img" style={{ overflow:'hidden',background:'var(--card)' }}>
            <img src={featured.image} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}
              onError={e=>e.target.parentElement.style.display='none'}/>
          </div>
        )}
        <div style={{ padding:isMobile?'12px 14px':'14px 16px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap' }}>
            <span style={{ fontSize:9.5,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:featured.color,padding:'2px 7px',background:'rgba(91,156,246,.10)',borderRadius:99 }}>{featured.category}</span>
            <span style={{ fontSize:10.5,color:'var(--t3)',display:'flex',alignItems:'center',gap:3 }}><Clock size={9}/>{timeAgo(featured.publishedAt)}</span>
            <span style={{ fontSize:10.5,color:'var(--t3)',marginLeft:'auto' }}>{featured.source}</span>
          </div>
          <h3 style={{ fontSize:isMobile?13:14,fontWeight:700,color:'var(--t1)',lineHeight:1.4,marginBottom:6 }}>{featured.title}</h3>
          {featured.description&&!isMobile&&(
            <p style={{ fontSize:12,color:'var(--t2)',lineHeight:1.62,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{featured.description}</p>
          )}
          <div style={{ display:'flex',alignItems:'center',gap:4,marginTop:10,fontSize:11,fontWeight:600,color:'var(--acc)' }}>
            Read more <ExternalLink size={10}/>
          </div>
        </div>
      </a>

      {/* Rest */}
      {rest.length>0&&(
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {rest.map((item,i)=><MiniCard key={i} item={item}/>)}
        </div>
      )}
    </div>
  );
}

function ListView({ items }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
      {items.map((item,i)=>(
        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:10,padding:'9px 11px',borderRadius:'var(--r2)',border:'1px solid var(--b1)',background:'var(--card2)',transition:'all .18s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.background='var(--card-h)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.background='var(--card2)';}}>
          {item.image&&<img src={item.image} alt="" style={{ width:50,height:38,objectFit:'cover',borderRadius:'var(--r1)',flexShrink:0 }} onError={e=>e.target.style.display='none'}/>}
          <div style={{ flex:1,minWidth:0 }}>
            <p style={{ fontSize:12,fontWeight:600,color:'var(--t1)',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{item.title}</p>
            <div style={{ display:'flex',gap:8,marginTop:3,flexWrap:'wrap' }}>
              <span style={{ fontSize:10,color:'var(--t3)' }}>{item.source}</span>
              <span style={{ fontSize:10,color:'var(--t3)' }}>{timeAgo(item.publishedAt)}</span>
            </div>
          </div>
          <ChevronRight size={13} color="var(--t3)" style={{ flexShrink:0 }}/>
        </a>
      ))}
    </div>
  );
}

function MiniCard({ item }) {
  const [h,setH]=useState(false);
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:'var(--r2)',background:h?'var(--card-h)':'var(--card2)',border:'1px solid var(--b1)',transition:'all .18s' }}>
      {item.image&&<img src={item.image} alt="" style={{ width:42,height:34,objectFit:'cover',borderRadius:'var(--r1)',flexShrink:0 }} onError={e=>e.target.style.display='none'}/>}
      <div style={{ flex:1,minWidth:0 }}>
        <p style={{ fontSize:11.5,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.title}</p>
        <div style={{ display:'flex',gap:8,marginTop:2 }}>
          <span style={{ fontSize:10,color:'var(--t3)' }}>{item.source}</span>
          <span style={{ fontSize:10,color:'var(--t3)' }}>{timeAgo(item.publishedAt)}</span>
        </div>
      </div>
      <ExternalLink size={10} color="var(--t3)" style={{ flexShrink:0 }}/>
    </a>
  );
}

function Skeleton({ isMobile }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
      <div className="skeleton" style={{ height:isMobile?120:160,borderRadius:'var(--r3)' }}/>
      {[1,2,3].map(i=>(
        <div key={i} style={{ display:'flex',gap:9,padding:'9px 11px',borderRadius:'var(--r2)',border:'1px solid var(--b1)',background:'var(--card2)' }}>
          <div className="skeleton" style={{ width:42,height:34,borderRadius:'var(--r1)',flexShrink:0 }}/>
          <div style={{ flex:1,display:'flex',flexDirection:'column',gap:6 }}>
            <div className="skeleton" style={{ height:12,width:'88%' }}/>
            <div className="skeleton" style={{ height:9,width:'45%' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}
