from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import logging
from datetime import datetime

from app.core.database import get_db
from app.models.schemas import WebSocketEvent

logger = logging.getLogger(__name__)

websocket_router = APIRouter()

class ConnectionManager:
    """Manages WebSocket connections for real-time simulation events"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and store a WebSocket connection"""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.info(f"WebSocket connected for session {session_id}")
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection"""
        if session_id in self.active_connections:
            try:
                self.active_connections[session_id].remove(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
                logger.info(f"WebSocket disconnected for session {session_id}")
            except ValueError:
                pass  # WebSocket was not in the list
    
    async def send_to_session(self, session_id: str, event: WebSocketEvent):
        """Send an event to all connections for a specific session"""
        if session_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(event.model_dump_json())
                except Exception as e:
                    logger.error(f"Failed to send message to WebSocket: {e}")
                    dead_connections.append(connection)
            
            # Remove dead connections
            for connection in dead_connections:
                self.disconnect(connection, session_id)
    
    async def broadcast_to_session(self, session_id: str, event_type: str, data: dict):
        """Broadcast an event to all connections for a session"""
        event = WebSocketEvent(
            event_type=event_type,
            session_id=session_id,
            timestamp=datetime.utcnow(),
            data=data
        )
        await self.send_to_session(session_id, event)

# Global connection manager instance
manager = ConnectionManager()


@websocket_router.websocket("/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time simulation events"""
    await manager.connect(websocket, session_id)
    
    try:
        # Send initial connection confirmation
        await manager.broadcast_to_session(
            session_id,
            "connection_established",
            {"message": "WebSocket connection established", "session_id": session_id}
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive any client messages (optional)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages if needed
                if message.get("type") == "ping":
                    await manager.broadcast_to_session(
                        session_id,
                        "pong",
                        {"timestamp": datetime.utcnow().isoformat()}
                    )
                
            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON from session {session_id}")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                break
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        manager.disconnect(websocket, session_id)