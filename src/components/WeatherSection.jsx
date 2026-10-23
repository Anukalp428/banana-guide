import { useState, useEffect } from 'react';
import './WeatherSection.css';
import { useRainAlert } from './useRainAlert';
import RainAlertBanner from './RainAlertBanner';

// ─── Popular Agricultural Hubs for Quick Access (Roorkee included) ───────────
const POPULAR_CITIES = ['Roorkee', 'New Delhi', 'Ludhiana', 'Jaipur', 'Nagpur', 'Patna'];

// ─── WMO Weather Interpretation Code Map ──────────────────────────────────────
function parseWeatherCode(code) {
  if (code === 0) {
    return {
      condition: 'Clear Sky',
      icon: '☀️',
      advisory: 'Bright sunny skies. Ideal conditions for harvesting, sun-drying crops, and pest spraying.',
    };
  }
  if (code === 1 || code === 2 || code === 3) {
    return {
      condition: code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast',
      icon: code === 3 ? '☁️' : '⛅',
      advisory: 'Mild sunlight with light cloud cover. Good conditions for fertilizer application and irrigation.',
    };
  }
  if (code === 45 || code === 48) {
    return {
      condition: 'Foggy / Haze',
      icon: '🌫️',
      advisory: 'Dense morning mist. Monitor leafy crops closely for fungal issues; avoid early morning spraying.',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      condition: 'Light Drizzle',
      icon: '🌦️',
      advisory: 'Light drizzle expected. Pause chemical spraying to prevent pesticides from being washed away.',
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      condition: code >= 80 ? 'Rain Showers' : 'Rainy',
      icon: '🌧️',
      advisory: 'Rainfall active or imminent. Ensure field drainage channels are clear to prevent water stagnation.',
    };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      condition: 'Snow / Frost',
      icon: '❄️',
      advisory: 'Near freezing conditions. Shield vegetable nurseries and sensitive seedlings against frost damage.',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      condition: 'Thunderstorm',
      icon: '⛈️',
      advisory: 'Thunderstorm warning with strong gusts. Secure farm machinery and move livestock to safe shelter.',
    };
  }
  return {
    condition: 'Partly Cloudy',
    icon: '🌤️',
    advisory: 'Favorable agricultural conditions. Maintain routine crop monitoring and moisture checks.',
  };
}

function getDayName(dateString) {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return dateString;
}

// Convert "2026-10-20T13:30" to "1:30 PM"
function formatApiTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split('T');
  if (parts.length === 2) {
    const [h, m] = parts[1].split(':');
    const hourNum = parseInt(h, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${m} ${ampm}`;
  }
  return timeStr;
}

export default function WeatherSection() {
  const [query, setQuery] = useState('');
  const [activeCity, setActiveCity] = useState('Roorkee');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Smart Rain Alert ─────────────────────────────────────────────────────
  const rainAlertHook = useRainAlert();

  // ── Live Weather Fetch via Open-Meteo (No API Key Required) ────────────────
  const fetchWeather = async (cityName) => {
    if (!cityName || !cityName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Geocoding search (Open-Meteo Geocoding API)
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        throw new Error('Geocoding service unavailable. Please check your network connection.');
      }
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location "${cityName}" not found. Please check spelling or enter a nearby district (e.g. Roorkee, Ludhiana, Jaipur).`);
      }

      const loc = geoData.results[0];
      const { latitude, longitude, name, admin1, country } = loc;
      // Guarantee Asia/Kolkata timezone for Indian locations
      const tz = loc.timezone || 'Asia/Kolkata';

      // Step 2: Forecast data (Open-Meteo Forecast API with explicit current parameters & timezone)
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(tz)}`;
      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) {
        throw new Error('Weather forecast service unavailable. Please try again later.');
      }
      const forecastData = await forecastRes.json();

      // Ensure we use the real-time 'current' snapshot (not daily max or hourly forecast)
      const current = forecastData.current;
      const daily = forecastData.daily;
      const weatherInfo = parseWeatherCode(current.weather_code);

      // Console logging for verification in developer console
      console.groupCollapsed(`[FarmerConnect Weather] Live Data: ${name} (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`);
      console.log('Location:', `${name}, ${admin1 || country}`);
      console.log('Coordinates (lat, lon):', { latitude, longitude });
      console.log('Timezone:', forecastData.timezone || tz);
      console.log('Observation Timestamp (current.time):', current.time);
      console.log('Current Temperature (2m):', `${current.temperature_2m}°C`);
      console.log('Current Relative Humidity (2m):', `${current.relative_humidity_2m}%`);
      console.log('Apparent Temperature (Feels like):', `${current.apparent_temperature}°C`);
      console.log('Wind Speed (10m):', `${current.wind_speed_10m} km/h`);
      console.log('Precipitation:', `${current.precipitation} mm`);
      console.log('Weather Code (WMO):', current.weather_code, '➔', weatherInfo.condition);
      console.log('Raw Forecast Object:', forecastData);
      console.groupEnd();

      // Step 3: Parse 5-day daily forecast
      const forecastList = (daily.time || []).slice(0, 5).map((dateStr, idx) => {
        const code = daily.weather_code[idx];
        const codeInfo = parseWeatherCode(code);
        return {
          day: getDayName(dateStr),
          date: dateStr,
          icon: codeInfo.icon,
          condition: codeInfo.condition,
          high: Math.round(daily.temperature_2m_max[idx]),
          low: Math.round(daily.temperature_2m_min[idx]),
        };
      });

      setWeather({
        city: name,
        state: admin1 || country || '',
        country: country || '',
        lat: latitude,
        lon: longitude,
        timezone: forecastData.timezone || tz,
        exactTemp: current.temperature_2m,
        temp: Math.round(current.temperature_2m),
        feels: Math.round(current.apparent_temperature),
        exactFeels: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        exactWind: current.wind_speed_10m,
        precipitation: current.precipitation || 0,
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
        advisory: weatherInfo.advisory,
        forecast: forecastList,
        observationTime: formatApiTime(current.time),
        apiRawTime: current.time,
        lastFetchTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setActiveCity(name);

      // Notify the Rain Alert hook of the resolved location
      rainAlertHook.setLocation({ lat: latitude, lon: longitude, city: name });

      // Cache weather snapshot for AI Krishi Mitra assistant context
      try {
        sessionStorage.setItem('farmer_current_weather_cache', JSON.stringify({
          city: name,
          state: admin1 || country || '',
          temp: Math.round(current.temperature_2m),
          feels: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          precipitation: current.precipitation || 0,
          condition: weatherInfo.condition,
          advisory: weatherInfo.advisory,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
      } catch { /* ignore storage error */ }
    } catch (err) {
      console.error('[FarmerConnect Weather] Fetch Error:', err);
      setError(err instanceof Error ? err.message : 'Unable to retrieve live weather data.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: Fetch weather for Roorkee
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWeather('Roorkee');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      fetchWeather(query.trim());
    }
  };

  const handleChipClick = (c) => {
    setQuery(c);
    fetchWeather(c);
  };

  return (
    <section className="weather-section" id="weather">
      <div className="container">
        {/* Header */}
        <div className="weather-section__header">
          <span className="section-label">🌤 Farm Weather</span>
          <h2 className="section-title">Agricultural Weather Forecast</h2>
          <p className="section-subtitle">
            Stay ahead of changing weather conditions. Plan your irrigation, harvesting,
            and spraying with confidence using accurate real-time forecasts.
          </p>
          <div className="weather-live-badge">
            <span className="live-dot" aria-hidden="true" />
            <span>LIVE DATA • Source: Open-Meteo High-Resolution Grid</span>
            {weather && (
              <span className="weather-live-badge__time">
                Observed: {weather.observationTime || weather.apiRawTime} (IST)
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="weather-search-container">
          <form className="weather-search" onSubmit={handleSearch} role="search">
            <div className="weather-search__input-wrap">
              <span className="weather-search__icon" aria-hidden="true">📍</span>
              <input
                type="text"
                id="weather-city-input"
                className="weather-search__input"
                placeholder="Enter city, district, or town (e.g. Roorkee, Ludhiana, Jaipur)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn-primary weather-search__btn"
              id="weather-search-submit"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Searching…
                </>
              ) : (
                '🔍 Check Weather'
              )}
            </button>
          </form>

          {/* Quick city chips */}
          <div className="weather-chips" role="group" aria-label="Popular agricultural hubs">
            <span className="weather-chips__label">Quick Locations:</span>
            <div className="weather-chips__list">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`weather-chip ${activeCity.toLowerCase() === c.toLowerCase() ? 'weather-chip--active' : ''}`}
                  onClick={() => handleChipClick(c)}
                  disabled={loading}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="weather-card weather-card--loading">
            <div className="weather-loading-spinner" aria-label="Loading weather" />
            <p className="weather-loading-text">
              🛰️ Fetching live satellite weather for <strong>{query || activeCity}</strong>…
            </p>
          </div>
        )}

        {/* Error / Invalid Location State */}
        {!loading && error && (
          <div className="weather-error" role="alert">
            <div className="weather-error__icon">⚠️</div>
            <div className="weather-error__content">
              <h4 className="weather-error__title">Weather Update Failed</h4>
              <p className="weather-error__text">{error}</p>
            </div>
            <button
              type="button"
              className="btn-outline weather-error__retry"
              onClick={() => fetchWeather(activeCity || 'Roorkee')}
            >
              ↺ Retry
            </button>
          </div>
        )}

        {/* ── Smart Rain Alert Banner ─────────────────────────────────── */}
        <RainAlertBanner
          timeline={rainAlertHook.timeline}
          alertLevel={rainAlertHook.alertLevel}
          rainAlert={rainAlertHook.rainAlert}
          fetchError={rainAlertHook.fetchError}
          lastChecked={rainAlertHook.lastChecked}
          isLoading={rainAlertHook.isLoading}
          isStale={rainAlertHook.isStale}
          alertsEnabled={rainAlertHook.alertsEnabled}
          language={rainAlertHook.language}
          demoMode={rainAlertHook.demoMode}
          notifPermission={rainAlertHook.notifPermission}
          toggleAlerts={rainAlertHook.toggleAlerts}
          toggleLanguage={rainAlertHook.toggleLanguage}
          toggleDemo={rainAlertHook.toggleDemo}
          requestPermission={rainAlertHook.requestPermission}
          sendTestNotification={rainAlertHook.sendTestNotification}
          refreshCheck={rainAlertHook.refreshCheck}
          locationReady={!!weather}
          RECOMMENDATIONS={rainAlertHook.RECOMMENDATIONS}
        />


        {/* Weather Card (Live Data) */}
        {!loading && !error && weather && (
          <div className="weather-card">
            {/* Current conditions */}
            <div className="weather-card__current">
              <div className="weather-card__main">
                <div className="weather-card__icon">{weather.icon}</div>
                <div>
                  <div className="weather-card__temp">{weather.temp}°C</div>
                  <div className="weather-card__condition">{weather.condition}</div>
                  <div className="weather-card__location">
                    📍 {weather.city}{weather.state ? `, ${weather.state}` : ''}
                  </div>
                  <div className="weather-card__feels">
                    Feels like {weather.feels}°C (Exact: {weather.exactTemp}°C)
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="weather-card__stats">
                {[
                  { icon: '💧', label: 'Humidity (Current)',   val: `${weather.humidity}%` },
                  { icon: '💨', label: 'Wind Speed',           val: `${weather.exactWind} km/h` },
                  { icon: '🌧', label: 'Precipitation',        val: `${weather.precipitation} mm` },
                  { icon: '🌍', label: 'Coordinates',          val: `${weather.lat.toFixed(2)}°N, ${weather.lon.toFixed(2)}°E` },
                  { icon: '⏰', label: 'Timezone',             val: weather.timezone },
                  { icon: '🛰️', label: 'Data Source',          val: 'Open-Meteo' },
                ].map((s) => (
                  <div className="weather-stat" key={s.label}>
                    <span className="weather-stat__icon">{s.icon}</span>
                    <span className="weather-stat__label">{s.label}</span>
                    <span className="weather-stat__val">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-day forecast */}
            <div className="weather-card__forecast">
              <h4 className="weather-card__forecast-title">5-Day Agricultural Forecast</h4>
              <div className="forecast-row">
                {weather.forecast.map((f, i) => (
                  <div className="forecast-day" key={f.date || i}>
                    <span className="forecast-day__name">{f.day}</span>
                    <span className="forecast-day__icon">{f.icon}</span>
                    <span className="forecast-day__high">{f.high}°</span>
                    <span className="forecast-day__low">{f.low}°</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Farm advisory */}
            <div className="weather-card__advisory">
              <span className="weather-card__advisory-icon">🧑‍🌾</span>
              <div>
                <p className="weather-card__advisory-title">Farming Weather Advisory</p>
                <p className="weather-card__advisory-text">{weather.advisory}</p>
              </div>
            </div>

            {/* Data Source & Consistency Note */}
            <div className="weather-card__note">
              <span className="weather-card__note-icon">ℹ️</span>
              <p>
                <strong>Data Source & Observation Note:</strong> Weather values are retrieved directly from Open-Meteo using high-resolution ECMWF / ICON atmospheric grid models for coordinates {weather.lat.toFixed(4)}° N, {weather.lon.toFixed(4)}° E in timezone {weather.timezone}. Minor differences (1–2°C and 5–10% relative humidity) compared to Google Weather / Weather.com are expected because Google frequently reports observations from regional airport METAR ground stations, whereas Open-Meteo calculates localized grid assimilation.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
