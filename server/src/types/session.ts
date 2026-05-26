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

    // Session identification
    name: string; // Custom session name (e.g., "Subnetting Practice - Day 1")
    description?: string; // Optional description

    // Session lifecycle
    startTime: Timestamp;
    lastActiveTime: Timestamp;
    endTime: Timestamp | null;
    status: SessionStatus; // 'active' | 'paused' | 'ended'

    // Network state
    topology: NetworkTopology;

    // Collaboration
    participants: SessionParticipant[];

    // Metadata
    title?: string; // Kept for backward compatibility
    tags?: string[];

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Create session request (from client)
 */
export interface CreateSessionRequest {
    name: string; // Required session name
    description?: string; // Optional description
    title?: string; // Kept for backward compatibility
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

    // Session identification
    name: string;
    description?: string;

    // Session lifecycle
    startTime: string;
    lastActiveTime: string;
    endTime: string | null;
    status: SessionStatus;

    // Network and collaboration
    topology: NetworkTopology;
    participants: Array<{
        uid: string;
        role: 'teacher' | 'student';
        joinedAt: string;
        displayName?: string;
    }>;

    // Metadata
    title?: string;
    tags?: string[];

    // Timestamps
    createdAt: string;
    updatedAt: string;
}
