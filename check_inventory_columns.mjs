import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function test() {
    console.log('Fetching inventory columns...');
    const { data, error } = await supabase.from('inventory').select('*').limit(1);
    if (error) {
        console.error('ERROR:', error);
    } else {
        if (data && data.length > 0) {
            console.log('SUCCESS columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, no columns detected via select. Data:', data);
        }
    }
}
test().catch(console.error);
