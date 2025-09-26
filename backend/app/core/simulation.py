import asyncio
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging
import networkx as nx
from dataclasses import dataclass

from app.models.database import Node, Connection, Message, Anomaly, SessionLog
from app.models.schemas import AnomalyType, MessageStatus
from app.websocket.manager import manager
from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SimulationEvent:
    """Represents a simulation event"""
    event_type: str
    timestamp: datetime
    session_id: str
    message_id: int
    source_node_id: int
    destination_node_id: int
    current_node_id: Optional[int] = None
    next_node_id: Optional[int] = None
    data: Dict[str, Any] = None


class NetworkGraph:
    """Network topology representation using NetworkX"""
    
    def __init__(self):
        self.graph = nx.Graph()
    
    def build_from_session_data(self, nodes: List[Node], connections: List[Connection]):
        """Build network graph from session nodes and connections"""
        self.graph.clear()
        
        # Add nodes
        for node in nodes:
            self.graph.add_node(node.id, 
                               name=node.name,
                               node_type=node.node_type,
                               status=node.status,
                               x=node.x_position,
                               y=node.y_position)
        
        # Add edges (connections)
        for connection in connections:
            if connection.status == "active":
                self.graph.add_edge(
                    connection.source_node_id,
                    connection.destination_node_id,
                    connection_id=connection.id,
                    bandwidth=connection.bandwidth_mbps,
                    latency=connection.latency_ms,
                    connection_type=connection.connection_type
                )
    
    def find_shortest_path(self, source_id: int, destination_id: int) -> Optional[List[int]]:
        """Find shortest path between two nodes"""
        try:
            return nx.shortest_path(self.graph, source_id, destination_id)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None
    
    def find_all_paths(self, source_id: int, destination_id: int, max_paths: int = 3) -> List[List[int]]:
        """Find multiple paths between nodes"""
        try:
            paths = list(nx.all_simple_paths(self.graph, source_id, destination_id, cutoff=10))
            # Sort by length and return top paths
            paths.sort(key=len)
            return paths[:max_paths]
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []
    
    def get_connection_info(self, node1_id: int, node2_id: int) -> Optional[Dict[str, Any]]:
        """Get connection information between two nodes"""
        if self.graph.has_edge(node1_id, node2_id):
            return self.graph[node1_id][node2_id]
        return None


class AnomalyEngine:
    """Handles anomaly injection during simulation"""
    
    def __init__(self, anomalies: List[Anomaly]):
        self.anomalies = {a.id: a for a in anomalies if a.is_active}
    
    def should_apply_anomaly(self, anomaly: Anomaly) -> bool:
        """Determine if anomaly should be applied based on probability"""
        return random.random() < anomaly.probability
    
    def apply_packet_loss(self, message_id: int, current_node_id: int) -> bool:
        """Check if packet should be lost"""
        for anomaly in self.anomalies.values():
            if (anomaly.anomaly_type == AnomalyType.PACKET_LOSS and
                (anomaly.affected_node_id is None or anomaly.affected_node_id == current_node_id)):
                if self.should_apply_anomaly(anomaly):
                    logger.info(f"Packet loss applied to message {message_id} at node {current_node_id}")
                    return True
        return False
    
    def apply_delay(self, message_id: int, current_node_id: int, base_delay: float) -> float:
        """Apply delay anomaly and return modified delay"""
        for anomaly in self.anomalies.values():
            if (anomaly.anomaly_type == AnomalyType.DELAY and
                (anomaly.affected_node_id is None or anomaly.affected_node_id == current_node_id)):
                if self.should_apply_anomaly(anomaly):
                    additional_delay = anomaly.parameters.get("additional_delay_ms", 1000)
                    logger.info(f"Delay anomaly applied to message {message_id}: +{additional_delay}ms")
                    return base_delay + additional_delay
        return base_delay
    
    def apply_corruption(self, message_id: int, current_node_id: int) -> bool:
        """Check if packet should be corrupted"""
        for anomaly in self.anomalies.values():
            if (anomaly.anomaly_type == AnomalyType.CORRUPTION and
                (anomaly.affected_node_id is None or anomaly.affected_node_id == current_node_id)):
                if self.should_apply_anomaly(anomaly):
                    logger.info(f"Packet corruption applied to message {message_id} at node {current_node_id}")
                    return True
        return False
    
    def apply_wrong_delivery(self, message_id: int, current_node_id: int, available_nodes: List[int]) -> Optional[int]:
        """Apply wrong delivery anomaly and return wrong destination"""
        for anomaly in self.anomalies.values():
            if (anomaly.anomaly_type == AnomalyType.WRONG_DELIVERY and
                (anomaly.affected_node_id is None or anomaly.affected_node_id == current_node_id)):
                if self.should_apply_anomaly(anomaly):
                    wrong_destination = random.choice(available_nodes)
                    logger.info(f"Wrong delivery anomaly applied to message {message_id}: redirected to node {wrong_destination}")
                    return wrong_destination
        return None


class SimulationEngine:
    """Core simulation engine for network packet simulation"""
    
    def __init__(self):
        self.active_simulations: Dict[str, bool] = {}
        self.simulation_tasks: Dict[str, asyncio.Task] = {}
    
    async def start_simulation(self, session_id: str, messages: List[Message], 
                             nodes: List[Node], connections: List[Connection],
                             anomalies: List[Anomaly], speed_multiplier: float = 1.0) -> str:
        """Start a new simulation"""
        simulation_id = str(uuid.uuid4())
        
        # Build network topology
        network = NetworkGraph()
        network.build_from_session_data(nodes, connections)
        
        # Initialize anomaly engine
        anomaly_engine = AnomalyEngine(anomalies)
        
        # Start simulation task
        self.active_simulations[simulation_id] = True
        task = asyncio.create_task(
            self._run_simulation(simulation_id, session_id, messages, network, anomaly_engine, speed_multiplier)
        )
        self.simulation_tasks[simulation_id] = task
        
        logger.info(f"Started simulation {simulation_id} for session {session_id}")
        return simulation_id
    
    async def stop_simulation(self, simulation_id: str):
        """Stop a running simulation"""
        if simulation_id in self.active_simulations:
            self.active_simulations[simulation_id] = False
            if simulation_id in self.simulation_tasks:
                self.simulation_tasks[simulation_id].cancel()
                del self.simulation_tasks[simulation_id]
            del self.active_simulations[simulation_id]
            logger.info(f"Stopped simulation {simulation_id}")
    
    async def _run_simulation(self, simulation_id: str, session_id: str, messages: List[Message],
                            network: NetworkGraph, anomaly_engine: AnomalyEngine, speed_multiplier: float):
        """Run the simulation"""
        try:
            # Send simulation started event
            await manager.broadcast_to_session(
                session_id,
                "simulation_started",
                {
                    "simulation_id": simulation_id,
                    "message_count": len(messages),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Process each message
            for message in messages:
                if not self.active_simulations.get(simulation_id, False):
                    break
                
                await self._simulate_message(simulation_id, session_id, message, network, anomaly_engine, speed_multiplier)
                
                # Small delay between messages
                await asyncio.sleep(0.1 / speed_multiplier)
            
            # Send simulation completed event
            await manager.broadcast_to_session(
                session_id,
                "simulation_completed",
                {
                    "simulation_id": simulation_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except asyncio.CancelledError:
            logger.info(f"Simulation {simulation_id} was cancelled")
        except Exception as e:
            logger.error(f"Simulation {simulation_id} failed: {e}")
            await manager.broadcast_to_session(
                session_id,
                "simulation_error",
                {
                    "simulation_id": simulation_id,
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        finally:
            if simulation_id in self.active_simulations:
                del self.active_simulations[simulation_id]
            if simulation_id in self.simulation_tasks:
                del self.simulation_tasks[simulation_id]
    
    async def _simulate_message(self, simulation_id: str, session_id: str, message: Message,
                              network: NetworkGraph, anomaly_engine: AnomalyEngine, speed_multiplier: float):
        """Simulate a single message transmission"""
        # Find path from source to destination
        paths = network.find_all_paths(message.source_node_id, message.destination_node_id)
        
        if not paths:
            # No path available
            await manager.broadcast_to_session(
                session_id,
                "packet_failed",
                {
                    "message_id": message.id,
                    "reason": "No path available",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            return
        
        # Choose the shortest path (or apply routing algorithm)
        chosen_path = paths[0]  # Simple: always choose shortest path
        
        # Send packet_sent event
        await manager.broadcast_to_session(
            session_id,
            "packet_sent",
            {
                "message_id": message.id,
                "source_node_id": message.source_node_id,
                "destination_node_id": message.destination_node_id,
                "path": chosen_path,
                "packet_size": message.packet_size_bytes,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Simulate packet traversal
        for i in range(len(chosen_path) - 1):
            if not self.active_simulations.get(simulation_id, False):
                break
            
            current_node = chosen_path[i]
            next_node = chosen_path[i + 1]
            
            # Get connection info
            connection_info = network.get_connection_info(current_node, next_node)
            if not connection_info:
                continue
            
            # Calculate base delay
            base_delay = connection_info.get("latency", settings.DEFAULT_PACKET_DELAY_MS) / 1000.0
            
            # Apply anomalies
            # Check for packet loss
            if anomaly_engine.apply_packet_loss(message.id, current_node):
                await manager.broadcast_to_session(
                    session_id,
                    "packet_lost",
                    {
                        "message_id": message.id,
                        "lost_at_node_id": current_node,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                return
            
            # Apply delay anomaly
            actual_delay = anomaly_engine.apply_delay(message.id, current_node, base_delay * 1000) / 1000.0
            
            # Check for corruption
            is_corrupted = anomaly_engine.apply_corruption(message.id, current_node)
            
            # Send packet_arrived event
            await manager.broadcast_to_session(
                session_id,
                "packet_arrived",
                {
                    "message_id": message.id,
                    "current_node_id": next_node,
                    "from_node_id": current_node,
                    "is_corrupted": is_corrupted,
                    "delay_ms": actual_delay * 1000,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Wait for the delay
            await asyncio.sleep(actual_delay / speed_multiplier)
        
        # Check for wrong delivery
        available_nodes = list(network.graph.nodes())
        wrong_destination = anomaly_engine.apply_wrong_delivery(
            message.id, chosen_path[-1], available_nodes
        )
        
        if wrong_destination and wrong_destination != message.destination_node_id:
            # Delivered to wrong destination
            await manager.broadcast_to_session(
                session_id,
                "packet_misdelivered",
                {
                    "message_id": message.id,
                    "intended_destination": message.destination_node_id,
                    "actual_destination": wrong_destination,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        else:
            # Successfully delivered
            await manager.broadcast_to_session(
                session_id,
                "packet_delivered",
                {
                    "message_id": message.id,
                    "destination_node_id": message.destination_node_id,
                    "path_taken": chosen_path,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )


# Global simulation engine instance
simulation_engine = SimulationEngine()