# SkyVault — Weather Data

A premium, single-page weather app built with React 19, Vite, and Tailwind CSS. Search any city and scroll through live conditions, a multi-day forecast timeline, air quality, UV, hydration guidance, moon-phase activity ideas, sunrise/sunset, an interactive weather map, and location-aware news — all in one continuous, anchor-navigable page with a single cohesive dark theme built around animated weather backgrounds.

Runs fully in **demo mode** out of the box with realistic sample data, so you can explore every section before adding API keys.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Going live with real data

1. Copy `.env.example` to `.env`.
2. Add your keys:
   - `VITE_OPENWEATHER_API_KEY` — [openweathermap.org/api](https://openweathermap.org/api). The app deliberately uses only the endpoints included in every free-tier key — **Current Weather**, **5 Day / 3 Hour Forecast**, **Geocoding**, and **Air Pollution** — not One Call 3.0, which requires opting into a separate subscription even with a valid key (a common, silent cause of an app quietly falling back to demo data). One trade-off: the "daily" outlook is derived by grouping 3-hour forecast steps by day rather than a true daily endpoint, and weather alerts aren't available on this tier, so the Active Alerts section simply stays empty unless one is present some other way.
   - `VITE_GNEWS_API_KEY` — [gnews.io](https://gnews.io) and/or `VITE_NEWSDATA_API_KEY` — [newsdata.io](https://newsdata.io) (both optional; set either or both). GNews is tried first, then NewsData.io. News refreshes automatically every 5 minutes and whenever the tab regains focus. Without at least one key, or if both fail, the News section shows **Insights** — short briefs generated directly from the live weather snapshot (current conditions, today's outlook, UV, air quality, hydration, sun times, visibility, multi-day trend) rather than generic filler, and clearly labeled as generated rather than sourced journalism.
3. Restart the dev server.

The Preferences section (bottom of the page) shows live connection status for both keys at any time.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |

## Layout

SkyVault is a single page (`src/pages/Home.jsx`) made of anchor-linked sections, navigable from the sticky header or by scrolling:

- **Overview** — hero search, active alerts, current conditions, hourly strip
- **Forecast** — a multi-day outlook plus temperature/rain/wind/pressure charts
- **Health, moon & activities** — UV, air quality, an estimated pollen level, hydration guidance, moon-phase activity recommendations, a sunrise/sunset arc, a wind compass, and 18 outdoor activities (running, swimming, cycling, hiking, fishing, photography, and more) ranked live against the current condition, temperature, wind, and time of day
- **Live map** — precipitation/cloud/wind/temperature/pressure layers on a dark basemap, with a legend and fullscreen mode
- **News** — location-aware weather stories
- **Favorites** — saved cities with live mini-snapshots
- **Preferences** — units, search history, API key status

## Architecture

```
src/
  components/    UI building blocks, grouped by feature (dashboard, map, news, charts, animations, search, layout, common)
  pages/         Home.jsx — the single page that assembles every section
  context/        App-wide state: the central weather/location/favorites/history store
  hooks/          Reusable hooks (debounce, localStorage, scroll-spy, news fetching)
  services/       API clients (weather, geocoding, news) with caching + demo-data fallback
  utils/          Formatting, moon-phase astronomy, health-index heuristics, weather-condition helpers
  constants/      App-wide config and lookup tables
```

### Design notes

- **No dead ends.** Every data source (weather, geocoding, news) has a deterministic demo fallback, so a missing key, a rate limit, or a network error never leaves a section empty — it degrades gracefully with a visible notice.
- **Free-tier-accurate by design.** Built entirely on endpoints every free OpenWeather key can call — no silent "looks fine, secretly wrong" fallback caused by an unsubscribed One Call plan.
- **Location and time are real.** On a first-ever visit, the app quietly requests your actual position (falling back to a default city without any error if declined) rather than always opening to a fixed city. The animated background's morning/afternoon/evening/night state is computed from your location's actual sunrise/sunset, ticks live every minute, and the whole snapshot auto-refreshes every 10 minutes plus whenever the tab regains focus, so it doesn't quietly go stale.
- **Search understands "city, country."** Free-text queries are normalized before hitting the geocoding API (a full country name like "France" is mapped to its ISO code, since OpenWeather's geocoder only accepts codes), with a broadened fallback search and de-duplication if a qualified query comes back empty.
- **Live radar, not a snapshot.** The precipitation layer on the map is a real animated loop (recent past + short-term forecast frames) from RainViewer's free, keyless public API — play/pause and scrub the timeline. The other overlay layers (cloud/wind/temp/pressure) use OpenWeather's static map tiles, which don't have a free animated equivalent.
- **One theme, weather-driven.** There's no light/dark toggle — the animated background itself (clear, cloudy, rain, storm, snow, mist, fog, day/night) is what shifts the app's mood, so the "theme" is always tied to the actual forecast and wind conditions (a wind-streak overlay appears whenever the real wind speed crosses a windy threshold, independent of the main condition).
- **One instrument, many gauges.** The radial dial used for UV, air quality, and wind direction echoes the compass needle in the SkyVault mark, so the health and wind cards read as a single cohesive instrument panel.
- **Moon-phase guidance is astronomy, not an API.** Phase and illumination are computed from a standard synodic-month formula; activity suggestions are grounded in real, commonly cited reasoning (dark-sky visibility, solunar theory for fishing, lunar planting calendars) rather than invented claims.
- **Pollen and (sometimes) UV are labeled as estimates.** Free weather APIs don't expose real pollen data, and the dedicated UV endpoint is deprecated and inconsistently available — both fall back to clearly-labeled heuristics instead of being presented as measured data.
- **News is honest about what it is, and stays current.** With a GNews or NewsData.io key, articles refresh automatically every 5 minutes and on tab refocus. Without a key, or if both providers fail, the News section shows short insights generated directly from the live snapshot — genuinely relevant to the searched location, but labeled as generated rather than disguised as third-party journalism.
- **Animations are CSS-first.** Clouds, rain, snow, fog, and stars are driven by CSS transforms/keyframes rather than per-frame JavaScript, and everything respects `prefers-reduced-motion`.

## Tech stack

React 19 · Vite · Tailwind CSS 4 · Axios · Framer Motion · Lucide React · React Leaflet (OpenStreetMap + CARTO dark tiles) · Recharts · OpenWeather API · GNews API · NewsData.io API · ESLint · Prettier
