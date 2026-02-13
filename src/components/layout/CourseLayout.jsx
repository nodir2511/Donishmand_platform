import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import CourseSidebar from './CourseSidebar';

const CourseLayout = ({ subjectId, lang, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-[calc(100vh-6rem)]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)]">
                <CourseSidebar subjectId={subjectId} lang={lang} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Mobile Sidebar Drawer */}
            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <CourseSidebar subjectId={subjectId} lang={lang} />
            </div>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-x-hidden">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-gaming-primary text-white flex items-center justify-center shadow-xl shadow-gaming-primary/30"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {children}
            </main>
        </div>
    );
};

export default CourseLayout;
