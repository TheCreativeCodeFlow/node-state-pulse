/**
 * WebSocket Client Service
 * 
 * Socket.IO client for real-time packet events and collaboration
 */

import { io, Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

class WebSocketClient {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    /**
     * Connect to WebSocket server with Firebase auth
     */
    async connect(): Promise<void> {
        if (this.socket?.connected) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            // Get Firebase ID token
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const token = await user.getIdToken();

            // Create Socket.IO connection
            this.socket = io(WS_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
            });

            // Connection event handlers
            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected:', this.socket?.id);
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', (reason) => {
                console.log('WebSocket disconnected:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.reconnectAttempts++;

                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error('Max reconnection attempts reached');
                }
            });

            this.socket.on('error', (error) => {
                console.error('WebSocket error:', error);
            });

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            throw error;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('WebSocket disconnected');
        }
    }

    /**
     * Join a session room
     */
    joinSession(sessionId: string): void {
        if (!this.socket?.connected) {
            console.warn('Cannot join session: WebSocket not connected');
            return;
        }

        this.socket.emit('session:join', { sessionId });
        console.log(`Joined session: ${sessionId}`);
    }

    /**
     * Leave a session room
     */
    leaveSession(sessionId: string): void {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('session:leave', { sessionId });
        console.log(`Left session: ${sessionId}`);
    }

    /**
     * Listen to packet events
     */
    onPacketEvent(callback: (event: any) => void): void {
        if (!this.socket) {
            console.warn('Cannot listen to packet events: WebSocket not initialized');
            return;
        }

        this.socket.on('packet:event', callback);
    }

    /**
     * Remove packet event listener
     */
    offPacketEvent(callback?: (event: any) => void): void {
        if (!this.socket) return;

        if (callback) {
            this.socket.off('packet:event', callback);
        } else {
            this.socket.off('packet:event');
        }
    }

    /**
     * Listen to user joined event
     */
    onUserJoined(callback: (data: { uid: string }) => void): void {
        this.socket?.on('user:joined', callback);
    }

    /**
     * Listen to user left event
     */
    onUserLeft(callback: (data: { uid: string }) => void): void {
        this.socket?.on('user:left', callback);
    }

    /**
     * Listen to log events
     */
    onLogEvent(callback: (log: any) => void): void {
        this.socket?.on('log:new', callback);
    }

    /**
     * Get connection status
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get socket instance (for advanced usage)
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
