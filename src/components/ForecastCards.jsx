import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CloudRain, Wind, Droplets, ChevronRight } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

const TT = {
  background: 'rgba(8,12,24,.94)', border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 8, fontSize: 12, color: '#eef2ff',
  backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,.4)',
};

const CHARTS = {
  temp:     { key: 'temp',      label: 'Temp',     color: '#5b9cf6' },
  rain:     { key: 'rainProb',  label: 'Rain %',   color: '#34d399' },
  wind:     { key: 'windSpeed', label: 'Wind',     color: '#a78bfa' },
  humidity: { key: 'humidity',  label: 'Humidity', color: '#f9a8d4' },
};

/* ── Hourly: horizontal scrolling rich cards + trend chart ── */
export function HourlyForecast() {
  const { forecast, units } = useWeather();
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('temp');
  if (!forecast?.hourly?.length) return null;

  const u  = units === 'metric' ? '°C' : '°F';
  const wu = units === 'metric' ? 'm/s' : 'mph';
  const cfg = CHARTS[tab];
  const tabLabels = { temp: 'Temp', rain: 'Rain', wind: 'Wind', humidity: 'Humid' };

  return (
    <div className="card fade-up card-pad">
      <div className="forecast-header">
        <span className="label" style={{ marginBottom: 0 }}>Hourly Forecast</span>
        <div className="pill-tabs">
          {Object.entries(CHARTS).map(([k, c]) => (
            <button key={k} className={`pill-tab${tab === k ? ' on' : ''}`}
              onClick={() => setTab(k)}
              style={tab === k ? { color: c.color } : {}}>
              {isMobile ? tabLabels[k] : (k === 'temp' ? `Temp(${u})` : k === 'wind' ? `Wind(${wu})` : k.charAt(0).toUpperCase() + k.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {/* Rich hourly cards — horizontal scroll-snap */}
      <div className="fc-row" style={{ marginBottom: 16 }}>
        {forecast.hourly.map((h, i) => (
          <div key={i} className={`fc-hour-card${i === 0 ? ' now' : ''}`}>
            <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? 'var(--acc)' : 'var(--t3)' }}>
              {i === 0 ? 'Now' : h.timeLabel}
            </div>
            <img src={`https://openweathermap.org/img/wn/${h.iconCode}.png`} alt="" style={{ width: 32, height: 32 }} />
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--fd)', color: 'var(--t1)' }}>{h.temp}°</div>
            {h.rainProb > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--blue)', fontWeight: 600 }}>
                <CloudRain size={10} />{h.rainProb}%
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--t3)' }}>
                <Wind size={10} />{h.windSpeed}{wu}
              </div>
            )}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 100 : 120}>
        <AreaChart data={forecast.hourly} margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -28 : -22 }}>
          <defs>
            <linearGradient id={`hg${tab}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cfg.color} stopOpacity={.25} />
              <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="timeLabel" tick={{ fill: 'rgba(238,242,255,.35)', fontSize: 9 }} axisLine={false} tickLine={false} interval={isMobile ? 3 : 1} />
          <YAxis tick={{ fill: 'rgba(238,242,255,.35)', fontSize: 9 }} axisLine={false} tickLine={false} width={26} />
          <Tooltip contentStyle={TT} labelStyle={{ color: 'rgba(238,242,255,.6)', marginBottom: 3 }} />
          <Area type="monotone" dataKey={cfg.key} name={cfg.label} stroke={cfg.color} strokeWidth={2}
            fill={`url(#hg${tab})`} dot={false} activeDot={{ r: 4, fill: cfg.color }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Daily: horizontal scroll-snap cards + expandable detail panel ── */
export function DailyForecast() {
  const { forecast, units } = useWeather();
  const { isMobile } = useBreakpoint();
  const [selected, setSelected] = useState(0);
  if (!forecast?.daily?.length) return null;
  const u = units === 'metric' ? '°C' : '°F';

  const globalMin = Math.min(...forecast.daily.map(d => d.tempMin));
  const globalMax = Math.max(...forecast.daily.map(d => d.tempMax));
  const globalRange = Math.max(1, globalMax - globalMin);
  const day = forecast.daily[selected] || forecast.daily[0];

  return (
    <div className="card fade-up d2 card-pad">
      <span className="label">7-Day Forecast</span>

      <div className="fc-row" style={{ marginBottom: 14 }}>
        {forecast.daily.map((d, i) => {
          const leftPct  = ((d.tempMin - globalMin) / globalRange) * 100;
          const widthPct = ((d.tempMax - d.tempMin) / globalRange) * 100;
          const isToday  = i === 0;
          const isSel    = i === selected;
          return (
            <div
              key={i}
              className={`fc-day-card${isToday ? ' today' : ''}${isSel && !isToday ? ' selected' : ''}`}
              onClick={() => setSelected(i)}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: isToday ? 'var(--acc)' : 'var(--t1)' }}>
                {isToday ? 'Today' : d.dayLabel}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--t3)' }}>{d.dateLabel}</div>
              <img src={`https://openweathermap.org/img/wn/${d.iconCode}.png`} alt="" style={{ width: 36, height: 36 }} />
              <div style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'capitalize', textAlign: 'center', minHeight: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {d.description}
              </div>
              {d.rainProb > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--blue)', fontWeight: 600 }}>
                  <Droplets size={9} />{d.rainProb}%
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{d.tempMin}°</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--fd)', color: 'var(--t1)' }}>{d.tempMax}°</span>
              </div>
              <div className="fc-range-track">
                <div className="fc-range-fill" style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 6)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel for selected day */}
      {day && (
        <div className="fc-detail-panel">
          <DetailStat label="High / Low" value={`${day.tempMax}° / ${day.tempMin}°`} />
          <DetailStat label="Rain Chance" value={`${day.rainProb}%`} />
          <DetailStat label="Humidity" value={`${day.humidity}%`} />
          <DetailStat label="Wind" value={`${day.windSpeed} ${units === 'metric' ? 'm/s' : 'mph'}`} />
        </div>
      )}

      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 10.5, color: 'var(--t3)' }}>
          <ChevronRight size={11} /> Tap a day above for its detailed breakdown
        </div>
      )}
    </div>
  );
}

function DetailStat({ label, value }) {
  return (
    <div style={{ background: 'var(--card2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 12px' }}>
      <div className="label-sm" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--fd)', color: 'var(--t1)' }}>{value}</div>
    </div>
  );
}
