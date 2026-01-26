import {
    EditLock,
    UserPresence,
    AcquireLockRequest,
    ReleaseLockRequest,
    LockResponse,
    CollaborationState
} from '../types/collaboration';

/**
 * Collaboration Manager
 * 
 * Manages soft-locks and user presence per session
 */
export class CollaborationManager {
    // Session ID -> Collaboration State
    private sessions = new Map<string, CollaborationState>();

    // Auto-release timeout
    private static LOCK_TIMEOUT = 30000; // 30 seconds

    // Cleanup interval
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Run cleanup every 10 seconds to remove expired locks
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks();
        }, 10000);

        console.log('✅ Collaboration manager initialized');
    }

    /**
     * Get or create collaboration state for a session
     */
    private getSessionState(sessionId: string): CollaborationState {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                locks: new Map(),
                participants: new Map()
            });
        }
        return this.sessions.get(sessionId)!;
    }

    /**
     * Acquire lock on a node
     */
    async acquireLock(request: AcquireLockRequest): Promise<LockResponse> {
        const { sessionId, nodeId, userId, userName } = request;
        const state = this.getSessionState(sessionId);

        // Check if lock exists and is not expired
        const existingLock = state.locks.get(nodeId);
        if (existingLock) {
            const now = Date.now();

            // If current user already holds it, refresh expiry
            if (existingLock.userId === userId) {
                existingLock.expiresAt = now + CollaborationManager.LOCK_TIMEOUT;
                state.locks.set(nodeId, existingLock);
                return { success: true, lock: existingLock };
            }

            // Lock held by someone else and not expired
            if (existingLock.expiresAt > now) {
                return {
                    success: false,
                    holder: existingLock.userName
                };
            }

            // Lock expired, remove it
            state.locks.delete(nodeId);
        }

        // Acquire new lock
        const newLock: EditLock = {
            nodeId,
            userId,
            userName,
            timestamp: Date.now(),
            expiresAt: Date.now() + CollaborationManager.LOCK_TIMEOUT
        };

        state.locks.set(nodeId, newLock);
        console.log(`🔒 Lock acquired: ${nodeId} by ${userName}`);

        return { success: true, lock: newLock };
    }

    /**
     * Release lock on a node
     */
    async releaseLock(request: ReleaseLockRequest): Promise<boolean> {
        const { sessionId, nodeId, userId } = request;
        const state = this.getSessionState(sessionId);

        const lock = state.locks.get(nodeId);

        // Only the lock holder can release it
        if (lock && lock.userId === userId) {
            state.locks.delete(nodeId);
            console.log(`🔓 Lock released: ${nodeId}`);
            return true;
        }

        return false;
    }

    /**
     * Get all locks for a session
     */
    getLocks(sessionId: string): EditLock[] {
        const state = this.getSessionState(sessionId);
        return Array.from(state.locks.values());
    }

    /**
     * Add user to session presence
     */
    addParticipant(sessionId: string, user: UserPresence): void {
        const state = this.getSessionState(sessionId);
        state.participants.set(user.uid, user);
        console.log(`👤 User joined collaboration: ${user.displayName}`);
    }

    /**
     * Remove user from session presence
     */
    removeParticipant(sessionId: string, userId: string): void {
        const state = this.getSessionState(sessionId);

        // Release all locks held by this user
        state.locks.forEach((lock, nodeId) => {
            if (lock.userId === userId) {
                state.locks.delete(nodeId);
                console.log(`🔓 Auto-released lock: ${nodeId} (user left)`);
            }
        });

        state.participants.delete(userId);
        console.log(`👤 User left collaboration: ${userId}`);
    }

    /**
     * Update user's last active time
     */
    updateActivity(sessionId: string, userId: string): void {
        const state = this.getSessionState(sessionId);
        const participant = state.participants.get(userId);

        if (participant) {
            participant.lastActiveAt = Date.now();
            state.participants.set(userId, participant);
        }
    }

    /**
     * Update user cursor position
     */
    updateCursor(sessionId: string, userId: string, x: number, y: number): void {
        const state = this.getSessionState(sessionId);
        const participant = state.participants.get(userId);

        if (participant) {
            participant.cursorPosition = { x, y };
            participant.lastActiveAt = Date.now();
            state.participants.set(userId, participant);
        }
    }

    /**
     * Get all participants in a session
     */
    getParticipants(sessionId: string): UserPresence[] {
        const state = this.getSessionState(sessionId);
        return Array.from(state.participants.values());
    }

    /**
     * Cleanup expired locks
     */
    private cleanupExpiredLocks(): void {
        const now = Date.now();
        let cleaned = 0;

        this.sessions.forEach((state, sessionId) => {
            state.locks.forEach((lock, nodeId) => {
                if (lock.expiresAt < now) {
                    state.locks.delete(nodeId);
                    cleaned++;
                    console.log(`🧹 Expired lock removed: ${nodeId}`);
                }
            });
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired locks`);
        }
    }

    /**
     * Clear all collaboration data for a session
     */
    clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        console.log(`🧹 Cleared collaboration state for session: ${sessionId}`);
    }

    /**
     * Shutdown cleanup
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        console.log('Collaboration manager shutdown');
    }
}

// Export singleton instance
export const collaborationManager = new CollaborationManager();

// Graceful shutdown
process.on('SIGINT', () => {
    collaborationManager.shutdown();
});

process.on('SIGTERM', () => {
    collaborationManager.shutdown();
});
