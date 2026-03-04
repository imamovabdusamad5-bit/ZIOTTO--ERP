import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://qnouaodxzovzzclpzpmu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFub3Vhb2R4em92enpjbHB6cG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzgzODQsImV4cCI6MjA1NTc1NDM4NH0.g2A_b8w6kHjXm-B_K_gI4q2bX_rQK_YJ4fN8YQ_c3H8'
);

// Oh wait, VITE_SUPABASE_ANON_KEY wasn't fully printed because it uses JWT format usually starting with ey...
// Let me just read it from the .env to be 100% accurate.
