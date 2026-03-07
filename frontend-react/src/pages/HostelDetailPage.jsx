import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BookingModal from "../components/BookingModal";
import { getAmenityIcon } from "../utils/helpers";
import { useToast } from "../context/ToastContext";
import { getHostel } from "../api/hostels";

export default function HostelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    async function loadHostel() {
      try {
        const data = await getHostel(id);
        setHostel(data);
      } catch (err) {
        console.error("Failed to load hostel", err);
      } finally {
        setLoading(false);
      }
    }

    loadHostel();
  }, [id]);

  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const isFavorite = hostel ? favorites.includes(hostel.id) : false;

  const toggleFavorite = () => {
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (favs.includes(hostel.id)) {
      favs = favs.filter((fav) => fav !== hostel.id);
      toast.info("Removed from favorites", hostel.name, 2000);
    } else {
      favs.push(hostel.id);
      toast.success("Added to favorites!", hostel.name, 2000);
    }
    localStorage.setItem("favorites", JSON.stringify(favs));
    setForceUpdate((n) => n + 1);
  };

  const contactHostel = () => {
    toast.info(
      `Contact ${hostel.name}`,
      `Phone: +91 98765 43210 | Email: ${hostel.name
        .toLowerCase()
        .replace(/\s+/g, "")}@havenly.com`,
      5000
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="container">
            <p>Loading hostel...</p>
          </div>
        </main>
      </>
    );
  }

  if (!hostel) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="container">
            <div
              className="detail-container"
              style={{ padding: 60, textAlign: "center" }}
            >
              <h2>Hostel not found</h2>
              <p>The hostel you&apos;re looking for doesn&apos;t exist.</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/hostels")}
              >
                Back to Hostels
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="main">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back to Hostels
          </button>

          <div className="detail-container">
            <div className="image-gallery">
              <img src={hostel.image} alt={hostel.name} className="main-image" />
              <button
                className={`favorite-btn ${isFavorite ? "active" : ""}`}
                onClick={toggleFavorite}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-title">
                  <h1>{hostel.name}</h1>
                  <p className="location">📍 {hostel.location}</p>
                </div>
                <div className="detail-actions">
                  <div className="price-box">
                    <div className="price">
                      ₹{hostel.price.toLocaleString()}
                    </div>
                    <div className="price-label">per month</div>
                  </div>
                  <div className="rating-box">
                    <span className="rating">⭐ {hostel.rating}</span>
                    <div className="rating-label">Rating</div>
                  </div>
                </div>
              </div>

              <div className="amenities-section">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {hostel.amenities.map((amenity) => (
                    <div key={amenity} className="amenity-item">
                      {getAmenityIcon(amenity)} {amenity}
                    </div>
                  ))}
                </div>
              </div>

              <div className="description-section">
                <h2>About This Hostel</h2>
                <p>{hostel.description}</p>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  Book Now
                </button>
                <button className="btn-secondary" onClick={contactHostel}>
                  Contact Hostel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BookingModal
        hostel={hostel}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
