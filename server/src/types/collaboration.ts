/**
 * Collaboration Types
 * 
 * Types for real-time collaboration and soft-locking
 */

export interface EditLock {
    nodeId: string;           // Device or connection ID
    userId: string;           // Who holds the lock
    userName: string;         // Display name
    timestamp: number;        // When lock was acquired
    expiresAt: number;        // Auto-release time (30s)
}

export interface UserPresence {
    uid: string;
    displayName: string;
    email?: string;
    role: 'teacher' | 'student';
    joinedAt: number;
    lastActiveAt: number;
    cursorPosition?: {
        x: number;
        y: number;
    };
}

export interface AcquireLockRequest {
    sessionId: string;
    nodeId: string;
    userId: string;
    userName: string;
}

export interface ReleaseLockRequest {
    sessionId: string;
    nodeId: string;
    userId: string;
}

export interface LockResponse {
    success: boolean;
    lock?: EditLock;
    holder?: string;  // Current holder's name if lock failed
}

export interface CollaborationState {
    locks: Map<string, EditLock>;
    participants: Map<string, UserPresence>;
}
