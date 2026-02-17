import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Защищённый маршрут с поддержкой разных уровней доступа
const ProtectedRoute = ({ children, requireTeacher = false, requireAdmin = false, requireSuperAdmin = false }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gaming-bg">
                <Loader2 size={40} className="text-gaming-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        // Перенаправление на логин с сохранением текущего маршрута
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Только суперадмин
    if (requireSuperAdmin && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    // Админ или суперадмин
    if (requireAdmin && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    // Учитель с правами, админ или суперадмин
    if (requireTeacher && profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
