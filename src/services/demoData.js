// Generates realistic, internally-consistent demo weather data so the app
// is fully explorable without API keys. Swapped out automatically the
// moment VITE_OPENWEATHER_API_KEY is set (see services/weatherService.js).

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seedFromCoords(lat, lon) {
  return Math.floor(Math.abs(lat * 1000 + lon * 1000)) + 1;
}

const CONDITIONS = [
  { id: 800, main: 'Clear', description: 'clear sky', icon: '01' },
  { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03' },
  { id: 500, main: 'Rain', description: 'light rain', icon: '10' },
  { id: 200, main: 'Thunderstorm', description: 'thunderstorm', icon: '11' },
  { id: 600, main: 'Snow', description: 'light snow', icon: '13' },
  { id: 701, main: 'Mist', description: 'mist', icon: '50' },
  { id: 741, main: 'Fog', description: 'fog', icon: '50' },
];

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function kmhToMph(kmh) {
  return kmh * 0.621371;
}

// Recursively converts every temp-shaped and wind_speed-shaped value in the
// demo snapshot from the internal metric baseline to imperial, so the C/F
// toggle actually does something when no API key is configured.
function convertToImperial(snapshot) {
  const convertTemp = (t) => Math.round(celsiusToFahrenheit(t) * 10) / 10;
  const convertWind = (w) => Math.round(kmhToMph(w) * 10) / 10;

  const convertEntry = (entry) => ({
    ...entry,
    ...(entry.temp !== undefined && typeof entry.temp === 'number' ? { temp: convertTemp(entry.temp) } : {}),
    ...(entry.temp && typeof entry.temp === 'object'
      ? { temp: { ...entry.temp, min: convertTemp(entry.temp.min), max: convertTemp(entry.temp.max), ...(entry.temp.day !== undefined ? { day: convertTemp(entry.temp.day) } : {}) } }
      : {}),
    ...(entry.feels_like !== undefined ? { feels_like: convertTemp(entry.feels_like) } : {}),
    ...(entry.wind_speed !== undefined ? { wind_speed: convertWind(entry.wind_speed) } : {}),
    ...(entry.wind_gust !== undefined && entry.wind_gust !== null ? { wind_gust: convertWind(entry.wind_gust) } : {}),
  });

  return {
    ...snapshot,
    current: convertEntry(snapshot.current),
    hourly: snapshot.hourly.map(convertEntry),
    daily: snapshot.daily.map(convertEntry),
  };
}

export function buildDemoWeather(lat, lon, name = 'Demo City', units = 'metric') {
  const rand = seededRandom(seedFromCoords(lat, lon));
  const now = Math.floor(Date.now() / 1000);
  const timezoneOffset = Math.round((lon / 15) * 3600);

  const baseTemp = 12 + rand() * 18 - (Math.abs(lat) / 90) * 10;
  const conditionIdx = Math.floor(rand() * CONDITIONS.length);
  const condition = CONDITIONS[conditionIdx];

  const hour = new Date((now + timezoneOffset) * 1000).getUTCHours();
  const isNight = hour < 6 || hour > 19;
  const icon = `${condition.icon}${isNight ? 'n' : 'd'}`;

  const current = {
    dt: now,
    temp: baseTemp,
    feels_like: baseTemp + (rand() * 4 - 2),
    humidity: Math.round(40 + rand() * 50),
    pressure: Math.round(995 + rand() * 30),
    visibility: Math.round(6000 + rand() * 4000),
    uvi: Math.max(0, Math.round((isNight ? 0 : rand() * 10) * 10) / 10),
    uviEstimated: true,
    wind_speed: Math.round(rand() * 30 * 10) / 10,
    wind_gust: null, // set below, once wind_speed is known
    wind_deg: Math.round(rand() * 360),
    clouds: Math.round(rand() * 100),
    sunrise: now - (hour * 3600) + 6 * 3600 - timezoneOffset,
    sunset: now - (hour * 3600) + 19 * 3600 - timezoneOffset,
    weather: [{ ...condition, icon }],
    rainVolume: condition.main === 'Rain' ? Math.round(rand() * 8 * 10) / 10
      : condition.main === 'Thunderstorm' ? Math.round((6 + rand() * 14) * 10) / 10 : 0,
    snowVolume: condition.main === 'Snow' ? Math.round(rand() * 4 * 10) / 10 : 0,
  };
  current.wind_gust = rand() > 0.4 ? Math.round((current.wind_speed + 5 + rand() * 15) * 10) / 10 : null;

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const t = now + i * 3600;
    const h = new Date((t + timezoneOffset) * 1000).getUTCHours();
    const night = h < 6 || h > 19;
    const cIdx = Math.floor(rand() * CONDITIONS.length);
    const c = i === 0 ? condition : CONDITIONS[cIdx];
    return {
      dt: t,
      temp: baseTemp + Math.sin(i / 3) * 4 + (rand() * 2 - 1),
      feels_like: baseTemp + Math.sin(i / 3) * 4,
      pop: Math.round(rand() * 100) / 100,
      wind_speed: Math.round(rand() * 25 * 10) / 10,
      humidity: Math.round(40 + rand() * 50),
      weather: [{ ...c, icon: `${c.icon}${night ? 'n' : 'd'}` }],
    };
  });

  const daily = Array.from({ length: 7 }, (_, i) => {
    const t = now + i * 86400;
    const cIdx = Math.floor(rand() * CONDITIONS.length);
    const c = i === 0 ? condition : CONDITIONS[cIdx];
    const dayMax = baseTemp + rand() * 6;
    return {
      dt: t,
      temp: {
        min: dayMax - 6 - rand() * 3,
        max: dayMax,
        day: dayMax - 2,
      },
      pop: Math.round(rand() * 100) / 100,
      humidity: Math.round(40 + rand() * 50),
      wind_speed: Math.round(rand() * 25 * 10) / 10,
      pressure: Math.round(995 + rand() * 30),
      uvi: Math.round(rand() * 10 * 10) / 10,
      sunrise: t + 6 * 3600 - timezoneOffset,
      sunset: t + 19 * 3600 - timezoneOffset,
      weather: [{ ...c, icon: `${c.icon}d` }],
    };
  });

  const aqi = Math.min(5, Math.max(1, Math.round(rand() * 5)));
  const airQuality = {
    aqi,
    components: {
      co: Math.round(rand() * 500) / 10,
      no2: Math.round(rand() * 60),
      o3: Math.round(rand() * 120),
      pm2_5: Math.round(rand() * 60),
      pm10: Math.round(rand() * 80),
      so2: Math.round(rand() * 20),
    },
  };

  const alerts = rand() > 0.75 ? [{
    sender_name: 'SkyVault Advisory',
    event: condition.main === 'Thunderstorm' ? 'Severe Thunderstorm Warning' : 'Wind Advisory',
    start: now,
    end: now + 6 * 3600,
    description: condition.main === 'Thunderstorm'
      ? 'Strong thunderstorms capable of frequent lightning and gusty winds are expected to move through the area. Secure loose outdoor objects and avoid open areas.'
      : 'Sustained winds of 25-35 km/h with higher gusts are expected. Use caution when driving high-profile vehicles.',
  }] : [];

  const snapshot = {
    location: { name, lat, lon, timezoneOffset },
    current,
    hourly,
    daily,
    airQuality,
    alerts,
    isDemo: true,
  };

  return units === 'imperial' ? convertToImperial(snapshot) : snapshot;
}

export function buildDemoGeocode(query) {
  const catalog = [
    { name: 'New York', state: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
    { name: 'London', state: '', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', state: '', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', state: '', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'Ahmedabad', state: 'Gujarat', country: 'IN', lat: 23.0225, lon: 72.5714 },
    { name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.076, lon: 72.8777 },
    { name: 'Sydney', state: 'New South Wales', country: 'AU', lat: -33.8688, lon: 151.2093 },
    { name: 'Dubai', state: '', country: 'AE', lat: 25.2048, lon: 55.2708 },
    { name: 'Cape Town', state: '', country: 'ZA', lat: -33.9249, lon: 18.4241 },
    { name: 'Toronto', state: 'Ontario', country: 'CA', lat: 43.6532, lon: -79.3832 },
    { name: 'Singapore', state: '', country: 'SG', lat: 1.3521, lon: 103.8198 },
    { name: 'Reykjavik', state: '', country: 'IS', lat: 64.1466, lon: -21.9426 },
  ];
  const q = query.trim().toLowerCase().split(',')[0].trim();
  if (!q) return [];
  return catalog.filter((c) => c.name.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q));
}
