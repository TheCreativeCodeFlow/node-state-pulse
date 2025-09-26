from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
import logging

from app.core.database import get_db
from app.models.database import Message, Node, Session
from app.models.schemas import MessageCreate, MessageResponse

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


@router.post("/{session_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    session_id: str,
    message_data: MessageCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new message for simulation"""
    await _verify_session_exists(session_id, db)
    
    # Verify both nodes exist in the session
    result = await db.execute(
        select(Node).where(
            Node.session_id == session_id,
            Node.id.in_([message_data.source_node_id, message_data.destination_node_id])
        )
    )
    nodes = result.scalars().all()
    
    if len(nodes) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or both nodes not found in the session"
        )
    
    # Check if nodes are the same
    if message_data.source_node_id == message_data.destination_node_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and destination nodes cannot be the same"
        )
    
    db_message = Message(
        session_id=session_id,
        source_node_id=message_data.source_node_id,
        destination_node_id=message_data.destination_node_id,
        message_type=message_data.message_type,
        content=message_data.content,
        packet_size_bytes=message_data.packet_size_bytes,
        priority=message_data.priority
    )
    
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    
    logger.info(f"Created message {db_message.id} in session {session_id}")
    return MessageResponse.model_validate(db_message)


@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all messages in a session"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(select(Message).where(Message.session_id == session_id))
    messages = result.scalars().all()
    
    return [MessageResponse.model_validate(message) for message in messages]


@router.get("/{session_id}/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    session_id: str,
    message_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific message by ID"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.session_id == session_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return MessageResponse.model_validate(message)


@router.delete("/{session_id}/messages/{message_id}")
async def delete_message(
    session_id: str,
    message_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a message"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.session_id == session_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Only allow deletion if message is not in transit
    if message.status == "in_transit":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete message that is currently in transit"
        )
    
    await db.execute(
        delete(Message).where(Message.id == message_id, Message.session_id == session_id)
    )
    await db.commit()
    
    logger.info(f"Deleted message {message_id} from session {session_id}")
    return {"message": "Message deleted successfully"}