# SkyVault — Weather, Reimagined

A cinematic, real-time weather platform built with React + Vite. SkyVault layers
live conditions from OpenWeatherMap with a fully dynamic background engine that
paints the sky itself — time of day, current weather, and season all blend into
one continuous scene instead of a static illustration.

## What's inside

- **One consistent premium theme.** No light/dark toggle — a single, carefully
  tuned dark glass aesthetic throughout.
- **Layered weather scene engine** (`src/components/WeatherScene.jsx`):
  - **Time-of-day sky** — sunrise, morning, afternoon, sunset, night, midnight —
    each with its own gradient, sun/moon position and star density.
  - **Weather mood** — sunny, partly cloudy, cloudy, windy, rain, heavy rain,
    rain-with-sunshine, thunderstorm, snow, blizzard, fog, dust, extreme cold,
    heatwave shimmer, and a clear-after-rain rainbow — layered *on top of* the
    time-of-day sky so a rainy afternoon and a rainy midnight look different.
  - **Seasonal accents** — drifting petals in spring, falling leaves in autumn.
  - All layers cross-fade independently and run on CSS transforms/opacity only
    (no canvas, no per-frame JS), so it stays light on CPU/GPU.
- **Branding** — the SkyVault compass mark you provided has been cleaned up
  (background removed, exported as optimized WebP) and used for the header
  icon, the landing page lockup, and the favicon.
- **Radar map** (`src/components/WeatherMap.jsx`) with precipitation, cloud,
  wind, temperature and pressure overlays, a pulsing "LIVE" radar indicator,
  and native Leaflet zoom controls.
- **Activity scores** (`src/components/LifestylePanel.jsx`) on a 0–100 scale
  with a green → amber → red gradient and a ring visualization per activity.
- Fully responsive dashboard: current conditions, hourly/daily forecast, air
  quality, UV index, alerts, favorites, and news (left untouched, as requested).

## Getting started

```bash
npm install
cp .env.example .env   # add your OpenWeatherMap API key
npm run dev
```

## Deploying to Vercel

This is the part that actually bit us once already, so it's worth being explicit:

Vite's `VITE_*` environment variables are baked into the JS bundle **at build
time**, not read at runtime. Your local `.env` file is (correctly) gitignored,
so Vercel's build server never sees it unless you add the same variables in
**Project Settings → Environment Variables** in the Vercel dashboard — and
after adding or changing them, you need to **trigger a new deployment**
(redeploy from the dashboard, or push a new commit); existing builds don't
retroactively pick up new env vars.

Set these in Vercel:

| Variable | Scope | Notes |
|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | Client (build-time) | Powers current conditions, forecast, and the radar map |
| `GNEWS_API_KEY` | **Server only** — no `VITE_` prefix | Read by `api/news.js`, a Vercel serverless function that proxies GNews so the key never ships to the browser |

The news section specifically used to call GNews directly from the browser
using `VITE_GNEWS_API_KEY`. That worked in local dev (where `.env` is loaded)
and silently fell back to static curated content in any deployment that
didn't have that same variable set — which is almost certainly what you saw.
It's now proxied through `api/news.js` instead, both to fix that class of
bug for good and because shipping a news API key in public client JS isn't
great practice anyway. Local `npm run dev` (which doesn't run serverless
functions) still has a client-side fallback via `VITE_GNEWS_API_KEY` if you
want live news without running `vercel dev`.

## Notes on scope

This pass focused on the highest-impact items: the animation engine, visual
consistency (single theme, typography, branding), the radar map, and removing
the landing-page search bar. A few of the more exotic conditions in the
original brief (tornado, sandstorm-specific debris, per-condition sound design)
share the same underlying particle system and can be extended the same way as
the existing scenes in `WeatherScene.jsx` — flagging that here rather than
quietly leaving them unfinished.
