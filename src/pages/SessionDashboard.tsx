/**
 * Session Dashboard - Session Management Hub
 * 
 * Central page for creating new sessions and managing existing ones.
 * Displays user's sessions with ability to join/resume/delete.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
    Plus,
    LogOut,
    User,
    Clock,
    PlayCircle,
    Trash2,
    Network
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateSessionModal } from '@/components/CreateSessionModal';

export default function SessionDashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]); // TODO: Replace with actual session data

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Sign out error:', error);
            toast.error('Failed to sign out');
        }
    };

    const handleCreateSession = () => {
        setIsCreateModalOpen(true);
    };

    const handleSessionCreated = (sessionId: string) => {
        // Navigate to the newly created session
        navigate(`/session/${sessionId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                            <Network className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                            Node State Pulse
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="w-8 h-8 rounded-full"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-neon-blue" />
                                </div>
                            )}
                            <span className="text-sm text-slate-300">{user?.displayName || user?.email}</span>
                        </div>

                        {/* Sign Out Button */}
                        <Button
                            onClick={handleSignOut}
                            variant="outline"
                            size="sm"
                            className="border-white/20 hover:border-white/40"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-4xl font-bold text-white mb-2">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'there'}! 👋
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Ready to continue learning? Create a new session or resume where you left off.
                    </p>
                </motion.div>

                {/* Create Session Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <Button
                        onClick={handleCreateSession}
                        size="lg"
                        className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-neon-blue/20"
                    >
                        <Plus className="w-6 h-6 mr-2" />
                        Create New Session
                    </Button>
                </motion.div>

                {/* Sessions List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-2xl font-bold text-white mb-6">Your Sessions</h3>

                    {sessions.length === 0 ? (
                        // Empty State
                        <div className="glassmorphic border border-white/10 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                                <Network className="w-10 h-10 text-slate-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-white mb-2">
                                No sessions yet
                            </h4>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                Create your first learning session to start building and simulating network topologies.
                            </p>
                            <Button
                                onClick={handleCreateSession}
                                variant="outline"
                                className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Session
                            </Button>
                        </div>
                    ) : (
                        // Sessions Grid
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="glassmorphic border border-white/10 rounded-2xl p-6 hover:border-neon-blue/50 transition-all duration-300 cursor-pointer group"
                                >
                                    <div className="fle items-start justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-white group-hover:text-neon-blue transition-colors">
                                            {session.name}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'active'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {session.duration || '0:00:00'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => navigate(`/session/${session.id}`)}
                                            size="sm"
                                            className="flex-1 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30"
                                        >
                                            <PlayCircle className="w-4 h-4 mr-2" />
                                            {session.status === 'active' ? 'Resume' : 'View'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-400 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Create Session Modal */}
            <CreateSessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSessionCreated={handleSessionCreated}
            />
        </div>
    );
}
