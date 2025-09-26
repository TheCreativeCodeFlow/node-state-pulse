from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums for validation
class NodeType(str, Enum):
    ROUTER = "router"
    SWITCH = "switch" 
    HOST = "host"
    SERVER = "server"


class NodeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class ConnectionType(str, Enum):
    ETHERNET = "ethernet"
    WIFI = "wifi"
    FIBER = "fiber"


class MessageType(str, Enum):
    DATA = "data"
    CONTROL = "control"
    BROADCAST = "broadcast"


class MessageStatus(str, Enum):
    QUEUED = "queued"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"


class AnomalyType(str, Enum):
    PACKET_LOSS = "packet_loss"
    DELAY = "delay"
    CORRUPTION = "corruption"
    WRONG_DELIVERY = "wrong_delivery"
    OUT_OF_ORDER = "out_of_order"
    CONNECTION_LOSS = "connection_loss"


# Session Schemas
class SessionCreate(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=100)
    metadata_json: Optional[Dict[str, Any]] = {}


class SessionResponse(BaseModel):
    id: str
    student_name: str
    created_at: datetime
    updated_at: Optional[datetime]
    is_active: bool
    metadata_json: Dict[str, Any]

    class Config:
        from_attributes = True


# Node Schemas
class NodeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    node_type: NodeType = NodeType.ROUTER
    x_position: float = Field(..., ge=0, le=2000)
    y_position: float = Field(..., ge=0, le=2000)
    properties: Optional[Dict[str, Any]] = {}


class NodeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    node_type: Optional[NodeType] = None
    x_position: Optional[float] = Field(None, ge=0, le=2000)
    y_position: Optional[float] = Field(None, ge=0, le=2000)
    status: Optional[NodeStatus] = None
    properties: Optional[Dict[str, Any]] = None


class NodeResponse(BaseModel):
    id: int
    session_id: str
    name: str
    node_type: NodeType
    x_position: float
    y_position: float
    status: NodeStatus
    properties: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Connection Schemas
class ConnectionCreate(BaseModel):
    source_node_id: int
    destination_node_id: int
    connection_type: ConnectionType = ConnectionType.ETHERNET
    bandwidth_mbps: float = Field(default=100.0, gt=0, le=10000)
    latency_ms: float = Field(default=10.0, ge=0, le=1000)
    properties: Optional[Dict[str, Any]] = {}


class ConnectionUpdate(BaseModel):
    connection_type: Optional[ConnectionType] = None
    bandwidth_mbps: Optional[float] = Field(None, gt=0, le=10000)
    latency_ms: Optional[float] = Field(None, ge=0, le=1000)
    status: Optional[NodeStatus] = None
    properties: Optional[Dict[str, Any]] = None


class ConnectionResponse(BaseModel):
    id: int
    session_id: str
    source_node_id: int
    destination_node_id: int
    connection_type: ConnectionType
    bandwidth_mbps: float
    latency_ms: float
    status: NodeStatus
    properties: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Message Schemas
class MessageCreate(BaseModel):
    source_node_id: int
    destination_node_id: int
    message_type: MessageType = MessageType.DATA
    content: Optional[str] = ""
    packet_size_bytes: int = Field(default=1024, gt=0, le=65536)
    priority: int = Field(default=1, ge=1, le=5)


class MessageResponse(BaseModel):
    id: int
    session_id: str
    source_node_id: int
    destination_node_id: int
    message_type: MessageType
    content: Optional[str]
    packet_size_bytes: int
    priority: int
    status: MessageStatus
    path_taken: List[int]
    created_at: datetime
    delivered_at: Optional[datetime]

    class Config:
        from_attributes = True


# Anomaly Schemas
class AnomalyCreate(BaseModel):
    anomaly_type: AnomalyType
    affected_node_id: Optional[int] = None
    affected_connection_id: Optional[int] = None
    probability: float = Field(default=0.1, ge=0.0, le=1.0)
    severity: str = Field(default="medium", pattern="^(low|medium|high)$")
    parameters: Optional[Dict[str, Any]] = {}
    expires_at: Optional[datetime] = None


class AnomalyResponse(BaseModel):
    id: int
    session_id: str
    anomaly_type: AnomalyType
    affected_node_id: Optional[int]
    affected_connection_id: Optional[int]
    probability: float
    severity: str
    parameters: Dict[str, Any]
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


# Simulation Schemas
class SimulationRequest(BaseModel):
    message_ids: List[int] = Field(..., min_items=1)
    enable_anomalies: bool = True
    speed_multiplier: float = Field(default=1.0, gt=0, le=10.0)


class SimulationResponse(BaseModel):
    simulation_id: str
    status: str
    message: str


# WebSocket Event Schemas
class WebSocketEvent(BaseModel):
    event_type: str
    session_id: str
    timestamp: datetime
    data: Dict[str, Any]


# AI Query Schemas
class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    context_type: str = Field(default="session", pattern="^(session|anomaly|simulation)$")
    include_logs: bool = True


class AIQueryResponse(BaseModel):
    response: str
    context_used: List[str]
    timestamp: datetime


# Undo/Redo Schemas
class UndoRedoRequest(BaseModel):
    action: str = Field(..., pattern="^(undo|redo)$")


class UndoRedoResponse(BaseModel):
    success: bool
    action_performed: str
    message: str