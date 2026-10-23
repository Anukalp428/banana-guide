import { useState } from 'react';
import './Contact.css';

export default function Contact() {
  const [form, setForm]       = useState({ name: '', phone: '', state: '', message: '', category: '' });
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="contact-section__header">
          <span className="section-label">📬 Contact Us</span>
          <h2 className="section-title">We're Here to Help</h2>
          <p className="section-subtitle">
            Have a question about crops, schemes, or our platform? Reach out and
            our agriculture experts will get back to you within 24 hours.
          </p>
        </div>

        <div className="contact-layout">
          {/* Info cards */}
          <div className="contact-info">
            {[
              { icon: '📞', title: 'Helpline', detail: '1800-180-1551', sub: 'Kisan Call Centre (Toll-Free)', color: '#2D6A4F' },
              { icon: '📧', title: 'Email',    detail: 'help@farmerconnect.in', sub: 'We respond within 24 hours', color: '#1565C0' },
              { icon: '📍', title: 'Office',   detail: 'Krishi Bhawan, New Delhi', sub: 'Department of Agriculture', color: '#AD1457' },
              { icon: '🕐', title: 'Hours',    detail: 'Mon–Sat: 9 AM – 6 PM', sub: 'Emergency: 24/7 Helpline', color: '#E65100' },
            ].map(c => (
              <div className="contact-info-card" key={c.title}>
                <div className="contact-info-card__icon" style={{ background: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <p className="contact-info-card__title">{c.title}</p>
                  <p className="contact-info-card__detail">{c.detail}</p>
                  <p className="contact-info-card__sub">{c.sub}</p>
                </div>
              </div>
            ))}

            {/* Social proof */}
            <div className="contact-trust">
              <p>🏆 Trusted by farmers from 28 states across India</p>
              <div className="contact-trust__row">
                <span>⭐⭐⭐⭐⭐</span>
                <span>4.8 / 5 (2,400+ reviews)</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-card">
            {sent ? (
              <div className="contact-form-success">
                <div className="contact-form-success__icon">✅</div>
                <h3>Message Sent!</h3>
                <p>Thank you, <strong>{form.name}</strong>! Our team will reach out to you on <strong>{form.phone}</strong> within 24 hours.</p>
                <button className="btn-primary" onClick={() => { setSent(false); setForm({ name: '', phone: '', state: '', message: '', category: '' }); }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
                <h3 className="contact-form__title">Send Us a Message</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contact-name">Full Name *</label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      placeholder="Ramesh Kumar"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contact-state">State</label>
                    <input
                      type="text"
                      id="contact-state"
                      name="state"
                      placeholder="e.g. Punjab"
                      value={form.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-category">Category</label>
                    <select id="contact-category" name="category" value={form.category} onChange={handleChange}>
                      <option value="" disabled>Select topic…</option>
                      <option>Crop Recommendation</option>
                      <option>Government Schemes</option>
                      <option>Weather Query</option>
                      <option>Technical Support</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message">Your Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    placeholder="Describe your query or problem here…"
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary contact-form__submit"
                  id="contact-form-submit"
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" /> Sending…</> : '📤 Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
