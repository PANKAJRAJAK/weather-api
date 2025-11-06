# Weather App

Simple full-stack weather app (Node + Express backend, Tailwind frontend).

Features
- Current weather and 5-day forecast via OpenWeatherMap
- Geocoding to disambiguate city names
- Browser 'Use my location' (with IP fallback)
- Coordinate-based endpoints and in-memory caching for coords

Run locally
1. Install dependencies:

```powershell
cd D:\weather-api
npm install
```

2. Build Tailwind (or watch in dev):

```powershell
npm run tailwind:build
# or for dev (auto rebuild):
npm run dev
```

3. Start the server:

```powershell
npm start
```

4. Open http://localhost:3000 and try the UI.

Notes
- Update the OpenWeatherMap API key in `Weather.js` (variable `API_KEY`) if needed.
- The in-memory cache resets on server restart. Use Redis for persistent caching.

How to push to GitHub (instructions in README of project root)
