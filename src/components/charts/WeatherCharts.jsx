import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Thermometer, CloudRain, Wind, Gauge, Droplets } from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';
import { buildInterpolatedTimeline } from '@/utils/timeline';
import { formatHour, unitSuffix } from '@/utils/format';

const gridColor = 'rgba(255,255,255,0.07)';
const axisColor = '#8593b3';

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 text-xs">
      <p className="text-slate-400">{label}</p>
      <p className="data-mono font-semibold text-mist-50">{payload[0].value}{unit}</p>
    </div>
  );
}

export default function WeatherCharts() {
  const { snapshot, unit } = useWeatherContext();
  const tz = snapshot.location.timezoneOffset;
  const nowUnix = useClock(60000);
  const [metric, setMetric] = useState('temp');

  const timeline = buildInterpolatedTimeline(snapshot.hourly, {
    stepSeconds: 2 * 3600,
    count: 12,
    startAt: nowUnix,
  });

  const data = timeline.map((h, i) => ({
    hour: i === 0 ? 'Now' : formatHour(h.dt, tz),
    temp: Math.round(h.temp),
    pop: Math.round(h.pop * 100),
    wind: Math.round(h.wind_speed),
    humidity: h.humidity,
    pressure: h.pressure,
  }));

  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windUnit = ` ${unitSuffix('wind', unit)}`;

  const METRICS = useMemo(() => ([
    {
      id: 'temp',
      label: 'Temperature',
      icon: Thermometer,
      color: '#7fabff',
      unit: tempUnit,
      summary: (rows) => {
        const vals = rows.map((r) => r.temp);
        return [
          { label: 'Now', value: `${vals[0]}${tempUnit}` },
          { label: 'Peak', value: `${Math.max(...vals)}${tempUnit}` },
          { label: 'Low', value: `${Math.min(...vals)}${tempUnit}` },
        ];
      },
    },
    {
      id: 'pop',
      label: 'Rain chance',
      icon: CloudRain,
      color: '#5b8def',
      unit: '%',
      summary: (rows) => {
        const vals = rows.map((r) => r.pop);
        return [
          { label: 'Now', value: `${vals[0]}%` },
          { label: 'Peak', value: `${Math.max(...vals)}%` },
          { label: 'Avg', value: `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}%` },
        ];
      },
    },
    {
      id: 'wind',
      label: 'Wind speed',
      icon: Wind,
      color: '#f7b955',
      unit: windUnit,
      summary: (rows) => {
        const vals = rows.map((r) => r.wind);
        return [
          { label: 'Now', value: `${vals[0]}${windUnit}` },
          { label: 'Gusting to', value: `${Math.max(...vals)}${windUnit}` },
          { label: 'Calmest', value: `${Math.min(...vals)}${windUnit}` },
        ];
      },
    },
    {
      id: 'humidity',
      label: 'Humidity',
      icon: Droplets,
      color: '#9a8cf5',
      unit: '%',
      summary: (rows) => {
        const vals = rows.map((r) => r.humidity);
        return [
          { label: 'Now', value: `${vals[0]}%` },
          { label: 'Peak', value: `${Math.max(...vals)}%` },
          { label: 'Driest', value: `${Math.min(...vals)}%` },
        ];
      },
    },
    {
      id: 'pressure',
      label: 'Pressure',
      icon: Gauge,
      color: '#5fd18b',
      unit: ' hPa',
      summary: (rows) => {
        const vals = rows.map((r) => r.pressure);
        const trend = vals[vals.length - 1] - vals[0];
        return [
          { label: 'Now', value: `${vals[0]} hPa` },
          { label: 'Trend', value: `${trend >= 0 ? '+' : ''}${trend} hPa` },
          { label: 'Range', value: `${Math.min(...vals)}–${Math.max(...vals)}` },
        ];
      },
    },
  ]), [tempUnit, windUnit]);

  const active = METRICS.find((m) => m.id === metric);
  const summary = active.summary(data);

  return (
    <Card className="flex h-full flex-col !p-0 overflow-hidden">
      <div className="flex flex-col gap-3 px-5 pt-5 md:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-mist-50">Forecast trends</h2>
          <span className="text-xs text-slate-500">Next 24h</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const isActive = m.id === metric;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/50' : 'text-slate-400 hover:bg-white/5 hover:text-mist-100'
                }`}
              >
                <Icon size={14} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 pt-4 md:px-6">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/5 px-3 py-2.5 text-center">
            <p className="data-mono text-base font-semibold text-mist-50 sm:text-lg">{s.value}</p>
            <p className="text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 px-2 pb-5 pt-2 md:px-3">
        <ResponsiveContainer width="100%" height={220}>
          {metric === 'temp' ? (
            <AreaChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={active.color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={active.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={34} />
              <Tooltip content={<ChartTooltip unit={tempUnit} />} />
              <Area type="monotone" dataKey="temp" stroke={active.color} strokeWidth={2.5} fill="url(#tempFill)" animationDuration={700} />
            </AreaChart>
          ) : metric === 'pop' ? (
            <BarChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip content={<ChartTooltip unit="%" />} />
              <Bar dataKey="pop" fill={active.color} radius={[6, 6, 0, 0]} animationDuration={700} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="hour" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={metric === 'pressure' ? ['dataMin - 4', 'dataMax + 4'] : undefined}
              />
              <Tooltip content={<ChartTooltip unit={metric === 'wind' ? windUnit : metric === 'pressure' ? ' hPa' : '%'} />} />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={active.color}
                strokeWidth={2.5}
                dot={metric === 'pressure' ? { r: 3, fill: active.color } : false}
                animationDuration={700}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
