import { WebSocketEvent } from '@/types/api';

export type WebSocketEventType = 
  | 'connection_established'
  | 'pong'
  | 'simulation_started'
  | 'simulation_completed'
  | 'simulation_error'
  | 'packet_sent'
  | 'packet_arrived'
  | 'packet_delivered'
  | 'packet_lost'
  | 'packet_delayed'
  | 'packet_misdelivered'
  | 'packet_failed'
  | 'log_info'
  | 'log_warning'
  | 'log_error'
  | 'node_status_changed'
  | 'connection_status_changed';

export type WebSocketEventHandler = (event: WebSocketEvent) => void;
export type WebSocketErrorHandler = (error: Event) => void;
export type WebSocketCloseHandler = (event: CloseEvent) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private eventHandlers: Map<WebSocketEventType, WebSocketEventHandler[]> = new Map();
  private errorHandlers: WebSocketErrorHandler[] = [];
  private closeHandlers: WebSocketCloseHandler[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private isReconnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor() {
    // Initialize event handler maps
    this.eventHandlers = new Map();
  }

  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.ws) {
        this.ws.close();
      }

      this.sessionId = sessionId;
      const wsUrl = `ws://localhost:8000/ws/${sessionId}`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = (event) => {
          console.log('WebSocket connected to session:', sessionId);
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketEvent;
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.errorHandlers.forEach(handler => handler(error));
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this.closeHandlers.forEach(handler => handler(event));
          
          // Attempt to reconnect if it wasn't a manual close
          if (this.shouldReconnect && !event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.isReconnecting || !this.sessionId || !this.shouldReconnect) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.sessionId && this.shouldReconnect) {
        this.connect(this.sessionId).catch(() => {
          // If reconnection fails, the onclose handler will try again
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
  }

  private handleMessage(event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(event.event_type as WebSocketEventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  on(eventType: WebSocketEventType, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: WebSocketEventType, handler?: WebSocketEventHandler): void {
    if (!handler) {
      // Remove all handlers for this event type
      this.eventHandlers.delete(eventType);
      return;
    }

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  onError(handler: WebSocketErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  onClose(handler: WebSocketCloseHandler): void {
    this.closeHandlers.push(handler);
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', data);
    }
  }

  ping(): void {
    this.send({ type: 'ping' });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  // Convenience methods for common event types
  onPacketEvent(handler: WebSocketEventHandler): void {
    const packetEvents: WebSocketEventType[] = [
      'packet_sent',
      'packet_arrived', 
      'packet_delivered',
      'packet_lost',
      'packet_delayed', 
      'packet_misdelivered',
      'packet_failed'
    ];
    
    packetEvents.forEach(eventType => {
      this.on(eventType, handler);
    });
  }

  onSimulationEvent(handler: WebSocketEventHandler): void {
    const simulationEvents: WebSocketEventType[] = [
      'simulation_started',
      'simulation_completed',
      'simulation_error'
    ];
    
    simulationEvents.forEach(eventType => {
      this.on(eventType, handler);
    });
  }

  onLogEvent(handler: WebSocketEventHandler): void {
    const logEvents: WebSocketEventType[] = [
      'log_info',
      'log_warning', 
      'log_error'
    ];
    
    logEvents.forEach(eventType => {
      this.on(eventType, handler);
    });
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();