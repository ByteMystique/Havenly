import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import hostels from '../data/hostels';
import { getAmenityIcon } from '../utils/helpers';

const compareFields = [
  { key: 'hostelType', label: 'Type' },
  { key: 'distance', label: 'Distance from CUSAT', fmt: (v) => v ? `${v} km` : 'N/A' },
  { key: 'price', label: 'Monthly Rent', fmt: (v) => v ? `₹${v.toLocaleString()}` : 'Contact' },
  { key: 'rating', label: 'Rating', fmt: (v) => v ? `${v} / 5` : 'N/A' },
  { key: 'ratingCount', label: 'Reviews', fmt: (v) => v || 0 },
  { key: 'safetyScore', label: 'Safety Score', fmt: (v) => v !== null && v !== undefined ? `${v} / 10` : 'N/A' },
  { key: 'foodQuality', label: 'Food Quality', fmt: (v) => v !== null && v !== undefined ? `${v} / 10` : 'N/A' },
];

const amenityList = ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', 'Clean', '24/7 Access'];

export default function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selected = useMemo(() => {
    const ids = (searchParams.get('ids') || '').split(',').map(Number).filter(Boolean);
    return ids.map((id) => hostels.find((h) => h.id === id)).filter(Boolean);
  }, [searchParams]);

  if (selected.length < 2) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Select at least 2 hostels to compare</h2>
            <p style={{ color: 'var(--gray-500)', margin: '12px 0 24px' }}>
              Go back to the hostels page and use the compare checkboxes.
            </p>
            <button className="btn-primary" onClick={() => navigate('/hostels')}>
              Browse Hostels
            </button>
          </div>
        </main>
      </>
    );
  }

  function getBest(key, mode = 'high') {
    const vals = selected.map((h) => h[key]).filter((v) => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return mode === 'high' ? Math.max(...vals) : Math.min(...vals);
  }

  function cellClass(key, value) {
    if (value === null || value === undefined) return '';
    const lowBetter = ['distance', 'price'];
    const best = getBest(key, lowBetter.includes(key) ? 'low' : 'high');
    return value === best ? 'compare-best' : '';
  }

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="page-title">Compare Hostels</h1>

          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-label-col"></th>
                  {selected.map((h) => (
                    <th key={h.id} className="compare-hostel-col">
                      <img src={h.image} alt={h.name} className="compare-img" />
                      <h3
                        className="compare-name"
                        onClick={() => navigate(`/hostel/${h.id}`)}
                      >
                        {h.name}
                      </h3>
                      <p className="compare-addr">{h.address}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareFields.map(({ key, label, fmt }) => (
                  <tr key={key}>
                    <td className="compare-label">{label}</td>
                    {selected.map((h) => (
                      <td key={h.id} className={cellClass(key, h[key])}>
                        {fmt ? fmt(h[key]) : (h[key] ?? 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Amenities rows */}
                {amenityList.map((amenity) => {
                  const flag = amenity === '24/7 Access' ? 'open24x7'
                    : amenity.toLowerCase();
                  return (
                    <tr key={amenity}>
                      <td className="compare-label">{getAmenityIcon(amenity)} {amenity}</td>
                      {selected.map((h) => (
                        <td key={h.id} className={h[flag] ? 'compare-yes' : 'compare-no'}>
                          {h[flag] ? '✓' : '✗'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="compare-actions">
            <button className="btn-primary" onClick={() => navigate('/hostels')}>
              Back to All Hostels
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
