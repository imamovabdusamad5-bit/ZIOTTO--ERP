import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv'
);

async function testLogin() {
    console.log("Testing Supabase auth with ADMIN...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@ziotto.uz',
        password: '9999'
    });
    console.log("Result:", { data, error });
}

testLogin();
