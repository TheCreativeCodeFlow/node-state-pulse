package com.netlab.networksimulator.simulation;

import com.netlab.networksimulator.domain.*;
import com.netlab.networksimulator.repository.*;
import com.netlab.networksimulator.service.LoggingService;
import com.netlab.networksimulator.websocket.WebSocketEventService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationEngine {
    
    private final NodeRepository nodeRepository;
    private final ConnectionRepository connectionRepository;
    private final MessageRepository messageRepository;
    private final AnomalyRepository anomalyRepository;
    private final SessionRepository sessionRepository;
    private final LoggingService loggingService;
    private final WebSocketEventService webSocketEventService;
    private final PathfindingService pathfindingService;
    private final AnomalyInjectionService anomalyInjectionService;
    private final ObjectMapper objectMapper;
    
    // Track active simulations
    private final Map<String, SimulationContext> activeSimulations = new ConcurrentHashMap<>();
    
    @Async
    @Transactional
    public CompletableFuture<SimulationResult> startSimulation(String sessionId, SimulationConfig config) {
        log.info("Starting simulation for session: {}", sessionId);
        
        try {
            // Validate session exists and is active
            Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
            
            if (session.getStatus() != Session.SessionStatus.ACTIVE) {
                throw new IllegalStateException("Session is not active: " + sessionId);
            }
            
            // Load network topology
            List<Node> nodes = nodeRepository.findBySessionIdAndIsActiveOrderByCreatedAtAsc(sessionId, true);
            List<Connection> connections = connectionRepository.findBySessionIdAndIsActiveOrderByCreatedAtAsc(sessionId, true);
            
            if (nodes.isEmpty()) {
                throw new IllegalStateException("No active nodes found for session: " + sessionId);
            }
            
            // Create simulation context
            SimulationContext context = new SimulationContext(sessionId, nodes, connections, config);
            activeSimulations.put(sessionId, context);
            
            // Load pending messages
            List<Message> messages = messageRepository.findBySessionIdAndStatusOrderByCreatedAtDesc(
                sessionId, Message.MessageStatus.CREATED);
            
            if (messages.isEmpty()) {
                throw new IllegalStateException("No messages to simulate for session: " + sessionId);
            }
            
            // Notify simulation started
            webSocketEventService.sendSimulationStarted(sessionId, messages.size());
            loggingService.logSessionEvent(sessionId, "SIMULATION_STARTED", 
                "Simulation started with " + messages.size() + " messages");
            
            // Process each message
            SimulationResult result = new SimulationResult(sessionId);
            
            for (Message message : messages) {
                try {
                    MessageSimulationResult messageResult = simulateMessage(context, message);
                    result.addMessageResult(messageResult);
                    
                    // Add realistic delay between messages
                    Thread.sleep(config.getMessageInterval());
                    
                } catch (Exception e) {
                    log.error("Error simulating message {}: {}", message.getId(), e.getMessage());
                    result.incrementFailedCount();
                    
                    loggingService.logError(sessionId, "SIMULATION_ERROR", 
                        "Failed to simulate message: " + message.getId(), e);
                }
            }
            
            // Complete simulation
            long duration = System.currentTimeMillis() - context.getStartTime();
            result.setDuration(duration);
            
            webSocketEventService.sendSimulationCompleted(sessionId, duration, 
                result.getDeliveredCount(), result.getLostCount());
            
            loggingService.logSessionEvent(sessionId, "SIMULATION_COMPLETED", 
                String.format("Simulation completed. Delivered: %d, Lost: %d, Duration: %dms", 
                    result.getDeliveredCount(), result.getLostCount(), duration));
            
            // Clean up
            activeSimulations.remove(sessionId);
            
            log.info("Simulation completed for session: {} in {}ms", sessionId, duration);
            return CompletableFuture.completedFuture(result);
            
        } catch (Exception e) {
            log.error("Simulation failed for session {}: {}", sessionId, e.getMessage(), e);
            activeSimulations.remove(sessionId);
            
            loggingService.logError(sessionId, "SIMULATION_ERROR", 
                "Simulation failed: " + e.getMessage(), e);
            
            return CompletableFuture.failedFuture(e);
        }
    }
    
    private MessageSimulationResult simulateMessage(SimulationContext context, Message message) 
            throws Exception {
        log.debug("Simulating message: {} from {} to {}", 
                 message.getPacketId(), message.getSourceNode().getId(), message.getTargetNode().getId());
        
        MessageSimulationResult result = new MessageSimulationResult(message.getId(), message.getPacketId());
        long startTime = System.currentTimeMillis();
        
        // Mark message as queued
        message.setStatus(Message.MessageStatus.QUEUED);
        message.setSentAt(LocalDateTime.now());
        messageRepository.save(message);
        
        // Compute path from source to target
        List<String> path = pathfindingService.findPath(
            context.getSessionId(),
            message.getSourceNode().getId(),
            message.getTargetNode().getId(),
            context.getNodes(),
            context.getConnections()
        );
        
        if (path.isEmpty()) {
            // No path found
            message.setStatus(Message.MessageStatus.FAILED);
            messageRepository.save(message);
            
            result.setSuccess(false);
            result.setFailureReason("No path found to destination");
            
            webSocketEventService.sendPacketLost(context.getSessionId(), message.getPacketId(), 
                message.getId(), message.getSourceNode().getId(), "No path to destination", null);
            
            loggingService.logPacketEvent(context.getSessionId(), "PACKET_LOST", 
                "No path found from " + message.getSourceNode().getId() + " to " + message.getTargetNode().getId(),
                message.getId(), message.getPacketId(), message.getSourceNode().getId());
            
            return result;
        }
        
        // Store computed path
        message.setRoutePath(objectMapper.writeValueAsString(path));
        message.setCurrentHop(0);
        message.setStatus(Message.MessageStatus.SENT);
        messageRepository.save(message);
        
        // Send packet sent event
        webSocketEventService.sendPacketSent(context.getSessionId(), message.getPacketId(), 
            message.getId(), message.getSourceNode().getId(), message.getTargetNode().getId(),
            String.join(" -> ", path));
        
        loggingService.logPacketEvent(context.getSessionId(), "PACKET_SENT", 
            "Packet sent from " + message.getSourceNode().getId(),
            message.getId(), message.getPacketId(), message.getSourceNode().getId());
        
        // Simulate packet traversal
        boolean delivered = simulatePacketTraversal(context, message, path, result);
        
        if (delivered) {
            message.setStatus(Message.MessageStatus.DELIVERED);
            message.setReceivedAt(LocalDateTime.now());
            result.setSuccess(true);
            result.setDeliveryTime(System.currentTimeMillis() - startTime);
            
            webSocketEventService.sendPacketDelivered(context.getSessionId(), message.getPacketId(),
                message.getId(), message.getTargetNode().getId(), result.getDeliveryTime(), path.size() - 1);
            
            loggingService.logPacketEvent(context.getSessionId(), "PACKET_DELIVERED", 
                "Packet delivered to " + message.getTargetNode().getId(),
                message.getId(), message.getPacketId(), message.getTargetNode().getId());
        }
        
        messageRepository.save(message);
        return result;
    }
    
    private boolean simulatePacketTraversal(SimulationContext context, Message message, 
                                           List<String> path, MessageSimulationResult result) 
            throws Exception {
        
        message.setStatus(Message.MessageStatus.IN_TRANSIT);
        messageRepository.save(message);
        
        for (int i = 0; i < path.size() - 1; i++) {
            String currentNodeId = path.get(i);
            String nextNodeId = path.get(i + 1);
            
            // Find connection between current and next node
            Optional<Connection> connectionOpt = findConnectionBetweenNodes(
                context.getConnections(), currentNodeId, nextNodeId);
            
            if (connectionOpt.isEmpty()) {
                // Connection lost during simulation
                result.setSuccess(false);
                result.setFailureReason("Connection lost between " + currentNodeId + " and " + nextNodeId);
                
                webSocketEventService.sendPacketLost(context.getSessionId(), message.getPacketId(),
                    message.getId(), currentNodeId, "Connection lost", "CONNECTION_LOST");
                
                return false;
            }
            
            Connection connection = connectionOpt.get();
            message.setConnection(connection);
            message.setCurrentHop(i + 1);
            messageRepository.save(message);
            
            // Check for anomalies
            List<Anomaly> anomalies = anomalyInjectionService.generateAnomalies(
                context.getConfig(), message, connection, currentNodeId, nextNodeId);
            
            for (Anomaly anomaly : anomalies) {
                anomaly.setMessage(message);
                anomalyRepository.save(anomaly);
                
                boolean continueExecution = applyAnomaly(context, message, anomaly, currentNodeId, nextNodeId);
                if (!continueExecution) {
                    result.setSuccess(false);
                    result.setFailureReason("Packet lost due to " + anomaly.getType());
                    return false;
                }
            }
            
            // Simulate transmission delay
            int transmissionDelay = connection.getLatency() + 
                (int) (Math.random() * connection.getJitter());
            Thread.sleep(transmissionDelay);
            
            // Send packet arrived event
            webSocketEventService.sendPacketArrived(context.getSessionId(), message.getPacketId(),
                message.getId(), nextNodeId, connection.getId(), i + 1, path.size() - 1);
            
            loggingService.logPacketEvent(context.getSessionId(), "PACKET_ARRIVED", 
                "Packet arrived at " + nextNodeId + " from " + currentNodeId,
                message.getId(), message.getPacketId(), nextNodeId);
            
            // If not the final destination, send forwarded event
            if (i < path.size() - 2) {
                webSocketEventService.sendPacketForwarded(context.getSessionId(), message.getPacketId(),
                    message.getId(), nextNodeId, path.get(i + 2), connection.getId(), 
                    i + 1, path.size() - 1);
                
                loggingService.logPacketEvent(context.getSessionId(), "PACKET_FORWARDED", 
                    "Packet forwarded from " + nextNodeId + " to " + path.get(i + 2),
                    message.getId(), message.getPacketId(), nextNodeId);
            }
        }
        
        return true; // Successfully delivered
    }
    
    private boolean applyAnomaly(SimulationContext context, Message message, Anomaly anomaly, 
                                String currentNodeId, String nextNodeId) throws Exception {
        
        anomaly.setIsApplied(true);
        anomaly.setAppliedAt(LocalDateTime.now());
        anomalyRepository.save(anomaly);
        
        String description = buildAnomalyDescription(anomaly, currentNodeId, nextNodeId);
        
        webSocketEventService.sendAnomalyApplied(context.getSessionId(), message.getPacketId(),
            message.getId(), currentNodeId, anomaly.getType().name(), description);
        
        loggingService.logAnomalyEvent(context.getSessionId(), "ANOMALY_APPLIED", description,
            anomaly.getId(), message.getId(), message.getPacketId());
        
        switch (anomaly.getType()) {
            case PACKET_LOSS:
                webSocketEventService.sendPacketLost(context.getSessionId(), message.getPacketId(),
                    message.getId(), currentNodeId, "Packet dropped", "PACKET_LOSS");
                return false; // Stop processing
                
            case DELAY:
                if (anomaly.getDelayAmount() != null) {
                    Thread.sleep(anomaly.getDelayAmount());
                }
                return true; // Continue processing
                
            case CORRUPTION:
                // Simulate corruption by modifying checksum
                message.setChecksum("CORRUPTED");
                messageRepository.save(message);
                return true; // Continue processing
                
            case WRONG_DELIVERY:
                // This would require path recalculation, simplified for now
                return true; // Continue processing
                
            case CONNECTION_LOST:
                webSocketEventService.sendPacketLost(context.getSessionId(), message.getPacketId(),
                    message.getId(), currentNodeId, "Connection failed", "CONNECTION_LOST");
                return false; // Stop processing
                
            default:
                return true; // Continue processing for other anomaly types
        }
    }
    
    private String buildAnomalyDescription(Anomaly anomaly, String currentNodeId, String nextNodeId) {
        return switch (anomaly.getType()) {
            case PACKET_LOSS -> "Packet dropped at " + currentNodeId;
            case DELAY -> "Packet delayed by " + anomaly.getDelayAmount() + "ms at " + currentNodeId;
            case CORRUPTION -> "Packet corrupted during transmission from " + currentNodeId + " to " + nextNodeId;
            case WRONG_DELIVERY -> "Packet delivered to wrong destination";
            case CONNECTION_LOST -> "Connection lost between " + currentNodeId + " and " + nextNodeId;
            default -> "Anomaly " + anomaly.getType() + " applied at " + currentNodeId;
        };
    }
    
    private Optional<Connection> findConnectionBetweenNodes(List<Connection> connections, 
                                                           String node1Id, String node2Id) {
        return connections.stream()
            .filter(c -> c.getIsActive())
            .filter(c -> 
                (c.getSourceNode().getId().equals(node1Id) && c.getTargetNode().getId().equals(node2Id)) ||
                (c.getSourceNode().getId().equals(node2Id) && c.getTargetNode().getId().equals(node1Id) && c.getIsBidirectional())
            )
            .findFirst();
    }
    
    public boolean stopSimulation(String sessionId) {
        log.info("Stopping simulation for session: {}", sessionId);
        
        SimulationContext context = activeSimulations.remove(sessionId);
        if (context != null) {
            // Mark all active messages as failed
            List<Message> activeMessages = messageRepository.findActiveMessages(sessionId);
            activeMessages.forEach(message -> {
                message.setStatus(Message.MessageStatus.FAILED);
                messageRepository.save(message);
            });
            
            loggingService.logSessionEvent(sessionId, "SIMULATION_STOPPED", "Simulation manually stopped");
            return true;
        }
        
        return false;
    }
    
    public boolean isSimulationActive(String sessionId) {
        return activeSimulations.containsKey(sessionId);
    }
    
    public Optional<SimulationContext> getSimulationContext(String sessionId) {
        return Optional.ofNullable(activeSimulations.get(sessionId));
    }
}