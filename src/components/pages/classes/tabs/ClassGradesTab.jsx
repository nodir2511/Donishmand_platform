import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabase';
import { Award, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ClassGradesTab = ({ classId, isStudent, studentId }) => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (classId) {
            fetchGrades();
        }
    }, [classId, isStudent, studentId]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            // Если мы смотрим как ученик, нам нужны только наши оценки.
            // Если как учитель – нам нужны оценки всех учеников класса.

            let queryUserIds = [];

            if (isStudent) {
                queryUserIds = [studentId];
            } else {
                const { data: members, error: membersErr } = await supabase
                    .from('class_members')
                    .select('student_id')
                    .eq('class_id', classId);

                if (membersErr) throw membersErr;
                queryUserIds = members.map(m => m.student_id);
            }

            if (queryUserIds.length === 0) {
                setGrades([]);
                return;
            }

            // В базе пока нет отдельной таблицы `test_results` со связью для учеников
            // Я запрашиваю `profiles`, чтобы вывести заглушку (или реальные данные, если они появятся)
            // ПРИМЕЧАНИЕ: На текущем этапе "Оценки" извлекать неоткуда (нет таблицы lesson_progress с оценками в БД)
            // Поэтому я вывожу демо-данные или сообщение об их отсутствии, чтобы структура вкладки работала.

            // Запрашиваем имена учеников (для отображения в таблице)
            const { data: users, error: usersErr } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', queryUserIds);

            if (usersErr) throw usersErr;

            // Здесь в будущем должен быть `await supabase.from('test_results').select(...)`
            // Пока просто эмулируем пустые оценки
            const mockGrades = users.map(user => ({
                id: user.id,
                name: user.full_name || 'Без имени',
                averageGrade: 0,
                testsPassed: 0
            }));

            setGrades(mockGrades);

        } catch (err) {
            console.error('Ошибка загрузки оценок:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-gaming-purple" size={32} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2 mb-6">
                <Award size={24} className="text-gaming-purple" />
                {isStudent ? 'Ваши оценки' : 'Оценки учеников'}
            </h2>

            <div className="bg-gaming-card/40 border border-white/10 rounded-2xl p-8 text-center text-gaming-textMuted">
                <Award size={48} className="mx-auto mb-4 opacity-50 text-gaming-purple" />
                <h3 className="text-xl font-medium text-white mb-2">Раздел в разработке</h3>
                <p className="max-w-md mx-auto">
                    {isStudent
                        ? 'В будущем здесь будут отображаться результаты прохождения ваших тестов и модулей.'
                        : 'В будущем здесь будут отображаться результаты всех тестов ваших учеников.'}
                </p>
            </div>
        </div>
    );
};

export default ClassGradesTab;
