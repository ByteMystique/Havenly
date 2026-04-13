import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { dataService } from '../services/dataService';

const STEPS = ['Summary', 'Payment', 'Processing', 'Confirmed'];

const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak', 'PNB', 'Bank of Baroda'];

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

export default function PaymentModal({ booking, hostel, onClose, onSuccess }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('');
  const [txnId, setTxnId] = useState('');

  const handleProceed = async () => {
    // Validate
    if (method === 'card') {
      if (cardNum.replace(/\s/g, '').length < 16) { toast.error('Invalid card', 'Enter a 16-digit card number', 2000); return; }
      if (!expiry.match(/^\d{2}\/\d{2}$/)) { toast.error('Invalid expiry', 'Use MM/YY format', 2000); return; }
      if (cvv.length < 3) { toast.error('Invalid CVV', 'Enter a 3-digit CVV', 2000); return; }
      if (!cardName.trim()) { toast.error('Name required', 'Enter name on card', 2000); return; }
    } else if (method === 'upi') {
      if (!upiId.includes('@')) { toast.error('Invalid UPI ID', 'Enter a valid UPI ID (e.g. name@upi)', 2000); return; }
    } else if (method === 'netbanking') {
      if (!bank) { toast.error('Select bank', 'Please select your bank', 2000); return; }
    }

    setStep(2); // Processing
    try {
      await new Promise(r => setTimeout(r, 2200));
      const saved = await dataService.createBooking({
        ...booking,
        transactionId: dataService.generateTxnId(),
        paymentMethod: method,
      });
      const id = dataService.generateTxnId();
      setTxnId(id);
      setStep(3); // Confirmed
      addNotification({
        type: 'booking_submitted',
        title: 'Booking Submitted! ✅',
        message: `Your booking at ${hostel.name} is pending owner approval. Txn: ${id}`,
        link: '/dashboard',
      });
      onSuccess?.(saved);
    } catch (err) {
      toast.error('Payment failed', err.message, 3000);
      setStep(1);
    }
  };

  const nights = booking.checkIn && booking.checkOut
    ? Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)
    : 0;
  const months = (nights / 30).toFixed(1);
  const serviceFee = Math.round(booking.totalAmount * 0.02);
  const grandTotal = booking.totalAmount + serviceFee;

  if (!hostel) return null;

  return (
    <div className="modal active" onClick={e => e.target === e.currentTarget && step < 2 && onClose()}>
      <div className="payment-modal">
        {/* Step indicator */}
        <div className="payment-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`payment-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="payment-step__dot">{i < step ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* STEP 0 — Summary */}
        {step === 0 && (
          <div className="payment-body">
            <h2>Order Summary</h2>
            <div className="payment-hostel-row">
              <img src={hostel.image} alt={hostel.name} className="payment-hostel-img" />
              <div>
                <strong>{hostel.name}</strong>
                <p>{booking.roomType} · {nights} days (~{months} months)</p>
                <p>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="payment-breakdown">
              <div className="payment-row"><span>Monthly Rate</span><span>₹{hostel.price?.toLocaleString()}</span></div>
              <div className="payment-row"><span>Duration ({months} months)</span><span>₹{booking.totalAmount?.toLocaleString()}</span></div>
              <div className="payment-row"><span>Service Fee (2%)</span><span>₹{serviceFee.toLocaleString()}</span></div>
              <div className="payment-row payment-row--total"><span>Total</span><span>₹{grandTotal.toLocaleString()}</span></div>
            </div>
            <button className="btn-payment-primary" onClick={() => setStep(1)}>
              Proceed to Payment →
            </button>
            <button className="btn-payment-cancel" onClick={onClose}>Cancel</button>
          </div>
        )}

        {/* STEP 1 — Payment Method */}
        {step === 1 && (
          <div className="payment-body">
            <h2>Payment Details</h2>
            <div className="payment-total-banner">Total: ₹{grandTotal.toLocaleString()}</div>

            <div className="payment-method-tabs">
              {['card', 'upi', 'netbanking'].map(m => (
                <button key={m} className={`method-tab ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>
                  {m === 'card' ? '💳 Card' : m === 'upi' ? '📱 UPI' : '🏦 Net Banking'}
                </button>
              ))}
            </div>

            {method === 'card' && (
              <div className="card-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text" placeholder="4242 4242 4242 4242"
                    value={cardNum} onChange={e => setCardNum(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div className="card-form__row">
                  <div className="form-group">
                    <label>Expiry (MM/YY)</label>
                    <input
                      type="text" placeholder="12/26"
                      value={expiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                        setExpiry(v);
                      }}
                      maxLength={5}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password" placeholder="•••"
                      value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Name on Card</label>
                  <input type="text" placeholder="John Doe" value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>
                <p className="payment-demo-note">🔒 Secure payment processing</p>
              </div>
            )}

            {method === 'upi' && (
              <div className="form-group">
                <label>UPI ID</label>
                <input type="text" placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                <p className="payment-demo-note">Enter your registered UPI ID</p>
              </div>
            )}

            {method === 'netbanking' && (
              <div className="form-group">
                <label>Select Bank</label>
                <select value={bank} onChange={e => setBank(e.target.value)}>
                  <option value="">Choose your bank</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <p className="payment-demo-note">You will be redirected to your bank</p>
              </div>
            )}

            <button className="btn-payment-primary" onClick={handleProceed}>
              Pay ₹{grandTotal.toLocaleString()} →
            </button>
            <button className="btn-payment-cancel" onClick={() => setStep(0)}>← Back</button>
          </div>
        )}

        {/* STEP 2 — Processing */}
        {step === 2 && (
          <div className="payment-body payment-processing">
            <div className="processing-spinner" />
            <h2>Processing Payment...</h2>
            <p className="processing-amount">₹{grandTotal.toLocaleString()}</p>
            <p className="processing-msg">Please wait, do not close this window</p>
          </div>
        )}

        {/* STEP 3 — Confirmed */}
        {step === 3 && (
          <div className="payment-body payment-success">
            <div className="success-check">✓</div>
            <h2>Booking Submitted!</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Your booking is pending approval by the hostel owner.</p>
            <p className="success-txn">Transaction ID: {txnId}</p>
            <div className="success-summary">
              <div className="payment-row"><span>Hostel</span><span>{hostel.name}</span></div>
              <div className="payment-row"><span>Check-in</span><span>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              <div className="payment-row"><span>Check-out</span><span>{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              <div className="payment-row payment-row--total"><span>Amount Paid</span><span>₹{grandTotal.toLocaleString()}</span></div>
            </div>
            <button className="btn-payment-primary" onClick={() => { onClose(); navigate('/dashboard'); }}>
              View Booking →
            </button>
            <button className="btn-payment-cancel" onClick={() => { onClose(); navigate('/hostels'); }}>
              Back to Hostels
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
