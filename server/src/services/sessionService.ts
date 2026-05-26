import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from '@google-cloud/firestore';
import { collections } from '../config/database';
import {
    Session,
    SessionResponse,
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionParticipant,
    NetworkTopology
} from '../types/session';

/**
 * Session Service - handles all session CRUD operations
 */
export class SessionService {
    /**
     * Convert Firestore Session to API Response
     */
    private static toResponse(session: Session): SessionResponse {
        return {
            id: session.id,
            userId: session.userId,
            name: session.name,
            description: session.description,
            startTime: session.startTime.toDate().toISOString(),
            lastActiveTime: session.lastActiveTime.toDate().toISOString(),
            endTime: session.endTime?.toDate().toISOString() || null,
            status: session.status,
            topology: session.topology,
            participants: session.participants.map(p => ({
                uid: p.uid,
                role: p.role,
                joinedAt: p.joinedAt.toDate().toISOString(),
                displayName: p.displayName
            })),
            title: session.title,
            tags: session.tags,
            createdAt: session.createdAt.toDate().toISOString(),
            updatedAt: session.updatedAt.toDate().toISOString()
        };
    }

    /**
     * Create a new session
     */
    static async createSession(
        userId: string,
        data: CreateSessionRequest
    ): Promise<SessionResponse> {
        const sessionId = uuidv4();
        const now = Timestamp.now();

        const newSession: Session = {
            id: sessionId,
            userId,
            name: data.name, // Required session name
            description: data.description, // Optional description
            startTime: now, // Auto-start immediately
            lastActiveTime: now,
            endTime: null,
            status: 'active', // Always active on creation
            topology: {
                devices: [],
                connections: []
            },
            participants: [{
                uid: userId,
                role: 'student', // Creator defaults to student
                joinedAt: now
            }],
            title: data.title,
            tags: data.tags,
            createdAt: now,
            updatedAt: now
        };

        await collections.sessions().doc(sessionId).set(newSession);

        console.log(`✅ Session created and started: ${sessionId} - "${data.name}" by ${userId}`);
        return this.toResponse(newSession);
    }

    /**
     * Get session by ID
     */
    static async getSession(sessionId: string): Promise<SessionResponse | null> {
        const doc = await collections.sessions().doc(sessionId).get();

        if (!doc.exists) {
            return null;
        }

        const session = doc.data() as Session;
        return this.toResponse(session);
    }

    /**
     * Update session with debounced data
     */
    static async updateSession(
        sessionId: string,
        updates: UpdateSessionRequest
    ): Promise<SessionResponse> {
        const now = Timestamp.now();

        const updateData: any = {
            ...updates,
            lastActiveTime: now,
            updatedAt: now
        };

        await collections.sessions().doc(sessionId).update(updateData);

        const updated = await this.getSession(sessionId);
        if (!updated) {
            throw new Error('Session not found after update');
        }

        console.log(`✅ Session updated: ${sessionId}`);
        return updated;
    }

    /**
     * End a session
     */
    static async endSession(sessionId: string): Promise<SessionResponse> {
        const now = Timestamp.now();

        await collections.sessions().doc(sessionId).update({
            status: 'ended',
            endTime: now,
            lastActiveTime: now,
            updatedAt: now
        });

        const ended = await this.getSession(sessionId);
        if (!ended) {
            throw new Error('Session not found after ending');
        }

        console.log(`✅ Session ended: ${sessionId}`);
        return ended;
    }

    /**
     * Get all sessions for a user
     */
    static async getUserSessions(userId: string): Promise<SessionResponse[]> {
        const snapshot = await collections.sessions()
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const sessions = snapshot.docs.map(doc => {
            const session = doc.data() as Session;
            return this.toResponse(session);
        });

        return sessions;
    }

    /**
     * Join a collaborative session
     */
    static async joinSession(
        sessionId: string,
        userId: string,
        role: 'teacher' | 'student',
        displayName?: string
    ): Promise<SessionResponse> {
        const now = Timestamp.now();

        const participant: SessionParticipant = {
            uid: userId,
            role,
            joinedAt: now,
            displayName
        };

        // Add participant if not already in session
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const existingParticipant = session.participants.find(p => p.uid === userId);
        if (existingParticipant) {
            return session; // Already joined
        }

        await collections.sessions().doc(sessionId).update({
            participants: [...session.participants.map(p => ({
                uid: p.uid,
                role: p.role,
                joinedAt: Timestamp.fromDate(new Date(p.joinedAt)),
                displayName: p.displayName
            })), participant],
            lastActiveTime: now,
            updatedAt: now
        });

        const updated = await this.getSession(sessionId);
        if (!updated) {
            throw new Error('Session not found after join');
        }

        console.log(`✅ User ${userId} joined session ${sessionId}`);
        return updated;
    }

    /**
     * Delete a session (for cleanup/admin)
     */
    static async deleteSession(sessionId: string): Promise<void> {
        await collections.sessions().doc(sessionId).delete();
        console.log(`✅ Session deleted: ${sessionId}`);
    }
}
