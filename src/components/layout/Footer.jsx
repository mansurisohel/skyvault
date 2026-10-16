import logoLockup from '@/assets/images/logo-lockup.webp';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { isDemoStatus } from '@/services/serviceStatus';

const HAS_CARTO_KEY = Boolean(import.meta.env.VITE_PUBLIC_CARTO_API_KEY?.trim());
const link = 'underline decoration-white/20 underline-offset-2 hover:text-mist-100';

export default function Footer() {
  const services = useServiceStatus();
  const demo = isDemoStatus(services.openweather);

  return (
    <footer className="mt-16 border-t border-white/5 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row md:items-start">
        <img src={logoLockup} alt="SkyVault Weather Data" className="h-14 w-auto object-contain" />
        <div className="max-w-2xl space-y-1.5 text-center text-xs leading-relaxed md:text-right">
          {demo && (
            <p className="font-medium text-amber-300">
              Running in demo mode: weather shown is sample data. Add the server API keys (see .env.example) to go live.
            </p>
          )}
          <p>
            Weather, geocoding &amp; map layers by{' '}
            <a className={link} href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeather</a>.
            {' '}UV index by{' '}
            <a className={link} href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>{' '}
            (CC BY 4.0). Radar by{' '}
            <a className={link} href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>.
            {' '}News by{' '}
            <a className={link} href="https://gnews.io/" target="_blank" rel="noopener noreferrer">GNews</a>.
            {' '}Base map &copy;{' '}
            <a className={link} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
            {HAS_CARTO_KEY && (
              <>
                , <a className={link} href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>
              </>
            )}
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
