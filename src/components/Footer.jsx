import './Footer.css';

const LINKS = {
  Platform:   ['Crop Recommendation', 'Weather Forecast', 'Govt. Schemes', 'Crop Library'],
  Resources:  ['Farming Tips', 'Soil Guide', 'Season Calendar', 'Market Prices'],
  Support:    ['Help Centre', 'Contact Us', 'Report a Bug', 'Community Forum'],
  Legal:      ['Privacy Policy', 'Terms of Service', 'Disclaimer', 'Accessibility'],
};

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        {/* Top row */}
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span>🌾</span>
              <span>Farmer<span className="footer__logo-accent">Connect</span></span>
            </div>
            <p className="footer__tagline">
              Empowering India's 140 million farming families with smart technology,
              real-time insights, and access to government benefits.
            </p>
            {/* Badges */}
            <div className="footer__badges">
              <span className="footer__badge">🏆 Hackathon 2024</span>
              <span className="footer__badge">🇮🇳 Made in India</span>
              <span className="footer__badge">💚 AgriTech</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div className="footer__col" key={title}>
              <h4 className="footer__col-title">{title}</h4>
              <ul>
                {items.map(item => (
                  <li key={item}>
                    <a href="#home" className="footer__link">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="footer__divider" />

        {/* Bottom row */}
        <div className="footer__bottom">
          <p>© 2024 FarmerConnect. Built with ❤️ for the Hackathon. All rights reserved.</p>
          <div className="footer__socials">
            {['𝕏', 'in', 'f', '▶'].map((s, i) => (
              <a key={i} href="#home" className="footer__social" aria-label="Social link">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
