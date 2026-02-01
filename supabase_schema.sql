-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTION ORDERS (PLAN) TABLE
create table if not exists public.production_orders (
  id uuid default uuid_generate_v4() primary key,
  model_name text not null,
  planned_quantity integer not null,
  normative_consumption float not null,
  status text default 'planned',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.production_orders is 'Stores production plans and normative consumption rates.';

-- 2. CUTTING ACTUALS (FACT) TABLE
create table if not exists public.cutting_actuals (
  id uuid default uuid_generate_v4() primary key,
  production_order_id uuid references public.production_orders(id) on delete cascade not null,
  roll_id text not null,
  actual_weight_kg float not null,
  layer_count integer not null,
  lay_length_meters float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.cutting_actuals is 'Stores actual fabric usage facts from the cutting department.';

-- Enable RLS
alter table public.production_orders enable row level security;
alter table public.cutting_actuals enable row level security;

-- Policies (Drop first to avoid "policy already exists" error)
drop policy if exists "Allow public read access" on public.production_orders;
drop policy if exists "Allow authenticated insert" on public.production_orders;
drop policy if exists "Allow public read access" on public.cutting_actuals;
drop policy if exists "Allow authenticated insert" on public.cutting_actuals;

-- Re-create Policies
create policy "Allow public read access" on public.production_orders for select using (true);
create policy "Allow authenticated insert" on public.production_orders for insert with check (auth.role() = 'authenticated');
create policy "Allow public read access" on public.cutting_actuals for select using (true);
create policy "Allow authenticated insert" on public.cutting_actuals for insert with check (auth.role() = 'authenticated');
