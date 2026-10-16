import Navbar from './Navbar';
import Footer from './Footer';
import AnimatedBackground from '@/components/animations/AnimatedBackground';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';
import { resolveCondition, getDayPeriod } from '@/utils/weatherCondition';
import { toCelsius } from '@/utils/format';

export default function Layout({ children }) {
  const { snapshot, unit } = useWeatherContext();
  const now = useClock(60000);

  const tempC = snapshot ? toCelsius(snapshot.current.temp, unit) : null;
  const condition = snapshot
    ? resolveCondition(snapshot.current.weather[0].id, snapshot.current.weather[0].icon, tempC)
    : 'clear-day';
  const period = snapshot ? getDayPeriod(snapshot.current, now) : 'afternoon';
  // The background animation thresholds are in km/h regardless of the display unit.
  const windSpeed = snapshot ? (unit === 'imperial' ? snapshot.current.wind_speed / 0.621371 : snapshot.current.wind_speed) : 0;
  const windDeg = snapshot?.current.wind_deg ?? null; // null = direction unknown
  const rainVolume = snapshot?.current.rainVolume ?? 0;
  const snowVolume = snapshot?.current.snowVolume ?? 0;
  const cloudCover = snapshot?.current.clouds ?? 0;

  return (
    <div className="relative min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <AnimatedBackground
        condition={condition}
        period={period}
        windSpeed={windSpeed}
        windDeg={windDeg}
        rainVolume={rainVolume}
        snowVolume={snowVolume}
        cloudCover={cloudCover}
      />
      <Navbar />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
