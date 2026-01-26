/**
 * Session Management Hook
 * 
 * React hook for managing session lifecycle with debounced syncing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionAPI, Session, UpdateSessionRequest } from '@/services/sessionAPI';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { toast } from 'sonner';

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function useSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { devices, connections } = useNetworkStore();
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Sync topology to backend (debounced 500ms)
     */
    const syncTopology = useCallback(
        debounce(async () => {
            if (!session) return;

            try {
                const updated = await SessionAPI.updateSession(session.id, {
                    topology: {
                        devices,
                        connections
                    }
                });
                setSession(updated);
                console.log('✅ Session synced');
            } catch (err) {
                console.error('Failed to sync session:', err);
            }
        }, 500),
        [session, devices, connections]
    );

    /**
     * Start a new session
     */
    const startSession = async (title?: string) => {
        setLoading(true);
        setError(null);

        try {
            const newSession = await SessionAPI.createSession({ title });
            setSession(newSession);

            toast.success('Session Started', {
                description: `Session ${newSession.id.slice(0, 8)}... created`
            });

            return newSession;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start session';
            setError(message);
            toast.error('Failed to Start Session', { description: message });
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * End the current session
     */
    const endSession = async () => {
        if (!session) return;

        setLoading(true);
        try {
            await SessionAPI.endSession(session.id);

            // Clear auto-save interval
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
                autoSaveIntervalRef.current = null;
            }

            toast.success('Session Ended');
            setSession(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to end session';
            setError(message);
            toast.error('Failed to End Session', { description: message });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load an existing session
     */
    const loadSession = async (sessionId: string) => {
        setLoading(true);
        setError(null);

        try {
            const loadedSession = await SessionAPI.getSession(sessionId);
            setSession(loadedSession);
            return loadedSession;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load session';
            setError(message);
            toast.error('Failed to Load Session', { description: message });
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Join a collaborative session
     */
    const joinSession = async (sessionId: string, role: 'teacher' | 'student') => {
        setLoading(true);
        setError(null);

        try {
            const joinedSession = await SessionAPI.joinSession(sessionId, role);
            setSession(joinedSession);
            toast.success('Joined Session');
            return joinedSession;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to join session';
            setError(message);
            toast.error('Failed to Join Session', { description: message });
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Set up auto-save and debounced sync when session is active
     */
    useEffect(() => {
        if (session && session.status === 'active') {
            // Debounced sync on topology changes
            syncTopology();

            // Periodic auto-save every 60 seconds
            if (!autoSaveIntervalRef.current) {
                autoSaveIntervalRef.current = setInterval(() => {
                    syncTopology();
                }, 60000); // 60 seconds
            }
        }

        // Cleanup
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
                autoSaveIntervalRef.current = null;
            }
        };
    }, [session, devices, connections, syncTopology]);

    return {
        session,
        loading,
        error,
        startSession,
        endSession,
        loadSession,
        joinSession,
        syncTopology
    };
}
