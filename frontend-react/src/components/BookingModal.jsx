import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export default function BookingModal({ hostel, isOpen, onClose }) {
  const toast = useToast();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [duration, setDuration] = useState('-');
  const [totalAmount, setTotalAmount] = useState('-');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const months = (days / 30).toFixed(1);

      if (days > 0) {
        const total = Math.ceil((days / 30) * hostel.price);
        setDuration(`${days} days (~${months} months)`);
        setTotalAmount(`₹${total.toLocaleString()}`);
      } else {
        setDuration('Invalid dates');
        setTotalAmount('-');
      }
    }
  }, [checkIn, checkOut, hostel?.price]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total = Math.ceil((days / 30) * hostel.price);

    const booking = {
      id: Date.now(),
      hostelId: hostel.id,
      hostelName: hostel.name,
      checkIn,
      checkOut,
      roomType,
      specialRequests,
      totalAmount: total,
      status: 'pending',
      bookedAt: new Date().toISOString(),
    };

    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    toast.success(
      'Booking Confirmed!',
      `Total: ₹${total.toLocaleString()}. Check your dashboard for details.`,
      3000
    );

    onClose();
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  if (!isOpen || !hostel) return null;

  return (
    <div className="modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Book Your Stay</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="checkIn">Check-in Date</label>
            <input
              type="date"
              id="checkIn"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkOut">Check-out Date</label>
            <input
              type="date"
              id="checkOut"
              min={today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="roomType">Room Type</label>
            <select
              id="roomType"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              required
            >
              <option value="">Select room type</option>
              <option value="single">Single Room</option>
              <option value="double">Double Sharing</option>
              <option value="triple">Triple Sharing</option>
              <option value="quad">Quad Sharing</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="specialRequests">Special Requests (Optional)</label>
            <textarea
              id="specialRequests"
              rows="3"
              placeholder="Any special requirements..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            ></textarea>
          </div>
          <div className="booking-summary">
            <div className="summary-row">
              <span>Duration:</span>
              <span>{duration}</span>
            </div>
            <div className="summary-row">
              <span>Monthly Rate:</span>
              <span>₹{hostel.price.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>{totalAmount}</span>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
}
