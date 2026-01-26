/**
 * useAuth Hook
 * 
 * Custom hook for accessing authentication state and methods
 * throughout the application.
 */

import { useAuthStore } from '../stores/useAuthStore';
import { AppUser } from '../types/auth';

interface UseAuth {
    user: AppUser | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuth = (): UseAuth => {
    const { user, loading, error, initialized, signIn, signOut } = useAuthStore();

    return {
        user,
        loading,
        error,
        initialized,
        isAuthenticated: !!user,
        signIn,
        signOut,
    };
};
