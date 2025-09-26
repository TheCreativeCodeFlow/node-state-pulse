from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

Base = declarative_base()


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True)
    student_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    metadata_json = Column(JSON, default={})
    
    # Relationships
    nodes = relationship("Node", back_populates="session")
    connections = relationship("Connection", back_populates="session")
    messages = relationship("Message", back_populates="session")
    anomalies = relationship("Anomaly", back_populates="session")
    session_logs = relationship("SessionLog", back_populates="session")


class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    name = Column(String, nullable=False)
    node_type = Column(String, default="router")  # router, switch, host, server
    x_position = Column(Float, nullable=False)
    y_position = Column(Float, nullable=False)
    status = Column(String, default="active")  # active, inactive, error
    properties = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="nodes")
    source_connections = relationship("Connection", foreign_keys="Connection.source_node_id", back_populates="source_node")
    destination_connections = relationship("Connection", foreign_keys="Connection.destination_node_id", back_populates="destination_node")
    source_messages = relationship("Message", foreign_keys="Message.source_node_id", back_populates="source_node")
    destination_messages = relationship("Message", foreign_keys="Message.destination_node_id", back_populates="destination_node")


class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    source_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    destination_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    connection_type = Column(String, default="ethernet")  # ethernet, wifi, fiber
    bandwidth_mbps = Column(Float, default=100.0)
    latency_ms = Column(Float, default=10.0)
    status = Column(String, default="active")  # active, inactive, error
    properties = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="connections")
    source_node = relationship("Node", foreign_keys=[source_node_id], back_populates="source_connections")
    destination_node = relationship("Node", foreign_keys=[destination_node_id], back_populates="destination_connections")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    source_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    destination_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    message_type = Column(String, default="data")  # data, control, broadcast
    content = Column(Text)
    packet_size_bytes = Column(Integer, default=1024)
    priority = Column(Integer, default=1)  # 1-5, higher is more priority
    status = Column(String, default="queued")  # queued, in_transit, delivered, failed
    path_taken = Column(JSON, default=[])  # List of node IDs in the path
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    session = relationship("Session", back_populates="messages")
    source_node = relationship("Node", foreign_keys=[source_node_id], back_populates="source_messages")
    destination_node = relationship("Node", foreign_keys=[destination_node_id], back_populates="destination_messages")


class Anomaly(Base):
    __tablename__ = "anomalies"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    anomaly_type = Column(String, nullable=False)  # packet_loss, delay, corruption, wrong_delivery, out_of_order, connection_loss
    affected_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=True)
    affected_connection_id = Column(Integer, ForeignKey("connections.id"), nullable=True)
    probability = Column(Float, default=0.1)  # 0.0 to 1.0
    severity = Column(String, default="medium")  # low, medium, high
    parameters = Column(JSON, default={})  # Anomaly-specific parameters
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    session = relationship("Session", back_populates="anomalies")


class SessionLog(Base):
    __tablename__ = "session_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    event_type = Column(String, nullable=False)  # node_created, connection_made, packet_sent, anomaly_triggered, etc.
    event_data = Column(JSON, default={})
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    level = Column(String, default="info")  # debug, info, warning, error
    message = Column(Text, nullable=True)
    
    # Relationships
    session = relationship("Session", back_populates="session_logs")


class UndoRedoHistory(Base):
    __tablename__ = "undo_redo_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    action_type = Column(String, nullable=False)  # create_node, delete_node, create_connection, etc.
    entity_type = Column(String, nullable=False)  # node, connection
    entity_id = Column(Integer, nullable=True)
    before_state = Column(JSON, nullable=True)  # State before the action
    after_state = Column(JSON, nullable=True)   # State after the action
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_undone = Column(Boolean, default=False)
    
    # Add foreign key constraint but no relationship to avoid circular references
    session_id_fk = Column(String, ForeignKey("sessions.id"), nullable=False)