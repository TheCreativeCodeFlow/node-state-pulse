/**
 * AuthButton Component
 * 
 * Minimal, Apple-style "Continue with Google" button with smooth animations,
 * loading states, and error handling.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

interface AuthButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ onSuccess, onError }) => {
    const { signIn, loading: authLoading } = useAuth();
    const [localLoading, setLocalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loading = authLoading || localLoading;

    const handleSignIn = async () => {
        setLocalLoading(true);
        setError(null);

        try {
            await signIn();
            onSuccess?.();
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to sign in. Please try again.';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.button
                onClick={handleSignIn}
                disabled={loading}
                className="group relative flex items-center justify-center gap-3 w-full max-w-sm px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
            >
                {/* Google Logo */}
                {!loading && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.  66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                )}

                {/* Loading Spinner */}
                {loading && (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                )}

                {/* Button Text */}
                <span className="text-sm font-medium">
                    {loading ? 'Signing in...' : 'Continue with Google'}
                </span>
            </motion.button>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 text-center max-w-sm"
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
};
