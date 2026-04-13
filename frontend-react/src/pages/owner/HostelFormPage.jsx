import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';

const AMENITY_FIELDS = [
  { key: 'wifi', label: 'WiFi' }, { key: 'food', label: 'Food/Mess' },
  { key: 'ac', label: 'AC' }, { key: 'parking', label: 'Parking' },
  { key: 'laundry', label: 'Laundry' }, { key: 'cctv', label: 'CCTV' },
  { key: 'clean', label: 'Housekeeping' }, { key: 'open24x7', label: '24/7 Access' },
];

const defaultRoom = () => ({ id: `rt_${Date.now()}`, type: 'double', label: 'Double Sharing', price: '', totalBeds: '', occupiedBeds: 0 });

export default function HostelFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', hostelType: 'Gents', description: '', price: '',
    distance: '', latitude: '', longitude: '', safetyScore: 7, foodQuality: 6,
    image: '', amenities: [],
    wifi: false, food: false, ac: false, parking: false, laundry: false, cctv: false, clean: false, open24x7: false,
  });
  const [roomTypes, setRoomTypes] = useState([defaultRoom()]);
  const [amenityList, setAmenityList] = useState([]);

  useEffect(() => {
    if (!isEdit) return;
    dataService.getHostel(id).then(h => {
      if (!h) { navigate('/owner/hostels'); return; }
      const keys = AMENITY_FIELDS.reduce((acc, { key }) => ({ ...acc, [key]: !!h[key] }), {});
      setForm({
        name: h.name || '', address: h.address || '',
        hostelType: h.hostelType || 'Gents', description: h.description || '',
        price: h.price || '', distance: h.distance || '',
        latitude: h.latitude || '', longitude: h.longitude || '',
        safetyScore: h.safetyScore || 7, foodQuality: h.foodQuality || 6,
        image: h.image || '', amenities: h.amenities || [],
        ...keys,
      });
      setRoomTypes(h.roomTypes?.length ? h.roomTypes : [defaultRoom()]);
    });
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (key) => setForm(f => ({ ...f, [key]: !f[key] }));

  const addRoom = () => setRoomTypes(r => [...r, defaultRoom()]);
  const removeRoom = (idx) => setRoomTypes(r => r.filter((_, i) => i !== idx));
  const updateRoom = (idx, k, v) => setRoomTypes(r => r.map((rt, i) => i === idx ? { ...rt, [k]: v } : rt));

  const validate = () => {
    if (!form.name.trim()) return 'Hostel name is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.price) return 'Price is required';
    if (form.safetyScore < 1 || form.safetyScore > 10) return 'Safety score must be 1-10';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error('Validation Error', err, 2500); return; }
    setSaving(true);
    try {
      const builtAmenities = AMENITY_FIELDS.filter(({ key }) => form[key]).map(({ label }) => label);
      const payload = {
        ...form,
        price: parseInt(form.price) || 0,
        distance: parseFloat(form.distance) || 0,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        safetyScore: parseFloat(form.safetyScore),
        foodQuality: parseFloat(form.foodQuality),
        amenities: builtAmenities,
        roomTypes: roomTypes.map(rt => ({
          ...rt, price: parseInt(rt.price) || 0, totalBeds: parseInt(rt.totalBeds) || 0,
          occupiedBeds: parseInt(rt.occupiedBeds) || 0,
        })),
        ratingCount: 0,
        location: form.address.split(',').pop()?.trim() || 'Near CUSAT',
      };
      if (isEdit) {
        await dataService.updateHostel(id, payload);
        toast.success('Updated!', 'Hostel listing updated', 2000);
      } else {
        await dataService.createHostel(payload);
        toast.success('Created!', 'Your hostel is now live', 2000);
      }
      navigate('/owner/hostels');
    } catch (err) {
      toast.error('Error', err.message, 3000);
    }
    setSaving(false);
  };

  return (
    <div className="owner-page">
      <div className="owner-page__header">
        <div>
          <h1>{isEdit ? 'Edit Hostel' : 'Add New Hostel'}</h1>
          <p>Fill in the details below. All fields marked * are required.</p>
        </div>
        <button className="btn-back-owner" onClick={() => navigate('/owner/hostels')}>← Back</button>
      </div>

      <form className="hostel-form" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-section">
          <h3>📋 Basic Information</h3>
          <div className="form-grid-2">
            <div className="form-group form-group--full">
              <label>Hostel Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sahrudaya Boys Hostel" required />
            </div>
            <div className="form-group form-group--full">
              <label>Address *</label>
              <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address near CUSAT" required />
            </div>
            <div className="form-group">
              <label>Hostel Type *</label>
              <select value={form.hostelType} onChange={e => set('hostelType', e.target.value)}>
                <option>Gents</option><option>Ladies</option><option>Mixed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monthly Rent (₹) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 4500" min={0} required />
            </div>
            <div className="form-group form-group--full">
              <label>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe your hostel, nearby landmarks, unique features..." />
            </div>
            <div className="form-group form-group--full">
              <label>Main Image URL</label>
              <input type="url" value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://images.unsplash.com/..." />
              {form.image && <img src={form.image} alt="preview" className="form-img-preview" />}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h3>📍 Location</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Distance from CUSAT (km)</label>
              <input type="number" step="0.1" value={form.distance} onChange={e => set('distance', e.target.value)} placeholder="e.g. 1.5" min={0} />
            </div>
            <div className="form-group" />
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="e.g. 10.0430" />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="e.g. 76.3210" />
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="form-section">
          <h3>📊 Quality Scores</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Safety Score: <strong>{form.safetyScore}/10</strong></label>
              <input type="range" min={1} max={10} step={0.5} value={form.safetyScore} onChange={e => set('safetyScore', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Food Quality: <strong>{form.foodQuality}/10</strong></label>
              <input type="range" min={1} max={10} step={0.5} value={form.foodQuality} onChange={e => set('foodQuality', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="form-section">
          <h3>✅ Amenities</h3>
          <div className="amenity-checkbox-grid">
            {AMENITY_FIELDS.map(({ key, label }) => (
              <label key={key} className="amenity-check-label">
                <input type="checkbox" checked={!!form[key]} onChange={() => toggleAmenity(key)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Room Types */}
        <div className="form-section">
          <div className="form-section__header">
            <h3>🛏 Room Types</h3>
            <button type="button" className="btn-add-room" onClick={addRoom}>+ Add Room Type</button>
          </div>
          {roomTypes.map((rt, i) => (
            <div key={rt.id} className="room-type-form-row">
              <div className="form-group"><label>Label</label>
                <input value={rt.label} onChange={e => updateRoom(i, 'label', e.target.value)} placeholder="e.g. Double Sharing" />
              </div>
              <div className="form-group"><label>Price (₹/mo)</label>
                <input type="number" value={rt.price} onChange={e => updateRoom(i, 'price', e.target.value)} placeholder="3500" />
              </div>
              <div className="form-group"><label>Total Beds</label>
                <input type="number" value={rt.totalBeds} onChange={e => updateRoom(i, 'totalBeds', e.target.value)} placeholder="20" />
              </div>
              <div className="form-group"><label>Occupied</label>
                <input type="number" value={rt.occupiedBeds} onChange={e => updateRoom(i, 'occupiedBeds', e.target.value)} placeholder="0" />
              </div>
              {roomTypes.length > 1 && (
                <button type="button" className="btn-remove-room" onClick={() => removeRoom(i)}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="form-submit-row">
          <button type="submit" className="btn-save-profile" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Hostel' : 'Publish Hostel'}
          </button>
          <button type="button" className="btn-cancel-review" onClick={() => navigate('/owner/hostels')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
