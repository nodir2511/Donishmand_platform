import React, { useState, useEffect } from 'react';
import { classService } from '../../../../services/apiService';
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
            const data = await classService.getClassGrades(classId, isStudent, studentId);
            setGrades(data);
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
