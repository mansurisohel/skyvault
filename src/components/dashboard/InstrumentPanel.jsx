import { Sunrise, Sunset } from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import GaugeDial from '@/components/common/GaugeDial';
import { useWeatherContext } from '@/context/WeatherContext';
import { UV_LEVELS, AQI_LABELS } from '@/constants';
import { formatTime, windDirection } from '@/utils/format';

export default function InstrumentPanel() {
  const { snapshot } = useWeatherContext();
  const { current, airQuality } = snapshot;
  const tz = snapshot.location.timezoneOffset;

  const uvLevel = UV_LEVELS.find((l) => current.uvi <= l.max);
  const aqiInfo = airQuality ? AQI_LABELS[airQuality.aqi] : null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="flex flex-col items-center gap-3">
        <GaugeDial value={current.uvi} max={11} sublabel={current.uvi.toFixed(1)} color={uvLevel.color} />
        <div className="text-center">
          <p className="text-sm font-medium text-mist-50">UV Index</p>
          <p className="text-xs text-slate-400">{uvLevel.label}</p>
        </div>
      </Card>

      {aqiInfo && (
        <Card className="flex flex-col items-center gap-3">
          <GaugeDial value={airQuality.aqi} max={5} sublabel={airQuality.aqi} color={aqiInfo.color} />
          <div className="text-center">
            <p className="text-sm font-medium text-mist-50">Air Quality</p>
            <p className="text-xs text-slate-400">{aqiInfo.label}</p>
          </div>
        </Card>
      )}

      <Card className="flex flex-col items-center gap-3">
        <GaugeDial value={0} sublabel={windDirection(current.wind_deg)} color="#7fabff" needleDeg={current.wind_deg} />
        <div className="text-center">
          <p className="text-sm font-medium text-mist-50">Wind</p>
          <p className="text-xs text-slate-400">{Math.round(current.wind_speed)} km/h</p>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-center gap-1">
            <Sunrise size={22} className="text-amber-400" />
            <span className="data-mono text-sm text-mist-100">{formatTime(current.sunrise, tz)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <Sunset size={22} className="text-violet-400" />
            <span className="data-mono text-sm text-mist-100">{formatTime(current.sunset, tz)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">Sunrise &amp; Sunset</p>
      </Card>
    </div>
  );
}
