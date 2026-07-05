import { useState, useRef, useEffect, useCallback } from 'react';
import { Map, Layers, Play, Pause, Radio, Maximize2, Minimize2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

/* ── Layer definitions — richer legends with real value ranges ── */
const LAYERS = [
  { key: 'precipitation_new', label: 'Precipitation', short: 'Rain',   color: '#60a5fa',
    unit: 'mm/h',
    legend: [
      { label:'No rain',  val:'0',     color:'#1e3a5f' },
      { label:'Light',    val:'< 2',   color:'#2563eb' },
      { label:'Moderate', val:'2–10',  color:'#16a34a' },
      { label:'Heavy',    val:'10–50', color:'#eab308' },
      { label:'Extreme',  val:'> 50',  color:'#dc2626' },
    ]},
  { key: 'clouds_new',        label: 'Cloud Cover',   short: 'Clouds', color: '#94a3b8',
    unit: '%',
    legend: [
      { label:'Clear',     val:'0–10',   color:'#1e2a3a' },
      { label:'Few',       val:'10–25',  color:'#4a5568' },
      { label:'Scattered', val:'25–50',  color:'#718096' },
      { label:'Broken',    val:'50–85',  color:'#a0aec0' },
      { label:'Overcast',  val:'85–100', color:'#cbd5e0' },
    ]},
  { key: 'wind_new',          label: 'Wind Speed',    short: 'Wind',   color: '#2dd4bf',
    unit: 'm/s',
    legend: [
      { label:'Calm',     val:'0–1',  color:'#1a3a3a' },
      { label:'Light',    val:'1–5',  color:'#14b8a6' },
      { label:'Moderate', val:'5–10', color:'#0891b2' },
      { label:'Strong',   val:'10–20',color:'#0ea5e9' },
      { label:'Storm',    val:'> 20', color:'#7c3aed' },
    ]},
  { key: 'temp_new',          label: 'Temperature',   short: 'Temp',   color: '#fb923c',
    unit: '°C',
    legend: [
      { label:'Cold', val:'< 0',   color:'#3b82f6' },
      { label:'Cool', val:'0–15',  color:'#22d3ee' },
      { label:'Mild', val:'15–25', color:'#4ade80' },
      { label:'Warm', val:'25–35', color:'#fbbf24' },
      { label:'Hot',  val:'> 35',  color:'#ef4444' },
    ]},
  { key: 'pressure_new',      label: 'Pressure',      short: 'Press.', color: '#c084fc',
    unit: 'hPa',
    legend: [
      { label:'Low',    val:'< 1000',     color:'#7c3aed' },
      { label:'Normal', val:'1000–1020',  color:'#9333ea' },
      { label:'High',   val:'> 1020',     color:'#c084fc' },
    ]},
];

/* ── Fallback radar timestamps, used only if the live RainViewer frame
   list can't be fetched (network hiccup, etc.) — guesses 20-min intervals
   over the past 2 hours, which is usually close but not guaranteed to
   match real published frames exactly. ── */
function getFallbackRadarFrames() {
  const now  = Math.floor(Date.now() / 1000);
  const step = 10 * 60; // RainViewer publishes frames every 10 minutes
  return Array.from({ length: 6 }, (_, i) => {
    const ts = now - (5 - i) * step;
    return { time: ts, url: `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png` };
  });
}

function buildDoc(lat, lon, apiKey, radarFrameUrls) {
  const base = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const radarFrames = radarFrameUrls;

  return `<!DOCTYPE html>
<html style="height:100%;margin:0">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{height:100%;width:100%;background:#07101e;font-family:Inter,system-ui,sans-serif}
.leaflet-control-zoom{border:none!important;box-shadow:0 2px 20px rgba(0,0,0,.32)!important;margin:10px!important}
.leaflet-control-zoom a{
  background:rgba(10,18,36,.92)!important;border:1px solid rgba(255,255,255,.16)!important;
  color:#e0eaff!important;backdrop-filter:blur(20px);
  font-weight:700;width:34px!important;height:34px!important;line-height:34px!important;font-size:17px!important
}
.leaflet-control-zoom a:hover{opacity:.8}
.leaflet-control-attribution{
  background:rgba(10,18,36,.92)!important;color:#e0eaff!important;
  font-size:9px!important;backdrop-filter:blur(10px);
  border-radius:6px 0 0 0!important;padding:2px 7px!important
}
.leaflet-control-attribution a{color:#e0eaff!important}
.wx-pop .leaflet-popup-content-wrapper{
  background:rgba(7,12,24,.97);border:1px solid rgba(255,255,255,.14);border-radius:10px;
  color:#eef2ff;backdrop-filter:blur(24px);box-shadow:0 8px 36px rgba(0,0,0,.36)
}
.wx-pop .leaflet-popup-tip{background:rgba(7,12,24,.97)}
.wx-pop .leaflet-popup-content{margin:9px 14px;font-size:12px;font-weight:600;line-height:1.55}
.map-pin{filter:drop-shadow(0 4px 10px rgba(0,0,0,.5));animation:pinDrop .55s cubic-bezier(.34,1.56,.64,1) both;transform-origin:50% 100%}
@keyframes pinDrop{0%{transform:translateY(-26px) scale(.4);opacity:0}60%{opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
.map-pin:hover{cursor:pointer}
/* Leaflet's bundled CSS puts a white box + gray border behind every divIcon
   by default — without this reset the pin renders inside that box instead
   of as a clean, standalone marker. */
.leaflet-div-icon{background:transparent!important;border:none!important}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function(){
  var API    = ${JSON.stringify(apiKey)};
  var RADAR  = ${JSON.stringify(radarFrames)};
  var LAT    = ${lat};
  var LON    = ${lon};

  var map = L.map('map', {
    center: [LAT, LON], zoom: 7, zoomControl: true,
    preferCanvas: true, attributionControl: true,
  });

  var baseLayer = L.tileLayer(${JSON.stringify(base)}, {
    subdomains: 'abcd', maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; OpenStreetMap',
  }).addTo(map);

  /* ── OWM overlay layer ── */
  var wxLayer = null;
  function setWxLayer(key) {
    if (wxLayer) { map.removeLayer(wxLayer); wxLayer = null; }
    if (API && key) {
      wxLayer = L.tileLayer(
        'https://tile.openweathermap.org/map/' + key + '/{z}/{x}/{y}.png?appid=' + API,
        { opacity: 0.62, maxZoom: 18, zIndex: 200 }
      ).addTo(map);
    }
  }

  /* ── Radar frames (RainViewer free API — no auth needed) ── */
  var radarLayers = [];
  RADAR.forEach(function(url) {
    radarLayers.push(L.tileLayer(url, { opacity: 0.72, maxZoom: 18, maxNativeZoom: 7, zIndex: 300 }));
  });

  function showRadarFrame(idx) {
    radarLayers.forEach(function(l) { if (map.hasLayer(l)) map.removeLayer(l); });
    if (idx >= 0 && idx < radarLayers.length) {
      radarLayers[idx].addTo(map);
    }
  }

  /* ── Location pin (a proper map pin, anchored at its tip) ── */
  var PinIcon = L.divIcon({
    className: 'map-pin',
    html: '<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.6 26.4 0 17 0z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>'
      + '<circle cx="17" cy="17" r="7.5" fill="#ffffff"/>'
      + '</svg>',
    iconSize: [34, 46], iconAnchor: [17, 46], popupAnchor: [0, -42],
  });
  var marker = L.marker([LAT, LON], { icon: PinIcon }).addTo(map);
  marker.bindPopup('<b>Current Location</b><br>' + LAT.toFixed(3) + ', ' + LON.toFixed(3), { className: 'wx-pop' });

  /* ── Message listener ── */
  window.addEventListener('message', function(e) {
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    switch (d.type) {
      case 'SET_LAYER':
        showRadarFrame(-1);
        setWxLayer(d.key);
        break;
      case 'SET_RADAR':
        if (wxLayer) { map.removeLayer(wxLayer); wxLayer = null; }
        showRadarFrame(d.idx);
        break;
      case 'FLY_TO':
        map.flyTo([d.lat, d.lon], 7, { duration: 1.4, easeLinearity: 0.38 });
        marker.setLatLng([d.lat, d.lon]);
        break;
      case 'RESIZE':
        setTimeout(function(){ map.invalidateSize(); }, 60);
        break;
    }
  });
})();
</script>
</body>
</html>`;
}

export default function WeatherMap() {
  const { weather } = useWeather();
  const { isMobile } = useBreakpoint();

  const [mode,        setMode]        = useState('layer');      // 'layer' | 'radar'
  const [activeLayer, setActiveLayer] = useState('precipitation_new');
  const [radarIdx,    setRadarIdx]    = useState(5);             // current frame (5 = latest)
  const [playing,     setPlaying]     = useState(false);
  const [docUrl,      setDocUrl]      = useState(null);
  const [ready,       setReady]       = useState(false);
  const [fullscreen,  setFullscreen]  = useState(false);

  const iframeRef  = useRef(null);
  const playTimer  = useRef(null);
  const [radarFrames, setRadarFrames] = useState(() => getFallbackRadarFrames());
  const apiKey     = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

  // Fetch the real, currently-available radar frame list once on mount.
  // Guessed timestamps usually land close to RainViewer's actual published
  // frames but aren't guaranteed to match exactly, which would silently
  // 404 individual frames — this is the officially documented approach.
  useEffect(() => {
    let cancelled = false;
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`)))
      .then(data => {
        if (cancelled) return;
        const past = data?.radar?.past;
        if (Array.isArray(past) && past.length) {
          const host = data.host || 'https://tilecache.rainviewer.com';
          const last6 = past.slice(-6);
          setRadarFrames(last6.map(f => ({
            time: f.time,
            url: `${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,
          })));
        }
      })
      .catch(() => { /* keep the fallback frames already in state */ });
    return () => { cancelled = true; };
  }, []);

  /* Build/rebuild the iframe HTML when location, key, or the radar frame
     list changes (the frame list starts as a guess, then updates once the
     real RainViewer list loads) */
  useEffect(() => {
    if (!weather) return;
    const html = buildDoc(weather.lat, weather.lon, apiKey, radarFrames.map(f => f.url));
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    setDocUrl(url);
    setReady(false);
    return () => URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.lat, weather?.lon, apiKey, radarFrames]);

  const send = useCallback((msg) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  /* When the iframe loads, push the current layer or radar frame */
  const onLoad = useCallback(() => {
    setReady(true);
    if (mode === 'radar') {
      send({ type: 'SET_RADAR', idx: radarIdx });
    } else {
      send({ type: 'SET_LAYER', key: activeLayer });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Tell the iframe to re-measure whenever fullscreen flips */
  useEffect(() => { send({ type: 'RESIZE' }); }, [fullscreen, send]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = e => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [fullscreen]);

  /* Fly to new city without reloading the iframe */
  const prevCoords = useRef(null);
  useEffect(() => {
    if (!ready || !weather) return;
    const prev = prevCoords.current;
    if (prev && (prev.lat !== weather.lat || prev.lon !== weather.lon)) {
      send({ type: 'FLY_TO', lat: weather.lat, lon: weather.lon });
    }
    prevCoords.current = { lat: weather.lat, lon: weather.lon };
  }, [weather, ready, send]);

  /* Layer switching */
  const switchLayer = useCallback((key) => {
    setActiveLayer(key);
    setMode('layer');
    send({ type: 'SET_LAYER', key });
  }, [send]);

  /* Radar frame seeking */
  const seekRadar = useCallback((idx) => {
    setRadarIdx(idx);
    send({ type: 'SET_RADAR', idx });
  }, [send]);

  /* Radar playback loop */
  useEffect(() => {
    if (playing && mode === 'radar') {
      playTimer.current = setInterval(() => {
        setRadarIdx(prev => {
          const next = (prev + 1) % radarFrames.length;
          send({ type: 'SET_RADAR', idx: next });
          return next;
        });
      }, 650);
    } else {
      clearInterval(playTimer.current);
    }
    return () => clearInterval(playTimer.current);
  }, [playing, mode, send, radarFrames]);

  /* Activate radar mode */
  const activateRadar = useCallback(() => {
    setMode('radar');
    seekRadar(5);
  }, [seekRadar]);

  if (!weather) return null;

  const layerCfg    = LAYERS.find(l => l.key === activeLayer) || LAYERS[0];
  const totalFrames = radarFrames.length;

  const formatTime = (ts) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`card fade-up ${fullscreen ? 'map-fullscreen' : ''}`} style={{ overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', borderBottom: '1px solid var(--b1)',
        flexWrap: 'wrap', rowGap: 8,
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Map size={13} color="var(--acc)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Live Map</span>
          {mode === 'radar' && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
              fontWeight: 700, color: '#f87171', letterSpacing: '.05em',
              background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.3)',
              borderRadius: 99, padding: '1px 7px',
            }}>
              <Radio size={8} />RADAR
            </span>
          )}
        </div>

        {/* Layer buttons */}
        {!isMobile && (
          <div className="map-layer-tabs" style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
            {LAYERS.map(l => (
              <button key={l.key} onClick={() => switchLayer(l.key)} style={{
                padding: '3px 10px', fontSize: 10.5, fontWeight: 600,
                borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--fb)',
                border: `1px solid ${mode === 'layer' && activeLayer === l.key ? l.color : 'var(--b1)'}`,
                background: mode === 'layer' && activeLayer === l.key ? `${l.color}1e` : 'transparent',
                color: mode === 'layer' && activeLayer === l.key ? l.color : 'var(--t3)',
                transition: 'all .2s var(--ease)', whiteSpace: 'nowrap',
              }}>{l.label}</button>
            ))}
          </div>
        )}

        {/* Radar toggle */}
        <button className="map-toolbar-btn" onClick={activateRadar} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 11px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
          borderRadius: 99, border: `1px solid ${mode === 'radar' ? '#f87171' : 'var(--b1)'}`,
          background: mode === 'radar' ? 'rgba(248,113,113,.14)' : 'transparent',
          color: mode === 'radar' ? '#f87171' : 'var(--t3)',
          fontFamily: 'var(--fb)', flexShrink: 0, transition: 'all .2s var(--ease)',
        }}>
          <Radio size={11} />
          {isMobile ? 'Radar' : 'Rain Radar'}
        </button>

        {/* Coords */}
        {!isMobile && (
          <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0, marginLeft: mode==='radar'?0:'auto' }}>
            {weather.city} · {weather.lat?.toFixed(2)}°, {weather.lon?.toFixed(2)}°
          </span>
        )}

        {/* Fullscreen toggle — the main lever for making a small map usable on phones */}
        <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Exit full screen' : 'Full screen'}
          className="map-toolbar-icon-btn"
          style={{ display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,flexShrink:0,marginLeft:isMobile?0:(mode==='radar'?'auto':0),
            background:'var(--card2)',border:'1px solid var(--b1)',borderRadius:'var(--r1)',cursor:'pointer',color:'var(--t2)' }}>
          {fullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
        </button>
      </div>

      {/* Mobile layer strip */}
      {isMobile && mode === 'layer' && (
        <div className="map-layer-tabs" style={{ display: 'flex', gap: 5, padding: '8px 14px', overflowX: 'auto', borderBottom: '1px solid var(--b1)' }}>
          {LAYERS.map(l => (
            <button key={l.key} onClick={() => switchLayer(l.key)} style={{
              padding: '3px 10px', fontSize: 10, fontWeight: 600, flexShrink: 0,
              borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--fb)',
              border: `1px solid ${activeLayer === l.key ? l.color : 'var(--b1)'}`,
              background: activeLayer === l.key ? `${l.color}1e` : 'transparent',
              color: activeLayer === l.key ? l.color : 'var(--t3)',
            }}>{l.short}</button>
          ))}
        </div>
      )}

      {/* ── Map ── */}
      <div className="map-frame" style={fullscreen ? { height:'100%', position:'relative', background:'var(--page)' } : { position: 'relative', background: 'var(--page)' }}>
        {!apiKey ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, padding:'20px' }}>
            <Layers size={32} strokeWidth={1.2} color="var(--t3)" />
            <p style={{ fontSize:13, fontWeight:600, color:'var(--t2)', textAlign:'center' }}>Map requires an API key</p>
            <p style={{ fontSize:11.5, color:'var(--t3)', textAlign:'center', lineHeight:1.6 }}>
              Add <code style={{ fontFamily:'monospace', background:'var(--card2)', padding:'1px 5px', borderRadius:4 }}>VITE_OPENWEATHER_API_KEY</code> to your <code style={{ fontFamily:'monospace', background:'var(--card2)', padding:'1px 5px', borderRadius:4 }}>.env</code> file
            </p>
          </div>
        ) : (
          <>
            {!ready && (
              <div style={{ position:'absolute', top:0,left:0,right:0,bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--page)', zIndex:2 }}>
                <div className="spinner" />
              </div>
            )}
            {docUrl && (
              <iframe
                ref={iframeRef} src={docUrl} onLoad={onLoad}
                style={{ width:'100%', height:'100%', border:'none', display:'block' }}
                title="Weather Map" sandbox="allow-scripts allow-same-origin"
              />
            )}

            {/* Radar ping ring overlay */}
            {mode === 'radar' && ready && (
              <div className="radar-ping" style={{ width: 40, height: 40, top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }} />
            )}

            {/* Legend overlay — full labels + values */}
            {mode === 'layer' && ready && (
              <div className="map-legend-panel" style={{
                position:'absolute', bottom:10, left:10, zIndex:10,
                background:'rgba(7,12,24,.88)',
                backdropFilter:'blur(20px)',
                WebkitBackdropFilter:'blur(20px)',
                border:'1px solid rgba(255,255,255,.13)',
                borderRadius:10, padding:'9px 12px', minWidth:160,
                boxShadow:'0 8px 32px rgba(0,0,0,.38)',
              }}>
                {/* Header row */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:7, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,.08)',
                }}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:'var(--t1)' }}>
                    {layerCfg.label}
                  </span>
                  <span style={{
                    fontSize:9, fontWeight:700, color:layerCfg.color,
                    background:`${layerCfg.color}1e`,
                    border:`1px solid ${layerCfg.color}44`,
                    borderRadius:99, padding:'1px 6px',
                  }}>
                    {layerCfg.unit}
                  </span>
                </div>
                {/* Legend rows */}
                {layerCfg.legend.map((entry, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:7,
                    padding:'3px 0',
                    borderBottom: i < layerCfg.legend.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                  }}>
                    <div style={{
                      width:11, height:11, borderRadius:3, flexShrink:0,
                      background:entry.color,
                      boxShadow:`0 0 6px ${entry.color}55`,
                    }}/>
                    <span style={{ fontSize:10.5, color:'rgba(238,242,255,.75)', flex:1 }}>
                      {entry.label}
                    </span>
                    <span style={{
                      fontSize:10, fontWeight:700,
                      color:entry.color, fontFamily:'var(--fb)',
                      letterSpacing:'.01em',
                    }}>
                      {entry.val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Radar timestamp overlay */}
            {mode === 'radar' && ready && (
              <div style={{
                position:'absolute', bottom:10, left:10, zIndex:10,
                padding: '4px 10px', background: 'rgba(7,12,24,.88)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(248,113,113,.3)', borderRadius:8,
                fontSize:11, fontWeight:700, color:'#f87171',
              }}>
                {formatTime(radarFrames[radarIdx]?.time)} UTC
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Radar playback bar (only in radar mode, only with API key) ── */}
      {mode === 'radar' && apiKey && (
        <div className="radar-bar">
          {/* Play / Pause */}
          <button className="radar-play-btn" onClick={() => setPlaying(p => !p)} title={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </button>

          {/* Frame scrubber dots */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
            {radarFrames.map((f, i) => (
              <div key={i}
                className={`radar-frame-dot${i === radarIdx ? ' active' : ''}`}
                title={formatTime(f.time)}
                onClick={() => { setPlaying(false); seekRadar(i); }}
                style={{ background: i === radarIdx ? '#f87171' : 'var(--b2)' }}
              />
            ))}
          </div>

          {/* Time range label */}
          <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink:0, whiteSpace:'nowrap' }}>
            {formatTime(radarFrames[0]?.time)} – {formatTime(radarFrames[totalFrames - 1]?.time)} UTC
          </span>

          <button onClick={() => { setMode('layer'); setPlaying(false); send({ type:'SET_LAYER', key: activeLayer }); }}
            style={{ fontSize:10, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', flexShrink:0, padding:'2px 6px' }}>
            Exit Radar
          </button>
        </div>
      )}

      {fullscreen && (
        <button onClick={() => setFullscreen(false)} style={{
          position:'fixed', top:'calc(12px + env(safe-area-inset-top))', right:12, zIndex:1001,
          display:'flex',alignItems:'center',gap:6,padding:'8px 14px',
          background:'rgba(8,14,28,.9)',border:'1px solid var(--b2)',borderRadius:'var(--r99)',
          color:'var(--t1)',fontSize:12,fontWeight:700,cursor:'pointer',backdropFilter:'blur(20px)',
        }}>
          <Minimize2 size={13}/> Close
        </button>
      )}
    </div>
  );
}
