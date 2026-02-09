// Simple hostel data
const hostels = [
    {
        id: 1,
        name: 'Campus View Hostel',
        location: '0.5 km from campus',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
        amenities: ['WiFi', 'Mess', 'AC'],
        rating: 4.5
    },
    {
        id: 2,
        name: 'Green Valley Residence',
        location: '1.2 km from campus',
        price: 6500,
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
        amenities: ['WiFi', 'Mess', 'Gym'],
        rating: 4.2
    },
    {
        id: 3,
        name: 'Elite Student Housing',
        location: '0.8 km from campus',
        price: 10000,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
        amenities: ['WiFi', 'Mess', 'AC', 'Gym'],
        rating: 4.8
    },
    {
        id: 4,
        name: 'Budget Stay Hostel',
        location: '2.0 km from campus',
        price: 5000,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
        amenities: ['WiFi', 'Mess'],
        rating: 3.9
    },
    {
        id: 5,
        name: 'Premium Scholars Den',
        location: '1.5 km from campus',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        amenities: ['WiFi', 'Mess', 'AC', 'Gym', 'Pool'],
        rating: 4.9
    },
    {
        id: 6,
        name: 'Comfort Inn Lodge',
        location: '0.3 km from campus',
        price: 7500,
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400',
        amenities: ['WiFi', 'Mess', 'Laundry'],
        rating: 4.3
    }
];

// Render hostels
function renderHostels(hostelsToShow = hostels) {
    const grid = document.getElementById('hostelGrid');

    if (hostelsToShow.length === 0) {
        grid.innerHTML = '<p class="no-results">No hostels found</p>';
        return;
    }

    grid.innerHTML = hostelsToShow.map(hostel => `
        <div class="hostel-card">
            <img src="${hostel.image}" alt="${hostel.name}" class="hostel-image">
            <div class="hostel-info">
                <h3>${hostel.name}</h3>
                <p class="location">📍 ${hostel.location}</p>
                <div class="amenities">
                    ${hostel.amenities.map(a => `<span class="tag">${a}</span>`).join('')}
                </div>
                <div class="hostel-footer">
                    <div class="price">₹${hostel.price.toLocaleString()}/mo</div>
                    <div class="rating">⭐ ${hostel.rating}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = hostels.filter(hostel =>
        hostel.name.toLowerCase().includes(searchTerm) ||
        hostel.location.toLowerCase().includes(searchTerm) ||
        hostel.amenities.some(a => a.toLowerCase().includes(searchTerm))
    );
    renderHostels(filtered);
});

// Initial render
renderHostels();
