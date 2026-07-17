export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
export const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || '';
export const NEWSDATA_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY || '';

export const OPENWEATHER_BASE = 'https://api.openweathermap.org';
export const GNEWS_BASE = 'https://gnews.io/api/v4';
export const NEWSDATA_BASE = 'https://newsdata.io/api/1';

export const DEMO_MODE = !OPENWEATHER_API_KEY;

export const STORAGE_KEYS = {
  UNIT: 'skyvault:unit',
  THEME: 'skyvault:theme',
  FAVORITES: 'skyvault:favorites',
  HISTORY: 'skyvault:history',
  LAST_LOCATION: 'skyvault:lastLocation',
};

export const DEFAULT_LOCATION = {
  name: 'New York',
  state: 'New York',
  country: 'US',
  lat: 40.7128,
  lon: -74.006,
};

export const AQI_LABELS = {
  1: { label: 'Good', color: '#5fd18b' },
  2: { label: 'Fair', color: '#a9d15f' },
  3: { label: 'Moderate', color: '#f5c542' },
  4: { label: 'Poor', color: '#f58a42' },
  5: { label: 'Very Poor', color: '#e05a5a' },
};

export const UV_LEVELS = [
  { max: 2, label: 'Low', color: '#5fd18b' },
  { max: 5, label: 'Moderate', color: '#f5c542' },
  { max: 7, label: 'High', color: '#f58a42' },
  { max: 10, label: 'Very High', color: '#e05a5a' },
  { max: Infinity, label: 'Extreme', color: '#9a52e0' },
];

export const NAV_LINKS = [
  { to: '#overview', label: 'Overview' },
  { to: '#forecast', label: 'Forecast' },
  { to: '#health', label: 'Health & Moon' },
  { to: '#map', label: 'Map' },
  { to: '#news', label: 'News' },
  { to: '#favorites', label: 'Favorites' },
];
