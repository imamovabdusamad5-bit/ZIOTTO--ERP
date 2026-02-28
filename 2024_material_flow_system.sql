-- 1. MATERIAL_TYPES UPDATE
-- First add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='material_types' AND column_name='unit') THEN
        ALTER TABLE public.material_types ADD COLUMN unit text;
    END IF;
END $$;

-- Add CHECK constraint for units
-- We use a temporary way to handle existing data if any, but user said start from new.
-- However, for safety, let's just apply it.
ALTER TABLE public.material_types DROP CONSTRAINT IF EXISTS material_types_unit_check;
ALTER TABLE public.material_types ADD CONSTRAINT material_types_unit_check 
    CHECK (unit IN ('kg', 'metr', 'dona', 'pachka'));

-- Ensure code is unique and not empty for business requirements
ALTER TABLE public.material_types ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.material_types DROP CONSTRAINT IF EXISTS material_types_code_key;
ALTER TABLE public.material_types ADD CONSTRAINT material_types_code_key UNIQUE (code);

-- 2. MATERIAL_DOCUMENTS (Nakladnoy Header)
CREATE TABLE IF NOT EXISTS public.material_documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_no text NOT NULL, -- Nakladnoy raqami
    doc_type text NOT NULL CHECK (doc_type IN ('ISSUE', 'CONSUME', 'RETURN', 'SCRAP')),
    department_from text NOT NULL,
    department_to text NOT NULL,
    order_id uuid REFERENCES public.production_orders(id) ON DELETE SET NULL,
    status text DEFAULT 'Confirmed',
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- 3. MATERIAL_DOCUMENT_ITEMS (Nakladnoy Items)
CREATE TABLE IF NOT EXISTS public.material_document_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id uuid REFERENCES public.material_documents(id) ON DELETE CASCADE,
    material_type_id uuid REFERENCES public.material_types(id),
    qty numeric(12, 3) NOT NULL CHECK (qty >= 0),
    unit text NOT NULL CHECK (unit IN ('kg', 'metr', 'dona', 'pachka')),
    color text,
    part_name text,
    created_at timestamptz DEFAULT now()
);

-- 4. VIEW FOR PLAN VS FAKT
-- This view aggregates movements by Order and Material
CREATE OR REPLACE VIEW public.order_material_fact AS
SELECT 
    d.order_id,
    i.material_type_id,
    mt.name as material_name,
    mt.code as material_code,
    i.unit,
    SUM(CASE WHEN d.doc_type = 'ISSUE' THEN i.qty ELSE 0 END) as issued_qty,
    SUM(CASE WHEN d.doc_type = 'CONSUME' THEN i.qty ELSE 0 END) as consumed_qty,
    SUM(CASE WHEN d.doc_type = 'RETURN' THEN i.qty ELSE 0 END) as returned_qty,
    SUM(CASE WHEN d.doc_type = 'SCRAP' THEN i.qty ELSE 0 END) as scrap_qty
FROM public.material_documents d
JOIN public.material_document_items i ON d.id = i.document_id
JOIN public.material_types mt ON i.material_type_id = mt.id
WHERE d.status = 'Confirmed'
GROUP BY d.order_id, i.material_type_id, mt.name, mt.code, i.unit;

-- 5. RLS POLICIES FOR NEW TABLES
ALTER TABLE public.material_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_document_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Documents" ON public.material_documents;
CREATE POLICY "Public Read Documents" ON public.material_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth Generic Documents" ON public.material_documents;
CREATE POLICY "Auth Generic Documents" ON public.material_documents FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read Document Items" ON public.material_document_items;
CREATE POLICY "Public Read Document Items" ON public.material_document_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth Generic Document Items" ON public.material_document_items;
CREATE POLICY "Auth Generic Document Items" ON public.material_document_items FOR ALL USING (auth.role() = 'authenticated');
