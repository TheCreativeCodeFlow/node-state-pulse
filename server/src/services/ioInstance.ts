/**
 * Shared IO Instance
 * 
 * Breaks circular dependency by providing a shared reference to Socket.IO instance
 * without importing from index.ts
 */

import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setIO(io: SocketIOServer): void {
    ioInstance = io;
}

export function getIO(): SocketIOServer {
    if (!ioInstance) {
        throw new Error('Socket.IO not initialized. Call setIO() first.');
    }
    return ioInstance;
}
