import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function testFetch() {
    const companyId = 'fb8617c3-60aa-49d1-8cca-e18489da4816'; // Bonito Admin

    console.log('Testing relation query...');
    const { data: relData, error: relError } = await supabase
        .from('inventory')
        .select(`*, material_types!inventory_reference_id_fkey(thread_type, grammage, code)`)
        .eq('company_id', companyId);

    if (relError) {
        console.error("Relation Query Error:", relError.message);
        console.log("Testing simple query...");
        const { data: simpleData, error: simpleError } = await supabase
            .from('inventory')
            .select('*')
            .eq('company_id', companyId);
        if (simpleError) {
             console.error("Simple Query Error:", simpleError.message);
        } else {
             console.log("Simple Query Success! Fetched rows:", simpleData.length);
        }
    } else {
        console.log('Relation Query Success! Fetched rows:', relData.length);
    }
}

testFetch().catch(console.error);
