/**
 * Packet Simulation Types
 * 
 * Event-driven packet lifecycle events
 */

export type PacketEventType =
    | 'SENT'       // Packet created and sent
    | 'FORWARDED'  // Packet moved to next hop
    | 'DELAYED'    // Packet delayed due to congestion/latency
    | 'DROPPED'    // Packet dropped (error, no route, etc.)
    | 'DELIVERED'; // Packet reached destination

export interface PacketEvent {
    type: PacketEventType;
    packetId: string;
    timestamp: number;
    sessionId: string;
    sourceId: string;
    targetId: string;
    currentHop: string;
    nextHop?: string;
    reason?: string;  // For DROPPED events
    latency?: number; // Milliseconds
    metadata?: Record<string, any>;
}

export interface SimulatePacketRequest {
    sessionId: string;
    sourceId: string;
    targetId: string;
    protocol?: string;
    size?: number; // bytes
}

export interface SimulationConfig {
    baseLatency: number;      // Base latency per hop (ms)
    packetLossRate: number;   // 0-1 probability of packet loss
    congestionEnabled: boolean;
    validateRouting: boolean;
}
