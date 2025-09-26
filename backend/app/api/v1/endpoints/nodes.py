from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
import logging

from app.core.database import get_db
from app.models.database import Node, Session, UndoRedoHistory
from app.models.schemas import NodeCreate, NodeUpdate, NodeResponse
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


@router.post("/{session_id}/nodes", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    session_id: str,
    node_data: NodeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new node in a session"""
    await _verify_session_exists(session_id, db)
    
    # Check node limit
    result = await db.execute(select(Node).where(Node.session_id == session_id))
    existing_nodes = result.scalars().all()
    
    if len(existing_nodes) >= settings.MAX_NODES_PER_SESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum nodes per session ({settings.MAX_NODES_PER_SESSION}) exceeded"
        )
    
    # Check for duplicate names in the session
    for node in existing_nodes:
        if node.name == node_data.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Node with name '{node_data.name}' already exists in this session"
            )
    
    db_node = Node(
        session_id=session_id,
        name=node_data.name,
        node_type=node_data.node_type,
        x_position=node_data.x_position,
        y_position=node_data.y_position,
        properties=node_data.properties
    )
    
    db.add(db_node)
    await db.commit()
    await db.refresh(db_node)
    
    # Add to undo history
    await _add_undo_history(
        session_id, "create_node", "node", db_node.id, 
        {}, db_node.__dict__.copy(), db
    )
    await db.commit()
    
    logger.info(f"Created node {db_node.id} in session {session_id}")
    return NodeResponse.model_validate(db_node)


@router.get("/{session_id}/nodes", response_model=List[NodeResponse])
async def get_nodes(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all nodes in a session"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(select(Node).where(Node.session_id == session_id))
    nodes = result.scalars().all()
    
    return [NodeResponse.model_validate(node) for node in nodes]


@router.get("/{session_id}/nodes/{node_id}", response_model=NodeResponse)
async def get_node(
    session_id: str,
    node_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific node by ID"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Node).where(Node.id == node_id, Node.session_id == session_id)
    )
    node = result.scalar_one_or_none()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    return NodeResponse.model_validate(node)


@router.put("/{session_id}/nodes/{node_id}", response_model=NodeResponse)
async def update_node(
    session_id: str,
    node_id: int,
    node_data: NodeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a node"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Node).where(Node.id == node_id, Node.session_id == session_id)
    )
    node = result.scalar_one_or_none()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Store before state for undo
    before_state = {
        "name": node.name,
        "node_type": node.node_type,
        "x_position": node.x_position,
        "y_position": node.y_position,
        "status": node.status,
        "properties": node.properties
    }
    
    # Check for duplicate names if name is being changed
    if node_data.name and node_data.name != node.name:
        result = await db.execute(
            select(Node).where(
                Node.session_id == session_id,
                Node.name == node_data.name,
                Node.id != node_id
            )
        )
        existing_node = result.scalar_one_or_none()
        if existing_node:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Node with name '{node_data.name}' already exists in this session"
            )
    
    # Update fields
    update_data = {}
    if node_data.name is not None:
        update_data["name"] = node_data.name
    if node_data.node_type is not None:
        update_data["node_type"] = node_data.node_type
    if node_data.x_position is not None:
        update_data["x_position"] = node_data.x_position
    if node_data.y_position is not None:
        update_data["y_position"] = node_data.y_position
    if node_data.status is not None:
        update_data["status"] = node_data.status
    if node_data.properties is not None:
        update_data["properties"] = node_data.properties
    
    if update_data:
        await db.execute(
            update(Node)
            .where(Node.id == node_id, Node.session_id == session_id)
            .values(**update_data)
        )
        await db.commit()
    
    # Get updated node
    result = await db.execute(
        select(Node).where(Node.id == node_id, Node.session_id == session_id)
    )
    updated_node = result.scalar_one()
    
    # Add to undo history
    after_state = {
        "name": updated_node.name,
        "node_type": updated_node.node_type,
        "x_position": updated_node.x_position,
        "y_position": updated_node.y_position,
        "status": updated_node.status,
        "properties": updated_node.properties
    }
    
    await _add_undo_history(
        session_id, "update_node", "node", node_id, 
        before_state, after_state, db
    )
    await db.commit()
    
    logger.info(f"Updated node {node_id} in session {session_id}")
    return NodeResponse.model_validate(updated_node)


@router.delete("/{session_id}/nodes/{node_id}")
async def delete_node(
    session_id: str,
    node_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a node"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Node).where(Node.id == node_id, Node.session_id == session_id)
    )
    node = result.scalar_one_or_none()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Store before state for undo
    before_state = {
        "name": node.name,
        "node_type": node.node_type,
        "x_position": node.x_position,
        "y_position": node.y_position,
        "status": node.status,
        "properties": node.properties
    }
    
    # Check if node has connections
    from app.models.database import Connection
    result = await db.execute(
        select(Connection).where(
            (Connection.source_node_id == node_id) | 
            (Connection.destination_node_id == node_id),
            Connection.session_id == session_id
        )
    )
    connections = result.scalars().all()
    
    if connections:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete node with existing connections. Delete connections first."
        )
    
    # Add to undo history before deletion
    await _add_undo_history(
        session_id, "delete_node", "node", node_id, 
        before_state, {}, db
    )
    
    # Delete the node
    await db.execute(
        delete(Node).where(Node.id == node_id, Node.session_id == session_id)
    )
    await db.commit()
    
    logger.info(f"Deleted node {node_id} from session {session_id}")
    return {"message": "Node deleted successfully"}