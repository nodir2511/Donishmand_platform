import React, { useState } from 'react';
import { X, Save, Video, FileText, ClipboardList, Presentation, Loader2 } from 'lucide-react';
import VideoEditor from './VideoEditor';
import TextEditor from './TextEditor';
import TestEditor from './TestEditor';
import SlidesEditor from './SlidesEditor';

const TABS = [
    { id: 'video', icon: Video, label: { ru: 'Видео', tj: 'Видео' } },
    { id: 'text', icon: FileText, label: { ru: 'Текст', tj: 'Матн' } },
    { id: 'test', icon: ClipboardList, label: { ru: 'Тест', tj: 'Тест' } },
    { id: 'slides', icon: Presentation, label: { ru: 'Слайды', tj: 'Слайдҳо' } },
];

const LessonContentEditor = ({ lesson, onSave, onClose, lang, isSaving }) => {
    const [activeTab, setActiveTab] = useState('video');
    const [content, setContent] = useState(lesson.content || {
        video: { url: '', descriptionRu: '', descriptionTj: '' },
        text: { bodyRu: '', bodyTj: '' },
        test: { questions: [] },
        slidesRu: [],
        slidesTj: []
    });

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const handleContentChange = (tabId, data) => {
        setContent(prev => ({ ...prev, [tabId]: data }));
    };

    const handleSave = () => {
        onSave({ ...lesson, content });
        // Не закрываем здесь, закрытие будет после успешного сохранения в родителе
        // Но если родитель просто обновляет стейт, то закроем?
        // Лучше передать ответственность за закрытие родителю или ждать успешного промиса.
        // Для простоты: Родитель сам решит когда закрыть (после await save).
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4">
            <div className="w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] bg-gaming-card/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                            {lang === 'ru' ? 'Редактирование' : 'Таҳрир'}
                        </h2>
                        <p className="text-gaming-textMuted mt-1 text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
                            {lang === 'tj' ? (lesson.titleTj || lesson.title) : lesson.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-2 text-gaming-textMuted hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 overflow-x-auto shrink-0 no-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm sm:text-base ${isActive
                                    ? 'bg-gaming-primary text-white'
                                    : 'bg-gaming-bg/50 text-gaming-textMuted hover:text-white'
                                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                {tab.label[lang]}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pointer-events-auto">
                    {isSaving && <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center"><Loader2 size={40} className="animate-spin text-gaming-primary" /></div>}
                    {activeTab === 'video' && (
                        <VideoEditor
                            data={content.video || {}}
                            onChange={(data) => handleContentChange('video', data)}
                            lang={lang}
                        />
                    )}
                    {activeTab === 'text' && (
                        <TextEditor
                            data={content.text || {}}
                            onChange={(data) => handleContentChange('text', data)}
                            lang={lang}
                        />
                    )}
                    {activeTab === 'test' && (
                        <TestEditor
                            data={content.test || { questions: [] }}
                            onChange={(data) => handleContentChange('test', data)}
                            lang={lang}
                        />
                    )}
                    {activeTab === 'slides' && (
                        <SlidesEditor
                            slidesRu={content.slidesRu || []}
                            slidesTj={content.slidesTj || []}
                            onChange={(field, data) => setContent(prev => ({ ...prev, [field]: data }))}
                            lang={lang}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-white/10 shrink-0 bg-gaming-card/95">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gaming-textMuted hover:text-white transition-colors disabled:opacity-50"
                    >
                        {lang === 'ru' ? 'Отмена' : 'Бекор'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gaming-primary text-white rounded-xl hover:bg-gaming-primary/80 transition-colors active:scale-95 text-sm sm:text-base disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {lang === 'ru' ? (isSaving ? 'Сохранение...' : 'Сохранить') : (isSaving ? 'Сабт мешавад...' : 'Нигоҳ доштан')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonContentEditor;
