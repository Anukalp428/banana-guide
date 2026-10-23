import './CropCards.css';

const CROPS = [
  {
    name: 'Wheat',
    emoji: '🌾',
    category: 'Cereal',
    season: 'Rabi',
    soils: 'Alluvial, Loamy',
    states: 'Punjab, Haryana, UP',
    duration: '120–150 days',
    water: 'Medium',
    minTemp: '15°C',
    maxTemp: '25°C',
    description: 'India\'s most important staple crop, ideal for flat plains with fertile alluvial soil and cool winters.',
    tips: ['Sow between Nov–Dec for best results', 'Use certified seeds for higher yield', 'Irrigate 4–6 times during growth'],
    profit: '₹35,000–40,000/ha',
    waterLevel: 55,
  },
  {
    name: 'Rice (Paddy)',
    emoji: '🍚',
    category: 'Cereal',
    season: 'Kharif',
    soils: 'Clayey, Alluvial',
    states: 'WB, AP, TN, Kerala',
    duration: '120–150 days',
    water: 'High',
    minTemp: '20°C',
    maxTemp: '35°C',
    description: 'A water-intensive crop thriving in low-lying plains and deltaic regions with high rainfall or irrigation.',
    tips: ['Transplant seedlings after 25–30 days', 'Maintain 5 cm water level in field', 'Apply nitrogen in split doses'],
    profit: '₹30,000–36,000/ha',
    waterLevel: 90,
  },
  {
    name: 'Cotton',
    emoji: '🌿',
    category: 'Cash Crop',
    season: 'Kharif',
    soils: 'Black, Sandy Loam',
    states: 'Maharashtra, Gujarat, Rajasthan',
    duration: '180–200 days',
    water: 'Low',
    minTemp: '20°C',
    maxTemp: '40°C',
    description: 'Known as "white gold", cotton thrives in deep black soil with long sunshine hours and minimal rainfall.',
    tips: ['Use Bt cotton varieties for pest resistance', 'Space plants 60×30 cm apart', 'Apply potash for fibre quality'],
    profit: '₹42,000–55,000/ha',
    waterLevel: 25,
  },
  {
    name: 'Sugarcane',
    emoji: '🎋',
    category: 'Cash Crop',
    season: 'Year-Round',
    soils: 'Loamy, Alluvial',
    states: 'UP, Maharashtra, TN',
    duration: '12–18 months',
    water: 'High',
    minTemp: '20°C',
    maxTemp: '35°C',
    description: 'A highly profitable long-duration crop providing raw material for sugar mills across India.',
    tips: ['Plant ratoon crop for second harvest', 'Drip irrigation saves 40% water', 'Apply organic compost at planting'],
    profit: '₹55,000–70,000/ha',
    waterLevel: 85,
  },
  {
    name: 'Groundnut',
    emoji: '🥜',
    category: 'Oilseed',
    season: 'Kharif / Rabi',
    soils: 'Sandy, Loamy',
    states: 'Gujarat, AP, TN',
    duration: '110–130 days',
    water: 'Low',
    minTemp: '22°C',
    maxTemp: '32°C',
    description: 'A drought-tolerant legume that fixes nitrogen in soil, improving soil health for subsequent crops.',
    tips: ['Inoculate seeds with Rhizobium bacteria', 'Avoid waterlogged conditions', 'Harvest when leaves turn yellow'],
    profit: '₹33,000–45,000/ha',
    waterLevel: 30,
  },
  {
    name: 'Maize',
    emoji: '🌽',
    category: 'Cereal',
    season: 'Kharif',
    soils: 'Sandy Loam, Loamy',
    states: 'Karnataka, MP, Bihar',
    duration: '80–95 days',
    water: 'Medium',
    minTemp: '18°C',
    maxTemp: '35°C',
    description: 'Fast-growing cereal used for food, feed, and industrial purposes with high yield potential.',
    tips: ['Maintain proper row spacing (60×20 cm)', 'Top-dress with urea at knee-high stage', 'Use hybrid seeds for 20–30% more yield'],
    profit: '₹28,000–38,000/ha',
    waterLevel: 50,
  },
];

const WATER_BAR_COLOR = (level) => {
  if (level >= 75) return '#e53935';
  if (level >= 40) return '#fb8c00';
  return '#43a047';
};

export default function CropCards() {
  return (
    <section className="crop-cards-section" id="crop-cards">
      <div className="container">
        <div className="crop-cards-section__header">
          <span className="section-label">📚 Knowledge Base</span>
          <h2 className="section-title">Crop Information Library</h2>
          <p className="section-subtitle">
            Detailed growing guides for India's most important crops — soil needs,
            climate, duration, and profitability at a glance.
          </p>
        </div>

        <div className="crop-cards-grid">
          {CROPS.map((crop, i) => (
            <div className="crop-card" key={crop.name} style={{ animationDelay: `${i * .08}s` }}>
              {/* Header */}
              <div className="crop-card__header">
                <span className="crop-card__emoji">{crop.emoji}</span>
                <div>
                  <h3 className="crop-card__name">{crop.name}</h3>
                  <span className="crop-card__category">{crop.category} · {crop.season}</span>
                </div>
              </div>

              {/* Description */}
              <p className="crop-card__desc">{crop.description}</p>

              {/* Water requirement bar */}
              <div className="crop-card__water">
                <div className="crop-card__water-label">
                  <span>💧 Water Requirement</span>
                  <span style={{ color: WATER_BAR_COLOR(crop.waterLevel) }}>{crop.water}</span>
                </div>
                <div className="crop-card__water-track">
                  <div
                    className="crop-card__water-fill"
                    style={{ width: `${crop.waterLevel}%`, background: WATER_BAR_COLOR(crop.waterLevel) }}
                  />
                </div>
              </div>

              {/* Meta grid */}
              <div className="crop-card__meta">
                {[
                  { icon: '🌍', label: 'Best States',  val: crop.states },
                  { icon: '🪨', label: 'Soil Types',   val: crop.soils },
                  { icon: '⏱',  label: 'Duration',     val: crop.duration },
                  { icon: '🌡', label: 'Temp Range',   val: `${crop.minTemp} – ${crop.maxTemp}` },
                ].map(m => (
                  <div className="crop-card__meta-item" key={m.label}>
                    <span>{m.icon} {m.label}</span>
                    <strong>{m.val}</strong>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="crop-card__tips">
                <p className="crop-card__tips-title">💡 Key Tips</p>
                <ul>
                  {crop.tips.map((tip, j) => (
                    <li key={j}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Profit footer */}
              <div className="crop-card__footer">
                <span>Estimated Profit</span>
                <span className="crop-card__profit">{crop.profit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
