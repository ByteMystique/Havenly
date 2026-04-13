import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year', 'PhD'];
const AMENITIES = ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', '24/7 Access'];

function AvatarCircle({ name, size = 80, avatar }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#0057b7', '#7c4dff', '#00897b', '#e64a19', '#5c6bc0'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  if (avatar) return <img src={avatar} alt={name} className="profile-avatar-img" style={{ width: size, height: size }} />;
  return (
    <div className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: color }}>
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { displayName, userEmail, userRole } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Preferences
  const [prefType, setPrefType] = useState('All');
  const [maxBudget, setMaxBudget] = useState(6000);
  const [maxDist, setMaxDist] = useState(5);
  const [reqAmenities, setReqAmenities] = useState([]);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    const p = dataService.getProfile();
    setProfile(p);
    setName(p.name || '');
    setPhone(p.phone || '');
    setUniversity(p.university || 'CUSAT');
    setYearOfStudy(p.yearOfStudy || '');
    setBio(p.bio || '');
    setAvatar(p.avatar || null);
    if (p.preferences) {
      setPrefType(p.preferences.hostelType || 'All');
      setMaxBudget(p.preferences.maxBudget || 6000);
      setMaxDist(p.preferences.maxDistance || 5);
      setReqAmenities(p.preferences.requiredAmenities || []);
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      dataService.updateProfile({ name, phone, university, yearOfStudy, bio, avatar });
      toast.success('Profile saved!', 'Your changes have been applied', 2000);
    } catch { toast.error('Error', 'Could not save profile', 2000); }
    setSaving(false);
  };

  const savePreferences = (e) => {
    e.preventDefault();
    dataService.updateProfile({ preferences: { hostelType: prefType, maxBudget, maxDistance: maxDist, requiredAmenities: reqAmenities } });
    toast.success('Preferences saved!', '', 2000);
  };

  const toggleAmenity = (a) =>
    setReqAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handlePwChange = (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Mismatch', "Passwords don't match", 2000); return; }
    if (newPw.length < 6) { toast.error('Too short', 'Min 6 characters', 2000); return; }
    toast.success('Password changed!', 'Demo mode — not persisted', 2000);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const exportData = () => {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const blob = new Blob([JSON.stringify({ profile: dataService.getProfile(), bookings, reviews }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'havenly-data.json'; a.click();
  };

  if (!profile) return null;

  return (
    <div className="profile-page">
      <div className="profile-layout">

        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar-card">
            <div className="profile-avatar-wrap">
              <AvatarCircle name={name || displayName} size={90} avatar={avatar} />
              <label className="avatar-upload-btn" htmlFor="avatar-input">📷 Change</label>
              <input id="avatar-input" type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>
            <h2 className="profile-sidebar-name">{name || displayName}</h2>
            <p className="profile-sidebar-email">{userEmail}</p>
            <span className={`profile-role-badge profile-role-badge--${userRole}`}>
              {userRole === 'owner' ? '🏠 Hostel Owner' : '🎓 Student'}
            </span>
            {profile.createdAt && (
              <p className="profile-joined">
                Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <nav className="profile-nav">
            {['profile', 'preferences', 'account'].map(t => (
              <button key={t} className={`profile-nav-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'profile' ? '👤 Profile' : t === 'preferences' ? '⚙️ Preferences' : '🔒 Account'}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="profile-main">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form className="profile-form" onSubmit={saveProfile}>
              <h2>Edit Profile</h2>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label>University / College</label>
                  <input type="text" value={university} onChange={e => setUniversity(e.target.value)} placeholder="CUSAT" />
                </div>
                {userRole === 'student' && (
                  <div className="form-group">
                    <label>Year of Study</label>
                    <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                      <option value="">Select year</option>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group form-group--full">
                  <label>Bio / About</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="A little about yourself..." maxLength={300} />
                  <span className="review-char-count">{bio.length}/300</span>
                </div>
              </div>
              <button type="submit" className="btn-save-profile" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form className="profile-form" onSubmit={savePreferences}>
              <h2>Hostel Preferences</h2>
              <p className="profile-pref-note">These preferences pre-fill the AI chat and filter sidebar.</p>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label>Preferred Hostel Type</label>
                  <select value={prefType} onChange={e => setPrefType(e.target.value)}>
                    {['All', 'Gents', 'Ladies', 'Mixed'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Distance from CUSAT: <strong>{maxDist} km</strong></label>
                  <input type="range" min={0.5} max={10} step={0.5} value={maxDist} onChange={e => setMaxDist(parseFloat(e.target.value))} />
                </div>
                <div className="form-group form-group--full">
                  <label>Max Budget: <strong>₹{maxBudget.toLocaleString()}/month</strong></label>
                  <input type="range" min={1000} max={15000} step={500} value={maxBudget} onChange={e => setMaxBudget(parseInt(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                    <span>₹1,000</span><span>₹15,000</span>
                  </div>
                </div>
                <div className="form-group form-group--full">
                  <label>Required Amenities</label>
                  <div className="pref-amenities-grid">
                    {AMENITIES.map(a => (
                      <label key={a} className="pref-amenity-check">
                        <input type="checkbox" checked={reqAmenities.includes(a)} onChange={() => toggleAmenity(a)} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-save-profile">Save Preferences</button>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="profile-form">
              <h2>Account Settings</h2>

              <form className="account-section" onSubmit={handlePwChange}>
                <h3>Change Password</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" minLength={6} />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn-save-profile">Update Password</button>
              </form>

              <div className="account-section account-section--danger">
                <h3>Data & Privacy</h3>
                <button className="btn-export" onClick={exportData}>📥 Export My Data</button>
                <button className="btn-delete-account" onClick={() => window.confirm('This will delete all your data. This cannot be undone.') && toast.info('Demo mode', 'Account deletion not available in demo', 3000)}>
                  🗑 Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
