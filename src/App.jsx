import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './components/pages/HomePage';

// Обёртка для React.lazy() с автоматическим перезапуском при ошибке загрузки чанка.
// После нового деплоя хеши файлов меняются, и старые ссылки возвращают 404.
// Эта функция автоматически перезагружает страницу один раз, чтобы получить новый index.html.
const lazyWithRetry = (importFn) => {
    return React.lazy(() =>
        importFn().catch((error) => {
            // Проверяем, не перезагружали ли мы уже страницу из-за этой ошибки
            const hasReloaded = sessionStorage.getItem('chunk_reload');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_reload', '1');
                window.location.reload();
                // Возвращаем промис, который никогда не завершается (страница перезагрузится)
                return new Promise(() => {});
            }
            // Если уже перезагружались — пробрасываем ошибку дальше (GlobalErrorBoundary покажет UI)
            sessionStorage.removeItem('chunk_reload');
            throw error;
        })
    );
};

// Ленивая загрузка тяжёлых страниц (code-splitting) с авто-перезагрузкой при 404
const SubjectPage = lazyWithRetry(() => import('./components/pages/SubjectPage'));
const SectionPage = lazyWithRetry(() => import('./components/pages/SectionPage'));
const TopicPage = lazyWithRetry(() => import('./components/pages/TopicPage'));
const LessonPage = lazyWithRetry(() => import('./components/pages/LessonPage'));
const CreatorPage = lazyWithRetry(() => import('./components/pages/CreatorPage'));
const AdminPage = lazyWithRetry(() => import('./components/pages/AdminPage'));
const AuthPage = lazyWithRetry(() => import('./components/pages/AuthPage'));

// Classes pages
const ClassesPage = lazyWithRetry(() => import('./components/pages/classes/ClassesPage'));
const ClassDetailsPage = lazyWithRetry(() => import('./components/pages/classes/ClassDetailsPage'));

const ProfilePage = lazyWithRetry(() => import('./components/pages/ProfilePage'));
const NotFoundPage = lazyWithRetry(() => import('./components/pages/NotFoundPage'));

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

                        {/* Защищенный маршрут для создателя курса */}
                        <Route
                            path="/creator"
                            element={
                                <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>
                                    <CreatorPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Administration Route */}
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                                <AdminPage />
                            </ProtectedRoute>
                        } />

                        {/* Classes Routes */}
                        <Route path="/classes" element={
                            <ProtectedRoute>
                                <ClassesPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/classes/:classId" element={
                            <ProtectedRoute>
                                <ClassDetailsPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/login" element={<AuthPage />} />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />

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
