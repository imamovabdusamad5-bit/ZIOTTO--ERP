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

-- Policies
alter table public.production_orders enable row level security;
alter table public.cutting_actuals enable row level security;

drop policy if exists "Allow public read access" on public.production_orders;
drop policy if exists "Allow authenticated insert" on public.production_orders;
drop policy if exists "Allow authenticated update" on public.production_orders;
drop policy if exists "Allow authenticated delete" on public.production_orders;

create policy "Allow public read access" on public.production_orders for select using (true);
create policy "Allow authenticated insert" on public.production_orders for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated update" on public.production_orders for update using (auth.role() = 'authenticated');
create policy "Allow authenticated delete" on public.production_orders for delete using (auth.role() = 'authenticated');

drop policy if exists "Allow public read access" on public.cutting_actuals;
drop policy if exists "Allow authenticated insert" on public.cutting_actuals;
create policy "Allow public read access" on public.cutting_actuals for select using (true);
create policy "Allow authenticated insert" on public.cutting_actuals for insert with check (auth.role() = 'authenticated');

-- 3. INVENTORY & ROLLS
-- Ensure inventory table exists (simplified check)
create table if not exists public.inventory (
  id uuid default uuid_generate_v4() primary key,
  item_name text not null,
  category text,
  quantity float default 0,
  unit text,
  color text,
  color_code text,
  batch_number text,
  reference_id uuid, -- link to material_types
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- Rolls Table
create table if not exists public.inventory_rolls (
  id uuid default uuid_generate_v4() primary key,
  inventory_id uuid references public.inventory(id) on delete cascade not null,
  roll_number text not null,
  weight float not null,
  status text default 'in_stock',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inventory & Roll Policies
alter table public.inventory enable row level security;
alter table public.inventory_rolls enable row level security;

-- Inventory Policies
drop policy if exists "Allow public read access" on public.inventory;
drop policy if exists "Allow authenticated all" on public.inventory;
create policy "Allow public read access" on public.inventory for select using (true);
create policy "Allow authenticated all" on public.inventory for all using (auth.role() = 'authenticated');

-- Roll Policies
drop policy if exists "Allow public read access" on public.inventory_rolls;
drop policy if exists "Allow authenticated all" on public.inventory_rolls;
create policy "Allow public read access" on public.inventory_rolls for select using (true);
create policy "Allow authenticated all" on public.inventory_rolls for all using (auth.role() = 'authenticated');

-- Inventory Logs Policies
create table if not exists public.inventory_logs (
    id uuid default uuid_generate_v4() primary key,
    inventory_id uuid references public.inventory(id),
    type text,
    quantity float,
    reason text,
    batch_number text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.inventory_logs enable row level security;
drop policy if exists "Allow public read access" on public.inventory_logs;
drop policy if exists "Allow authenticated all" on public.inventory_logs;
create policy "Allow public read access" on public.inventory_logs for select using (true);
create policy "Allow authenticated insert" on public.inventory_logs for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated update" on public.inventory_logs for update using (auth.role() = 'authenticated');
create policy "Allow authenticated delete" on public.inventory_logs for delete using (auth.role() = 'authenticated');

-- Material Types Policies
create table if not exists public.material_types (
    id uuid default uuid_generate_v4() primary key,
    name text,
    type text,
    thread_type text,
    grammage integer,
    code text
);
alter table public.material_types enable row level security;
drop policy if exists "Allow public read access" on public.material_types;
drop policy if exists "Allow authenticated all" on public.material_types;
create policy "Allow public read access" on public.material_types for select using (true);
create policy "Allow authenticated all" on public.material_types for all using (auth.role() = 'authenticated');
