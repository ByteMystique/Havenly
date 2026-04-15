import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';

export default function OwnerHostelsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [hostels, setHostels] = useState([]);

  const load = () => dataService.getMyHostels().then(setHostels);
  useEffect(() => { load(); }, []);

  const handleToggle = async (id, current) => {
    await dataService.updateHostel(id, { status: current === 'active' ? 'inactive' : 'active' });
    toast.success('Updated', 'Hostel status changed', 1500);
    load();
  };

  const handleDelete = async (id, name) => {
    await dataService.deleteHostel(id);
    toast.success('Deleted', `${name} removed`, 2000);
    load();
  };

  return (
    <>
      <Header />
      <div className="owner-page">
        <div className="owner-page__header">
          <div>
            <button className="back-btn" onClick={() => navigate('/owner/dashboard')} style={{marginBottom:8}}>← Dashboard</button>
            <h1>My Hostels</h1>
            <p>{hostels.length} listing{hostels.length !== 1 ? 's' : ''}</p>
          </div>
        <button className="btn-add-hostel" onClick={() => navigate('/owner/hostels/new')}>+ Add Hostel</button>
      </div>

      {hostels.length === 0 ? (
        <div className="owner-empty-state">
          <span>🏠</span>
          <h3>No hostels yet</h3>
          <p>Add your first hostel listing to start receiving bookings</p>
          <button className="btn-add-hostel" onClick={() => navigate('/owner/hostels/new')}>Add Your First Hostel</button>
        </div>
      ) : (
        <div className="owner-hostels-grid">
          {hostels.map(h => (
            <div key={h.id} className={`owner-hostel-card ${h.status !== 'active' ? 'owner-hostel-card--inactive' : ''}`}>
              <div className="owner-hostel-card__img">
                <img src={h.image || h.images?.[0]} alt={h.name} />
                <span className={`owner-hostel-status ${h.status}`}>
                  {h.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              <div className="owner-hostel-card__body">
                <h3>{h.name}</h3>
                <p className="owner-hostel-card__type">{h.hostelType} · ₹{h.price?.toLocaleString() || 'N/A'}/mo</p>
                <p className="owner-hostel-card__addr">📍 {h.address}</p>
                <div className="owner-hostel-card__meta">
                  <span>⭐ {h.rating || 0}</span>
                  <span>📏 {h.distance || '?'} km</span>
                </div>
                <div className="owner-hostel-card__actions">
                  <button className="btn-edit" onClick={() => navigate(`/owner/hostels/${h.id}/edit`)}>✏️ Edit</button>
                  <button
                    className={`btn-toggle ${h.status === 'active' ? 'btn-toggle--on' : 'btn-toggle--off'}`}
                    onClick={() => handleToggle(h.id, h.status)}
                  >
                    {h.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button className="btn-delete-hostel" onClick={() => handleDelete(h.id, h.name)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
