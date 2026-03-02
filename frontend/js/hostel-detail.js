// Hostel data (same as in hostels.js)
const hostels = [
    {
        id: 1,
        name: 'Campus View Hostel',
        location: '0.5 km from campus',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        amenities: ['WiFi', 'Mess', 'AC', 'Laundry', 'Study Room', 'Parking'],
        rating: 4.5,
        description: 'Campus View Hostel offers premium accommodation for students with modern amenities and excellent connectivity to the campus. Our facility includes spacious rooms, high-speed WiFi, nutritious meals, and a conducive environment for academic excellence.'
    },
    {
        id: 2,
        name: 'Green Valley Residence',
        location: '1.2 km from campus',
        price: 6500,
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        amenities: ['WiFi', 'Mess', 'Gym', 'Common Room', 'Security'],
        rating: 4.2,
        description: 'Green Valley Residence provides comfortable living spaces in a peaceful environment. With well-maintained facilities and a focus on student welfare, we ensure a home away from home experience for all our residents.'
    },
    {
        id: 3,
        name: 'Elite Student Housing',
        location: '0.8 km from campus',
        price: 10000,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        amenities: ['WiFi', 'Mess', 'AC', 'Gym', 'Swimming Pool', 'Library'],
        rating: 4.8,
        description: 'Elite Student Housing sets the standard for premium student accommodation. Our state-of-the-art facilities include air-conditioned rooms, a modern gym, swimming pool, and dedicated study areas to support your academic journey.'
    },
    {
        id: 4,
        name: 'Budget Stay Hostel',
        location: '2.0 km from campus',
        price: 5000,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        amenities: ['WiFi', 'Mess', 'Common Area', 'Security'],
        rating: 3.9,
        description: 'Budget Stay Hostel offers affordable accommodation without compromising on essential amenities. Perfect for students looking for cost-effective housing with reliable facilities and a friendly community atmosphere.'
    },
    {
        id: 5,
        name: 'Premium Scholars Den',
        location: '1.5 km from campus',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        amenities: ['WiFi', 'Mess', 'AC', 'Gym', 'Pool', 'Spa', 'Cafe', 'Gaming Room'],
        rating: 4.9,
        description: 'Premium Scholars Den is the ultimate luxury student residence featuring world-class amenities including a spa, gaming room, café, and more. Experience unparalleled comfort and convenience in our premium accommodation.'
    },
    {
        id: 6,
        name: 'Comfort Inn Lodge',
        location: '0.3 km from campus',
        price: 7500,
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
        amenities: ['WiFi', 'Mess', 'Laundry', 'Study Hall', 'Parking'],
        rating: 4.3,
        description: 'Comfort Inn Lodge provides a perfect balance of comfort and convenience. Located closest to campus, our hostel offers well-furnished rooms, quality meals, and a supportive environment for academic success.'
    }
];

// Get hostel ID from URL
const urlParams = new URLSearchParams(window.location.search);
const hostelId = parseInt(urlParams.get('id'));
const hostel = hostels.find(h => h.id === hostelId);

// Render hostel details
function renderHostelDetail() {
    if (!hostel) {
        document.getElementById('hostelDetail').innerHTML = `
            <div style="padding: 60px; text-align: center;">
                <h2>Hostel not found</h2>
                <p>The hostel you're looking for doesn't exist.</p>
                <button class="btn-primary" onclick="window.location.href='hostels.html'">
                    Back to Hostels
                </button>
            </div>
        `;
        return;
    }

    // Check if hostel is in favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.includes(hostel.id);

    document.getElementById('hostelDetail').innerHTML = `
        <div class="image-gallery">
            <img src="${hostel.image}" alt="${hostel.name}" class="main-image">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${hostel.id})">
                ${isFavorite ? '❤️' : '🤍'}
            </button>
        </div>

        <div class="detail-content">
            <div class="detail-header">
                <div class="detail-title">
                    <h1>${hostel.name}</h1>
                    <p class="location">📍 ${hostel.location}</p>
                </div>
                <div class="detail-actions">
                    <div class="price-box">
                        <div class="price">₹${hostel.price.toLocaleString()}</div>
                        <div class="price-label">per month</div>
                    </div>
                    <div class="rating-box">
                        <span class="rating">⭐ ${hostel.rating}</span>
                        <div class="rating-label">Rating</div>
                    </div>
                </div>
            </div>

            <div class="amenities-section">
                <h2>Amenities</h2>
                <div class="amenities-grid">
                    ${hostel.amenities.map(amenity => `
                        <div class="amenity-item">
                            ${getAmenityIcon(amenity)} ${amenity}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="description-section">
                <h2>About This Hostel</h2>
                <p>${hostel.description}</p>
            </div>

            <div class="action-buttons">
                <button class="btn-primary" onclick="openBookingModal()">
                    Book Now
                </button>
                <button class="btn-secondary" onclick="contactHostel()">
                    Contact Hostel
                </button>
            </div>
        </div>
    `;
}

// Get icon for amenity
function getAmenityIcon(amenity) {
    const icons = {
        'WiFi': '📶',
        'Mess': '🍽️',
        'AC': '❄️',
        'Gym': '💪',
        'Pool': '🏊',
        'Swimming Pool': '🏊',
        'Laundry': '🧺',
        'Study Room': '📚',
        'Study Hall': '📚',
        'Library': '📖',
        'Parking': '🚗',
        'Security': '🔒',
        'Common Room': '🛋️',
        'Common Area': '🛋️',
        'Spa': '💆',
        'Cafe': '☕',
        'Gaming Room': '🎮'
    };
    return icons[amenity] || '✓';
}

// Toggle favorite
function toggleFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.includes(id);

    if (isFavorite) {
        favorites = favorites.filter(fav => fav !== id);
        if (typeof toast !== 'undefined') {
            toast.info('Removed from favorites', hostel.name, 2000);
        }
    } else {
        favorites.push(id);
        if (typeof toast !== 'undefined') {
            toast.success('Added to favorites!', hostel.name, 2000);
        }
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderHostelDetail(); // Re-render to update heart icon
}

// Open booking modal
function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.add('active');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkIn').min = today;
    document.getElementById('checkOut').min = today;

    // Update monthly rate
    document.getElementById('monthlyRate').textContent = `₹${hostel.price.toLocaleString()}`;
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('active');
}

// Calculate booking duration and total
function calculateBooking() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;

    if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const months = (days / 30).toFixed(1);

        if (days > 0) {
            const total = Math.ceil((days / 30) * hostel.price);
            document.getElementById('duration').textContent = `${days} days (~${months} months)`;
            document.getElementById('totalAmount').textContent = `₹${total.toLocaleString()}`;
        } else {
            document.getElementById('duration').textContent = 'Invalid dates';
            document.getElementById('totalAmount').textContent = '-';
        }
    }
}

// Handle booking submission
function handleBooking(event) {
    event.preventDefault();

    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const roomType = document.getElementById('roomType').value;
    const specialRequests = document.getElementById('specialRequests').value;

    // Calculate total
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total = Math.ceil((days / 30) * hostel.price);

    // Create booking object
    const booking = {
        id: Date.now(),
        hostelId: hostel.id,
        hostelName: hostel.name,
        checkIn,
        checkOut,
        roomType,
        specialRequests,
        totalAmount: total,
        status: 'pending',
        bookedAt: new Date().toISOString()
    };

    // Save to localStorage
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    // Show success toast
    if (typeof toast !== 'undefined') {
        toast.success(
            'Booking Confirmed!',
            `Total: ₹${total.toLocaleString()}. Check your dashboard for details.`,
            3000
        );
    }

    // Close modal and redirect
    closeBookingModal();
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// Contact hostel
function contactHostel() {
    if (typeof toast !== 'undefined') {
        toast.info(
            `Contact ${hostel.name}`,
            `Phone: +91 98765 43210 | Email: ${hostel.name.toLowerCase().replace(/\s+/g, '')}@havenly.com`,
            5000
        );
    } else {
        alert(`Contact ${hostel.name}\n\nPhone: +91 98765 43210\nEmail: ${hostel.name.toLowerCase().replace(/\s+/g, '')}@havenly.com`);
    }
}

// Event listeners
document.getElementById('checkIn').addEventListener('change', calculateBooking);
document.getElementById('checkOut').addEventListener('change', calculateBooking);

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
        closeBookingModal();
    }
}

// Initial render
renderHostelDetail();
