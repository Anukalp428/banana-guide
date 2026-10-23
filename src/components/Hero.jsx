import './Hero.css';

export default function Hero() {
  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="home">
      {/* Background image + overlays */}
      <div className="hero__bg" />
      <div className="hero__overlay" />

      {/* Floating badges */}
      <div className="hero__badge hero__badge--tl" aria-hidden="true">
        <span>🌱</span> 2.5 Lakh+ Farmers Served
      </div>
      <div className="hero__badge hero__badge--tr" aria-hidden="true">
        <span>📍</span> Pan-India Coverage
      </div>

      {/* Main content */}
      <div className="container hero__content">
        <div className="hero__tag">🇮🇳 Made for Indian Farmers</div>

        <h1 className="hero__headline">
          Smart Farming,<br />
          <span className="hero__headline-accent">Better Future</span>
        </h1>

        <p className="hero__subtext">
          AI-powered crop recommendations, real-time weather insights, and
          government scheme guidance — all in one platform built for India's
          hardworking farmers.
        </p>

        <div className="hero__actions">
          <button
            className="btn-primary hero__btn-main"
            id="hero-get-started"
            onClick={() => scrollTo('#crop-recommendation')}
          >
            🚀 Get Started Free
          </button>
          <button
            className="hero__btn-secondary"
            id="hero-learn-more"
            onClick={() => scrollTo('#schemes')}
          >
            ▶ View Schemes
          </button>
        </div>

        {/* Stats row */}
        <div className="hero__stats">
          {[
            { value: '500+', label: 'Crop Varieties' },
            { value: '28',   label: 'States Covered' },
            { value: '94%',  label: 'Accuracy Rate' },
            { value: '₹0',   label: 'Always Free' },
          ].map(s => (
            <div className="hero__stat" key={s.label}>
              <span className="hero__stat-value">{s.value}</span>
              <span className="hero__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero__scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
