import {
  Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, CloudLightning, CloudSnow, CloudFog,
} from 'lucide-react';

const ICON_MAP = {
  'clear-day': Sun,
  'hot-day': Sun,
  'clear-night': Moon,
  'cloudy-day': CloudSun,
  'cloudy-night': CloudMoon,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  mist: CloudFog,
  fog: CloudFog,
};

const COLOR_MAP = {
  'clear-day': 'text-amber-400',
  'hot-day': 'text-amber-500',
  'clear-night': 'text-sky-300',
  'cloudy-day': 'text-mist-100',
  'cloudy-night': 'text-slate-400',
  cloudy: 'text-mist-100',
  rain: 'text-sky-400',
  storm: 'text-violet-400',
  snow: 'text-mist-100',
  mist: 'text-slate-400',
  fog: 'text-slate-300',
};

export default function WeatherIcon({ condition, size = 32, className = '', strokeWidth = 1.75 }) {
  const Icon = ICON_MAP[condition] ?? Cloud;
  const color = COLOR_MAP[condition] ?? 'text-mist-100';
  return <Icon size={size} strokeWidth={strokeWidth} className={`${color} ${className}`} />;
}
