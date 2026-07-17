import { Droplets, ShieldAlert, Flower2, GlassWater } from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import GaugeDial from '@/components/common/GaugeDial';
import { useWeatherContext } from '@/context/WeatherContext';
import { UV_LEVELS, AQI_LABELS } from '@/constants';
import { estimatePollen, hydrationAdvice, uvAdvice } from '@/utils/health';

export default function HealthIndexCard() {
  const { snapshot, unit } = useWeatherContext();
  const { current, airQuality } = snapshot;

  const uvLevel = UV_LEVELS.find((l) => current.uvi <= l.max);
  const aqiInfo = airQuality ? AQI_LABELS[airQuality.aqi] : null;
  const month = new Date().getMonth();
  const tempC = unit === 'metric' ? current.temp : (current.temp - 32) * (5 / 9);
  const pollen = estimatePollen(tempC, month);
  const hydration = hydrationAdvice(tempC, current.humidity);

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-mist-50">Health index</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldAlert size={13} /> Personal guidance
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <GaugeDial value={current.uvi} max={11} sublabel={current.uvi.toFixed(1)} color={uvLevel.color} size={80} />
          <p className="text-xs font-medium text-mist-100">UV Index</p>
          <p className="text-[11px] text-slate-400">{uvLevel.label}{current.uviEstimated ? ' (est.)' : ''}</p>
        </div>

        {aqiInfo && (
          <div className="flex flex-col items-center gap-2 text-center">
            <GaugeDial value={airQuality.aqi} max={5} sublabel={airQuality.aqi} color={aqiInfo.color} size={80} />
            <p className="text-xs font-medium text-mist-100">Air Quality</p>
            <p className="text-[11px] text-slate-400">{aqiInfo.label}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-center">
          <GaugeDial value={pollen.level} max={4} sublabel={pollen.level} color={pollen.color} size={80} />
          <p className="text-xs font-medium text-mist-100">Pollen</p>
          <p className="text-[11px] text-slate-400">{pollen.label} (est.)</p>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 80, height: 80, background: 'radial-gradient(circle, rgba(127,171,255,0.18), transparent 70%)' }}
          >
            <GlassWater size={30} className="text-sky-300" />
          </div>
          <p className="text-xs font-medium text-mist-100">Hydration</p>
          <p className="text-[11px] text-slate-400">{hydration.level}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
        <div className="flex items-start gap-2.5 text-sm text-slate-300">
          <Droplets size={15} className="mt-0.5 shrink-0 text-sky-300" />
          <p>{hydration.tip}</p>
        </div>
        <div className="flex items-start gap-2.5 text-sm text-slate-300">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p>{uvAdvice(current.uvi)}</p>
        </div>
        <div className="flex items-start gap-2.5 text-sm text-slate-300">
          <Flower2 size={15} className="mt-0.5 shrink-0 text-violet-400" />
          <p>Pollen levels are a seasonal estimate, not a live sensor reading — check a local allergy forecast on high-pollen days.</p>
        </div>
      </div>
    </Card>
  );
}
