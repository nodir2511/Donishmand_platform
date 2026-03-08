/**
 * Скрипт для обслуживания базы данных Donishmand Platform.
 * Объединяет функции сидинга (seed) и проверки (verify).
 * 
 * Использование:
 * node db_maintenance.js --seed    - Заполнить базу начальными данными
 * node db_maintenance.js --verify  - Проверить работоспособность CRUD
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Загрузка переменных окружения
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/['"]/g, '');
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Ошибка: В файле .env отсутствуют параметры Supabase.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// MOCK DATA (Начальные данные)
// ==========================================
const MOCK_SYLLABUS = {
    'math': {
        sections: [
            {
                id: 'math_sec1', title: 'Алгебра', titleTj: 'Алгебра',
                topics: [{
                    id: 'math_top1', title: 'Уравнения', titleTj: 'Муодилаҳо',
                    lessons: [{ id: 'math_les1', title: 'Линейные уравнения', titleTj: 'Муодилаҳои хаттӣ', type: 'video' }]
                }]
            }
        ]
    },
    'chem': {
        sections: [
            {
                id: 'chem_sec1', title: 'Общая химия', titleTj: 'Химияи умумӣ',
                topics: [
                    {
                        id: 'chem_top1', title: 'Основные понятия химии', titleTj: 'Мафҳумҳои асосии химия',
                        lessons: [
                            { id: 'chem_les1', title: 'Атомы и молекулы', titleTj: 'Атомҳо ва молекулаҳо', type: 'video' },
                            { id: 'chem_les2', title: 'Химические элементы', titleTj: 'Элементҳои химиявӣ', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    }
};

// ==========================================
// ФУНКЦИИ
// ==========================================

async function seed() {
    console.log('🚀 Заполнение базы данных начальными данными...');
    for (const [subject, data] of Object.entries(MOCK_SYLLABUS)) {
        console.log(`- Обработка предмета: ${subject}`);
        const { error: sError } = await supabase.from('subject_syllabus').upsert({ subject, data, updated_at: new Date() }, { onConflict: 'subject' });
        if (sError) console.error(`  ❌ Ошибка структуры: ${sError.message}`);
        else console.log(`  ✅ Структура сохранена.`);

        const lessons = [];
        data.sections.forEach(s => s.topics.forEach(t => t.lessons.forEach(l => {
            lessons.push({ id: l.id, title_ru: l.title, title_tj: l.titleTj || l.title, subject, content_ru: { video: l.type === 'video' ? { url: '' } : undefined, text: l.type === 'text' ? { bodyRu: 'Заглушка' } : undefined, test: { questions: [] } }, is_published: true, updated_at: new Date() });
        })));

        for (const lesson of lessons) {
            const { data: exists } = await supabase.from('lessons').select('id').eq('id', lesson.id).maybeSingle();
            if (!exists) {
                const { error: lError } = await supabase.from('lessons').insert(lesson);
                if (lError) console.error(`  ❌ Ошибка урока ${lesson.id}: ${lError.message}`);
                else console.log(`  + Урок ${lesson.id} создан.`);
            }
        }
    }
    console.log('✨ Сидинг завершен.');
}

async function verify() {
    console.log('🧪 Проверка работоспособности CRUD...');
    try {
        const { error: connError } = await supabase.from('subject_syllabus').select('subject').limit(1);
        if (connError) throw connError;
        console.log('✅ Соединение с БД установлено.');

        const testId = 'verify_test_' + Date.now();
        const { error: insError } = await supabase.from('lessons').insert({ id: testId, title_ru: 'Verify Test', subject: 'verify' });
        if (insError) throw insError;
        console.log('✅ Запись в таблицу lessons работает.');

        const { data, error: selError } = await supabase.from('lessons').select('id').eq('id', testId).single();
        if (selError || !data) throw new Error('Не удалось прочитать созданную запись.');
        console.log('✅ Чтение из таблицы lessons работает.');

        await supabase.from('lessons').delete().eq('id', testId);
        console.log('✅ Удаление работает.');
        console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО');
    } catch (e) {
        console.error('\n❌ ОШИБКА ПРОВЕРКИ:', e.message);
        process.exit(1);
    }
}

// ==========================================
// ЗАПУСК
// ==========================================
const args = process.argv.slice(2);
if (args.includes('--seed')) await seed();
else if (args.includes('--verify')) await verify();
else {
    console.log(`Donishmand DB Maintenance
Использование:
  node db_maintenance.js --seed    - Заполнить базу
  node db_maintenance.js --verify  - Проверить базу`);
}
process.exit(0);
