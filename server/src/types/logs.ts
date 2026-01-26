/**
 * Logging Types
 * 
 * Centralized event and error logging
 */

export type LogType = 'info' | 'success' | 'warning' | 'error';

export type LogCategory =
    | 'user_action'     // User interactions (click, drag, etc.)
    | 'packet'          // Packet events
    | 'config'          // Configuration changes
    | 'system'          // System events
    | 'simulation';     // Simulation events

export interface LogEntry {
    id: string;
    timestamp: number;
    sessionId: string;
    type: LogType;
    category: LogCategory;
    message: string;
    metadata?: {
        nodeId?: string;
        packetId?: string;
        userId?: string;
        [key: string]: any;
    };
}

export interface CreateLogRequest {
    sessionId: string;
    type: LogType;
    category: LogCategory;
    message: string;
    metadata?: Record<string, any>;
}

export interface LogQueryParams {
    sessionId: string;
    limit?: number;
    offset?: number;
    type?: LogType;
    category?: LogCategory;
}
