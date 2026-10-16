-- ==========================================================
-- ASHOK FINANCE - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==========================================================

-- 1. Create Lines table
CREATE TABLE IF NOT EXISTS public.lines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    badge_color TEXT DEFAULT 'ruby',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Overall Bag Settings table
CREATE TABLE IF NOT EXISTS public.bag_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    starting_bag NUMERIC(15, 2) NOT NULL DEFAULT 3000000.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    notes TEXT DEFAULT 'Combined Bag Capital across 3 lines',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- 2b. Create Line-Specific Bag Settings (Morning, Evening 1, Evening 2)
CREATE TABLE IF NOT EXISTS public.line_bag_settings (
    line_id TEXT PRIMARY KEY REFERENCES public.lines(id) ON DELETE CASCADE,
    starting_bag NUMERIC(15, 2) NOT NULL DEFAULT 1000000.00,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Daily Entries table
CREATE TABLE IF NOT EXISTS public.daily_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    line_id TEXT NOT NULL REFERENCES public.lines(id) ON DELETE CASCADE,
    income NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    outgoing NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Bag Adjustments table (Optional for direct bag top-ups or withdrawals)
CREATE TABLE IF NOT EXISTS public.bag_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adj_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL,
    adj_type TEXT NOT NULL CHECK (adj_type IN ('deposit', 'withdrawal', 'correction')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Indexes for fast filtering by date and line
CREATE INDEX IF NOT EXISTS idx_entries_date ON public.daily_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_line ON public.daily_entries(line_id);
CREATE INDEX IF NOT EXISTS idx_entries_date_line ON public.daily_entries(entry_date, line_id);

-- 6. Insert Default Lines (3 dedicated business lines)
INSERT INTO public.lines (id, name, description, badge_color)
VALUES 
    ('morning', 'ASHOK FINANCE MORNING', 'Morning Collection & Disbursement Line', '#DC2626'),
    ('evening_1', 'ASHOK FINANCE EVENING 1', 'Evening Line 1 Collection & Disbursement', '#B91C1C'),
    ('evening_2', 'ASHOK FINANCE EVENING 2', 'Evening Line 2 Collection & Disbursement', '#991B1B')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 7. Insert Initial Bag Settings (₹10,00,000 / 10 Lakhs per line = ₹30 Lakhs total)
INSERT INTO public.bag_settings (id, starting_bag, currency, notes)
VALUES (1, 3000000.00, 'INR', 'Ashok Finance Combined Initial Bag Capital (30 Lakhs)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.line_bag_settings (line_id, starting_bag, notes)
VALUES 
    ('morning', 1000000.00, 'Morning Line Initial Bag Capital (10 Lakhs)'),
    ('evening_1', 1000000.00, 'Evening Line 1 Initial Bag Capital (10 Lakhs)'),
    ('evening_2', 1000000.00, 'Evening Line 2 Initial Bag Capital (10 Lakhs)')
ON CONFLICT (line_id) DO NOTHING;


-- 8. Enable Row Level Security (RLS) & Allow Read/Write for Client App
ALTER TABLE public.lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bag_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_bag_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bag_adjustments ENABLE ROW LEVEL SECURITY;

-- Permissive policies for easy single-tenant operation (Anon key allowed)
CREATE POLICY "Allow public read lines" ON public.lines FOR SELECT USING (true);
CREATE POLICY "Allow public write lines" ON public.lines FOR ALL USING (true);

CREATE POLICY "Allow public read bag_settings" ON public.bag_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write bag_settings" ON public.bag_settings FOR ALL USING (true);

CREATE POLICY "Allow public read line_bag_settings" ON public.line_bag_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write line_bag_settings" ON public.line_bag_settings FOR ALL USING (true);

CREATE POLICY "Allow public read daily_entries" ON public.daily_entries FOR SELECT USING (true);
CREATE POLICY "Allow public write daily_entries" ON public.daily_entries FOR ALL USING (true);

CREATE POLICY "Allow public read bag_adjustments" ON public.bag_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow public write bag_adjustments" ON public.bag_adjustments FOR ALL USING (true);

-- Enable Supabase Realtime for instant synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bag_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.line_bag_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bag_adjustments;

