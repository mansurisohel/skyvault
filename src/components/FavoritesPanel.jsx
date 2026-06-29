import { useState } from 'react';
import { Star, Clock, Trash2, MapPin } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export default function FavoritesPanel() {
  const { favorites, recentSearches, searchWeather, toggleFavorite, weather } = useWeather();
  const [tab, setTab] = useState('favorites');
  const items = tab === 'favorites' ? favorites : recentSearches;
  return (
    <div className="card" style={{ padding:14 }}>
      <div style={{ display:'flex', gap:3, marginBottom:12, background:'rgba(255,255,255,.06)', padding:3, borderRadius:99 }}>
        {[['favorites', <Star size={11}/>], ['recent', <Clock size={11}/>]].map(([t, icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'6px 8px', fontSize:11, fontWeight:600, fontFamily:'var(--fb)',
            cursor:'pointer', borderRadius:99, border:'none',
            background: tab === t ? 'var(--card2)' : 'transparent',
            color: tab === t ? 'var(--t1)' : 'var(--t3)',
            transition:'all .2s var(--ease)', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          }}>
            {icon}{t}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 10px', color:'var(--t3)', fontSize:12, lineHeight:1.7 }}>
          {tab === 'favorites' ? 'No favorites yet.\nClick ★ on any city.' : 'No recent searches.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {items.map((city, i) => {
            const active = weather?.city?.toLowerCase() === city.toLowerCase();
            return <CityRow key={i} city={city} active={active}
              onSelect={() => searchWeather(city)}
              onRemove={tab === 'favorites' ? () => toggleFavorite(city) : null} />;
          })}
        </div>
      )}
    </div>
  );
}

function CityRow({ city, active, onSelect, onRemove }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 9px', borderRadius:'var(--r2)', cursor:'pointer',
        background: active ? 'var(--acc-d)' : h ? 'var(--card-h)' : 'transparent',
        border:`1px solid ${active ? 'var(--acc)' : 'transparent'}`, transition:'all .16s' }}>
      <MapPin size={11} color={active ? 'var(--acc)' : 'var(--t3)'} />
      <span onClick={onSelect} style={{ flex:1, fontSize:13, fontWeight:active?600:400, color:active?'var(--acc)':'var(--t2)' }}>{city}</span>
      {onRemove && h && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', display:'flex', padding:2 }}>
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
