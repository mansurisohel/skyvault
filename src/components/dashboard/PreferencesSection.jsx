import { useState } from 'react';
import {
  Trash2, KeyRound, CheckCircle2, XCircle, Info, PlugZap, Loader2, AlertTriangle,
} from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import { Card } from '@/components/common/Primitives';
import SectionHeading from '@/components/common/SectionHeading';
import { OPENWEATHER_API_KEY, GNEWS_DEV_KEY } from '@/constants';
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

/**
 * Actually calls /api/news and reports back what really happened, using the
 * specific `reason` the serverless function returns — this is real ground
 * truth about the production news setup, unlike the local-dev-key badge
 * below (which can only ever report on a different, unrelated variable).
 */
function NewsProxyTest() {
  const [state, setState] = useState('idle'); // idle | loading | done
  const [result, setResult] = useState(null); // { ok, title, detail }

  async function runTest() {
    setState('loading');
    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        setResult({
          ok: false,
          title: 'The proxy isn\u2019t reachable here',
          detail: 'That\u2019s expected with plain `npm run dev` \u2014 it has no serverless runtime. Deploy to Vercel, or run `vercel dev` locally, to test the real thing.',
        });
      } else {
        const data = await res.json();
        if (res.ok && data.articles?.length) {
          setResult({
            ok: true,
            title: `Working \u2014 got ${data.articles.length} live articles`,
            detail: 'GNEWS_API_KEY is set correctly on this deployment and GNews responded normally.',
          });
        } else {
          setResult({
            ok: false,
            title: 'Proxy reached the server, but got no articles',
            detail: data.reason || 'No further detail was returned.',
          });
        }
      }
    } catch (err) {
      setResult({ ok: false, title: 'Request failed', detail: String(err) });
    } finally {
      setState('done');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={runTest}
        disabled={state === 'loading'}
        className="flex w-fit items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/25 disabled:opacity-60"
      >
        {state === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
        Test the production news proxy
      </button>
      {result && (
        <div className={`flex items-start gap-2 rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${
          result.ok ? 'bg-sky-400/10 text-sky-200' : 'bg-amber-400/10 text-amber-200'
        }`}
        >
          {result.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
          <span>
            <strong className="font-semibold">{result.title}.</strong> {result.detail}
          </span>
        </div>
      )}
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
            <span className="text-slate-400">GNews — local dev fallback key</span>
            {GNEWS_DEV_KEY
              ? <span className="flex items-center gap-1.5 text-sky-300"><CheckCircle2 size={15} /> Set</span>
              : <span className="flex items-center gap-1.5 text-slate-500"><XCircle size={15} /> Not set</span>}
          </div>
          <div className="flex items-start gap-2 rounded-2xl bg-white/5 px-3.5 py-3 text-xs leading-relaxed text-slate-400">
            <Info size={14} className="mt-0.5 shrink-0 text-sky-300" />
            <span>
              The badge above only checks the local-dev fallback key — it can’t see the real production key at all (that’s by design; the server keeps it private). Use the button below for the real answer.
            </span>
          </div>
          <NewsProxyTest />
          <p className="text-xs text-slate-500">
            Add keys to your <code className="data-mono">.env</code> file as <code className="data-mono">OPENWEATHER_API_KEY</code> and/or <code className="data-mono">VITE_GNEWS_DEV_KEY</code> (both are local-dev only). For a real deployment, set <code className="data-mono">GNEWS_API_KEY</code> in your hosting platform’s dashboard — never in <code className="data-mono">.env</code>, since that file never leaves your machine.
          </p>
        </Card>
      </div>
    </section>
  );
}
