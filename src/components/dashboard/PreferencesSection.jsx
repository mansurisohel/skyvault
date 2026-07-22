import { Trash2, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import { Card } from '@/components/common/Primitives';
import SectionHeading from '@/components/common/SectionHeading';
import { OPENWEATHER_API_KEY, GNEWS_API_KEY, NEWSDATA_API_KEY } from '@/constants';
import { locationLabel } from '@/utils/format';

function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full glass p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value ? 'bg-sky-500/25 text-sky-200' : 'text-slate-400 hover:text-mist-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function PreferencesSection() {
  const { unit, setUnit, history, clearHistory } = useWeatherContext();

  return (
    <section id="preferences" className="scroll-mt-24">
      <SectionHeading eyebrow="Tune it to you" title="Preferences" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-mist-50">Temperature units</p>
            <p className="text-xs text-slate-400">Applies across forecasts and charts.</p>
          </div>
          <Toggle
            value={unit}
            onChange={setUnit}
            options={[{ value: 'metric', label: '°C' }, { value: 'imperial', label: '°F' }]}
          />
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-mist-50">Search history</p>
              <p className="text-xs text-slate-400">{history.length} saved {history.length === 1 ? 'search' : 'searches'}.</p>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              disabled={history.length === 0}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <Trash2 size={15} /> Clear
            </button>
          </div>
          {history.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <span key={`${h.lat}-${h.lon}`} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  {locationLabel(h)}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-400" />
            <p className="text-sm font-medium text-mist-50">API connections</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-400">OpenWeather (weather &amp; maps)</span>
            {OPENWEATHER_API_KEY
              ? <span className="flex items-center gap-1.5 text-sky-300"><CheckCircle2 size={15} /> Connected</span>
              : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={15} /> Not set — demo data</span>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-400">GNews (weather news)</span>
            {GNEWS_API_KEY
              ? <span className="flex items-center gap-1.5 text-sky-300"><CheckCircle2 size={15} /> Connected</span>
              : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={15} /> Not set</span>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-400">NewsData.io (weather news)</span>
            {NEWSDATA_API_KEY
              ? <span className="flex items-center gap-1.5 text-sky-300"><CheckCircle2 size={15} /> Connected</span>
              : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={15} /> Not set</span>}
          </div>
          {!GNEWS_API_KEY && !NEWSDATA_API_KEY && (
            <p className="text-xs text-amber-300/80">
              No news provider configured — the News section shows generated insights from live conditions instead.
            </p>
          )}
          <p className="text-xs text-slate-500">
            Add keys to your <code className="data-mono">.env</code> file as <code className="data-mono">OPENWEATHER_API_KEY</code>, <code className="data-mono">GNEWS_API_KEY</code>, and/or <code className="data-mono">NEWSDATA_API_KEY</code>, then restart the dev server.
          </p>
        </Card>
      </div>
    </section>
  );
}
