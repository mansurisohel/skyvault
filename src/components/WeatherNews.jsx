import { useState, useEffect } from 'react';
import { ExternalLink, Newspaper, Sun, Wind, CloudLightning, Snowflake, Thermometer, Info } from 'lucide-react';

const ITEMS = [
  { id:1, icon:<Sun size={18}/>,           title:'Understanding UV Index: What Numbers Mean',      summary:'UV above 6 requires SPF 30+ and shade during peak hours 10am–4pm. Higher altitudes and reflective surfaces intensify exposure significantly.',       category:'Health',      col:'var(--orange)', url:'https://www.who.int/news-room/q-a-detail/radiation-the-known-health-effects-of-ultraviolet-radiation' },
  { id:2, icon:<Wind size={18}/>,          title:'Air Quality & PM2.5: What You Need to Know',    summary:'Fine particles under 2.5 microns penetrate deep into lungs. On days with AQI above Moderate, outdoor exercise meaningfully increases health risk.',  category:'Air Quality', col:'var(--purple)', url:'https://www.epa.gov/pm-pollution' },
  { id:3, icon:<Info size={18}/>,          title:'How Humidity Affects Perceived Temperature',     summary:'At 35°C and 80% humidity, apparent temperature can exceed 45°C. Sweating becomes ineffective at cooling the body in high-humidity conditions.',       category:'Climate',     col:'var(--blue)',   url:'https://www.noaa.gov/education/resource-collections/weather-atmosphere/heat' },
  { id:4, icon:<CloudLightning size={18}/>,title:'Thunderstorm Safety: Before, During & After',   summary:"When thunder roars, go indoors. Avoid tall trees and open fields. Wait 30 minutes after the last thunder before heading outdoors again.",             category:'Safety',      col:'var(--yellow)', url:'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/thunderstorm.html' },
  { id:5, icon:<Thermometer size={18}/>,   title:'Cold Weather & Cardiovascular Health',           summary:'Cold air constricts arteries and raises blood pressure. Dress in thermal layers and limit strenuous outdoor activity on sub-zero days.',               category:'Health',      col:'var(--teal)',   url:'https://www.heart.org' },
  { id:6, icon:<Snowflake size={18}/>,     title:'Wind Chill vs Heat Index Explained',             summary:'Wind chill measures cold sensation on exposed skin. Heat index is perceived temperature when humidity is high. Both can differ widely from actual temp.', category:'Education',  col:'var(--indigo)', url:'https://www.weather.gov/safety/heat-index' },
];

export default function WeatherNews() {
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(()=>setActive(a=>(a+1)%ITEMS.length), 5500); return ()=>clearInterval(t); }, []);
  const item = ITEMS[active];

  return (
    <div className="card fade-up" style={{ padding:'20px 22px',overflow:'hidden' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <Newspaper size={14} color="var(--accent)"/>
          <span className="label">Weather Insights</span>
        </div>
        <div style={{ display:'flex',gap:5 }}>
          {ITEMS.map((_,i)=>(
            <button key={i} onClick={()=>setActive(i)} style={{ width:i===active?18:6,height:6,borderRadius:99,border:'none',cursor:'pointer',background:i===active?'var(--accent)':'var(--border)',transition:'all .3s var(--ease)',padding:0,flexShrink:0 }}/>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div key={active} className="scale-in" style={{ background:'var(--card2)',border:'1px solid var(--border2)',borderRadius:'var(--r2)',padding:'16px 18px',marginBottom:14,borderLeft:`3px solid ${item.col}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:10 }}>
          <span style={{ color:item.col }}>{item.icon}</span>
          <span style={{ fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:item.col,padding:'2px 8px',background:'rgba(91,156,246,.08)',borderRadius:99,border:`1px solid rgba(91,156,246,.18)` }}>{item.category}</span>
        </div>
        <h4 style={{ fontSize:13.5,fontWeight:700,color:'var(--t1)',marginBottom:8,lineHeight:1.45 }}>{item.title}</h4>
        <p style={{ fontSize:12,color:'var(--t2)',lineHeight:1.65 }}>{item.summary}</p>
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex',alignItems:'center',gap:5,marginTop:12,fontSize:11,fontWeight:600,color:'var(--accent)',textDecoration:'none' }}>
          Read more <ExternalLink size={11}/>
        </a>
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
        {ITEMS.filter((_,i)=>i!==active).slice(0,3).map(it=>(
          <MiniCard key={it.id} {...it} onClick={()=>setActive(ITEMS.indexOf(it))}/>
        ))}
      </div>
    </div>
  );
}

function MiniCard({ title, category, col, icon, onClick }) {
  const [h,setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:'var(--r1)',cursor:'pointer',background:h?'var(--card-h)':'transparent',transition:'background .18s' }}>
      <span style={{ color:col,flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1,minWidth:0 }}>
        <p style={{ fontSize:12,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{title}</p>
        <p style={{ fontSize:10,color:'var(--t3)' }}>{category}</p>
      </div>
      <div style={{ width:3,height:24,background:col,borderRadius:99,flexShrink:0,opacity:.65 }}/>
    </div>
  );
}
