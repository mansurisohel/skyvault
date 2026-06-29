import { useState } from 'react';
import { Sun, Moon, Thermometer } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import SearchBar from './SearchBar';

export default function Header() {
  const { theme, toggleTheme, units, toggleUnits, loading } = useWeather();
  return (
    <header style={{ position:'sticky', top:0, zIndex:50, backdropFilter:'blur(32px) saturate(1.8)', WebkitBackdropFilter:'blur(32px) saturate(1.8)', background:'var(--glass)', borderBottom:'1px solid var(--b1)' }}>
      <div className="hdr-wrap">
        <div className="hdr-logo" style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
          <div style={{ width:33, height:33, borderRadius:10, background:'linear-gradient(135deg,#3b82f6,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(91,156,246,.4)', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          </div>
          <span style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:17, letterSpacing:'-.5px', color:'var(--t1)', whiteSpace:'nowrap' }}>Skyvault</span>
        </div>

        <div className="hdr-search">
          <SearchBar />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
          {loading && <div style={{ width:16, height:16, border:'2px solid var(--b1)', borderTopColor:'var(--acc)', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />}
          <Btn onClick={toggleUnits} title="Toggle units">
            <Thermometer size={13} />
            <span style={{ fontSize:11, fontWeight:700 }}>{units === 'metric' ? '°C' : '°F'}</span>
          </Btn>
          <Btn onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
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
