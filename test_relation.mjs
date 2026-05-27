import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient('https://qnouaodxzovzzclpzpmu.supabase.co', 'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'); 
supabase.from('profiles').select('*, companies!company_id(id, name, domain_slug)').eq('username', 'ABDUSAMAD').single().then(res => console.log('Data:', res.data ? 'Success' : 'Fail', 'Error:', res.error));
