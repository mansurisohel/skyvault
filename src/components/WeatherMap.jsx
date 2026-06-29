import { useState, useRef, useEffect, useCallback } from 'react';
import { Map, Layers } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

const LAYERS=[
  {key:'precipitation_new',label:'Rain',   color:'#60a5fa'},
  {key:'clouds_new',       label:'Clouds', color:'#94a3b8'},
  {key:'wind_new',         label:'Wind',   color:'#2dd4bf'},
  {key:'temp_new',         label:'Temp',   color:'#fb923c'},
  {key:'pressure_new',     label:'Press.', color:'#c084fc'},
];

function buildDoc(lat,lon,layer,apiKey,theme){
  const base=theme==='light'
    ?'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    :'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const bg=theme==='light'?'#d8e8f0':'#080c18';
  const zbg=theme==='light'?'rgba(255,255,255,.9)':'rgba(14,22,42,.9)';
  const zcl=theme==='light'?'#1e293b':'#e0eaff';
  const pbg=theme==='light'?'rgba(255,255,255,.97)':'rgba(8,14,28,.97)';
  const pbd=theme==='light'?'rgba(0,0,0,.12)':'rgba(255,255,255,.12)';
  const ptx=theme==='light'?'#0d1424':'#eef2ff';
  return `<!DOCTYPE html>
<html style="height:100%;margin:0">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{height:100%;width:100%;background:${bg};font-family:Inter,system-ui,sans-serif}
.leaflet-control-zoom{border:none!important;box-shadow:0 2px 16px rgba(0,0,0,.28)!important}
.leaflet-control-zoom a{background:${zbg}!important;border:1px solid rgba(255,255,255,.15)!important;color:${zcl}!important;backdrop-filter:blur(16px);font-weight:700;width:30px!important;height:30px!important;line-height:30px!important}
.leaflet-control-zoom a:hover{opacity:.8}
.leaflet-control-attribution{background:${zbg}!important;color:${zcl}!important;font-size:9px!important;backdrop-filter:blur(8px);border-radius:4px!important;padding:2px 6px!important}
.leaflet-control-attribution a{color:${zcl}!important}
.wx-pop .leaflet-popup-content-wrapper{background:${pbg};border:1px solid ${pbd};border-radius:10px;color:${ptx};backdrop-filter:blur(24px);box-shadow:0 8px 32px rgba(0,0,0,.32)}
.wx-pop .leaflet-popup-tip{background:${pbg}}
.wx-pop .leaflet-popup-content{margin:9px 13px;font-size:12px;font-weight:600;line-height:1.5}
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
  function setLayer(k){if(wxL){map.removeLayer(wxL);wxL=null;}if(API&&k){wxL=L.tileLayer('https://tile.openweathermap.org/map/'+k+'/{z}/{x}/{y}.png?appid='+API,{opacity:.65,maxZoom:18}).addTo(map);}}
  setLayer(${JSON.stringify(layer)});
  var pin=L.circleMarker([${lat},${lon}],{radius:8,fillColor:'#5b9cf6',color:'#fff',weight:2.5,opacity:1,fillOpacity:.95}).addTo(map);
  pin.bindPopup('<b>${lat.toFixed(2)}°, ${lon.toFixed(2)}°</b><br>Current Location',{className:'wx-pop'});
  window.addEventListener('message',function(e){var d=e.data;if(!d)return;if(d.type==='LAYER')setLayer(d.key);});
})();
</script>
</body>
</html>`;
}

export default function WeatherMap(){
  const {weather,theme}=useWeather();
  const {isMobile}=useBreakpoint();
  const [active,setActive]=useState('precipitation_new');
  const [docUrl,setDocUrl]=useState(null);
  const [ready,setReady]=useState(false);
  const iframeRef=useRef(null);
  const apiKey=import.meta.env.VITE_OPENWEATHER_API_KEY||'';

  useEffect(()=>{
    if(!weather)return;
    const html=buildDoc(weather.lat,weather.lon,active,apiKey,theme);
    const blob=new Blob([html],{type:'text/html'});
    const url=URL.createObjectURL(blob);
    setDocUrl(url);setReady(false);
    return()=>URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[weather?.lat,weather?.lon,theme,apiKey]);

  const switchLayer=useCallback(key=>{
    setActive(key);
    iframeRef.current?.contentWindow?.postMessage({type:'LAYER',key},'*');
  },[]);

  const onLoad=useCallback(()=>{
    setReady(true);
    iframeRef.current?.contentWindow?.postMessage({type:'LAYER',key:active},'*');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(!weather)return null;

  return (
    <div className="card fade-up" style={{ overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{ display:'flex',alignItems:'center',gap:8,padding:'11px 16px',borderBottom:'1px solid var(--b1)',flexWrap:'wrap',rowGap:8 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
          <Map size={13} color="var(--acc)"/>
          <span style={{ fontSize:13,fontWeight:700,color:'var(--t1)' }}>Live Map</span>
        </div>
        <div style={{ display:'flex',gap:5,flexWrap:'wrap',flex:1 }}>
          {LAYERS.map(l=>(
            <button key={l.key} onClick={()=>switchLayer(l.key)} style={{
              padding:'3px 10px',fontSize:10.5,fontWeight:600,borderRadius:99,cursor:'pointer',fontFamily:'var(--fb)',
              border:`1px solid ${active===l.key?l.color:'var(--b1)'}`,
              background:active===l.key?`${l.color}1e`:'transparent',
              color:active===l.key?l.color:'var(--t3)',
              transition:'all .2s var(--ease)',whiteSpace:'nowrap',
            }}>{l.label}</button>
          ))}
        </div>
        {!isMobile&&<span style={{ fontSize:10.5,color:'var(--t3)',flexShrink:0 }}>{weather.city} · {weather.lat?.toFixed(2)}°</span>}
      </div>

      {/* Map */}
      <div className="map-frame" style={{ position:'relative',background:'var(--page)' }}>
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
    </div>
  );
}
