-- HR ATTENDANCE SYSTEM SETUP
-- Run this in Supabase SQL Editor

-- 1. Create ATTENDANCE table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'Ishda', -- 'Ishda', 'Kelmadi', 'Kechikdi', 'Sababli'
    reason TEXT, -- Reason for absence or delay
    late_minutes INTEGER DEFAULT 0,
    efficiency NUMERIC DEFAULT 100,
    
    -- Ensure only one record per user per day
    UNIQUE(profile_id, date)
);

-- 2. Add sample departments for testing if needed
-- (Assuming profiles already have department names like 'Tikuv', 'OTK', etc.)

-- 3. Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policy (for development)
DROP POLICY IF EXISTS "Public Attendance Access" ON public.attendance;
CREATE POLICY "Public Attendance Access" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- 5. Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_profile_date ON public.attendance(profile_id, date);

-- 6. Add special permission field to profiles if not exists
-- (permissions JSONB is already there, we will use 'managed_departments' inside it)
