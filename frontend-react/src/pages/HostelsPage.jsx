import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getHostels } from "../api/hostels";

// Derive unique amenities from actual hostel data
const allAmenities = [...new Set(hostels.flatMap((h) => h.amenities))].sort();

// Count how many hostels have each amenity
const amenityCounts = Object.fromEntries(
  allAmenities.map((a) => [a, hostels.filter((h) => h.amenities.includes(a)).length])
);

function getRatingLabel(rating) {
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Superb';
  if (rating >= 3.5) return 'Very Good';
  return 'Good';
}

export default function HostelsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(15000);
  const [maxDistance, setMaxDistance] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

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


  useEffect(() => {
  async function loadHostels() {
    try {
      const res = await getHostels()
      setHostels(res.data)
    } catch (err) {
      console.error("Failed to load hostels", err)
    } finally {
      setLoading(false)
    }
  }

  loadHostels()
  }, [])

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
  }, [hostels, searchTerm, maxPrice, maxDistance, sortBy, selectedAmenities]);


  if (loading) {
  return <div>Loading hostels...</div>
  }


  return (
    <>
      <Header />
      <main className="listing-page">
        {/* Search bar */}
        <div className="search-bar-wrapper">
          <div className="search-bar">
            <div className="search-field">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name, location or amenity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="search-field search-field--select">
              <span className="search-icon">📍</span>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
              >
                <option value="all">All Distances</option>
                <option value="0.5">Within 0.5 km</option>
                <option value="1">Within 1 km</option>
                <option value="2">Within 2 km</option>
              </select>
            </div>
            <div className="search-field search-field--select">
              <span className="search-icon">↕️</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Sort: Our top picks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating (highest)</option>
                <option value="distance">Distance (nearest)</option>
              </select>
            </div>
            <button className="search-btn" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>

        <div className="listing-layout">
          {/* Left sidebar — filters */}
          <aside className="filters-sidebar">
            <h3 className="sidebar-title">Filter by:</h3>

            {/* Price filter */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Your budget (per month)</h4>
              <div className="price-slider">
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <span className="price-label">Up to ₹{maxPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Popular filters (amenities) */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Popular filters</h4>
              <div className="sidebar-checks">
                {allAmenities.map((amenity) => (
                  <label key={amenity} className="sidebar-check">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    <span className="check-name">{amenity}</span>
                    <span className="check-count">{amenityCounts[amenity]}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content — results */}
          <section className="results-area">
            <div className="results-header">
              <h2>
                Near CUSAT: <strong>{filtered.length} {filtered.length === 1 ? 'property' : 'properties'} found</strong>
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div className="no-results-card">
                <h3>No hostels match your filters</h3>
                <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
                <button className="btn-primary" onClick={resetFilters}>
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="results-list">
                {filtered.map((hostel) => (
                  <article
                    key={hostel.id}
                    className="result-card"
                    onClick={() => navigate(`/hostel/${hostel.id}`)}
                  >
                    <div className="result-card__image">
                      <img src={hostel.image} alt={hostel.name} loading="lazy" />
                    </div>
                    <div className="result-card__body">
                      <div className="result-card__main">
                        <h3 className="result-card__name">{hostel.name}</h3>
                        <p className="result-card__location">
                          <span className="loc-link">📍 {hostel.location}</span>
                        </p>
                        <div className="result-card__amenities">
                          {hostel.amenities.map((a) => (
                            <span key={a} className="amenity-tag">{a}</span>
                          ))}
                        </div>
                        <p className="result-card__desc">
                          {hostel.description.length > 150
                            ? hostel.description.slice(0, 150) + '...'
                            : hostel.description}
                        </p>
                      </div>
                      <div className="result-card__right">
                        <div className="rating-block">
                          <div className="rating-text">
                            <span className="rating-label">{getRatingLabel(hostel.rating)}</span>
                          </div>
                          <div className="rating-badge">{hostel.rating}</div>
                        </div>
                        <div className="price-block">
                          <span className="price-amount">₹{hostel.price.toLocaleString()}</span>
                          <span className="price-period">per month</span>
                        </div>
                        <button
                          className="availability-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/hostel/${hostel.id}`);
                          }}
                        >
                          See availability
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
