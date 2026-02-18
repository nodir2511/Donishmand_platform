import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Plus, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TestQuestionList from './test/TestQuestionList';
import QuestionForm from './test/QuestionForm';

const QUESTION_TYPES = [
    { id: 'multiple_choice', icon: ClipboardList, label: 'creator.singleChoice' },
    { id: 'matching', icon: ClipboardList, label: 'creator.matching' },
    { id: 'numeric', icon: ClipboardList, label: 'creator.numeric' },
];

const TestEditor = ({ data, onChange, lang }) => {
    const { t } = useTranslation();
    const questions = data.questions || [];

    // UI State
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Actions ---

    const handleAddQuestion = (type) => {
        const newQuestion = {
            id: `new_${Date.now()}`, // Temporary ID for new question
            type,
            textRu: '', textTj: '', imageRu: null, imageTj: null,
            // Init based on type
            ...(type === 'multiple_choice' ? {
                options: Array(4).fill(null).map((_, i) => ({
                    id: `opt_${Date.now()}_${i}`,
                    textRu: '',
                    textTj: '',
                    imageRu: null,
                    imageTj: null
                })),
                correctId: null
            } : {}),
            ...(type === 'matching' ? {
                leftItems: ['A', 'B', 'C', 'D'].map(id => ({
                    id,
                    textRu: '',
                    textTj: '',
                    imageRu: null,
                    imageTj: null
                })),
                rightItems: ['1', '2', '3', '4', '5'].map(id => ({
                    id,
                    textRu: '',
                    textTj: '',
                    imageRu: null,
                    imageTj: null
                })),
                correctMatches: {}
            } : {}),
            ...(type === 'numeric' ? { digits: ['', '', '', ''], unit: '' } : {})
        };

        setEditingQuestionId(newQuestion.id);
        // We temporarily store the new question in state only when passing to modal
        // But to simplify, we can add it to list immediately? 
        // Better pattern: Modal works on a detached object. On save, we add/update.
        // So we need a "draft" state.
        setDraftQuestion(newQuestion);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const [draftQuestion, setDraftQuestion] = useState(null);

    const handleEditQuestion = (question) => {
        setEditingQuestionId(question.id);
        setDraftQuestion(question);
        setIsModalOpen(true);
    };

    const handleDeleteQuestion = (id) => {
        if (!window.confirm(t('creator.confirmDelete'))) return;
        onChange({ ...data, questions: questions.filter(q => q.id !== id) });
    };

    const handleSaveQuestion = (updatedQuestion) => {
        let newQuestions = [...questions];

        if (updatedQuestion.id.startsWith('new_')) {
            // It's a new question, replace temp ID with permanent one?
            // Actually, keep unique timestamp ID is fine, just remove 'new_' prefix if we want
            // or just treat it as a valid ID. Let's update ID to be sure.
            const finalQuestion = { ...updatedQuestion, id: updatedQuestion.id.replace('new_', 'q_') };
            newQuestions.push(finalQuestion);
        } else {
            // Update existing
            const index = newQuestions.findIndex(q => q.id === updatedQuestion.id);
            if (index !== -1) newQuestions[index] = updatedQuestion;
        }

        onChange({ ...data, questions: newQuestions });
        setIsModalOpen(false);
        setDraftQuestion(null);
        setEditingQuestionId(null);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = questions.findIndex(q => q.id === active.id);
            const newIndex = questions.findIndex(q => q.id === over.id);
            onChange({ ...data, questions: arrayMove(questions, oldIndex, newIndex) });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gaming-pink flex items-center gap-2">
                    <ClipboardList size={20} />
                    {t('creator.testQuestions')}
                    <span className="text-sm font-normal text-gaming-textMuted ml-2">({questions.length})</span>
                </h4>

                <div className="relative">
                    <button
                        onClick={() => setActiveMenu(activeMenu === 'top' ? null : 'top')}
                        className="flex items-center gap-2 px-3 py-2 bg-gaming-pink/20 text-gaming-pink rounded-xl hover:bg-gaming-pink/30 transition-colors text-sm"
                    >
                        <Plus size={16} />
                        {t('creator.addQuestion')}
                        <ChevronDown size={14} />
                    </button>
                    {activeMenu === 'top' && (
                        <div className="absolute right-0 top-full mt-2 bg-gaming-card border border-white/10 rounded-xl shadow-xl z-20 min-w-[200px] overflow-hidden">
                            {QUESTION_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleAddQuestion(type.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    {/* <type.icon size={18} className="text-gaming-pink" /> */}
                                    <span className="text-sm">{t(type.label)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    <TestQuestionList
                        questions={questions}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                        lang={lang}
                    />
                </SortableContext>
            </DndContext>

            {questions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl bg-white/5 text-gaming-textMuted">
                    <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                    <p>{t('creator.noQuestions')}</p>
                    <p className="text-sm opacity-50">{t('creator.addFirstQuestion')}</p>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && draftQuestion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
                    <QuestionForm
                        question={draftQuestion}
                        onSave={handleSaveQuestion}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default TestEditor;
