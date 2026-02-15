import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './components/pages/HomePage';
import { TRANSLATIONS } from './constants/data';

// Ленивая загрузка тяжёлых страниц (code-splitting)
const SubjectPage = React.lazy(() => import('./components/pages/SubjectPage'));
const SectionPage = React.lazy(() => import('./components/pages/SectionPage'));
const TopicPage = React.lazy(() => import('./components/pages/TopicPage'));
const LessonPage = React.lazy(() => import('./components/pages/LessonPage'));
const CreatorPage = React.lazy(() => import('./components/pages/CreatorPage'));
const AuthPage = React.lazy(() => import('./components/pages/AuthPage'));
const NotFoundPage = React.lazy(() => import('./components/pages/NotFoundPage'));

// Индикатор загрузки при переходах между страницами
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gaming-primary/30 border-t-gaming-primary rounded-full animate-spin" />
            <span className="text-gaming-textMuted text-sm">Загрузка...</span>
        </div>
    </div>
);

function AppContent() {
    const [lang, setLang] = useState('tj');
    const [userRole, setUserRole] = useState('student'); // 'student' | 'teacher'
    const t = TRANSLATIONS[lang];
    const location = useLocation();

    // Прокрутка наверх при смене маршрута
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gaming-bg font-sans text-white selection:bg-gaming-pink/30 selection:text-white overflow-hidden flex flex-col">
            <Navbar lang={lang} setLang={setLang} t={t} />

            <main className="flex-grow pt-24">
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<HomePage lang={lang} t={t} setLang={setLang} userRole={userRole} setUserRole={setUserRole} />} />
                        <Route path="/subject/:subjectId" element={<SubjectPage lang={lang} t={t} userRole={userRole} />} />
                        <Route path="/subject/:subjectId/section/:sectionId" element={<SectionPage lang={lang} t={t} userRole={userRole} />} />
                        <Route path="/subject/:subjectId/section/:sectionId/topic/:topicId" element={<TopicPage lang={lang} t={t} userRole={userRole} />} />
                        <Route path="/lesson/:lessonId" element={<LessonPage lang={lang} t={t} userRole={userRole} />} />
                        <Route path="/creator" element={<CreatorPage lang={lang} t={t} />} />
                        <Route path="/login" element={<AuthPage lang={lang} t={t} />} />
                        <Route path="*" element={<NotFoundPage lang={lang} t={t} />} />
                    </Routes>
                </Suspense>
            </main>

            <Footer t={t} />
        </div>
    );
}

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <AppContent />
        </Router>
    );
}

export default App;
