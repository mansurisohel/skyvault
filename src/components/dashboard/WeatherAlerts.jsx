import { useState } from 'react';
import { AlertTriangle, ChevronDown, ShieldAlert } from 'lucide-react';
import { formatTime } from '@/utils/format';
import { useWeatherContext } from '@/context/WeatherContext';

export default function WeatherAlerts() {
  const { snapshot } = useWeatherContext();
  const tz = snapshot.location.timezoneOffset;
  const [openIdx, setOpenIdx] = useState(0);

  if (!snapshot.alerts?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-amber-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
          Active alerts
        </h2>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
          {snapshot.alerts.length}
        </span>
      </div>
      {snapshot.alerts.map((alert, i) => (
        <div key={`${alert.event}-${i}`} className="glass-panel border-amber-400/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
            aria-expanded={openIdx === i}
          >
            <AlertTriangle size={20} className="shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-mist-50">{alert.event}</p>
              <p className="text-xs text-slate-400">
                {alert.sender_name} &middot; until {formatTime(alert.end, tz)}
              </p>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
          </button>
          {openIdx === i && (
            <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-slate-300">
              {alert.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
