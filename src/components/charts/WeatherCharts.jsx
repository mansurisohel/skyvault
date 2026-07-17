import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Card } from '@/components/common/Primitives';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';
import { buildInterpolatedTimeline } from '@/utils/timeline';
import { formatHour, unitSuffix } from '@/utils/format';

const gridColor = 'rgba(255,255,255,0.06)';
const axisColor = '#6f7f9e';

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
  }));

  const dailyPressure = snapshot.daily.map((d, i) => ({
    day: i === 0 ? 'Today' : formatHour(d.dt, tz),
    pressure: d.pressure,
  }));

  const windUnitLabel = ` ${unitSuffix('wind', unit)}`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-mist-50">Temperature trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7fabff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7fabff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="hour" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<ChartTooltip unit={unit === 'metric' ? '°C' : '°F'} />} />
            <Area type="monotone" dataKey="temp" stroke="#7fabff" strokeWidth={2} fill="url(#tempFill)" animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-mist-50">Rain probability</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="hour" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<ChartTooltip unit="%" />} />
            <Bar dataKey="pop" fill="#5b8def" radius={[6, 6, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-mist-50">Wind speed</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="hour" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<ChartTooltip unit={windUnitLabel} />} />
            <Line type="monotone" dataKey="wind" stroke="#f7b955" strokeWidth={2} dot={false} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-mist-50">Humidity &amp; pressure</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyPressure} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={36} domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip content={<ChartTooltip unit=" hPa" />} />
            <Line type="monotone" dataKey="pressure" stroke="#9a8cf5" strokeWidth={2} dot={{ r: 3 }} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
