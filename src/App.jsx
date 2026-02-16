import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './components/pages/HomePage';

// Ленивая загрузка тяжёлых страниц (code-splitting)
const SubjectPage = React.lazy(() => import('./components/pages/SubjectPage'));
const SectionPage = React.lazy(() => import('./components/pages/SectionPage'));
const TopicPage = React.lazy(() => import('./components/pages/TopicPage'));
const LessonPage = React.lazy(() => import('./components/pages/LessonPage'));
const CreatorPage = React.lazy(() => import('./components/pages/CreatorPage'));
const AdminPage = React.lazy(() => import('./components/pages/AdminPage'));
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

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// ... (existing imports)

function AppContent() {
    const { i18n } = useTranslation();
    const location = useLocation();

    // Прокрутка наверх при смене маршрута
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gaming-bg font-sans text-white selection:bg-gaming-pink/30 selection:text-white overflow-hidden flex flex-col">
            <Navbar />

            <main className="flex-grow pt-24">
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/subject/:subjectId" element={<SubjectPage />} />
                        <Route path="/subject/:subjectId/section/:sectionId" element={<SectionPage />} />
                        <Route path="/subject/:subjectId/section/:sectionId/topic/:topicId" element={<TopicPage />} />
                        <Route path="/lesson/:lessonId" element={<LessonPage />} />

                        {/* Protected Route for Creator */}
                        <Route
                            path="/creator"
                            element={
                                <ProtectedRoute requireTeacher={true}>
                                    <CreatorPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requireSuperAdmin={true}>
                                    <AdminPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/login" element={<AuthPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </main>

            <Footer />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router basename={import.meta.env.BASE_URL}>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
