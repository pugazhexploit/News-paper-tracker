-- ==============================================================================
-- PaperTrack: Smart Newspaper Delivery & GPS Monitoring System
-- Production PostgreSQL Database Schema & Row Level Security (RLS) for Supabase
-- ==============================================================================

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. NEWSPAPERS
CREATE TABLE IF NOT EXISTS public.newspapers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_tamil TEXT,
  language TEXT NOT NULL,
  publisher TEXT NOT NULL,
  edition TEXT NOT NULL,
  price NUMERIC(6,2) NOT NULL,
  subscription_monthly NUMERIC(8,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  house_number TEXT NOT NULL,
  street TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Chidambaram',
  district TEXT NOT NULL DEFAULT 'Cuddalore District',
  pincode TEXT NOT NULL DEFAULT '608001',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  place_id TEXT,
  landmark TEXT,
  delivery_instructions TEXT,
  assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  monthly_amount NUMERIC(8,2) DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'overdue')),
  last_payment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  newspaper_id UUID NOT NULL REFERENCES public.newspapers(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  delivery_schedule TEXT NOT NULL DEFAULT 'all_days' CHECK (delivery_schedule IN ('all_days', 'weekdays_only', 'weekends_only', 'sunday_only')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  special_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. DELIVERY ROUTES
CREATE TABLE IF NOT EXISTS public.delivery_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  area TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT 'Cuddalore District',
  route_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_distance_km NUMERIC(5,2) DEFAULT 0.00,
  estimated_duration_mins INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ROUTE STOPS
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'missed', 'postponed', 'paused')),
  completed_at TIMESTAMPTZ,
  UNIQUE(route_id, customer_id)
);

-- 7. DELIVERY ENTRIES
CREATE TABLE IF NOT EXISTS public.delivery_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  newspaper_id UUID NOT NULL REFERENCES public.newspapers(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  route_id UUID REFERENCES public.delivery_routes(id) ON DELETE SET NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'missed', 'postponed', 'paused')),
  delivered_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  proof_photo_url TEXT,
  notes TEXT,
  missed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, newspaper_id, delivery_date)
);

-- 8. STAFF LOCATIONS
CREATE TABLE IF NOT EXISTS public.staff_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy NUMERIC(6,2),
  battery_level INTEGER,
  shift_status TEXT NOT NULL CHECK (shift_status IN ('off_duty', 'on_route', 'break')),
  recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id TEXT NOT NULL, -- UUID or 'admin'
  title TEXT NOT NULL,
  title_tamil TEXT,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  related_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SHIFTS
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'on_route' CHECK (status IN ('on_route', 'completed', 'cancelled'))
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_assigned_staff ON public.customers(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_customers_coords ON public.customers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_delivery_entries_date_staff ON public.delivery_entries(delivery_date, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_locations_staff_time ON public.staff_locations(staff_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Admin has full access; staff can read own profile
CREATE POLICY "Admins full access to profiles" ON public.profiles
  FOR ALL USING (public.is_admin());
CREATE POLICY "Staff read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Customers: Admins full access; Staff can view customers on their route
CREATE POLICY "Admins full access to customers" ON public.customers
  FOR ALL USING (public.is_admin());
CREATE POLICY "Staff view assigned customers" ON public.customers
  FOR SELECT USING (assigned_staff_id = auth.uid());

-- Delivery Entries: Admins full access; Staff can insert/update entries for assigned customers
CREATE POLICY "Admins full access to delivery entries" ON public.delivery_entries
  FOR ALL USING (public.is_admin());
CREATE POLICY "Staff insert own entries" ON public.delivery_entries
  FOR INSERT WITH CHECK (staff_id = auth.uid());
CREATE POLICY "Staff view own entries" ON public.delivery_entries
  FOR SELECT USING (staff_id = auth.uid());
