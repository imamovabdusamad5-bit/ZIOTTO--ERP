-- FIX DELETE PERMISSIONS AND FOREIGN KEYS

-- 1. Fix INVENTORY table relationship
-- Only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') THEN
        ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_reference_id_fkey;
        
        ALTER TABLE public.inventory
        ADD CONSTRAINT inventory_reference_id_fkey
        FOREIGN KEY (reference_id)
        REFERENCES public.material_types(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Fix BOM_ITEMS table relationship
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bom_items') THEN
        -- Drop potential existing constraints (guessing names or using simple add/drop logic)
        ALTER TABLE public.bom_items DROP CONSTRAINT IF EXISTS bom_items_material_type_id_fkey;
        
        ALTER TABLE public.bom_items
        ADD CONSTRAINT bom_items_material_type_id_fkey
        FOREIGN KEY (material_type_id)
        REFERENCES public.material_types(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Fix MATERIAL_REQUESTS table relationship (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'material_requests') THEN
        ALTER TABLE public.material_requests DROP CONSTRAINT IF EXISTS material_requests_resource_id_fkey;
        
        -- Assuming 'resource_id' or 'material_id' is used. From Ombor.jsx select, it seems 'inventory_id' is used. 
        -- If it links to Inventory, we are fine. If it links to Material Types directly, we need to check.
        -- Ombor.jsx: .select('*, inventory:inventory_id(item_name...)') -> It links to Inventory.
        -- So Material Requests checks Inventory, and Inventory checks Material Types.
        -- If we delete Material Type -> Inventory.reference_id becomes NULL.
        -- Material Requests -> Inventory still valid.
        -- So this should be fine.
        NULL;
    END IF;
END $$;

-- 4. Ensure RLS Policies allow deletion
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.material_types;
CREATE POLICY "Allow authenticated delete" ON public.material_types FOR DELETE USING (auth.role() = 'authenticated');

-- Also ensure update is allowed
DROP POLICY IF EXISTS "Allow authenticated update" ON public.material_types;
CREATE POLICY "Allow authenticated update" ON public.material_types FOR UPDATE USING (auth.role() = 'authenticated');
