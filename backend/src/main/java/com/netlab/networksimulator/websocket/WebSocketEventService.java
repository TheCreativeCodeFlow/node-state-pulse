package com.netlab.networksimulator.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public void broadcastPacketEvent(String sessionId, PacketEvent event) {
        try {
            event.setTimestamp(LocalDateTime.now());
            String destination = "/topic/simulation/" + sessionId;
            
            messagingTemplate.convertAndSend(destination, event);
            
            log.debug("Broadcasted {} event for session {} packet {}", 
                     event.getEventType(), sessionId, event.getPacketId());
        } catch (Exception e) {
            log.error("Failed to broadcast packet event for session {}: {}", sessionId, e.getMessage());
        }
    }
    
    public void sendPacketSent(String sessionId, String packetId, String messageId, 
                              String sourceNodeId, String targetNodeId, String routePath) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.PACKET_SENT);
        event.setSessionId(sessionId);
        event.setPacketId(packetId);
        event.setMessageId(messageId);
        event.setSourceNodeId(sourceNodeId);
        event.setTargetNodeId(targetNodeId);
        event.setCurrentNodeId(sourceNodeId);
        event.setStatus(PacketEvent.EventStatus.INFO);
        event.setDescription("Packet sent from " + sourceNodeId);
        event.setRoutePath(routePath);
        event.setCurrentHop(0);
        event.setProgress(0.0);
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendPacketArrived(String sessionId, String packetId, String messageId,
                                 String nodeId, String connectionId, int currentHop, int totalHops) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.PACKET_ARRIVED);
        event.setSessionId(sessionId);
        event.setPacketId(packetId);
        event.setMessageId(messageId);
        event.setCurrentNodeId(nodeId);
        event.setConnectionId(connectionId);
        event.setStatus(PacketEvent.EventStatus.SUCCESS);
        event.setDescription("Packet arrived at " + nodeId);
        event.setCurrentHop(currentHop);
        event.setTotalHops(totalHops);
        event.setProgress((double) currentHop / totalHops);
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendPacketForwarded(String sessionId, String packetId, String messageId,
                                   String fromNodeId, String toNodeId, String connectionId, 
                                   int currentHop, int totalHops) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.PACKET_FORWARDED);
        event.setSessionId(sessionId);
        event.setPacketId(packetId);
        event.setMessageId(messageId);
        event.setCurrentNodeId(fromNodeId);
        event.setConnectionId(connectionId);
        event.setStatus(PacketEvent.EventStatus.INFO);
        event.setDescription("Packet forwarded from " + fromNodeId + " to " + toNodeId);
        event.setCurrentHop(currentHop);
        event.setTotalHops(totalHops);
        event.setProgress((double) currentHop / totalHops);
        event.setMetadata(Map.of("nextNode", toNodeId));
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendPacketDelivered(String sessionId, String packetId, String messageId,
                                   String targetNodeId, long duration, int totalHops) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.PACKET_DELIVERED);
        event.setSessionId(sessionId);
        event.setPacketId(packetId);
        event.setMessageId(messageId);
        event.setCurrentNodeId(targetNodeId);
        event.setTargetNodeId(targetNodeId);
        event.setStatus(PacketEvent.EventStatus.SUCCESS);
        event.setDescription("Packet successfully delivered to " + targetNodeId);
        event.setDuration(duration);
        event.setTotalHops(totalHops);
        event.setCurrentHop(totalHops);
        event.setProgress(1.0);
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendPacketLost(String sessionId, String packetId, String messageId,
                              String nodeId, String reason, String anomalyType) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.PACKET_LOST);
        event.setSessionId(sessionId);
        event.setPacketId(packetId);
        event.setMessageId(messageId);
        event.setCurrentNodeId(nodeId);
        event.setStatus(PacketEvent.EventStatus.ERROR);
        event.setDescription("Packet lost at " + nodeId + ": " + reason);
        event.setAnomalyType(anomalyType);
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendAnomalyApplied(String sessionId, String packetId, String messageId,
                                  String nodeId, String anomalyType, String description) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.ANOMALY_APPLIED);
        event.setSessionId(sessionId);
        event.setPacketId(packetId);
        event.setMessageId(messageId);
        event.setCurrentNodeId(nodeId);
        event.setStatus(PacketEvent.EventStatus.WARNING);
        event.setDescription(description);
        event.setAnomalyType(anomalyType);
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendSimulationStarted(String sessionId, int totalMessages) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.SIMULATION_STARTED);
        event.setSessionId(sessionId);
        event.setStatus(PacketEvent.EventStatus.INFO);
        event.setDescription("Simulation started with " + totalMessages + " messages");
        event.setMetadata(Map.of("totalMessages", totalMessages));
        
        broadcastPacketEvent(sessionId, event);
    }
    
    public void sendSimulationCompleted(String sessionId, long duration, int deliveredCount, int lostCount) {
        PacketEvent event = new PacketEvent();
        event.setEventType(PacketEvent.SIMULATION_COMPLETED);
        event.setSessionId(sessionId);
        event.setStatus(PacketEvent.EventStatus.SUCCESS);
        event.setDescription("Simulation completed");
        event.setDuration(duration);
        event.setMetadata(Map.of(
            "deliveredCount", deliveredCount,
            "lostCount", lostCount,
            "totalDuration", duration
        ));
        
        broadcastPacketEvent(sessionId, event);
    }
}