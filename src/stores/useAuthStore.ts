/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state globally.
 * Properly handles Firebase auth initialization with error handling.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppUser, AuthState } from '../types/auth';
import { signInWithGoogle as firebaseSignIn, signOut as firebaseSignOut, subscribeToAuthState } from '../services/auth';

interface AuthStore extends AuthState {
    // Actions
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: AppUser | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    initialize: () => () => void;
}

// Track if already initialized to prevent double-init
let isInitialized = false;
let unsubscribeFunction: (() => void) | null = null;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state - start NOT loading, wait for explicit init
            user: null,
            loading: false,
            error: null,
            initialized: false,

            // Initialize auth listener - returns unsubscribe function
            initialize: () => {
                // Prevent double initialization
                if (isInitialized) {
                    console.log('Auth already initialized');
                    return unsubscribeFunction || (() => { });
                }

                isInitialized = true;
                set({ loading: true });

                try {
                    console.log('Initializing Firebase auth listener...');

                    const unsubscribe = subscribeToAuthState((user) => {
                        console.log('Auth state changed:', user ? user.email : 'No user');
                        set({ user, loading: false, initialized: true, error: null });
                    });

                    unsubscribeFunction = unsubscribe;

                    // Safety timeout - if no response in 5 seconds, assume not logged in
                    setTimeout(() => {
                        const state = get();
                        if (!state.initialized) {
                            console.log('Auth timeout - assuming not logged in');
                            set({ user: null, loading: false, initialized: true });
                        }
                    }, 5000);

                    return unsubscribe;
                } catch (error: any) {
                    console.error('Auth initialization error:', error);
                    set({
                        loading: false,
                        initialized: true,
                        error: 'Failed to initialize authentication',
                        user: null
                    });
                    return () => { };
                }
            },

            // Sign in with Google
            signIn: async () => {
                set({ loading: true, error: null });
                try {
                    const user = await firebaseSignIn();
                    set({ user, loading: false, error: null });
                } catch (error: any) {
                    set({
                        loading: false,
                        error: error.message || 'Failed to sign in',
                        user: null
                    });
                    throw error;
                }
            },

            // Sign out
            signOut: async () => {
                set({ loading: true, error: null });
                try {
                    await firebaseSignOut();
                    set({ user: null, loading: false, error: null });
                } catch (error: any) {
                    set({
                        loading: false,
                        error: error.message || 'Failed to sign out'
                    });
                    throw error;
                }
            },

            // Set user (called by auth state listener)
            setUser: (user) => set({ user }),

            // Set loading state
            setLoading: (loading) => set({ loading }),

            // Set error message
            setError: (error) => set({ error }),
        }),
        {
            name: 'auth-storage',
            // Only persist user data
            partialize: (state) => ({
                user: state.user,
            }),
            // When rehydrating, mark as needing initialization
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // If there's a persisted user, we're "initialized" but should still verify
                    state.initialized = false;
                    state.loading = false;
                }
            },
        }
    )
);
