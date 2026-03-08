import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import BookingModal from '../components/BookingModal';
import hostels from '../data/hostels';
import { getAmenityIcon } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';

function TypeBadge({ type }) {
  const cls = type === 'Gents' ? 'gents' : type === 'Ladies' ? 'ladies' : 'mixed';
  return <span className={`type-badge type-badge--${cls}`}>{type}</span>;
}

function SafetyBadge({ score }) {
  if (score === null || score === undefined) return null;
  const lvl = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';
  return <span className={`safety-badge safety-badge--${lvl}`}>🛡 {score.toFixed(1)}</span>;
}

function ScoreBar({ label, value, max = 10, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="score-bar">
      <div className="score-bar__label">{label}</div>
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="score-bar__value">{value.toFixed(1)}/{max}</div>
    </div>
  );
}

export default function HostelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const hostel = hostels.find((h) => h.id === parseInt(id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Find similar hostels: same type, closest distance, exclude self
  const similarHostels = useMemo(() => {
    if (!hostel) return [];
    return hostels
      .filter((h) => h.id !== hostel.id && h.hostelType === hostel.hostelType)
      .sort((a, b) => {
        const da = Math.abs(a.distance - hostel.distance) + Math.abs((a.price || 0) - (hostel.price || 0)) / 1000;
        const db = Math.abs(b.distance - hostel.distance) + Math.abs((b.price || 0) - (hostel.price || 0)) / 1000;
        return da - db;
      })
      .slice(0, 4);
  }, [hostel]);

  const handleToggleFavorite = () => {
    toggleFavorite(hostel.id);
    if (isFavorite(hostel.id)) {
      toast.info('Removed from favorites', hostel.name, 2000);
    } else {
      toast.success('Added to favorites!', hostel.name, 2000);
    }
  };

  const contactHostel = () => {
    toast.info(
      `Contact ${hostel.name}`,
      `Phone: +91 98765 43210 | Email: ${hostel.name.toLowerCase().replace(/\s+/g, '')}@havenly.com`,
      5000
    );
  };

  const openGoogleMaps = () => {
    if (hostel.googleMapsId) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${hostel.googleMapsId}`, '_blank');
    } else if (hostel.latitude && hostel.longitude) {
      window.open(`https://www.google.com/maps/@${hostel.latitude},${hostel.longitude},17z`, '_blank');
    }
  };

  if (!hostel) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="container">
            <div className="detail-container" style={{ padding: 60, textAlign: 'center' }}>
              <h2>Hostel not found</h2>
              <p>The hostel you&apos;re looking for doesn&apos;t exist.</p>
              <button className="btn-primary" onClick={() => navigate('/hostels')}>
                Back to Hostels
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back to Hostels
          </button>

          <div className="detail-container">
            <div className="image-gallery">
              <img src={hostel.image} alt={hostel.name} className="main-image" />
              <button
                className={`favorite-btn ${isFavorite(hostel.id) ? 'active' : ''}`}
                onClick={handleToggleFavorite}
              >
                {isFavorite(hostel.id) ? '❤️' : '🤍'}
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-title">
                  <div className="detail-title-badges">
                    <h1>{hostel.name}</h1>
                    <TypeBadge type={hostel.hostelType} />
                    <SafetyBadge score={hostel.safetyScore} />
                  </div>
                  <p className="location">📍 {hostel.address || hostel.location}</p>
                  <p className="detail-distance">📏 {hostel.distance} km from CUSAT</p>
                </div>
                <div className="detail-actions">
                  <div className="price-box">
                    {hostel.price ? (
                      <>
                        <div className="price">₹{hostel.price.toLocaleString()}</div>
                        <div className="price-label">per month</div>
                      </>
                    ) : (
                      <div className="price price-na">Contact</div>
                    )}
                  </div>
                  <div className="rating-box">
                    <span className="rating">⭐ {hostel.rating}</span>
                    <div className="rating-label">{hostel.ratingCount || 0} reviews</div>
                  </div>
                </div>
              </div>

              {/* Scores section */}
              <div className="detail-scores">
                <h2>Scores</h2>
                <div className="detail-scores-grid">
                  {hostel.safetyScore !== null && (
                    <ScoreBar label="Safety" value={hostel.safetyScore} max={10} color="var(--green-700)" />
                  )}
                  {hostel.foodQuality !== null && (
                    <ScoreBar label="Food Quality" value={hostel.foodQuality} max={10} color="var(--blue-600)" />
                  )}
                  <ScoreBar label="Rating" value={hostel.rating || 0} max={5} color="var(--yellow-500)" />
                </div>
              </div>

              <div className="amenities-section">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {hostel.amenities.map((amenity) => (
                    <div key={amenity} className="amenity-item">
                      {getAmenityIcon(amenity)} {amenity}
                    </div>
                  ))}
                </div>
              </div>

              <div className="description-section">
                <h2>About This Hostel</h2>
                <p>{hostel.description}</p>
              </div>

              <div className="action-buttons">
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  Book Now
                </button>
                <button className="btn-secondary" onClick={contactHostel}>
                  Contact Hostel
                </button>
                {(hostel.googleMapsId || (hostel.latitude && hostel.longitude)) && (
                  <button className="btn-outline" onClick={openGoogleMaps}>
                    📍 View on Google Maps
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Similar Hostels */}
          {similarHostels.length > 0 && (
            <div className="similar-hostels">
              <h2>Similar Hostels</h2>
              <div className="similar-grid">
                {similarHostels.map((h) => (
                  <Link key={h.id} to={`/hostel/${h.id}`} className="similar-card">
                    <img src={h.image} alt={h.name} />
                    <div className="similar-card__body">
                      <strong>{h.name}</strong>
                      <span>{h.distance} km · ⭐ {h.rating}</span>
                      <span>{h.price ? `₹${h.price.toLocaleString()}/mo` : 'Contact for price'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <BookingModal
        hostel={hostel}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
