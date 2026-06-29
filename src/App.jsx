import { WeatherProvider, useWeather } from './context/WeatherContext';
import Header         from './components/Header';
import WelcomeScreen  from './components/WelcomeScreen';
import WeatherScene   from './components/WeatherScene';
import CurrentWeatherCard from './components/CurrentWeatherCard';
import MetricsGrid        from './components/MetricsGrid';
import { HourlyForecast, DailyForecast } from './components/ForecastCards';
import AIAssistant    from './components/AIAssistant';
import AlertsPanel    from './components/AlertsPanel';
import WeatherMap     from './components/WeatherMap';
import FavoritesPanel from './components/FavoritesPanel';
import LifestylePanel from './components/LifestylePanel';
import LatestNews     from './components/LatestNews';

function Dashboard() {
  const { weather, loading, error, scene, setError } = useWeather();

  return (
    <div style={{ minHeight:'100vh', position:'relative', background:'var(--page)' }}>
      {/* Animated weather scene (fixed background) */}
      <WeatherScene condition={scene} />

      {/* All content above the scene */}
      <div style={{ position:'relative', zIndex:2 }}>
        <Header />

        <main style={{ maxWidth:1440, margin:'0 auto', padding:'clamp(12px,2vw,20px) clamp(12px,3vw,20px) 60px' }}>

          {/* Error banner */}
          {error && (
            <div className="fade-in" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(248,113,113,.10)', border:'1px solid rgba(248,113,113,.26)', borderLeft:'3px solid #f87171', borderRadius:'var(--r3)', padding:'11px 15px', marginBottom:14, color:'#f87171', fontSize:13 }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 2px', marginLeft:12 }}>×</button>
            </div>
          )}

          {/* Loader */}
          {loading && !weather && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(60px,12vh,120px) 0', gap:16 }}>
              <div className="spinner" />
              <p style={{ fontSize:13, color:'var(--t3)' }}>Fetching weather data…</p>
            </div>
          )}

          {/* Welcome state */}
          {!weather && !loading && <WelcomeScreen />}

          {/* Dashboard */}
          {weather && (
            <div className="dash-grid">
              <div className="main-col">
                <CurrentWeatherCard />
                <AIAssistant />
                <MetricsGrid />
                <LifestylePanel />
                <HourlyForecast />
                <DailyForecast />
                <LatestNews />
                <WeatherMap />
              </div>
              <div className="side-col">
                <AlertsPanel />
                <FavoritesPanel />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WeatherProvider>
      <Dashboard />
    </WeatherProvider>
  );
}
