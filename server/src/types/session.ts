import { Timestamp, FieldValue } from '@google-cloud/firestore';

/**
 * Device types in the network
 */
export type DeviceType = 'ROUTER' | 'SWITCH' | 'PC' | 'SERVER' | 'HUB' | 'WIRELESS';

/**
 * Connection types between devices
 */
export type ConnectionType = 'ETHERNET' | 'WIFI' | 'FIBER';

/**
 * Device entity
 */
export interface Device {
    id: string;
    type: DeviceType;
    x: number;
    y: number;
    name: string;
    status: 'active' | 'inactive' | 'error';
    properties: Record<string, any>;
}

/**
 * Connection entity
 */
export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    status: 'active' | 'down' | 'congested';
}

/**
 * Network topology (devices + connections)
 */
export interface NetworkTopology {
    devices: Device[];
    connections: Connection[];
}

/**
 * Session participant
 */
export interface SessionParticipant {
    uid: string;
    role: 'teacher' | 'student';
    joinedAt: Timestamp;
    displayName?: string;
}

/**
 * Session status
 */
export type SessionStatus = 'active' | 'paused' | 'ended';

/**
 * Session entity (Firestore document)
 */
export interface Session {
    id: string;
    userId: string; // Creator's UID
    startTime: Timestamp;
    lastActiveTime: Timestamp;
    endTime: Timestamp | null;
    status: SessionStatus;

    // Network state
    topology: NetworkTopology;

    // Collaboration
    participants: SessionParticipant[];

    // Metadata
    title?: string;
    tags?: string[];

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Create session request (from client)
 */
export interface CreateSessionRequest {
    title?: string;
    tags?: string[];
}

/**
 * Update session request (from client)
 */
export interface UpdateSessionRequest {
    topology?: NetworkTopology;
    status?: SessionStatus;
    title?: string;
    tags?: string[];
}

/**
 * Session response (to client) - converts Timestamps to ISO strings
 */
export interface SessionResponse {
    id: string;
    userId: string;
    startTime: string;
    lastActiveTime: string;
    endTime: string | null;
    status: SessionStatus;
    topology: NetworkTopology;
    participants: Array<{
        uid: string;
        role: 'teacher' | 'student';
        joinedAt: string;
        displayName?: string;
    }>;
    title?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}
