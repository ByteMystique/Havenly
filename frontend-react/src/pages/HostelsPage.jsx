import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { dataService } from '../services/dataService';

const hostelTypes = ['All', 'Gents', 'Ladies', 'Mixed'];

// DB type → display type mapping
const typeDisplayMap = { boys: 'Gents', girls: 'Ladies', 'co-ed': 'Mixed' };

function getRatingLabel(rating) {
  if (rating >= 4.5) return 'Exceptional';
  if (rating >= 4.0) return 'Superb';
  if (rating >= 3.5) return 'Very Good';
  if (rating >= 3.0) return 'Good';
  return 'Pleasant';
}

function SafetyBadge({ score }) {
  if (score === null || score === undefined) return null;
  const lvl = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';
  return (
    <span className={`safety-badge safety-badge--${lvl}`}>
      🛡️ {score}/10
    </span>
  );
}

function TypeBadge({ type }) {
  const colors = { Gents: '#1a73e8', Ladies: '#e91e63', Mixed: '#7c4dff' };
  return (
    <span className="type-badge" style={{ background: colors[type] || '#666' }}>
      {type}
    </span>
  );
}

export default function HostelsPage() {
  const navigate = useNavigate();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(9000);
  const [maxDistance, setMaxDistance] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hostelType, setHostelType] = useState('All');
  const [minSafety, setMinSafety] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [compareIds, setCompareIds] = useState([]);

  // Load hostels from Supabase (or static in demo mode)
  useEffect(() => {
    dataService.getHostels().then(data => {
      // Normalise DB type (boys/girls/co-ed) → display (Gents/Ladies/Mixed)
      const normalised = data.map(h => ({
        ...h,
        hostelType: h.hostelType || typeDisplayMap[h.type] || h.type || 'Gents',
        amenities: h.amenities || [],
        safetyScore: h.safetyScore ?? h.safety_score ?? null,
        ratingCount: h.ratingCount ?? h.rating_count ?? 0,
        distance: h.distance ?? 0,
        price: h.price ?? 0,
      }));
      setHostels(normalised);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Derived amenity data
  const allAmenities = useMemo(() => [...new Set(hostels.flatMap(h => h.amenities))].sort(), [hostels]);
  const amenityCounts = useMemo(() => Object.fromEntries(
    allAmenities.map(a => [a, hostels.filter(h => h.amenities.includes(a)).length])
  ), [hostels, allAmenities]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleCompare = (e, id) => {
    e.stopPropagation();
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setMaxPrice(9000);
    setMaxDistance('all');
    setSortBy('default');
    setSelectedAmenities([]);
    setHostelType('All');
    setMinSafety(0);
    setMinRating(0);
  };

  const filtered = useMemo(() => {
    let result = hostels.filter((hostel) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        hostel.name.toLowerCase().includes(term) ||
        hostel.address.toLowerCase().includes(term) ||
        hostel.amenities.some((a) => a.toLowerCase().includes(term));
      const matchesPrice = !hostel.price || hostel.price <= maxPrice;
      const matchesDistance =
        maxDistance === 'all' || (hostel.distance && hostel.distance <= parseFloat(maxDistance));
      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((amenity) => hostel.amenities.includes(amenity));
      const matchesType =
        hostelType === 'All' || hostel.hostelType === hostelType;
      const matchesSafety =
        minSafety === 0 || (hostel.safetyScore !== null && hostel.safetyScore >= minSafety);
      const matchesRating =
        minRating === 0 || (hostel.rating !== null && hostel.rating >= minRating);
      return matchesSearch && matchesPrice && matchesDistance && matchesAmenities && matchesType && matchesSafety && matchesRating;
    });

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'distance':
        result.sort((a, b) => (a.distance || 99) - (b.distance || 99));
        break;
      case 'safety':
        result.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));
        break;
    }

    return result;
  }, [searchTerm, maxPrice, maxDistance, sortBy, selectedAmenities, hostelType, minSafety, minRating]);

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
                placeholder="Search hostels near CUSAT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="search-field search-field--select">
              <span className="search-icon">📍</span>
              <select value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)}>
                <option value="all">All Distances</option>
                <option value="0.5">Within 0.5 km</option>
                <option value="1">Within 1 km</option>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
              </select>
            </div>
            <div className="search-field search-field--select">
              <span className="search-icon">↕️</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="default">Sort: Our top picks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating (highest)</option>
                <option value="distance">Distance (nearest)</option>
                <option value="safety">Safety (highest)</option>
              </select>
            </div>
            <button className="search-btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>

        {/* Compare bar */}
        {compareIds.length > 0 && (
          <div className="compare-bar">
            <div className="compare-bar__inner">
              <span>{compareIds.length}/3 selected for comparison</span>
              <div className="compare-bar__actions">
                <button
                  className="btn-compare"
                  disabled={compareIds.length < 2}
                  onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}
                >
                  Compare Now
                </button>
                <button className="btn-compare-clear" onClick={() => setCompareIds([])}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="listing-layout">
          {/* Left sidebar — filters */}
          <aside className="filters-sidebar">
            <h3 className="sidebar-title">Filter by:</h3>

            {/* Hostel type */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Hostel type</h4>
              <div className="type-filters">
                {hostelTypes.map((type) => (
                  <button
                    key={type}
                    className={`type-filter-btn ${hostelType === type ? 'active' : ''}`}
                    onClick={() => setHostelType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price filter */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Your budget (per month)</h4>
              <div className="price-slider">
                <input
                  type="range" min="0" max="9000" step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <span className="price-label">
                  {maxPrice === 0 ? 'Free only' : `Up to ₹${maxPrice.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Safety filter */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Minimum safety score</h4>
              <div className="price-slider">
                <input
                  type="range" min="0" max="10" step="1"
                  value={minSafety}
                  onChange={(e) => setMinSafety(Number(e.target.value))}
                />
                <span className="price-label">
                  {minSafety === 0 ? 'Any' : `${minSafety}+ / 10`}
                </span>
              </div>
            </div>

            {/* Rating filter */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Minimum rating</h4>
              <div className="price-slider">
                <input
                  type="range" min="0" max="5" step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
                <span className="price-label">
                  {minRating === 0 ? 'Any' : `${minRating}+ ⭐`}
                </span>
              </div>
            </div>

            {/* Amenities */}
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Amenities</h4>
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
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >☰</button>
                <button
                  className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                  title="Map view"
                >🗺️</button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <div className="map-container">
                <iframe
                  title="Hostels near CUSAT"
                  width="100%"
                  height="500"
                  style={{ border: 0, borderRadius: 8 }}
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=76.2900%2C10.0350%2C76.3300%2C10.0650&layer=mapnik&marker=10.0494%2C76.3083"
                />
                <div className="map-results-mini">
                  {filtered.slice(0, 20).map((hostel) => (
                    <div
                      key={hostel.id}
                      className="map-mini-card"
                      onClick={() => navigate(`/hostel/${hostel.id}`)}
                    >
                      <strong>{hostel.name}</strong>
                      <span>{hostel.distance} km · ₹{hostel.price.toLocaleString()}/mo</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="no-results-card">
                <h3>No hostels match your filters</h3>
                <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
                <button className="btn-primary" onClick={resetFilters}>Reset all filters</button>
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
                      <TypeBadge type={hostel.hostelType} />
                    </div>
                    <div className="result-card__body">
                      <div className="result-card__main">
                        <h3 className="result-card__name">{hostel.name}</h3>
                        <p className="result-card__location">
                          📍 {hostel.address}
                          {hostel.distance && (
                            <span className="distance-tag"> · {hostel.distance} km from CUSAT</span>
                          )}
                        </p>
                        <div className="result-card__amenities">
                          {hostel.amenities.slice(0, 5).map((a) => (
                            <span key={a} className="amenity-tag">{a}</span>
                          ))}
                          {hostel.amenities.length > 5 && (
                            <span className="amenity-tag amenity-more">+{hostel.amenities.length - 5}</span>
                          )}
                        </div>
                        <div className="result-card__meta">
                          <SafetyBadge score={hostel.safetyScore} />
                          {hostel.ratingCount > 0 && (
                            <span className="review-count">{hostel.ratingCount} reviews</span>
                          )}
                        </div>
                      </div>
                      <div className="result-card__right">
                        {hostel.rating && (
                          <div className="rating-block">
                            <div className="rating-text">
                              <span className="rating-label">{getRatingLabel(hostel.rating)}</span>
                            </div>
                            <div className="rating-badge">{hostel.rating}</div>
                          </div>
                        )}
                        <div className="price-block">
                          {hostel.price > 0 ? (
                            <>
                              <span className="price-amount">₹{hostel.price.toLocaleString()}</span>
                              <span className="price-period">per month</span>
                            </>
                          ) : (
                            <span className="price-amount price-na">Contact for price</span>
                          )}
                        </div>
                        <div className="card-actions-row">
                          <button
                            className="availability-btn"
                            onClick={(e) => { e.stopPropagation(); navigate(`/hostel/${hostel.id}`); }}
                          >
                            See details
                          </button>
                          <label className="compare-check" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={compareIds.includes(hostel.id)}
                              onChange={(e) => toggleCompare(e, hostel.id)}
                            />
                            <span>Compare</span>
                          </label>
                        </div>
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
