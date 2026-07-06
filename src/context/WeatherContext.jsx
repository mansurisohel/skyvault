import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchWeatherByCoords,
  fetchForecastByCoords,
  fetchAirQuality,
  parseCurrentWeather,
  parseForecast,
  getWeatherScene,
  getTimeBucket,
  getSeason,
  getUVIndex,
  generateAIRecommendations,
} from '../services/weatherService';

const WeatherContext = createContext(null);

export function WeatherProvider({ children }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [units, setUnits] = useState(() => localStorage.getItem('wx_units') || 'metric');
  const [scene, setScene] = useState('sunny');
  const [timeBucket, setTimeBucket] = useState(() => getTimeBucket(new Date().getHours()));
  const [season, setSeason] = useState(() => getSeason(20, new Date()));
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wx_favorites') || '[]'); } catch { return []; }
  });
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wx_recent') || '[]'); } catch { return []; }
  });
  const [aiRecs, setAiRecs] = useState([]);
  const [uvIndex, setUvIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem('wx_units', units);
  }, [units]);

  useEffect(() => {
    localStorage.setItem('wx_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('wx_recent', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const processWeatherData = useCallback((currentData, forecastData, aqData) => {
    const parsed = parseCurrentWeather(currentData);
    const parsedForecast = parseForecast(forecastData, parsed.utcOffset);

    const localHour = parsed.localTime.getUTCHours();
    const uv = getUVIndex(parsed.lat, parsed.clouds, localHour);
    const enriched = { ...parsed, uvIndex: uv };

    const aqi = aqData?.list?.[0]?.main?.aqi || null;
    const recs = generateAIRecommendations(enriched, aqi);

    setWeather(enriched);
    setForecast(parsedForecast);
    setAirQuality(aqData?.list?.[0] || null);
    setUvIndex(uv);
    setAiRecs(recs);
    setScene(getWeatherScene(enriched));
    setTimeBucket(getTimeBucket(localHour));
    setSeason(getSeason(parsed.lat, parsed.localTime));
  }, []);

  const searchWeather = useCallback(async (city) => {
    if (!city?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [currentData, forecastData] = await Promise.all([
        fetchCurrentWeather(city, units),
        fetchForecast(city, units),
      ]);
      const aqData = await fetchAirQuality(currentData.coord.lat, currentData.coord.lon).catch(() => null);
      processWeatherData(currentData, forecastData, aqData);

      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== city.toLowerCase());
        return [city, ...filtered].slice(0, 8);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [units, processWeatherData]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const position = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lon } = position.coords;
      const [currentData, forecastData] = await Promise.all([
        fetchWeatherByCoords(lat, lon, units),
        fetchForecastByCoords(lat, lon, units),
      ]);
      const aqData = await fetchAirQuality(lat, lon).catch(() => null);
      processWeatherData(currentData, forecastData, aqData);
    } catch (err) {
      setError(err.code === 1 ? 'Location access denied. Please search manually.' : 'Could not detect location.');
    } finally {
      setLoading(false);
    }
  }, [units, processWeatherData]);

  const refreshWeather = useCallback(async () => {
    if (!weather) return;
    await searchWeather(weather.city);
  }, [weather, searchWeather]);

  const toggleFavorite = useCallback((city) => {
    setFavorites(prev =>
      prev.includes(city) ? prev.filter(f => f !== city) : [...prev, city]
    );
  }, []);

  const toggleUnits = useCallback(() => {
    setUnits(prev => prev === 'metric' ? 'imperial' : 'metric');
  }, []);

  // Re-fetch when units change and we have a city
  useEffect(() => {
    if (weather?.city) {
      searchWeather(weather.city);
    }
  }, [units]); // eslint-disable-line

  // Automatic background refresh every 10 minutes — OWM's own data updates
  // on a similar cadence, and without this the app only ever re-fetches on
  // a manual action, silently going stale the longer a tab stays open.
  // Also re-syncs immediately when the tab regains focus/visibility after
  // being backgrounded, since a laptop woken from sleep after hours away
  // shouldn't keep showing whatever was last fetched.
  useEffect(() => {
    if (!weather?.city) return;
    const interval = setInterval(() => { searchWeather(weather.city); }, 10 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') searchWeather(weather.city);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.city]);

  return (
    <WeatherContext.Provider value={{
      weather, forecast, airQuality, loading, error,
      units, scene, timeBucket, season, favorites, recentSearches,
      aiRecs, uvIndex,
      searchWeather, detectLocation, refreshWeather,
      toggleFavorite, toggleUnits,
      setError,
    }}>
      {children}
    </WeatherContext.Provider>
  );
}

export const useWeather = () => {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used inside WeatherProvider');
  return ctx;
};
