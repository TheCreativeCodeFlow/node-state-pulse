import { useState, useCallback, useEffect } from 'react';
import { nodeAPI, connectionAPI, messageAPI, anomalyAPI, simulationAPI } from '@/services/api';
import {
  NodeResponse,
  NodeCreate,
  NodeUpdate,
  ConnectionResponse,
  ConnectionCreate,
  MessageResponse,
  MessageCreate,
  AnomalyResponse,
  AnomalyCreate,
  SimulationRequest,
} from '@/types/api';
import { toast } from 'sonner';

interface UseNetworkSimulationReturn {
  // Data state
  nodes: NodeResponse[];
  connections: ConnectionResponse[];
  messages: MessageResponse[];
  anomalies: AnomalyResponse[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Node operations
  createNode: (data: NodeCreate) => Promise<NodeResponse | null>;
  updateNode: (nodeId: number, data: NodeUpdate) => Promise<NodeResponse | null>;
  deleteNode: (nodeId: number) => Promise<void>;
  
  // Connection operations
  createConnection: (data: ConnectionCreate) => Promise<ConnectionResponse | null>;
  deleteConnection: (connectionId: number) => Promise<void>;
  
  // Message operations
  createMessage: (data: MessageCreate) => Promise<MessageResponse | null>;
  deleteMessage: (messageId: number) => Promise<void>;
  
  // Anomaly operations
  createAnomaly: (data: AnomalyCreate) => Promise<AnomalyResponse | null>;
  toggleAnomaly: (anomalyId: number) => Promise<void>;
  deleteAnomaly: (anomalyId: number) => Promise<void>;
  
  // Simulation operations
  startSimulation: (data: SimulationRequest) => Promise<void>;
  stopSimulation: (simulationId: string) => Promise<void>;
  validateNetwork: () => Promise<any>;
  
  // Data refresh
  refreshAll: () => Promise<void>;
  refreshNodes: () => Promise<void>;
  refreshConnections: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshAnomalies: () => Promise<void>;
}

export const useNetworkSimulation = (sessionId: string | null): UseNetworkSimulationReturn => {
  // Data state
  const [nodes, setNodes] = useState<NodeResponse[]>([]);
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyResponse[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle API errors
  const handleApiError = (err: any, defaultMessage: string) => {
    const errorMessage = err.response?.data?.detail || defaultMessage;
    setError(errorMessage);
    toast.error(errorMessage);
    return errorMessage;
  };

  // Node operations
  const createNode = useCallback(async (data: NodeCreate): Promise<NodeResponse | null> => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newNode = await nodeAPI.create(sessionId, data);
      setNodes(prev => [...prev, newNode]);
      toast.success(`Created ${data.node_type}: ${data.name}`);
      return newNode;
    } catch (err: any) {
      handleApiError(err, 'Failed to create node');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const updateNode = useCallback(async (nodeId: number, data: NodeUpdate): Promise<NodeResponse | null> => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNode = await nodeAPI.update(sessionId, nodeId, data);
      setNodes(prev => prev.map(node => node.id === nodeId ? updatedNode : node));
      toast.success(`Updated node: ${updatedNode.name}`);
      return updatedNode;
    } catch (err: any) {
      handleApiError(err, 'Failed to update node');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const deleteNode = useCallback(async (nodeId: number): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await nodeAPI.delete(sessionId, nodeId);
      setNodes(prev => prev.filter(node => node.id !== nodeId));
      // Also remove connections that involve this node
      setConnections(prev => prev.filter(conn => 
        conn.source_node_id !== nodeId && conn.destination_node_id !== nodeId
      ));
      toast.success('Node deleted');
    } catch (err: any) {
      handleApiError(err, 'Failed to delete node');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Connection operations
  const createConnection = useCallback(async (data: ConnectionCreate): Promise<ConnectionResponse | null> => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newConnection = await connectionAPI.create(sessionId, data);
      setConnections(prev => [...prev, newConnection]);
      toast.success('Connection created');
      return newConnection;
    } catch (err: any) {
      handleApiError(err, 'Failed to create connection');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const deleteConnection = useCallback(async (connectionId: number): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await connectionAPI.delete(sessionId, connectionId);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast.success('Connection deleted');
    } catch (err: any) {
      handleApiError(err, 'Failed to delete connection');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Message operations
  const createMessage = useCallback(async (data: MessageCreate): Promise<MessageResponse | null> => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newMessage = await messageAPI.create(sessionId, data);
      setMessages(prev => [...prev, newMessage]);
      toast.success('Message created');
      return newMessage;
    } catch (err: any) {
      handleApiError(err, 'Failed to create message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const deleteMessage = useCallback(async (messageId: number): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await messageAPI.delete(sessionId, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted');
    } catch (err: any) {
      handleApiError(err, 'Failed to delete message');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Anomaly operations
  const createAnomaly = useCallback(async (data: AnomalyCreate): Promise<AnomalyResponse | null> => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newAnomaly = await anomalyAPI.create(sessionId, data);
      setAnomalies(prev => [...prev, newAnomaly]);
      toast.success(`Created ${data.anomaly_type} anomaly`);
      return newAnomaly;
    } catch (err: any) {
      handleApiError(err, 'Failed to create anomaly');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const toggleAnomaly = useCallback(async (anomalyId: number): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedAnomaly = await anomalyAPI.toggle(sessionId, anomalyId);
      setAnomalies(prev => prev.map(anomaly => 
        anomaly.id === anomalyId ? updatedAnomaly : anomaly
      ));
      toast.success(`Anomaly ${updatedAnomaly.is_active ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      handleApiError(err, 'Failed to toggle anomaly');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const deleteAnomaly = useCallback(async (anomalyId: number): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await anomalyAPI.delete(sessionId, anomalyId);
      setAnomalies(prev => prev.filter(anomaly => anomaly.id !== anomalyId));
      toast.success('Anomaly deleted');
    } catch (err: any) {
      handleApiError(err, 'Failed to delete anomaly');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Simulation operations
  const startSimulation = useCallback(async (data: SimulationRequest): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await simulationAPI.start(sessionId, data);
      toast.success('Simulation started');
    } catch (err: any) {
      handleApiError(err, 'Failed to start simulation');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const stopSimulation = useCallback(async (simulationId: string): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await simulationAPI.stop(sessionId, simulationId);
      toast.success('Simulation stopped');
    } catch (err: any) {
      handleApiError(err, 'Failed to stop simulation');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const validateNetwork = useCallback(async (): Promise<any> => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await simulationAPI.validate(sessionId);
      toast.success('Network validation completed');
      return result;
    } catch (err: any) {
      handleApiError(err, 'Failed to validate network');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Data refresh operations
  const refreshNodes = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    
    try {
      const nodeList = await nodeAPI.getAll(sessionId);
      setNodes(nodeList);
    } catch (err: any) {
      handleApiError(err, 'Failed to refresh nodes');
    }
  }, [sessionId]);

  const refreshConnections = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    
    try {
      const connectionList = await connectionAPI.getAll(sessionId);
      setConnections(connectionList);
    } catch (err: any) {
      handleApiError(err, 'Failed to refresh connections');
    }
  }, [sessionId]);

  const refreshMessages = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    
    try {
      const messageList = await messageAPI.getAll(sessionId);
      setMessages(messageList);
    } catch (err: any) {
      handleApiError(err, 'Failed to refresh messages');
    }
  }, [sessionId]);

  const refreshAnomalies = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    
    try {
      const anomalyList = await anomalyAPI.getAll(sessionId);
      setAnomalies(anomalyList);
    } catch (err: any) {
      handleApiError(err, 'Failed to refresh anomalies');
    }
  }, [sessionId]);

  const refreshAll = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    
    try {
      await Promise.all([
        refreshNodes(),
        refreshConnections(),
        refreshMessages(),
        refreshAnomalies(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, refreshNodes, refreshConnections, refreshMessages, refreshAnomalies]);

  // Load initial data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      refreshAll();
    } else {
      // Clear data when no session
      setNodes([]);
      setConnections([]);
      setMessages([]);
      setAnomalies([]);
    }
  }, [sessionId, refreshAll]);

  return {
    // Data state
    nodes,
    connections,
    messages,
    anomalies,
    
    // Loading states
    isLoading,
    error,
    
    // Node operations
    createNode,
    updateNode,
    deleteNode,
    
    // Connection operations
    createConnection,
    deleteConnection,
    
    // Message operations
    createMessage,
    deleteMessage,
    
    // Anomaly operations
    createAnomaly,
    toggleAnomaly,
    deleteAnomaly,
    
    // Simulation operations
    startSimulation,
    stopSimulation,
    validateNetwork,
    
    // Data refresh
    refreshAll,
    refreshNodes,
    refreshConnections,
    refreshMessages,
    refreshAnomalies,
  };
};