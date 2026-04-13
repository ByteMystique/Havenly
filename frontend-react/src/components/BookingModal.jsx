import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import PaymentModal from './PaymentModal';

export default function BookingModal({ hostel, isOpen, onClose }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [duration, setDuration] = useState('-');
  const [totalAmount, setTotalAmount] = useState(0);
  const [roomTypes, setRoomTypes] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!hostel) return;
    dataService.getRoomTypes(hostel.id).then(rts => {
      if (rts?.length) setRoomTypes(rts);
    });
  }, [hostel]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
      if (days > 0) {
        const rate = hostel.price || 0;
        const total = Math.ceil((days / 30) * rate);
        setDuration(`${days} days (~${(days / 30).toFixed(1)} months)`);
        setTotalAmount(total);
      } else {
        setDuration('Invalid dates');
        setTotalAmount(0);
      }
    }
  }, [checkIn, checkOut, hostel?.price]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
    const total = Math.ceil((days / 30) * (hostel.price || 0));
    const selectedRoom = roomTypes.find(rt => rt.id === roomTypeId);
    const data = {
      hostelId: hostel.id,
      hostelName: hostel.name,
      checkIn,
      checkOut,
      roomType: selectedRoom?.label || roomType || 'Standard',
      roomTypeId,
      requests: specialRequests,
      totalAmount: total,
      studentName: dataService.getProfile()?.name || 'Student',
    };
    setFormData(data);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onClose();
  };

  if (!isOpen || !hostel) return null;

  if (showPayment) {
    return (
      <PaymentModal
        booking={formData}
        hostel={hostel}
        onClose={() => { setShowPayment(false); onClose(); }}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  const availableRooms = roomTypes.filter(rt => rt.totalBeds - rt.occupiedBeds > 0);

  return (
    <div className="modal active" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Book Your Stay</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>at {hostel.name}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="checkIn">Check-in Date</label>
            <input type="date" id="checkIn" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="checkOut">Check-out Date</label>
            <input type="date" id="checkOut" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="roomType">Room Type</label>
            <select
              id="roomType"
              value={roomTypeId}
              onChange={e => { setRoomTypeId(e.target.value); setRoomType(e.target.options[e.target.selectedIndex]?.text); }}
              required
            >
              <option value="">Select room type</option>
              {availableRooms.length > 0
                ? availableRooms.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.label} — ₹{rt.price?.toLocaleString()}/mo ({rt.totalBeds - rt.occupiedBeds} available)
                    </option>
                  ))
                : <>
                    <option value="single">Single Room</option>
                    <option value="double">Double Sharing</option>
                    <option value="triple">Triple Sharing</option>
                  </>
              }
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="specialRequests">Special Requests (Optional)</label>
            <textarea id="specialRequests" rows="3" placeholder="Any special requirements..." value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} />
          </div>
          <div className="booking-summary">
            <div className="summary-row"><span>Duration:</span><span>{duration}</span></div>
            <div className="summary-row"><span>Monthly Rate:</span><span>₹{hostel.price?.toLocaleString() || 'Contact'}</span></div>
            <div className="summary-row total"><span>Estimated Total:</span><span>{totalAmount > 0 ? `₹${totalAmount.toLocaleString()}` : '-'}</span></div>
          </div>
          <button type="submit" className="btn-primary">
            Proceed to Payment →
          </button>
        </form>
      </div>
    </div>
  );
}
