from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
import logging

from app.core.database import get_db
from app.models.database import Anomaly, Node, Connection, Session
from app.models.schemas import AnomalyCreate, AnomalyResponse

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


@router.post("/{session_id}/anomalies", response_model=AnomalyResponse, status_code=status.HTTP_201_CREATED)
async def create_anomaly(
    session_id: str,
    anomaly_data: AnomalyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new anomaly for simulation"""
    await _verify_session_exists(session_id, db)
    
    # Verify affected node or connection exists if specified
    if anomaly_data.affected_node_id:
        result = await db.execute(
            select(Node).where(
                Node.id == anomaly_data.affected_node_id,
                Node.session_id == session_id
            )
        )
        node = result.scalar_one_or_none()
        if not node:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Affected node not found in the session"
            )
    
    if anomaly_data.affected_connection_id:
        result = await db.execute(
            select(Connection).where(
                Connection.id == anomaly_data.affected_connection_id,
                Connection.session_id == session_id
            )
        )
        connection = result.scalar_one_or_none()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Affected connection not found in the session"
            )
    
    db_anomaly = Anomaly(
        session_id=session_id,
        anomaly_type=anomaly_data.anomaly_type,
        affected_node_id=anomaly_data.affected_node_id,
        affected_connection_id=anomaly_data.affected_connection_id,
        probability=anomaly_data.probability,
        severity=anomaly_data.severity,
        parameters=anomaly_data.parameters,
        expires_at=anomaly_data.expires_at
    )
    
    db.add(db_anomaly)
    await db.commit()
    await db.refresh(db_anomaly)
    
    logger.info(f"Created anomaly {db_anomaly.id} in session {session_id}")
    return AnomalyResponse.model_validate(db_anomaly)


@router.get("/{session_id}/anomalies", response_model=List[AnomalyResponse])
async def get_anomalies(
    session_id: str,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Get all anomalies in a session"""
    await _verify_session_exists(session_id, db)
    
    query = select(Anomaly).where(Anomaly.session_id == session_id)
    if active_only:
        query = query.where(Anomaly.is_active == True)
    
    result = await db.execute(query)
    anomalies = result.scalars().all()
    
    return [AnomalyResponse.model_validate(anomaly) for anomaly in anomalies]


@router.get("/{session_id}/anomalies/{anomaly_id}", response_model=AnomalyResponse)
async def get_anomaly(
    session_id: str,
    anomaly_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific anomaly by ID"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Anomaly).where(Anomaly.id == anomaly_id, Anomaly.session_id == session_id)
    )
    anomaly = result.scalar_one_or_none()
    
    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly not found"
        )
    
    return AnomalyResponse.model_validate(anomaly)


@router.put("/{session_id}/anomalies/{anomaly_id}/toggle")
async def toggle_anomaly(
    session_id: str,
    anomaly_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Toggle anomaly active/inactive status"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Anomaly).where(Anomaly.id == anomaly_id, Anomaly.session_id == session_id)
    )
    anomaly = result.scalar_one_or_none()
    
    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly not found"
        )
    
    new_status = not anomaly.is_active
    
    await db.execute(
        update(Anomaly)
        .where(Anomaly.id == anomaly_id, Anomaly.session_id == session_id)
        .values(is_active=new_status)
    )
    await db.commit()
    
    logger.info(f"Toggled anomaly {anomaly_id} to {'active' if new_status else 'inactive'}")
    return {"message": f"Anomaly {'activated' if new_status else 'deactivated'} successfully"}


@router.delete("/{session_id}/anomalies/{anomaly_id}")
async def delete_anomaly(
    session_id: str,
    anomaly_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an anomaly"""
    await _verify_session_exists(session_id, db)
    
    result = await db.execute(
        select(Anomaly).where(Anomaly.id == anomaly_id, Anomaly.session_id == session_id)
    )
    anomaly = result.scalar_one_or_none()
    
    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly not found"
        )
    
    await db.execute(
        delete(Anomaly).where(Anomaly.id == anomaly_id, Anomaly.session_id == session_id)
    )
    await db.commit()
    
    logger.info(f"Deleted anomaly {anomaly_id} from session {session_id}")
    return {"message": "Anomaly deleted successfully"}