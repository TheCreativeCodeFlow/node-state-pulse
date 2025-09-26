from fastapi import APIRouter
from app.api.v1.endpoints import sessions, nodes, connections, messages, anomalies, simulation, ai

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(nodes.router, prefix="/nodes", tags=["nodes"])
api_router.include_router(connections.router, prefix="/connections", tags=["connections"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["anomalies"])
api_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])