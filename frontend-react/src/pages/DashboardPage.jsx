import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import useFavorites from '../hooks/useFavorites';
import { dataService } from '../services/dataService';
import { formatDate, formatRoomType } from '../utils/helpers';

export default function DashboardPage() {
  const { isLoggedIn, displayName } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [allHostels, setAllHostels] = useState([]);
  const { favoriteIds, removeFavorite } = useFavorites();

  const loadData = useCallback(async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const [b, h] = await Promise.all([
      dataService.getUserBookings(),
      dataService.getHostels(),
    ]);
    setBookings(b);
    setAllHostels(h);
  }, [isLoggedIn, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const sortedBookings = [...bookings].sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
  const favoriteHostels = allHostels.filter(h => favoriteIds.includes(h.id));

  const cancelBooking = async (id) => {
    const updated = await dataService.cancelBooking(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    toast.warning('Booking Cancelled', 'Your booking has been cancelled.', 3000);
    addNotification({
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled successfully.`,
      link: '/dashboard',
    });
  };

  const handleRemoveFavorite = (e, id) => {
    e.stopPropagation();
    removeFavorite(id);
    toast.info('Removed', 'Hostel removed from favorites', 2000);
  };

  const getHostelById = (id) => allHostels.find(h => h.id === id);

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          <div className="welcome-section">
            <h1>Welcome back, <span>{displayName}</span>! 👋</h1>
            <p>Manage your bookings and favorites all in one place</p>
          </div>

          <div className="tabs">
            {[
              { key: 'bookings', label: `📅 My Bookings (${sortedBookings.length})` },
              { key: 'favorites', label: `❤️ Favorites (${favoriteHostels.length})` },
            ].map(t => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="tab-content active">
              {sortedBookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No Bookings Yet</h3>
                  <p>You haven&apos;t made any bookings. Browse hostels to get started!</p>
                  <button className="btn-browse" onClick={() => navigate('/hostels')}>Browse Hostels</button>
                </div>
              ) : (
                <div className="content-grid">
                  {sortedBookings.map(booking => {
                    const hostel = getHostelById(booking.hostelId);
                    return (
                      <div key={booking.id} className="booking-card">
                        <div className="booking-header">
                          <h3>{booking.hostelName || hostel?.name || `Hostel #${booking.hostelId}`}</h3>
                          <div className="booking-id">ID: {booking.transactionId || `#${booking.id}`}</div>
                        </div>
                        <div className="booking-body">
                          {hostel?.image && (
                            <img
                              src={hostel.image}
                              alt={hostel.name}
                              style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 12 }}
                            />
                          )}
                          <div className="booking-info">
                            <div className="info-row">
                              <span className="info-label">Check-in</span>
                              <span className="info-value">{formatDate(booking.checkIn)}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Check-out</span>
                              <span className="info-value">{formatDate(booking.checkOut)}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Room Type</span>
                              <span className="info-value">{booking.roomType || formatRoomType(booking.roomType) || 'Standard'}</span>
                            </div>
                            {booking.paymentMethod && (
                              <div className="info-row">
                                <span className="info-label">Paid via</span>
                                <span className="info-value">{booking.paymentMethod}</span>
                              </div>
                            )}
                            <div className="info-row">
                              <span className="info-label">Status</span>
                              <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                            </div>
                          </div>
                          <div className="booking-total">
                            <span className="total-label">Total Amount</span>
                            <span className="total-amount">₹{(booking.totalAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="booking-actions">
                            <button className="btn-view" onClick={() => navigate(`/hostel/${booking.hostelId}`)}>
                              View Hostel
                            </button>
                              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                              <button className="btn-cancel" onClick={() => cancelBooking(booking.id)}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="tab-content active">
              {favoriteHostels.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">❤️</div>
                  <h3>No Favorites Yet</h3>
                  <p>Start adding hostels to your favorites to see them here!</p>
                  <button className="btn-browse" onClick={() => navigate('/hostels')}>Browse Hostels</button>
                </div>
              ) : (
                <div className="content-grid">
                  {favoriteHostels.map(hostel => (
                    <div key={hostel.id} className="favorite-card" onClick={() => navigate(`/hostel/${hostel.id}`)}>
                      <img src={hostel.image} alt={hostel.name} className="favorite-image" loading="lazy" />
                      <div className="favorite-info">
                        <h3>{hostel.name}</h3>
                        <p className="favorite-location">📍 {hostel.location || hostel.address}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                          ⭐ {hostel.rating} · 📏 {hostel.distance} km · 🛡 {hostel.safetyScore}/10
                        </p>
                        <div className="favorite-footer">
                          <div className="favorite-price">
                            {hostel.price ? `₹${hostel.price.toLocaleString()}/mo` : 'Contact for price'}
                          </div>
                          <button className="remove-favorite" onClick={e => handleRemoveFavorite(e, hostel.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
