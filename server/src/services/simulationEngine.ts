import { v4 as uuidv4 } from 'uuid';
import { Device, Connection, NetworkTopology } from '../types/session';
import {
    PacketEvent,
    PacketEventType,
    SimulatePacketRequest,
    SimulationConfig
} from '../types/simulation';

/**
 * Backend-Driven Simulation Engine
 * 
 * Simulates packet routing with validation, latency, and packet loss
 * All logic runs on server - frontend only animates results
 */
export class SimulationEngine {
    private config: SimulationConfig;

    constructor(config?: Partial<SimulationConfig>) {
        this.config = {
            baseLatency: 50,              // 50ms per hop
            packetLossRate: 0.05,         // 5% packet loss
            congestionEnabled: true,
            validateRouting: true,
            ...config
        };
    }

    /**
     * Find path using BFS (Breadth-First Search)
     */
    private findPath(
        devices: Device[],
        connections: Connection[],
        sourceId: string,
        targetId: string
    ): string[] | null {
        const adjacency = new Map<string, string[]>();

        // Build adjacency list
        connections.forEach(conn => {
            if (conn.status !== 'active') return; // Skip down connections

            if (!adjacency.has(conn.sourceId)) adjacency.set(conn.sourceId, []);
            if (!adjacency.has(conn.targetId)) adjacency.set(conn.targetId, []);

            adjacency.get(conn.sourceId)!.push(conn.targetId);
            adjacency.get(conn.targetId)!.push(conn.sourceId);
        });

        // BFS to find shortest path
        const queue: [string, string[]][] = [[sourceId, [sourceId]]];
        const visited = new Set<string>([sourceId]);

        while (queue.length > 0) {
            const [currentId, path] = queue.shift()!;

            if (currentId === targetId) {
                return path;
            }

            const neighbors = adjacency.get(currentId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, [...path, neighbor]]);
                }
            }
        }

        return null; // No path found
    }

    /**
     * Simulate packet sending through network
     * Returns array of packet events
     */
    async simulatePacket(
        request: SimulatePacketRequest,
        topology: NetworkTopology
    ): Promise<PacketEvent[]> {
        const { sessionId, sourceId, targetId } = request;
        const packetId = uuidv4();
        const events: PacketEvent[] = [];
        const timestamp = Date.now();

        // Validate source and target exist
        const sourceDevice = topology.devices.find(d => d.id === sourceId);
        const targetDevice = topology.devices.find(d => d.id === targetId);

        if (!sourceDevice || !targetDevice) {
            events.push({
                type: 'DROPPED',
                packetId,
                sessionId,
                sourceId,
                targetId,
                currentHop: sourceId,
                timestamp,
                reason: !sourceDevice ? 'Source device not found' : 'Target device not found'
            });
            return events;
        }

        // Find routing path
        const path = this.findPath(topology.devices, topology.connections, sourceId, targetId);

        if (!path || path.length < 2) {
            events.push({
                type: 'DROPPED',
                packetId,
                sessionId,
                sourceId,
                targetId,
                currentHop: sourceId,
                timestamp,
                reason: 'No route to destination'
            });
            return events;
        }

        // SENT event
        events.push({
            type: 'SENT',
            packetId,
            sessionId,
            sourceId,
            targetId,
            currentHop: path[0],
            nextHop: path[1],
            timestamp,
            latency: 0
        });

        // Simulate each hop
        let currentTime = timestamp;
        for (let i = 1; i < path.length; i++) {
            const currentHop = path[i];
            const nextHop = i < path.length - 1 ? path[i + 1] : undefined;
            const isLastHop = i === path.length - 1;

            // Calculate latency
            const hopLatency = this.config.baseLatency + Math.random() * 20; // Add jitter
            currentTime += hopLatency;

            // Check for packet loss (random)
            if (this.config.packetLossRate > 0 && Math.random() < this.config.packetLossRate) {
                events.push({
                    type: 'DROPPED',
                    packetId,
                    sessionId,
                    sourceId,
                    targetId,
                    currentHop,
                    timestamp: currentTime,
                    reason: 'Packet lost in transit',
                    latency: hopLatency
                });
                return events; // Stop simulation
            }

            // FORWARDED or DELIVERED event
            if (isLastHop) {
                events.push({
                    type: 'DELIVERED',
                    packetId,
                    sessionId,
                    sourceId,
                    targetId,
                    currentHop,
                    timestamp: currentTime,
                    latency: hopLatency
                });
            } else {
                events.push({
                    type: 'FORWARDED',
                    packetId,
                    sessionId,
                    sourceId,
                    targetId,
                    currentHop,
                    nextHop,
                    timestamp: currentTime,
                    latency: hopLatency
                });
            }
        }

        return events;
    }

    /**
     * Validate IP configuration (placeholder for future enhancement)
     */
    validateIPConfig(device: Device): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // TODO: Add IP validation logic
        // - Check if IP is in valid subnet
        // - Verify subnet mask
        // - Check default gateway
        // - DHCP assignment validation

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update simulation configuration
     */
    updateConfig(config: Partial<SimulationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): SimulationConfig {
        return { ...this.config };
    }
}

// Export singleton instance
export const simulationEngine = new SimulationEngine();
