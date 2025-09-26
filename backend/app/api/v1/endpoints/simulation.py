from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import logging

from app.core.database import get_db
from app.core.simulation import simulation_engine
from app.models.database import Message, Node, Connection, Anomaly, Session
from app.models.schemas import SimulationRequest, SimulationResponse

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


@router.post("/{session_id}/simulate", response_model=SimulationResponse)
async def start_simulation(
    session_id: str,
    simulation_request: SimulationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Start a network simulation"""
    await _verify_session_exists(session_id, db)
    
    # Get messages to simulate
    result = await db.execute(
        select(Message).where(
            Message.session_id == session_id,
            Message.id.in_(simulation_request.message_ids)
        )
    )
    messages = result.scalars().all()
    
    if len(messages) != len(simulation_request.message_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more messages not found"
        )
    
    # Get all nodes in the session
    result = await db.execute(select(Node).where(Node.session_id == session_id))
    nodes = result.scalars().all()
    
    if not nodes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No nodes found in session"
        )
    
    # Get all active connections
    result = await db.execute(
        select(Connection).where(
            Connection.session_id == session_id,
            Connection.status == "active"
        )
    )
    connections = result.scalars().all()
    
    if not connections:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active connections found in session"
        )
    
    # Get anomalies if enabled
    anomalies = []
    if simulation_request.enable_anomalies:
        result = await db.execute(
            select(Anomaly).where(
                Anomaly.session_id == session_id,
                Anomaly.is_active == True
            )
        )
        anomalies = result.scalars().all()
    
    # Start simulation
    try:
        simulation_id = await simulation_engine.start_simulation(
            session_id=session_id,
            messages=messages,
            nodes=nodes,
            connections=connections,
            anomalies=anomalies,
            speed_multiplier=simulation_request.speed_multiplier
        )
        
        logger.info(f"Started simulation {simulation_id} for session {session_id}")
        return SimulationResponse(
            simulation_id=simulation_id,
            status="started",
            message=f"Simulation started with {len(messages)} messages"
        )
        
    except Exception as e:
        logger.error(f"Failed to start simulation for session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start simulation: {str(e)}"
        )


@router.post("/{session_id}/simulate/{simulation_id}/stop")
async def stop_simulation(
    session_id: str,
    simulation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Stop a running simulation"""
    await _verify_session_exists(session_id, db)
    
    try:
        await simulation_engine.stop_simulation(simulation_id)
        logger.info(f"Stopped simulation {simulation_id} for session {session_id}")
        return {"message": "Simulation stopped successfully"}
        
    except Exception as e:
        logger.error(f"Failed to stop simulation {simulation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop simulation: {str(e)}"
        )


@router.get("/{session_id}/simulate/status")
async def get_simulation_status(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get status of active simulations for a session"""
    await _verify_session_exists(session_id, db)
    
    active_simulations = []
    for sim_id, is_active in simulation_engine.active_simulations.items():
        if is_active:
            active_simulations.append({
                "simulation_id": sim_id,
                "status": "running"
            })
    
    return {
        "session_id": session_id,
        "active_simulations": active_simulations,
        "total_active": len(active_simulations)
    }


@router.post("/{session_id}/validate")
async def validate_network(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Validate network topology for simulation readiness"""
    await _verify_session_exists(session_id, db)
    
    # Get nodes and connections
    result = await db.execute(select(Node).where(Node.session_id == session_id))
    nodes = result.scalars().all()
    
    result = await db.execute(
        select(Connection).where(
            Connection.session_id == session_id,
            Connection.status == "active"
        )
    )
    connections = result.scalars().all()
    
    # Validation checks
    issues = []
    
    if len(nodes) < 2:
        issues.append("At least 2 nodes required for simulation")
    
    if len(connections) < 1:
        issues.append("At least 1 connection required for simulation")
    
    # Check for isolated nodes
    connected_nodes = set()
    for conn in connections:
        connected_nodes.add(conn.source_node_id)
        connected_nodes.add(conn.destination_node_id)
    
    isolated_nodes = []
    for node in nodes:
        if node.id not in connected_nodes:
            isolated_nodes.append(node.name)
    
    if isolated_nodes:
        issues.append(f"Isolated nodes found: {', '.join(isolated_nodes)}")
    
    # Check for inactive nodes
    inactive_nodes = [node.name for node in nodes if node.status != "active"]
    if inactive_nodes:
        issues.append(f"Inactive nodes found: {', '.join(inactive_nodes)}")
    
    is_valid = len(issues) == 0
    
    return {
        "session_id": session_id,
        "is_valid": is_valid,
        "node_count": len(nodes),
        "connection_count": len(connections),
        "issues": issues,
        "warnings": [f"Found {len(isolated_nodes)} isolated nodes"] if isolated_nodes else []
    }