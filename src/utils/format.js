export { toCelsius } from './units';

export function formatTemp(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return `${Math.round(value)}°`;
}

export function unitSuffix(kind, unit = 'metric') {
  if (kind === 'temp') return unit === 'metric' ? 'C' : 'F';
  if (kind === 'wind') return unit === 'metric' ? 'km/h' : 'mph';
  return '';
}

export function formatTime(unixSeconds, timezoneOffsetSeconds = 0) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

export function formatHour(unixSeconds, timezoneOffsetSeconds = 0) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'UTC' });
}

export function formatDay(unixSeconds, timezoneOffsetSeconds = 0, opts = {}) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return date.toLocaleDateString('en-US', { weekday: opts.short ? 'short' : 'long', timeZone: 'UTC' });
}

export function formatDate(unixSeconds, timezoneOffsetSeconds = 0) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function windDirection(deg) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return '--';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function relativeTime(dateStr) {
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return '';
  const diffMs = Date.now() - time;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function locationLabel(loc) {
  if (!loc) return '';
  return [loc.name, loc.state, loc.country].filter(Boolean).join(', ');
}

export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
