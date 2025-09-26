from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
import logging

from app.core.database import get_db
from app.models.database import Connection, Node, Session, UndoRedoHistory
from app.models.schemas import ConnectionCreate, ConnectionUpdate, ConnectionResponse
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


async def _verify_session_exists(session_id: str, db: AsyncSession):
    """Helper function to verify session exists"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


async def _verify_nodes_exist(session_id: str, source_node_id: int, destination_node_id: int, db: AsyncSession):
    """Helper function to verify both nodes exist in the session"""
    result = await db.execute(
        select(Node).where(
            Node.session_id == session_id,
            Node.id.in_([source_node_id, destination_node_id])
        )
    )
    nodes = result.scalars().all()
    
    if len(nodes) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or both nodes not found in the session"
        )
    
    return nodes


async def _add_undo_history(session_id: str, action_type: str, entity_type: str, 
                           entity_id: int, before_state: dict, after_state: dict, db: AsyncSession):
    """Helper function to add undo/redo history"""
    history_item = UndoRedoHistory(
        session_id=session_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state
    )
    db.add(history_item)


@router.post("/{session_id}/connections", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    session_id: str,
    connection_data: ConnectionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new connection between nodes in a session"""
    await _verify_session_exists(session_id, db)
    
    # Check connection limit
    result = await db.execute(select(Connection).where(Connection.session_id == session_id))
    existing_connections = result.scalars().all()
    
    if len(existing_connections) >= settings.MAX_CONNECTIONS_PER_SESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum connections per session ({settings.MAX_CONNECTIONS_PER_SESSION}) exceeded"
        )
    
    # Verify both nodes exist in the session
    await _verify_nodes_exist(session_id, connection_data.source_node_id, connection_data.destination_node_id, db)
    
    # Check if nodes are the same
    if connection_data.source_node_id == connection_data.destination_node_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and destination nodes cannot be the same"
        )
    
    # Check if connection already exists (bidirectional)
    result = await db.execute(
        select(Connection).where(
            Connection.session_id == session_id,
            (
                (Connection.source_node_id == connection_data.source_node_id) &
                (Connection.destination_node_id == connection_data.destination_node_id)
            ) | (
                (Connection.source_node_id == connection_data.destination_node_id) &
                (Connection.destination_node_id == connection_data.source_node_id)
            )
        )
    )
    existing_connection = result.scalar_one_or_none()
    
    if existing_connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection already exists between these nodes"
        )
    
    db_connection = Connection(
        session_id=session_id,
        source_node_id=connection_data.source_node_id,
        destination_node_id=connection_data.destination_node_id,
        connection_type=connection_data.connection_type,
        bandwidth_mbps=connection_data.bandwidth_mbps,
        latency_ms=connection_data.latency_ms,
        properties=connection_data.properties
    )
    
    db.add(db_connection)
    await db.commit()
    await db.refresh(db_connection)
    
    # Add to undo history
    await _add_undo_history(
        session_id, "create_connection", "connection", db_connection.id, 
        {}, db_connection.__dict__.copy(), db
    )
    await db.commit()
    
    logger.info(f"Created connection {db_connection.id} in session {session_id}")
    return ConnectionResponse.model_validate(db_connection)


@router.get("/{session_id}/connections", response_model=List[ConnectionResponse])
async def get_connections(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all connections in a session"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(select(Connection).where(Connection.session_id == session_id))
    connections = result.scalars().all()
    
    return [ConnectionResponse.model_validate(connection) for connection in connections]


@router.get("/{session_id}/connections/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    session_id: str,
    connection_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific connection by ID"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Connection).where(Connection.id == connection_id, Connection.session_id == session_id)
    )
    connection = result.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    return ConnectionResponse.model_validate(connection)


@router.put("/{session_id}/connections/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    session_id: str,
    connection_id: int,
    connection_data: ConnectionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a connection"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Connection).where(Connection.id == connection_id, Connection.session_id == session_id)
    )
    connection = result.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Store before state for undo
    before_state = {
        "connection_type": connection.connection_type,
        "bandwidth_mbps": connection.bandwidth_mbps,
        "latency_ms": connection.latency_ms,
        "status": connection.status,
        "properties": connection.properties
    }
    
    # Update fields
    update_data = {}
    if connection_data.connection_type is not None:
        update_data["connection_type"] = connection_data.connection_type
    if connection_data.bandwidth_mbps is not None:
        update_data["bandwidth_mbps"] = connection_data.bandwidth_mbps
    if connection_data.latency_ms is not None:
        update_data["latency_ms"] = connection_data.latency_ms
    if connection_data.status is not None:
        update_data["status"] = connection_data.status
    if connection_data.properties is not None:
        update_data["properties"] = connection_data.properties
    
    if update_data:
        await db.execute(
            update(Connection)
            .where(Connection.id == connection_id, Connection.session_id == session_id)
            .values(**update_data)
        )
        await db.commit()
    
    # Get updated connection
    result = await db.execute(
        select(Connection).where(Connection.id == connection_id, Connection.session_id == session_id)
    )
    updated_connection = result.scalar_one()
    
    # Add to undo history
    after_state = {
        "connection_type": updated_connection.connection_type,
        "bandwidth_mbps": updated_connection.bandwidth_mbps,
        "latency_ms": updated_connection.latency_ms,
        "status": updated_connection.status,
        "properties": updated_connection.properties
    }
    
    await _add_undo_history(
        session_id, "update_connection", "connection", connection_id, 
        before_state, after_state, db
    )
    await db.commit()
    
    logger.info(f"Updated connection {connection_id} in session {session_id}")
    return ConnectionResponse.model_validate(updated_connection)


@router.delete("/{session_id}/connections/{connection_id}")
async def delete_connection(
    session_id: str,
    connection_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a connection"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Connection).where(Connection.id == connection_id, Connection.session_id == session_id)
    )
    connection = result.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Store before state for undo
    before_state = {
        "source_node_id": connection.source_node_id,
        "destination_node_id": connection.destination_node_id,
        "connection_type": connection.connection_type,
        "bandwidth_mbps": connection.bandwidth_mbps,
        "latency_ms": connection.latency_ms,
        "status": connection.status,
        "properties": connection.properties
    }
    
    # Add to undo history before deletion
    await _add_undo_history(
        session_id, "delete_connection", "connection", connection_id, 
        before_state, {}, db
    )
    
    # Delete the connection
    await db.execute(
        delete(Connection).where(Connection.id == connection_id, Connection.session_id == session_id)
    )
    await db.commit()
    
    logger.info(f"Deleted connection {connection_id} from session {session_id}")
    return {"message": "Connection deleted successfully"}


@router.get("/{session_id}/nodes/{node_id}/connections", response_model=List[ConnectionResponse])
async def get_node_connections(
    session_id: str,
    node_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all connections for a specific node"""
    await _verify_session_exists(session_id, db)
    
    # Verify node exists
    result = await db.execute(
        select(Node).where(Node.id == node_id, Node.session_id == session_id)
    )
    node = result.scalar_one_or_none()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Get all connections where this node is source or destination
    result = await db.execute(
        select(Connection).where(
            Connection.session_id == session_id,
            (Connection.source_node_id == node_id) | (Connection.destination_node_id == node_id)
        )
    )
    connections = result.scalars().all()
    
    return [ConnectionResponse.model_validate(connection) for connection in connections]