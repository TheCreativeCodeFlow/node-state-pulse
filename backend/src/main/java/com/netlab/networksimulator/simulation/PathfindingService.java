package com.netlab.networksimulator.simulation;

import com.netlab.networksimulator.domain.Connection;
import com.netlab.networksimulator.domain.Node;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PathfindingService {
    
    public List<String> findPath(String sessionId, String sourceNodeId, String targetNodeId, 
                                List<Node> nodes, List<Connection> connections) {
        
        log.debug("Finding path from {} to {} in session {}", sourceNodeId, targetNodeId, sessionId);
        
        if (sourceNodeId.equals(targetNodeId)) {
            return List.of(sourceNodeId);
        }
        
        // Build adjacency list
        Map<String, List<String>> graph = buildGraph(nodes, connections);
        
        // Use BFS for shortest path (can be extended to Dijkstra for weighted paths)
        return findShortestPath(graph, sourceNodeId, targetNodeId);
    }
    
    private Map<String, List<String>> buildGraph(List<Node> nodes, List<Connection> connections) {
        Map<String, List<String>> graph = new HashMap<>();
        
        // Initialize graph with all nodes
        for (Node node : nodes) {
            if (node.getIsActive()) {
                graph.put(node.getId(), new ArrayList<>());
            }
        }
        
        // Add edges from active connections
        for (Connection connection : connections) {
            if (connection.getIsActive() && 
                connection.getSourceNode().getIsActive() && 
                connection.getTargetNode().getIsActive()) {
                
                String sourceId = connection.getSourceNode().getId();
                String targetId = connection.getTargetNode().getId();
                
                // Add forward edge
                graph.computeIfAbsent(sourceId, k -> new ArrayList<>()).add(targetId);
                
                // Add reverse edge if bidirectional
                if (connection.getIsBidirectional()) {
                    graph.computeIfAbsent(targetId, k -> new ArrayList<>()).add(sourceId);
                }
            }
        }
        
        return graph;
    }
    
    private List<String> findShortestPath(Map<String, List<String>> graph, String start, String end) {
        if (!graph.containsKey(start) || !graph.containsKey(end)) {
            log.warn("Start node {} or end node {} not found in graph", start, end);
            return Collections.emptyList();
        }
        
        Queue<String> queue = new LinkedList<>();
        Map<String, String> parent = new HashMap<>();
        Set<String> visited = new HashSet<>();
        
        queue.offer(start);
        visited.add(start);
        parent.put(start, null);
        
        while (!queue.isEmpty()) {
            String current = queue.poll();
            
            if (current.equals(end)) {
                // Reconstruct path
                return reconstructPath(parent, start, end);
            }
            
            for (String neighbor : graph.getOrDefault(current, Collections.emptyList())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    parent.put(neighbor, current);
                    queue.offer(neighbor);
                }
            }
        }
        
        // No path found
        log.warn("No path found from {} to {}", start, end);
        return Collections.emptyList();
    }
    
    private List<String> reconstructPath(Map<String, String> parent, String start, String end) {
        List<String> path = new ArrayList<>();
        String current = end;
        
        while (current != null) {
            path.add(current);
            current = parent.get(current);
        }
        
        Collections.reverse(path);
        
        log.debug("Found path: {}", String.join(" -> ", path));
        return path;
    }
    
    public List<String> findPathWithWeights(String sessionId, String sourceNodeId, String targetNodeId, 
                                           List<Node> nodes, List<Connection> connections) {
        // Dijkstra's algorithm implementation for weighted shortest path
        Map<String, List<WeightedEdge>> weightedGraph = buildWeightedGraph(nodes, connections);
        return dijkstra(weightedGraph, sourceNodeId, targetNodeId);
    }
    
    private Map<String, List<WeightedEdge>> buildWeightedGraph(List<Node> nodes, List<Connection> connections) {
        Map<String, List<WeightedEdge>> graph = new HashMap<>();
        
        // Initialize graph
        for (Node node : nodes) {
            if (node.getIsActive()) {
                graph.put(node.getId(), new ArrayList<>());
            }
        }
        
        // Add weighted edges
        for (Connection connection : connections) {
            if (connection.getIsActive() && 
                connection.getSourceNode().getIsActive() && 
                connection.getTargetNode().getIsActive()) {
                
                String sourceId = connection.getSourceNode().getId();
                String targetId = connection.getTargetNode().getId();
                
                // Calculate weight based on latency and cost
                int weight = connection.getLatency() + connection.getCost();
                
                graph.get(sourceId).add(new WeightedEdge(targetId, weight));
                
                if (connection.getIsBidirectional()) {
                    graph.get(targetId).add(new WeightedEdge(sourceId, weight));
                }
            }
        }
        
        return graph;
    }
    
    private List<String> dijkstra(Map<String, List<WeightedEdge>> graph, String start, String end) {
        if (!graph.containsKey(start) || !graph.containsKey(end)) {
            return Collections.emptyList();
        }
        
        Map<String, Integer> distances = new HashMap<>();
        Map<String, String> parent = new HashMap<>();
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>(Comparator.comparingInt(nd -> nd.distance));
        Set<String> visited = new HashSet<>();
        
        // Initialize distances
        for (String node : graph.keySet()) {
            distances.put(node, Integer.MAX_VALUE);
        }
        distances.put(start, 0);
        pq.offer(new NodeDistance(start, 0));
        
        while (!pq.isEmpty()) {
            NodeDistance current = pq.poll();
            
            if (visited.contains(current.nodeId)) {
                continue;
            }
            
            visited.add(current.nodeId);
            
            if (current.nodeId.equals(end)) {
                return reconstructPath(parent, start, end);
            }
            
            for (WeightedEdge edge : graph.getOrDefault(current.nodeId, Collections.emptyList())) {
                if (!visited.contains(edge.targetId)) {
                    int newDistance = distances.get(current.nodeId) + edge.weight;
                    
                    if (newDistance < distances.get(edge.targetId)) {
                        distances.put(edge.targetId, newDistance);
                        parent.put(edge.targetId, current.nodeId);
                        pq.offer(new NodeDistance(edge.targetId, newDistance));
                    }
                }
            }
        }
        
        return Collections.emptyList();
    }
    
    private static class WeightedEdge {
        final String targetId;
        final int weight;
        
        WeightedEdge(String targetId, int weight) {
            this.targetId = targetId;
            this.weight = weight;
        }
    }
    
    private static class NodeDistance {
        final String nodeId;
        final int distance;
        
        NodeDistance(String nodeId, int distance) {
            this.nodeId = nodeId;
            this.distance = distance;
        }
    }
}