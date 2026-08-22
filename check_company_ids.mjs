import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function checkData() {
    const { data, error } = await supabase.from('inventory').select('company_id, category');
    if (error) {
        console.error('ERROR:', error);
    } else {
        const companies = [...new Set(data.map(d => d.company_id))];
        console.log('Unique Companies:', companies);
        companies.forEach(company => {
            const items = data.filter(d => d.company_id === company);
            const matos = items.filter(d => d.category === 'Mato');
            console.log(`Company ${company} has ${items.length} items, ${matos.length} are Mato`);
        });
    }
}
checkData().catch(console.error);
