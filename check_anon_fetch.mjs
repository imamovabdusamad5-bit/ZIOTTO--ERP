import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function checkRLS() {
    // We cannot query pg_policies using anon key via API normally, but we can try to fetch as anon, and then fetch with an auth token if we had one.
    // However, I can test if Anon key can fetch data for Mato:
    const { data: anonData, error: anonError } = await supabase
        .from('inventory')
        .select('*')
        .eq('category', 'Mato');
    
    console.log('Anon fetch success:', !!anonData, 'Count:', anonData?.length, 'Error:', anonError);
}
checkRLS().catch(console.error);
