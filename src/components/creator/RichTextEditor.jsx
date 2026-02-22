import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import Mathematics from '@tiptap/extension-mathematics';
import { supabase } from '../../services/supabase';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Undo, Redo,
    Heading1, Heading2, Heading3,
    Subscript as SubIcon, Superscript as SupIcon,
    Palette, Sigma
} from 'lucide-react';

// Палитра цветов в стиле Dark Gaming UI
const COLORS = [
    '#FFFFFF',
    '#6C5DD3',
    '#00E0FF',
    '#FF49DB',
    '#FFD700',
    '#8E8EA0',
    '#FF4444',
    '#44FF44',
];

const MenuBar = ({ editor, minimal }) => {
    if (!editor) {
        return null;
    }

    const Button = ({ onClick, isActive, disabled, children, title }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-gaming-primary text-white' : 'text-gaming-textMuted hover:text-white hover:bg-gaming-card/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-wrap gap-1 p-2 bg-gaming-card/30 border-b border-white/5">
            {/* Отмена / Повтор */}
            <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-1">
                <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Отмена">
                    <Undo size={16} />
                </Button>
                <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Повтор">
                    <Redo size={16} />
                </Button>
            </div>

            {/* Форматирование текста */}
            <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-1">
                <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Жирный">
                    <Bold size={16} />
                </Button>
                <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Курсив">
                    <Italic size={16} />
                </Button>
                <Button onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Подчеркнутый">
                    <UnderlineIcon size={16} />
                </Button>
                {!minimal && (
                    <Button onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Зачеркнутый">
                        <Strikethrough size={16} />
                    </Button>
                )}
            </div>

            {/* Индексы и степени */}
            <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-1">
                <Button onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Нижний индекс (H₂O)">
                    <SubIcon size={16} />
                </Button>
                <Button onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Верхний индекс (x²)">
                    <SupIcon size={16} />
                </Button>
            </div>

            {/* Заголовки - скрываем в минимальном режиме */}
            {!minimal && (
                <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-1">
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Заголовок 1">
                        <Heading1 size={16} />
                    </Button>
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Заголовок 2">
                        <Heading2 size={16} />
                    </Button>
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Заголовок 3">
                        <Heading3 size={16} />
                    </Button>
                </div>
            )}

            {/* Списки - скрываем в минимальном режиме */}
            {!minimal && (
                <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-1">
                    <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Маркированный список">
                        <List size={16} />
                    </Button>
                    <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Нумерованный список">
                        <ListOrdered size={16} />
                    </Button>
                </div>
            )}

            {/* Выравнивание - скрываем в минимальном режиме */}
            {!minimal && (
                <div className="flex gap-0.5 border-r border-white/10 pr-2 mr-1">
                    <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="По левому краю">
                        <AlignLeft size={16} />
                    </Button>
                    <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="По центру">
                        <AlignCenter size={16} />
                    </Button>
                    <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="По правому краю">
                        <AlignRight size={16} />
                    </Button>
                </div>
            )}

            {/* Формулы (LaTeX / KaTeX) */}
            <div className="flex gap-0.5 items-center border-r border-white/10 pr-2 mr-1">
                <Button
                    onClick={() => {
                        const formula = prompt('Введите формулу LaTeX (например: x^2 + y^2 = r^2):', 'x^2 + y^2 = r^2');
                        if (formula) {
                            editor.chain().focus().insertContent(`$${formula}$`).run();
                        }
                    }}
                    title="Вставить формулу (LaTeX)"
                >
                    <Sigma size={16} />
                </Button>
            </div>

            {/* Палитра цветов */}
            <div className="flex gap-0.5 items-center pl-1">
                {/* ... existing color palette implementation ... */}
                <div className="flex items-center gap-1 bg-gaming-bg/50 rounded-lg p-1">
                    <Palette size={14} className="text-gaming-textMuted ml-1" />
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => editor.chain().focus().setColor(color).run()}
                            className={`w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-white' : ''}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Основной компонент редактора
const RichTextEditor = ({ content, onChange, placeholder, minHeight = '200px', minimal = false, className = '' }) => {
    const fileInputRef = React.useRef(null);

    const addImage = async (file) => {
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            if (editor) {
                editor.chain().focus().setImage({ src: data.publicUrl }).run();
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Ошибка загрузки изображения');
        }
    };

    const handlePaste = (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                event.preventDefault();
                const file = item.getAsFile();
                addImage(file);
                return;
            }
        }
    };

    const uploadImage = () => {
        fileInputRef.current?.click();
    };

    // Мемоизируем расширения для предотвращения пересоздания при каждом рендере, что может вызвать предупреждения "Duplicate extension"
    // особенно в React Strict Mode или во время hot-reload'ов.
    const extensions = React.useMemo(() => [
        StarterKit,
        Subscript,
        Superscript,
        TextStyle,
        Color,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Image.configure({
            inline: true,
            allowBase64: true,
        }),
        Mathematics.configure({
            katexOptions: {
                throwOnError: false,
            },
        }),
    ], []);

    const editor = useEditor({
        extensions: extensions,
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-invert max-w-none focus:outline-none px-4 py-3 text-white ${minimal ? 'text-sm' : ''}`,
                style: `min-height: ${minHeight}`,
            },
            handlePaste: (view, event) => {
                handlePaste(event);
                const items = (event.clipboardData || event.originalEvent.clipboardData).items;
                for (const item of items) {
                    if (item.kind === 'file' && item.type.startsWith('image/')) {
                        return true;
                    }
                }
                return false;
            }
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Предотвращаем бесконечный цикл обновлений и сброс курсора, 
            // но для внешних изменений (например, перевод) нужно обновлять
            if (editor.getText() === '' && content === '') return;
            // Простая проверка на равенство контента может быть недостаточной, но пока оставим как есть.
            // Важно: setContent сбрасывает курсор.
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className={`bg-gaming-bg/50 border border-white/10 rounded-xl overflow-hidden focus-within:border-gaming-primary/50 transition-colors ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => addImage(e.target.files[0])}
            />
            <MenuBar editor={editor} minimal={minimal} />
            <EditorContent editor={editor} style={{ minHeight }} />
        </div>
    );
};

export default RichTextEditor;
