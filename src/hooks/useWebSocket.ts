import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService, WebSocketEventType, WebSocketEventHandler } from '@/services/websocket';
import { WebSocketEvent } from '@/types/api';
import { toast } from 'sonner';

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: string;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  send: (data: any) => void;
  on: (eventType: WebSocketEventType, handler: WebSocketEventHandler) => void;
  off: (eventType: WebSocketEventType, handler?: WebSocketEventHandler) => void;
  ping: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const handlersRef = useRef<Map<WebSocketEventType, WebSocketEventHandler[]>>(new Map());

  const updateConnectionState = useCallback(() => {
    const state = webSocketService.getConnectionState();
    setConnectionState(state);
    setIsConnected(state === 'CONNECTED');
  }, []);

  const connect = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await webSocketService.connect(sessionId);
      updateConnectionState();
      toast.success('Connected to simulation server', {
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      updateConnectionState();
      toast.error('Failed to connect to simulation server. Please check if the backend is running.', {
        duration: 5000,
      });
      throw error;
    }
  }, [updateConnectionState]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    updateConnectionState();
    toast.info('Disconnected from simulation server');
  }, [updateConnectionState]);

  const send = useCallback((data: any) => {
    webSocketService.send(data);
  }, []);

  const on = useCallback((eventType: WebSocketEventType, handler: WebSocketEventHandler) => {
    // Store handler reference for cleanup
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, []);
    }
    handlersRef.current.get(eventType)!.push(handler);
    
    webSocketService.on(eventType, handler);
  }, []);

  const off = useCallback((eventType: WebSocketEventType, handler?: WebSocketEventHandler) => {
    if (handler) {
      // Remove specific handler from our reference
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      // Remove all handlers for this event type
      handlersRef.current.delete(eventType);
    }
    
    webSocketService.off(eventType, handler);
  }, []);

  const ping = useCallback(() => {
    webSocketService.ping();
  }, []);

  // Set up global WebSocket event listeners
  useEffect(() => {
    const handleError = (error: Event) => {
      updateConnectionState();
      console.error('WebSocket error:', error);
    };

    const handleClose = (event: CloseEvent) => {
      updateConnectionState();
      if (!event.wasClean) {
        toast.warning('Connection lost. Attempting to reconnect...', {
          duration: 3000,
        });
      }
    };

    const handleConnectionEstablished = (event: WebSocketEvent) => {
      updateConnectionState();
      console.log('WebSocket connection established');
    };

    webSocketService.onError(handleError);
    webSocketService.onClose(handleClose);
    webSocketService.on('connection_established', handleConnectionEstablished);

    // Initial state update
    updateConnectionState();

    return () => {
      // Clean up all handlers on unmount
      handlersRef.current.forEach((handlers, eventType) => {
        handlers.forEach(handler => {
          webSocketService.off(eventType, handler);
        });
      });
      handlersRef.current.clear();
      
      webSocketService.off('connection_established', handleConnectionEstablished);
    };
  }, [updateConnectionState]);

  // Periodic connection state updates
  useEffect(() => {
    const interval = setInterval(updateConnectionState, 1000);
    return () => clearInterval(interval);
  }, [updateConnectionState]);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    send,
    on,
    off,
    ping,
  };
};