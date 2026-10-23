/**
 * CropRecommendation.jsx
 *
 * Yeh component ek form dikhata hai jisme farmer apni details bharta hai,
 * aur phir uske fields ke hisaab se suitable crops suggest kiye jaate hain.
 *
 * React Concepts Used:
 *  - useState  : Form ki values, errors, loading, aur results store karta hai
 *  - Controlled Inputs : Har input ka value React state se connected hai
 *  - Conditional Rendering : Kabhi form, kabhi loading, kabhi results dikhao
 */

import { useState } from 'react';
import { SOIL_TYPES, SEASONS, STATES, getRecommendations } from '../data/cropData';
import './CropRecommendation.css';

// ─── Water need color coding ─────────────────────────────────────────────────
const WATER_COLOR = { Low: '#43a047', Medium: '#fb8c00', High: '#e53935' };

// ─── Initial form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  soil:      '',   // Soil type
  season:    '',   // Kharif / Rabi / Zaid
  state:     '',   // State of farmer
  irrigated: '',   // 'yes' or 'no'
  ph:        '',   // Soil pH (3.5 - 9.5)
  n:         '',   // Nitrogen (kg/ha)
  p:         '',   // Phosphorus (kg/ha)
  k:         '',   // Potassium (kg/ha)
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CropRecommendation() {

  /**
   * useState Hook — React ka ek tool hai state manage karne ke liye
   *
   * Simple example:
   *   const [count, setCount] = useState(0);
   *   count   → current value (0)
   *   setCount → value change karne ka function
   *   jab setCount call hota hai, React screen dobara render karta hai
   */
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [errors,      setErrors]      = useState({});     // Validation errors
  const [results,     setResults]     = useState(null);   // Recommended crops
  const [loading,     setLoading]     = useState(false);  // Loading spinner
  const [submitted,   setSubmitted]   = useState(false);  // Has form been submitted
  const [systemError, setSystemError] = useState(null);   // Calculation or execution error

  // ── Controlled Input Handler ────────────────────────────────────────────────
  // Jab bhi koi field change hoti hai, form state update hoti hai
  // e.target.name  → field ka name (soil / season / state / irrigated)
  // e.target.value → naya value jo user ne dala
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Jaise hi user kuch bharta hai, us field ka error hata do
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!form.soil)      newErrors.soil      = 'Please select a soil type';
    if (!form.season)    newErrors.season    = 'Please select a season (Kharif / Rabi / Zaid)';
    if (!form.state)     newErrors.state     = 'Please select your state';
    if (!form.irrigated) newErrors.irrigated = 'Please specify your irrigation facility';

    // Soil pH Validation
    if (!form.ph || form.ph.trim() === '') {
      newErrors.ph = 'Please enter soil pH (e.g. 6.5)';
    } else {
      const phVal = parseFloat(form.ph);
      if (isNaN(phVal) || phVal < 3.5 || phVal > 9.5) {
        newErrors.ph = 'Soil pH must be between 3.5 and 9.5';
      }
    }

    // Nitrogen (N) Validation
    if (!form.n || form.n.trim() === '') {
      newErrors.n = 'Please enter Nitrogen (N) in kg/ha';
    } else {
      const nVal = parseFloat(form.n);
      if (isNaN(nVal) || nVal < 0 || nVal > 300) {
        newErrors.n = 'Nitrogen must be between 0 and 300 kg/ha';
      }
    }

    // Phosphorus (P) Validation
    if (!form.p || form.p.trim() === '') {
      newErrors.p = 'Please enter Phosphorus (P) in kg/ha';
    } else {
      const pVal = parseFloat(form.p);
      if (isNaN(pVal) || pVal < 0 || pVal > 200) {
        newErrors.p = 'Phosphorus must be between 0 and 200 kg/ha';
      }
    }

    // Potassium (K) Validation
    if (!form.k || form.k.trim() === '') {
      newErrors.k = 'Please enter Potassium (K) in kg/ha';
    } else {
      const kVal = parseFloat(form.k);
      if (isNaN(kVal) || kVal < 0 || kVal > 400) {
        newErrors.k = 'Potassium must be between 0 and 400 kg/ha';
      }
    }

    return newErrors;
  };

  // ── Autofill standard soil test defaults ─────────────────────────────────────
  const handleAutofillNutrients = () => {
    setForm(prev => ({
      ...prev,
      ph: '6.8',
      n: '80',
      p: '40',
      k: '45',
    }));
    setErrors(prev => ({
      ...prev,
      ph: '',
      n: '',
      p: '',
      k: '',
    }));
  };

  // ── Form Submit Handler ─────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form reload

    // Run validation first
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setResults(null);
    setSystemError(null);

    // Simulate async recommendation generation
    setTimeout(() => {
      try {
        const irrigated = form.irrigated === 'yes';
        const crops = getRecommendations(form.season, form.soil, irrigated, form.state, {
          ph: form.ph,
          n: form.n,
          p: form.p,
          k: form.k,
        });
        setResults(crops);
        setSubmitted(true);
        setLoading(false);

        // Smooth scroll into results
        setTimeout(() => {
          document.getElementById('crop-results-area')?.scrollIntoView({
            behavior: 'smooth', block: 'start',
          });
        }, 100);
      } catch {
        setSystemError('An unexpected error occurred while analyzing crop parameters. Please try again.');
        setSubmitted(true);
        setLoading(false);
      }
    }, 800);
  };

  // ── Reset Handler ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setResults(null);
    setSubmitted(false);
    setSystemError(null);
    document.getElementById('crop-recommendation')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section className="crop-section" id="crop-recommendation">
      <div className="container">

        {/* ── Section Header ─────────────────────────────────────────── */}
        <div className="crop-section__header">
          <span className="section-label">🌱 Smart Suggestions</span>
          <h2 className="section-title">Crop Recommendation</h2>
          <p className="section-subtitle">
            Enter your farm details — we will suggest the most suitable crops based on
            your soil type, season, and water availability.
          </p>
          {/* ⚠️ Demo disclaimer */}
          <div className="crop-section__disclaimer">
            ⚠️ <strong>Demo Recommendations:</strong> This is sample data — please consult
            your local Agriculture Extension Officer for certified farming advice.
          </div>
        </div>

        {/* ── Two-column layout: Form | Results ──────────────────────── */}
        <div className="crop-section__body">

          {/* ════════════════════════════════════════════════════════════
              LEFT SIDE: FORM CARD
              ════════════════════════════════════════════════════════════ */}
          <div className="crop-form-card">
            <div className="crop-form-card__icon" aria-hidden="true">🧑‍🌾</div>
            <h3 className="crop-form-card__title">Enter Farm Details</h3>
            <p className="crop-form-card__subtitle">
              All fields are required (Required *)
            </p>

            <form onSubmit={handleSubmit} className="crop-form" id="crop-form" noValidate>

              {/* Field 1 — Soil Type ──────────────────────────────────── */}
              <div className={`form-group ${errors.soil ? 'form-group--error' : ''}`}>
                <label htmlFor="cr-soil">
                  🪨 Soil Type <span className="required-star">*</span>
                </label>
                <select
                  id="cr-soil"
                  name="soil"
                  value={form.soil}
                  onChange={handleChange}
                  aria-describedby={errors.soil ? 'err-soil' : undefined}
                >
                  <option value="" disabled>— Select Soil Type —</option>
                  {SOIL_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {/* Error message — sirf tabhi dikhega jab soil khaali ho */}
                {errors.soil && (
                  <span className="field-error" id="err-soil" role="alert">
                    ❌ {errors.soil}
                  </span>
                )}
              </div>

              {/* Field 2 — Season ─────────────────────────────────────── */}
              <div className={`form-group ${errors.season ? 'form-group--error' : ''}`}>
                <label htmlFor="cr-season">
                  📅 Season (Crop Period) <span className="required-star">*</span>
                </label>
                <select
                  id="cr-season"
                  name="season"
                  value={form.season}
                  onChange={handleChange}
                  aria-describedby={errors.season ? 'err-season' : undefined}
                >
                  <option value="" disabled>— Select Season —</option>
                  {SEASONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {errors.season && (
                  <span className="field-error" id="err-season" role="alert">
                    ❌ {errors.season}
                  </span>
                )}
              </div>

              {/* Field 3 — State ─────────────────────────────────────── */}
              <div className={`form-group ${errors.state ? 'form-group--error' : ''}`}>
                <label htmlFor="cr-state">
                  📍 State <span className="required-star">*</span>
                </label>
                <select
                  id="cr-state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  aria-describedby={errors.state ? 'err-state' : undefined}
                >
                  <option value="" disabled>— Select State —</option>
                  {STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && (
                  <span className="field-error" id="err-state" role="alert">
                    ❌ {errors.state}
                  </span>
                )}
              </div>

              {/* Field 4 — Irrigation ──────────────────────────────── */}
              <div className={`form-group ${errors.irrigated ? 'form-group--error' : ''}`}>
                <label>
                  💧 Irrigation Facility Available? <span className="required-star">*</span>
                </label>
                <div className="irrigation-toggle" role="group" aria-label="Irrigation availability">
                  {/* YES button */}
                  <button
                    type="button"
                    id="irrigation-yes"
                    className={`irrigation-btn ${form.irrigated === 'yes' ? 'irrigation-btn--active' : ''}`}
                    onClick={() => {
                      setForm(prev => ({ ...prev, irrigated: 'yes' }));
                      if (errors.irrigated) setErrors(p => ({ ...p, irrigated: '' }));
                    }}
                  >
                    ✅ Yes, Irrigated
                  </button>
                  {/* NO button */}
                  <button
                    type="button"
                    id="irrigation-no"
                    className={`irrigation-btn ${form.irrigated === 'no' ? 'irrigation-btn--active irrigation-btn--no' : ''}`}
                    onClick={() => {
                      setForm(prev => ({ ...prev, irrigated: 'no' }));
                      if (errors.irrigated) setErrors(p => ({ ...p, irrigated: '' }));
                    }}
                  >
                    ❌ No, Rainfed Only
                  </button>
                </div>
                {errors.irrigated && (
                  <span className="field-error" id="err-irrigated" role="alert">
                    ❌ {errors.irrigated}
                  </span>
                )}
              </div>

              {/* Field 5–8 — Soil Health Card: pH & N-P-K Nutrients ──── */}
              <div className="crop-nutrients-section">
                <div className="crop-nutrients-header">
                  <span className="crop-nutrients-title">
                    🧪 Soil pH & N-P-K Nutrients <span className="required-star">*</span>
                  </span>
                  <button
                    type="button"
                    className="soil-autofill-btn"
                    onClick={handleAutofillNutrients}
                    title="Fill standard fertile loam values"
                  >
                    ⚡ Autofill Standard Values
                  </button>
                </div>

                <div className="nutrients-grid">
                  {/* pH */}
                  <div className={`form-group ${errors.ph ? 'form-group--error' : ''}`}>
                    <label htmlFor="cr-ph">
                      Soil pH <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="cr-ph"
                      name="ph"
                      placeholder="e.g. 6.5"
                      value={form.ph}
                      onChange={handleChange}
                    />
                    {errors.ph && <span className="field-error-mini">❌ {errors.ph}</span>}
                  </div>

                  {/* Nitrogen (N) */}
                  <div className={`form-group ${errors.n ? 'form-group--error' : ''}`}>
                    <label htmlFor="cr-n">
                      Nitrogen (N) <small>(kg/ha)</small> <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      id="cr-n"
                      name="n"
                      placeholder="e.g. 80"
                      value={form.n}
                      onChange={handleChange}
                    />
                    {errors.n && <span className="field-error-mini">❌ {errors.n}</span>}
                  </div>

                  {/* Phosphorus (P) */}
                  <div className={`form-group ${errors.p ? 'form-group--error' : ''}`}>
                    <label htmlFor="cr-p">
                      Phosphorus (P) <small>(kg/ha)</small> <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      id="cr-p"
                      name="p"
                      placeholder="e.g. 40"
                      value={form.p}
                      onChange={handleChange}
                    />
                    {errors.p && <span className="field-error-mini">❌ {errors.p}</span>}
                  </div>

                  {/* Potassium (K) */}
                  <div className={`form-group ${errors.k ? 'form-group--error' : ''}`}>
                    <label htmlFor="cr-k">
                      Potassium (K) <small>(kg/ha)</small> <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      id="cr-k"
                      name="k"
                      placeholder="e.g. 45"
                      value={form.k}
                      onChange={handleChange}
                    />
                    {errors.k && <span className="field-error-mini">❌ {errors.k}</span>}
                  </div>
                </div>
              </div>

              {/* Submit + Reset buttons ──────────────────────────────── */}
              <div className="crop-form__actions">
                <button
                  type="submit"
                  className="btn-primary crop-form__submit"
                  id="crop-form-submit"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner" aria-hidden="true" /> Finding crops…</>
                    : '🔍 Suggest Crops'}
                </button>

                {/* Reset button */}
                {submitted && (
                  <button
                    type="button"
                    className="btn-outline crop-form__reset"
                    id="crop-form-reset"
                    onClick={handleReset}
                  >
                    ↺ Reset Form
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ════════════════════════════════════════════════════════════
              RIGHT SIDE: RESULTS AREA
              ════════════════════════════════════════════════════════════ */}
          <div className="crop-results" id="crop-results-area">

            {/* State 1: Placeholder ─────────────────────────────────── */}
            {!submitted && !loading && !systemError && (
              <div className="crop-results__placeholder">
                <div className="crop-results__placeholder-icon">🌾</div>
                <h4>Recommendations Will Appear Here!</h4>
                <p>
                  Fill out the form on the left — select your soil, season, state,
                  and irrigation facility, then click <strong>"Suggest Crops"</strong>.
                </p>
                <div className="crop-results__steps">
                  {['🪨 Select Soil', '📅 Select Season', '📍 Select State', '💧 Specify Irrigation'].map((s, i) => (
                    <div key={i} className="crop-results__step">
                      <span className="crop-results__step-num">{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State 2: Loading spinner ─────────────────────────────── */}
            {loading && (
              <div className="crop-results__loading">
                <div className="crop-results__loading-spinner" aria-label="Loading" />
                <p className="crop-results__loading-text">
                  🌾 Analyzing soil, season, and regional suitability…
                </p>
              </div>
            )}

            {/* State 3: Error State ──────────────────────────────────── */}
            {!loading && systemError && (
              <div className="crop-results__error" role="alert">
                <div className="crop-results__error-icon">⚠️</div>
                <h4>Unable to Generate Recommendations</h4>
                <p>{systemError}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmit}
                  style={{ marginTop: '12px' }}
                >
                  ↺ Try Again
                </button>
              </div>
            )}

            {/* State 4: Empty Results State ─────────────────────────── */}
            {!loading && !systemError && submitted && results && results.length === 0 && (
              <div className="crop-results__empty">
                <div className="crop-results__empty-icon">🌱</div>
                <h4>No Suitable Crops Found</h4>
                <p>
                  No crops matched the combination of <strong>{form.soil} soil</strong> in the <strong>{form.season} season</strong> with <strong>{form.irrigated === 'yes' ? 'irrigation' : 'rainfed only'}</strong> conditions.
                </p>
                <p className="crop-results__empty-hint">
                  💡 Tip: Try enabling irrigation or selecting an alternate season to view viable crops.
                </p>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleReset}
                  style={{ marginTop: '14px' }}
                >
                  ↺ Adjust Farm Details
                </button>
              </div>
            )}

            {/* State 5: Results Grid ─────────────────────────────────── */}
            {!loading && !systemError && results && results.length > 0 && (
              <div className="crop-results__grid">

                {/* Summary banner */}
                <div className="crop-results__summary">
                  <span className="crop-results__summary-icon">✅</span>
                  <div>
                    <p className="crop-results__summary-title">
                      {results.length} Crop{results.length > 1 ? 's' : ''} Recommended
                    </p>
                    <p className="crop-results__summary-sub">
                      <strong>{form.soil} Soil</strong> •{' '}
                      <strong>{form.season} Season</strong> •{' '}
                      <strong>{form.state}</strong> •{' '}
                      <strong>pH {form.ph}</strong> •{' '}
                      <strong>NPK: {form.n}-{form.p}-{form.k} kg/ha</strong> •{' '}
                      <strong>{form.irrigated === 'yes' ? '💧 Irrigation Available' : '🌧 Rainfed Only'}</strong>
                    </p>
                    <div className="demo-rule-badge">
                      🧪 Rule-Based Demo Simulation — Not Connected to Machine Learning Models
                    </div>
                  </div>
                </div>

                {/* Individual crop cards */}
                {results.map((crop, i) => (
                  <CropResultCard key={i} crop={crop} rank={i + 1} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CropResultCard — ek crop dikhane ka component ───────────────────────────
/**
 * Yeh ek alag chota component hai — ek crop ka card banata hai.
 * Props (inputs) receive karta hai parent component se:
 *   crop  → crop ka poora data object
 *   rank  → #1, #2, #3 badge ke liye
 */
function CropResultCard({ crop, rank }) {
  const [expanded, setExpanded] = useState(false); // Tips expand/collapse

  // Agar warning card hai toh alag style
  const isWarning = crop.waterNeed === 'High' && crop.yield === '—';

  return (
    <div
      className={`crop-result-card ${isWarning ? 'crop-result-card--warning' : ''}`}
      style={{ animationDelay: `${(rank - 1) * 0.1}s` }}
    >
      {/* Left accent bar — rank ke hisaab se color */}
      <div className="crop-result-card__accent" />

      {/* Top row: emoji + name + rank */}
      <div className="crop-result-card__top">
        <div className="crop-result-card__emoji">{crop.icon}</div>
        <div className="crop-result-card__header">
          <div className="crop-result-card__title-row">
            <h4 className="crop-result-card__name">{crop.name}</h4>
            {crop.isStateRecommended && (
              <span className="crop-result-card__state-badge">
                📍 {crop.stateNote || 'Recommended for your State'}
              </span>
            )}
            {crop.isNitrogenFixer && (
              <span className="crop-result-card__npk-badge">
                🌿 Biological N-Fixer
              </span>
            )}
          </div>
          {/* ⬇️ REASON */}
          <p className="crop-result-card__reason">
            <span className="reason-label">💡 Why this crop?</span> {crop.reason}
          </p>
          {crop.nutrientAdvisory && (
            <div className="crop-result-card__nutrient-advisory">
              <span className="nutrient-icon" aria-hidden="true">🧪</span>
              <span><strong>Soil Nutrient Match:</strong> {crop.nutrientAdvisory}</span>
            </div>
          )}
        </div>
        {!isWarning && (
          <div className="crop-result-card__rank" aria-label={`Rank ${rank}`}>
            #{rank}
          </div>
        )}
      </div>

      {/* Meta info row — duration, yield, water, profit */}
      {!isWarning && (
        <div className="crop-result-card__meta">
          <div className="meta-pill">
            <span className="meta-pill__icon">⏱</span>
            <span className="meta-pill__label">Duration</span>
            <span className="meta-pill__val">{crop.duration}</span>
          </div>
          <div className="meta-pill">
            <span className="meta-pill__icon">📦</span>
            <span className="meta-pill__label">Yield</span>
            <span className="meta-pill__val">{crop.yield}</span>
          </div>
          <div className="meta-pill">
            <span className="meta-pill__icon">💧</span>
            <span className="meta-pill__label">Water Need</span>
            <span
              className="meta-pill__val"
              style={{ color: WATER_COLOR[crop.waterNeed] }}
            >
              {crop.waterNeed}
            </span>
          </div>
          <div className="meta-pill meta-pill--profit">
            <span className="meta-pill__icon">💰</span>
            <span className="meta-pill__label">Est. Profit</span>
            <span className="meta-pill__val">{crop.profit}</span>
          </div>
        </div>
      )}

      {/* Tips toggle */}
      {crop.tips && crop.tips.length > 0 && (
        <div className="crop-result-card__tips-section">
          <button
            className="tips-toggle"
            onClick={() => setExpanded(v => !v)}
            id={`tips-toggle-${rank}`}
            aria-expanded={expanded}
          >
            {expanded ? '▲ Hide Tips' : '▼ View Farming Tips'}
          </button>

          {expanded && (
            <ul className="tips-list">
              {crop.tips.map((tip, j) => (
                <li key={j}>
                  <span className="tips-list__arrow">→</span> {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
