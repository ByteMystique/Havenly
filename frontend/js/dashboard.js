// Hostel data (same as in other files)
const hostels = [
    {
        id: 1,
        name: 'Campus View Hostel',
        location: '0.5 km from campus',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
        amenities: ['WiFi', 'Mess', 'AC', 'Laundry', 'Study Room', 'Parking'],
        rating: 4.5
    },
    {
        id: 2,
        name: 'Green Valley Residence',
        location: '1.2 km from campus',
        price: 6500,
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
        amenities: ['WiFi', 'Mess', 'Gym', 'Common Room', 'Security'],
        rating: 4.2
    },
    {
        id: 3,
        name: 'Elite Student Housing',
        location: '0.8 km from campus',
        price: 10000,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
        amenities: ['WiFi', 'Mess', 'AC', 'Gym', 'Swimming Pool', 'Library'],
        rating: 4.8
    },
    {
        id: 4,
        name: 'Budget Stay Hostel',
        location: '2.0 km from campus',
        price: 5000,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
        amenities: ['WiFi', 'Mess', 'Common Area', 'Security'],
        rating: 3.9
    },
    {
        id: 5,
        name: 'Premium Scholars Den',
        location: '1.5 km from campus',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        amenities: ['WiFi', 'Mess', 'AC', 'Gym', 'Pool', 'Spa', 'Cafe', 'Gaming Room'],
        rating: 4.9
    },
    {
        id: 6,
        name: 'Comfort Inn Lodge',
        location: '0.3 km from campus',
        price: 7500,
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400',
        amenities: ['WiFi', 'Mess', 'Laundry', 'Study Hall', 'Parking'],
        rating: 4.3
    }
];

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Display user name
function displayUserName() {
    const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';
    document.getElementById('userName').textContent = userName.split('@')[0];
}

// Switch tabs
function switchTab(tab) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.getElementById('bookingsTab').classList.remove('active');
    document.getElementById('favoritesTab').classList.remove('active');

    if (tab === 'bookings') {
        document.getElementById('bookingsTab').classList.add('active');
    } else {
        document.getElementById('favoritesTab').classList.add('active');
    }
}

// Render bookings
function renderBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const container = document.getElementById('bookingsList');

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No Bookings Yet</h3>
                <p>You haven't made any bookings. Browse hostels to get started!</p>
                <button class="btn-browse" onclick="window.location.href='hostels.html'">
                    Browse Hostels
                </button>
            </div>
        `;
        return;
    }

    // Sort bookings by date (newest first)
    bookings.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

    container.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <h3>${booking.hostelName}</h3>
                <div class="booking-id">Booking ID: #${booking.id}</div>
            </div>
            <div class="booking-body">
                <div class="booking-info">
                    <div class="info-row">
                        <span class="info-label">Check-in</span>
                        <span class="info-value">${formatDate(booking.checkIn)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Check-out</span>
                        <span class="info-value">${formatDate(booking.checkOut)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Room Type</span>
                        <span class="info-value">${formatRoomType(booking.roomType)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status</span>
                        <span class="status-badge status-${booking.status}">${booking.status}</span>
                    </div>
                </div>
                ${booking.specialRequests ? `
                    <div class="info-row">
                        <span class="info-label">Special Requests</span>
                        <span class="info-value">${booking.specialRequests}</span>
                    </div>
                ` : ''}
                <div class="booking-total">
                    <span class="total-label">Total Amount</span>
                    <span class="total-amount">₹${booking.totalAmount.toLocaleString()}</span>
                </div>
                <div class="booking-actions">
                    <button class="btn-view" onclick="viewHostel(${booking.hostelId})">
                        View Hostel
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="btn-cancel" onclick="cancelBooking(${booking.id})">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Render favorites
function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const container = document.getElementById('favoritesList');

    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❤️</div>
                <h3>No Favorites Yet</h3>
                <p>Start adding hostels to your favorites to see them here!</p>
                <button class="btn-browse" onclick="window.location.href='hostels.html'">
                    Browse Hostels
                </button>
            </div>
        `;
        return;
    }

    const favoriteHostels = hostels.filter(h => favorites.includes(h.id));

    container.innerHTML = favoriteHostels.map(hostel => `
        <div class="favorite-card" onclick="viewHostel(${hostel.id})">
            <img src="${hostel.image}" alt="${hostel.name}" class="favorite-image">
            <div class="favorite-info">
                <h3>${hostel.name}</h3>
                <p class="favorite-location">📍 ${hostel.location}</p>
                <div class="favorite-footer">
                    <div class="favorite-price">₹${hostel.price.toLocaleString()}/mo</div>
                    <button class="remove-favorite" onclick="removeFavorite(event, ${hostel.id})">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Format room type
function formatRoomType(type) {
    const types = {
        'single': 'Single Room',
        'double': 'Double Sharing',
        'triple': 'Triple Sharing',
        'quad': 'Quad Sharing'
    };
    return types[type] || type;
}

// View hostel
function viewHostel(id) {
    window.location.href = `hostel-detail.html?id=${id}`;
}

// Cancel booking
function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const bookingIndex = bookings.findIndex(b => b.id === id);

    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = 'cancelled';
        localStorage.setItem('bookings', JSON.stringify(bookings));

        if (typeof toast !== 'undefined') {
            toast.warning('Booking Cancelled', 'Your booking has been cancelled successfully.', 3000);
        }

        renderBookings();
    }
}

// Remove favorite
function removeFavorite(event, id) {
    event.stopPropagation(); // Prevent card click

    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(fav => fav !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));

    if (typeof toast !== 'undefined') {
        toast.info('Removed', 'Hostel removed from favorites', 2000);
    }

    renderFavorites();
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        if (typeof toast !== 'undefined') {
            toast.info('Goodbye!', 'You have been logged out successfully.', 2000);
        }

        setTimeout(() => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            window.location.href = 'index.html';
        }, 500);
    }
}

// Initialize
if (checkAuth()) {
    displayUserName();
    renderBookings();
    renderFavorites();
}
