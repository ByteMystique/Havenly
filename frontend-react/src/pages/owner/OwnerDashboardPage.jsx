import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-card__icon" style={{ background: color + '22', color }}>{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    Promise.all([
      dataService.getMyHostels(),
      dataService.getOwnerBookings(),
    ]).then(([h, b]) => {
      setHostels(h);
      setBookings(b);
      (async () => {
        const allReviews = [];
        for (const hostel of h) {
          const r = await dataService.getHostelReviews(hostel.id);
          allReviews.push(...r);
        }
        setReviews(allReviews);
      })();
    });
  }, []);

  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const revenue = activeBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  const recentBookings = [...bookings].sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)).slice(0, 5);
  const recentReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

  const handleStatusChange = async (bookingId, status) => {
    await dataService.updateBookingStatus(bookingId, status);
    const updated = await dataService.getOwnerBookings();
    setBookings(updated);
  };

  return (
    <>
      <Header />
      <div className="owner-page">
      <div className="owner-page__header">
        <div>
          <h1>Welcome back, {displayName} 👋</h1>
          <p>Here's your hostel business overview</p>
        </div>
        <button className="btn-add-hostel" onClick={() => navigate('/owner/hostels/new')}>
          + Add New Hostel
        </button>
      </div>

      {/* Stats */}
      <div className="stats-cards-row">
        <StatCard icon="🏠" label="Total Listings" value={hostels.length} sub={`${hostels.filter(h => h.status === 'active').length} active`} color="#0057b7" />
        <StatCard icon="📋" label="Total Bookings" value={bookings.length} sub={`${pendingBookings.length} pending`} color="#7c4dff" />
        <StatCard icon="💰" label="Total Revenue" value={`₹${revenue.toLocaleString()}`} sub="from confirmed bookings" color="#00897b" />
        <StatCard icon="⭐" label="Avg Rating" value={avgRating} sub={`from ${reviews.length} reviews`} color="#f59e0b" />
      </div>

      <div className="owner-grid">
        {/* Recent Bookings */}
        <div className="owner-card">
          <div className="owner-card__header">
            <h2>Recent Bookings</h2>
            <button className="btn-link" onClick={() => navigate('/owner/bookings')}>View All →</button>
          </div>
          {recentBookings.length === 0 ? (
            <div className="owner-empty">No bookings yet</div>
          ) : (
            <table className="owner-table">
              <thead>
                <tr><th>Student</th><th>Hostel</th><th>Check-in</th><th>Amount</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {recentBookings.map(b => {
                  const hostel = hostels.find(h => h.id === b.hostelId);
                  return (
                    <tr key={b.id}>
                      <td>{b.studentName || 'Student'}</td>
                      <td>{hostel?.name || `Hostel #${b.hostelId}`}</td>
                      <td>{b.checkIn ? new Date(b.checkIn).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{b.totalAmount ? `₹${b.totalAmount.toLocaleString()}` : '—'}</td>
                      <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                      <td>
                        {b.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-approve" onClick={() => handleStatusChange(b.id, 'confirmed')}>✓</button>
                            <button className="btn-reject" onClick={() => handleStatusChange(b.id, 'cancelled')}>✗</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="owner-card">
          <div className="owner-card__header">
            <h2>Recent Reviews</h2>
          </div>
          {recentReviews.length === 0 ? (
            <div className="owner-empty">No reviews yet</div>
          ) : recentReviews.map(r => {
            const hostel = hostels.find(h => h.id === r.hostelId);
            return (
              <div key={r.id} className="owner-review-item">
                <div className="owner-review-item__top">
                  <strong>{r.userName}</strong>
                  <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p className="owner-review-item__text">{r.text}</p>
                <span className="owner-review-item__hostel">📍 {hostel?.name || `Hostel #${r.hostelId}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="owner-quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/owner/hostels')}>🏠 Manage Hostels</button>
        <button className="quick-action-btn" onClick={() => navigate('/owner/bookings')}>📋 All Bookings</button>
        <button className="quick-action-btn" onClick={() => navigate('/hostels')}>👁 View Public Listing</button>
      </div>
      </div>
    </>
  );
}
