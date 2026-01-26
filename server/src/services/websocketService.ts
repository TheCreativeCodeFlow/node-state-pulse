/**
 * WebSocket Service for Real-Time Packet Events
 * 
 * Handles Socket.IO connections and packet event streaming
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { admin } from '../config/firebase';
import { PacketEvent } from '../types/simulation';

/**
 * Authenticate Socket.IO connections with Firebase
 */
async function authenticateSocket(socket: Socket): Promise<{ uid: string; email?: string } | null> {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return null;

        const decodedToken = await admin.auth().verifyIdToken(token);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email
        };
    } catch (error) {
        console.error('Socket authentication failed:', error);
        return null;
    }
}

/**
 * Event Throttler - batches rapid events
 */
class EventThrottler {
    private queues = new Map<string, any[]>();
    private flushInterval: NodeJS.Timeout;

    constructor(intervalMs: number = 100) {
        this.flushInterval = setInterval(() => this.flush(), intervalMs);
    }

    emit(socketId: string, event: string, data: any) {
        const key = `${socketId}:${event}`;
        if (!this.queues.has(key)) {
            this.queues.set(key, []);
        }
        this.queues.get(key)!.push(data);
    }

    flush() {
        // Implement actual flush logic here when io instance is available
    }

    destroy() {
        clearInterval(this.flushInterval);
    }
}

export const eventThrottler = new EventThrottler(100); // 100ms batching

/**
 * Initialize WebSocket handlers
 */
export function initializeWebSocket(io: SocketIOServer): void {
    io.on('connection', async (socket: Socket) => {
        console.log(`Client connecting: ${socket.id}`);

        // Authenticate
        const user = await authenticateSocket(socket);
        if (!user) {
            console.log(`Authentication failed for ${socket.id}`);
            socket.emit('error', { message: 'Authentication required' });
            socket.disconnect();
            return;
        }

        console.log(`✅ Client authenticated: ${socket.id} (${user.uid})`);

        /**
     * Join session room
     */
        socket.on('session:join', async ({ sessionId, displayName }: { sessionId: string; displayName?: string }) => {
            socket.join(`session:${sessionId}`);
            console.log(`Client ${socket.id} joined session: ${sessionId}`);

            // Add to collaboration manager
            const { collaborationManager } = await import('../services/collaborationManager');
            collaborationManager.addParticipant(sessionId, {
                uid: user.uid,
                displayName: displayName || user.email || 'Anonymous',
                email: user.email,
                role: 'student', // TODO: Get from user claims
                joinedAt: Date.now(),
                lastActiveAt: Date.now()
            });

            // Get current participants
            const participants = collaborationManager.getParticipants(sessionId);
            const locks = collaborationManager.getLocks(sessionId);

            // Send current state to new joiner
            socket.emit('collaboration:state', { participants, locks });

            // Notify others in the session
            socket.to(`session:${sessionId}`).emit('user:joined', {
                uid: user.uid,
                displayName: displayName || user.email
            });
        });

        /**
         * Leave session room
         */
        socket.on('session:leave', ({ sessionId }: { sessionId: string }) => {
            socket.leave(`session:${sessionId}`);
            console.log(`Client ${socket.id} left session: ${sessionId}`);

            // Notify others in the session
            socket.to(`session:${sessionId}`).emit('user:left', { uid: user.uid });
        });

        /**
         * Acquire edit lock
         */
        socket.on('lock:acquire', async ({ sessionId, nodeId, userName }: any) => {
            const { collaborationManager } = await import('../services/collaborationManager');

            const result = await collaborationManager.acquireLock({
                sessionId,
                nodeId,
                userId: user.uid,
                userName: userName || user.email || 'Anonymous'
            });

            // Send result to requester
            socket.emit('lock:result', { nodeId, ...result });

            // Broadcast lock status to all in session
            if (result.success) {
                socket.to(`session:${sessionId}`).emit('lock:acquired', {
                    nodeId,
                    userId: user.uid,
                    userName: userName || user.email
                });
            }
        });

        /**
         * Release edit lock
         */
        socket.on('lock:release', async ({ sessionId, nodeId }: any) => {
            const { collaborationManager } = await import('../services/collaborationManager');

            const released = await collaborationManager.releaseLock({
                sessionId,
                nodeId,
                userId: user.uid
            });

            if (released) {
                // Broadcast to all in session
                io.to(`session:${sessionId}`).emit('lock:released', {
                    nodeId,
                    userId: user.uid
                });
            }
        });

        /**
         * Update cursor position
         */
        socket.on('cursor:move', ({ sessionId, x, y }: any) => {
            const { collaborationManager } = require('../services/collaborationManager');

            collaborationManager.updateCursor(sessionId, user.uid, x, y);

            // Broadcast to others (not self)
            socket.to(`session:${sessionId}`).emit('cursor:update', {
                userId: user.uid,
                x,
                y
            });
        });

        /**
         * Request participants list
         */
        socket.on('participants:request', ({ sessionId }: any) => {
            const { collaborationManager } = require('../services/collaborationManager');

            const participants = collaborationManager.getParticipants(sessionId);
            socket.emit('participants:list', participants);
        });

        /**
     * Handle disconnect
     */
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Remove from all collaboration sessions
            const { collaborationManager } = require('../services/collaborationManager');

            // We don't know which session they were in, so we iterate
            // In production, you'd track socket-to-session mapping
            // For now, this is handled when they explicitly leave
        });
    });

    console.log('✅ WebSocket handlers initialized');
}

/**
 * Emit packet events to session room
 */
export function emitPacketEvents(
    io: SocketIOServer,
    sessionId: string,
    events: PacketEvent[]
): void {
    // Emit each event with delay for animation
    events.forEach((event, index) => {
        setTimeout(() => {
            io.to(`session:${sessionId}`).emit('packet:event', event);
        }, index * 100); // 100ms between events for smooth animation
    });
}

/**
 * Emit log event to session room
 */
export function emitLogEvent(
    io: SocketIOServer,
    sessionId: string,
    log: any
): void {
    io.to(`session:${sessionId}`).emit('log:new', log);
}
