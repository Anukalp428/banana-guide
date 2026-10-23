import { useState, useEffect, useMemo } from 'react';
import './Marketplace.css';

const STORAGE_KEY = 'farmer_marketplace_listings_v3';

// ⚠️ AUDIT NOTE: These are simulated dummy listings for UI demo purposes only.
// Phone numbers are explicitly masked and flagged as demo data to prevent contacting random citizens.
const SAMPLE_LISTINGS = [
  {
    id: 'demo-1',
    cropName: 'Sharbati Wheat (शरबती गेहूं)',
    category: 'Grains',
    variety: 'Grade-A Sharbati (Moisture < 11%)',
    quantity: 80,
    unit: 'Quintal',
    price: 2650,
    priceUnit: 'Quintal',
    state: 'Uttarakhand',
    location: 'Roorkee, Haridwar',
    farmerName: 'Ramesh Singh (Sample Profile)',
    phone: '98765-XXXXX',
    harvestStatus: 'Ready for Immediate Pickup',
    notes: 'Sun-dried high protein wheat. Sample demonstration listing.',
    listedDate: '2026-10-18',
    isDemo: true,
  },
  {
    id: 'demo-2',
    cropName: '1121 Basmati Paddy (बासमती धान)',
    category: 'Grains',
    variety: 'Pusa 1121 Steam Grade',
    quantity: 120,
    unit: 'Quintal',
    price: 3850,
    priceUnit: 'Quintal',
    state: 'Haryana',
    location: 'Karnal Grain Mandi',
    farmerName: 'Gurpreet Singh (Sample Profile)',
    phone: '98123-XXXXX',
    harvestStatus: 'Harvested & Bagged',
    notes: 'Extra long grain paddy. Sample demonstration listing.',
    listedDate: '2026-10-19',
    isDemo: true,
  },
  {
    id: 'demo-3',
    cropName: 'Yellow Mustard (पीली सरसों)',
    category: 'Oilseeds',
    variety: 'Pusa Bold High Oil Variety',
    quantity: 45,
    unit: 'Quintal',
    price: 5400,
    priceUnit: 'Quintal',
    state: 'Rajasthan',
    location: 'Alwar Agriculture Mandi',
    farmerName: 'Mohan Lal Sharma (Sample Profile)',
    phone: '97834-XXXXX',
    harvestStatus: 'In Warehouse Storage',
    notes: 'Sample demonstration listing with simulated data.',
    listedDate: '2026-10-17',
    isDemo: true,
  },
  {
    id: 'demo-4',
    cropName: 'Red Onion (लाल प्याज - Nashik)',
    category: 'Vegetables',
    variety: 'Garwa Medium Bold Grade',
    quantity: 150,
    unit: 'Quintal',
    price: 1800,
    priceUnit: 'Quintal',
    state: 'Maharashtra',
    location: 'Lasalgaon, Nashik',
    farmerName: 'Dnyaneshwar Patil (Sample Profile)',
    phone: '98223-XXXXX',
    harvestStatus: 'Ready for Immediate Pickup',
    notes: 'Deep red dry cured onion. Sample demonstration listing.',
    listedDate: '2026-10-20',
    isDemo: true,
  },
  {
    id: 'demo-5',
    cropName: 'Potato / Aloo (Kufri Pukhraj)',
    category: 'Vegetables',
    variety: 'Kufri Pukhraj (Table Size)',
    quantity: 200,
    unit: 'Quintal',
    price: 1100,
    priceUnit: 'Quintal',
    state: 'Uttar Pradesh',
    location: 'Khandari Mandi, Agra',
    farmerName: 'Suresh Chandra (Sample Profile)',
    phone: '94123-XXXXX',
    harvestStatus: 'In Cold Storage',
    notes: 'Graded table potatoes. Sample demonstration listing.',
    listedDate: '2026-10-16',
    isDemo: true,
  },
  {
    id: 'demo-6',
    cropName: 'Desi Chana / Chickpea (देसी चना)',
    category: 'Pulses',
    variety: 'Machine Cleaned Bold Grain',
    quantity: 60,
    unit: 'Quintal',
    price: 5250,
    priceUnit: 'Quintal',
    state: 'Madhya Pradesh',
    location: 'Choithram Mandi, Indore',
    farmerName: 'Vikram Patel (Sample Profile)',
    phone: '98931-XXXXX',
    harvestStatus: 'Ready for Immediate Pickup',
    notes: 'Cleaned bold grain chickpeas. Sample demonstration listing.',
    listedDate: '2026-10-19',
    isDemo: true,
  },
];

const INDIAN_STATES = [
  'All States',
  'Uttarakhand',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Madhya Pradesh',
  'Maharashtra',
  'Bihar',
  'Gujarat',
  'Karnataka',
];

const CATEGORIES = ['All', 'Grains', 'Pulses', 'Oilseeds', 'Vegetables', 'Cash Crops'];

const EMPTY_FORM = {
  cropName: '',
  category: 'Grains',
  variety: '',
  quantity: '',
  unit: 'Quintal',
  price: '',
  priceUnit: 'Quintal',
  state: '',
  location: '',
  farmerName: '',
  phone: '',
  harvestStatus: 'Ready for Immediate Pickup',
  notes: '',
};

export default function Marketplace() {
  const [listings, setListings]         = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedCategory, setCategory] = useState('All');
  const [selectedState, setState]       = useState('All States');
  const [sortBy, setSortBy]             = useState('newest');

  // Modal / Form toggle state
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState({});
  const [flashMsg, setFlashMsg]         = useState('');

  // Contact farmer modal
  const [contactModalData, setContactModalData] = useState(null);

  // Initialize from localStorage or load sample demo listings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setListings(parsed);
          return;
        }
      }
    } catch {
      // Fallback on storage errors
    }
    setListings(SAMPLE_LISTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_LISTINGS));
  }, []);

  // Save changes to localStorage
  const saveListings = (updated) => {
    setListings(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }
  };

  // Form input change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const errs = {};
    if (!form.cropName.trim()) {
      errs.cropName = 'Crop name is required (e.g. Wheat, Basmati Rice, Onion)';
    }

    const qty = Number(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      errs.quantity = 'Enter a valid quantity greater than 0';
    } else if (qty > 50000) {
      errs.quantity = 'Maximum allowed quantity is 50,000';
    }

    const prc = Number(form.price);
    if (!form.price || isNaN(prc) || prc <= 0) {
      errs.price = 'Enter a valid price greater than 0';
    } else if (prc > 200000) {
      errs.price = 'Enter a realistic price value';
    }

    if (!form.state) {
      errs.state = 'Please select your state';
    }
    if (!form.location.trim()) {
      errs.location = 'City / Mandi location is required (e.g. Roorkee Mandi)';
    }
    if (!form.farmerName.trim()) {
      errs.farmerName = 'Farmer name is required';
    }

    const cleanPhone = form.phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Contact phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    return errs;
  };

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newListing = {
      id: `user-${Date.now()}`,
      cropName: form.cropName.trim(),
      category: form.category,
      variety: form.variety.trim() || 'Standard Harvest Grade',
      quantity: Number(form.quantity),
      unit: form.unit,
      price: Number(form.price),
      priceUnit: form.priceUnit,
      state: form.state,
      location: form.location.trim(),
      farmerName: form.farmerName.trim(),
      phone: form.phone.trim().replace(/\D/g, ''),
      harvestStatus: form.harvestStatus,
      notes: form.notes.trim() || 'Direct from farm, fresh quality produce.',
      listedDate: new Date().toISOString().split('T')[0],
      isDemo: false,
    };

    const updated = [newListing, ...listings];
    saveListings(updated);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsFormOpen(false);

    setFlashMsg('✅ Your crop listing has been published successfully and saved locally in your browser!');
    setTimeout(() => setFlashMsg(''), 6000);
  };

  // Delete user's own listing
  const handleDeleteListing = (id) => {
    if (window.confirm('Are you sure you want to remove this crop listing?')) {
      const updated = listings.filter(item => item.id !== id);
      saveListings(updated);
    }
  };

  // Reset to default sample listings
  const handleResetDemoData = () => {
    if (window.confirm('Reset marketplace listings to default sample demo data? Any user-added listings will be cleared.')) {
      saveListings(SAMPLE_LISTINGS);
      setFlashMsg('Marketplace reset to default sample demo listings.');
      setTimeout(() => setFlashMsg(''), 4000);
    }
  };

  // Filtered & Sorted listings for buyers
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return listings
      .filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesState    = selectedState === 'All States' || item.state === selectedState;

        const matchesQuery = !q ||
          item.cropName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.state.toLowerCase().includes(q) ||
          item.farmerName.toLowerCase().includes(q) ||
          item.variety.toLowerCase().includes(q);

        return matchesCategory && matchesState && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low')  return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'qty-high')   return b.quantity - a.quantity;
        return (b.id > a.id ? 1 : -1); // Newest first
      });
  }, [listings, searchQuery, selectedCategory, selectedState, sortBy]);

  return (
    <section className="marketplace-section" id="marketplace">
      <div className="container">
        {/* Header */}
        <div className="marketplace-header">
          <span className="section-label">🌾 Mandi &amp; Trade</span>
          <h2 className="section-title">Farmer-Buyer Marketplace</h2>
          <p className="section-subtitle">
            Direct farm-gate trade connecting farmers and wholesale buyers. Buy fresh produce
            at transparent prices or list your harvest with zero middlemen commission.
          </p>

          {/* Transparent Notice Banner */}
          <div className="marketplace-trust-banner">
            <span className="trust-icon">⚠️</span>
            <div>
              <strong>Demonstration Prototype &amp; Data Transparency:</strong> Farmer Connect is currently
              a frontend prototype. There is <strong>no backend database, no farmer verification (KYC),
              and no in-app messaging server connected</strong>. Sample listings contain simulated dummy
              phone numbers (e.g. <code>98765-XXXXX</code>) and are clearly marked as <strong>DEMO SAMPLE</strong>.
              Direct calls/WhatsApp are intentionally disabled on sample listings to prevent spamming random individuals.
            </div>
          </div>
        </div>

        {/* Flash notification */}
        {flashMsg && (
          <div className="marketplace-flash" role="alert">
            {flashMsg}
          </div>
        )}

        {/* Action Bar: List Crop CTA + Reset button */}
        <div className="marketplace-actions-bar">
          <div className="marketplace-stats">
            <span>📦 <strong>{listings.length}</strong> Total Harvest Listings Available</span>
          </div>

          <div className="marketplace-btns-group">
            <button
              type="button"
              className="btn-primary marketplace-sell-btn"
              onClick={() => setIsFormOpen(prev => !prev)}
              id="marketplace-sell-cta"
            >
              {isFormOpen ? '✕ Close Sell Form' : '+ List Your Crop (बेचें)'}
            </button>
            <button
              type="button"
              className="marketplace-reset-data-btn"
              onClick={handleResetDemoData}
              title="Reset to default sample listings"
            >
              ↺ Reset Demo Data
            </button>
          </div>
        </div>

        {/* ── Farmer Add Listing Form Card (Collapsible) ── */}
        {isFormOpen && (
          <div className="marketplace-form-card" id="marketplace-add-form-container">
            <div className="marketplace-form-card__header">
              <div>
                <h3 className="form-title">🌾 List Your Crop for Sale / अपनी फसल बेचें</h3>
                <p className="form-subtitle">
                  Fill in your crop details accurately. Saved locally in your browser for demonstration.
                </p>
              </div>
              <span className="form-badge">Local Browser Listing</span>
            </div>

            <form onSubmit={handleFormSubmit} className="marketplace-form" noValidate>
              <div className="form-row form-row--2">
                {/* Crop Name */}
                <div className="form-group">
                  <label htmlFor="mf-crop">
                    Crop Name / फसल का नाम <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="mf-crop"
                    name="cropName"
                    placeholder="e.g. Sharbati Wheat, Basmati Paddy, Onion"
                    value={form.cropName}
                    onChange={handleFormChange}
                    className={errors.cropName ? 'input-error' : ''}
                  />
                  {errors.cropName && <span className="error-text">{errors.cropName}</span>}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label htmlFor="mf-category">Category / श्रेणी</label>
                  <select
                    id="mf-category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                  >
                    <option value="Grains">Grains &amp; Cereals (अनाज)</option>
                    <option value="Pulses">Pulses &amp; Dal (दालें)</option>
                    <option value="Oilseeds">Oilseeds (तिलहन)</option>
                    <option value="Vegetables">Vegetables (सब्जियां)</option>
                    <option value="Cash Crops">Cash Crops / Other (नकदी फसल)</option>
                  </select>
                </div>
              </div>

              <div className="form-row form-row--3">
                {/* Variety */}
                <div className="form-group">
                  <label htmlFor="mf-variety">Variety / Quality Grade</label>
                  <input
                    type="text"
                    id="mf-variety"
                    name="variety"
                    placeholder="e.g. Pusa 1121, Grade-A, Organic"
                    value={form.variety}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label htmlFor="mf-quantity">
                    Quantity / मात्रा <span className="req">*</span>
                  </label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      id="mf-quantity"
                      name="quantity"
                      min="1"
                      placeholder="e.g. 50"
                      value={form.quantity}
                      onChange={handleFormChange}
                      className={errors.quantity ? 'input-error' : ''}
                    />
                    <select name="unit" value={form.unit} onChange={handleFormChange}>
                      <option value="Quintal">Quintal (क्विंटल)</option>
                      <option value="kg">kg (किलो)</option>
                      <option value="Ton">Ton (टन)</option>
                    </select>
                  </div>
                  {errors.quantity && <span className="error-text">{errors.quantity}</span>}
                </div>

                {/* Price */}
                <div className="form-group">
                  <label htmlFor="mf-price">
                    Expected Price / मूल्य (₹) <span className="req">*</span>
                  </label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      id="mf-price"
                      name="price"
                      min="1"
                      placeholder="e.g. 2600"
                      value={form.price}
                      onChange={handleFormChange}
                      className={errors.price ? 'input-error' : ''}
                    />
                    <select name="priceUnit" value={form.priceUnit} onChange={handleFormChange}>
                      <option value="Quintal">per Quintal</option>
                      <option value="kg">per kg</option>
                    </select>
                  </div>
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>
              </div>

              <div className="form-row form-row--3">
                {/* State */}
                <div className="form-group">
                  <label htmlFor="mf-state">
                    State / राज्य <span className="req">*</span>
                  </label>
                  <select
                    id="mf-state"
                    name="state"
                    value={form.state}
                    onChange={handleFormChange}
                    className={errors.state ? 'input-error' : ''}
                  >
                    <option value="">-- Select State --</option>
                    {INDIAN_STATES.filter(s => s !== 'All States').map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                {/* Location */}
                <div className="form-group">
                  <label htmlFor="mf-location">
                    City / Mandi Area <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="mf-location"
                    name="location"
                    placeholder="e.g. Roorkee Mandi, Haridwar"
                    value={form.location}
                    onChange={handleFormChange}
                    className={errors.location ? 'input-error' : ''}
                  />
                  {errors.location && <span className="error-text">{errors.location}</span>}
                </div>

                {/* Harvest Readiness */}
                <div className="form-group">
                  <label htmlFor="mf-status">Harvest Status</label>
                  <select
                    id="mf-status"
                    name="harvestStatus"
                    value={form.harvestStatus}
                    onChange={handleFormChange}
                  >
                    <option value="Ready for Immediate Pickup">Ready for Immediate Pickup</option>
                    <option value="Harvesting in 1-2 Weeks">Harvesting in 1-2 Weeks</option>
                    <option value="In Cold/Warehouse Storage">In Cold/Warehouse Storage</option>
                  </select>
                </div>
              </div>

              <div className="form-row form-row--2">
                {/* Farmer Name */}
                <div className="form-group">
                  <label htmlFor="mf-farmer">
                    Farmer Name / किसान का नाम <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="mf-farmer"
                    name="farmerName"
                    placeholder="e.g. Ramesh Singh"
                    value={form.farmerName}
                    onChange={handleFormChange}
                    className={errors.farmerName ? 'input-error' : ''}
                  />
                  {errors.farmerName && <span className="error-text">{errors.farmerName}</span>}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="mf-phone">
                    10-Digit Mobile / फोन नंबर <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mf-phone"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={form.phone}
                    onChange={handleFormChange}
                    className={errors.phone ? 'input-error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
              </div>

              {/* Extra Notes */}
              <div className="form-group">
                <label htmlFor="mf-notes">Crop Description / Special Notes (Optional)</label>
                <textarea
                  id="mf-notes"
                  name="notes"
                  rows={2}
                  placeholder="e.g. Sun-dried, moisture tested, organic certified, bagging condition..."
                  value={form.notes}
                  onChange={handleFormChange}
                />
              </div>

              {/* Submit Buttons */}
              <div className="marketplace-form__footer">
                <button
                  type="submit"
                  className="btn-primary marketplace-submit-btn"
                  id="marketplace-submit-listing"
                >
                  Publish Crop Listing (फसल लिस्ट करें) →
                </button>
                <button
                  type="button"
                  className="marketplace-cancel-btn"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Buyer Search & Filters Toolbar ── */}
        <div className="marketplace-filter-toolbar">
          {/* Search Box */}
          <div className="marketplace-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              id="marketplace-search-input"
              className="marketplace-search-input"
              placeholder="Search by crop name, mandi, or farmer (e.g. Wheat, Rice, Roorkee, Mustard)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search crop listings"
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

          {/* Filters Row */}
          <div className="marketplace-filters-row">
            {/* Category Chips */}
            <div className="category-scroll-container">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`marketplace-cat-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* State Dropdown */}
            <div className="select-wrapper">
              <label htmlFor="filter-state" className="sr-only">Filter by State</label>
              <select
                id="filter-state"
                className="marketplace-select"
                value={selectedState}
                onChange={(e) => setState(e.target.value)}
              >
                {INDIAN_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="select-wrapper">
              <label htmlFor="filter-sort" className="sr-only">Sort By</label>
              <select
                id="filter-sort"
                className="marketplace-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="qty-high">Quantity: High to Low</option>
              </select>
            </div>
          </div>

          {/* Count and Reset summary */}
          <div className="marketplace-results-count">
            <span>
              Showing <strong>{filteredListings.length}</strong> available crop listings
              {selectedCategory !== 'All' && <span> in <em>{selectedCategory}</em></span>}
              {selectedState !== 'All States' && <span> in <em>{selectedState}</em></span>}
              {searchQuery && <span> matching "<em>{searchQuery}</em>"</span>}
            </span>

            {(searchQuery || selectedCategory !== 'All' || selectedState !== 'All States') && (
              <button
                type="button"
                className="filter-reset-link"
                onClick={() => {
                  setSearchQuery('');
                  setCategory('All');
                  setState('All States');
                }}
              >
                Clear Filters ↺
              </button>
            )}
          </div>
        </div>

        {/* ── Crop Listings Cards Grid ── */}
        {filteredListings.length > 0 ? (
          <div className="marketplace-grid">
            {filteredListings.map(item => (
              <div
                className={`marketplace-card ${item.isDemo ? 'marketplace-card--demo' : 'marketplace-card--user'}`}
                key={item.id}
                id={`crop-listing-${item.id}`}
              >
                {/* Card Top: Badges */}
                <div className="marketplace-card__top">
                  <div className="card-badge-group">
                    {item.isDemo ? (
                      <span className="badge badge--demo" title="Sample demonstration data — NOT a real farmer">
                        ⚠️ DEMO SAMPLE — Not a Real Farmer
                      </span>
                    ) : (
                      <span className="badge badge--user" title="Added by you on this local device">
                        👤 User Listing (Local Unverified)
                      </span>
                    )}
                    <span className="badge badge--cat">{item.category}</span>
                  </div>

                  {!item.isDemo && (
                    <button
                      type="button"
                      className="delete-listing-btn"
                      onClick={() => handleDeleteListing(item.id)}
                      title="Delete your crop listing"
                      aria-label="Delete listing"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Crop Name & Variety */}
                <div className="marketplace-card__main">
                  <h3 className="crop-title">{item.cropName}</h3>
                  <p className="crop-variety">🌱 {item.variety}</p>
                </div>

                {/* Price & Quantity Grid */}
                <div className="marketplace-card__metrics">
                  <div className="metric-box metric-box--price">
                    <span className="metric-label">Expected Price</span>
                    <strong className="metric-value">₹{item.price.toLocaleString()}</strong>
                    <span className="metric-unit">per {item.priceUnit}</span>
                  </div>

                  <div className="metric-box metric-box--qty">
                    <span className="metric-label">Available Qty</span>
                    <strong className="metric-value">{item.quantity.toLocaleString()}</strong>
                    <span className="metric-unit">{item.unit}</span>
                  </div>
                </div>

                {/* Location & Status Info */}
                <div className="marketplace-card__info">
                  <div className="info-line">
                    <span className="info-icon">📍</span>
                    <span className="info-text"><strong>{item.location}</strong>, {item.state}</span>
                  </div>
                  <div className="info-line">
                    <span className="info-icon">🚜</span>
                    <span className="info-text">{item.harvestStatus}</span>
                  </div>
                  <div className="info-line">
                    <span className="info-icon">👤</span>
                    <span className="info-text">Farmer: <strong>{item.farmerName}</strong></span>
                  </div>
                  <div className="info-line">
                    <span className="info-icon">📱</span>
                    <span className="info-text">
                      {item.isDemo ? (
                        <>Contact: <code>+91 {item.phone}</code> <em className="simulated-note">(Simulated Demo)</em></>
                      ) : (
                        <>Contact: <code>+91 {item.phone}</code></>
                      )}
                    </span>
                  </div>
                </div>

                {/* Crop Notes */}
                {item.notes && (
                  <p className="marketplace-card__notes">
                    "{item.notes}"
                  </p>
                )}

                {/* Card Footer: Contact Farmer CTA */}
                <div className="marketplace-card__footer">
                  <span className="listed-date">Listed: {item.listedDate}</span>
                  <button
                    type="button"
                    className={`btn-primary contact-farmer-btn ${item.isDemo ? 'contact-farmer-btn--demo' : ''}`}
                    onClick={() => setContactModalData(item)}
                    id={`contact-btn-${item.id}`}
                  >
                    <span>{item.isDemo ? 'View Demo Contact' : 'Contact Farmer'}</span>
                    <span>{item.isDemo ? '🔍' : '📞'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="marketplace-empty">
            <div className="empty-icon">🌾</div>
            <h3 className="empty-title">No Crop Listings Found</h3>
            <p className="empty-text">
              We couldn't find any crop listings matching your search criteria.
              Try adjusting your search terms, changing the state filter, or list your crop!
            </p>
            <div className="empty-btns">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSearchQuery('');
                  setCategory('All');
                  setState('All States');
                }}
              >
                Clear All Filters ↺
              </button>
              <button
                type="button"
                className="marketplace-sell-btn"
                style={{ padding: '10px 20px', borderRadius: '10px' }}
                onClick={() => setIsFormOpen(true)}
              >
                + List Crop Now
              </button>
            </div>
          </div>
        )}

        {/* ── Contact Farmer Modal ── */}
        {contactModalData && (
          <div className="modal-backdrop" onClick={() => setContactModalData(null)}>
            <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {contactModalData.isDemo
                      ? '🧪 Demo Sample — Contact Preview'
                      : '👤 User Listing — Contact Farmer'}
                  </h3>
                  <p className="modal-subtitle">
                    {contactModalData.isDemo
                      ? 'Simulated Demonstration Profile'
                      : 'Direct Farm-Gate Communication'}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setContactModalData(null)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {/* Crop Summary Pill */}
                <div className="modal-crop-summary">
                  <h4>{contactModalData.cropName}</h4>
                  <div className="modal-meta-row">
                    <span>📦 <strong>{contactModalData.quantity} {contactModalData.unit}</strong> available</span>
                    <span>💰 <strong>₹{contactModalData.price.toLocaleString()}</strong> / {contactModalData.priceUnit}</span>
                  </div>
                  <p className="modal-location">📍 {contactModalData.location}, {contactModalData.state}</p>
                </div>

                {/* Farmer Details */}
                <div className="farmer-contact-card">
                  <div className="farmer-avatar">
                    {contactModalData.isDemo ? '🧪' : '👨‍🌾'}
                  </div>
                  <div className="farmer-info">
                    <span className="farmer-label">
                      {contactModalData.isDemo ? 'Simulated Farmer Name' : 'Farmer Name'}
                    </span>
                    <strong className="farmer-name">{contactModalData.farmerName}</strong>
                    <span className="farmer-phone">
                      📱 +91 {contactModalData.phone}
                      {contactModalData.isDemo && ' (Dummy Sample)'}
                    </span>
                  </div>
                </div>

                {/* CONDITION 1: DEMO SAMPLE LISTING */}
                {contactModalData.isDemo ? (
                  <div className="demo-contact-simulation-box">
                    <div className="demo-contact-alert">
                      <span className="demo-alert-icon">⚠️</span>
                      <div>
                        <strong>Sample Data Notice (No Real Farmer):</strong>
                        <p>
                          Yeh listing ek <strong>simulated demo sample</strong> hai. Iska phone number (<code>+91 {contactModalData.phone}</code>)
                          aur farmer profile fictitious hai, kisi real farmer ka nahi.
                        </p>
                      </div>
                    </div>

                    <div className="demo-safety-note">
                      🔒 <strong>Direct Calling &amp; WhatsApp Disabled:</strong>
                      Random citizens ko call ya spam hone se rokne ke liye sample listings par
                      live WhatsApp link disable kiya gaya hai.
                    </div>

                    {/* WhatsApp Message Preview Simulation */}
                    <div className="whatsapp-preview-card">
                      <span className="preview-heading">💬 WhatsApp Inquiry Template (Simulation Preview):</span>
                      <div className="whatsapp-chat-bubble">
                        <span className="chat-sender">Buyer to Farmer:</span>
                        <p>
                          "Namaste {contactModalData.farmerName}, I saw your listing for {contactModalData.cropName} ({contactModalData.quantity} {contactModalData.unit}) at ₹{contactModalData.price.toLocaleString()}/{contactModalData.priceUnit} on Farmer Connect. Is it still available for inspection and pickup?"
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-primary demo-try-sell-btn"
                      onClick={() => {
                        setContactModalData(null);
                        setIsFormOpen(true);
                      }}
                    >
                      + Add Your Own Real Listing to Test Live Contact
                    </button>
                  </div>
                ) : (
                  /* CONDITION 2: REAL USER-ADDED LISTING */
                  <>
                    <div className="modal-actions">
                      <a
                        href={`tel:+91${contactModalData.phone}`}
                        className="btn-call"
                      >
                        <span>📞 Call +91 {contactModalData.phone}</span>
                      </a>

                      <a
                        href={`https://wa.me/91${contactModalData.phone}?text=${encodeURIComponent(
                          `Namaste ${contactModalData.farmerName}, I saw your listing for ${contactModalData.cropName} (${contactModalData.quantity} ${contactModalData.unit}) on Farmer Connect. Is it still available for purchase?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp"
                      >
                        <span>💬 WhatsApp Farmer</span>
                      </a>
                    </div>

                    {/* Transparent Disclaimer Notice */}
                    <div className="modal-disclaimer modal-disclaimer--user">
                      <span className="disclaimer-icon">ℹ️</span>
                      <p>
                        <strong>User-Submitted Contact Notice:</strong> Yeh contact number is browser
                        par submit kiya gaya hai. Farmer Connect ke paas koi backend database ya KYC
                        verification system nahi hai. Kripya deal complete karne se pehle crop ki physical
                        inspection aur identity verify karein.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setContactModalData(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
