/**
 * Sessions Page
 * 
 * Dashboard where authenticated users can:
 * - View their saved simulation sessions
 * - Create new sessions
 * - Continue existing sessions
 * - Delete old sessions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus,
    Play,
    Trash2,
    Clock,
    Network,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '@/lib/utils';

interface Session {
    id: string;
    name: string;
    lastModified: string;
    deviceCount: number;
    connectionCount: number;
    thumbnail?: string;
}

// Mock sessions data (in real app, fetch from Firestore)
const mockSessions: Session[] = [
    {
        id: '1',
        name: 'Campus Network Setup',
        lastModified: '2 hours ago',
        deviceCount: 8,
        connectionCount: 12,
    },
    {
        id: '2',
        name: 'Home Router Configuration',
        lastModified: '1 day ago',
        deviceCount: 5,
        connectionCount: 6,
    },
];

export const SessionsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>(mockSessions);

    const handleCreateNew = () => {
        // Navigate to simulator with new session
        navigate('/simulator');
    };

    const handleContinueSession = (sessionId: string) => {
        // In real app, load session data from Firestore
        navigate(`/simulator?session=${sessionId}`);
    };

    const handleDeleteSession = (sessionId: string) => {
        setSessions(sessions.filter(s => s.id !== sessionId));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
                            <Network className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-white">Node State Pulse</h1>
                            <p className="text-xs text-slate-400">Network Simulation Platform</p>
                        </div>
                    </div>

                    {/* User Info */}
                    {user && (
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{user.displayName}</p>
                                <p className="text-xs text-slate-400">{user.role}</p>
                            </div>
                            {user.photoURL && (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="w-10 h-10 rounded-full border-2 border-white/10"
                                />
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-4xl font-bold text-white mb-2">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}! 👋
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Choose a session to continue or start a new simulation
                    </p>
                </motion.div>

                {/* Create New Session Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <Card
                        onClick={handleCreateNew}
                        className="glass-card border-neon-blue/30 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 p-8 cursor-pointer hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/20 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/30 group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                        Create New Session
                                        <Sparkles className="w-5 h-5 text-neon-purple" />
                                    </h3>
                                    <p className="text-slate-400">
                                        Start a fresh network simulation from scratch
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-neon-blue group-hover:translate-x-2 transition-transform" />
                        </div>
                    </Card>
                </motion.div>

                {/* Existing Sessions */}
                {sessions.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Your Sessions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                >
                                    <Card className="glass-card p-6 hover:border-white/20 transition-all group cursor-pointer">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                                                <Network className="w-6 h-6 text-neon-cyan" />
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session.id);
                                                }}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <h4 className="text-lg font-semibold text-white mb-2">{session.name}</h4>

                                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {session.lastModified}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm mb-4">
                                            <span className="text-neon-blue">{session.deviceCount} devices</span>
                                            <span className="text-neon-purple">{session.connectionCount} connections</span>
                                        </div>

                                        <Button
                                            onClick={() => handleContinueSession(session.id)}
                                            className="w-full bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30 hover:border-neon-blue/50"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Continue Session
                                        </Button>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {sessions.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center py-12"
                    >
                        <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center mx-auto mb-4">
                            <Network className="w-12 h-12 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No sessions yet</h3>
                        <p className="text-slate-400 mb-6">Create your first network simulation to get started</p>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default SessionsPage;
