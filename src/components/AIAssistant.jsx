import { Umbrella, Sun, Shield, Droplets, Thermometer, Wind, Cloud, AlertTriangle, Activity, CheckCircle, Bot } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

const ICON_MAP = {
  umbrella:Umbrella, sun:Sun, shield:Shield, droplets:Droplets,
  thermometer:Thermometer, wind:Wind, cloud:Cloud,
  'alert-triangle':AlertTriangle, activity:Activity, 'check-circle':CheckCircle,
};
const COLS = ['var(--blue)','var(--teal)','var(--yellow)','var(--orange)','var(--purple)','var(--pink)','var(--green)','var(--indigo)'];

export default function AIAssistant() {
  const { aiRecs, weather } = useWeather();
  if (!weather||!aiRecs?.length) return null;
  return (
    <div className="card fade-up card-pad">
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
        <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 16px rgba(99,102,241,.42)',flexShrink:0 }}>
          <Bot size={14} color="white"/>
        </div>
        <div>
          <div style={{ fontSize:13,fontWeight:700,color:'var(--t1)' }}>Smart Recommendations</div>
          <div style={{ fontSize:11,color:'var(--t3)' }}>Personalized for {weather.city}</div>
        </div>
      </div>
      <div className="ai-grid">
        {aiRecs.map((rec,i)=>{
          const Icon=ICON_MAP[rec.icon]||CheckCircle;
          const col=COLS[i%COLS.length];
          return (
            <div key={i} className={`fade-up d${Math.min(i+1,8)}`}
              style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',background:'var(--card2)',border:'1px solid var(--b1)',borderRadius:'var(--r2)' }}>
              <div style={{ width:26,height:26,borderRadius:'var(--r0)',flexShrink:0,background:'rgba(91,156,246,.12)',border:'1px solid rgba(91,156,246,.20)',display:'flex',alignItems:'center',justifyContent:'center',color:col }}>
                <Icon size={12}/>
              </div>
              <p style={{ fontSize:12,color:'var(--t2)',lineHeight:1.55,paddingTop:2,minWidth:0 }}>{rec.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
