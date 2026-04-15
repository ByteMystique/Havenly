import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import BookingModal from '../components/BookingModal';
import ImageGallery from '../components/ImageGallery';
import ReviewSection from '../components/ReviewSection';
import { dataService } from '../services/dataService';
import { getAmenityIcon } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';
import hostels from '../data/hostels';

function TypeBadge({ type }) {
  const cls = type === 'Gents' ? 'gents' : type === 'Ladies' ? 'ladies' : 'mixed';
  return <span className={`type-badge type-badge--${cls}`}>{type}</span>;
}

function SafetyBadge({ score }) {
  if (score == null) return null;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    dataService.getHostel(id).then(h => {
      setHostel(h);
      setLoading(false);
    });
  }, [id]);

  const similarHostels = useMemo(() => {
    if (!hostel) return [];
    return hostels
      .filter(h => h.id !== hostel.id && h.hostelType === hostel.hostelType)
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
      `Phone: +91 98765 43210 | Email: ${hostel.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      5000
    );
  };

  const openGoogleMaps = () => {
    if (hostel.googleMapsId) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${hostel.googleMapsId}`, '_blank');
    } else if (hostel.latitude && hostel.longitude) {
      window.open(`https://www.google.com/maps/@${hostel.latitude},${hostel.longitude},17z`, '_blank');
    } else {
      // Fall back to address search — works for all hostels
      const query = encodeURIComponent(`${hostel.name}, ${hostel.address || 'CUSAT Kalamassery, Kochi'}`);
      window.open(`https://www.google.com/maps/search/${query}`, '_blank');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="main"><div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="loading-spinner" /><p style={{ marginTop: 16, color: '#6b7280' }}>Loading hostel details...</p>
        </div></main>
      </>
    );
  }

  if (!hostel) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="container">
            <div className="detail-container" style={{ padding: 60, textAlign: 'center' }}>
              <h2>Hostel not found</h2>
              <p>The hostel you&apos;re looking for doesn&apos;t exist.</p>
              <button className="btn-primary" onClick={() => navigate('/hostels')}>Back to Hostels</button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const images = hostel.images || [hostel.image];

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back to Hostels</button>

          <div className="detail-container">
            {/* Image Gallery */}
            <div style={{ position: 'relative' }}>
              <ImageGallery images={images} alt={hostel.name} />
              <button
                className={`favorite-btn ${isFavorite(hostel.id) ? 'active' : ''}`}
                onClick={handleToggleFavorite}
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
              >
                {isFavorite(hostel.id) ? '❤️' : '🤍'}
              </button>
            </div>

            <div className="detail-content">
              {/* Header */}
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
                    {hostel.price
                      ? <><div className="price">₹{hostel.price.toLocaleString()}</div><div className="price-label">per month</div></>
                      : <div className="price price-na">Contact</div>
                    }
                  </div>
                  <div className="rating-box">
                    <span className="rating">⭐ {hostel.rating}</span>
                    <div className="rating-label">{hostel.ratingCount || 0} reviews</div>
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="detail-scores">
                <h2>Scores</h2>
                <div className="detail-scores-grid">
                  {hostel.safetyScore != null && <ScoreBar label="Safety" value={hostel.safetyScore} max={10} color="var(--green-700)" />}
                  {hostel.foodQuality != null && <ScoreBar label="Food Quality" value={hostel.foodQuality} max={10} color="var(--blue-600)" />}
                  <ScoreBar label="Rating" value={hostel.rating || 0} max={5} color="var(--yellow-500)" />
                </div>
              </div>

              {/* Amenities */}
              <div className="amenities-section">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {(hostel.amenities || []).map(amenity => (
                    <div key={amenity} className="amenity-item">
                      {getAmenityIcon(amenity)} {amenity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="description-section">
                <h2>About This Hostel</h2>
                <p>{hostel.description}</p>
              </div>

              {/* Actions */}
              <div className="action-buttons">
                {hostel.price && (
                  <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    Book Now
                  </button>
                )}
                <button className="btn-secondary" onClick={contactHostel}>Contact Hostel</button>
                <button className="btn-outline" onClick={openGoogleMaps}>📍 View on Google Maps</button>
              </div>

              {/* Reviews */}
              <ReviewSection hostelId={hostel.id} hostelName={hostel.name} />
            </div>
          </div>

          {/* Similar Hostels */}
          {similarHostels.length > 0 && (
            <div className="similar-hostels">
              <h2>Similar Hostels</h2>
              <div className="similar-grid">
                {similarHostels.map(h => (
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

      <BookingModal hostel={hostel} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
