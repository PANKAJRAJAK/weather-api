const express = require("express");
const axios = require("axios");

const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;

// Helpful startup logging for Azure and global error handlers so failures are visible in Log Stream
console.log('Starting Mausam weather app...');
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  // do not exit immediately; allow Azure to capture logs
});

// Serve frontend static files from client/dist
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Basic request logger to capture incoming requests in Azure Log Stream
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve index.html for root (also allows direct open)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

const API_KEY = "6797e35cf13b8ce7fb1cc047464795cd";

// Simple in-memory TTL cache
const cacheStore = new Map();
function cacheGet(key) {
  const rec = cacheStore.get(key);
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) { cacheStore.delete(key); return null; }
  return rec.value;
}
function cacheSet(key, value, ttlSeconds) {
  const expiresAt = Date.now() + (ttlSeconds || 600) * 1000; // default 10min
  cacheStore.set(key, { value, expiresAt });
}

// Helper to normalize coordinate keys (round to 4 decimals)
function coordKey(lat, lon) {
  const rlat = Number(lat).toFixed(4);
  const rlon = Number(lon).toFixed(4);
  return `${rlat},${rlon}`;
}

// Resolve ambiguous city names using OpenWeatherMap Geocoding API
async function geocodeLocation(query) {
  if (!query || query.trim().length === 0) {
    throw new Error('City name cannot be empty');
  }
  const normalized = query.trim().toLowerCase();
  const cacheKey = `geo:${normalized}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`;
  const { data } = await axios.get(geoUrl);
  if (!data || data.length === 0) return null;
  const result = data[0]; // { name, lat, lon, country, state }
  // Cache geocoding results for 24 hours
  cacheSet(cacheKey, result, 24 * 3600);
  return result;
}
// Convert UNIX UTC + timezone offset → local readable time (HH:MM AM/PM)
function convertUnixToTime(unix, timezoneOffset) {
  const utcDate = new Date(unix * 1000);
  let hours = utcDate.getUTCHours();
  let minutes = utcDate.getUTCMinutes();

  // Apply timezone offset
  hours += Math.floor(timezoneOffset / 3600);
  minutes += Math.floor((timezoneOffset % 3600) / 60);

  if (minutes >= 60) { hours++; minutes -= 60; }
  if (hours >= 24) { hours -= 24; }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Format timezone offset seconds → GMT+HH:MM
function formatTimezone(offsetSeconds) {
  const sign = offsetSeconds >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetSeconds);
  const hours = Math.floor(absOffset / 3600);
  const minutes = Math.floor((absOffset % 3600) / 60);
  return `GMT${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// Get current local time using timezone offset
function getLocalTime(timezoneOffset) {
  const nowUTC = new Date();
  let hours = nowUTC.getUTCHours() + Math.floor(timezoneOffset / 3600);
  let minutes = nowUTC.getUTCMinutes() + Math.floor((timezoneOffset % 3600) / 60);

  if (minutes >= 60) { hours++; minutes -= 60; }
  if (hours >= 24) { hours -= 24; }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// -------------------- /weather endpoint --------------------
app.get("/weather", async (req, res) => {
  const cities = req.query.cities ? req.query.cities.split(",") : [];
  if (cities.length === 0) return res.status(400).json({ error: "Provide cities in query params" });

  try {
    const results = await Promise.all(
      cities.map(async (city) => {
        try {
          // Parse and geocode the city (supports "city, state, country")
          const parts = city.split(',').map(p => p.trim()).filter(Boolean);
          const cityQuery = parts.join(',');

          const geo = await geocodeLocation(cityQuery);
          if (!geo) {
            return { 
              city, 
              error: `Location not found: ${cityQuery}. Please check the spelling and try a more specific query (e.g. "City, State, Country")`,
              status: 404
            };
          }

          const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}&units=metric`;
          const { data } = await axios.get(weatherUrl);              // Construct readable city label using geocoding result
              const label = `${geo.name}${geo.state ? ', ' + geo.state : ''}${geo.country ? ', ' + geo.country : ''}`;

              return {
                city: label,
                temperature: data.main.temp,
                feels_like: data.main.feels_like,
                humidity: data.main.humidity,
                // return only averaged wind speed in km/h as requested (string with unit)
                wind_speed: data.wind?.speed != null ? `${+(data.wind.speed * 3.6).toFixed(2)} Km/hr` : null,
                sunrise: convertUnixToTime(data.sys.sunrise, data.timezone),
                sunset: convertUnixToTime(data.sys.sunset, data.timezone),
                timezone: formatTimezone(data.timezone),
                local_time: getLocalTime(data.timezone),
                weather: data.weather[0].description,
              };
            } catch (err) {
              return { city, error: "City not found or unable to fetch data", details: err.message };
            }
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch weather data", details: error.message });
  }
});

// -------------------- /forecast endpoint --------------------
app.get("/forecast", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "Please provide a city in query params" });

  try {
  // Parse and geocode the city (supports "city, state, country")
  const parts = city.split(',').map(p => p.trim()).filter(Boolean);
  const cityQuery = parts.join(',');

  const geo = await geocodeLocation(cityQuery);
  if (!geo) return res.status(404).json({ error: 'City not found (geocoding)' });

  // 5-day / 3-hour forecast by coordinates
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}&units=metric`;
  const { data } = await axios.get(forecastUrl);

  const timezone = data.city.timezone || 0;

  // Fetch current weather for sunrise/sunset using coordinates
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}&units=metric`;
  const { data: currentData } = await axios.get(currentWeatherUrl);

    // Group forecast by date
    const dailyForecast = {};

    data.list.forEach(item => {
      // Apply timezone and get local date string YYYY-MM-DD
      const utcDate = new Date((item.dt + timezone) * 1000);
      const dateStr = utcDate.toISOString().split("T")[0];

      if (!dailyForecast[dateStr]) {
        dailyForecast[dateStr] = {
          date: dateStr,
          temp_min: item.main.temp,
          temp_max: item.main.temp,
          weather: item.weather[0].description,
          // accumulate wind stats to compute daily average later
          wind_sum: item.wind?.speed || 0,
          wind_count: item.wind?.speed != null ? 1 : 0,
          sunrise: convertUnixToTime(currentData.sys.sunrise, timezone),
          sunset: convertUnixToTime(currentData.sys.sunset, timezone),
          local_time: getLocalTime(timezone)
        };
      } else {
        dailyForecast[dateStr].temp_min = Math.min(dailyForecast[dateStr].temp_min, item.main.temp);
        dailyForecast[dateStr].temp_max = Math.max(dailyForecast[dateStr].temp_max, item.main.temp);
        // update wind accumulation
        if (item.wind?.speed != null) {
          dailyForecast[dateStr].wind_sum += item.wind.speed;
          dailyForecast[dateStr].wind_count += 1;
        }
      }
    });

    // Convert accumulated wind sums into an averaged wind_speed for each day
    const forecastArray = Object.values(dailyForecast).map(entry => {
      // compute averaged wind speed (m/s) and convert to km/h
      const avg_m_s = entry.wind_count ? entry.wind_sum / entry.wind_count : null;
      const avg_kmh = avg_m_s != null ? +(avg_m_s * 3.6).toFixed(2) : null;
      const { wind_sum, wind_count, ...rest } = entry;
      // return only averaged wind_speed in km/h as a string with unit
      return { ...rest, wind_speed: avg_kmh != null ? `${avg_kmh} Km/hr` : null };
    });

    res.json({
      city: data.city.name,
      country: data.city.country,
      timezone: formatTimezone(timezone),
      forecast: forecastArray
    });

  } catch (error) {
    res.status(500).json({ error: "Unable to fetch forecast data", details: error.message });
  }
});

if (require.main === module) {
  app.get("/", (req, res) => {
  res.send("🌦️ Mausam Weather App is Live on Azure!");
});
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

// -------------------- /weather/coords endpoint --------------------
// Accepts lat & lon query params and returns same structure as /weather for a single location
app.get('/weather/coords', async (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;
  if (!lat || !lon) return res.status(400).json({ error: 'Provide lat and lon query params' });

  try {
    const key = `weatherCoords:${coordKey(lat,lon)}`;
    const cached = cacheGet(key);
    if (cached) {
      return res.json(cached);
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${API_KEY}&units=metric`;
    const { data } = await axios.get(weatherUrl);

    // Build a readable label (use name if available)
    const label = `${data.name || ''}${data.sys?.country ? ', ' + data.sys.country : ''}`.trim();

    const result = {
      city: label || `${lat},${lon}`,
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      wind_speed: data.wind?.speed != null ? `${+(data.wind.speed * 3.6).toFixed(2)} Km/hr` : null,
      sunrise: convertUnixToTime(data.sys.sunrise, data.timezone),
      sunset: convertUnixToTime(data.sys.sunset, data.timezone),
      timezone: formatTimezone(data.timezone),
      local_time: getLocalTime(data.timezone),
      weather: data.weather[0].description
    };

    // Keep response shape consistent with /weather (array of results)
    const payload = [result];
    // cache weather for 10 minutes
    cacheSet(key, payload, 10 * 60);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch weather by coordinates', details: err.message });
  }
});

// -------------------- /forecast/coords endpoint --------------------
// Accepts lat & lon query params and returns forecast grouped by day for that location
app.get('/forecast/coords', async (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;
  if (!lat || !lon) return res.status(400).json({ error: 'Provide lat and lon query params' });

  try {
    const key = `forecastCoords:${coordKey(lat,lon)}`;
    const cached = cacheGet(key);
    if (cached) {
      return res.json(cached);
    }

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${API_KEY}&units=metric`;
    const { data } = await axios.get(forecastUrl);

    const timezone = data.city?.timezone || 0;

    // Fetch current weather for sunrise/sunset
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${API_KEY}&units=metric`;
    const { data: currentData } = await axios.get(currentWeatherUrl);

    // Group forecast by date
    const dailyForecast = {};
    data.list.forEach(item => {
      const utcDate = new Date((item.dt + timezone) * 1000);
      const dateStr = utcDate.toISOString().split('T')[0];

      if (!dailyForecast[dateStr]) {
        dailyForecast[dateStr] = {
          date: dateStr,
          temp_min: item.main.temp,
          temp_max: item.main.temp,
          weather: item.weather[0].description,
          wind_sum: item.wind?.speed || 0,
          wind_count: item.wind?.speed != null ? 1 : 0,
          sunrise: convertUnixToTime(currentData.sys.sunrise, timezone),
          sunset: convertUnixToTime(currentData.sys.sunset, timezone),
          local_time: getLocalTime(timezone)
        };
      } else {
        dailyForecast[dateStr].temp_min = Math.min(dailyForecast[dateStr].temp_min, item.main.temp);
        dailyForecast[dateStr].temp_max = Math.max(dailyForecast[dateStr].temp_max, item.main.temp);
        if (item.wind?.speed != null) {
          dailyForecast[dateStr].wind_sum += item.wind.speed;
          dailyForecast[dateStr].wind_count += 1;
        }
      }
    });

    const forecastArray = Object.values(dailyForecast).map(entry => {
      const avg_m_s = entry.wind_count ? entry.wind_sum / entry.wind_count : null;
      const avg_kmh = avg_m_s != null ? +(avg_m_s * 3.6).toFixed(2) : null;
      const { wind_sum, wind_count, ...rest } = entry;
      return { ...rest, wind_speed: avg_kmh != null ? `${avg_kmh} Km/hr` : null };
    });

    const payload = { city: data.city?.name || `${lat},${lon}`, country: data.city?.country || null, timezone: formatTimezone(timezone), forecast: forecastArray };
    // Cache forecast for 30 minutes
    cacheSet(key, payload, 30 * 60);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch forecast by coordinates', details: err.message });
  }
});

// Express error-handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error('Express error handler caught:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).send('Internal Server Error');
});