import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Header from '../../components/Header';

const FILTERS = ['all', 'pending', 'confirmed', 'cancelled'];

export default function OwnerBookingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    const [b, h] = await Promise.all([dataService.getOwnerBookings(), dataService.getMyHostels()]);
    setBookings(b);
    setHostels(h);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (bookingId, status, bookingData) => {
    await dataService.updateBookingStatus(bookingId, status);
    const hostel = hostels.find(h => h.id === bookingData?.hostelId);
    addNotification({
      type: status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
      title: status === 'confirmed' ? 'Booking Approved' : 'Booking Rejected',
      message: `Booking at ${hostel?.name || 'hostel'} ${status === 'confirmed' ? 'confirmed' : 'rejected'}.`,
      link: '/owner/bookings',
    });
    toast.success(status === 'confirmed' ? 'Booking Confirmed' : 'Booking Rejected', '', 2000);
    load();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const counts = { all: bookings.length, pending: 0, confirmed: 0, cancelled: 0 };
  bookings.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++; });

  return (
    <>
      <Header />
      <div className="owner-page">
        <div className="owner-page__header">
          <div>
            <button className="back-btn" onClick={() => navigate('/owner/dashboard')} style={{marginBottom:8}}>← Dashboard</button>
            <h1>Manage Bookings</h1>
            <p>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="owner-filter-tabs">
          {FILTERS.map(f => (
            <button key={f} className={`owner-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="tab-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="owner-empty-state">
            <span>📋</span>
            <h3>No {filter !== 'all' ? filter : ''} bookings</h3>
            <p>{filter === 'pending' ? 'No bookings awaiting approval' : 'No bookings to show'}</p>
          </div>
        ) : (
          <div className="bookings-list">
            {filtered.map(b => {
              const hostel = hostels.find(h => h.id === b.hostelId);
              const isOpen = expanded === b.id;
              return (
                <div key={b.id} className="owner-booking-card">
                  <div className="owner-booking-card__main" onClick={() => setExpanded(isOpen ? null : b.id)}>
                    <div className="owner-booking-card__info">
                      <strong>{b.studentName || 'Student'}</strong>
                      <span>{hostel?.name || `Hostel #${b.hostelId}`}</span>
                    </div>
                    <div className="owner-booking-card__meta">
                      <span>{b.checkIn ? `${new Date(b.checkIn).toLocaleDateString('en-IN')} → ${new Date(b.checkOut).toLocaleDateString('en-IN')}` : 'Dates TBD'}</span>
                      <span className="owner-booking-card__amount">{b.totalAmount ? `₹${b.totalAmount.toLocaleString()}` : '—'}</span>
                    </div>
                    <span className={`status-badge status-${b.status}`}>{b.status}</span>
                    {b.status === 'pending' && (
                      <div className="owner-booking-card__actions" onClick={e => e.stopPropagation()}>
                        <button className="btn-approve" onClick={() => handleAction(b.id, 'confirmed', b)}>✓ Approve</button>
                        <button className="btn-reject" onClick={() => handleAction(b.id, 'cancelled', b)}>✗ Reject</button>
                      </div>
                    )}
                    <span className="expand-toggle">{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {isOpen && (
                    <div className="owner-booking-card__details">
                      <div className="booking-detail-grid">
                        <div><label>Room Type</label><span>{b.roomType || '—'}</span></div>
                        <div><label>Guests</label><span>{b.guests || 1}</span></div>
                        <div><label>Booked At</label><span>{b.bookedAt ? new Date(b.bookedAt).toLocaleString('en-IN') : '—'}</span></div>
                        <div><label>Payment</label><span>{b.paymentMethod || 'N/A'} {b.transactionId ? `· ${b.transactionId}` : ''}</span></div>
                        {b.requests && <div className="booking-detail-full"><label>Special Requests</label><span>{b.requests}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
