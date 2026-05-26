/**
 * Landing Page - Application Entry Point
 * 
 * Professional landing page with Google Sign-In integration.
 * Auto-redirects authenticated users to dashboard.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
    Network,
    Zap,
    Brain,
    Users,
    ArrowRight,
    Chrome
} from 'lucide-react';

export default function LandingPage() {
    const { isAuthenticated, signIn, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated && !loading) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSignIn = async () => {
        try {
            await signIn();
            // Navigation handled by useEffect after auth state updates
        } catch (error) {
            console.error('Sign-in failed:', error);
        }
    };

    // Show nothing while redirecting authenticated users
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-10 w-72 h-72 bg-neon-blue/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-16">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    {/* Logo/Brand */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/50">
                            <Network className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                            Node State Pulse
                        </h1>
                    </div>

                    {/* Tagline */}
                    <p className="text-xl md:text-2xl text-slate-300 mb-4">
                        Master Network Protocols Through Interactive Simulation
                    </p>

                    <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
                        Build, simulate, and visualize network topologies with real-time packet transmission,
                        intelligent AI tutoring, and collaborative learning.
                    </p>

                    {/* CTA Button */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            onClick={handleSignIn}
                            disabled={loading}
                            size="lg"
                            className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6 rounded-2xl shadow-xl border-2 border-white/20 font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-neon-blue/20"
                        >
                            <Chrome className="w-6 h-6 mr-3" />
                            {loading ? 'Connecting...' : 'Continue with Google'}
                            <ArrowRight className="w-5 h-5 ml-3" />
                        </Button>
                    </motion.div>

                    <p className="text-sm text-slate-500 mt-4">
                        Free to use • No credit card required • Instant access
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto"
                >
                    {/* Feature 1 */}
                    <div className="glassmorphic p-6 rounded-2xl border border-white/10 hover:border-neon-blue/50 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center mb-4">
                            <Network className="w-6 h-6 text-neon-blue" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            Visual Network Builder
                        </h3>
                        <p className="text-slate-400">
                            Drag-and-drop interface to create routers, switches, and devices.
                            Build complex topologies with ease.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="glassmorphic p-6 rounded-2xl border border-white/10 hover:border-neon-purple/50 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-neon-purple" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            Real-Time Simulation
                        </h3>
                        <p className="text-slate-400">
                            Watch packets travel through your network. Visualize routing decisions
                            and protocol behavior in real-time.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="glassmorphic p-6 rounded-2xl border border-white/10 hover:border-neon-cyan/50 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center mb-4">
                            <Brain className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            AI-Powered Tutor
                        </h3>
                        <p className="text-slate-400">
                            Get instant help from your AI tutor. Ask questions, analyze logs,
                            and understand complex network concepts.
                        </p>
                    </div>
                </motion.div>

                {/* Secondary CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center mt-16"
                >
                    <p className="text-slate-400 mb-4">
                        Perfect for students, educators, and network professionals
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Collaborative Learning
                        </span>
                        <span>•</span>
                        <span>Session Management</span>
                        <span>•</span>
                        <span>Progress Tracking</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
