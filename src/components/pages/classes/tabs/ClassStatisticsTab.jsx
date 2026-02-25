
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { statisticsService } from '../../../../services/statisticsService';
import { syllabusService } from '../../../../services/syllabusService';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from 'recharts';
import {
    TrendingUp, Users, Award, BookOpen, AlertCircle, Loader2,
    ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Download,
    Trophy, Target, Filter, Calendar, User, Percent, BarChart3,
    FileSpreadsheet, FileText, HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Конфигурация периодов
const PERIOD_OPTIONS = [
    { value: 'week', label: 'За неделю' },
    { value: 'month', label: 'За месяц' },
    { value: 'all', label: 'Весь период' }
];

const ClassStatisticsTab = ({ classData }) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState('summary'); // 'summary' или 'students'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Фильтры
    const [period, setPeriod] = useState('all');
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Данные
    const [summaryData, setSummaryData] = useState(null);
    const [studentsData, setStudentsData] = useState([]);
    const [timeDynamics, setTimeDynamics] = useState([]);
    const [topStudents, setTopStudents] = useState([]);
    const [courseProgress, setCourseProgress] = useState(null);
    const [difficultQuestions, setDifficultQuestions] = useState([]);

    // Названия уроков
    const [lessonTitles, setLessonTitles] = useState({});
    // Список учеников для фильтра
    const [allStudents, setAllStudents] = useState([]);

    // Подсчёт общего количества уроков в курсе
    const [totalLessonsCount, setTotalLessonsCount] = useState(0);

    // Предзагрузка структуры предмета (для названий уроков и подсчёта)
    useEffect(() => {
        const loadStructure = async () => {
            if (!classData.subject_id) return;
            try {
                const structure = await syllabusService.getStructure(classData.subject_id);
                if (structure && structure.sections) {
                    const titles = {};
                    let count = 0;
                    structure.sections.forEach(sec => {
                        (sec.topics || []).forEach(top => {
                            (top.lessons || []).forEach(les => {
                                titles[les.id] = les.title || les.titleTj || 'Урок';
                                count++;
                            });
                        });
                    });
                    setLessonTitles(titles);
                    setTotalLessonsCount(count);
                }
            } catch (err) {
                console.error('Ошибка загрузки структуры предмета:', err);
            }
        };
        loadStructure();
    }, [classData.subject_id]);

    // Загрузка статистики при смене фильтров или режима
    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        const filters = { period, studentId: selectedStudentId };

        try {
            if (viewMode === 'summary') {
                // Параллельная загрузка всех данных
                const [summary, dynamics, top, progress, difficult] = await Promise.all([
                    statisticsService.getClassSummaryStats(classData.id, filters),
                    statisticsService.getClassTimeDynamics(classData.id, filters),
                    statisticsService.getTopStudents(classData.id),
                    totalLessonsCount > 0
                        ? statisticsService.getCourseProgressStats(classData.id, totalLessonsCount)
                        : Promise.resolve(null),
                    statisticsService.getDifficultQuestions(classData.id, filters)
                ]);

                setSummaryData(summary);
                setTimeDynamics(dynamics);
                setTopStudents(top);
                setCourseProgress(progress);
                setDifficultQuestions(difficult || []);

                // Дозагрузка названий тестов, если их нет в lessonTitles
                if (summary?.testsBreakdown?.length > 0) {
                    const missingIds = summary.testsBreakdown
                        .map(t => t.lessonId)
                        .filter(id => id && !lessonTitles[id]);
                    if (missingIds.length > 0) {
                        const extraTitles = await statisticsService.getLessonTitlesByIds(missingIds);
                        if (Object.keys(extraTitles).length > 0) {
                            setLessonTitles(prev => ({ ...prev, ...extraTitles }));
                        }
                    }
                }

                // Сохраняем список учеников для фильтра из topStudents
                if (top.length > 0 && allStudents.length === 0) {
                    // Берём полный список из курса (topStudents может быть урезан)
                    try {
                        const detailed = await statisticsService.getStudentsDetailedStats(classData.id);
                        setAllStudents(detailed.map(s => ({ id: s.id, name: s.name })));
                    } catch { }
                }
            } else {
                const data = await statisticsService.getStudentsDetailedStats(classData.id, filters);
                setStudentsData(data);

                // Дозагрузка названий из lesson_id в тестах учеников
                const allLessonIds = new Set();
                data.forEach(s => {
                    (s.tests || []).forEach(t => { if (t.lesson_id) allLessonIds.add(t.lesson_id); });
                    (s.progress || []).forEach(p => { if (p.lesson_id) allLessonIds.add(p.lesson_id); });
                });
                const missingIds = [...allLessonIds].filter(id => !lessonTitles[id]);
                if (missingIds.length > 0) {
                    const extraTitles = await statisticsService.getLessonTitlesByIds(missingIds);
                    if (Object.keys(extraTitles).length > 0) {
                        setLessonTitles(prev => ({ ...prev, ...extraTitles }));
                    }
                }

                if (allStudents.length === 0) {
                    setAllStudents(data.map(s => ({ id: s.id, name: s.name })));
                }
            }
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            setError('Не удалось загрузить статистику. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    }, [classData.id, viewMode, period, selectedStudentId, totalLessonsCount]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    // Подготовка данных для экспорта
    const getExportData = () => {
        const source = studentsData.length > 0 ? studentsData : [];
        return source.map(s => ({
            'Имя ученика': s.name,
            'Пройдено тестов': s.totalTests,
            'Ср. балл (%)': s.averageScore,
            'Открыто уроков': s.progress?.length || 0
        }));
    };

    // Экспорт CSV
    const handleExportCSV = () => {
        const rows = getExportData();
        if (rows.length === 0) { alert('Нет данных для экспорта'); return; }
        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${classData.name}_статистика.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Экспорт Excel
    const handleExportExcel = () => {
        const rows = getExportData();
        if (rows.length === 0) { alert('Нет данных для экспорта'); return; }

        const ws = XLSX.utils.json_to_sheet(rows);
        // Установка ширины колонок
        ws['!cols'] = [
            { wch: 25 }, // Имя
            { wch: 18 }, // Тестов
            { wch: 15 }, // Балл
            { wch: 18 }, // Уроков
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Статистика');
        XLSX.writeFile(wb, `${classData.name}_статистика.xlsx`);
    };

    // Экспорт PDF
    const handleExportPDF = () => {
        const rows = getExportData();
        if (rows.length === 0) { alert('Нет данных для экспорта'); return; }

        const doc = new jsPDF();
        const headers = Object.keys(rows[0]);
        const body = rows.map(r => headers.map(h => String(r[h])));

        // Заголовок документа
        doc.setFontSize(16);
        doc.text(`${classData.name} — Statistika`, 14, 20);
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('ru-RU'), 14, 28);

        // Таблица
        doc.autoTable({
            head: [headers],
            body,
            startY: 34,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [108, 93, 211] }
        });

        doc.save(`${classData.name}_statistika.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in text-white">
            {/* Шапка: Переключатель + Фильтры + Экспорт */}
            <div className="flex flex-col gap-4">
                {/* Переключатель режимов */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex bg-black/40 p-1 sm:p-1.5 rounded-2xl border border-white/5 w-full sm:w-fit">
                        <button
                            onClick={() => setViewMode('summary')}
                            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${viewMode === 'summary'
                                ? 'bg-gaming-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Сводка по классу
                        </button>
                        <button
                            onClick={() => setViewMode('students')}
                            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${viewMode === 'students'
                                ? 'bg-gaming-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Аналитика по ученикам
                        </button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleExportCSV}
                            disabled={studentsData.length === 0 && viewMode === 'students'}
                            title="Скачать CSV"
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm"
                        >
                            <Download size={14} />
                            CSV
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={studentsData.length === 0 && viewMode === 'students'}
                            title="Скачать Excel"
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm border border-green-600/20"
                        >
                            <FileSpreadsheet size={14} />
                            Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={studentsData.length === 0 && viewMode === 'students'}
                            title="Скачать PDF"
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors disabled:opacity-50 text-xs sm:text-sm border border-red-500/20"
                        >
                            <FileText size={14} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Фильтры */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Filter size={16} />
                        <span>Фильтры:</span>
                    </div>

                    {/* Фильтр по периоду */}
                    <div className="flex bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`px-4 py-2 text-xs font-medium transition-all ${period === opt.value
                                    ? 'bg-gaming-primary/20 text-gaming-primary'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Фильтр по ученику */}
                    {allStudents.length > 0 && (
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => setSelectedStudentId(e.target.value || null)}
                            className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-gaming-primary/50"
                        >
                            <option value="">Все ученики</option>
                            {allStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Основной контент */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-gaming-primary" size={40} />
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl flex items-center gap-4">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
            ) : viewMode === 'summary' ? (
                <SummaryView
                    data={summaryData}
                    timeDynamics={timeDynamics}
                    topStudents={topStudents}
                    courseProgress={courseProgress}
                    difficultQuestions={difficultQuestions}
                    lessonTitles={lessonTitles}
                    period={period}
                    selectedStudentId={selectedStudentId}
                />
            ) : (
                <StudentsDetailedView data={studentsData} lessonTitles={lessonTitles} />
            )}
        </div>
    );
};

// ===========================
// КОМПОНЕНТ СВОДКИ
// ===========================
const SummaryView = ({ data, timeDynamics, topStudents, courseProgress, difficultQuestions, lessonTitles, period, selectedStudentId }) => {
    // В отличие от ResponsiveContainer, свой ResizeObserver на явной обертке дает точные пиксели и упреждает предупреждения Recharts
    const lineChartContainerRef = useRef(null);
    const barChartContainerRef = useRef(null);
    const [w1, setW1] = useState(0);
    const [w2, setW2] = useState(0);

    useEffect(() => {
        const r1 = lineChartContainerRef.current;
        const r2 = barChartContainerRef.current;

        const ro1 = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect.width > 0) {
                setW1(entries[0].contentRect.width);
            }
        });
        const ro2 = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect.width > 0) {
                setW2(entries[0].contentRect.width);
            }
        });

        if (r1) ro1.observe(r1);
        if (r2) ro2.observe(r2);

        return () => {
            ro1.disconnect();
            ro2.disconnect();
        };
    }, []);

    if (!data) return null;

    // Данные для графика "Проблемные зоны" (Топ 5 худших тестов)
    const chartData = data.testsBreakdown
        .slice(0, 5)
        .map(t => ({
            name: (lessonTitles[t.lessonId] || 'Урок').slice(0, 20),
            score: Number(t.averageScore),
            failRate: Number(t.failRate)
        }));

    return (
        <div className="space-y-6">
            {/* KPI карточки */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    icon={<Users className="text-blue-400" size={20} />}
                    title="Учеников"
                    value={data.studentsCount}
                />
                <StatCard
                    icon={<Award className="text-yellow-400" size={20} />}
                    title="Ср. балл"
                    value={`${data.averageTestScore}%`}
                    accent={data.averageTestScore >= 80 ? 'text-green-400' : data.averageTestScore >= 50 ? 'text-yellow-400' : 'text-red-400'}
                />
                <StatCard
                    icon={<Target className="text-green-400" size={20} />}
                    title="% сдачи"
                    value={`${data.passRate}%`}
                    accent={data.passRate >= 70 ? 'text-green-400' : 'text-orange-400'}
                />
                <StatCard
                    icon={<BookOpen className="text-purple-400" size={20} />}
                    title="Тестов сдано"
                    value={data.totalTestsTaken}
                />
            </div>

            {/* Динамика успеваемости (LineChart) */}
            {timeDynamics.length > 1 && (
                <div className="bg-gaming-card border border-white/10 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-white flex items-center gap-2 flex-wrap">
                        <TrendingUp className="text-gaming-primary" size={20} />
                        Динамика успеваемости
                        {selectedStudentId && <span className="text-xs sm:text-sm font-normal text-gray-400">(выбранный ученик)</span>}
                    </h3>
                    <div ref={lineChartContainerRef} className="w-full mt-4 min-h-[250px] sm:min-h-[350px]">
                        {w1 > 0 && (
                            <LineChart width={w1} height={w1 < 640 ? 250 : 350} data={timeDynamics} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#aaa', fontSize: 11 }} />
                                <YAxis stroke="#666" tick={{ fill: '#aaa', fontSize: 11 }} domain={[0, 100]} width={35} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value, name) => {
                                        if (name === 'avgScore') return [`${value}%`, 'Ср. балл'];
                                        if (name === 'passRate') return [`${value}%`, '% сдачи'];
                                        return [value, name];
                                    }}
                                    labelFormatter={(label) => `Дата: ${label}`}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12 }}
                                    formatter={(value) => {
                                        if (value === 'avgScore') return 'Средний балл';
                                        if (value === 'passRate') return '% сдачи';
                                        return value;
                                    }}
                                />
                                <Line type="monotone" dataKey="avgScore" stroke="#6C5DD3" strokeWidth={2.5} dot={{ fill: '#6C5DD3', r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="passRate" stroke="#00E0FF" strokeWidth={2} dot={{ fill: '#00E0FF', r: 2 }} strokeDasharray="5 5" />
                            </LineChart>
                        )}
                    </div>
                </div>
            )}

            {/* Прогресс курса + Топ ученики (2 колонки) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Топ ученики */}
                {topStudents.length > 0 && (
                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold mb-4 text-white flex items-center gap-2">
                            <Trophy className="text-gaming-gold" size={20} />
                            Топ учеников
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            {topStudents.map((student, idx) => (
                                <div key={student.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    {/* Место */}
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0
                                        ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                            idx === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                                                idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                    'bg-white/10 text-gray-400 border border-white/10'
                                        }`}>
                                        {idx + 1}
                                    </div>

                                    {/* Аватар */}
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gaming-primary/20 flex items-center justify-center text-gaming-primary font-bold text-xs sm:text-sm border border-gaming-primary/30 shrink-0">
                                        {student.avatar ? (
                                            <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            student.name[0]?.toUpperCase()
                                        )}
                                    </div>

                                    {/* Имя и статистика */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-xs sm:text-sm truncate">{student.name}</div>
                                        <div className="text-[10px] sm:text-xs text-gray-500">{student.testsCount} тестов</div>
                                    </div>

                                    {/* Балл */}
                                    <div className={`text-base sm:text-lg font-bold shrink-0 ${student.avgScore >= 80 ? 'text-green-400' : student.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {student.avgScore}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Прогресс курса */}
                {courseProgress && courseProgress.studentsProgress.length > 0 && (
                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-white flex items-center gap-2">
                            <BarChart3 className="text-gaming-accent" size={20} />
                            Прогресс курса
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 mb-4">
                            Средний прогресс: <span className="text-white font-bold">{courseProgress.averagePercent}%</span>
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {courseProgress.studentsProgress.map(s => (
                                <div key={s.id} className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-20 sm:w-28 text-xs sm:text-sm truncate text-gray-300" title={s.name}>{s.name}</div>
                                    <div className="flex-1 h-3 sm:h-4 bg-black/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${s.percent}%`,
                                                background: s.percent >= 80 ? '#10b981' : s.percent >= 40 ? '#f59e0b' : '#ef4444'
                                            }}
                                        />
                                    </div>
                                    <div className="w-12 sm:w-14 text-right text-xs sm:text-sm font-medium text-gray-300">
                                        {s.opened}/{s.total}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Проблемные зоны (BarChart) */}
            {
                chartData.length > 0 && (
                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-white flex items-center gap-2">
                            <AlertCircle className="text-orange-500" size={20} />
                            Слабые места (Сложные тесты)
                        </h3>
                        <div ref={barChartContainerRef} className="w-full mt-4 min-h-[250px] sm:min-h-[350px]">
                            {w2 > 0 && (
                                <BarChart width={w2} height={w2 < 640 ? 250 : 350} data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#aaa', fontSize: 10 }} />
                                    <YAxis stroke="#666" tick={{ fill: '#aaa', fontSize: 11 }} domain={[0, 100]} width={35} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => [`${value}%`, 'Средний балл']}
                                    />
                                    <Bar dataKey="score" name="Средний балл" radius={[6, 6, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score < 50 ? '#ef4444' : entry.score < 75 ? '#f59e0b' : '#10b981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Сложные вопросы (Анализ) */}
            {difficultQuestions && difficultQuestions.length > 0 && (
                <div className="bg-gaming-card border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-3 sm:p-4 bg-red-500/5 border-b border-white/10 font-medium text-gray-300 text-sm sm:text-base flex items-center gap-2">
                        <HelpCircle size={18} className="text-red-400" />
                        Сложные вопросы — Топ провальных
                    </div>
                    <div className="divide-y divide-white/5">
                        {difficultQuestions.map((q, idx) => (
                            <div key={q.question_id || idx} className="p-3 sm:p-4 flex items-center justify-between hover:bg-white/5 transition-colors gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-xs sm:text-sm text-white" dangerouslySetInnerHTML={{ __html: q.question_text || 'Вопрос' }} />
                                    <div className="text-[10px] sm:text-xs text-gaming-textMuted mt-1 flex items-center gap-2">
                                        <span>{lessonTitles[q.lesson_id] || 'Тест'}</span>
                                        <span>·</span>
                                        <span>{q.total} попыток</span>
                                        <span>·</span>
                                        <span className="capitalize">{q.type === 'multiple_choice' ? 'Выбор' : q.type === 'matching' ? 'Соответствие' : 'Числовой'}</span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <div className={`text-sm sm:text-base font-bold px-3 py-1 rounded-lg ${q.errorRate >= 70 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            q.errorRate >= 40 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                        {q.errorRate}% ошибок
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Детальная таблица тестов */}
            {
                data.testsBreakdown.length > 0 ? (
                    <div className="bg-gaming-card border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-3 sm:p-4 bg-white/5 border-b border-white/10 font-medium text-gray-300 text-sm sm:text-base">
                            Детальная статистика по тестам
                        </div>
                        <div className="divide-y divide-white/5">
                            {data.testsBreakdown.map((item, idx) => (
                                <div key={idx} className="p-3 sm:p-4 flex items-center justify-between hover:bg-white/5 transition-colors gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-xs sm:text-sm truncate">{lessonTitles[item.lessonId] || 'Неизвестный тест'}</div>
                                        <div className="text-[10px] sm:text-xs text-gaming-textMuted mt-1">
                                            Попыток: {item.attemptsCount}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 sm:gap-6 shrink-0">
                                        <div className="text-center">
                                            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Ср. балл</div>
                                            <div className={`text-sm sm:text-base font-bold ${Number(item.averageScore) < 50 ? 'text-red-400' : 'text-green-400'}`}>
                                                {item.averageScore}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Ошибок</div>
                                            <div className="text-sm sm:text-base font-medium text-orange-400">{item.failRate}%</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gaming-card border border-white/10 rounded-2xl p-6 sm:p-8 text-center text-gray-400 text-sm">
                        {selectedStudentId ? 'У этого ученика нет результатов тестов за выбранный период' : 'Ученики ещё не проходили тесты'}
                    </div>
                )
            }
        </div >
    );
};

// ===========================
// KPI КАРТОЧКА
// ===========================
const StatCard = ({ icon, title, value, accent }) => (
    <div className="bg-gaming-card border border-white/10 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
        <div className="p-2 sm:p-2.5 bg-white/5 rounded-xl shrink-0">{icon}</div>
        <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1 truncate">{title}</div>
            <div className={`text-lg sm:text-2xl font-bold ${accent || ''}`}>{value}</div>
        </div>
    </div>
);

// ===========================
// ДЕТАЛИЗАЦИЯ ПО УЧЕНИКАМ
// ===========================
const StudentsDetailedView = ({ data, lessonTitles }) => {
    const [expandedStudent, setExpandedStudent] = useState(null);

    const toggleStudent = (id) => {
        setExpandedStudent(expandedStudent === id ? null : id);
    };

    if (!data || data.length === 0) {
        return <div className="text-center py-10 text-gray-400">В классе пока нет учеников</div>;
    }

    // Сортируем по среднему баллу (desc)
    const sorted = [...data].sort((a, b) => b.averageScore - a.averageScore);

    return (
        <div className="space-y-4">
            {sorted.map((student, idx) => (
                <div key={student.id} className="bg-gaming-card border border-white/10 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => toggleStudent(student.id)}
                        className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            {/* Место */}
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0
                                ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                    idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                                        idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-white/10 text-gray-500'}`}
                            >
                                {idx + 1}
                            </div>
                            {/* Аватар */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gaming-primary/20 flex items-center justify-center text-gaming-primary font-bold text-xs sm:text-base border border-gaming-primary/30 shrink-0">
                                {student.avatar ? (
                                    <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    student.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="text-left min-w-0">
                                <div className="font-medium text-white text-sm sm:text-base truncate">{student.name}</div>
                                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-3 flex-wrap">
                                    <span>Тестов: {student.totalTests}</span>
                                    <span>Ср. балл: <strong className={student.averageScore >= 50 ? 'text-green-400' : 'text-red-400'}>{student.averageScore}%</strong></span>
                                    <span>Уроков: {student.progress?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                        <ChevronDown size={18} className={`shrink-0 ml-1 transition-transform ${expandedStudent === student.id ? 'rotate-0' : '-rotate-90'}`} />
                    </button>

                    {/* Аккордеон с деталями */}
                    {expandedStudent === student.id && (
                        <div className="p-3 sm:p-5 border-t border-white/5 bg-black/20">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-3 sm:mb-4 px-1 sm:px-2 uppercase tracking-wider">История тестов</h4>

                            {student.tests && student.tests.length > 0 ? (
                                <div className="space-y-2">
                                    {student.tests.map((test, index) => (
                                        <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5 gap-2">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                {test.is_passed ? (
                                                    <CheckCircle className="text-green-500 shrink-0" size={16} />
                                                ) : (
                                                    <XCircle className="text-red-500 shrink-0" size={16} />
                                                )}
                                                <div className="min-w-0">
                                                    <div className="text-xs sm:text-sm font-medium truncate">{lessonTitles[test.lesson_id] || 'Неизвестный тест'}</div>
                                                    <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={10} className="shrink-0" />
                                                        <span className="truncate">{new Date(test.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className={`text-xs sm:text-sm font-bold ${test.is_passed ? 'text-green-400' : 'text-red-400'}`}>
                                                    {test.score}%
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-gray-500">
                                                    {test.correct_count}/{test.total_questions}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">Ученик ещё не проходил тестов</div>
                            )}

                            {/* Прогресс уроков */}
                            <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3 mt-4 sm:mt-6 px-1 sm:px-2 uppercase tracking-wider">Изученные материалы</h4>
                            {student.progress && student.progress.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {student.progress.map((prog, idx) => (
                                        <div key={idx} className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gaming-primary/10 text-gaming-primary border border-gaming-primary/20 rounded-lg">
                                            {lessonTitles[prog.lesson_id] || 'Урок'} ({new Date(prog.updated_at).toLocaleDateString()})
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-2 text-gray-500 text-xs sm:text-sm">Материалы ещё не просматривались</div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ClassStatisticsTab;
