import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireTeacher = false, requireSuperAdmin = false }) => {
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
        // Redirect to login, saving the location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireSuperAdmin && profile?.role !== 'super_admin') {
        // Redirect to home if user is not a super admin
        return <Navigate to="/" replace />;
    }

    if (requireTeacher && profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        // Redirect to home if user is not a teacher/admin/super_admin but tries to access teacher route
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
