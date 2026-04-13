import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hostels from '../data/hostels';

// Top-rated hostels for featured section
const featuredHostels = [...hostels]
  .filter(h => h.rating >= 4.5 && h.ratingCount > 20)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 4);

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const duration = 1500;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) requestAnimationFrame(step);
        else setCount(target);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const { isLoggedIn, isOwner } = useAuth();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/hostels${searchInput ? `?q=${encodeURIComponent(searchInput)}` : ''}`);
  };

  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="hero__badge">🎓 Made for CUSAT Students</div>
          <h1 className="hero__title">
            Find Your Perfect<br />
            <span className="hero__title-highlight">Hostel Near CUSAT</span>
          </h1>
          <p className="hero__subtitle">
            Compare 100+ verified hostels with AI-powered recommendations,
            safety scores, and real reviews — all in one place.
          </p>

          <form className="hero__search" onSubmit={handleSearch}>
            <span className="hero__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, location, or amenity..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="hero__cta-group">
            {isLoggedIn ? (
              <button className="btn-hero-primary" onClick={() => navigate('/hostels')}>
                Browse Hostels →
              </button>
            ) : (
              <>
                <button className="btn-hero-primary" onClick={() => navigate('/login')}>
                  Get Started Free
                </button>
                <button className="btn-hero-secondary" onClick={() => navigate('/hostels')}>
                  Browse Hostels
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hero__cards">
          {featuredHostels.slice(0, 2).map(h => (
            <div key={h.id} className="hero__preview-card" onClick={() => navigate(`/hostel/${h.id}`)}>
              <img src={h.image} alt={h.name} />
              <div className="hero__preview-info">
                <strong>{h.name}</strong>
                <span>⭐ {h.rating} · {h.distance} km · ₹{h.price ? h.price.toLocaleString() : 'Contact'}/mo</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={100} suffix="+" /></div>
            <div className="stat-label">Verified Hostels</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-number">₹<AnimatedCounter target={3200} /></div>
            <div className="stat-label">Avg Monthly Rent</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={4} prefix="" suffix=".2 ★" /></div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-number"><AnimatedCounter target={500} suffix="+" /></div>
            <div className="stat-label">Happy Students</div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works">
        <div className="section-container">
          <div className="section-tag">How It Works</div>
          <h2 className="section-title">Find Your Hostel in 3 Simple Steps</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">🔍</div>
              <h3>Search & Filter</h3>
              <p>Browse 100+ hostels near CUSAT. Filter by price, distance, hostel type, safety score, and amenities.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">🤖</div>
              <h3>AI Recommendation</h3>
              <p>Describe what you need in plain language. Our KNN model finds your perfect match instantly.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">✅</div>
              <h3>Book Instantly</h3>
              <p>Compare side-by-side, read real reviews, and confirm your booking — all on one platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED HOSTELS ── */}
      <section className="featured-hostels">
        <div className="section-container">
          <div className="section-tag">Top Picks</div>
          <h2 className="section-title">Highest Rated Hostels Near CUSAT</h2>
          <div className="featured-grid">
            {featuredHostels.map(h => (
              <article
                key={h.id}
                className="featured-card"
                onClick={() => navigate(`/hostel/${h.id}`)}
              >
                <div className="featured-card__img">
                  <img src={h.image} alt={h.name} loading="lazy" />
                  <span className="featured-card__type" style={{
                    background: h.hostelType === 'Gents' ? '#1a73e8' : h.hostelType === 'Ladies' ? '#e91e63' : '#7c4dff'
                  }}>{h.hostelType}</span>
                  <div className="featured-card__rating">⭐ {h.rating}</div>
                </div>
                <div className="featured-card__body">
                  <h3>{h.name}</h3>
                  <p className="featured-card__addr">📍 {h.address}</p>
                  <div className="featured-card__meta">
                    <span className="featured-card__dist">📏 {h.distance} km</span>
                    <span className="featured-card__safety">🛡 {h.safetyScore}/10</span>
                  </div>
                  <div className="featured-card__price">
                    {h.price ? <><strong>₹{h.price.toLocaleString()}</strong><span>/month</span></> : <span>Contact for price</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="featured-cta">
            <button className="btn-see-all" onClick={() => navigate('/hostels')}>
              View All {hostels.length}+ Hostels →
            </button>
          </div>
        </div>
      </section>

      {/* ── WHY HAVENLY ── */}
      <section className="why-havenly">
        <div className="section-container">
          <div className="section-tag">Why Havenly</div>
          <h2 className="section-title">Everything You Need to Find the Right Hostel</h2>
          <div className="features-grid">
            {[
              { icon: '🤖', title: 'AI-Powered Matching', desc: 'Our KNN model understands natural language — just describe what you want.' },
              { icon: '⚖️', title: 'Side-by-Side Compare', desc: 'Compare up to 3 hostels on price, safety, amenities, food quality, and more.' },
              { icon: '🛡️', title: 'Safety Scores', desc: 'Every hostel has a verified safety score based on real student feedback and CCTV presence.' },
              { icon: '📍', title: 'Google Maps Integration', desc: 'See exact locations, distances from CUSAT, and navigate directly from the app.' },
              { icon: '⭐', title: 'Verified Reviews', desc: 'Read honest reviews from real CUSAT students who have lived in these hostels.' },
              { icon: '🏠', title: 'Owner Verified', desc: 'Hostel owners manage their own listings, keeping info accurate and up to date.' },
            ].map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="cta-banner__content">
          <h2>Ready to Find Your Home Away From Home?</h2>
          <p>Join hundreds of CUSAT students who found their perfect hostel on Havenly.</p>
          <div className="cta-banner__buttons">
            <button className="btn-cta-primary" onClick={() => navigate(isLoggedIn ? '/hostels' : '/login')}>
              {isLoggedIn ? 'Browse Hostels' : 'Sign Up Free'}
            </button>
            {!isLoggedIn && (
              <button className="btn-cta-secondary" onClick={() => navigate('/login')}>
                Already have an account? Login
              </button>
            )}
          </div>
        </div>
        <div className="cta-banner__pattern" />
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="footer-inner">
          <span className="footer-logo">Havenly</span>
          <span className="footer-copy">© 2026 Havenly · Made with ❤️ for CUSAT students</span>
          <div className="footer-links">
            <Link to="/hostels">Browse</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
