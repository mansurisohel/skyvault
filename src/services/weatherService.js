const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const getApiKey = () => import.meta.env.VITE_OPENWEATHER_API_KEY || '';

// Every OWM call goes through this: a hard timeout (so a slow/hung request
// can't leave stale data on screen indefinitely with no error shown) and
// one automatic retry on transient network failures (mobile connections in
// particular drop requests that succeed on a second attempt). Without this,
// "the weather looks wrong" is sometimes really "the last successful fetch
// was 20 minutes ago and silently never updated."
async function fetchWithTimeout(url, { timeoutMs = 8000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw new Error(lastErr?.name === 'AbortError' ? 'Request timed out — check your connection.' : 'Network error — check your connection.');
}

export async function fetchCurrentWeather(city, units = 'metric') {
  const key = getApiKey();
  const res = await fetchWithTimeout(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${key}&units=${units}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`City "${city}" not found.`);
    if (res.status === 401) throw new Error('Invalid API key. Check your .env file.');
    throw new Error('Failed to fetch weather data.');
  }
  return res.json();
}

export async function fetchForecast(city, units = 'metric') {
  const key = getApiKey();
  const res = await fetchWithTimeout(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${key}&units=${units}&cnt=40`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`City "${city}" not found.`);
    if (res.status === 401) throw new Error('Invalid API key. Check your .env file.');
    throw new Error('Failed to fetch forecast.');
  }
  return res.json();
}

export async function fetchWeatherByCoords(lat, lon, units = 'metric') {
  const key = getApiKey();
  const res = await fetchWithTimeout(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${key}&units=${units}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key. Check your .env file.');
    throw new Error('Failed to fetch weather by location.');
  }
  return res.json();
}

export async function fetchForecastByCoords(lat, lon, units = 'metric') {
  const key = getApiKey();
  const res = await fetchWithTimeout(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=${units}&cnt=40`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key. Check your .env file.');
    throw new Error('Failed to fetch forecast by location.');
  }
  return res.json();
}

export async function fetchAirQuality(lat, lon) {
  const key = getApiKey();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`, { retries: 0 });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null; // air quality is a nice-to-have — never block the rest of the app on it
  }
}

export async function searchCities(query) {
  const key = getApiKey();
  try {
    const res = await fetchWithTimeout(`${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${key}`, { timeoutMs: 5000, retries: 0 });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function parseCurrentWeather(data) {
  const utcOffset = data.timezone || 0;
  const localMs = (Math.floor(Date.now() / 1000) + utcOffset) * 1000;
  const localTime = new Date(localMs);
  const hour = localTime.getUTCHours();
  const isNight = hour < 6 || hour >= 20;

  return {
    city: data.name,
    country: data.sys?.country || '',
    lat: data.coord?.lat,
    lon: data.coord?.lon,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: Math.round(data.wind?.speed || 0),
    windDeg: data.wind?.deg || 0,
    windGust: Math.round(data.wind?.gust || 0),
    visibility: ((data.visibility || 0) / 1000).toFixed(1),
    clouds: data.clouds?.all || 0,
    description: data.weather[0]?.description || '',
    mainCondition: data.weather[0]?.main || '',
    iconCode: data.weather[0]?.icon || '01d',
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset,
    utcOffset,
    rainVolume: data.rain?.['1h'] || 0,
    snowVolume: data.snow?.['1h'] || 0,
    isNight,
    localTime,
    dewPoint: calculateDewPoint(data.main.temp, data.main.humidity),
  };
}

function calculateDewPoint(temp, humidity) {
  const a = 17.27, b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha));
}

export function parseForecast(data, utcOffset = 0) {
  const list = data.list || [];
  const byDay = {};
  list.forEach(item => {
    const localDate = new Date((item.dt + utcOffset) * 1000);
    const dayKey = `${localDate.getUTCFullYear()}-${localDate.getUTCMonth()}-${localDate.getUTCDate()}`;
    if (!byDay[dayKey]) byDay[dayKey] = [];
    byDay[dayKey].push(item);
  });

  // The free OWM /forecast endpoint returns 40 timestamps at 3-hour
  // intervals — 5 days, occasionally with a partial 6th day at the
  // boundary depending on what time the request lands. It can never
  // actually produce 7 distinct days; capping here (and labeling the UI
  // "5-Day Forecast") keeps the app honest about what the data backs up.
  const daily = Object.entries(byDay).slice(0, 6).map(([, items]) => {
    const temps = items.map(i => i.main.temp);
    const noonItem = items.reduce((closest, item) => {
      const h = new Date((item.dt + utcOffset) * 1000).getUTCHours();
      const prevH = new Date((closest.dt + utcOffset) * 1000).getUTCHours();
      return Math.abs(h - 12) < Math.abs(prevH - 12) ? item : closest;
    });
    const date = new Date((noonItem.dt + utcOffset) * 1000);
    return {
      dateMs: noonItem.dt * 1000,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      tempNoon: Math.round(noonItem.main.temp),
      humidity: noonItem.main.humidity,
      description: noonItem.weather[0]?.description || '',
      mainCondition: noonItem.weather[0]?.main || '',
      iconCode: noonItem.weather[0]?.icon || '01d',
      rainProb: Math.round((noonItem.pop || 0) * 100),
      windSpeed: Math.round(noonItem.wind?.speed || 0),
    };
  });

  const hourly = list.slice(0, 16).map(item => {
    const d = new Date((item.dt + utcOffset) * 1000);
    return {
      timeMs: item.dt * 1000,
      timeLabel: d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'UTC' }),
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind?.speed || 0),
      description: item.weather[0]?.description || '',
      mainCondition: item.weather[0]?.main || '',
      iconCode: item.weather[0]?.icon || '01d',
      rainProb: Math.round((item.pop || 0) * 100),
      rain: item.rain?.['3h'] || 0,
    };
  });

  return { daily, hourly };
}

export function getWindDirection(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function getMoonPhase(date = new Date()) {
  const known = new Date('2000-01-06T18:14:00Z'); // reference new moon (accurate to the hour)
  const cycle = 29.530588853; // synodic month, days
  const diff = (date - known) / (1000 * 60 * 60 * 24);
  const age = ((diff % cycle) + cycle) % cycle;        // days since last new moon, 0..cycle
  const angle = (age / cycle) * 2 * Math.PI;           // 0=new, π=full, 2π=new
  const illumination = Math.round(((1 - Math.cos(angle)) / 2) * 1000) / 10; // continuous %, one decimal
  const waxing = age < cycle / 2;

  let name;
  if (age < 1.85) name = 'New Moon';
  else if (age < 7.38) name = 'Waxing Crescent';
  else if (age < 9.22) name = 'First Quarter';
  else if (age < 14.77) name = 'Waxing Gibbous';
  else if (age < 16.61) name = 'Full Moon';
  else if (age < 22.15) name = 'Waning Gibbous';
  else if (age < 23.99) name = 'Last Quarter';
  else name = 'Waning Crescent';

  return { name, pct: Math.round(illumination), illumination, angle, waxing, age: Math.round(age * 10) / 10 };
}

export function getUVIndex(lat, clouds, hour) {
  const maxUV = Math.max(0, 11 - Math.abs(lat) / 10);
  const solarFactor = Math.max(0, Math.sin((Math.PI * (hour - 6)) / 12));
  const cloudFactor = 1 - (clouds / 100) * 0.7;
  return Math.round(maxUV * solarFactor * cloudFactor * 10) / 10;
}

export function getUVLabel(uv) {
  if (uv <= 2) return { label: 'Low', color: '#4ade80' };
  if (uv <= 5) return { label: 'Moderate', color: '#facc15' };
  if (uv <= 7) return { label: 'High', color: '#fb923c' };
  if (uv <= 10) return { label: 'Very High', color: '#f87171' };
  return { label: 'Extreme', color: '#c084fc' };
}

export function getAQILabel(aqi) {
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['#4ade80', '#a3e635', '#facc15', '#fb923c', '#f87171'];
  const idx = Math.min((aqi || 1) - 1, 4);
  return { label: labels[idx], color: colors[idx] };
}

export function getWeatherBackground(condition, isNight) {
  if (isNight) return 'night';
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder')) return 'thunderstorm';
  if (c.includes('snow') || c.includes('sleet') || c.includes('blizzard')) return 'snow';
  if (c.includes('rain') || c.includes('drizzle')) return 'rain';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist') || c.includes('haze')) return 'cloudy';
  return 'sunny';
}

export function formatTime(unixTs, utcOffset) {
  if (!unixTs) return '--';
  const d = new Date((unixTs + utcOffset) * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
}

export function generateAIRecommendations(weather, aqi) {
  if (!weather) return [];
  const { temperature, mainCondition, humidity, windSpeed, uvIndex, isNight } = weather;
  const recs = [];
  const c = (mainCondition || '').toLowerCase();

  if (c.includes('rain') || c.includes('thunder') || c.includes('drizzle')) {
    recs.push({ icon: 'umbrella', text: 'Carry an umbrella — precipitation expected today.' });
  } else if (c.includes('clear') && !isNight) {
    recs.push({ icon: 'sun', text: 'Great day for outdoor activities — skies are clear.' });
  }

  if (uvIndex >= 6) {
    recs.push({ icon: 'shield', text: `UV index is ${uvIndex} (${getUVLabel(uvIndex).label}). Apply SPF 30+ sunscreen.` });
  }

  if (temperature >= 35) {
    recs.push({ icon: 'droplets', text: 'Heat advisory: Stay hydrated — drink water every 30 minutes outdoors.' });
  } else if (temperature <= 5) {
    recs.push({ icon: 'thermometer', text: 'Cold conditions: Wear thermal layers and cover extremities.' });
  }

  if (windSpeed > 10) {
    recs.push({ icon: 'wind', text: `Windy at ${windSpeed} m/s — avoid cycling or outdoor sports.` });
  }

  if (humidity > 80) {
    recs.push({ icon: 'cloud', text: 'High humidity — expect discomfort; light breathable clothing recommended.' });
  }

  if (aqi && aqi > 3) {
    recs.push({ icon: 'alert-triangle', text: 'Air quality is poor today. Limit outdoor exercise and wear a mask.' });
  }

  if (c.includes('clear') && !isNight && uvIndex < 4) {
    recs.push({ icon: 'activity', text: 'Ideal conditions for a morning run or outdoor workout.' });
  }

  if (recs.length === 0) {
    recs.push({ icon: 'check-circle', text: 'Conditions look comfortable today. Enjoy your day.' });
  }

  return recs;
}

// ── Time-of-day bucket, independent of weather condition. Drives the base
// sky gradient + which ambient elements (stars, sun position, birds) show.
export function getTimeBucket(localHour) {
  if (localHour >= 5  && localHour < 7)  return 'sunrise';
  if (localHour >= 7  && localHour < 11) return 'morning';
  if (localHour >= 11 && localHour < 16) return 'afternoon';
  if (localHour >= 16 && localHour < 19) return 'sunset';
  if (localHour >= 19 && localHour < 23) return 'night';
  return 'midnight'; // 23:00–05:00
}

// ── Ambient UI theme: derives CSS custom properties from the current scene
// + time-of-day so the interface itself (card tint, full-screen wash) shifts
// with the weather, not just the animated background behind it. This is the
// mechanism that fixes "the UI always looks like night regardless of
// conditions" — daytime + sunny now visibly warms the whole UI, rain/cloud
// visibly cools and mutes it, and night stays close to neutral since a dark
// UI genuinely is correct after dark.
const AMBIENT_PALETTE = {
  sunny:         { wash: '255,196,110', card: '255,214,150' },
  hot:           { wash: '255,150,70',  card: '255,180,110' },
  partly:        { wash: '255,205,140', card: '255,220,170' },
  cloudy:        { wash: '170,182,200', card: '190,200,214' },
  windy:         { wash: '160,195,205', card: '180,205,214' },
  rain:          { wash: '110,140,180', card: '130,155,190' },
  drizzle:       { wash: '130,155,185', card: '150,170,195' },
  'heavy-rain':  { wash: '80,105,150',  card: '100,125,165' },
  thunder:       { wash: '90,70,140',   card: '110,90,155' },
  'rain-sun':    { wash: '220,195,140', card: '230,205,160' },
  snow:          { wash: '200,215,235', card: '210,222,240' },
  blizzard:      { wash: '210,225,240', card: '218,230,245' },
  fog:           { wash: '175,180,190', card: '185,190,198' },
  dust:          { wash: '200,150,90',  card: '210,165,105' },
  'extreme-cold':{ wash: '190,215,240', card: '200,222,244' },
  rainbow:       { wash: '230,205,150', card: '235,212,165' },
  cold:          { wash: '170,195,220', card: '185,205,225' },
  night:         { wash: '120,120,160', card: '130,130,165' },
};
const TIME_INTENSITY = { sunrise: 0.55, morning: 0.75, afternoon: 0.9, sunset: 0.65, night: 0.22, midnight: 0.12 };

export function getAmbientTheme(scene, timeBucket) {
  const p = AMBIENT_PALETTE[scene] || AMBIENT_PALETTE.sunny;
  const intensity = TIME_INTENSITY[timeBucket] ?? 0.6;
  const washOp = (0.10 * intensity).toFixed(3);
  const cardOp = (0.05 * intensity).toFixed(3);
  return {
    '--amb-wash': `rgba(${p.wash},${washOp})`,
    '--amb-card': `rgba(${p.card},${cardOp})`,
  };
}

// ── Season, adjusted for hemisphere (southern hemisphere is offset 6 months).
export function getSeason(lat, date = new Date()) {
  const month = date.getUTCMonth(); // 0-11
  const north = (lat ?? 0) >= 0;
  const bands = north
    ? ['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter']
    : ['summer','summer','autumn','autumn','autumn','winter','winter','winter','spring','spring','spring','summer'];
  return bands[month];
}

// ── Weather "mood" key — the particle/atmosphere layer that sits above the
// time-of-day sky. Accepts the full parsed weather object so it can react to
// wind speed, humidity and recent precipitation, not just the OWM label.
export function getWeatherScene(weather) {
  if (!weather) return 'sunny';
  const { mainCondition, isNight, temperature: temp, localTime, windSpeed, clouds, rainVolume } = weather;
  const localHour = localTime ? localTime.getUTCHours() : 12;
  const c = (mainCondition || '').toLowerCase();

  // Precipitation takes priority regardless of time of day.
  if (c.includes('thunder') || c.includes('storm')) return 'thunder';
  if (c.includes('snow') || c.includes('sleet')) {
    if (windSpeed > 12) return 'blizzard';
    return 'snow';
  }
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) {
    if (!isNight && clouds < 55) return 'rain-sun';       // sunshine breaking through rain
    if ((rainVolume || 0) > 4 || windSpeed > 10) return 'heavy-rain';
    if (c.includes('drizzle')) return 'drizzle';
    return 'rain';
  }
  // Clear-after-rain: recent rainfall registered but sky has cleared.
  if ((rainVolume || 0) > 0 && c.includes('clear')) return 'rainbow';

  // Atmosphere
  if (c.includes('dust') || c.includes('sand')) return 'dust';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze') || c.includes('smoke')) return 'fog';
  if (c.includes('overcast')) return 'cloudy';
  if (c.includes('cloud') && !c.includes('few') && !c.includes('scattered')) return 'cloudy';
  if (c.includes('few cloud') || c.includes('scattered') || c.includes('partly')) return 'partly';

  // Wind, independent of cloud cover, when nothing else dominates.
  if (windSpeed > 9 && !isNight) return 'windy';

  // Temperature extremes.
  if (temp !== undefined && temp <= -8) return 'extreme-cold';
  if (temp !== undefined && temp >= 36) return 'hot';
  if (temp !== undefined && temp <= 1)  return 'cold';

  // Clear sky — let the time-of-day layer carry the visual weight.
  if (isNight || localHour < 5 || localHour >= 21) return 'night';
  return 'sunny';
}

// Interpolates between score color stops for a smooth green -> amber -> red
// gradient rather than 4 discrete buckets. Stops chosen to match the design
// tokens --score-excellent / -good / -fair / -poor / -bad in index.css.
const SCORE_STOPS = [
  { at: 100, hex: '#34d399' }, // excellent — emerald
  { at: 75,  hex: '#86efac' }, // good — light green
  { at: 50,  hex: '#fbbf24' }, // fair — amber
  { at: 25,  hex: '#fb923c' }, // poor — orange
  { at: 0,   hex: '#f87171' }, // bad — red
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(score) {
  const clamped = Math.max(0, Math.min(100, score));
  for (let i = 0; i < SCORE_STOPS.length - 1; i++) {
    const hi = SCORE_STOPS[i], lo = SCORE_STOPS[i + 1];
    if (clamped <= hi.at && clamped >= lo.at) {
      const t = (clamped - lo.at) / (hi.at - lo.at);
      const [r1, g1, b1] = hexToRgb(lo.hex);
      const [r2, g2, b2] = hexToRgb(hi.hex);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return SCORE_STOPS[0].hex;
}

function scoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Avoid';
}

export function getLifestyleRatings(weather, aqi) {
  if (!weather) return [];
  const { temperature, mainCondition, windSpeed, humidity, uvIndex } = weather;
  const c = (mainCondition || '').toLowerCase();
  const isRain = c.includes('rain') || c.includes('drizzle') || c.includes('thunder');
  const isSnow = c.includes('snow');
  const aqiVal = aqi?.main?.aqi || 1;

  // Each underlying factor still scores 0-4 internally (same tuning as
  // before), then the weighted average is rescaled to 0-100 for display.
  function score(vals) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length; // 0-4
    const pct = Math.round((avg / 4) * 100);                   // 0-100
    return { score: pct, label: scoreLabel(pct), color: lerpColor(pct) };
  }

  const tempOk = temperature >= 10 && temperature <= 28 ? 4 : temperature >= 5 && temperature <= 35 ? 2 : 0;
  const windOk = windSpeed < 5 ? 4 : windSpeed < 10 ? 3 : windSpeed < 15 ? 1 : 0;
  const rainOk = isRain ? 0 : isSnow ? 1 : 4;
  const aqiOk = aqiVal <= 1 ? 4 : aqiVal <= 2 ? 3 : aqiVal <= 3 ? 2 : aqiVal <= 4 ? 1 : 0;
  const uvOk = (uvIndex || 0) <= 3 ? 4 : (uvIndex || 0) <= 6 ? 2 : 0;
  const humOk = humidity < 40 ? 3 : humidity < 70 ? 4 : humidity < 85 ? 2 : 0;

  return [
    { activity: 'Running',   ...score([tempOk, windOk, rainOk, aqiOk]) },
    { activity: 'Cycling',   ...score([tempOk, windOk, rainOk, aqiOk]) },
    { activity: 'Gardening', ...score([tempOk, rainOk, uvOk, humOk]) },
    { activity: 'Picnic',    ...score([tempOk, windOk, rainOk, uvOk]) },
    { activity: 'Swimming',  ...score([tempOk >= 3 ? 4 : 0, rainOk, uvOk]) },
    { activity: 'Hiking',    ...score([tempOk, windOk, rainOk, aqiOk, uvOk]) },
  ];
}
