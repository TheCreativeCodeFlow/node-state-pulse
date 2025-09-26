from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import logging
from datetime import datetime
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.config import settings
from app.models.database import Session, Node, Connection, Message, Anomaly, SessionLog
from app.models.schemas import AIQueryRequest, AIQueryResponse

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


async def _gather_session_context(session_id: str, context_type: str, include_logs: bool, db: AsyncSession) -> Dict[str, Any]:
    """Gather relevant context data for AI query"""
    context = {"session_id": session_id}
    
    if context_type in ["session", "all"]:
        # Get session info
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one()
        context["session"] = {
            "student_name": session.student_name,
            "created_at": session.created_at.isoformat(),
            "metadata": session.metadata_json
        }
        
        # Get nodes
        result = await db.execute(select(Node).where(Node.session_id == session_id))
        nodes = result.scalars().all()
        context["nodes"] = [
            {
                "id": node.id,
                "name": node.name,
                "type": node.node_type,
                "status": node.status,
                "position": {"x": node.x_position, "y": node.y_position}
            }
            for node in nodes
        ]
        
        # Get connections
        result = await db.execute(select(Connection).where(Connection.session_id == session_id))
        connections = result.scalars().all()
        context["connections"] = [
            {
                "id": conn.id,
                "source_node_id": conn.source_node_id,
                "destination_node_id": conn.destination_node_id,
                "type": conn.connection_type,
                "bandwidth_mbps": conn.bandwidth_mbps,
                "latency_ms": conn.latency_ms,
                "status": conn.status
            }
            for conn in connections
        ]
        
        # Get messages
        result = await db.execute(select(Message).where(Message.session_id == session_id))
        messages = result.scalars().all()
        context["messages"] = [
            {
                "id": msg.id,
                "source_node_id": msg.source_node_id,
                "destination_node_id": msg.destination_node_id,
                "type": msg.message_type,
                "status": msg.status,
                "packet_size_bytes": msg.packet_size_bytes,
                "path_taken": msg.path_taken
            }
            for msg in messages
        ]
    
    if context_type in ["anomaly", "all"]:
        # Get anomalies
        result = await db.execute(select(Anomaly).where(Anomaly.session_id == session_id))
        anomalies = result.scalars().all()
        context["anomalies"] = [
            {
                "id": anom.id,
                "type": anom.anomaly_type,
                "affected_node_id": anom.affected_node_id,
                "affected_connection_id": anom.affected_connection_id,
                "probability": anom.probability,
                "severity": anom.severity,
                "parameters": anom.parameters,
                "is_active": anom.is_active
            }
            for anom in anomalies
        ]
    
    if include_logs:
        # Get recent session logs
        result = await db.execute(
            select(SessionLog)
            .where(SessionLog.session_id == session_id)
            .order_by(SessionLog.timestamp.desc())
            .limit(50)
        )
        logs = result.scalars().all()
        context["recent_logs"] = [
            {
                "event_type": log.event_type,
                "timestamp": log.timestamp.isoformat(),
                "level": log.level,
                "message": log.message,
                "data": log.event_data
            }
            for log in logs
        ]
    
    return context


async def _query_ai_service(query: str, context: Dict[str, Any]) -> str:
    """Query external AI service with context"""
    if not settings.AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured"
        )
    
    # Prepare prompt for AI service
    system_prompt = """You are a network simulation tutor. Help students understand network concepts based on their simulation data. 
    Provide clear, educational explanations about network behavior, routing, protocols, and troubleshooting.
    Use the provided context to give specific, relevant answers about their network topology and simulation results."""
    
    user_prompt = f"""
    Student Question: {query}
    
    Network Context:
    {context}
    
    Please provide a helpful, educational response that explains the network concepts relevant to their question.
    """
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.AI_SERVICE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.AI_SERVICE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
            )
            
            if response.status_code != 200:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI service request failed"
                )
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timeout"
        )
    except Exception as e:
        logger.error(f"AI service error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service unavailable"
        )


@router.post("/{session_id}/query", response_model=AIQueryResponse)
async def query_ai_tutor(
    session_id: str,
    request: AIQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """Query AI tutor with session context"""
    await _verify_session_exists(session_id, db)
    
    # Gather context
    context = await _gather_session_context(
        session_id, request.context_type, request.include_logs, db
    )
    
    # Query AI service
    ai_response = await _query_ai_service(request.query, context)
    
    # Log the query for analytics
    session_log = SessionLog(
        session_id=session_id,
        event_type="ai_query",
        event_data={
            "query": request.query,
            "context_type": request.context_type,
            "response_length": len(ai_response)
        },
        level="info",
        message=f"AI query: {request.query[:100]}..."
    )
    db.add(session_log)
    await db.commit()
    
    logger.info(f"AI query processed for session {session_id}")
    
    return AIQueryResponse(
        response=ai_response,
        context_used=[request.context_type],
        timestamp=datetime.utcnow()
    )


@router.get("/{session_id}/query/suggestions")
async def get_query_suggestions(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get suggested questions based on session state"""
    await _verify_session_exists(session_id, db)
    
    # Get basic session info
    result = await db.execute(select(Node).where(Node.session_id == session_id))
    node_count = len(result.scalars().all())
    
    result = await db.execute(select(Connection).where(Connection.session_id == session_id))
    connection_count = len(result.scalars().all())
    
    result = await db.execute(select(Message).where(Message.session_id == session_id))
    message_count = len(result.scalars().all())
    
    result = await db.execute(select(Anomaly).where(Anomaly.session_id == session_id, Anomaly.is_active == True))
    anomaly_count = len(result.scalars().all())
    
    # Generate contextual suggestions
    suggestions = [
        "How does packet routing work in my network?",
        "What are the different types of network topologies?",
        "How can I improve network performance?"
    ]
    
    if connection_count == 0:
        suggestions.insert(0, "Why do I need connections between nodes?")
    
    if message_count > 0:
        suggestions.append("Why might packets take different paths to the same destination?")
    
    if anomaly_count > 0:
        suggestions.extend([
            "What causes packet loss in networks?",
            "How can I troubleshoot network connectivity issues?",
            "What is the difference between latency and bandwidth?"
        ])
    
    if node_count > 5:
        suggestions.append("How do I optimize routing in large networks?")
    
    return {
        "session_id": session_id,
        "suggestions": suggestions[:8],  # Limit to 8 suggestions
        "session_stats": {
            "nodes": node_count,
            "connections": connection_count,
            "messages": message_count,
            "active_anomalies": anomaly_count
        }
    }