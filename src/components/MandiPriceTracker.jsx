import { useState, useEffect, useMemo } from 'react';
import './MandiPriceTracker.css';

const INDIAN_STATES = [
  'All States',
  'Uttarakhand',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Madhya Pradesh',
  'Maharashtra',
  'Gujarat',
  'Bihar',
  'Himachal Pradesh',
  'Karnataka',
];

const POPULAR_COMMODITIES = [
  'All Commodities',
  'Wheat',
  'Paddy(Common)',
  'Tomato',
  'Potato',
  'Onion',
  'Mustard',
  'Cotton',
  'Soyabean',
  'Chana',
  'Maize',
];

export default function MandiPriceTracker() {
  const [selectedState, setSelectedState]         = useState('All States');
  const [selectedCommodity, setSelectedCommodity] = useState('All Commodities');
  const [searchQuery, setSearchQuery]             = useState('');
  const [records, setRecords]                     = useState([]);
  const [isLive, setIsLive]                       = useState(false);
  const [sourceName, setSourceName]               = useState('');
  const [lastUpdated, setLastUpdated]             = useState('');
  const [isLoading, setIsLoading]                 = useState(true);
  const [errorMessage, setErrorMessage]           = useState('');
  const [showDataSourceInfo, setShowDataSourceInfo] = useState(false);

  // Fetch Mandi Rates from Backend Proxy API
  const fetchMandiRates = async (stateFilter = selectedState, commFilter = selectedCommodity) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams();
      if (stateFilter && stateFilter !== 'All States') params.set('state', stateFilter);
      if (commFilter && commFilter !== 'All Commodities') params.set('commodity', commFilter);
      params.set('limit', '50');

      const response = await fetch(`/api/mandi-prices?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setRecords(Array.isArray(data.records) ? data.records : []);
      setIsLive(Boolean(data.isLive));
      setSourceName(data.source || 'Agmarknet / data.gov.in');
      setLastUpdated(data.updatedDate ? new Date(data.updatedDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));
    } catch (err) {
      console.warn('Mandi API fetch error:', err);
      setErrorMessage(`Live Mandi API error: ${err.message}. Showing sample benchmark rates.`);
      setIsLive(false);
      setSourceName('Sample/Demo Data (नमूना डेटा) - Live Connection Unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMandiRates();
  }, [selectedState, selectedCommodity]);

  // Client-side search filtering by Mandi / Market / District name
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;

    return records.filter((r) =>
      (r.market && r.market.toLowerCase().includes(q)) ||
      (r.district && r.district.toLowerCase().includes(q)) ||
      (r.commodity && r.commodity.toLowerCase().includes(q)) ||
      (r.variety && r.variety.toLowerCase().includes(q)) ||
      (r.state && r.state.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  return (
    <section className="mandi-tracker-section" id="mandi-prices">
      <div className="container">
        {/* Header */}
        <div className="mandi-tracker-header">
          <span className="section-label">📊 Mandi Bhav Tracker (मंडी भाव)</span>
          <h2 className="section-title">Daily Mandi Price Tracker</h2>
          <p className="section-subtitle">
            Track daily wholesale agricultural market rates across Indian APMC mandis. Compare minimum, maximum, and modal benchmark prices directly from official Agmarknet records.
          </p>

          {/* Official Data Source Badge */}
          <div className="mandi-source-pill-row">
            <span className={`mandi-source-pill ${isLive ? 'mandi-source-pill--live' : 'mandi-source-pill--demo'}`}>
              {isLive ? '🟢 Official Live Feed: Agmarknet / data.gov.in' : '⚠️ Sample/Demo Benchmark Data (Live Feed Offline)'}
            </span>
            <span className="mandi-date-badge">
              📅 Date: <strong>{lastUpdated || 'Today'}</strong> &bull; Unit: <strong>₹ / Quintal</strong>
            </span>
            <button
              type="button"
              className="mandi-source-info-btn"
              onClick={() => setShowDataSourceInfo(prev => !prev)}
            >
              {showDataSourceInfo ? 'Hide Source Info ✕' : 'ℹ️ Official Source & Verification'}
            </button>
          </div>

          {/* Source Transparency & Setup Card */}
          {showDataSourceInfo && (
            <div className="mandi-source-card">
              <h4>🏛️ Official Government Data Source Details:</h4>
              <p>
                Live mandi rates are sourced via the <strong>Directorate of Marketing &amp; Inspection (DMI)</strong>, Ministry of Agriculture and Farmers Welfare, Government of India, through the <strong>AGMARKNET / Open Government Data Platform (data.gov.in)</strong> Resource ID <code>9ef84268-d588-465a-a308-a864a43d0070</code>.
              </p>
              <ul>
                <li><strong>No Fabricated Rates:</strong> When official government servers are unreachable or rate-limited, the system clearly marks data as <strong>Sample/Demo Data</strong> rather than claiming it is live.</li>
                <li><strong>Custom API Key:</strong> You can register a free account on <a href="https://data.gov.in/" target="_blank" rel="noopener noreferrer">data.gov.in</a> and add your key in <code>.env</code> as <code>DATAGOV_API_KEY=your_key</code>.</li>
              </ul>
            </div>
          )}
        </div>

        {/* ── Filters & Search Bar Toolbar ── */}
        <div className="mandi-filter-toolbar">
          <div className="mandi-toolbar-grid">
            {/* Search Input */}
            <div className="mandi-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Mandi, District, or Commodity (e.g. Roorkee, Karnal, Wheat)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mandi-search-input"
                aria-label="Search mandi prices"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* State Dropdown */}
            <div className="select-box-wrapper">
              <label htmlFor="mandi-filter-state" className="select-label">State (राज्य):</label>
              <select
                id="mandi-filter-state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="mandi-select"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Commodity Dropdown */}
            <div className="select-box-wrapper">
              <label htmlFor="mandi-filter-commodity" className="select-label">Crop (फसल):</label>
              <select
                id="mandi-filter-commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="mandi-select"
              >
                {POPULAR_COMMODITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              className="mandi-refresh-btn"
              onClick={() => fetchMandiRates()}
              title="Refresh live prices from Agmarknet"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Quick Commodity Chips */}
          <div className="mandi-quick-chips">
            <span className="chips-label">Popular Crops:</span>
            {['Wheat', 'Paddy(Common)', 'Tomato', 'Potato', 'Onion', 'Mustard', 'Cotton'].map((crop) => (
              <button
                key={crop}
                type="button"
                className={`crop-quick-chip ${selectedCommodity === crop ? 'active' : ''}`}
                onClick={() => setSelectedCommodity(crop)}
              >
                {crop}
              </button>
            ))}
            {selectedCommodity !== 'All Commodities' && (
              <button
                type="button"
                className="crop-quick-chip reset-chip"
                onClick={() => setSelectedCommodity('All Commodities')}
              >
                All Crops ↺
              </button>
            )}
          </div>
        </div>

        {/* ── Error Banner if any ── */}
        {errorMessage && (
          <div className="mandi-error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="mandi-loading-state">
            <div className="mandi-spinner"></div>
            <h4>Fetching Mandi Arrivals &amp; Rates...</h4>
            <p>Connecting to Agmarknet / data.gov.in official market feed.</p>
          </div>
        )}

        {/* ── Results Cards Grid ── */}
        {!isLoading && filteredRecords.length > 0 && (
          <div className="mandi-cards-grid">
            {filteredRecords.map((item) => (
              <div
                key={item.id}
                className={`mandi-card ${item.isLive ? 'mandi-card--live' : 'mandi-card--sample'}`}
              >
                {/* Card Top: Source Tag & Arrival Date */}
                <div className="mandi-card__top">
                  <span className={`mandi-data-tag ${item.isLive ? 'mandi-data-tag--live' : 'mandi-data-tag--sample'}`}>
                    {item.isLive ? '● Live Agmarknet' : '⚠️ Sample/Demo Benchmark'}
                  </span>
                  <span className="mandi-arrival-date">
                    📅 {item.arrival_date}
                  </span>
                </div>

                {/* Mandi & Location */}
                <div className="mandi-card__location">
                  <h3 className="mandi-market-name">
                    📍 {item.market}
                  </h3>
                  <span className="mandi-sub-loc">
                    {item.district ? `${item.district}, ` : ''}{item.state}
                  </span>
                </div>

                {/* Commodity & Variety */}
                <div className="mandi-card__commodity">
                  <div className="commodity-name-row">
                    <span className="commodity-label">Fasal / Crop:</span>
                    <strong className="commodity-title">{item.commodity}</strong>
                  </div>
                  <span className="variety-badge">
                    🌱 Variety: {item.variety || 'Standard FAQ'}
                  </span>
                </div>

                {/* Price Metrics Grid */}
                <div className="mandi-prices-grid">
                  {/* Modal Price (Primary highlighted metric) */}
                  <div className="price-box price-box--modal">
                    <span className="price-label">Modal Price (मॉडल भाव)</span>
                    <strong className="price-value">
                      ₹{item.modal_price ? item.modal_price.toLocaleString() : 'N/A'}
                    </strong>
                    <span className="price-unit">per Quintal</span>
                  </div>

                  {/* Min Price */}
                  <div className="price-box price-box--min">
                    <span className="price-label">Min (न्यूनतम)</span>
                    <strong className="price-value-sm">
                      ₹{item.min_price ? item.min_price.toLocaleString() : 'N/A'}
                    </strong>
                  </div>

                  {/* Max Price */}
                  <div className="price-box price-box--max">
                    <span className="price-label">Max (अधिकतम)</span>
                    <strong className="price-value-sm">
                      ₹{item.max_price ? item.max_price.toLocaleString() : 'N/A'}
                    </strong>
                  </div>
                </div>

                {/* Card Footer: Source attribution */}
                <div className="mandi-card__footer">
                  <span className="source-note">
                    Source: {item.isLive ? 'Agmarknet / DMI' : 'Benchmark Sample'}
                  </span>
                  <span className="unit-note">
                    Standard 100 kg bag (1 Quintal)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty / No Results State ── */}
        {!isLoading && filteredRecords.length === 0 && (
          <div className="mandi-empty-state">
            <div className="empty-icon">🌾</div>
            <h3>No Mandi Rates Found</h3>
            <p>
              No market arrivals found matching your current filters ({selectedState !== 'All States' ? selectedState : ''} {selectedCommodity !== 'All Commodities' ? `• ${selectedCommodity}` : ''} {searchQuery ? `• "${searchQuery}"` : ''}).
            </p>
            <div className="empty-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSelectedState('All States');
                  setSelectedCommodity('All Commodities');
                  setSearchQuery('');
                  fetchMandiRates('All States', 'All Commodities');
                }}
              >
                Clear All Filters ↺
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
