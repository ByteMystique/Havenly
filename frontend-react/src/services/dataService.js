/**
 * Havenly Data Service
 * ===================
 * Unified CRUD layer. In DEMO_MODE uses localStorage + static data.
 * In live mode calls the Next.js backend API.
 *
 * All public methods return plain JS objects / arrays (never Response objects).
 * Callers never need to know where data comes from.
 */

import staticHostels from '../data/hostels.js';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Extra image pool for gallery (deterministic by hostel ID) ─────────────────
const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
  'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=600',
  'https://images.unsplash.com/photo-1537726235470-8504e3beef77?w=600',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
  'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
  'https://images.unsplash.com/photo-1534889156217-d643df14f14a?w=600',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
];

function getExtraImages(hostelId, primary) {
  const picks = [];
  for (let i = 1; i <= 4; i++) {
    const idx = (hostelId * 7 + i * 3) % IMAGE_POOL.length;
    const img = IMAGE_POOL[idx];
    if (img !== primary && !picks.includes(img)) picks.push(img);
  }
  return [primary, ...picks.slice(0, 4)];
}

// ── Default room types scaffold ───────────────────────────────────────────────
function defaultRoomTypes(price) {
  const base = price || 4000;
  return [
    { id: 'rt_single', type: 'single', label: 'Single Room', price: Math.round(base * 1.4), totalBeds: 10, occupiedBeds: Math.floor(Math.random() * 8) },
    { id: 'rt_double', type: 'double', label: 'Double Sharing', price: base, totalBeds: 20, occupiedBeds: Math.floor(Math.random() * 16) },
    { id: 'rt_triple', type: 'triple', label: 'Triple Sharing', price: Math.round(base * 0.75), totalBeds: 30, occupiedBeds: Math.floor(Math.random() * 25) },
  ];
}

// Enrich static hostel with computed fields
function enrichHostel(h) {
  return {
    ...h,
    images: h.images || getExtraImages(h.id, h.image),
    roomTypes: h.roomTypes || defaultRoomTypes(h.price),
  };
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function ls(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ── HTTP helper (live mode) ───────────────────────────────────────────────────
function getToken() {
  try { return JSON.parse(localStorage.getItem('session'))?.access_token || ''; } catch { return ''; }
}

async function http(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ── Demo user helper ──────────────────────────────────────────────────────────
function demoUserId() {
  try { return JSON.parse(localStorage.getItem('session'))?.user?.id || 'demo-user'; } catch { return 'demo-user'; }
}
function demoUserName() {
  try {
    const s = JSON.parse(localStorage.getItem('session'));
    return s?.user?.user_metadata?.full_name || s?.user?.email?.split('@')[0] || 'User';
  } catch { return 'User'; }
}
function demoUserEmail() {
  try { return JSON.parse(localStorage.getItem('session'))?.user?.email || ''; } catch { return ''; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
export const dataService = {

  // ── AUTH ────────────────────────────────────────────────────────────────────
  isDemoMode: () => DEMO_MODE,

  // ── HOSTELS ─────────────────────────────────────────────────────────────────
  async getHostels() {
    if (DEMO_MODE) {
      const ownerHostels = ls('ownerHostels', []);
      const all = [...staticHostels.map(enrichHostel), ...ownerHostels.filter(h => h.status === 'active')];
      return all;
    }
    const data = await http('GET', '/api/hostels');
    return (data.data || []).map(enrichHostel);
  },

  async getHostel(id) {
    const numId = parseInt(id);
    if (DEMO_MODE) {
      const ownerHostels = ls('ownerHostels', []);
      const found = staticHostels.find(h => h.id === numId) || ownerHostels.find(h => h.id === numId);
      return found ? enrichHostel(found) : null;
    }
    const data = await http('GET', `/api/hostels/${id}`);
    return data.data ? enrichHostel(data.data) : null;
  },

  // Owner: create hostel
  async createHostel(hostelData) {
    if (DEMO_MODE) {
      const existing = ls('ownerHostels', []);
      const newHostel = {
        ...hostelData,
        id: Date.now(),
        ownerId: demoUserId(),
        status: 'active',
        rating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        images: getExtraImages(Date.now(), hostelData.image || IMAGE_POOL[0]),
        roomTypes: hostelData.roomTypes || defaultRoomTypes(hostelData.price),
      };
      lsSet('ownerHostels', [...existing, newHostel]);
      return newHostel;
    }
    const data = await http('POST', '/api/hostels', hostelData);
    return data.data;
  },

  // Owner: update hostel
  async updateHostel(id, updates) {
    if (DEMO_MODE) {
      const existing = ls('ownerHostels', []);
      const updated = existing.map(h => h.id === parseInt(id) ? { ...h, ...updates } : h);
      lsSet('ownerHostels', updated);
      return updated.find(h => h.id === parseInt(id));
    }
    const data = await http('PUT', `/api/hostels/${id}`, updates);
    return data.data;
  },

  // Owner: delete hostel
  async deleteHostel(id) {
    if (DEMO_MODE) {
      const existing = ls('ownerHostels', []);
      lsSet('ownerHostels', existing.filter(h => h.id !== parseInt(id)));
      return true;
    }
    await http('DELETE', `/api/hostels/${id}`);
    return true;
  },

  // Owner: get my hostels
  async getMyHostels() {
    if (DEMO_MODE) {
      const uid = demoUserId();
      return ls('ownerHostels', []).filter(h => h.ownerId === uid);
    }
    const data = await http('GET', '/api/hostels/mine');
    return data.data || [];
  },

  // ── ROOM TYPES ──────────────────────────────────────────────────────────────
  async getRoomTypes(hostelId) {
    const hostel = await this.getHostel(hostelId);
    return hostel?.roomTypes || [];
  },

  async updateRoomAvailability(hostelId, roomTypeId, delta) {
    // delta: +1 occupied, -1 released
    if (DEMO_MODE) {
      const key = `roomTypes_${hostelId}`;
      const rooms = ls(key, null);
      const hostel = await this.getHostel(hostelId);
      const baseRooms = rooms || hostel?.roomTypes || [];
      const updated = baseRooms.map(rt =>
        rt.id === roomTypeId
          ? { ...rt, occupiedBeds: Math.min(rt.totalBeds, Math.max(0, rt.occupiedBeds + delta)) }
          : rt
      );
      lsSet(key, updated);
      return updated;
    }
  },

  // ── BOOKINGS ────────────────────────────────────────────────────────────────
  async createBooking(bookingData) {
    if (DEMO_MODE) {
      const bookings = ls('bookings', []);
      const booking = {
        ...bookingData,
        id: Date.now(),
        userId: demoUserId(),
        studentName: demoUserName(),
        studentEmail: demoUserEmail(),
        status: 'pending',
        bookedAt: new Date().toISOString(),
      };
      lsSet('bookings', [...bookings, booking]);
      // update room count
      if (bookingData.roomTypeId) {
        await this.updateRoomAvailability(bookingData.hostelId, bookingData.roomTypeId, 1);
      }
      return booking;
    }
    const data = await http('POST', '/api/bookings', bookingData);
    return data.data;
  },

  async getUserBookings() {
    if (DEMO_MODE) {
      const uid = demoUserId();
      return ls('bookings', []).filter(b => b.userId === uid);
    }
    const data = await http('GET', '/api/bookings/user');
    return data.data || [];
  },

  async getHostelBookings(hostelId) {
    if (DEMO_MODE) {
      return ls('bookings', []).filter(b => b.hostelId === parseInt(hostelId));
    }
    const data = await http('GET', `/api/bookings/hostel?hostel_id=${hostelId}`);
    return data.data || [];
  },

  async getOwnerBookings() {
    if (DEMO_MODE) {
      const myHostels = await this.getMyHostels();
      const myIds = myHostels.map(h => h.id);
      return ls('bookings', []).filter(b => myIds.includes(b.hostelId));
    }
    const data = await http('GET', '/api/bookings/owner');
    return data.data || [];
  },

  async cancelBooking(id) {
    if (DEMO_MODE) {
      const bookings = ls('bookings', []);
      const booking = bookings.find(b => b.id === id);
      const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b);
      lsSet('bookings', updated);
      if (booking?.roomTypeId) {
        await this.updateRoomAvailability(booking.hostelId, booking.roomTypeId, -1);
      }
      return updated.find(b => b.id === id);
    }
    const data = await http('PUT', `/api/bookings/${id}`, { status: 'cancelled' });
    return data.data;
  },

  async updateBookingStatus(id, status) {
    if (DEMO_MODE) {
      const bookings = ls('bookings', []);
      const updated = bookings.map(b => b.id === parseInt(id) ? { ...b, status } : b);
      lsSet('bookings', updated);
      return updated.find(b => b.id === parseInt(id));
    }
    const data = await http('PUT', `/api/bookings/${id}`, { status });
    return data.data;
  },

  // ── REVIEWS ─────────────────────────────────────────────────────────────────
  async getHostelReviews(hostelId) {
    if (DEMO_MODE) {
      return ls('reviews', []).filter(r => r.hostelId === parseInt(hostelId));
    }
    const data = await http('GET', `/api/reviews?hostel_id=${hostelId}`);
    return data.data || [];
  },

  async getUserReview(hostelId) {
    const uid = demoUserId();
    const reviews = await this.getHostelReviews(hostelId);
    return reviews.find(r => r.userId === uid) || null;
  },

  async createReview(hostelId, reviewData) {
    if (DEMO_MODE) {
      const existing = await this.getUserReview(hostelId);
      if (existing) throw new Error('You have already reviewed this hostel');
      const reviews = ls('reviews', []);
      const review = {
        ...reviewData,
        id: `rev_${Date.now()}`,
        hostelId: parseInt(hostelId),
        userId: demoUserId(),
        userName: demoUserName(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      lsSet('reviews', [...reviews, review]);
      return review;
    }
    const data = await http('POST', '/api/reviews', { hostelId, ...reviewData });
    return data.data;
  },

  async updateReview(reviewId, updates) {
    if (DEMO_MODE) {
      const reviews = ls('reviews', []);
      const updated = reviews.map(r =>
        r.id === reviewId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      );
      lsSet('reviews', updated);
      return updated.find(r => r.id === reviewId);
    }
    const data = await http('PUT', `/api/reviews/${reviewId}`, updates);
    return data.data;
  },

  async deleteReview(reviewId) {
    if (DEMO_MODE) {
      const reviews = ls('reviews', []);
      lsSet('reviews', reviews.filter(r => r.id !== reviewId));
      return true;
    }
    await http('DELETE', `/api/reviews/${reviewId}`);
    return true;
  },

  // ── FAVORITES ───────────────────────────────────────────────────────────────
  getFavorites() {
    return ls('favorites', []);
  },

  isFavorite(hostelId) {
    return this.getFavorites().includes(hostelId);
  },

  toggleFavorite(hostelId) {
    const favs = this.getFavorites();
    const next = favs.includes(hostelId) ? favs.filter(id => id !== hostelId) : [...favs, hostelId];
    lsSet('favorites', next);
    return next;
  },

  removeFavorite(hostelId) {
    const next = this.getFavorites().filter(id => id !== hostelId);
    lsSet('favorites', next);
    return next;
  },

  // ── USER PROFILE ─────────────────────────────────────────────────────────────
  getProfile() {
    const session = (() => { try { return JSON.parse(localStorage.getItem('session')); } catch { return null; } })();
    const stored = ls('userProfile', null) || {};
    return {
      userId: demoUserId(),
      name: stored.name || demoUserName(),
      email: stored.email || demoUserEmail(),
      phone: stored.phone || '',
      university: stored.university || 'CUSAT',
      yearOfStudy: stored.yearOfStudy || '',
      bio: stored.bio || '',
      avatar: stored.avatar || null,
      role: localStorage.getItem('userRole') || 'student',
      preferences: stored.preferences || {
        hostelType: 'All',
        maxBudget: 6000,
        maxDistance: 5,
        requiredAmenities: [],
      },
      createdAt: session?.user?.created_at || stored.createdAt || new Date().toISOString(),
    };
  },

  updateProfile(updates) {
    const current = this.getProfile();
    const merged = { ...current, ...updates };
    lsSet('userProfile', merged);
    // Also update session display name
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (session?.user?.user_metadata && updates.name) {
        session.user.user_metadata.full_name = updates.name;
        localStorage.setItem('session', JSON.stringify(session));
      }
    } catch { /* ignore */ }
    return merged;
  },

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────────
  getNotifications() {
    return ls('notifications', []);
  },

  addNotification({ type, title, message, link = null }) {
    const notifs = ls('notifications', []);
    const notif = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    };
    lsSet('notifications', [notif, ...notifs].slice(0, 50)); // keep max 50
    return notif;
  },

  markNotificationRead(id) {
    const notifs = ls('notifications', []);
    lsSet('notifications', notifs.map(n => n.id === id ? { ...n, read: true } : n));
  },

  markAllNotificationsRead() {
    const notifs = ls('notifications', []);
    lsSet('notifications', notifs.map(n => ({ ...n, read: true })));
  },

  getUnreadCount() {
    return ls('notifications', []).filter(n => !n.read).length;
  },

  // ── UTILS ────────────────────────────────────────────────────────────────────
  generateBookingId: () => `BK${Date.now().toString(36).toUpperCase()}`,
  generateTxnId: () => `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
};

export default dataService;
