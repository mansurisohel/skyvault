// No API keys live in client code. Keys are read server-side by the
// functions in /api (see .env.example). Whether the app is running on live or
// sample data is reported at runtime by services/serviceStatus.js.

export const STORAGE_KEYS = {
  UNIT: 'skyvault:unit',
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


