
/**
 * Скрипт для резервного копирования учебных планов из Supabase.
 * Сохраняет данные в папку backups/
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env');

// Простая функция загрузки .env
const env = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(function(line) {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/['"]/g, '');
            if (key && value) env[key] = value;
        }
    });
} catch (e) {
    console.error('❌ Не удалось прочитать .env файл');
    process.exit(1);
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function backup() {
    console.log('📦 Начинаю резервное копирование...');
    
    try {
        const { data, error } = await supabase.from('subject_syllabus').select('*');
        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️ Таблица subject_syllabus пуста. Нечего копировать.');
            return;
        }

        const date = new Date().toISOString().split('T')[0];
        const backupDir = path.resolve(rootDir, 'backups');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const fileName = `syllabus_backup_${date}.json`;
        const filePath = path.resolve(backupDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`✅ Бэкап успешно создан: ${filePath}`);
        console.log(`📊 Всего предметов сохранено: ${data.length}`);
    } catch (err) {
        console.error('❌ Ошибка при создании бэкапа:', err.message);
    }
}

backup();
