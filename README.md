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

## Notes on scope

This pass focused on the highest-impact items: the animation engine, visual
consistency (single theme, typography, branding), the radar map, and removing
the landing-page search bar. A few of the more exotic conditions in the
original brief (tornado, sandstorm-specific debris, per-condition sound design)
share the same underlying particle system and can be extended the same way as
the existing scenes in `WeatherScene.jsx` — flagging that here rather than
quietly leaving them unfinished.
