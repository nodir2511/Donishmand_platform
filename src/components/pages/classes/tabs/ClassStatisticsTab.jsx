
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { statisticsService } from '../../../../services/statisticsService';
import { syllabusService } from '../../../../services/syllabusService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
    TrendingUp, Users, Award, BookOpen, AlertCircle, Loader2,
    ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Download
} from 'lucide-react';

const ClassStatisticsTab = ({ classData }) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState('summary'); // 'summary' или 'students'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [studentsData, setStudentsData] = useState([]);

    // Получение названий уроков из списка предметов
    const [lessonTitles, setLessonTitles] = useState({});

    useEffect(() => {
        fetchStatistics();
    }, [classData.id, viewMode]);

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            if (viewMode === 'summary') {
                const data = await statisticsService.getClassSummaryStats(classData.id);
                setSummaryData(data);

                // Предзагрузка структуры предмета если есть subject_id
                if (classData.subject_id) {
                    const structure = await syllabusService.getStructure(classData.subject_id);
                    if (structure && structure.sections) {
                        const titles = {};
                        structure.sections.forEach(sec => {
                            sec.topics.forEach(top => {
                                top.lessons.forEach(les => {
                                    titles[les.id] = les.title || les.titleTj || 'Название неизвестно';
                                });
                            });
                        });
                        setLessonTitles(titles);
                    }
                }
            } else {
                const data = await statisticsService.getStudentsDetailedStats(classData.id);
                setStudentsData(data);
            }
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            setError('Не удалось загрузить статистику. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-gaming-primary" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl flex items-center gap-4">
                <AlertCircle size={24} />
                <p>{error}</p>
            </div>
        );
    }

    // Функция экспорта в CSV
    const handleExportCSV = () => {
        if (!studentsData || studentsData.length === 0) {
            alert('Нет данных для экспорта');
            return;
        }

        const headers = ['Имя ученика', 'Пройдено тестов', 'Ср. балл', 'Открыто уроков'];
        const csvContent = [
            headers.join(','),
            ...studentsData.map(s => [
                `"${s.name}"`,
                s.totalTests,
                s.averageScore,
                s.progress?.length || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `class_${classData.name}_statistics.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in text-white">
            {/* Шапка с переключателем и кнопками */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Переключатель режимов */}
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
                    <button
                        onClick={() => setViewMode('summary')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'summary'
                                ? 'bg-gaming-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Сводка по классу
                    </button>
                    <button
                        onClick={() => setViewMode('students')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'students'
                                ? 'bg-gaming-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Аналитика по ученикам
                    </button>
                </div>

                <button
                    onClick={handleExportCSV}
                    disabled={studentsData.length === 0 && viewMode === 'students'}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                    <Download size={18} />
                    Экспорт (CSV)
                </button>
            </div>

            {viewMode === 'summary' ? (
                <SummaryView data={summaryData} lessonTitles={lessonTitles} />
            ) : (
                <StudentsDetailedView data={studentsData} lessonTitles={lessonTitles} />
            )}
        </div>
    );
};

// --- КОМПОНЕНТ СВОДКИ ---
const SummaryView = ({ data, lessonTitles }) => {
    if (!data) return null;

    // График проблемных зон (Топ 5 худших тестов)
    const chartData = data.testsBreakdown
        .slice(0, 5)
        .map(t => ({
            name: lessonTitles[t.lessonId] || 'Урок',
            score: Number(t.averageScore),
            failRate: Number(t.failRate)
        }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={<Users className="text-blue-400" size={24} />}
                    title="Учеников в классе"
                    value={data.studentsCount}
                />
                <StatCard
                    icon={<Award className="text-yellow-400" size={24} />}
                    title="Средний балл за тесты"
                    value={`${data.averageTestScore}%`}
                />
                <StatCard
                    icon={<BookOpen className="text-green-400" size={24} />}
                    title="Всего сдано тестов"
                    value={data.totalTestsTaken}
                />
            </div>

            {chartData.length > 0 && (
                <div className="bg-gaming-card border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                        <TrendingUp className="text-orange-500" />
                        Требуют внимания (Самые сложные темы)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#aaa', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#aaa' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="score" name="Средний балл" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score < 50 ? '#ef4444' : entry.score < 75 ? '#f59e0b' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {data.testsBreakdown.length > 0 ? (
                <div className="bg-gaming-card border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/10 font-medium text-gray-300">
                        Детальная статистика по тестам
                    </div>
                    <div className="divide-y divide-white/5">
                        {data.testsBreakdown.map((item, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div>
                                    <div className="font-medium">{lessonTitles[item.lessonId] || 'Неизвестный тест'}</div>
                                    <div className="text-xs text-gaming-textMuted mt-1">
                                        Сдано попыток: {item.attemptsCount}
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">Ср. балл</div>
                                        <div className={`font-bold ${Number(item.averageScore) < 50 ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.averageScore}%
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">Ошибок</div>
                                        <div className="font-medium text-orange-400">{item.failRate}%</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-gaming-card border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                    Ученики еще не проходили тесты
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, title, value }) => (
    <div className="bg-gaming-card border border-white/10 rounded-2xl p-5 flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
        <div>
            <div className="text-sm text-gray-400 mb-1">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </div>
);

// --- КОМПОНЕНТ ДЕТАЛИЗАЦИИ ПО УЧЕНИКАМ ---
const StudentsDetailedView = ({ data, lessonTitles }) => {
    const [expandedStudent, setExpandedStudent] = useState(null);

    const toggleStudent = (id) => {
        setExpandedStudent(expandedStudent === id ? null : id);
    };

    if (!data || data.length === 0) {
        return <div className="text-center py-10 text-gray-400">В классе пока нет учеников</div>;
    }

    return (
        <div className="space-y-4">
            {data.map(student => (
                <div key={student.id} className="bg-gaming-card border border-white/10 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => toggleStudent(student.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gaming-primary/20 flex items-center justify-center text-gaming-primary font-bold border border-gaming-primary/30">
                                {student.avatar ? (
                                    <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    student.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-white text-base">{student.name}</div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                                    <span>Пройдено тестов: {student.totalTests}</span>
                                    <span>Ср. балл: <strong className={student.averageScore >= 50 ? 'text-green-400' : 'text-red-400'}>{student.averageScore}%</strong></span>
                                </div>
                            </div>
                        </div>
                        {expandedStudent === student.id ? <ChevronDown /> : <ChevronRight />}
                    </button>

                    {/* Детали студента (Аккордеон) */}
                    {expandedStudent === student.id && (
                        <div className="p-5 border-t border-white/5 bg-black/20">
                            <h4 className="text-sm font-medium text-gray-400 mb-4 px-2 uppercase tracking-wider">История тестов</h4>

                            {student.tests && student.tests.length > 0 ? (
                                <div className="space-y-2">
                                    {student.tests.map((test, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                {test.is_passed ? (
                                                    <CheckCircle className="text-green-500" size={18} />
                                                ) : (
                                                    <XCircle className="text-red-500" size={18} />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium">{lessonTitles[test.lesson_id] || 'Неизвестный тест'}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={12} />
                                                        {new Date(test.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${test.is_passed ? 'text-green-400' : 'text-red-400'}`}>
                                                    {test.score}%
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {test.correct_count} / {test.total_questions} верно
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">Ученик еще не проходил тестов</div>
                            )}

                            {/* Прогресс уроков */}
                            <h4 className="text-sm font-medium text-gray-400 mb-3 mt-6 px-2 uppercase tracking-wider">Изученные материалы</h4>
                            {student.progress && student.progress.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {student.progress.map((prog, idx) => (
                                        <div key={idx} className="text-xs px-3 py-1.5 bg-gaming-primary/10 text-gaming-primary border border-gaming-primary/20 rounded-lg">
                                            Урок открыт ({new Date(prog.updated_at).toLocaleDateString()})
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-2 text-gray-500 text-sm">Материалы еще не просматривались</div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ClassStatisticsTab;
