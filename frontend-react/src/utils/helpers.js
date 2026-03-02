export function getAmenityIcon(amenity) {
  const icons = {
    WiFi: '📶',
    Mess: '🍽️',
    AC: '❄️',
    Gym: '💪',
    Pool: '🏊',
    'Swimming Pool': '🏊',
    Laundry: '🧺',
    'Study Room': '📚',
    'Study Hall': '📚',
    Library: '📖',
    Parking: '🚗',
    Security: '🔒',
    'Common Room': '🛋️',
    'Common Area': '🛋️',
    Spa: '💆',
    Cafe: '☕',
    'Gaming Room': '🎮',
  };
  return icons[amenity] || '✓';
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRoomType(type) {
  const types = {
    single: 'Single Room',
    double: 'Double Sharing',
    triple: 'Triple Sharing',
    quad: 'Quad Sharing',
  };
  return types[type] || type;
}
