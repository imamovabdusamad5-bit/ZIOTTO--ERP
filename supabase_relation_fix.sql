-- Add Foreign Key constraint to Inventory table for Material Types
ALTER TABLE public.inventory
DROP CONSTRAINT IF EXISTS inventory_reference_id_fkey;

ALTER TABLE public.inventory
ADD CONSTRAINT inventory_reference_id_fkey
FOREIGN KEY (reference_id)
REFERENCES public.material_types(id)
ON DELETE SET NULL;

-- Ensure RLS policies are permissive enough for debugging
DROP POLICY IF EXISTS "Allow public read access" ON public.inventory;
CREATE POLICY "Allow public read access" ON public.inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.material_types;
CREATE POLICY "Allow public read access" ON public.material_types FOR SELECT USING (true);
