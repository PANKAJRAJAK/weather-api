// Minimal client to fetch forecast and current weather from backend
document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('cityInput');
  const getBtn = document.getElementById('getBtn');
  const useLocBtn = document.getElementById('useLocBtn');
  const output = document.getElementById('output');
  const current = document.getElementById('current');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  async function getForecast(city) {
    output.innerHTML = '';
    current.innerHTML = '';
    // show loading
    getBtn.disabled = true;
    btnText.textContent = 'Loading...';
    btnSpinner.classList.remove('hidden');
    try {
      const fRes = await fetch(`/forecast?city=${encodeURIComponent(city)}`);
      const forecast = await fRes.json();

      if (fRes.status !== 200 || forecast.error) {
        output.innerHTML = `<div class="p-3 border rounded bg-red-50 text-red-700">
          <div class="font-medium">Error</div>
          <div class="text-sm">${forecast.error || 'Unable to fetch forecast data'}</div>
        </div>`;
        return;
      }

      output.innerHTML = '';
      const list = forecast.forecast || [];
      list.forEach(day => {
        const el = document.createElement('div');
        el.className = 'p-3 border rounded flex items-center gap-4';
        el.innerHTML = `<div class="flex-1">
            <div class="font-medium">${day.date}</div>
            <div class="text-sm text-slate-600">${day.weather}</div>
            <div class="text-sm">Min: ${day.temp_min}°C • Max: ${day.temp_max}°C</div>
          </div>
          <div class="text-right text-sm">
            <div class="font-semibold">${day.wind_speed ?? 'N/A'}</div>
            <div class="text-slate-500">${day.sunrise} / ${day.sunset}</div>
          </div>`;
        output.appendChild(el);
      });

      // show current as well
      const cRes = await fetch(`/weather?cities=${encodeURIComponent(city)}`);
      const cjson = await cRes.json();
      
      if (Array.isArray(cjson) && cjson.length > 0) {
        const result = cjson[0];
        if (result.error) {
          current.innerHTML = `<div class="p-3 border rounded bg-red-50 text-red-700">
            <div class="font-medium">Error</div>
            <div class="text-sm">${result.error}</div>
          </div>`;
          return;
        }
        
        current.innerHTML = `<div class="p-3 border rounded flex items-center gap-4">
          <div class="flex-1">
            <div class="font-medium">Current - ${result.city}</div>
            <div class="text-sm">Temp: ${result.temperature}°C (feels like ${result.feels_like}°C)</div>
            <div class="text-sm text-slate-600">Humidity: ${result.humidity}%</div>
          </div>
          <div class="text-right">
            <div class="font-semibold">${result.wind_speed ?? 'N/A'}</div>
            <div class="text-slate-500">${result.local_time}</div>
          </div>
        </div>`;
      }
    } catch (err) {
      output.innerHTML = `<div class="text-red-600">${err.message}</div>`;
    } finally {
      // hide loading
      getBtn.disabled = false;
      btnText.textContent = 'Get Forecast';
      btnSpinner.classList.add('hidden');
    }
  }

  async function getByCoords(lat, lon) {
    output.innerHTML = '';
    current.innerHTML = '';
    // show loading
    getBtn.disabled = true;
    useLocBtn.disabled = true;
    btnText.textContent = 'Loading...';
    btnSpinner.classList.remove('hidden');
    try {
      const fRes = await fetch(`/forecast/coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
      const forecast = await fRes.json();

      if (fRes.status !== 200 || forecast.error) {
        output.innerHTML = `<div class="p-3 border rounded bg-red-50 text-red-700">
          <div class="font-medium">Error</div>
          <div class="text-sm">${forecast.error || 'Unable to fetch forecast data'}</div>
        </div>`;
        return;
      }

      output.innerHTML = '';
      const list = forecast.forecast || [];
      list.forEach(day => {
        const el = document.createElement('div');
        el.className = 'p-3 border rounded flex items-center gap-4';
        el.innerHTML = `<div class="flex-1">
            <div class="font-medium">${day.date}</div>
            <div class="text-sm text-slate-600">${day.weather}</div>
            <div class="text-sm">Min: ${day.temp_min}°C • Max: ${day.temp_max}°C</div>
          </div>
          <div class="text-right text-sm">
            <div class="font-semibold">${day.wind_speed ?? 'N/A'}</div>
            <div class="text-slate-500">${day.sunrise} / ${day.sunset}</div>
          </div>`;
        output.appendChild(el);
      });

      // show current as well
      const cRes = await fetch(`/weather/coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
      const cjson = await cRes.json();
      if (Array.isArray(cjson) && cjson.length > 0 && !cjson[0].error) {
        const cur = cjson[0];
        current.innerHTML = `<div class="p-3 border rounded flex items-center gap-4">
          <div class="flex-1">
            <div class="font-medium">Current - ${cur.city}</div>
            <div class="text-sm">Temp: ${cur.temperature}°C (feels like ${cur.feels_like}°C)</div>
            <div class="text-sm text-slate-600">Humidity: ${cur.humidity}%</div>
          </div>
          <div class="text-right">
            <div class="font-semibold">${cur.wind_speed ?? 'N/A'}</div>
            <div class="text-slate-500">${cur.local_time}</div>
          </div>
        </div>`;
      }
    } catch (err) {
      output.innerHTML = `<div class="text-red-600">${err.message}</div>`;
    } finally {
      // hide loading
      getBtn.disabled = false;
      useLocBtn.disabled = false;
      btnText.textContent = 'Get Forecast';
      btnSpinner.classList.add('hidden');
    }
  }

  getBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) return; getForecast(city);
  });

  useLocBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      output.innerHTML = `<div class="p-3 border rounded bg-red-50 text-red-700">Geolocation is not supported by your browser.</div>`;
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      getByCoords(latitude, longitude);
    }, async (err) => {
      // Map common geolocation error codes
      const codeMap = {
        1: 'Permission denied',
        2: 'Position unavailable',
        3: 'Timeout'
      };
      const codeMsg = err && err.code ? codeMap[err.code] || `Error code ${err.code}` : 'Unknown error';
      const details = err && err.message ? ` — ${err.message}` : '';

      // If position unavailable, try an IP-based fallback (approximate)
      if (err && err.code === 2) {
        output.innerHTML = `<div class="p-3 border rounded bg-yellow-50 text-yellow-800">
          <div class="font-medium">Unable to get precise location</div>
          <div class="text-sm">Trying an approximate location based on your IP address...</div>
        </div>`;

        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const ipJson = await ipRes.json();
            const lat = ipJson.latitude || ipJson.lat;
            const lon = ipJson.longitude || ipJson.lon || ipJson.long;
            if (lat && lon) {
              output.innerHTML = `<div class="p-3 border rounded bg-green-50 text-green-800">
                <div class="font-medium">Using approximate location</div>
                <div class="text-sm">Location approximated from IP: ${ipJson.city || ''} ${ipJson.region || ''} ${ipJson.country || ''}</div>
              </div>`;
              getByCoords(lat, lon);
              return;
            }
          }
        } catch (fetchErr) {
          console.warn('IP geolocation failed', fetchErr);
        }
        // fall through to show error below if IP fallback fails
      }

      output.innerHTML = `<div class="p-3 border rounded bg-red-50 text-red-700">
        <div class="font-medium">Unable to get location</div>
        <div class="text-sm">${codeMsg}${details}. Please ensure you allowed location access for this site and try again. You can also enter a city manually.</div>
      </div>`;
      console.warn('Geolocation error', err);
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  });
});
