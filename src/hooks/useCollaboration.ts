/**
 * useCollaboration Hook
 * 
 * React hook for managing collaboration state and node locking
 */

import { useState, useEffect, useCallback } from 'react';
import { wsClient } from '@/services/socket';
import { toast } from 'sonner';

export interface EditLock {
    nodeId: string;
    userId: string;
    userName: string;
    timestamp: number;
    expiresAt: number;
}

export interface Participant {
    uid: string;
    displayName: string;
    email?: string;
    role: 'teacher' | 'student';
    joinedAt: number;
    lastActiveAt: number;
    cursorPosition?: { x: number; y: number };
}

export function useCollaboration(sessionId: string | null) {
    const [locks, setLocks] = useState<Map<string, EditLock>>(new Map());
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [myLocks, setMyLocks] = useState<Set<string>>(new Set());

    /**
     * Acquire lock on a node
     */
    const acquireLock = useCallback(async (nodeId: string, userName: string): Promise<boolean> => {
        if (!sessionId) return false;

        return new Promise((resolve) => {
            // Emit lock request
            wsClient.getSocket()?.emit('lock:acquire', { sessionId, nodeId, userName });

            // Listen for result (one-time listener)
            const handleResult = (result: any) => {
                if (result.nodeId === nodeId) {
                    if (result.success) {
                        setMyLocks(prev => new Set([...prev, nodeId]));
                        resolve(true);
                    } else {
                        toast.warning('Node Locked', {
                            description: `${result.holder} is currently editing this node`
                        });
                        resolve(false);
                    }

                    // Remove listener
                    wsClient.getSocket()?.off('lock:result', handleResult);
                }
            };

            wsClient.getSocket()?.on('lock:result', handleResult);

            // Timeout after 2 seconds
            setTimeout(() => {
                wsClient.getSocket()?.off('lock:result', handleResult);
                resolve(false);
            }, 2000);
        });
    }, [sessionId]);

    /**
     * Release lock on a node
     */
    const releaseLock = useCallback((nodeId: string) => {
        if (!sessionId) return;

        wsClient.getSocket()?.emit('lock:release', { sessionId, nodeId });
        setMyLocks(prev => {
            const newLocks = new Set(prev);
            newLocks.delete(nodeId);
            return newLocks;
        });
    }, [sessionId]);

    /**
     * Check if I hold a lock
     */
    const hasLock = useCallback((nodeId: string): boolean => {
        return myLocks.has(nodeId);
    }, [myLocks]);

    /**
     * Check if node is locked by anyone
     */
    const isLocked = useCallback((nodeId: string): boolean => {
        return locks.has(nodeId);
    }, [locks]);

    /**
     * Get lock holder info
     */
    const getLockHolder = useCallback((nodeId: string): string | null => {
        const lock = locks.get(nodeId);
        return lock ? lock.userName : null;
    }, [locks]);

    // Listen to collaboration events
    useEffect(() => {
        if (!sessionId) return;

        const socket = wsClient.getSocket();
        if (!socket) return;

        // Initial state
        const handleCollabState = (data: { participants: Participant[]; locks: EditLock[] }) => {
            setParticipants(data.participants);

            const lockMap = new Map<string, EditLock>();
            data.locks.forEach(lock => lockMap.set(lock.nodeId, lock));
            setLocks(lockMap);
        };

        // Lock acquired by someone
        const handleLockAcquired = (data: { nodeId: string; userId: string; userName: string }) => {
            setLocks(prev => new Map(prev).set(data.nodeId, {
                nodeId: data.nodeId,
                userId: data.userId,
                userName: data.userName,
                timestamp: Date.now(),
                expiresAt: Date.now() + 30000
            }));
        };

        // Lock released
        const handleLockReleased = (data: { nodeId: string }) => {
            setLocks(prev => {
                const newLocks = new Map(prev);
                newLocks.delete(data.nodeId);
                return newLocks;
            });
        };

        // User joined
        const handleUserJoined = (data: { uid: string; displayName: string }) => {
            toast.info('User Joined', {
                description: `${data.displayName} joined the session`
            });
        };

        // User left
        const handleUserLeft = (data: { uid: string }) => {
            setParticipants(prev => prev.filter(p => p.uid !== data.uid));

            // Remove their locks
            setLocks(prev => {
                const newLocks = new Map(prev);
                newLocks.forEach((lock, nodeId) => {
                    if (lock.userId === data.uid) {
                        newLocks.delete(nodeId);
                    }
                });
                return newLocks;
            });
        };

        // Attach listeners
        socket.on('collaboration:state', handleCollabState);
        socket.on('lock:acquired', handleLockAcquired);
        socket.on('lock:released', handleLockReleased);
        socket.on('user:joined', handleUserJoined);
        socket.on('user:left', handleUserLeft);

        // Cleanup
        return () => {
            socket.off('collaboration:state', handleCollabState);
            socket.off('lock:acquired', handleLockAcquired);
            socket.off('lock:released', handleLockReleased);
            socket.off('user:joined', handleUserJoined);
            socket.off('user:left', handleUserLeft);
        };
    }, [sessionId]);

    return {
        locks,
        participants,
        acquireLock,
        releaseLock,
        hasLock,
        isLocked,
        getLockHolder
    };
}
