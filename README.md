# SkyVault Weather

A React + Vite weather dashboard: live conditions, hourly and 5-day forecasts, air quality,
UV, sunrise/sunset, an interactive Leaflet map with animated rain radar, weather news, favorites
and search.

All third-party API keys stay on the server. The browser only talks to this app's own `/api/*`
routes (Vercel serverless functions in production, the same files served by Vite locally).

```
Browser ──► /api/weather   ──► OpenWeather (current + forecast + air quality) + Open-Meteo (UV)
        ├─► /api/geocode   ──► OpenWeather geocoding
        ├─► /api/tiles     ──► OpenWeather map tiles   (so the key is never in a tile URL)
        ├─► /api/news      ──► GNews
        └─► api.rainviewer.com / tilecache.rainviewer.com   (public radar, no key)
```

---

## 1. Quick start (Windows + VS Code)

Requires **Node.js 20.19 or newer** (22 LTS recommended). Check with `node -v`.

In **PowerShell** (or the VS Code terminal, ``Ctrl+` ``):

```powershell
cd C:\path\to\skyvault-app
npm install
copy .env.example .env      # then open .env and paste your keys
code .                      # opens VS Code (optional)
npm run dev                 # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload **and** the `/api/*` routes |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally, including `/api/*` |
| `npm run lint` | ESLint |
| `npm test` | Unit + API + component tests (Vitest) |

If `.env` has no keys, the app starts in **demo mode**: sample data, labeled "Sample data" in the UI.

## 2. Environment variables

| Variable | Required | Visibility | Used by |
| --- | --- | --- | --- |
| `OPENWEATHER_API_KEY` | For live weather | **Private (server only)** | `api/weather`, `api/geocode`, `api/tiles` |
| `GNEWS_API_KEY` | For live news | **Private (server only)** | `api/news` |

There are **no public (browser-visible) variables**. `vite.config.js` sets `envPrefix: 'VITE_PUBLIC_'`,
so even a mistakenly named `VITE_...` secret can never be bundled into client code.

Legacy names (`VITE_OPENWEATHER_API_KEY`, `VITE_GNEWS_DEV_KEY`) are still read by the **server** so
existing setups keep working, but they log a rename hint. Rename them.

## 3. Deploy to Vercel

1. Make sure `.env` is **not** committed: `git status` should not list it (it is in `.gitignore`).
2. Push the project to GitHub/GitLab/Bitbucket.
3. In Vercel: **Add New → Project → Import** the repository. Vercel detects **Vite** automatically.
   Leave Build Command (`vite build`) and Output Directory (`dist`) on their defaults.
4. Open **Settings → Environment Variables** and add, for *Production*, *Preview* and *Development*:
   - `OPENWEATHER_API_KEY`
   - `GNEWS_API_KEY`
5. Click **Deploy**. Environment variable changes only apply to **new** deployments, so redeploy
   after changing them.
6. Verify: open `https://<your-app>.vercel.app/api/weather?lat=51.5&lon=-0.12`. You should see JSON.
   `{"error":{"code":"NO_API_KEY",...}}` means the variable is missing or the deployment predates it;
   `KEY_REJECTED` means OpenWeather refused the key.

No `rewrites` are needed: the app is a single page, `api/*.js` files become functions automatically,
and `vercel.json` only adds security headers (CSP, nosniff, frame-ancestors, referrer, permissions)
and long-lived caching for hashed assets. If you add new third-party hosts, update the
`Content-Security-Policy` in `vercel.json`.

## 4. If a key was ever exposed: rotate it

Keys that were in a `.env` that got shared (for example inside a ZIP), committed to Git, or built into
a public JavaScript bundle must be treated as compromised, even if you removed them afterwards:

1. **OpenWeather**: account → *API keys* → generate a new key, then delete the old one.
2. **GNews**: dashboard → regenerate the API key.
3. Put the new values in your local `.env` and in Vercel (*Environment Variables*), then **redeploy**.
4. If a key was committed to Git, rotating is what protects you; rewriting history (`git filter-repo`
   or BFG) is optional cleanup afterwards.

Earlier versions of this project compiled both keys into the shipped JavaScript. This version does not.

## 5. Data sources, limits and attribution

| Data | Provider | Notes |
| --- | --- | --- |
| Current weather, 5-day/3-hour forecast, air quality, geocoding, map layers | OpenWeather | Free plan: 60 calls/min. Geocoding returns at most 5 matches. The free forecast has 3-hour steps (the hourly strip smooths between real points; the daily view groups them by local day). |
| UV index | Open-Meteo | Keyless. Free for **non-commercial** use (CC BY 4.0), so check their terms for commercial deployments. OpenWeather retired its own UV endpoint in 2021. If Open-Meteo is unreachable the UI shows a value labeled "(est.)". |
| Rain radar | RainViewer | Past ~2 hours, 10-minute steps, tiles up to **zoom 7** (the map upscales beyond that). |
| News | GNews | Free plan: 100 requests/day, 1/second, 10 articles per request. The server query is general and CDN-cached so visitors share one request. |
| Base map | CARTO / OpenStreetMap | Attribution shown on the map. Review CARTO's usage terms for high-traffic or commercial use. |

Rules the app follows: it never invents live readings; sample data is always labeled; failed live
requests show an error with a retry (they do not silently fall back to fake data); news is never
fabricated, and generated "insights" are labeled as such.

## 6. Troubleshooting

- **"Sample data" banner**: no `OPENWEATHER_API_KEY` on the server. Add it and restart `npm run dev`
  (or redeploy on Vercel).
- **401 / "rejected the API key"** right after creating an OpenWeather key: new keys can take up to a
  couple of hours to activate.
- **News shows generated insights**: the message under "Weather news" says why (missing key, daily quota
  of 100 requests, rate limit, offline).
- **Weather layers say they need a key**: only the Precipitation tab's radar works without a key.
- **API routes "not reachable"**: you opened a static copy of `dist/` (for example from a file server).
  Use `npm run preview` or deploy to Vercel.
- **Location button**: the browser only asks for permission after you click it. If it was blocked,
  re-enable it in the site settings (lock icon in the address bar).

## 7. Project layout

```
api/                 Vercel serverless functions (server-only code; _lib/ holds shared helpers)
scripts/             Vite plugin that serves api/ during dev and preview
src/services/        API client (retry/timeout/abort/dedupe), weather, geocoding, news, radar
src/context/         WeatherContext: selection, race-safe loading, unit conversion, favorites
src/components/map/  Leaflet map, imperative radar layer, overlays, legends
src/utils/units.js   The single place °C/°F, km/h/mph and mm/in conversions happen
tests/               Vitest suites: API handlers, services/utilities, context
```

Weather is stored in metric and converted for display, so switching °C/°F never refetches and values
can never be left in mixed units.
