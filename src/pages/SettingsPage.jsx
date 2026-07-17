import { motion } from 'framer-motion';
import { Sun, Moon, Trash2, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useWeatherContext } from '@/context/WeatherContext';
import { Card } from '@/components/common/Primitives';
import { OPENWEATHER_API_KEY, GNEWS_API_KEY } from '@/constants';
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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { unit, setUnit, history, clearHistory } = useWeatherContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 max-w-2xl"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-mist-50">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Tune SkyVault to how you like to read the sky.</p>
      </div>

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

      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-mist-50">Appearance</p>
          <p className="text-xs text-slate-400">Switch between light and dark themes.</p>
        </div>
        <Toggle
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon size={14} /> Dark</span> },
            { value: 'light', label: <span className="flex items-center gap-1.5"><Sun size={14} /> Light</span> },
          ]}
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

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-slate-400" />
          <p className="text-sm font-medium text-mist-50">API connections</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">OpenWeather (weather &amp; maps)</span>
          {OPENWEATHER_API_KEY
            ? <span className="flex items-center gap-1.5 text-sky-300"><CheckCircle2 size={15} /> Connected</span>
            : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={15} /> Not set — demo data</span>}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">GNews (weather news)</span>
          {GNEWS_API_KEY
            ? <span className="flex items-center gap-1.5 text-sky-300"><CheckCircle2 size={15} /> Connected</span>
            : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={15} /> Not set — demo articles</span>}
        </div>
        <p className="text-xs text-slate-500">Add keys to your <code className="data-mono">.env</code> file as <code className="data-mono">VITE_OPENWEATHER_API_KEY</code> and <code className="data-mono">VITE_GNEWS_API_KEY</code>, then restart the dev server.</p>
      </Card>
    </motion.div>
  );
}
