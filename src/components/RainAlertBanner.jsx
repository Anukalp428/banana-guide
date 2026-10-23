import { useState } from 'react';
import './RainAlertBanner.css';

/* ── Level meta ─────────────────────────────────────────────────────────── */
const LEVEL_META = {
  CLEAR:   { emoji: '☀️',  label: 'All Clear',   labelHi: 'Sab Theek',       cls: 'clear'   },
  WATCH:   { emoji: '🌦️', label: 'Watch',        labelHi: 'Dhyan Rakhein',   cls: 'watch'   },
  PREPARE: { emoji: '🌧️', label: 'Prepare',      labelHi: 'Taiyari Karein',  cls: 'prepare' },
  SEVERE:  { emoji: '⛈️', label: 'Severe Alert', labelHi: 'Khatranaak Alert', cls: 'severe'  },
};

const WMO_LABEL = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
};

function wmoLabel(code) { return WMO_LABEL[code] || `Code ${code}`; }

function fmtTime(date) {
  if (!date) return '--';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function TimelineBar({ slot, language }) {
  const meta  = LEVEL_META[slot.alertLevel];
  const mins  = slot.minutesFromNow;
  const label = mins <= 0 ? 'Now' : mins < 60 ? `+${mins}m` : `+${Math.round(mins / 60)}h`;

  return (
    <div className={`ra-slot ra-slot--${meta.cls}${slot.isDemo ? ' ra-slot--demo' : ''}`}>
      <div className="ra-slot__time">{label}</div>
      <div className="ra-slot__bar-wrap">
        <div
          className="ra-slot__bar"
          style={{ height: `${Math.min(100, (slot.precipMm / 10) * 100)}%` }}
          title={`${slot.precipMm.toFixed(1)} mm/hr`}
        />
      </div>
      <div className="ra-slot__emoji">{meta.emoji}</div>
      <div className="ra-slot__mm">
        {slot.precipMm > 0 ? `${slot.precipMm.toFixed(1)}mm` : '0'}
      </div>
      <div className="ra-slot__condition">{wmoLabel(slot.weatherCode)}</div>
      <div className={`ra-slot__level ra-slot__level--${meta.cls}`}>
        {language === 'hi' ? meta.labelHi : meta.label}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function RainAlertBanner({
  timeline, alertLevel, rainAlert, fetchError, lastChecked, isLoading, isStale,
  alertsEnabled, language, demoMode, notifPermission,
  toggleAlerts, toggleLanguage, toggleDemo,
  requestPermission, sendTestNotification, refreshCheck,
  locationReady, RECOMMENDATIONS,
}) {
  const [showInfo, setShowInfo] = useState(false);

  const meta       = LEVEL_META[alertLevel] || LEVEL_META.CLEAR;
  const checkedStr = fmtTime(lastChecked);

  const hi = language === 'hi';

  const permLabel = {
    granted:     hi ? '🔔 Suochnaayen ON' : '🔔 Notifications ON',
    denied:      hi ? '🔕 Block hai'      : '🔕 Blocked',
    default:     hi ? '🔔 Allow karein'   : '🔔 Enable Notifications',
    unsupported: hi ? '❌ Support nahi'   : '❌ Not Supported',
  }[notifPermission] || '🔔 Enable Notifications';

  const rec = RECOMMENDATIONS?.[alertLevel] || { en: '', hi: '' };

  return (
    <div className={`ra-panel ra-panel--${meta.cls}${demoMode ? ' ra-panel--demo' : ''}`}
         role="region" aria-label="Smart Rain Alert">

      {/* ── Demo badge ──────────────────────────────────────────────────── */}
      {demoMode && (
        <div className="ra-demo-ribbon">
          🧪 {hi ? 'DEMO MODE — नकली डेटा' : 'DEMO MODE — SIMULATED DATA (Not real forecast)'}
        </div>
      )}

      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="ra-header">
        <div className="ra-header__left">
          <span className="ra-header__icon">{meta.emoji}</span>
          <div>
            <div className="ra-header__title">
              🌧️ {hi ? 'स्मार्ट बारिश अलर्ट' : 'Smart Rain Alert'}
              {isStale && !isLoading && (
                <span className="ra-stale-badge">
                  {hi ? '⚠️ पुराना डेटा' : '⚠️ Stale data'}
                </span>
              )}
            </div>
            <div className="ra-header__sub">
              {locationReady ? (
                <>
                  {isLoading
                    ? (hi ? 'Forecast la rahe hain...' : 'Fetching forecast...')
                    : lastChecked
                    ? (hi ? `Checked: ${checkedStr} • Auto-refresh: 10 min` : `Last checked: ${checkedStr} • Auto-refreshes every 10 min`)
                    : (hi ? 'Forecast abhi tak nahi' : 'Forecast not yet fetched')}
                </>
              ) : (
                hi ? 'Location select karein forecast ke liye' : 'Search a city above to activate alerts'
              )}
            </div>
          </div>
        </div>

        <div className="ra-header__controls">
          {/* Language toggle */}
          <button type="button" className="ra-btn ra-btn--lang" onClick={toggleLanguage}
                  title="Toggle Hindi / English">
            {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>

          {/* Demo mode toggle */}
          <button type="button"
                  className={`ra-btn ${demoMode ? 'ra-btn--demo-on' : 'ra-btn--demo-off'}`}
                  onClick={toggleDemo} id="rain-demo-toggle">
            {demoMode ? '📡 ' + (hi ? 'Live' : 'Live') : '🧪 ' + (hi ? 'Demo' : 'Demo')}
          </button>

          {/* Refresh */}
          {locationReady && !isLoading && (
            <button type="button" className="ra-btn ra-btn--refresh" onClick={refreshCheck}
                    id="rain-refresh-btn" title="Refresh now">
              ↺
            </button>
          )}
          {isLoading && <span className="ra-spinner" aria-label="Loading" />}

          {/* Alerts ON/OFF */}
          <button type="button" id="rain-alert-toggle"
                  className={`ra-toggle ${alertsEnabled ? 'ra-toggle--on' : 'ra-toggle--off'}`}
                  onClick={toggleAlerts} aria-pressed={alertsEnabled}>
            <span className="ra-toggle__track"><span className="ra-toggle__thumb"/></span>
            <span className="ra-toggle__label">{alertsEnabled ? (hi ? 'ON' : 'ON') : (hi ? 'OFF' : 'OFF')}</span>
          </button>
        </div>
      </div>

      {/* ── Current risk level banner ────────────────────────────────────── */}
      <div className={`ra-risk ra-risk--${meta.cls}`}>
        <div className="ra-risk__left">
          <div className="ra-risk__level-label">
            {hi ? 'अभी का स्तर' : 'Current Risk'}
          </div>
          <div className="ra-risk__level-name">
            <span className="ra-risk__emoji">{meta.emoji}</span>
            {hi ? meta.labelHi : meta.label}
          </div>
          {rainAlert && (
            <div className="ra-risk__next-rain">
              {hi
                ? `अगली बारिश: लगभग ${rainAlert.minutesFromNow} मिनट में`
                : `Next rain: ~${rainAlert.minutesFromNow} min`}
              {rainAlert.precipMm > 0 &&
                ` • ${rainAlert.precipMm.toFixed(1)} mm/hr`}
            </div>
          )}
          {!rainAlert && locationReady && !fetchError && (
            <div className="ra-risk__next-rain">
              {hi ? 'अगले 2 घंटे साफ़ मौसम' : 'Clear for next 2 hours'}
            </div>
          )}
        </div>
        <div className="ra-risk__rec">
          <div className="ra-risk__rec-label">
            🧑‍🌾 {hi ? 'किसान सलाह' : 'Farmer Advice'}
          </div>
          <div className="ra-risk__rec-text">
            {hi ? rec.hi : rec.en}
          </div>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {locationReady && fetchError && (
        <div className="ra-error" role="alert">
          <span>⚠️</span>
          <div>
            <strong>{hi ? 'Forecast unavailable' : 'Forecast unavailable'}</strong>
            <p>{fetchError}</p>
            <p className="ra-error__note">
              {hi
                ? 'Sirf live forecast dikhaya jayega. Koi nakli data nahi.'
                : 'Only live forecast data is shown. No simulated data is substituted.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      {locationReady && !fetchError && timeline.length > 0 && (
        <div className="ra-timeline">
          <div className="ra-timeline__header">
            <span className="ra-timeline__title">
              📊 {hi ? 'अगले 2 घंटे (Hourly)' : 'Next 2 Hours — Hourly Forecast'}
            </span>
            <span className="ra-timeline__res-badge">
              {hi ? '⏱ 1-घंटा रिज़ॉल्यूशन' : '⏱ 1-hour resolution'}
            </span>
          </div>
          <div className="ra-timeline__slots">
            {timeline.map(slot => (
              <TimelineBar key={slot.slotKey} slot={slot} language={language} />
            ))}
          </div>
        </div>
      )}

      {/* ── Alerts OFF ───────────────────────────────────────────────────── */}
      {!alertsEnabled && (
        <div className="ra-msg ra-msg--off">
          🔕 {hi ? 'Alerts band hain. Toggle karein ON karne ke liye.' : 'Alerts are OFF. Toggle ON to receive rain warnings.'}
        </div>
      )}

      {/* ── Notification controls ─────────────────────────────────────────── */}
      <div className="ra-notif-bar">
        <div className="ra-notif-bar__info">
          <button type="button" className="ra-info-btn" onClick={() => setShowInfo(p => !p)}
                  aria-expanded={showInfo}>ℹ️</button>
          <span className="ra-notif-bar__scope">
            {hi
              ? '⚠️ Notifications sirf browser khule rehne par kaam karti hain.'
              : '⚠️ Notifications only work while this tab is open (browser-only).'}
          </span>
        </div>
        <div className="ra-notif-bar__actions">
          {notifPermission === 'default' && (
            <button type="button" id="rain-enable-notif-btn"
                    className="ra-btn ra-btn--perm-request"
                    onClick={requestPermission}>
              🔔 {hi ? 'Notifications Allow Karein' : 'Enable Notifications'}
            </button>
          )}
          {notifPermission === 'granted' && (
            <>
              <span className="ra-notif-granted">✅ {hi ? 'Notifications Active' : 'Notifications Active'}</span>
              <button type="button" id="rain-test-notif-btn"
                      className="ra-btn ra-btn--test"
                      onClick={sendTestNotification}>
                🧪 {hi ? 'Test' : 'Test'}
              </button>
            </>
          )}
          {notifPermission === 'denied' && (
            <span className="ra-notif-denied">
              🔕 {hi ? 'Blocked — Browser Settings mein Allow karein' : 'Blocked — Allow in Browser Settings'}
            </span>
          )}
          {notifPermission === 'unsupported' && (
            <span className="ra-notif-unsupported">❌ {hi ? 'Browser support nahi' : 'Not supported in this browser'}</span>
          )}
        </div>
      </div>

      {/* ── Info panel ───────────────────────────────────────────────────── */}
      {showInfo && (
        <div className="ra-info-panel">
          <h4>ℹ️ {hi ? 'Smart Rain Alert — Jaankari' : 'Smart Rain Alert — How it works'}</h4>
          <ul>
            <li>
              <strong>{hi ? 'Data source:' : 'Data source:'}</strong>{' '}
              Open-Meteo free API — {hi ? 'hourly precipitation (mm/hr)' : 'hourly precipitation (mm/hr)'}
            </li>
            <li>
              <strong>{hi ? 'Resolution:' : 'Resolution:'}</strong>{' '}
              {hi
                ? '1 ghanta (hourly). 15-minute ya 30-minute data free API mein available nahi hai.'
                : '1 hour (hourly). 15-minute or 30-minute data is NOT available in the free API.'}
            </li>
            <li>
              <strong>{hi ? 'Alert levels:' : 'Alert levels:'}</strong>{' '}
              WATCH (&gt;0.1mm), PREPARE (&gt;2mm), SEVERE (&gt;7.5mm / WMO 95-99)
            </li>
            <li>
              <strong>{hi ? 'Duplicate prevention:' : 'Duplicate prevention:'}</strong>{' '}
              {hi
                ? 'Har event ke liye sirf ek notification — session mein repeat nahi hogi.'
                : 'One notification per rain slot per session. No spam.'}
            </li>
            <li>
              <strong>{hi ? 'Background push:' : 'Background push:'}</strong>{' '}
              {hi
                ? 'Implemented NAHI hai. Service Worker + Push Server chahiye. Website band hone par notifications nahi aayengi.'
                : 'NOT implemented. Requires a Service Worker + Push Server setup. Notifications stop when the browser tab closes.'}
            </li>
            <li>
              <strong>{hi ? 'Demo mode:' : 'Demo mode:'}</strong>{' '}
              {hi
                ? 'Clearly labeled SIMULATED data. Live forecast se kabhi mix nahi hoga.'
                : 'Clearly labeled SIMULATED data. Never mixed with live forecasts.'}
            </li>
          </ul>
        </div>
      )}

      {/* ── API resolution notice ─────────────────────────────────────────── */}
      <div className="ra-res-notice">
        <span>📡</span>
        <span>
          <strong>{hi ? 'Forecast resolution:' : 'Forecast resolution:'}</strong>{' '}
          {hi
            ? 'Open-Meteo free API sirf hourly data deta hai. 15-min / 30-min granularity ke liye paid radar API (Tomorrow.io, ClimaCell) zaruri hai. Yahan koi fake data nahi banana.'
            : 'Open-Meteo free API provides hourly data only. 15/30-minute granularity requires a paid radar API. No fake forecast data is generated here.'}
        </span>
      </div>
    </div>
  );
}

