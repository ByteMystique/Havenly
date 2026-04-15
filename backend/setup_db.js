#!/usr/bin/env node
/**
 * Havenly DB Setup — Creates tables + seeds hostel data via Supabase REST API
 * Run: node setup_db.js
 */

const SUPABASE_URL = 'https://yqblrbgerydfejztxggc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYmxyYmdlcnlkZmVqenR4Z2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIzOTg4NCwiZXhwIjoyMDkxODE1ODg0fQ.U-kbemm2MVQ_usR-8jekZUcCY7PI_na9Klx_I_WTbXw';

async function sql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });
  // Use the SQL endpoint instead
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  return res2;
}

async function execSQL(query) {
  // Supabase pg_net or direct SQL via the management API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sql: query }),
  });
  return res;
}

async function restInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`  ❌ ${table}: ${res.status} ${text}`);
    return null;
  }
  console.log(`  ✅ ${table}: inserted ${Array.isArray(rows) ? rows.length : 1} rows`);
  return JSON.parse(text);
}

async function restSelect(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=5`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  return res;
}

async function main() {
  console.log('🔄 Testing Supabase connection...');
  const test = await restSelect('hostels');
  
  if (test.status === 404 || test.status === 400) {
    console.log('⚠️  Tables do not exist yet. You need to run the SQL schema in the Supabase SQL Editor.');
    console.log('   Go to: https://supabase.com/dashboard → SQL Editor → Run the schema below.\n');
    printSchema();
    return;
  }
  
  const existing = await test.json();
  console.log(`✅ Connected! Hostels table has ${existing.length >= 5 ? '5+' : existing.length} rows.\n`);
  
  if (existing.length > 0) {
    console.log('ℹ️  Hostels already seeded. Skipping seed.');
    return;
  }
  
  console.log('🌱 Seeding hostel data...');
  await seedHostels();
  console.log('\n✅ Done! Database is ready.');
}

function printSchema() {
  console.log(`
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → your project → SQL Editor):

-- Hostels
CREATE TABLE IF NOT EXISTS public.hostels (
  id SERIAL PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('boys', 'girls', 'co-ed')),
  price INTEGER NOT NULL,
  distance DECIMAL(4,2),
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  description TEXT,
  address TEXT,
  image TEXT,
  amenities TEXT[] DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Room Types
CREATE TABLE IF NOT EXISTS public.room_types (
  id TEXT PRIMARY KEY,
  hostel_id INTEGER REFERENCES public.hostels(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT,
  price INTEGER NOT NULL,
  total_beds INTEGER DEFAULT 10,
  occupied_beds INTEGER DEFAULT 0
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  university TEXT DEFAULT 'CUSAT',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'owner')),
  year_of_study TEXT,
  bio TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  hostel_id INTEGER REFERENCES public.hostels(id),
  room_type_id TEXT,
  hostel_name TEXT,
  room_type_label TEXT,
  student_name TEXT,
  student_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  check_in DATE,
  check_out DATE,
  guests INTEGER DEFAULT 1,
  total_amount INTEGER,
  payment_method TEXT,
  transaction_id TEXT,
  booked_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hostel_id INTEGER REFERENCES public.hostels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  rating DECIMAL(3,2) NOT NULL,
  text TEXT,
  category_ratings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE(hostel_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id),
  type TEXT,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hostels_owner ON public.hostels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hostels_status ON public.hostels(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel ON public.bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hostel ON public.reviews(hostel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Disable RLS for now (enable later for production security)
ALTER TABLE public.hostels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
`);
}

async function seedHostels() {
  const hostels = [
    { name: "Zakiya's Men's Hostel", type: 'boys', price: 4500, distance: 1.2, rating: 4.2, rating_count: 15, description: 'Well-maintained boys hostel near CUSAT south gate with good food and study areas.', address: 'South Kalamassery, Kochi', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600', amenities: ['WiFi','Mess','Laundry','Study Room','Parking'], scores: { cleanliness: 8, food: 7, safety: 9, amenities: 7 }, status: 'active' },
    { name: "Illickal Hostel", type: 'boys', price: 3800, distance: 0.8, rating: 4.5, rating_count: 22, description: 'Budget-friendly hostel closest to CUSAT campus with excellent mess facilities.', address: 'North Kalamassery, Kochi', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', amenities: ['WiFi','Mess','Study Room','CCTV'], scores: { cleanliness: 9, food: 8, safety: 9, amenities: 6 }, status: 'active' },
    { name: "Green Valley Residency", type: 'boys', price: 5200, distance: 1.5, rating: 4.0, rating_count: 10, description: 'Modern hostel with AC rooms and gym facility. Premium accommodation experience.', address: 'HMT Colony, Kalamassery', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', amenities: ['WiFi','AC','Gym','Mess','Laundry','CCTV','Parking'], scores: { cleanliness: 8, food: 7, safety: 8, amenities: 9 }, status: 'active' },
    { name: "Lakshmi Ladies Hostel", type: 'girls', price: 5000, distance: 1.0, rating: 4.6, rating_count: 18, description: 'Safe and secure ladies hostel with warden, CCTV, and home-cooked meals.', address: 'Cusat Road, Kalamassery', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', amenities: ['WiFi','Mess','Laundry','CCTV','Warden','Study Room'], scores: { cleanliness: 9, food: 9, safety: 10, amenities: 8 }, status: 'active' },
    { name: "Royal Comfort Hostel", type: 'boys', price: 6000, distance: 2.0, rating: 4.3, rating_count: 12, description: 'Premium boys hostel with single AC rooms, attached bathrooms, and recreation area.', address: 'Seaport-Airport Road, Kochi', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', amenities: ['WiFi','AC','Mess','Gym','Laundry','CCTV','Parking','Recreation'], scores: { cleanliness: 9, food: 8, safety: 9, amenities: 10 }, status: 'active' },
    { name: "Sree Narayana Hostel", type: 'boys', price: 3500, distance: 0.5, rating: 4.1, rating_count: 25, description: 'The closest hostel to CUSAT main gate. Simple, clean, and very affordable.', address: 'CUSAT Main Gate, Kalamassery', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600', amenities: ['WiFi','Mess','Study Room'], scores: { cleanliness: 7, food: 7, safety: 8, amenities: 5 }, status: 'active' },
    { name: "Amala Women's Hostel", type: 'girls', price: 4800, distance: 1.3, rating: 4.7, rating_count: 20, description: 'Top-rated ladies hostel with strict security, nutritious food, and spacious rooms.', address: 'South Kalamassery, Kochi', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', amenities: ['WiFi','Mess','Laundry','CCTV','Warden','AC','Study Room'], scores: { cleanliness: 10, food: 9, safety: 10, amenities: 9 }, status: 'active' },
    { name: "Blue Star Hostel", type: 'co-ed', price: 4200, distance: 1.8, rating: 3.9, rating_count: 8, description: 'Co-ed hostel with separate wings for boys and girls. Modern facilities.', address: 'Edappally, Kochi', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', amenities: ['WiFi','AC','Mess','Laundry','CCTV'], scores: { cleanliness: 7, food: 6, safety: 8, amenities: 7 }, status: 'active' },
    { name: "Palm Grove Hostel", type: 'boys', price: 3900, distance: 1.1, rating: 4.0, rating_count: 14, description: 'Peaceful hostel in a green campus with good study environment.', address: 'Thrikkakara, Kochi', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600', amenities: ['WiFi','Mess','Study Room','Parking','Garden'], scores: { cleanliness: 8, food: 7, safety: 8, amenities: 7 }, status: 'active' },
    { name: "Sunrise Ladies Hostel", type: 'girls', price: 5500, distance: 1.6, rating: 4.4, rating_count: 16, description: 'Premium ladies hostel with gym, indoor games, and attached bathrooms.', address: 'HMT Colony, Kalamassery', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', amenities: ['WiFi','AC','Mess','Gym','Laundry','CCTV','Warden','Recreation'], scores: { cleanliness: 9, food: 8, safety: 10, amenities: 9 }, status: 'active' },
  ];

  const inserted = await restInsert('hostels', hostels);
  if (!inserted) return;

  // Seed room types for each hostel
  const roomTypes = [];
  for (const h of inserted) {
    roomTypes.push(
      { id: `rt_${h.id}_single`, hostel_id: h.id, type: 'single', label: 'Single Room', price: Math.round(h.price * 1.4), total_beds: 10, occupied_beds: Math.floor(Math.random() * 6) },
      { id: `rt_${h.id}_double`, hostel_id: h.id, type: 'double', label: 'Double Sharing', price: h.price, total_beds: 20, occupied_beds: Math.floor(Math.random() * 12) },
      { id: `rt_${h.id}_triple`, hostel_id: h.id, type: 'triple', label: 'Triple Sharing', price: Math.round(h.price * 0.75), total_beds: 30, occupied_beds: Math.floor(Math.random() * 20) },
    );
  }
  await restInsert('room_types', roomTypes);
}

main().catch(console.error);
