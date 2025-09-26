package com.netlab.networksimulator.simulation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SimulationResult {
    private final String sessionId;
    private final List<MessageSimulationResult> messageResults;
    private long duration;
    private int deliveredCount;
    private int lostCount;
    private int failedCount;
    
    public SimulationResult(String sessionId) {
        this.sessionId = sessionId;
        this.messageResults = new ArrayList<>();
        this.deliveredCount = 0;
        this.lostCount = 0;
        this.failedCount = 0;
    }
    
    public void addMessageResult(MessageSimulationResult result) {
        messageResults.add(result);
        if (result.isSuccess()) {
            deliveredCount++;
        } else {
            lostCount++;
        }
    }
    
    public void incrementFailedCount() {
        failedCount++;
    }
    
    public int getTotalMessages() {
        return messageResults.size();
    }
    
    public double getSuccessRate() {
        if (getTotalMessages() == 0) return 0.0;
        return (double) deliveredCount / getTotalMessages();
    }
    
    public double getAverageDeliveryTime() {
        return messageResults.stream()
            .filter(MessageSimulationResult::isSuccess)
            .mapToLong(MessageSimulationResult::getDeliveryTime)
            .average()
            .orElse(0.0);
    }
}

@Data
class MessageSimulationResult {
    private final String messageId;
    private final String packetId;
    private boolean success;
    private long deliveryTime; // milliseconds
    private String failureReason;
    private List<String> appliedAnomalies = new ArrayList<>();
    
    public MessageSimulationResult(String messageId, String packetId) {
        this.messageId = messageId;
        this.packetId = packetId;
        this.success = false;
    }
    
    public void addAppliedAnomaly(String anomalyType) {
        appliedAnomalies.add(anomalyType);
    }
}