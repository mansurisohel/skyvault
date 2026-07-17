import { useWeatherContext } from '@/context/WeatherContext';

export default function UnitToggle({ className = '' }) {
  const { unit, setUnit } = useWeatherContext();

  return (
    <div
      role="group"
      aria-label="Temperature unit"
      className={`inline-flex shrink-0 items-center rounded-full glass p-1 text-sm font-semibold ${className}`}
    >
      {[
        { value: 'metric', label: '°C' },
        { value: 'imperial', label: '°F' },
      ].map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setUnit(opt.value)}
          aria-pressed={unit === opt.value}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            unit === opt.value ? 'bg-sky-500/25 text-sky-200' : 'text-slate-400 hover:text-mist-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
