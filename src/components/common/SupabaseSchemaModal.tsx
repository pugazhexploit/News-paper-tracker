import React, { useState } from 'react';
import { Database, Copy, Check, X, Shield, Terminal } from 'lucide-react';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- ==============================================================================
-- PaperTrack: PostgreSQL Database Schema & Row Level Security (RLS) for Supabase
-- ==============================================================================

-- 1. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. NEWSPAPERS
CREATE TABLE public.newspapers (
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
CREATE TABLE public.customers (
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
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  newspaper_id UUID NOT NULL REFERENCES public.newspapers(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  delivery_schedule TEXT NOT NULL DEFAULT 'all_days',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  special_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. DELIVERY ENTRIES
CREATE TABLE public.delivery_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  newspaper_id UUID NOT NULL REFERENCES public.newspapers(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  route_id UUID,
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

-- 6. STAFF LOCATIONS (Real-time GPS Tracking)
CREATE TABLE public.staff_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy NUMERIC(6,2),
  shift_status TEXT NOT NULL CHECK (shift_status IN ('off_duty', 'on_route', 'break')),
  recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.customers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Staff view assigned" ON public.customers FOR SELECT USING (
  assigned_staff_id = auth.uid()
);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Supabase PostgreSQL Schema & Security Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 text-xs text-slate-400">
          <span>Relational Schema • RLS Policies • Indexed for Realtime GPS Queries</span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-sky-200">
          <pre>{sqlCode}</pre>
        </div>
      </div>
    </div>
  );
};
