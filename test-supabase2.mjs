import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function test() {
    const { error: e1 } = await supabase.from('inventory').select('id, material_types!inventory_reference_id_fkey(thread_type)').limit(1);
    console.log('Query 1 Error:', e1 ? e1.message : null);

    const { error: e2 } = await supabase.from('inventory').select('id, material_types!reference_id(thread_type)').limit(1);
    console.log('Query 2 Error:', e2 ? e2.message : null);

    const { error: e3 } = await supabase.from('inventory').select('id, material_types(thread_type)').limit(1);
    console.log('Query 3 Error:', e3 ? e3.message : null);
}
test().catch(console.error);
