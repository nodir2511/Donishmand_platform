import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually verify .env
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

// MOCK DATA (Copy-pasted from syllabus.js to avoid import issues in node)
const MOCK_SYLLABUS = {
    'tj-lang': {
        sections: [
            {
                id: 'sec1',
                title: 'Морфология',
                topics: [
                    {
                        id: 'top1',
                        title: 'Имя существительное',
                        lessons: [
                            { id: 'les1', title: 'Род и число существительных', type: 'video' },
                            { id: 'les2', title: 'Падежи', type: 'text' }
                        ]
                    },
                    {
                        id: 'top2',
                        title: 'Глагол',
                        lessons: [
                            { id: 'les3', title: 'Времена глагола', type: 'video' }
                        ]
                    }
                ]
            },
            {
                id: 'sec2',
                title: 'Синтаксис',
                topics: [
                    {
                        id: 'top3',
                        title: 'Предложение',
                        lessons: [
                            { id: 'les4', title: 'Виды предложений', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    },
    'math': {
        sections: [
            {
                id: 'math_sec1',
                title: 'Алгебра',
                topics: [
                    {
                        id: 'math_top1',
                        title: 'Уравнения',
                        lessons: [
                            { id: 'math_les1', title: 'Линейные уравнения', type: 'video' }
                        ]
                    }
                ]
            }
        ]
    },
    'chem': {
        sections: [
            {
                id: 'chem_sec1',
                title: 'Общая химия',
                titleTj: 'Химияи умумӣ',
                topics: [
                    {
                        id: 'chem_top1',
                        title: 'Основные понятия химии',
                        titleTj: 'Мафҳумҳои асосии химия',
                        lessons: [
                            { id: 'chem_les1', title: 'Атомы и молекулы', titleTj: 'Атомҳо ва молекулаҳо', type: 'video' },
                            { id: 'chem_les2', title: 'Химические элементы', titleTj: 'Элементҳои химиявӣ', type: 'text' }
                        ]
                    },
                    {
                        id: 'chem_top2',
                        title: 'Строение атома',
                        titleTj: 'Сохтори атом',
                        lessons: [
                            { id: 'chem_les3', title: 'Ядро и электроны', titleTj: 'Ядро ва электронҳо', type: 'video' },
                            { id: 'chem_les4', title: 'Периодический закон', titleTj: 'Қонуни даврӣ', type: 'text' }
                        ]
                    }
                ]
            },
            {
                id: 'chem_sec2',
                title: 'Неорганическая химия',
                titleTj: 'Химияи ғайриорганикӣ',
                topics: [
                    {
                        id: 'chem_top3',
                        title: 'Основные классы соединений',
                        titleTj: 'Синфҳои асосии пайвастагиҳо',
                        lessons: [
                            { id: 'chem_les5', title: 'Оксиды и основания', titleTj: 'Оксидҳо ва асосҳо', type: 'video' },
                            { id: 'chem_les6', title: 'Кислоты и соли', titleTj: 'Кислотаҳо ва намакҳо', type: 'text' }
                        ]
                    },
                    {
                        id: 'chem_top4',
                        title: 'Металлы и неметаллы',
                        titleTj: 'Металлҳо ва ғайриметаллҳо',
                        lessons: [
                            { id: 'chem_les7', title: 'Свойства металлов', titleTj: 'Хосиятҳои металлҳо', type: 'video' }
                        ]
                    }
                ]
            },
            {
                id: 'chem_sec3',
                title: 'Органическая химия',
                titleTj: 'Химияи органикӣ',
                topics: [
                    {
                        id: 'chem_top5',
                        title: 'Введение в органику',
                        titleTj: 'Муқаддима ба органика',
                        lessons: [
                            { id: 'chem_les8', title: 'Углеводороды', titleTj: 'Карбогидридҳо', type: 'video' },
                            { id: 'chem_les9', title: 'Спирты и кислоты', titleTj: 'Спиртҳо ва кислотаҳо', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    }
};

async function seedData() {
    console.log('Seeding Supabase with initial data...');

    for (const [subject, data] of Object.entries(MOCK_SYLLABUS)) {
        console.log(`Processing ${subject}...`);

        // 1. Upsert Structure
        const { error: insertError } = await supabase
            .from('subject_syllabus')
            .upsert({
                subject: subject,
                data: data, // { sections: [...] }
                updated_at: new Date()
            }, { onConflict: 'subject' });

        if (insertError) {
            console.error(`Error inserting structure for ${subject}:`, insertError.message);
        } else {
            console.log(`✅ Structure for ${subject} updated.`);
        }

        // 2. Extracts and Upsert Lessons
        console.log(`   Seeding lessons for ${subject}...`);
        const lessons = [];
        data.sections.forEach(section => {
            section.topics.forEach(topic => {
                topic.lessons.forEach(lesson => {
                    lessons.push({
                        id: lesson.id,
                        title_ru: lesson.title,
                        title_tj: lesson.titleTj || lesson.title, // Fallback if no TJ title in mock
                        subject: subject,
                        content_ru: {
                            // Default content based on type
                            video: lesson.type === 'video' ? { url: '', descriptionRu: '' } : undefined,
                            text: lesson.type === 'text' ? { bodyRu: '<p>Content pending...</p>' } : undefined,
                            test: { questions: [] }
                        },
                        is_published: true,
                        updated_at: new Date()
                    });
                });
            });
        });

        for (const lesson of lessons) {
            // Check if lesson exists to avoid overwriting existing content if run multiple times
            // Actually, for "seeding" we might want to be careful. 
            // Let's use upsert but only if not exists? Or just simple upsert for now to fix the 406 error.
            // Since the error implies they don't exist, we can satisfy the request.
            // To be safe, let's use insert with ignore duplicates (onConflict do nothing) if possible,
            // or just check existence.

            const { data: existing } = await supabase.from('lessons').select('id').eq('id', lesson.id).single();
            if (!existing) {
                const { error: lessonError } = await supabase.from('lessons').insert(lesson);
                if (lessonError) console.error(`   Error inserting lesson ${lesson.id}:`, lessonError.message);
                else console.log(`   + Lesson ${lesson.id} created.`);
            } else {
                // console.log(`   . Lesson ${lesson.id} exists. Skipping.`);
            }
        }
    }

    console.log('Done!');
}

seedData();
