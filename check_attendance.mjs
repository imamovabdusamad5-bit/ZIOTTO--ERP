import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://qnouaodxzovzzclpzpmu.supabase.co', 'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv');
const { data, error } = await supabase.from('attendance').select('*').limit(1);
console.log(data, error);
