import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').filter(Boolean).forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key) env[key.trim()] = rest.join('=').trim();
});

const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking columns...");
    // Let's try to insert a dummy row and see the exact error
    const { data, error } = await anonClient.from('user_test_results').insert([
        { lesson_id: 'test', score: 0, answers_detail: [] }
    ]);
    console.log("Insert result:", error ? JSON.stringify(error) : data);
}
check();
