import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type DeviceType = 'ROUTER' | 'SWITCH' | 'PC' | 'SERVER' | 'HUB' | 'WIRELESS';
export type ConnectionType = 'ETHERNET' | 'WIFI' | 'FIBER';

export interface Device {
    id: string;
    type: DeviceType;
    x: number;
    y: number;
    name: string;
    status: 'active' | 'inactive' | 'error';
    properties: Record<string, any>;
}

export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    status: 'active' | 'down' | 'congested';
}

export interface Packet {
    id: string;
    sourceId: string;
    targetId: string;
    progress: number;
    status: 'traveling' | 'delivered' | 'lost' | 'corrupted';
    path?: string[]; // Array of Node IDs representing the route
}

export type LogType = 'packet_sent' | 'packet_delivered' | 'packet_lost' | 'packet_corrupted' | 'node_failed' | 'node_recovered' | 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
    id: string;
    timestamp: number;
    message: string;
    type: LogType;
    nodeId?: string;
    packetId?: string;
}

export interface NetworkState {
    // Canvas
    devices: Device[];
    connections: Connection[];
    selectedDeviceId: string | null;
    canvasZoom: number;
    canvasOffset: { x: number; y: number };

    // Simulation
    isSimulating: boolean;
    packets: Packet[];
    logs: LogEntry[];

    // UI Panels
    leftPanelOpen: boolean;
    rightPanelOpen: boolean;
    activeMode: 'select' | 'add' | 'connect' | 'delete';

    // Actions
    addDevice: (x: number, y: number, type?: DeviceType) => void;
    updateDevicePosition: (id: string, x: number, y: number) => void;
    selectDevice: (id: string | null) => void;
    deleteDevice: (id: string) => void;

    addConnection: (sourceId: string, targetId: string) => void;

    setMode: (mode: NetworkState['activeMode']) => void;
    toggleLeftPanel: () => void;
    toggleRightPanel: () => void;

    addLog: (message: string, type?: LogType, nodeId?: string, packetId?: string) => void;
    addPacket: (packet: Omit<Packet, 'id'>) => void;
    updatePackets: () => void;

    // Session Management
    sessionStartTime: number | null;
    sessionRunning: boolean;
    sessionElapsedTime: number;
    startSession: () => void;
    stopSession: () => void;
    pauseSession: () => void;
    resumeSession: () => void;
    updateSessionTime: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
    // Initial State
    devices: [],
    connections: [],
    selectedDeviceId: null,
    canvasZoom: 1,
    canvasOffset: { x: 0, y: 0 },

    isSimulating: false,
    packets: [],
    logs: [],

    leftPanelOpen: true,
    rightPanelOpen: true,
    activeMode: 'select',

    // Session State
    sessionStartTime: null,
    sessionRunning: false,
    sessionElapsedTime: 0,

    // Actions
    addDevice: (x, y, type = 'PC') => {
        const newDevice: Device = {
            id: uuidv4(),
            type,
            x,
            y,
            name: `${type}-${Math.floor(Math.random() * 1000)}`,
            status: 'active',
            properties: {},
        };

        set((state) => ({
            devices: [...state.devices, newDevice],
            logs: [
                {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    message: `Added ${type} at (${Math.round(x)}, ${Math.round(y)})`,
                    type: 'success',
                    nodeId: newDevice.id
                },
                ...state.logs,
            ],
        }));
    },

    updateDevicePosition: (id, x, y) => {
        set((state) => ({
            devices: state.devices.map((d) =>
                d.id === id ? { ...d, x, y } : d
            ),
        }));
    },

    selectDevice: (id) => {
        set({ selectedDeviceId: id });
    },

    deleteDevice: (id) => {
        set((state) => ({
            devices: state.devices.filter((d) => d.id !== id),
            connections: state.connections.filter(
                (c) => c.sourceId !== id && c.targetId !== id
            ),
            selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId,
        }));
    },

    addConnection: (sourceId, targetId) => {
        // Avoid duplicates and self-loops
        const { connections } = get();
        if (sourceId === targetId) return;

        const exists = connections.some(
            (c) =>
                (c.sourceId === sourceId && c.targetId === targetId) ||
                (c.sourceId === targetId && c.targetId === sourceId)
        );

        if (exists) return;

        const newConnection: Connection = {
            id: uuidv4(),
            sourceId,
            targetId,
            type: 'ETHERNET',
            status: 'active',
        };

        set((state) => ({
            connections: [...state.connections, newConnection],
            logs: [
                {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    message: 'Connection established',
                    type: 'info',
                },
                ...state.logs,
            ],
        }));
    },

    setMode: (mode) => set({ activeMode: mode }),
    toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
    toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

    addLog: (message, type = 'info', nodeId, packetId) => {
        set((state) => ({
            logs: [
                {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    message,
                    type,
                    nodeId,
                    packetId
                },
                ...state.logs,
            ],
        }));
    },

    addPacket: (packet) => {
        set((state) => ({
            packets: [...state.packets, { ...packet, id: uuidv4() }]
        }));
    },

    updatePackets: () => {
        set((state) => {
            const PACKET_SPEED = 0.003; // Slow, premium speed
            const updatedPackets = state.packets.map(p => {
                if (p.status !== 'traveling') return p;

                const newProgress = p.progress + PACKET_SPEED;

                if (newProgress >= 1) {
                    return { ...p, progress: 1, status: 'delivered' as const };
                }
                return { ...p, progress: newProgress };
            });

            // Trigger delivered logs or side effects if needed (simplification: just update state)
            // Ideally we would detect state changes here to add logs, but keeping it simple for now.

            return { packets: updatedPackets };
        });
    },

    // Session Management
    startSession: () => {
        set({
            sessionStartTime: Date.now(),
            sessionRunning: true,
            sessionElapsedTime: 0,
        });
    },

    stopSession: () => {
        set({
            sessionRunning: false,
            sessionStartTime: null,
            sessionElapsedTime: 0,
        });
    },

    pauseSession: () => {
        const { sessionStartTime, sessionElapsedTime } = get();
        if (sessionStartTime) {
            const additionalTime = Date.now() - sessionStartTime;
            set({
                sessionRunning: false,
                sessionElapsedTime: sessionElapsedTime + additionalTime,
                sessionStartTime: null,
            });
        }
    },

    resumeSession: () => {
        set({
            sessionRunning: true,
            sessionStartTime: Date.now(),
        });
    },

    updateSessionTime: () => {
        const { sessionRunning, sessionStartTime, sessionElapsedTime } = get();
        if (sessionRunning && sessionStartTime) {
            // Don't set state here, just return the calculated value
            // The component will call this frequently to get the latest time
            return sessionElapsedTime + (Date.now() - sessionStartTime);
        }
        return sessionElapsedTime;
    },
}));
