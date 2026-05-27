import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient('https://qnouaodxzovzzclpzpmu.supabase.co', 'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'); 
supabase.from('companies').update({ name: 'ZIOTTO-KIDS', domain_slug: 'ziotto' }).eq('id', 'fb8617c3-60aa-49d1-8cca-e18489da4816').then(res => console.log('Updated:', res));
