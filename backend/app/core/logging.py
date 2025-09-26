import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import SessionLog
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


class SimulationLogger:
    """Enhanced logging system for simulation events"""
    
    @staticmethod
    async def log_event(
        db: AsyncSession,
        session_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        level: str = "info",
        message: Optional[str] = None,
        broadcast_websocket: bool = False
    ):
        """Log an event to database and optionally broadcast via WebSocket"""
        
        # Create log entry
        session_log = SessionLog(
            session_id=session_id,
            event_type=event_type,
            event_data=event_data,
            level=level,
            message=message or f"{event_type} event occurred"
        )
        
        db.add(session_log)
        
        try:
            await db.commit()
            
            # Broadcast via WebSocket if requested
            if broadcast_websocket:
                await manager.broadcast_to_session(
                    session_id,
                    f"log_{event_type}",
                    {
                        "level": level,
                        "message": message,
                        "data": event_data,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                
        except Exception as e:
            logger.error(f"Failed to log event {event_type} for session {session_id}: {e}")
            await db.rollback()
    
    @staticmethod
    async def log_node_created(db: AsyncSession, session_id: str, node_id: int, node_name: str):
        """Log node creation"""
        await SimulationLogger.log_event(
            db, session_id, "node_created",
            {"node_id": node_id, "node_name": node_name},
            message=f"Node '{node_name}' created"
        )
    
    @staticmethod
    async def log_node_updated(db: AsyncSession, session_id: str, node_id: int, changes: Dict[str, Any]):
        """Log node update"""
        await SimulationLogger.log_event(
            db, session_id, "node_updated",
            {"node_id": node_id, "changes": changes},
            message=f"Node {node_id} updated"
        )
    
    @staticmethod
    async def log_node_deleted(db: AsyncSession, session_id: str, node_id: int, node_name: str):
        """Log node deletion"""
        await SimulationLogger.log_event(
            db, session_id, "node_deleted",
            {"node_id": node_id, "node_name": node_name},
            message=f"Node '{node_name}' deleted"
        )
    
    @staticmethod
    async def log_connection_created(db: AsyncSession, session_id: str, connection_id: int, 
                                   source_node_id: int, destination_node_id: int):
        """Log connection creation"""
        await SimulationLogger.log_event(
            db, session_id, "connection_created",
            {
                "connection_id": connection_id,
                "source_node_id": source_node_id,
                "destination_node_id": destination_node_id
            },
            message=f"Connection created between nodes {source_node_id} and {destination_node_id}"
        )
    
    @staticmethod
    async def log_connection_deleted(db: AsyncSession, session_id: str, connection_id: int,
                                   source_node_id: int, destination_node_id: int):
        """Log connection deletion"""
        await SimulationLogger.log_event(
            db, session_id, "connection_deleted",
            {
                "connection_id": connection_id,
                "source_node_id": source_node_id,
                "destination_node_id": destination_node_id
            },
            message=f"Connection deleted between nodes {source_node_id} and {destination_node_id}"
        )
    
    @staticmethod
    async def log_simulation_started(db: AsyncSession, session_id: str, simulation_id: str, 
                                   message_count: int):
        """Log simulation start"""
        await SimulationLogger.log_event(
            db, session_id, "simulation_started",
            {"simulation_id": simulation_id, "message_count": message_count},
            message=f"Simulation started with {message_count} messages",
            broadcast_websocket=True
        )
    
    @staticmethod
    async def log_simulation_completed(db: AsyncSession, session_id: str, simulation_id: str):
        """Log simulation completion"""
        await SimulationLogger.log_event(
            db, session_id, "simulation_completed",
            {"simulation_id": simulation_id},
            message="Simulation completed successfully",
            broadcast_websocket=True
        )
    
    @staticmethod
    async def log_packet_event(db: AsyncSession, session_id: str, event_type: str, 
                              message_id: int, event_data: Dict[str, Any]):
        """Log packet-level events during simulation"""
        await SimulationLogger.log_event(
            db, session_id, f"packet_{event_type}",
            {"message_id": message_id, **event_data},
            level="debug",
            message=f"Packet {event_type} for message {message_id}"
        )
    
    @staticmethod
    async def log_anomaly_triggered(db: AsyncSession, session_id: str, anomaly_id: int,
                                  anomaly_type: str, affected_message_id: int):
        """Log when an anomaly is triggered"""
        await SimulationLogger.log_event(
            db, session_id, "anomaly_triggered",
            {
                "anomaly_id": anomaly_id,
                "anomaly_type": anomaly_type,
                "affected_message_id": affected_message_id
            },
            level="warning",
            message=f"Anomaly '{anomaly_type}' triggered on message {affected_message_id}",
            broadcast_websocket=True
        )
    
    @staticmethod
    async def log_error(db: AsyncSession, session_id: str, error_type: str, error_message: str,
                       error_data: Optional[Dict[str, Any]] = None):
        """Log errors"""
        await SimulationLogger.log_event(
            db, session_id, "error",
            {"error_type": error_type, "error_message": error_message, **(error_data or {})},
            level="error",
            message=f"Error: {error_message}",
            broadcast_websocket=True
        )