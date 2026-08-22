import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function checkCompanies() {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('Companies:', data);
    }
}
checkCompanies().catch(console.error);
