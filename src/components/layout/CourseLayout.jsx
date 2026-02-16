import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import CourseSidebar from './CourseSidebar';
import { SyllabusProvider } from '../../contexts/SyllabusContext';

const CourseLayout = ({ subjectId, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <SyllabusProvider subjectId={subjectId}>
            <div className="flex min-h-[calc(100vh-6rem)]">
                {/* Боковая панель (десктоп) */}
                <div className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)]">
                    <CourseSidebar subjectId={subjectId} />
                </div>

                {/* Оверлей боковой панели (мобильный) */}
                {isSidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Выдвижная боковая панель (мобильный) */}
                <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <CourseSidebar subjectId={subjectId} />
                </div>

                {/* Основной контент */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    {/* Кнопка меню (мобильный) */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-gaming-primary text-white flex items-center justify-center shadow-xl shadow-gaming-primary/30"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {children}
                </main>
            </div>
        </SyllabusProvider>
    );
};

export default CourseLayout;
