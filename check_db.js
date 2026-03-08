import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Calling get_global_leaderboard with sub: chem");
    const { data, error } = await supabase.rpc('get_global_leaderboard', { p_subject_id: 'chem', p_branch_text: null, p_period: 'all' });
    if (error) console.error("Error:", error);
    else console.log("Leaderboard Chem:", data);

    console.log("Calling get_global_leaderboard with sub: all");
    const { data: allData, error: allErr } = await supabase.rpc('get_global_leaderboard', { p_subject_id: null, p_branch_text: null, p_period: 'all' });
    if (allErr) console.error("Error:", allErr);
    else console.log("Leaderboard All:", allData);
}

check();
