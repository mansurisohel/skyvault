import axios from 'axios';

const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';

let cache = null;
let cacheTime = 0;
const TTL_MS = 5 * 60 * 1000;

/**
 * Fetches the current list of RainViewer radar frames (recent past +
 * short-term nowcast). This is a free, keyless public API, so real animated
 * precipitation radar works even without an OpenWeather key.
 * Returns { host, frames: [{ time, path, isForecast }] } or null on failure.
 */
export async function fetchRadarFrames() {
  if (cache && Date.now() - cacheTime < TTL_MS) return cache;

  try {
    const { data } = await axios.get(RAINVIEWER_INDEX, { timeout: 8000 });
    const past = (data.radar?.past ?? []).map((f) => ({ ...f, isForecast: false }));
    const nowcast = (data.radar?.nowcast ?? []).map((f) => ({ ...f, isForecast: true }));
    const frames = [...past, ...nowcast];
    if (!frames.length) return null;

    const result = { host: data.host, frames };
    cache = result;
    cacheTime = Date.now();
    return result;
  } catch {
    return null;
  }
}

export function radarTileUrl(host, frame) {
  // 256px tiles, color scheme 2 (universal blue/green/red), smooth + snow enabled
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}
