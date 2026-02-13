import React, { useState } from 'react';
import { Presentation, Plus, Trash2, GripVertical, Image, Loader2, Globe } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { compressImage } from '../../utils/imageHelpers';
import { translateText } from '../../services/translationService';

const SortableSlide = ({ slide, index, onUpdate, onDelete, lang, editLang }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const captionField = editLang === 'ru' ? 'captionRu' : 'captionTj';
    const captionPlaceholder = editLang === 'ru'
        ? (lang === 'ru' ? 'Подпись (RU)' : 'Сарлавҳа (RU)')
        : (lang === 'ru' ? 'Подпись (TJ)' : 'Сарлавҳа (TJ)');

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-gaming-bg/30 rounded-xl p-4 border border-white/5"
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="mt-2 cursor-grab text-gaming-textMuted hover:text-white">
                    <GripVertical size={18} />
                </div>

                {/* Slide Content */}
                <div className="flex-1 space-y-3">
                    {/* Slide Number */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gaming-textMuted">
                            {lang === 'ru' ? 'Слайд' : 'Слайд'} #{index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onDelete(slide.id)}
                                className="p-1 text-gaming-textMuted hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Image URL */}
                    <div className="flex items-center gap-2">
                        <Image size={16} className="text-gaming-textMuted" />
                        <input
                            type="url"
                            value={slide.imageUrl || ''}
                            onChange={(e) => onUpdate(slide.id, 'imageUrl', e.target.value)}
                            placeholder={lang === 'ru' ? 'URL изображения' : 'URL тасвир'}
                            className="flex-1 bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gaming-gold/50"
                        />
                    </div>

                    {/* Image Preview */}
                    {slide.imageUrl && (
                        <div className="w-full h-32 rounded-lg overflow-hidden bg-gaming-card/50">
                            <img
                                src={slide.imageUrl}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* Caption */}
                    <input
                        type="text"
                        value={slide[captionField] || ''}
                        onChange={(e) => onUpdate(slide.id, captionField, e.target.value)}
                        placeholder={captionPlaceholder}
                        className={`w-full bg-gaming-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${editLang === 'ru' ? 'focus:border-gaming-primary/50' : 'focus:border-gaming-accent/50'
                            }`}
                    />
                </div>
            </div>
        </div>
    );
};

const SlidesEditor = ({ slidesRu = [], slidesTj = [], onChange, lang }) => {
    const [editLang, setEditLang] = useState('ru'); // 'ru' or 'tj'
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const slides = editLang === 'ru' ? slidesRu : slidesTj;
    const currentListField = editLang === 'ru' ? 'slidesRu' : 'slidesTj';

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const addSlide = () => {
        const newSlide = {
            id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            imageUrl: '',
            captionRu: '',
            captionTj: ''
        };
        onChange(currentListField, [...slides, newSlide]);
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const newSlides = await Promise.all(files.map(async (file) => {
                const compressedBase64 = await compressImage(file);
                return {
                    id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    imageUrl: compressedBase64,
                    captionRu: '',
                    captionTj: ''
                };
            }));

            onChange(currentListField, [...slides, ...newSlides]);
        } catch (error) {
            console.error("Error compressing images:", error);
            alert(lang === 'ru' ? 'Ошибка при загрузке изображений' : 'Хатогӣ ҳангоми боркунии тасвирҳо');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const updateSlide = (slideId, field, value) => {
        const updated = slides.map(s => s.id === slideId ? { ...s, [field]: value } : s);
        onChange(currentListField, updated);
    };

    const deleteSlide = (id) => {
        onChange(currentListField, slides.filter(s => s.id !== id));
    };

    const handleDragEnd = (event) => {
        if (active.id !== over.id) {
            const oldIndex = slides.findIndex((s) => s.id === active.id);
            const newIndex = slides.findIndex((s) => s.id === over.id);
            onChange(currentListField, arrayMove(slides, oldIndex, newIndex));
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg font-semibold text-gaming-gold flex items-center gap-2">
                        <Presentation size={20} />
                        {lang === 'ru' ? 'Слайды презентации' : 'Слайдҳои презентатсия'}
                    </h4>

                    {/* Language Switcher */}
                    <div className="flex p-1 bg-black/30 rounded-xl border border-white/5 w-fit">
                        <button
                            onClick={() => setEditLang('ru')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${editLang === 'ru'
                                ? 'bg-gaming-primary text-white shadow-lg'
                                : 'text-gaming-textMuted hover:text-white'
                                }`}
                        >
                            <Globe size={14} />
                            РУС
                        </button>
                        <button
                            onClick={() => setEditLang('tj')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${editLang === 'tj'
                                ? 'bg-gaming-accent text-white shadow-lg'
                                : 'text-gaming-textMuted hover:text-white'
                                }`}
                        >
                            <Globe size={14} />
                            ТОҶ
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 items-center self-end sm:self-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 bg-gaming-accent/20 text-gaming-accent rounded-xl hover:bg-gaming-accent/30 transition-colors text-sm"
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
                        {lang === 'ru' ? 'Загрузить' : 'Боркунӣ'}
                    </button>
                    <button
                        onClick={addSlide}
                        className="flex items-center gap-2 px-3 py-2 bg-gaming-gold/20 text-gaming-gold rounded-xl hover:bg-gaming-gold/30 transition-colors text-sm"
                    >
                        <Plus size={16} />
                        {lang === 'ru' ? 'Добавить' : 'Илова'}
                    </button>
                </div>
            </div>

            {/* Slide List */}
            {slides.length === 0 ? (
                <div className="text-center py-12 bg-gaming-bg/20 rounded-2xl border border-dashed border-white/10">
                    <Presentation size={48} className="mx-auto mb-3 opacity-20 text-gaming-gold" />
                    <p className="text-gaming-textMuted">
                        {lang === 'ru'
                            ? `Список слайдов (${editLang === 'ru' ? 'RU' : 'TJ'}) пуст`
                            : `Рӯйхати слайдҳо (${editLang === 'ru' ? 'RU' : 'TJ'}) холӣ аст`}
                    </p>
                    <button
                        onClick={addSlide}
                        className="mt-4 px-4 py-2 text-sm text-gaming-gold hover:underline"
                    >
                        {lang === 'ru' ? 'Создать первый слайд' : 'Якум слайдро созед'}
                    </button>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {slides.map((slide, index) => (
                                <SortableSlide
                                    key={slide.id}
                                    slide={slide}
                                    index={index}
                                    lang={lang}
                                    editLang={editLang}
                                    onUpdate={updateSlide}
                                    onDelete={deleteSlide}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};

export default SlidesEditor;
