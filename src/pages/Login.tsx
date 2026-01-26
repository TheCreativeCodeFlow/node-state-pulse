/**
 * Login Page
 * 
 * Minimal, iOS-inspired login page with Google OAuth.
 * Features clean design, smooth animations, and clear user guidance.
 */

import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import { AuthButton } from '../components/AuthButton';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Redirect if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSuccess = () => {
        // Redirect to main app after successful login
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-8"
                >
                    {/* App Logo & Title */}
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20"
                        >
                            <Network className="text-white w-10 h-10" />
                        </motion.div>

                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Node State Pulse
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Network Simulation & Learning Platform
                            </p>
                        </div>
                    </div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
                    >
                        <div className="flex flex-col gap-6">
                            {/* Welcome Text */}
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Welcome Back
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    Sign in to access your network simulations,<br />
                                    saved projects, and AI-powered insights
                                </p>
                            </div>

                            {/* Auth Button */}
                            <AuthButton onSuccess={handleSuccess} />

                            {/* Privacy Note */}
                            <div className="text-center text-xs text-slate-500">
                                <p>
                                    By continuing, you agree to our{' '}
                                    <a href="#" className="text-neon-blue hover:underline">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="#" className="text-neon-blue hover:underline">
                                        Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="grid grid-cols-3 gap-4 w-full text-center"
                    >
                        {[
                            { title: 'Secure', desc: 'Google OAuth 2.0' },
                            { title: 'Fast', desc: 'One-click login' },
                            { title: 'Private', desc: 'No passwords' },
                        ].map((feature, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <p className="text-white text-sm font-medium">{feature.title}</p>
                                <p className="text-slate-500 text-xs">{feature.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
