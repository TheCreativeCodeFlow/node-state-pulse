/**
 * Session API Service
 * 
 * API methods for session management
 */

import { api } from './api';
import { Device, Connection } from '@/stores/useNetworkStore';

export interface NetworkTopology {
    devices: Device[];
    connections: Connection[];
}

export interface SessionParticipant {
    uid: string;
    role: 'teacher' | 'student';
    joinedAt: string;
    displayName?: string;
}

export interface Session {
    id: string;
    userId: string;
    startTime: string;
    lastActiveTime: string;
    endTime: string | null;
    status: 'active' | 'paused' | 'ended';
    topology: NetworkTopology;
    participants: SessionParticipant[];
    title?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateSessionRequest {
    title?: string;
    tags?: string[];
}

export interface UpdateSessionRequest {
    topology?: NetworkTopology;
    status?: 'active' | 'paused' | 'ended';
    title?: string;
    tags?: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    count?: number;
}

export class SessionAPI {
    /**
     * Create a new session
     */
    static async createSession(data: CreateSessionRequest = {}): Promise<Session> {
        const response = await api.post<ApiResponse<Session>>('/api/sessions', data);
        return response.data;
    }

    /**
     * Get session by ID
     */
    static async getSession(sessionId: string): Promise<Session> {
        const response = await api.get<ApiResponse<Session>>(`/api/sessions/${sessionId}`);
        return response.data;
    }

    /**
     * Update session (debounced)
     */
    static async updateSession(
        sessionId: string,
        updates: UpdateSessionRequest
    ): Promise<Session> {
        const response = await api.patch<ApiResponse<Session>>(
            `/api/sessions/${sessionId}`,
            updates
        );
        return response.data;
    }

    /**
     * End a session
     */
    static async endSession(sessionId: string): Promise<Session> {
        const response = await api.post<ApiResponse<Session>>(
            `/api/sessions/${sessionId}/end`
        );
        return response.data;
    }

    /**
     * Join a collaborative session
     */
    static async joinSession(
        sessionId: string,
        role: 'teacher' | 'student',
        displayName?: string
    ): Promise<Session> {
        const response = await api.post<ApiResponse<Session>>(
            `/api/sessions/${sessionId}/join`,
            { role, displayName }
        );
        return response.data;
    }

    /**
     * Get all sessions for current user
     */
    static async getUserSessions(): Promise<Session[]> {
        const response = await api.get<ApiResponse<Session[]>>('/api/sessions');
        return response.data;
    }

    /**
     * Delete a session
     */
    static async deleteSession(sessionId: string): Promise<void> {
        await api.delete(`/api/sessions/${sessionId}`);
    }
}
