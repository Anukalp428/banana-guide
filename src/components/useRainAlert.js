
/**
 * useRainAlert — Advanced Smart Rain Alert Hook for FarmerConnect
 *
 * DATA RESOLUTION HONESTY:
 *   Open-Meteo free API returns HOURLY precipitation (1-hour slots).
 *   There is NO 15-minute or 30-minute granularity available without a
 *   paid meteorological radar API (e.g., Tomorrow.io, ClimaCell).
 *   We scan the next 2 hourly slots (~0-120 min ahead) and clearly
 *   label all forecasts with their actual resolution in the UI.
 *
 * ALERT LEVELS:
 *   CLEAR   - No precipitation forecast in next 2 hours
 *   WATCH   - precipitation 0.1-2.0 mm/hr, or WMO drizzle codes
 *   PREPARE - precipitation 2.0-7.5 mm/hr, or WMO rain codes
 *   SEVERE  - precipitation > 7.5 mm/hr, or WMO thunderstorm codes
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS   = 10 * 60 * 1000;
const STALE_THRESHOLD_MS = 20 * 60 * 1000;
const TIMELINE_HOURS     = 2;

const THRESH_WATCH   = 0.1;
const THRESH_PREPARE = 2.0;
const THRESH_SEVERE  = 7.5;

const WMO_SEVERE  = new Set([95, 96, 99]);
const WMO_PREPARE = new Set([61, 63, 65, 66, 67, 80, 81, 82]);
const WMO_WATCH   = new Set([51, 53, 55, 56, 57]);

function getAlertLevel(precipMm, wmoCode) {
  const mm   = Number(precipMm) || 0;
  const code = Number(wmoCode)  || 0;
  if (mm >= THRESH_SEVERE  || WMO_SEVERE.has(code))  return 'SEVERE';
  if (mm >= THRESH_PREPARE || WMO_PREPARE.has(code)) return 'PREPARE';
  if (mm >= THRESH_WATCH   || WMO_WATCH.has(code))   return 'WATCH';
  return 'CLEAR';
}

export const RECOMMENDATIONS = {
  SEVERE: {
    en: 'Thunderstorm risk! Move livestock to shelter, secure machinery, stop all field work immediately.',
    hi: 'Toofan ka khatara! Pashuon ko surakshit karein, machinery band karein, khet mein kaam rokein.',
  },
  PREPARE: {
    en: 'Moderate rain coming. Check drainage channels, postpone pesticide spraying, cover harvested produce.',
    hi: 'Tej baarish aanewali hai. Drainage check karein, spraying rokein, kaati hui fasal dhakein.',
  },
  WATCH: {
    en: 'Light rain possible. Avoid applying fertilizers. Monitor fields for waterlogging.',
    hi: 'Halki baarish ho sakti hai. Khad mat daalein. Khet mein paani jamne par nazar rakhein.',
  },
  CLEAR: {
    en: 'No rain in next 2 hours. Good time for spraying, harvesting, and field work.',
    hi: 'Agle 2 ghante baarish nahi. Spraying, katai aur khet ka kaam karne ka acha waqt hai.',
  },
};

function getDemoTimeline(city) {
  const now = new Date();
  const raw = [
    { off: 0,   precip: 0.0, code: 0  },
    { off: 60,  precip: 1.8, code: 61 },
    { off: 120, precip: 4.2, code: 63 },
  ];
  return raw.map((s, i) => {
    const slotTime = new Date(now.getTime() + s.off * 60000);
    return {
      slotKey:        'demo-' + i,
      slotTime,
      minutesFromNow: s.off,
      precipMm:       s.precip,
      weatherCode:    s.code,
      alertLevel:     getAlertLevel(s.precip, s.code),
      isDemo:         true,
      city,
    };
  });
}

function buildTimeline(hourlyTime, hourlyPrecip, hourlyCode, city) {
  const now       = new Date();
  const windowEnd = new Date(now.getTime() + TIMELINE_HOURS * 3600 * 1000);
  const slots     = [];
  for (let i = 0; i < hourlyTime.length; i++) {
    const slotTime = new Date(hourlyTime[i]);
    if (slotTime < new Date(now.getTime() - 30 * 60000)) continue;
    if (slotTime > windowEnd)                             break;
    const precip = Number(hourlyPrecip[i]) || 0;
    const code   = Number(hourlyCode[i])   || 0;
    slots.push({
      slotKey:        hourlyTime[i],
      slotTime,
      minutesFromNow: Math.round((slotTime - now) / 60000),
      precipMm:       precip,
      weatherCode:    code,
      alertLevel:     getAlertLevel(precip, code),
      isDemo:         false,
      city,
    });
    if (slots.length >= 3) break;
  }
  return slots;
}

function peakLevel(timeline) {
  const order = ['CLEAR', 'WATCH', 'PREPARE', 'SEVERE'];
  return timeline.reduce(
    (max, s) => order.indexOf(s.alertLevel) > order.indexOf(max) ? s.alertLevel : max,
    'CLEAR'
  );
}

export function useRainAlert() {
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    try { return localStorage.getItem('rainAlerts_enabled') !== 'false'; }
    catch { return true; }
  });
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('rainAlerts_lang') || 'en'; }
    catch { return 'en'; }
  });
  const [demoMode,      setDemoMode]      = useState(false);
  const [location,      setLocation]      = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [timeline,    setTimeline]    = useState([]);
  const [alertLevel,  setAlertLevel]  = useState('CLEAR');
  const [rainAlert,   setRainAlert]   = useState(null);
  const [fetchError,  setFetchError]  = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);

  const notifiedSlots = useRef(new Set());

  const toggleAlerts = useCallback(() => {
    setAlertsEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('rainAlerts_enabled', String(next)); } catch { }
      return next;
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'hi' : 'en';
      try { localStorage.setItem('rainAlerts_lang', next); } catch { }
      return next;
    });
  }, []);

  const toggleDemo = useCallback(() => setDemoMode(prev => !prev), []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission !== 'default') {
      setNotifPermission(Notification.permission);
      return Notification.permission;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    return result;
  }, []);

  const _fireNotification = useCallback((title, body, tag) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, { body, icon: '/favicon.ico', tag, requireInteraction: false });
      setTimeout(() => n.close(), 12000);
    } catch (err) {
      console.warn('[RainAlert] Notification error:', err);
    }
  }, []);

  const sendNotificationForSlot = useCallback((slot) => {
    if (!alertsEnabled) return;
    if (notifiedSlots.current.has(slot.slotKey)) return;
    notifiedSlots.current.add(slot.slotKey);
    const lang  = language;
    const mins  = slot.minutesFromNow;
    const emoji = slot.alertLevel === 'SEVERE' ? '⛈️' : slot.alertLevel === 'PREPARE' ? '🌧️' : '🌦️';
    const title = `${emoji} FarmerConnect Rain Alert`;
    const body  = lang === 'hi'
      ? `${slot.city ? slot.city + ' mein ' : ''}${mins <= 5 ? 'abhi' : 'lagbhag ' + mins + ' min mein'} baarish. ${RECOMMENDATIONS[slot.alertLevel].hi}`
      : `${slot.city ? slot.city + ': ' : ''}Rain ${mins <= 5 ? 'now' : 'in ~' + mins + 'min'}. ${RECOMMENDATIONS[slot.alertLevel].en}`;
    _fireNotification(title, body, 'rain-' + slot.slotKey);
  }, [alertsEnabled, language, _fireNotification]);

  const sendTestNotification = useCallback(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    _fireNotification(
      '🧪 FarmerConnect — Test Notification',
      language === 'hi'
        ? 'Yah ek pariksha soochna hai. Rain Alert sakt hai. 🌧️'
        : 'This is a test notification. Rain Alert is working. 🌧️',
      'test-' + Date.now()
    );
  }, [language, _fireNotification]);

  const checkRain = useCallback(async (loc) => {
    if (!loc) return;
    setFetchError(null);
    setIsLoading(true);
    try {
      const { lat, lon, city } = loc;
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&hourly=precipitation,weather_code` +
        `&forecast_days=2` +
        `&timezone=Asia%2FKolkata`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}. Please try again.`);

      const data   = await res.json();
      const hourly = data.hourly;
      if (!hourly?.time?.length)
        throw new Error('Hourly forecast data unavailable. Check your internet connection.');

      const slots    = buildTimeline(hourly.time, hourly.precipitation, hourly.weather_code, city);
      const peak     = peakLevel(slots);
      const firstRain = slots.find(s => s.alertLevel !== 'CLEAR') || null;

      setTimeline(slots);
      setAlertLevel(peak);
      setRainAlert(firstRain);
      setLastChecked(new Date());

      if (alertsEnabled && firstRain) {
        sendNotificationForSlot(firstRain);
      }
    } catch (err) {
      console.error('[RainAlert]', err);
      setFetchError(err.message || 'Forecast fetch failed.');
    } finally {
      setIsLoading(false);
    }
  }, [alertsEnabled, sendNotificationForSlot]);

  // Demo mode update
  useEffect(() => {
    if (!demoMode) return;
    const slots = getDemoTimeline(location?.city || 'Demo City');
    setTimeline(slots);
    setAlertLevel(peakLevel(slots));
    setRainAlert(slots.find(s => s.alertLevel !== 'CLEAR') || null);
    setLastChecked(new Date());
    setFetchError(null);
  }, [demoMode, location]);

  // Fetch on location change
  useEffect(() => {
    if (!location || demoMode) return;
    checkRain(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, demoMode]);

  // Periodic poll
  useEffect(() => {
    if (!location || demoMode) return;
    const id = setInterval(() => checkRain(location), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [location, checkRain, demoMode]);

  // Sync permission
  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission);
  }, []);

  const isStale = lastChecked ? (Date.now() - lastChecked.getTime()) > STALE_THRESHOLD_MS : false;

  return {
    timeline, alertLevel, rainAlert, fetchError, lastChecked, isLoading, isStale,
    alertsEnabled, language, demoMode, notifPermission,
    setLocation, toggleAlerts, toggleLanguage, toggleDemo,
    requestPermission, sendTestNotification, RECOMMENDATIONS,
    refreshCheck: () => {
      if (demoMode) {
        const slots = getDemoTimeline(location?.city || 'Demo City');
        setTimeline(slots);
        setAlertLevel(peakLevel(slots));
        setRainAlert(slots.find(s => s.alertLevel !== 'CLEAR') || null);
        setLastChecked(new Date());
      } else {
        checkRain(location);
      }
    },
  };
}

