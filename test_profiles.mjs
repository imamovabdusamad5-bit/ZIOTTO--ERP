import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient('https://qnouaodxzovzzclpzpmu.supabase.co', 'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'); 
supabase.from('profiles').select('username, full_name, unique_code, company_id, role').then(console.log);
