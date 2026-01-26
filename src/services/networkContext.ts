/**
 * Network Context Collector
 * 
 * Collects and formats current network simulation state for AI context.
 * Provides structured data about topology, logs, packets, and user actions.
 */

import { Device, Connection, Packet, LogEntry } from '../stores/useNetworkStore';

export interface NetworkTopology {
    devices: {
        id: string;
        name: string;
        type: string;
        status: string;
        position: { x: number; y: number };
    }[];
    connections: {
        id: string;
        from: string;
        to: string;
        type: string;
        status: string;
    }[];
    summary: string;
}

export interface NetworkContext {
    topology: NetworkTopology;
    recentLogs: {
        timestamp: string;
        type: string;
        message: string;
    }[];
    activePackets: {
        id: string;
        from: string;
        to: string;
        status: string;
        progress: number;
    }[];
    simulationState: {
        isRunning: boolean;
        totalDevices: number;
        totalConnections: number;
        activePackets: number;
    };
}

/**
 * Collects the current network state from the store
 */
export const collectNetworkContext = (
    devices: Device[],
    connections: Connection[],
    packets: Packet[],
    logs: LogEntry[],
    isSimulating: boolean
): NetworkContext => {
    // Build device name lookup
    const deviceNameMap = new Map(devices.map(d => [d.id, d.name]));

    // Format topology
    const topology: NetworkTopology = {
        devices: devices.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status,
            position: { x: Math.round(d.x), y: Math.round(d.y) }
        })),
        connections: connections.map(c => ({
            id: c.id,
            from: deviceNameMap.get(c.sourceId) || c.sourceId,
            to: deviceNameMap.get(c.targetId) || c.targetId,
            type: c.type,
            status: c.status
        })),
        summary: generateTopologySummary(devices, connections)
    };

    // Format recent logs (last 15)
    const recentLogs = logs.slice(0, 15).map(log => ({
        timestamp: new Date(log.timestamp).toLocaleTimeString(),
        type: log.type,
        message: log.message
    }));

    // Format active packets
    const activePackets = packets
        .filter(p => p.status === 'traveling')
        .map(p => ({
            id: p.id,
            from: deviceNameMap.get(p.sourceId) || p.sourceId,
            to: deviceNameMap.get(p.targetId) || p.targetId,
            status: p.status,
            progress: Math.round(p.progress * 100)
        }));

    return {
        topology,
        recentLogs,
        activePackets,
        simulationState: {
            isRunning: isSimulating,
            totalDevices: devices.length,
            totalConnections: connections.length,
            activePackets: activePackets.length
        }
    };
};

/**
 * Generate a human-readable topology summary
 */
const generateTopologySummary = (devices: Device[], connections: Connection[]): string => {
    const typeCounts = devices.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const deviceSummary = Object.entries(typeCounts)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');

    return `Network with ${deviceSummary} and ${connections.length} connection${connections.length !== 1 ? 's' : ''}.`;
};

/**
 * Format context as a string for AI prompt
 */
export const formatContextForPrompt = (context: NetworkContext): string => {
    const parts: string[] = [];

    // Topology section
    parts.push('=== CURRENT NETWORK STATE ===');
    parts.push(`Summary: ${context.topology.summary}`);

    if (context.topology.devices.length > 0) {
        parts.push('\nDevices:');
        context.topology.devices.forEach(d => {
            parts.push(`  • ${d.name} (${d.type}) - ${d.status}`);
        });
    }

    if (context.topology.connections.length > 0) {
        parts.push('\nConnections:');
        context.topology.connections.forEach(c => {
            parts.push(`  • ${c.from} ↔ ${c.to} (${c.type}, ${c.status})`);
        });
    }

    // Recent logs
    if (context.recentLogs.length > 0) {
        parts.push('\n=== RECENT LOGS ===');
        context.recentLogs.slice(0, 10).forEach(log => {
            parts.push(`  [${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`);
        });
    }

    // Active packets
    if (context.activePackets.length > 0) {
        parts.push('\n=== ACTIVE PACKETS ===');
        context.activePackets.forEach(p => {
            parts.push(`  • ${p.from} → ${p.to}: ${p.progress}% (${p.status})`);
        });
    }

    // Simulation state
    parts.push('\n=== SIMULATION STATE ===');
    parts.push(`  Running: ${context.simulationState.isRunning ? 'Yes' : 'No'}`);
    parts.push(`  Devices: ${context.simulationState.totalDevices}`);
    parts.push(`  Connections: ${context.simulationState.totalConnections}`);
    parts.push(`  Active Packets: ${context.simulationState.activePackets}`);

    return parts.join('\n');
};

/**
 * Check if network has any issues based on logs
 */
export const detectNetworkIssues = (logs: LogEntry[]): string[] => {
    const issues: string[] = [];
    const recentLogs = logs.slice(0, 20);

    const errorLogs = recentLogs.filter(l =>
        l.type === 'error' || l.type === 'packet_lost' || l.type === 'packet_corrupted' || l.type === 'node_failed'
    );

    if (errorLogs.length > 0) {
        errorLogs.forEach(log => {
            issues.push(log.message);
        });
    }

    return issues;
};
