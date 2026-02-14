import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log('Starting Supabase Verification (Node.js)...');

    try {
        // 1. Check Connection
        console.log('1. Checking Connection...');
        const { error: healthError } = await supabase.from('subject_syllabus').select('subject').limit(1);
        if (healthError) throw new Error(`Connection failed: ${healthError.message}`);
        console.log('✅ Connection OK');

        // 2. Test Save Structure
        const testSubject = 'test_subject_node_' + Date.now();
        const testStructure = {
            sections: [
                {
                    id: 'sec_test_node_1',
                    title: 'Node Test Section',
                    topics: []
                }
            ]
        };

        console.log(`2. Testing saveStructure for ${testSubject}...`);
        const { error: saveError } = await supabase
            .from('subject_syllabus')
            .upsert({
                subject: testSubject,
                data: { sections: testStructure.sections },
                updated_at: new Date()
            }, { onConflict: 'subject' });

        if (saveError) throw saveError;
        console.log('✅ saveStructure OK');

        // 3. Test Read Structure
        console.log('3. Testing getStructure...');
        const { data: loadedStructure, error: loadError } = await supabase
            .from('subject_syllabus')
            .select('data')
            .eq('subject', testSubject)
            .single();

        if (loadError) throw loadError;
        if (!loadedStructure || !loadedStructure.data || loadedStructure.data.sections[0].id !== 'sec_test_node_1') {
            throw new Error('Structure verification failed: Data mismatch');
        }
        console.log('✅ getStructure OK');

        // 4. Test Save Lesson
        const testLessonId = 'les_test_node_' + Date.now();
        const testLesson = {
            id: testLessonId,
            title_ru: 'Node Test Lesson',
            subject: testSubject,
            content_ru: { text: 'Hello from Node' },
            is_published: true,
            updated_at: new Date()
        };

        console.log('4. Testing saveLesson...');
        const { error: saveLessonError } = await supabase
            .from('lessons')
            .upsert(testLesson, { onConflict: 'id' });

        if (saveLessonError) throw saveLessonError;
        console.log('✅ saveLesson OK');

        // 5. Test Get Lesson
        console.log('5. Testing getLesson...');
        const { data: loadedLesson, error: getLessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', testLessonId)
            .single();

        if (getLessonError) throw getLessonError;
        if (!loadedLesson || loadedLesson.title_ru !== 'Node Test Lesson') {
            throw new Error('Lesson verification failed: Data mismatch');
        }
        console.log('✅ getLesson OK');

        // 6. Cleanup
        console.log('6. Cleaning up...');
        await supabase.from('subject_syllabus').delete().eq('subject', testSubject);
        await supabase.from('lessons').delete().eq('id', testLessonId);
        console.log('✅ Cleanup OK');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    }
}

runTests();
