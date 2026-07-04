import { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import SearchBar from './SearchBar';
import logoIcon from '../assets/logo-icon.webp';

export default function Header() {
  const { units, toggleUnits, loading, weather } = useWeather();
  return (
    <header style={{ position:'sticky', top:0, zIndex:50, backdropFilter:'blur(32px) saturate(1.8)', WebkitBackdropFilter:'blur(32px) saturate(1.8)', background:'var(--glass)', borderBottom:'1px solid var(--b1)' }}>
      <div className="hdr-wrap">
        <div className="hdr-logo" style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div className="hdr-logo-badge">
            <img src={logoIcon} alt="SkyVault" />
          </div>
          <span className="hdr-wordmark"><span className="sky">Sky</span><span className="vault">Vault</span></span>
        </div>

        {/* Search only appears once a location is loaded — the landing page
            leads with "Use My Location" / quick-city chips instead. */}
        {weather && (
          <div className="hdr-search fade-in">
            <SearchBar />
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0, marginLeft: weather ? 0 : 'auto' }}>
          {loading && <div style={{ width:16, height:16, border:'2px solid var(--b1)', borderTopColor:'var(--acc)', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />}
          <Btn onClick={toggleUnits} title="Toggle units">
            <Thermometer size={13} />
            <span style={{ fontSize:11, fontWeight:700 }}>{units === 'metric' ? '°C' : '°F'}</span>
          </Btn>
        </div>
      </div>
    </header>
  );
}

function Btn({ children, onClick, title }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', background: h ? 'var(--card2)' : 'var(--card)', border:'1px solid var(--b1)', borderRadius:'var(--r1)', cursor:'pointer', color:'var(--t2)', fontFamily:'var(--fb)', transition:'all .2s var(--ease)', whiteSpace:'nowrap' }}>
      {children}
    </button>
  );
}
