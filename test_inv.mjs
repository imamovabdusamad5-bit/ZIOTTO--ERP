import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient('https://qnouaodxzovzzclpzpmu.supabase.co', 'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'); 
supabase.from('inventory').select('id, item_name, company_id').then(res => {
    console.log('Total Count:', res.data?.length);
    if (res.data?.length > 0) {
        console.log('Sample data:', res.data[0]);
    }
    console.log('Error:', res.error);
});
