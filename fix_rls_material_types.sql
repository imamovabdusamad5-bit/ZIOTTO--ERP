-- Ma'lumotnomalar (material_types) jadvali uchun RLS ruxsatlarini to'liq tuzatish

-- 1. Avval barcha qolgan siyosatlarni o'chiramiz (chalkashlik bo'lmasligi uchun)
DROP POLICY IF EXISTS "Allow public read access" ON public.material_types;
DROP POLICY IF EXISTS "Allow authenticated all" ON public.material_types;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.material_types;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.material_types;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.material_types;
DROP POLICY IF EXISTS "Allow authenticated select" ON public.material_types;

-- 2. RLS ni yoqib qo'yamiz
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;

-- 3. Hamma (tizimga kirmaganlar ham ko'rishi mumkinmi? Umuman xavfsiz bo'lishi uchun faqat authenticated)
CREATE POLICY "Allow authenticated select" ON public.material_types 
FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Yangi ma'lumot qo'shish uchun INSERT ruxsati (Aynan shu ishlamay qolgan)
CREATE POLICY "Allow authenticated insert" ON public.material_types 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Tahrirlash uchun UPDATE ruxsati
CREATE POLICY "Allow authenticated update" ON public.material_types 
FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. O'chirish uchun DELETE ruxsati
CREATE POLICY "Allow authenticated delete" ON public.material_types 
FOR DELETE USING (auth.role() = 'authenticated');
