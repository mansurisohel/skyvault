import { useState, useRef, useEffect, useCallback } from 'react';
import { Map, Layers, Radio, Maximize2, Minimize2, Clock } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

const LAYERS=[
  {key:'precipitation_new',label:'Radar',  color:'#60a5fa', live:true,
    legend:[['Light','#4fc3f7'],['Moderate','#42a5f5'],['Heavy','#7e57c2'],['Severe','#e53935']]},
  {key:'clouds_new',       label:'Clouds', color:'#94a3b8',
    legend:[['Clear','#334155'],['Partial','#64748b'],['Overcast','#cbd5e1']]},
  {key:'wind_new',         label:'Wind',   color:'#2dd4bf',
    legend:[['Calm','#134e4a'],['Breezy','#2dd4bf'],['Strong','#f0fdfa']]},
  {key:'temp_new',         label:'Temp',   color:'#fb923c',
    legend:[['Cold','#3b82f6'],['Mild','#facc15'],['Hot','#ef4444']]},
  {key:'pressure_new',     label:'Press.', color:'#c084fc',
    legend:[['Low','#a855f7'],['Normal','#818cf8'],['High','#f472b6']]},
];

function buildDoc(lat,lon,layer,apiKey,opacity){
  const base='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  return `<!DOCTYPE html>
<html style="height:100%;margin:0">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{height:100%;width:100%;background:#080c18;font-family:Inter,system-ui,sans-serif}
.leaflet-control-zoom{border:none!important;box-shadow:0 2px 16px rgba(0,0,0,.28)!important;margin:10px!important}
.leaflet-control-zoom a{background:rgba(14,22,42,.92)!important;border:1px solid rgba(255,255,255,.15)!important;color:#e0eaff!important;backdrop-filter:blur(16px);font-weight:700;width:34px!important;height:34px!important;line-height:34px!important;font-size:17px!important}
.leaflet-control-zoom a:hover{opacity:.8}
.leaflet-control-attribution{background:rgba(14,22,42,.9)!important;color:#e0eaff!important;font-size:9px!important;backdrop-filter:blur(8px);border-radius:4px!important;padding:2px 6px!important}
.leaflet-control-attribution a{color:#e0eaff!important}
.wx-pop .leaflet-popup-content-wrapper{background:rgba(8,14,28,.97);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#eef2ff;backdrop-filter:blur(24px);box-shadow:0 8px 32px rgba(0,0,0,.32)}
.wx-pop .leaflet-popup-tip{background:rgba(8,14,28,.97)}
.wx-pop .leaflet-popup-content{margin:9px 13px;font-size:12px;font-weight:600;line-height:1.5}
.wx-radar{animation:radarPulse 3.2s ease-in-out infinite}
@keyframes radarPulse{0%,100%{opacity:var(--op,.7)}50%{opacity:calc(var(--op,.7) * 1.35)}}
.sweep-wrap{position:relative;width:0;height:0}
.sweep-ring{position:absolute;border-radius:50%;border:1.5px solid rgba(96,165,250,.55);transform:translate(-50%,-50%);animation:sweepGrow 2.6s ease-out infinite;pointer-events:none}
.sweep-ring.r2{animation-delay:.85s}
.sweep-ring.r3{animation-delay:1.7s}
@keyframes sweepGrow{0%{width:0;height:0;opacity:.85}100%{width:130px;height:130px;opacity:0}}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function(){
  var API=${JSON.stringify(apiKey)};
  var map=L.map('map',{center:[${lat},${lon}],zoom:8,zoomControl:true,preferCanvas:true,attributionControl:true});
  L.tileLayer(${JSON.stringify(base)},{subdomains:'abcd',maxZoom:19,attribution:'&copy; OpenStreetMap &middot; CARTO'}).addTo(map);
  var wxL=null;
  function setLayer(k,op){
    if(wxL){map.removeLayer(wxL);wxL=null;}
    if(!API||!k)return;
    var el;
    wxL=L.tileLayer('https://tile.openweathermap.org/map/'+k+'/{z}/{x}/{y}.png?appid='+API,{
      opacity:op!=null?op:.7,maxZoom:18,className:k==='precipitation_new'?'wx-radar':'',
    }).addTo(map);
    if(k==='precipitation_new'){
      wxL.on('add',function(){
        var pane=map.getPane('tilePane');
        if(pane) pane.style.setProperty('--op', String(op!=null?op:.7));
      });
    }
  }
  function setOpacity(op){ if(wxL) wxL.setOpacity(op); var pane=map.getPane('tilePane'); if(pane) pane.style.setProperty('--op', String(op)); }
  setLayer(${JSON.stringify(layer)}, ${opacity});
  // Location pin + a soft animated radar-sweep ring around it (visual life, not fake data)
  var pt=map.latLngToLayerPoint([${lat},${lon}]);
  var pin=L.circleMarker([${lat},${lon}],{radius:8,fillColor:'#5b9cf6',color:'#fff',weight:2.5,opacity:1,fillOpacity:.95}).addTo(map);
  pin.bindPopup('<b>${lat.toFixed(2)}°, ${lon.toFixed(2)}°</b><br>Current Location',{className:'wx-pop'});
  var SweepIcon=L.divIcon({className:'',html:'<div class="sweep-wrap"><div class="sweep-ring"></div><div class="sweep-ring r2"></div><div class="sweep-ring r3"></div></div>',iconSize:[0,0]});
  L.marker([${lat},${lon}],{icon:SweepIcon,interactive:false,zIndexOffset:-10}).addTo(map);
  // Soft-refresh the active tile layer periodically so the radar reads as live.
  setInterval(function(){ if(wxL) wxL.redraw(); parent.postMessage({type:'TICK'},'*'); }, 5*60*1000);
  window.addEventListener('message',function(e){
    var d=e.data; if(!d) return;
    if(d.type==='LAYER') setLayer(d.key, d.opacity);
    if(d.type==='OPACITY') setOpacity(d.opacity);
    if(d.type==='RESIZE') setTimeout(function(){ map.invalidateSize(); }, 60);
  });
})();
</script>
</body>
</html>`;
}

function timeAgo(ts){
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60)return 'just now';
  const m=Math.floor(s/60);
  if(m<60)return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}

export default function WeatherMap(){
  const {weather}=useWeather();
  const {isMobile}=useBreakpoint();
  const [active,setActive]=useState('precipitation_new');
  const [opacity,setOpacityState]=useState(0.75);
  const [docUrl,setDocUrl]=useState(null);
  const [ready,setReady]=useState(false);
  const [fullscreen,setFullscreen]=useState(false);
  const [lastUpdated,setLastUpdated]=useState(Date.now());
  const [, forceTick]=useState(0);
  const iframeRef=useRef(null);
  const apiKey=import.meta.env.VITE_OPENWEATHER_API_KEY||'';
  const activeLayer=LAYERS.find(l=>l.key===active);

  useEffect(()=>{
    if(!weather)return;
    const html=buildDoc(weather.lat,weather.lon,active,apiKey,opacity);
    const blob=new Blob([html],{type:'text/html'});
    const url=URL.createObjectURL(blob);
    setDocUrl(url);setReady(false);setLastUpdated(Date.now());
    return()=>URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[weather?.lat,weather?.lon,apiKey]);

  // Re-render "time ago" label every 30s
  useEffect(()=>{ const t=setInterval(()=>forceTick(x=>x+1),30000); return()=>clearInterval(t); },[]);

  // Tell the iframe to re-measure whenever the fullscreen state flips
  useEffect(()=>{ iframeRef.current?.contentWindow?.postMessage({type:'RESIZE'},'*'); },[fullscreen]);

  useEffect(()=>{
    const fn=e=>{ if(e.data?.type==='TICK') setLastUpdated(Date.now()); };
    window.addEventListener('message',fn);
    return()=>window.removeEventListener('message',fn);
  },[]);

  useEffect(()=>{
    if(!fullscreen)return;
    const onKey=e=>{ if(e.key==='Escape') setFullscreen(false); };
    document.addEventListener('keydown',onKey);
    document.body.style.overflow='hidden';
    return()=>{ document.removeEventListener('keydown',onKey); document.body.style.overflow=''; };
  },[fullscreen]);

  const switchLayer=useCallback(key=>{
    setActive(key);
    iframeRef.current?.contentWindow?.postMessage({type:'LAYER',key,opacity},'*');
  },[opacity]);

  const changeOpacity=useCallback(v=>{
    setOpacityState(v);
    iframeRef.current?.contentWindow?.postMessage({type:'OPACITY',opacity:v},'*');
  },[]);

  const onLoad=useCallback(()=>{
    setReady(true);
    iframeRef.current?.contentWindow?.postMessage({type:'LAYER',key:active,opacity},'*');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(!weather)return null;

  return (
    <div className={`card fade-up ${fullscreen?'map-fullscreen':''}`} style={{ overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{ display:'flex',alignItems:'center',gap:8,padding:'11px 14px',borderBottom:'1px solid var(--b1)',flexWrap:'wrap',rowGap:8 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
          <Map size={13} color="var(--acc)"/>
          <span style={{ fontSize:13,fontWeight:700,color:'var(--t1)' }}>Live Map</span>
          {activeLayer?.live && (
            <span style={{ display:'inline-flex',alignItems:'center',gap:4,marginLeft:2,color:'var(--green)' }}>
              <Radio size={10} style={{ animation:'glowPulse 2s ease infinite' }} />
              <span style={{ fontSize:9.5,fontWeight:700,letterSpacing:'.06em' }}>LIVE</span>
            </span>
          )}
        </div>

        <div className="map-layer-tabs" style={{ display:'flex',gap:5,flexWrap:'wrap',flex:'1 1 200px' }}>
          {LAYERS.map(l=>(
            <button key={l.key} onClick={()=>switchLayer(l.key)} style={{
              padding:'4px 11px',fontSize:10.5,fontWeight:600,borderRadius:99,cursor:'pointer',fontFamily:'var(--fb)',
              border:`1px solid ${active===l.key?l.color:'var(--b1)'}`,
              background:active===l.key?`${l.color}1e`:'transparent',
              color:active===l.key?l.color:'var(--t3)',
              transition:'all .2s var(--ease)',whiteSpace:'nowrap',minHeight:26,
            }}>{l.label}</button>
          ))}
        </div>

        <button onClick={()=>setFullscreen(f=>!f)} title={fullscreen?'Exit full screen':'Full screen'}
          style={{ display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,flexShrink:0,
            background:'var(--card2)',border:'1px solid var(--b1)',borderRadius:'var(--r1)',cursor:'pointer',color:'var(--t2)' }}>
          {fullscreen?<Minimize2 size={13}/>:<Maximize2 size={13}/>}
        </button>
      </div>

      {/* Opacity + legend + freshness row */}
      <div style={{ display:'flex',alignItems:'center',gap:14,padding:'8px 14px',borderBottom:'1px solid var(--b1)',flexWrap:'wrap',rowGap:8,background:'var(--card2)' }}>
        <label style={{ display:'flex',alignItems:'center',gap:8,flex:'1 1 150px',minWidth:130 }}>
          <span style={{ fontSize:10.5,color:'var(--t3)',fontWeight:600,whiteSpace:'nowrap' }}>Opacity</span>
          <input type="range" min="0.15" max="1" step="0.05" value={opacity}
            onChange={e=>changeOpacity(parseFloat(e.target.value))}
            className="opacity-slider" style={{ flex:1, accentColor:activeLayer?.color }}/>
        </label>
        {!isMobile && activeLayer?.legend && (
          <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
            {activeLayer.legend.map(([label,color])=>(
              <span key={label} style={{ display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--t3)' }}>
                <span style={{ width:8,height:8,borderRadius:2,background:color,flexShrink:0 }}/>{label}
              </span>
            ))}
          </div>
        )}
        <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--t3)',flexShrink:0,marginLeft:'auto' }}>
          <Clock size={10}/>Updated {timeAgo(lastUpdated)}
        </span>
      </div>

      {/* Map */}
      <div className="map-frame" style={fullscreen?{ height:'100%', position:'relative', background:'var(--page)' } : { position:'relative', background:'var(--page)' }}>
        {!apiKey?(
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10,color:'var(--t3)',padding:'0 20px',textAlign:'center' }}>
            <Layers size={28} strokeWidth={1.4}/>
            <p style={{ fontSize:12,fontWeight:600,color:'var(--t2)' }}>Map requires an API key</p>
            <p style={{ fontSize:11 }}>Add VITE_OPENWEATHER_API_KEY to .env</p>
          </div>
        ):(
          <>
            {!ready&&<div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--page)',zIndex:2 }}><div className="spinner"/></div>}
            {docUrl&&<iframe ref={iframeRef} src={docUrl} onLoad={onLoad} style={{ width:'100%',height:'100%',border:'none',display:'block' }} title="Weather Map" sandbox="allow-scripts allow-same-origin"/>}
          </>
        )}
      </div>

      {fullscreen && (
        <button onClick={()=>setFullscreen(false)} style={{
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
