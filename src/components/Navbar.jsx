import { useState, useEffect, useRef, useCallback } from 'react';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home',                href: '#home' },
  { label: 'Crop Recommendation', href: '#crop-recommendation' },
  { label: 'Disease Detection',   href: '#disease-detection' },
  { label: 'Weather',             href: '#weather' },
  { label: 'Mandi Prices',        href: '#mandi-prices' },
  { label: 'Marketplace',         href: '#marketplace' },
  { label: '🌾 Crop History',     href: '#crop-history' },
  { label: '🤖 AI Assistant',     href: '#ai-assistant' },
  { label: 'Govt. Schemes',       href: '#schemes' },
  { label: 'Contact',             href: '#contact' },
];

// Sections in page order for dynamic scroll-spy
const SECTIONS = [
  { id: 'home',                navHref: '#home' },
  { id: 'crop-recommendation', navHref: '#crop-recommendation' },
  { id: 'crop-cards',          navHref: '#crop-recommendation' },
  { id: 'disease-detection',   navHref: '#disease-detection' },
  { id: 'weather',             navHref: '#weather' },
  { id: 'mandi-prices',        navHref: '#mandi-prices' },
  { id: 'marketplace',         navHref: '#marketplace' },
  { id: 'crop-history',        navHref: '#crop-history' },
  { id: 'ai-assistant',        navHref: '#ai-assistant' },
  { id: 'schemes',             navHref: '#schemes' },
  { id: 'contact',             navHref: '#contact' },
];



export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [activeLink,   setActiveLink]   = useState('#home');

  const isManualNavRef = useRef(false);
  const manualTimerRef = useRef(null);

  // Active section detection based on current scroll position
  const updateActiveSection = useCallback(() => {
    // 1. Scrolled navbar visual state
    setScrolled(window.scrollY > 50);

    // If manual click navigation is currently in progress, let it smoothly finish
    if (isManualNavRef.current) return;

    // 2. Near bottom edge of page -> highlight Contact
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    if (window.scrollY + clientHeight >= scrollHeight - 70) {
      setActiveLink('#contact');
      return;
    }

    // 3. Near top edge of page -> highlight Home
    if (window.scrollY < 100) {
      setActiveLink('#home');
      return;
    }

    // 4. Determine which section is currently active in view
    // Trigger line: 150px from top of viewport (just below navbar)
    const triggerLine = 150;
    let currentNav = '#home';

    for (const sec of SECTIONS) {
      const el = document.getElementById(sec.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          currentNav = sec.navHref;
        }
      }
    }

    setActiveLink(currentNav);
  }, []);

  useEffect(() => {
    // Check initial position on mount or hash in URL
    if (window.location.hash && NAV_LINKS.some(l => l.href === window.location.hash)) {
      setActiveLink(window.location.hash);
    }
    updateActiveSection();

    // Throttled scroll listener using requestAnimationFrame
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, [updateActiveSection]);

  const handleNav = (e, href) => {
    e.preventDefault();
    setActiveLink(href);
    setMenuOpen(false);

    // Lock scroll-spy for 800ms while smooth scrolling completes
    isManualNavRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      isManualNavRef.current = false;
      updateActiveSection();
    }, 800);

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', href);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="navbar">
      <div className="container navbar__inner">
        {/* Logo */}
        <a href="#home" className="navbar__logo" onClick={e => handleNav(e, '#home')}>
          <span className="navbar__logo-icon">🌾</span>
          <span className="navbar__logo-text">
            Farmer<span className="navbar__logo-accent">Connect</span>
          </span>
        </a>

        {/* Desktop links */}
        <ul className="navbar__links">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`navbar__link ${activeLink === link.href ? 'navbar__link--active' : ''}`}
                onClick={e => handleNav(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href="#crop-recommendation"
          className="navbar__cta btn-primary"
          onClick={e => handleNav(e, '#crop-recommendation')}
        >
          Try Now
        </a>

        {/* Hamburger */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          id="navbar-hamburger"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        {NAV_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            className={`navbar__mobile-link ${activeLink === link.href ? 'active' : ''}`}
            onClick={e => handleNav(e, link.href)}
          >
            {link.label}
          </a>
        ))}
        <a
          href="#crop-recommendation"
          className="btn-primary"
          style={{ marginTop: '8px', justifyContent: 'center' }}
          onClick={e => handleNav(e, '#crop-recommendation')}
        >
          Try Now
        </a>
      </div>
    </nav>
  );
}
