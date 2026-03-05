import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Защищённый маршрут с поддержкой разных уровней доступа.
// Поддерживает два способа указания прав:
//   1. allowedRoles={['teacher', 'admin', 'super_admin']}  — массив допустимых ролей
//   2. requireTeacher / requireAdmin / requireSuperAdmin    — булевые флаги (обратная совместимость)
// Если ни один пропс не указан — доступ для любого авторизованного пользователя.
const ProtectedRoute = ({ children, allowedRoles, requireTeacher = false, requireAdmin = false, requireSuperAdmin = false }) => {
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

    // Проверка через массив allowedRoles (приоритетный способ)
    if (allowedRoles && allowedRoles.length > 0) {
        if (!profile?.role || !allowedRoles.includes(profile.role)) {
            return <Navigate to="/" replace />;
        }
        return children;
    }

    // Обратная совместимость: булевые пропсы
    // Только суперадмин
    if (requireSuperAdmin && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    // Админ или суперадмин
    if (requireAdmin && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    // Учитель, админ или суперадмин
    if (requireTeacher && profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
