from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
import uuid
import logging

from app.core.database import get_db
from app.models.database import Session, UndoRedoHistory
from app.models.schemas import SessionCreate, SessionResponse, UndoRedoRequest, UndoRedoResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new student session"""
    session_id = str(uuid.uuid4())
    
    db_session = Session(
        id=session_id,
        student_name=session_data.student_name,
        metadata_json=session_data.metadata_json
    )
    
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    
    logger.info(f"Created new session {session_id} for student {session_data.student_name}")
    return SessionResponse.model_validate(db_session)


@router.get("/", response_model=List[SessionResponse])
async def get_all_sessions(
    db: AsyncSession = Depends(get_db)
):
    """Get all sessions (for admin/teacher view)"""
    result = await db.execute(select(Session).where(Session.is_active == True))
    sessions = result.scalars().all()
    return [SessionResponse.model_validate(session) for session in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific session by ID"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return SessionResponse.model_validate(session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update session information"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Update session fields
    await db.execute(
        update(Session)
        .where(Session.id == session_id)
        .values(
            student_name=session_data.student_name,
            metadata_json=session_data.metadata_json
        )
    )
    
    await db.commit()
    
    # Get updated session
    result = await db.execute(select(Session).where(Session.id == session_id))
    updated_session = result.scalar_one()
    
    logger.info(f"Updated session {session_id}")
    return SessionResponse.model_validate(updated_session)


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a session (mark as inactive)"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Soft delete by marking as inactive
    await db.execute(
        update(Session)
        .where(Session.id == session_id)
        .values(is_active=False)
    )
    
    await db.commit()
    
    logger.info(f"Soft deleted session {session_id}")
    return {"message": "Session deactivated successfully"}


@router.post("/{session_id}/undo-redo", response_model=UndoRedoResponse)
async def handle_undo_redo(
    session_id: str,
    request: UndoRedoRequest,
    db: AsyncSession = Depends(get_db)
):
    """Handle undo/redo operations for a session"""
    # Check if session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if request.action == "undo":
        # Find the most recent action that hasn't been undone
        result = await db.execute(
            select(UndoRedoHistory)
            .where(UndoRedoHistory.session_id == session_id)
            .where(UndoRedoHistory.is_undone == False)
            .order_by(UndoRedoHistory.timestamp.desc())
            .limit(1)
        )
        history_item = result.scalar_one_or_none()
        
        if not history_item:
            return UndoRedoResponse(
                success=False,
                action_performed="undo",
                message="No actions to undo"
            )
        
        # Mark as undone (actual restoration logic would be implemented in respective endpoints)
        await db.execute(
            update(UndoRedoHistory)
            .where(UndoRedoHistory.id == history_item.id)
            .values(is_undone=True)
        )
        
        await db.commit()
        
        logger.info(f"Performed undo for session {session_id}, action: {history_item.action_type}")
        return UndoRedoResponse(
            success=True,
            action_performed="undo",
            message=f"Undone action: {history_item.action_type}"
        )
    
    elif request.action == "redo":
        # Find the most recent undone action
        result = await db.execute(
            select(UndoRedoHistory)
            .where(UndoRedoHistory.session_id == session_id)
            .where(UndoRedoHistory.is_undone == True)
            .order_by(UndoRedoHistory.timestamp.desc())
            .limit(1)
        )
        history_item = result.scalar_one_or_none()
        
        if not history_item:
            return UndoRedoResponse(
                success=False,
                action_performed="redo",
                message="No actions to redo"
            )
        
        # Mark as not undone (actual restoration logic would be implemented in respective endpoints)
        await db.execute(
            update(UndoRedoHistory)
            .where(UndoRedoHistory.id == history_item.id)
            .values(is_undone=False)
        )
        
        await db.commit()
        
        logger.info(f"Performed redo for session {session_id}, action: {history_item.action_type}")
        return UndoRedoResponse(
            success=True,
            action_performed="redo",
            message=f"Redone action: {history_item.action_type}"
        )


@router.get("/{session_id}/stats")
async def get_session_stats(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get session statistics"""
    # Check if session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Count related entities
    from app.models.database import Node, Connection, Message, Anomaly
    
    # Count nodes
    result = await db.execute(select(Node).where(Node.session_id == session_id))
    node_count = len(result.scalars().all())
    
    # Count connections
    result = await db.execute(select(Connection).where(Connection.session_id == session_id))
    connection_count = len(result.scalars().all())
    
    # Count messages
    result = await db.execute(select(Message).where(Message.session_id == session_id))
    message_count = len(result.scalars().all())
    
    # Count anomalies
    result = await db.execute(select(Anomaly).where(Anomaly.session_id == session_id))
    anomaly_count = len(result.scalars().all())
    
    return {
        "session_id": session_id,
        "student_name": session.student_name,
        "created_at": session.created_at,
        "statistics": {
            "nodes": node_count,
            "connections": connection_count,
            "messages": message_count,
            "anomalies": anomaly_count
        }
    }