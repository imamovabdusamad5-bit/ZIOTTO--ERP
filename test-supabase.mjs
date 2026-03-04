import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function test() {
    console.log('Testing column existence...');
    const { data, error } = await supabase.from('inventory').select('id, source, type_specs, grammage, width').limit(1);
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('SUCCESS:', data);
    }
}
test().catch(console.error);
