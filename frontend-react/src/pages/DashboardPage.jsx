import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import hostels from '../data/hostels';
import { formatDate, formatRoomType } from '../utils/helpers';
import { getUserBookings, deleteBooking } from '../api/bookings';

export default function DashboardPage() {
  const { isLoggedIn, displayName, userId } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);

useEffect(() => {
  if (!isLoggedIn) {
    navigate('/');
    return;
  }

  if (!userId) return;

  async function loadBookings() {
      try {
        const res = await getUserBookings(userId);
        const data = res.data;

       const mapped = data.map((b) => {
         const hostel = hostels.find((h) => h.id === b.hostel_id);

         return {
          id: b.id,
          hostelId: b.hostel_id,
          hostelName: hostel?.name || "Hostel",
          checkIn: b.check_in,
          checkOut: b.check_out,
          roomType: "single",
          specialRequests: "",
          totalAmount: hostel?.price || 0,
          status: "pending",
          bookedAt: b.created_at
         };
        });

       setBookings(mapped);

      } catch (err) {
       console.error("Failed to load bookings", err);
      }
   }

    loadBookings();

    setFavoriteIds(JSON.parse(localStorage.getItem('favorites') || '[]'));

  }, [isLoggedIn, navigate, userId]);

  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)
  );

  const favoriteHostels = hostels.filter((h) => favoriteIds.includes(h.id));

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await deleteBooking(id);

      setBookings((prev) => prev.filter((b) => b.id !== id));

      toast.warning(
        'Booking Cancelled',
        'Your booking has been cancelled successfully.',
        3000
      );

    } catch (err) {
      console.error(err);
      toast.error(
        'Cancellation Failed',
        'Unable to cancel booking.',
        3000
      );
    }
  };

  const removeFavorite = (e, id) => {
    e.stopPropagation();
    const updated = favoriteIds.filter((fav) => fav !== id);
    setFavoriteIds(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    toast.info('Removed', 'Hostel removed from favorites', 2000);
  };

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>Welcome back, <span>{displayName}</span>! 👋</h1>
            <p>Manage your bookings and favorites all in one place</p>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              📅 My Bookings
            </button>
            <button
              className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              ❤️ Favorites
            </button>
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="tab-content active">
              <div className="content-grid">
                {sortedBookings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Bookings Yet</h3>
                    <p>You haven&apos;t made any bookings. Browse hostels to get started!</p>
                    <button className="btn-browse" onClick={() => navigate('/hostels')}>
                      Browse Hostels
                    </button>
                  </div>
                ) : (
                  sortedBookings.map((booking) => (
                    <div key={booking.id} className="booking-card">
                      <div className="booking-header">
                        <h3>{booking.hostelName}</h3>
                        <div className="booking-id">Booking ID: #{booking.id}</div>
                      </div>
                      <div className="booking-body">
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
                            <span className="info-value">{formatRoomType(booking.roomType)}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Status</span>
                            <span className={`status-badge status-${booking.status}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                        {booking.specialRequests && (
                          <div className="info-row">
                            <span className="info-label">Special Requests</span>
                            <span className="info-value">{booking.specialRequests}</span>
                          </div>
                        )}
                        <div className="booking-total">
                          <span className="total-label">Total Amount</span>
                          <span className="total-amount">
                            ₹{booking.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="booking-actions">
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/hostel/${booking.hostelId}`)}
                          >
                            View Hostel
                          </button>
                          {booking.status === 'pending' && (
                            <button
                              className="btn-cancel"
                              onClick={() => cancelBooking(booking.id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="tab-content active">
              <div className="content-grid">
                {favoriteHostels.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">❤️</div>
                    <h3>No Favorites Yet</h3>
                    <p>Start adding hostels to your favorites to see them here!</p>
                    <button className="btn-browse" onClick={() => navigate('/hostels')}>
                      Browse Hostels
                    </button>
                  </div>
                ) : (
                  favoriteHostels.map((hostel) => (
                    <div
                      key={hostel.id}
                      className="favorite-card"
                      onClick={() => navigate(`/hostel/${hostel.id}`)}
                    >
                      <img src={hostel.image} alt={hostel.name} className="favorite-image" />
                      <div className="favorite-info">
                        <h3>{hostel.name}</h3>
                        <p className="favorite-location">📍 {hostel.location}</p>
                        <div className="favorite-footer">
                          <div className="favorite-price">
                            ₹{hostel.price.toLocaleString()}/mo
                          </div>
                          <button
                            className="remove-favorite"
                            onClick={(e) => removeFavorite(e, hostel.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
