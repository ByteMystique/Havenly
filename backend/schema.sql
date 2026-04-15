-- Havenly Database Schema — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/yqblrbgerydfejztxggc/sql/new

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

CREATE TABLE IF NOT EXISTS public.room_types (
  id TEXT PRIMARY KEY,
  hostel_id INTEGER REFERENCES public.hostels(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT,
  price INTEGER NOT NULL,
  total_beds INTEGER DEFAULT 10,
  occupied_beds INTEGER DEFAULT 0
);

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

CREATE INDEX IF NOT EXISTS idx_hostels_owner ON public.hostels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hostels_status ON public.hostels(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel ON public.bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hostel ON public.reviews(hostel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.hostels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
