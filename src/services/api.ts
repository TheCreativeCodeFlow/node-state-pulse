import { apiClient } from '@/lib/api-client';
import {
  SessionCreate,
  SessionResponse,
  NodeCreate,
  NodeUpdate,
  NodeResponse,
  ConnectionCreate,
  ConnectionUpdate,
  ConnectionResponse,
  MessageCreate,
  MessageResponse,
  AnomalyCreate,
  AnomalyResponse,
  SimulationRequest,
  SimulationResponse,
  AIQueryRequest,
  AIQueryResponse,
  UndoRedoRequest,
  UndoRedoResponse,
  SessionStats,
} from '@/types/api';

// Session API
export const sessionAPI = {
  create: async (data: SessionCreate): Promise<SessionResponse> => {
    const response = await apiClient.post('/api/v1/sessions/', data);
    return response.data;
  },

  getAll: async (): Promise<SessionResponse[]> => {
    const response = await apiClient.get('/api/v1/sessions/');
    return response.data;
  },

  getById: async (sessionId: string): Promise<SessionResponse> => {
    const response = await apiClient.get(`/api/v1/sessions/${sessionId}`);
    return response.data;
  },

  update: async (sessionId: string, data: Partial<SessionCreate>): Promise<SessionResponse> => {
    const response = await apiClient.put(`/api/v1/sessions/${sessionId}`, data);
    return response.data;
  },

  delete: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/sessions/${sessionId}`);
  },

  getStats: async (sessionId: string): Promise<SessionStats> => {
    const response = await apiClient.get(`/api/v1/sessions/${sessionId}/stats`);
    return response.data;
  },

  undoRedo: async (sessionId: string, data: UndoRedoRequest): Promise<UndoRedoResponse> => {
    const response = await apiClient.post(`/api/v1/sessions/${sessionId}/undo-redo`, data);
    return response.data;
  },
};

// Node API
export const nodeAPI = {
  create: async (sessionId: string, data: NodeCreate): Promise<NodeResponse> => {
    const response = await apiClient.post(`/api/v1/nodes/${sessionId}/nodes`, data);
    return response.data;
  },

  getAll: async (sessionId: string): Promise<NodeResponse[]> => {
    const response = await apiClient.get(`/api/v1/nodes/${sessionId}/nodes`);
    return response.data;
  },

  getById: async (sessionId: string, nodeId: number): Promise<NodeResponse> => {
    const response = await apiClient.get(`/api/v1/nodes/${sessionId}/nodes/${nodeId}`);
    return response.data;
  },

  update: async (sessionId: string, nodeId: number, data: NodeUpdate): Promise<NodeResponse> => {
    const response = await apiClient.put(`/api/v1/nodes/${sessionId}/nodes/${nodeId}`, data);
    return response.data;
  },

  delete: async (sessionId: string, nodeId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/nodes/${sessionId}/nodes/${nodeId}`);
  },
};

// Connection API
export const connectionAPI = {
  create: async (sessionId: string, data: ConnectionCreate): Promise<ConnectionResponse> => {
    const response = await apiClient.post(`/api/v1/connections/${sessionId}/connections`, data);
    return response.data;
  },

  getAll: async (sessionId: string): Promise<ConnectionResponse[]> => {
    const response = await apiClient.get(`/api/v1/connections/${sessionId}/connections`);
    return response.data;
  },

  getById: async (sessionId: string, connectionId: number): Promise<ConnectionResponse> => {
    const response = await apiClient.get(`/api/v1/connections/${sessionId}/connections/${connectionId}`);
    return response.data;
  },

  update: async (sessionId: string, connectionId: number, data: ConnectionUpdate): Promise<ConnectionResponse> => {
    const response = await apiClient.put(`/api/v1/connections/${sessionId}/connections/${connectionId}`, data);
    return response.data;
  },

  delete: async (sessionId: string, connectionId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/connections/${sessionId}/connections/${connectionId}`);
  },

  getNodeConnections: async (sessionId: string, nodeId: number): Promise<ConnectionResponse[]> => {
    const response = await apiClient.get(`/api/v1/connections/${sessionId}/nodes/${nodeId}/connections`);
    return response.data;
  },
};

// Message API
export const messageAPI = {
  create: async (sessionId: string, data: MessageCreate): Promise<MessageResponse> => {
    const response = await apiClient.post(`/api/v1/messages/${sessionId}/messages`, data);
    return response.data;
  },

  getAll: async (sessionId: string): Promise<MessageResponse[]> => {
    const response = await apiClient.get(`/api/v1/messages/${sessionId}/messages`);
    return response.data;
  },

  getById: async (sessionId: string, messageId: number): Promise<MessageResponse> => {
    const response = await apiClient.get(`/api/v1/messages/${sessionId}/messages/${messageId}`);
    return response.data;
  },

  delete: async (sessionId: string, messageId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/messages/${sessionId}/messages/${messageId}`);
  },
};

// Anomaly API
export const anomalyAPI = {
  create: async (sessionId: string, data: AnomalyCreate): Promise<AnomalyResponse> => {
    const response = await apiClient.post(`/api/v1/anomalies/${sessionId}/anomalies`, data);
    return response.data;
  },

  getAll: async (sessionId: string): Promise<AnomalyResponse[]> => {
    const response = await apiClient.get(`/api/v1/anomalies/${sessionId}/anomalies`);
    return response.data;
  },

  getById: async (sessionId: string, anomalyId: number): Promise<AnomalyResponse> => {
    const response = await apiClient.get(`/api/v1/anomalies/${sessionId}/anomalies/${anomalyId}`);
    return response.data;
  },

  toggle: async (sessionId: string, anomalyId: number): Promise<AnomalyResponse> => {
    const response = await apiClient.put(`/api/v1/anomalies/${sessionId}/anomalies/${anomalyId}/toggle`);
    return response.data;
  },

  delete: async (sessionId: string, anomalyId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/anomalies/${sessionId}/anomalies/${anomalyId}`);
  },
};

// Simulation API
export const simulationAPI = {
  start: async (sessionId: string, data: SimulationRequest): Promise<SimulationResponse> => {
    const response = await apiClient.post(`/api/v1/simulation/${sessionId}/simulate`, data);
    return response.data;
  },

  stop: async (sessionId: string, simulationId: string): Promise<void> => {
    await apiClient.post(`/api/v1/simulation/${sessionId}/simulate/${simulationId}/stop`);
  },

  getStatus: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/api/v1/simulation/${sessionId}/simulate/status`);
    return response.data;
  },

  validate: async (sessionId: string): Promise<any> => {
    const response = await apiClient.post(`/api/v1/simulation/${sessionId}/validate`);
    return response.data;
  },
};

// AI API
export const aiAPI = {
  query: async (sessionId: string, data: AIQueryRequest): Promise<AIQueryResponse> => {
    const response = await apiClient.post(`/api/v1/ai/${sessionId}/query`, data);
    return response.data;
  },

  getSuggestions: async (sessionId: string): Promise<string[]> => {
    const response = await apiClient.get(`/api/v1/ai/${sessionId}/query/suggestions`);
    return response.data;
  },
};