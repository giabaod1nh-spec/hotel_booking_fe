import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ---- date helpers ---- */
function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const o = new Date(d); o.setDate(o.getDate() + n); return o; }

/* ---- static data ---- */
const DESTINATIONS = [
  { city: 'Ho Chi Minh', country: 'Vietnam', img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop', properties: 1280 },
  { city: 'Hanoi', country: 'Vietnam', img: 'https://images.unsplash.com/photo-1570655652364-2e0a67455ac6?w=400&h=300&fit=crop', properties: 940 },
  { city: 'Da Nang', country: 'Vietnam', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop', properties: 620 },
  { city: 'Hoi An', country: 'Vietnam', img: 'https://images.unsplash.com/photo-1552334405-4929084a3f0a?w=400&h=300&fit=crop', properties: 380 },
  { city: 'Nha Trang', country: 'Vietnam', img: 'https://images.unsplash.com/photo-1573553071459-3b7adac78eb0?w=400&h=300&fit=crop', properties: 510 },
  { city: 'Phu Quoc', country: 'Vietnam', img: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf4?w=400&h=300&fit=crop', properties: 290 },
];

const PROPERTY_TYPES = [
  { label: 'Hotels', icon: '🏨', desc: 'From budget to luxury' },
  { label: 'Apartments', icon: '🏢', desc: 'Stay like a local' },
  { label: 'Resorts', icon: '🏖️', desc: 'Relax & unwind' },
  { label: 'Villas', icon: '🏡', desc: 'Private & spacious' },
];

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>
    ),
    title: 'Free cancellation',
    desc: 'Cancel free of charge on most rooms. Lock in your price today.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
    title: 'Secure booking',
    desc: 'Your payment is processed safely with bank-grade encryption.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    title: 'Real guest reviews',
    desc: 'Read verified reviews from travellers just like you.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    title: '24/7 support',
    desc: 'We\'re here whenever you need us, day or night.',
  },
];

/* ================================================================ */
export function Search() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const today = fmt(new Date());
  const tomorrow = fmt(addDays(new Date(), 1));

  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [cityError, setCityError] = useState(false);

  const handleSearch = (e: React.FormEvent, destCity?: string) => {
    e.preventDefault();
    const target = destCity ?? city;
    if (!target.trim()) { setCityError(true); return; }
    setCityError(false);
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/search' } });
      return;
    }
    navigate(`/search/results?city=${encodeURIComponent(target.trim())}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="hp-page">

      {/* ============================================================
          NAVBAR
      ============================================================ */}
      <nav className="hp-nav">
        <div className="hp-nav-inner">
          {/* Logo */}
          <Link to="/" className="hp-nav-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            Hotel Booking
          </Link>

          {/* Center links */}
          <div className="hp-nav-links">
            <Link to="/" className="hp-nav-link hp-nav-link-active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Stays
            </Link>
            <Link to="/dashboard" className="hp-nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              My bookings
            </Link>
          </div>

          {/* Right auth area */}
          <div className="hp-nav-auth">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hp-nav-btn hp-nav-btn-outline">My account</Link>
                <button onClick={handleLogout} className="hp-nav-btn hp-nav-btn-solid">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/register" className="hp-nav-btn hp-nav-btn-outline">Register</Link>
                <Link to="/login" className="hp-nav-btn hp-nav-btn-solid">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============================================================
          HERO
      ============================================================ */}
      <section className="hp-hero">
        <div className="hp-hero-bg" />
        <div className="hp-hero-content">
          <h1 className="hp-hero-title">Find your next stay</h1>
          <p className="hp-hero-subtitle">
            Search deals on hotels, homes, and much more...
          </p>

          {/* ---- Floating search box ---- */}
          <form className="hp-sb" onSubmit={handleSearch}>

            {/* Destination */}
            <label className={`hp-sb-field hp-sb-dest${cityError ? ' hp-sb-error' : ''}`}>
              <span className="hp-sb-label">Destination</span>
              <input
                type="text"
                className="hp-sb-input"
                placeholder="Where are you going?"
                value={city}
                onChange={(e) => { setCity(e.target.value); setCityError(false); }}
              />
              {cityError && <span className="hp-sb-err-msg">Please enter a destination</span>}
            </label>

            <span className="hp-sb-sep" />

            {/* Check-in */}
            <label className="hp-sb-field">
              <span className="hp-sb-label">Check-in</span>
              <input
                type="date"
                className="hp-sb-input"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </label>

            <span className="hp-sb-sep" />

            {/* Check-out */}
            <label className="hp-sb-field">
              <span className="hp-sb-label">Check-out</span>
              <input
                type="date"
                className="hp-sb-input"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </label>

            <span className="hp-sb-sep" />

            {/* Guests */}
            <label className="hp-sb-field hp-sb-narrow">
              <span className="hp-sb-label">Guests</span>
              <div className="hp-sb-counter">
                <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
                <span>{guests}</span>
                <button type="button" onClick={() => setGuests(g => Math.min(20, g + 1))}>+</button>
              </div>
            </label>

            <span className="hp-sb-sep" />

            {/* Rooms */}
            <label className="hp-sb-field hp-sb-narrow">
              <span className="hp-sb-label">Rooms</span>
              <div className="hp-sb-counter">
                <button type="button" onClick={() => setRooms(r => Math.max(1, r - 1))}>−</button>
                <span>{rooms}</span>
                <button type="button" onClick={() => setRooms(r => Math.min(10, r + 1))}>+</button>
              </div>
            </label>

            {/* Search Button */}
            <button type="submit" className="hp-sb-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ============================================================
          BODY CONTENT
      ============================================================ */}
      <main className="hp-main">

        {/* ---- Property types ---- */}
        <section className="hp-section">
          <h2 className="hp-section-title">Browse by property type</h2>
          <div className="hp-property-grid">
            {PROPERTY_TYPES.map((p) => (
              <button
                key={p.label}
                className="hp-property-card"
                onClick={(e) => handleSearch(e as unknown as React.FormEvent, p.label === 'Hotels' ? city || 'Vietnam' : city || 'Vietnam')}
              >
                <span className="hp-property-icon">{p.icon}</span>
                <span className="hp-property-label">{p.label}</span>
                <span className="hp-property-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ---- Popular destinations ---- */}
        <section className="hp-section">
          <h2 className="hp-section-title">Popular destinations in Vietnam</h2>
          <p className="hp-section-sub">Travellers searching for places in Vietnam also look at these</p>
          <div className="hp-dest-grid">
            {DESTINATIONS.map((d) => (
              <button
                key={d.city}
                className="hp-dest-card"
                onClick={(e) => {
                  setCity(d.city);
                  handleSearch(e as unknown as React.FormEvent, d.city);
                }}
              >
                <img src={d.img} alt={d.city} className="hp-dest-img" loading="lazy" />
                <div className="hp-dest-overlay">
                  <span className="hp-dest-city">{d.city}</span>
                  <span className="hp-dest-count">{d.properties.toLocaleString()} properties</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ---- Features / Why us ---- */}
        <section className="hp-section hp-section-features">
          <h2 className="hp-section-title hp-section-title-center">Why choose Hotel Booking?</h2>
          <div className="hp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="hp-feature-card">
                <div className="hp-feature-icon">{f.icon}</div>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- CTA Banner ---- */}
        {!isAuthenticated && (
          <section className="hp-cta-banner">
            <div className="hp-cta-content">
              <h2>Save time, save money!</h2>
              <p>Sign up and we'll send the best deals to you</p>
              <div className="hp-cta-actions">
                <Link to="/register" className="hp-cta-btn-primary">Create account</Link>
                <Link to="/login" className="hp-cta-btn-secondary">Sign in</Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <span className="hp-footer-logo">Hotel Booking</span>
            <p>Find your perfect stay anywhere in Vietnam.</p>
          </div>
          <div className="hp-footer-links">
            <h4>Support</h4>
            <Link to="/">Help centre</Link>
            <Link to="/">Contact us</Link>
            <Link to="/">Cancellation options</Link>
          </div>
          <div className="hp-footer-links">
            <h4>Company</h4>
            <Link to="/">About Hotel Booking</Link>
            <Link to="/">Careers</Link>
            <Link to="/">Press centre</Link>
          </div>
          <div className="hp-footer-links">
            <h4>Account</h4>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">My account</Link>
                <Link to="/dashboard">My bookings</Link>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
          </div>
        </div>
        <div className="hp-footer-bottom">
          <p>© 2025 Hotel Booking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
