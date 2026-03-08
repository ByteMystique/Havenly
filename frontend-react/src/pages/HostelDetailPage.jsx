import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BookingModal from '../components/BookingModal';
import hostels from '../data/hostels';
import { getAmenityIcon } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';

export default function HostelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const hostel = hostels.find((h) => h.id === parseInt(id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

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
                  <h1>{hostel.name}</h1>
                  <p className="location">📍 {hostel.location}</p>
                </div>
                <div className="detail-actions">
                  <div className="price-box">
                    <div className="price">₹{hostel.price.toLocaleString()}</div>
                    <div className="price-label">per month</div>
                  </div>
                  <div className="rating-box">
                    <span className="rating">⭐ {hostel.rating}</span>
                    <div className="rating-label">Rating</div>
                  </div>
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
              </div>
            </div>
          </div>
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
