// API Types based on backend schemas

export type NodeType = 'router' | 'switch' | 'host' | 'server';
export type NodeStatus = 'active' | 'inactive' | 'error';
export type ConnectionType = 'ethernet' | 'wifi' | 'fiber';
export type MessageType = 'data' | 'control' | 'broadcast';
export type MessageStatus = 'queued' | 'in_transit' | 'delivered' | 'failed';
export type AnomalyType = 'packet_loss' | 'delay' | 'corruption' | 'wrong_delivery' | 'out_of_order' | 'connection_loss';

// Session interfaces
export interface SessionCreate {
  student_name: string;
  metadata_json?: Record<string, any>;
}

export interface SessionResponse {
  id: string;
  student_name: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  metadata_json: Record<string, any>;
}

// Node interfaces
export interface NodeCreate {
  name: string;
  node_type: NodeType;
  x_position: number;
  y_position: number;
  properties?: Record<string, any>;
}

export interface NodeUpdate {
  name?: string;
  node_type?: NodeType;
  x_position?: number;
  y_position?: number;
  status?: NodeStatus;
  properties?: Record<string, any>;
}

export interface NodeResponse {
  id: number;
  session_id: string;
  name: string;
  node_type: NodeType;
  x_position: number;
  y_position: number;
  status: NodeStatus;
  properties: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

// Connection interfaces
export interface ConnectionCreate {
  source_node_id: number;
  destination_node_id: number;
  connection_type?: ConnectionType;
  bandwidth_mbps?: number;
  latency_ms?: number;
  properties?: Record<string, any>;
}

export interface ConnectionUpdate {
  connection_type?: ConnectionType;
  bandwidth_mbps?: number;
  latency_ms?: number;
  status?: NodeStatus;
  properties?: Record<string, any>;
}

export interface ConnectionResponse {
  id: number;
  session_id: string;
  source_node_id: number;
  destination_node_id: number;
  connection_type: ConnectionType;
  bandwidth_mbps: number;
  latency_ms: number;
  status: NodeStatus;
  properties: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

// Message interfaces
export interface MessageCreate {
  source_node_id: number;
  destination_node_id: number;
  message_type?: MessageType;
  content?: string;
  packet_size_bytes?: number;
  priority?: number;
}

export interface MessageResponse {
  id: number;
  session_id: string;
  source_node_id: number;
  destination_node_id: number;
  message_type: MessageType;
  content?: string;
  packet_size_bytes: number;
  priority: number;
  status: MessageStatus;
  path_taken: number[];
  created_at: string;
  delivered_at?: string;
}

// Anomaly interfaces
export interface AnomalyCreate {
  anomaly_type: AnomalyType;
  affected_node_id?: number;
  affected_connection_id?: number;
  probability?: number;
  severity?: 'low' | 'medium' | 'high';
  parameters?: Record<string, any>;
  expires_at?: string;
}

export interface AnomalyResponse {
  id: number;
  session_id: string;
  anomaly_type: AnomalyType;
  affected_node_id?: number;
  affected_connection_id?: number;
  probability: number;
  severity: string;
  parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

// Simulation interfaces
export interface SimulationRequest {
  message_ids: number[];
  enable_anomalies?: boolean;
  speed_multiplier?: number;
}

export interface SimulationResponse {
  simulation_id: string;
  status: string;
  message: string;
}

// WebSocket event interface
export interface WebSocketEvent {
  event_type: string;
  session_id: string;
  timestamp: string;
  data: Record<string, any>;
}

// AI Query interfaces
export interface AIQueryRequest {
  query: string;
  context_type?: 'session' | 'anomaly' | 'simulation';
  include_logs?: boolean;
}

export interface AIQueryResponse {
  response: string;
  context_used: string[];
  timestamp: string;
}

// Undo/Redo interfaces
export interface UndoRedoRequest {
  action: 'undo' | 'redo';
}

export interface UndoRedoResponse {
  success: boolean;
  action_performed: string;
  message: string;
}

// Session statistics
export interface SessionStats {
  total_nodes: number;
  total_connections: number;
  total_messages: number;
  successful_deliveries: number;
  failed_deliveries: number;
  active_anomalies: number;
}