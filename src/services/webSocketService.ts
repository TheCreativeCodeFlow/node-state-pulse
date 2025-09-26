import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface PacketEvent {
  eventType: string;
  sessionId: string;
  packetId: string;
  messageId: string;
  sourceNodeId: string;
  targetNodeId: string;
  currentNodeId: string;
  connectionId: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO' | 'ERROR';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  sequenceNumber?: number;
  totalHops?: number;
  currentHop?: number;
  routePath?: string;
  duration?: number;
  anomalyType?: string;
  progress?: number;
}

type EventCallback = (event: PacketEvent) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private callbacks: Map<string, EventCallback[]> = new Map();

  constructor() {
    this.setupClient();
  }

  private setupClient() {
    const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {},
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: this.reconnectInterval,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.resubscribeToAll();
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.connected = false;
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        this.handleReconnect();
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
        this.connected = false;
        this.handleReconnect();
      },
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.connected && this.client) {
          this.client.activate();
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }

  private resubscribeToAll() {
    // Re-subscribe to all active sessions
    this.callbacks.forEach((_, sessionId) => {
      this.subscribeToSession(sessionId);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      if (!this.client) {
        this.setupClient();
      }

      const originalOnConnect = this.client!.onConnect;
      this.client!.onConnect = (frame) => {
        if (originalOnConnect) originalOnConnect(frame);
        resolve();
      };

      const originalOnStompError = this.client!.onStompError;
      this.client!.onStompError = (frame) => {
        if (originalOnStompError) originalOnStompError(frame);
        reject(new Error(`STOMP error: ${frame.headers['message']}`));
      };

      this.client!.activate();
    });
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
      this.callbacks.clear();
    }
  }

  subscribeToSession(sessionId: string, callback?: EventCallback) {
    if (!this.client || !this.connected) {
      console.warn('WebSocket not connected. Storing callback for later subscription.');
      if (callback) {
        const sessionCallbacks = this.callbacks.get(sessionId) || [];
        sessionCallbacks.push(callback);
        this.callbacks.set(sessionId, sessionCallbacks);
      }
      return;
    }

    const destination = `/topic/simulation/${sessionId}`;
    
    this.client.subscribe(destination, (message) => {
      try {
        const event: PacketEvent = JSON.parse(message.body);
        
        // Call all registered callbacks for this session
        const sessionCallbacks = this.callbacks.get(sessionId) || [];
        sessionCallbacks.forEach(cb => cb(event));
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    console.log(`Subscribed to simulation events for session: ${sessionId}`);

    // Store callback if provided
    if (callback) {
      const sessionCallbacks = this.callbacks.get(sessionId) || [];
      sessionCallbacks.push(callback);
      this.callbacks.set(sessionId, sessionCallbacks);
    }
  }

  unsubscribeFromSession(sessionId: string) {
    this.callbacks.delete(sessionId);
    console.log(`Unsubscribed from session: ${sessionId}`);
  }

  onPacketEvent(sessionId: string, callback: EventCallback) {
    this.subscribeToSession(sessionId, callback);
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Utility methods for specific event types
  onPacketSent(sessionId: string, callback: (event: PacketEvent) => void) {
    this.onPacketEvent(sessionId, (event) => {
      if (event.eventType === 'packet_sent') {
        callback(event);
      }
    });
  }

  onPacketDelivered(sessionId: string, callback: (event: PacketEvent) => void) {
    this.onPacketEvent(sessionId, (event) => {
      if (event.eventType === 'delivered') {
        callback(event);
      }
    });
  }

  onPacketLost(sessionId: string, callback: (event: PacketEvent) => void) {
    this.onPacketEvent(sessionId, (event) => {
      if (event.eventType === 'packet_lost') {
        callback(event);
      }
    });
  }

  onAnomalyApplied(sessionId: string, callback: (event: PacketEvent) => void) {
    this.onPacketEvent(sessionId, (event) => {
      if (event.eventType === 'anomaly_applied') {
        callback(event);
      }
    });
  }

  onSimulationStarted(sessionId: string, callback: (event: PacketEvent) => void) {
    this.onPacketEvent(sessionId, (event) => {
      if (event.eventType === 'simulation_started') {
        callback(event);
      }
    });
  }

  onSimulationCompleted(sessionId: string, callback: (event: PacketEvent) => void) {
    this.onPacketEvent(sessionId, (event) => {
      if (event.eventType === 'simulation_completed') {
        callback(event);
      }
    });
  }
}

export const webSocketService = new WebSocketService();