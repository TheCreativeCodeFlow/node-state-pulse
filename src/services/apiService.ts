const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Session {
  id: string;
  studentId: string;
  sessionName: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Node {
  id: string;
  name: string;
  type: 'HOST' | 'ROUTER' | 'SWITCH' | 'HUB' | 'GATEWAY' | 'FIREWALL' | 'LOAD_BALANCER' | 'SERVER';
  positionX: number;
  positionY: number;
  ipAddress?: string;
  macAddress?: string;
  processingDelay: number;
  bufferSize: number;
  isActive: boolean;
  metadata?: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: 'ETHERNET' | 'WIFI' | 'FIBER' | 'COAX' | 'SERIAL' | 'USB' | 'BLUETOOTH' | 'ZIGBEE' | 'CELLULAR';
  bandwidth: number;
  latency: number;
  packetLossRate: number;
  jitter: number;
  mtu: number;
  isActive: boolean;
  isBidirectional: boolean;
  cost: number;
  metadata?: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationConfig {
  messageInterval?: number;
  packetLossRate?: number;
  corruptionRate?: number;
  maxDelayMs?: number;
  connectionFailureRate?: number;
  enableAnomalies?: boolean;
  enableLogging?: boolean;
  maxSimulationTimeMs?: number;
  routingAlgorithm?: string;
}

export interface BackendPacket {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  size: number;
  payload: string;
  priority: number;
  status: 'CREATED' | 'TRANSMITTED' | 'DELIVERED' | 'LOST' | 'CORRUPTED' | 'TIMEOUT';
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

class APIService {
  private getHeaders(studentId: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Student-Id': studentId,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { studentId?: string } = {}
  ): Promise<T> {
    const { studentId, ...requestOptions } = options;
    
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = studentId ? this.getHeaders(studentId) : { 'Content-Type': 'application/json' };
    
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        ...headers,
        ...requestOptions.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Session Management
  async getSessions(studentId: string): Promise<Session[]> {
    return this.request<Session[]>('/sessions', { studentId });
  }

  async createSession(studentId: string, sessionData: { sessionName: string; description?: string }): Promise<Session> {
    return this.request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
      studentId,
    });
  }

  async getSession(sessionId: string, studentId: string): Promise<Session> {
    return this.request<Session>(`/sessions/${sessionId}`, { studentId });
  }

  async updateSession(sessionId: string, studentId: string, sessionData: Partial<Session>): Promise<Session> {
    return this.request<Session>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
      studentId,
    });
  }

  async deleteSession(sessionId: string, studentId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}`, {
      method: 'DELETE',
      studentId,
    });
  }

  // Node Management
  async getNodes(sessionId: string, studentId: string): Promise<Node[]> {
    return this.request<Node[]>(`/sessions/${sessionId}/nodes`, { studentId });
  }

  async createNode(sessionId: string, studentId: string, nodeData: Omit<Node, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>): Promise<Node> {
    return this.request<Node>(`/sessions/${sessionId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(nodeData),
      studentId,
    });
  }

  async updateNode(sessionId: string, nodeId: string, studentId: string, nodeData: Partial<Node>): Promise<Node> {
    return this.request<Node>(`/sessions/${sessionId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData),
      studentId,
    });
  }

  async deleteNode(sessionId: string, nodeId: string, studentId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}/nodes/${nodeId}`, {
      method: 'DELETE',
      studentId,
    });
  }

  // Connection Management
  async getConnections(sessionId: string, studentId: string): Promise<Connection[]> {
    return this.request<Connection[]>(`/sessions/${sessionId}/connections`, { studentId });
  }

  async createConnection(sessionId: string, studentId: string, connectionData: Omit<Connection, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>): Promise<Connection> {
    return this.request<Connection>(`/sessions/${sessionId}/connections`, {
      method: 'POST',
      body: JSON.stringify(connectionData),
      studentId,
    });
  }

  async deleteConnection(sessionId: string, connectionId: string, studentId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}/connections/${connectionId}`, {
      method: 'DELETE',
      studentId,
    });
  }

  // Simulation Control
  async startSimulation(sessionId: string, studentId: string, config?: SimulationConfig): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/simulation/${sessionId}/start`, {
      method: 'POST',
      body: JSON.stringify(config || {}),
      studentId,
    });
  }

  async stopSimulation(sessionId: string, studentId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/simulation/${sessionId}/stop`, {
      method: 'POST',
      studentId,
    });
  }

  async getSimulationStatus(sessionId: string, studentId: string): Promise<any> {
    return this.request<any>(`/simulation/${sessionId}/status`, { studentId });
  }

  // Logs
  async getLogs(sessionId: string, studentId: string, page = 0, size = 50): Promise<any> {
    return this.request<any>(`/logs/${sessionId}?page=${page}&size=${size}`, { studentId });
  }

  async getPacketJourney(sessionId: string, packetId: string, studentId: string): Promise<any[]> {
    return this.request<any[]>(`/logs/${sessionId}/packet/${packetId}`, { studentId });
  }

  // Undo/Redo
  async undo(sessionId: string, studentId: string): Promise<boolean> {
    return this.request<boolean>(`/sessions/${sessionId}/undo`, {
      method: 'POST',
      studentId,
    });
  }

  async redo(sessionId: string, studentId: string): Promise<boolean> {
    return this.request<boolean>(`/sessions/${sessionId}/redo`, {
      method: 'POST',
      studentId,
    });
  }

  // Packet Management
  async sendPacket(
    sessionId: string, 
    studentId: string, 
    packetData: {
      sourceNodeId: string;
      targetNodeId: string;
      size: number;
      payload: string;
      priority: number;
    }
  ): Promise<BackendPacket> {
    return this.request<BackendPacket>(`/sessions/${sessionId}/packets`, {
      method: 'POST',
      body: JSON.stringify(packetData),
      studentId,
    });
  }
}

export const apiService = new APIService();