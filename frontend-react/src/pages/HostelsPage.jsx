import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import hostels from '../data/hostels';

export default function HostelsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(15000);
  const [maxDistance, setMaxDistance] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setMaxPrice(15000);
    setMaxDistance('all');
    setSortBy('default');
    setSelectedAmenities([]);
  };

  const filtered = useMemo(() => {
    let result = hostels.filter((hostel) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        hostel.name.toLowerCase().includes(term) ||
        hostel.location.toLowerCase().includes(term) ||
        hostel.amenities.some((a) => a.toLowerCase().includes(term));
      const matchesPrice = hostel.price <= maxPrice;
      const matchesDistance =
        maxDistance === 'all' || hostel.distance <= parseFloat(maxDistance);
      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((amenity) => hostel.amenities.includes(amenity));
      return matchesSearch && matchesPrice && matchesDistance && matchesAmenities;
    });

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        result.sort((a, b) => a.distance - b.distance);
        break;
    }

    return result;
  }, [searchTerm, maxPrice, maxDistance, sortBy, selectedAmenities]);

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          <h2 className="page-title">Available Hostels</h2>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search hostels..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-filter">
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <span className="price-value">Up to ₹{maxPrice.toLocaleString()}</span>
              </div>
            </div>
            <div className="filter-group">
              <label>Distance</label>
              <select
                className="filter-select"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
              >
                <option value="all">All Distances</option>
                <option value="0.5">Within 0.5 km</option>
                <option value="1">Within 1 km</option>
                <option value="2">Within 2 km</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Amenities</label>
              <div className="amenity-filters">
                {['WiFi', 'AC', 'Gym', 'Mess'].map((amenity) => (
                  <label key={amenity} className="checkbox-label">
                    <input
                      type="checkbox"
                      className="amenity-checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />{' '}
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Sort By</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
              </select>
            </div>
            <button className="reset-filters" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>

          <div className="hostel-grid">
            {filtered.length === 0 ? (
              <p className="no-results">No hostels found</p>
            ) : (
              filtered.map((hostel) => (
                <div
                  key={hostel.id}
                  className="hostel-card"
                  onClick={() => navigate(`/hostel/${hostel.id}`)}
                >
                  <img src={hostel.image} alt={hostel.name} className="hostel-image" />
                  <div className="hostel-info">
                    <h3>{hostel.name}</h3>
                    <p className="location">📍 {hostel.location}</p>
                    <div className="amenities">
                      {hostel.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="tag">
                          {a}
                        </span>
                      ))}
                    </div>
                    <div className="hostel-footer">
                      <div className="price">₹{hostel.price.toLocaleString()}/mo</div>
                      <div className="rating">⭐ {hostel.rating}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
