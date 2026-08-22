import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function checkData() {
    console.log('Checking inventory data...');
    const { data, error } = await supabase.from('inventory').select('*');
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log(`Found ${data.length} rows in inventory.`);
        if (data.length > 0) {
            console.log('Categories:', [...new Set(data.map(d => d.category))]);
            console.log('First item:', data[0]);
        }
    }
}
checkData().catch(console.error);
