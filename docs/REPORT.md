# SkyVault: Audit, Fixes and Test Report

Date of work: 15 Oct 2026. Original project: `skyvault-app.zip`. Setup/deploy commands are in `README.md`.

## 1. Summary of the original project's problems

The app built and linted (8 warnings), but it had a security problem, several correctness bugs and a
non-working radar. The most serious findings, all verified by evidence rather than assumption:

1. **Both API keys were compiled into the public JavaScript** (`define` in `vite.config.js`, plus `VITE_GNEWS_DEV_KEY`). A
   string search of the original `dist/` found each key value once. A real-looking `.env` was also inside the ZIP.
2. **Radar was blank at the default zoom.** RainViewer serves tiles only up to **zoom 7** (official docs); the code used 9 and
   opened the map at zoom 10.
3. **UV index was never real.** OpenWeather retired its UV endpoint in April 2021; the code silently swallowed the failure and
   showed an estimate.
4. **Stale data and race conditions**: a slow earlier response could overwrite a newer city, and during any city switch (or
   after a failed one) the *new* city's name was shown over the *old* city's weather.
5. Dead code: six unreachable pages importing an uninstalled router and a non-existent export.

## 2. Root cause and fix for every identified issue

### Security / configuration
| # | Problem | Root cause | Fix |
|---|---|---|---|
| 1 | Keys visible in shipped JS | `define` injected `VITE_OPENWEATHER_API_KEY`; dev GNews key used `VITE_` prefix | All provider calls go through `api/*` functions; keys read from server env only; `envPrefix: 'VITE_PUBLIC_'` so no `VITE_*` secret can reach the client. **Verified: 0 key hits in new `dist/`, with the real `.env` present at build time.** |
| 2 | `.env` with real keys in the ZIP | Packaging | `.env` excluded from the deliverable. **You must rotate both keys** (README section 4). |
| 3 | API key inside `sessionStorage` cache keys | `cachedGet` keyed on full params incl. `appid` | Cache is memory-only and keyed on keyless URLs |
| 4 | News broken in `npm run dev` | No `/api/news` route without the Vercel runtime | `scripts/vite-api-plugin.js` serves `api/*` in `dev` and `preview` using server-side env |
| 5 | Unvalidated upstream error text and bodies | `api/news.js` echoed upstream status/detail | Safe error codes/messages, no upstream bodies, no URLs, 8 s timeouts, method checks, input validation |
| 6 | Open-ended inputs | Free text/coordinates passed through | Strict coordinate/zoom/layer allow-lists; sanitized queries |

### Weather data
| # | Problem | Root cause | Fix |
|---|---|---|---|
| 7 | UV always an estimate | Retired OpenWeather UV endpoint | Real UV from Open-Meteo (server-side); estimate still labeled "(est.)" |
| 8 | Geocoding asked for 8 results | OpenWeather max is 5 | `limit=5` |
| 9 | Older response overwrites newer city | No cancellation or request ordering | Request ids + `AbortController`; reference-counted abort in the API client |
| 10 | New city name over old weather | `location` updated immediately, `snapshot` later | `isStale`; Home shows skeleton/error instead |
| 11 | Failed load looked like success | Error ignored when an old snapshot existed | Error state with Retry; background refresh failures are non-destructive notices |
| 12 | Denied geolocation wiped the dashboard; permission prompt at page load | Shared `error` state; unconditional auto-locate | Separate `locationError` with specific messages; no prompt until the user clicks (auto-use only if permission was already granted) |
| 13 | Today's High below current temperature; last day a 1-slot "day" | Only remaining 3-hour slots were aggregated | Include current temp; drop partial trailing day |
| 14 | "Now" hourly tile ≠ big temperature | Tile used the first forecast slot | First tile is the current observation |
| 15 | Invented values (visibility 10 km, wind from N, 1013 hPa) | `?? default` fallbacks | `null` and "--"; never fabricated |
| 16 | °C/°F inconsistencies | Refetch per toggle; "windy" test compared mph to km/h; duplicate conversions; background wind in wrong unit | Metric baseline + one converter (`utils/units.js`); no refetch on toggle |
| 17 | Pollen season wrong | Browser month, northern-hemisphere bias | Location-local month and hemisphere |
| 18 | Favorites: 4 requests each, errors swallowed, skeleton forever | Full snapshot per card, `catch(() => {})` | One lightweight request, error + Retry |
| 19 | Chart label "Gusting to" | Computed from sustained wind | Renamed "Peak" |
| 20 | Search showed **made-up cities** on a failed request | `searchLocations` swallowed errors into demo data | Errors surfaced with Retry; demo cities only when no key, and labeled |
| 21 | Fallback weather labeling | Banner only | Persistent "Sample data" badge on the main card, banner with reason, insights marked |

### News
| # | Problem | Root cause | Fix |
|---|---|---|---|
| 22 | Refresh silently skipped after location change | `loadingRef` guard never retried | Articles no longer depend on location; re-ranked client-side |
| 23 | 429 reported as "daily quota" | Wrong inference (free plan: 1 req/s) | 403 = quota, 429 = rate limit, distinct messages |
| 24 | Unsafe `href`, "Invalid Date" | No validation | http(s)-only URLs, https-only images, date validation, dedupe, `noopener`, `no-referrer` |
| 25 | User never told why news was missing | Errors swallowed | Specific reason + Retry; generated insights labeled and separated |

### Map and radar
| # | Problem | Root cause | Fix |
|---|---|---|---|
| 26 | Radar blank | Max zoom 9 vs provider max 7 | `RADAR_MAX_NATIVE_ZOOM = 7` |
| 27 | Flicker, refetching | New `TileLayer` mounted per frame | Imperative layers: preload, reveal on load, remove previous (max 2 live) |
| 28 | Zoom buttons changed the location | Controls inside Leaflet container; clicks bubbled | `L.DomEvent.disableClickPropagation` |
| 29 | Double-click zoom picked locations | Click fired for both clicks | Delayed pick, cancelled by dblclick/zoom/move |
| 30 | Zoom reset after every pick | Unconditional `flyTo` zoom 10 | Pan only when the pick came from the map |
| 31 | Legends wrong (km/h, hPa vs provider m/s, Pa; invented colors) | Hand-made legends | Provider-published palettes; radar legend in dBZ |
| 32 | Precipitation tab empty unless radar on | Design gap | OpenWeather precipitation layer when radar is off |
| 33 | No failure feedback; expired frames | No health tracking or refresh | Tile-health tracking + notices + Retry; frame list refreshed every 5 min; stale-radar notice; frames validated (host, path, age) |
| 34 | Map loaded eagerly | n/a | Loaded when scrolled near; code-split |
| 35 | Attribution incomplete | n/a | RainViewer, OpenWeather and OpenStreetMap (plus CARTO when keyed) on the map; all providers in footer |
| 36 | **"API KEY REQUIRED" watermark across the base map** (reported after the first delivery) | CARTO began requiring a free API key on `basemaps.cartocdn.com` in late Aug 2026; unkeyed tiles return a watermarked image with HTTP 200, so error tracking cannot see it. My first browser tests mocked the base-map tiles and therefore missed it, and I should have flagged base-map terms as a live risk rather than a footnote. | `components/map/baseMap.js`: with `VITE_PUBLIC_CARTO_API_KEY` use CARTO dark tiles (`rastertiles/dark_all/{z}/{x}/{y}.png?key=`); without it use keyless OpenStreetMap tiles, darkened by a CSS filter. Unkeyed CARTO is never requested. |

### UI, accessibility, performance
- Global `:focus-visible` forced `border-radius: 4px`, squaring every pill on keyboard focus: removed.
- Search is now a proper combobox (listbox/options, `aria-activedescendant`, Home/End/Enter/Esc), 16 px input on mobile.
- Section nav (uses the previously dead `useActiveSection`), skip link, `aria-pressed` on toggles, 40 px touch targets, live regions.
- Navbar overflowed by 1 px at exactly 768 px after I added the nav: caught by the responsive sweep, fixed (nav starts at 1024 px).
- Removed glow shadows on forecast bars; small contrast bumps on 500-weight slate text.
- Images: 363 KB to 58 KB (visually identical; checked side by side). Charts (~330 KB) and Leaflet are lazy-loaded.
- Removed `axios` (native `fetch`) and unused `oxlint`; `npm audit` now reports 0 vulnerabilities (was 3 high, build-time transitive).
- `vercel.json`: removed settings that merely restated defaults; added security headers (CSP etc.) and immutable asset caching.

## 3. Prioritized improvements delivered
1. Secrets/API proxies, correctness (races, units, invented data), error handling
2. Map/radar fixes and legends
3. Build/deploy: Node engine, dev API middleware, Vercel headers, dead-code removal
4. UI/UX, accessibility, responsive checks, lazy loading, image optimization
5. Tests and documentation

## 4. Files
**Added (27)**
- `api/_lib/articles.js`
- `api/_lib/env.js`
- `api/_lib/http.js`
- `api/geocode.js`
- `api/tiles.js`
- `api/weather.js`
- `scripts/vite-api-plugin.js`
- `src/components/common/ErrorBoundary.jsx`
- `src/components/common/LazyOnVisible.jsx`
- `src/components/common/SectionSkeletons.jsx`
- `src/components/map/BaseMapLayer.jsx`
- `src/components/map/ClickToSelect.jsx`
- `src/components/map/MapLegend.jsx`
- `src/components/map/WeatherOverlay.jsx`
- `src/components/map/tileHealth.js`
- `src/hooks/useHourlyTimeline.js`
- `src/hooks/usePageVisible.js`
- `src/hooks/useServiceStatus.js`
- `src/services/serviceStatus.js`
- `src/utils/location.js`
- `src/utils/safeUrl.js`
- `src/utils/units.js`
- `tests/api/handlers.test.js`
- `tests/api/helpers.js`
- `tests/setup.js`
- `tests/ui/context.test.jsx`
- `tests/unit/services.test.js`

**Removed (12)** (`.env` for security; the rest were unreachable/unused)
- `.env`
- `src/assets/hero.png`
- `src/assets/react.svg`
- `src/assets/vite.svg`
- `src/components/dashboard/InstrumentPanel.jsx`
- `src/context/ThemeContext.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/FavoritesPage.jsx`
- `src/pages/MapPage.jsx`
- `src/pages/NewsPage.jsx`
- `src/pages/NotFoundPage.jsx`
- `src/pages/SettingsPage.jsx`

**Modified (52)**
- `.env.example`
- `.gitignore`
- `README.md`
- `api/news.js`
- `eslint.config.js`
- `index.html`
- `package-lock.json`
- `package.json`
- `public/favicon.webp`
- `src/App.jsx`
- `src/assets/images/logo-icon.webp`
- `src/assets/images/logo-lockup.webp`
- `src/components/charts/WeatherCharts.jsx`
- `src/components/dashboard/CurrentWeatherCard.jsx`
- `src/components/dashboard/FavoriteCityCard.jsx`
- `src/components/dashboard/FavoritesSection.jsx`
- `src/components/dashboard/HealthIndexCard.jsx`
- `src/components/dashboard/HourlyForecast.jsx`
- `src/components/dashboard/SunriseSunsetCard.jsx`
- `src/components/dashboard/WeeklyForecast.jsx`
- `src/components/dashboard/WindCard.jsx`
- `src/components/layout/Footer.jsx`
- `src/components/layout/Layout.jsx`
- `src/components/layout/Navbar.jsx`
- `src/components/map/MapFlyTo.jsx`
- `src/components/map/MapZoomControls.jsx`
- `src/components/map/RadarLayer.jsx`
- `src/components/map/WeatherMapView.jsx`
- `src/components/map/mapLayers.js`
- `src/components/news/InsightCard.jsx`
- `src/components/news/NewsCard.jsx`
- `src/components/news/NewsSection.jsx`
- `src/components/search/SearchBar.jsx`
- `src/constants/index.js`
- `src/context/WeatherContext.jsx`
- `src/hooks/useActiveSection.js`
- `src/hooks/useRadarFrames.js`
- `src/hooks/useWeatherNews.js`
- `src/index.css`
- `src/pages/Home.jsx`
- `src/services/apiClient.js`
- `src/services/demoData.js`
- `src/services/geocodingService.js`
- `src/services/insightsService.js`
- `src/services/newsService.js`
- `src/services/radarService.js`
- `src/services/weatherService.js`
- `src/utils/format.js`
- `src/utils/health.js`
- `src/utils/timeline.js`
- `vercel.json`
- `vite.config.js`

## 5. Testing report

### Passed (executed)
- `npm ci` from the lockfile in a clean directory, `npm run lint` (0 errors, 0 warnings; baseline had 8 warnings), `npm run build`
- `npm test`: **80 tests**: 25 API handler tests (validation, 401/403/429/5xx/timeout/malformed JSON mapping, no key leakage, dedupe,
  legacy var names), 46 service/utility tests (incl. base-map selection), 9 context tests (race, abort, stale flag, error recovery, units, geolocation denial,
  corrupted storage). A mutation check confirmed the race tests fail when the guard is removed.
- **79 real-browser checks** (plus a separate keyed-build check that CARTO URLs carry `?key=` and OSM is not requested) (Chromium via Playwright, production build served with the exact `vercel.json` headers incl. CSP, real
  `/api` handlers, upstream providers mocked): live render, UV label, "Now" tile, request counts, keyboard search, stale search and
  weather races, °F without refetch, lazy map, radar zoom/URL/attribution/layer count, zoom buttons and double-click not selecting,
  fullscreen dialog, radar failure, news success/quota/retry, rejected key, server error + retry, offline, geolocation denied/granted,
  demo mode (no keys), zero console errors/CSP violations, and no horizontal overflow at 320/375/414/768/1024/1440/1920 px.
- `npm run dev` with a `.env` (including the legacy variable names): keys loaded server-side, validation 400/404/405, no secret in any
  client module.
- Build output scan: 0 occurrences of either original key, `appid=`, or `VITE_OPENWEATHER`.

### Not executed / unverified: please check these yourself
- **Base map:** the CARTO key URL format comes from CARTO's own documentation and community posts; I could not request real CARTO or
  OpenStreetMap tiles from my sandbox. The darkened-OSM look was checked with a synthetic tile in OSM's colour palette, not real tiles.
  Base-map tiles were mocked in my browser tests, which is exactly how the watermark got past them. Please look at the live map after deploying.
- **No live calls to OpenWeather, GNews, Open-Meteo or RainViewer** (my sandbox has no outbound access to them). Endpoints,
  parameters and response shapes were checked against each provider's published docs and exercised through mocks. A first run with your
  real keys is the real integration test. GNews `from`/`q` handling is docs-based only.
- **Real Vercel deployment not performed.** The `api/` layout follows Vercel's conventions (`_lib` helpers are not routes), and the
  headers were tested locally, not on Vercel.
- OpenWeather's maximum tile zoom is not documented; I capped native requests at zoom 9 (upscaled beyond). Unverified.
- Only **Chromium** was used; Safari, Firefox and real phones/tablets were not (viewports were emulated). I visually reviewed 320 px,
  1440 px and the mobile map; other widths were checked programmatically for overflow/clipping only.
- No screen-reader, axe or Lighthouse runs. Accessibility was verified through roles/attributes and keyboard behavior only.
- Prettier was not applied: 48 files in the original already did not match the project's Prettier config, and reformatting would bury
  the real changes. `npm run format` is available.

## 6. Behavior changes and limits to be aware of
- OpenWeather's free forecast is 5 days in 3-hour steps, so the UI says "5-day" (it previously claimed 7 in the page description). A real
  7-day view needs a different provider/plan. The hourly strip is smoothed between real 3-hour points (same as before).
- No geolocation prompt on page load; use the "Near me" button.
- On a rejected key (401) or OpenWeather rate limit (429) the app still falls back to **labeled** sample data (as before, now more
  clearly marked). Network/server failures show an error instead.
- `searchLocations()` now returns `{ results, demo }` instead of an array (internal contract; only `SearchBar` used it).
- Open-Meteo's free API is for non-commercial use; check licensing if your site is commercial.

## 7. Required environment variables
| Variable | Visibility | Where |
|---|---|---|
| `OPENWEATHER_API_KEY` | Private (server only) | `.env` locally, Vercel Environment Variables |
| `GNEWS_API_KEY` | Private (server only) | `.env` locally, Vercel Environment Variables |
| `VITE_PUBLIC_CARTO_API_KEY` | Public, optional | `.env` locally, Vercel Environment Variables (build time) |

`VITE_PUBLIC_CARTO_API_KEY` (optional) is the only **public** variable: CARTO needs the key in each tile URL, so restrict it to your domain in the CARTO dashboard. It is applied at build time (redeploy after changing). Without it the OpenStreetMap fallback is used.
