import { CloudRain, Cloud, Wind, Thermometer, Gauge } from 'lucide-react';
import { cToF, mmToIn, msToKmh } from '@/utils/units';

// Layers offered in the "Live Map". Legends below use the palettes the data
// providers publish (OpenWeather: openweathermap.org/api/map_legend;
// RainViewer: rainviewer.com/api/color-schemes.html, scheme 2 "Universal Blue"),
// so the colors on the legend are the colors actually drawn on the map.
export const MAP_LAYERS = [
  { id: 'precipitation_new', label: 'Precipitation', icon: CloudRain },
  { id: 'clouds_new', label: 'Cloud Cover', icon: Cloud },
  { id: 'wind_new', label: 'Wind Speed', icon: Wind },
  { id: 'temp_new', label: 'Temperature', icon: Thermometer },
  { id: 'pressure_new', label: 'Pressure', icon: Gauge },
];

const KMH_PER_MS = 3.6;
const MPH_PER_MS = KMH_PER_MS * 0.621371;

// scale: 'linear' places stops proportionally to their value; 'even' spaces them equally.
const DEFINITIONS = {
  precipitation_new: {
    title: 'Precipitation',
    scale: 'even',
    stops: [{ v: 1, c: '#6e6ecd' }, { v: 10, c: '#5050e1' }, { v: 140, c: '#1414ff' }],
    ticks: [1, 10, 140],
    unit: (u) => (u === 'imperial' ? 'in' : 'mm'),
    format: (v, u) => (u === 'imperial' ? mmToIn(v).toFixed(2) : String(v)),
  },
  clouds_new: {
    title: 'Cloud cover',
    scale: 'linear',
    stops: [{ v: 0, c: 'rgba(240,240,255,0)' }, { v: 100, c: '#f0f0ff' }],
    ticks: [0, 50, 100],
    unit: () => '%',
    format: (v) => String(v),
  },
  wind_new: {
    title: 'Wind speed',
    scale: 'even',
    stops: [{ v: 5, c: '#eecece' }, { v: 15, c: '#b364bc' }, { v: 25, c: '#3f213b' }, { v: 50, c: '#744cac' }, { v: 100, c: '#4600af' }],
    ticks: [5, 15, 25, 50, 100],
    unit: (u) => (u === 'imperial' ? 'mph' : 'km/h'),
    format: (v, u) => String(Math.round(u === 'imperial' ? v * MPH_PER_MS : msToKmh(v))),
  },
  temp_new: {
    title: 'Temperature',
    scale: 'linear',
    stops: [
      { v: -40, c: '#821692' }, { v: -30, c: '#8257db' }, { v: -20, c: '#208cec' }, { v: -10, c: '#20c4e8' }, { v: 0, c: '#23dddd' },
      { v: 10, c: '#c2ff28' }, { v: 20, c: '#fff028' }, { v: 25, c: '#ffc228' }, { v: 30, c: '#fc8014' },
    ],
    ticks: [-40, -20, 0, 20, 30],
    unit: (u) => (u === 'imperial' ? '°F' : '°C'),
    format: (v, u) => String(Math.round(u === 'imperial' ? cToF(v) : v)),
  },
  pressure_new: {
    title: 'Pressure',
    scale: 'linear',
    stops: [
      { v: 940, c: '#0073ff' }, { v: 960, c: '#00aaff' }, { v: 980, c: '#4bd0d6' }, { v: 1000, c: '#8de7c7' }, { v: 1010, c: '#b0f720' },
      { v: 1020, c: '#f0b800' }, { v: 1040, c: '#fb5515' }, { v: 1060, c: '#f3363b' }, { v: 1080, c: '#c60000' },
    ],
    ticks: [940, 980, 1010, 1040, 1080],
    unit: () => 'hPa',
    format: (v) => String(v),
  },
  radar: {
    title: 'Radar reflectivity',
    scale: 'linear',
    stops: [
      { v: 15, c: '#88ddee' }, { v: 20, c: '#00a3e0' }, { v: 30, c: '#005588' }, { v: 35, c: '#ffee00' },
      { v: 40, c: '#ffaa00' }, { v: 45, c: '#ff4400' }, { v: 50, c: '#c10000' }, { v: 55, c: '#ffaaff' },
    ],
    ticks: [15, 30, 40, 50],
    unit: () => 'dBZ',
    format: (v) => String(v),
    note: 'Higher dBZ means heavier precipitation. Snow is drawn in a separate palette.',
  },
};

/** Returns { title, unit, gradient, ticks, note } ready to draw. `layerId` may be 'radar'. */
export function getLegend(layerId, unit = 'metric') {
  const def = DEFINITIONS[layerId];
  if (!def) return null;

  const values = def.stops.map((s) => s.v);
  const min = values[0];
  const max = values[values.length - 1];
  const position = (v) => {
    if (def.scale === 'even') return (values.indexOf(v) / (values.length - 1)) * 100;
    return ((v - min) / (max - min)) * 100;
  };

  return {
    title: def.title,
    unit: def.unit(unit),
    gradient: def.stops.map((s) => ({ pos: position(s.v), color: s.c })),
    ticks: def.ticks.map((v) => ({ pos: position(v), label: def.format(v, unit) })),
    note: def.note ?? null,
  };
}
