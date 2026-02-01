-- TEXTILE ERP SUPABASE DATABASE SETUP
-- Copy and run this in your Supabase SQL Editor

-- 1. Create PROFILES table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    username TEXT UNIQUE NOT NULL,
    unique_code TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    department TEXT,
    phone TEXT,
    photo_url TEXT,
    status BOOLEAN DEFAULT true, -- Active/Blocked
    permissions JSONB DEFAULT '{}'::jsonb
);

-- Ensure all columns exist (in case table existed but was incomplete)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;

-- 2. Create MATERIAL_REQUESTS table
CREATE TABLE IF NOT EXISTS public.material_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    inventory_id UUID REFERENCES public.inventory(id),
    order_id UUID REFERENCES public.production_orders(id),
    requested_qty NUMERIC NOT NULL,
    issued_qty NUMERIC DEFAULT 0,
    received_qty NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending', -- Pending, Issued, Received, Rejected
    department TEXT,
    reason TEXT,
    issued_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    notes TEXT
);

-- 3. Ensure INVENTORY table exists (Basic structure)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    category TEXT, -- Mato, Aksessuar
    item_name TEXT NOT NULL,
    color TEXT,
    color_code TEXT,
    unit TEXT,
    quantity NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 4. Ensure PRODUCTION_ORDERS table exists (Basic structure)
CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    order_number TEXT UNIQUE,
    model_id UUID REFERENCES public.models(id),
    status TEXT DEFAULT 'Planning',
    deadline DATE
);

-- Enable RLS (Disable for initial development if needed, but here's the basic enable)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;

-- Basic Public Access Policy (For development ease)
-- WARNING: In production, configure specific roles!
DROP POLICY IF EXISTS "Public Full Access" ON public.profiles;
CREATE POLICY "Public Full Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access" ON public.material_requests;
CREATE POLICY "Public Full Access" ON public.material_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access" ON public.inventory;
CREATE POLICY "Public Full Access" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
