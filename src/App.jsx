import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './components/pages/HomePage';
import SubjectPage from './components/pages/SubjectPage';
import SectionPage from './components/pages/SectionPage';
import TopicPage from './components/pages/TopicPage';
import LessonPage from './components/pages/LessonPage';
import CreatorPage from './components/pages/CreatorPage';
import { TRANSLATIONS } from './constants/data';

function AppContent() {
    const [lang, setLang] = useState('tj');
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
                <Routes>
                    <Route path="/" element={<HomePage lang={lang} t={t} setLang={setLang} />} />
                    <Route path="/subject/:subjectId" element={<SubjectPage lang={lang} t={t} />} />
                    <Route path="/subject/:subjectId/section/:sectionId" element={<SectionPage lang={lang} t={t} />} />
                    <Route path="/subject/:subjectId/section/:sectionId/topic/:topicId" element={<TopicPage lang={lang} t={t} />} />
                    <Route path="/lesson/:lessonId" element={<LessonPage lang={lang} t={t} />} />
                    <Route path="/creator" element={<CreatorPage lang={lang} t={t} />} />
                </Routes>
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
