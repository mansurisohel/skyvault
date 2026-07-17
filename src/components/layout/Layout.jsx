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
  const windSpeed = snapshot?.current.wind_speed ?? 0;
  const rainVolume = snapshot?.current.rainVolume ?? 0;
  const snowVolume = snapshot?.current.snowVolume ?? 0;
  const cloudCover = snapshot?.current.clouds ?? 0;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground
        condition={condition}
        period={period}
        windSpeed={windSpeed}
        rainVolume={rainVolume}
        snowVolume={snowVolume}
        cloudCover={cloudCover}
      />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
