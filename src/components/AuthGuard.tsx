/**
 * AuthGuard Component
 * 
 * Protected route wrapper that ensures only authenticated users
 * can access wrapped content. Redirects to login page if not authenticated.
 */

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/useAuthStore';

interface AuthGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    redirectTo = '/login'
}) => {
    const { isAuthenticated, loading, initialized } = useAuth();
    const initialize = useAuthStore((state) => state.initialize);

    // Initialize auth listener on mount (only once)
    useEffect(() => {
        const unsubscribe = initialize();
        return () => {
            // Cleanup on unmount
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    // Show loading state while checking authentication (max 5 seconds due to timeout)
    if (!initialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    {/* Loading Spinner */}
                    <div className="w-12 h-12 border-4 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Render protected content
    return <>{children}</>;
};
