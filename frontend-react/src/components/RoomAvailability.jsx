import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

function AvailBar({ occupied, total }) {
  const available = total - occupied;
  const pct = total > 0 ? (available / total) * 100 : 0;
  const color = pct > 30 ? '#22c55e' : pct > 10 ? '#f59e0b' : '#ef4444';
  return (
    <div className="avail-bar">
      <div className="avail-bar__track">
        <div className="avail-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="avail-bar__label" style={{ color }}>
        {available} / {total} beds
      </span>
    </div>
  );
}

export default function RoomAvailability({ hostelId }) {
  const [roomTypes, setRoomTypes] = useState([]);

  useEffect(() => {
    const key = `roomTypes_${hostelId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { setRoomTypes(JSON.parse(stored)); return; } catch { /* fallback */ }
    }
    dataService.getRoomTypes(hostelId).then(rt => { if (rt?.length) setRoomTypes(rt); });
  }, [hostelId]);

  if (!roomTypes.length) return null;

  return (
    <div className="room-avail">
      <h2 className="room-avail__title">Room Availability</h2>
      <div className="room-avail__grid">
        {roomTypes.map(rt => {
          const available = rt.totalBeds - rt.occupiedBeds;
          const status = available === 0 ? 'full' : available <= 3 ? 'limited' : 'available';
          return (
            <div key={rt.id} className={`room-type-card room-type-card--${status}`}>
              <div className="room-type-card__header">
                <span className="room-type-card__label">{rt.label}</span>
                <span className={`room-status room-status--${status}`}>
                  {status === 'full' ? '🔴 Full' : status === 'limited' ? '🟡 Limited' : '🟢 Available'}
                </span>
              </div>
              <div className="room-type-card__price">
                ₹{rt.price.toLocaleString()}<span>/month</span>
              </div>
              <AvailBar occupied={rt.occupiedBeds} total={rt.totalBeds} />
            </div>
          );
        })}
      </div>
      <p className="room-avail__note">* Availability updates in real-time with bookings</p>
    </div>
  );
}
