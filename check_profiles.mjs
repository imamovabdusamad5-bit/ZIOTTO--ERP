import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('ERROR fetching profiles:', error.message);
    } else {
        console.log('Profiles:', data);
    }
}
checkProfiles().catch(console.error);
