package com.netlab.networksimulator.simulation;

import com.netlab.networksimulator.domain.Anomaly;
import com.netlab.networksimulator.domain.Connection;
import com.netlab.networksimulator.domain.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@Slf4j
public class AnomalyInjectionService {
    
    private final Random random = new Random();
    
    public List<Anomaly> generateAnomalies(SimulationConfig config, Message message, 
                                          Connection connection, String currentNodeId, String nextNodeId) {
        
        List<Anomaly> anomalies = new ArrayList<>();
        
        if (!config.isEnableAnomalies()) {
            return anomalies;
        }
        
        // Check for packet loss
        if (shouldApplyAnomaly(config.getPacketLossRate() + connection.getPacketLossRate())) {
            anomalies.add(createPacketLossAnomaly());
        }
        
        // Check for delay
        if (shouldApplyAnomaly(config.getDelayProbability())) {
            anomalies.add(createDelayAnomaly(config.getMaxDelayMs()));
        }
        
        // Check for corruption
        if (shouldApplyAnomaly(config.getCorruptionRate())) {
            anomalies.add(createCorruptionAnomaly(config.getCorruptionRate()));
        }
        
        // Check for wrong delivery
        if (shouldApplyAnomaly(config.getWrongDeliveryProbability())) {
            anomalies.add(createWrongDeliveryAnomaly(nextNodeId));
        }
        
        // Check for out of order delivery
        if (shouldApplyAnomaly(config.getOutOfOrderProbability())) {
            anomalies.add(createOutOfOrderAnomaly());
        }
        
        // Check for duplication
        if (shouldApplyAnomaly(config.getDuplicationProbability())) {
            anomalies.add(createDuplicationAnomaly());
        }
        
        // Check for connection failure
        if (shouldApplyAnomaly(config.getConnectionFailureRate())) {
            anomalies.add(createConnectionLostAnomaly());
        }
        
        log.debug("Generated {} anomalies for message {} between nodes {} and {}", 
                 anomalies.size(), message.getPacketId(), currentNodeId, nextNodeId);
        
        return anomalies;
    }
    
    private boolean shouldApplyAnomaly(double probability) {
        return random.nextDouble() < probability;
    }
    
    private Anomaly createPacketLossAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.PACKET_LOSS);
        anomaly.setDescription("Packet dropped due to network congestion or buffer overflow");
        anomaly.setSeverity(4); // High severity
        anomaly.setProbability(0.1);
        return anomaly;
    }
    
    private Anomaly createDelayAnomaly(int maxDelayMs) {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.DELAY);
        anomaly.setDelayAmount(random.nextInt(maxDelayMs) + 50); // 50ms to maxDelayMs
        anomaly.setDescription("Packet delayed by " + anomaly.getDelayAmount() + "ms due to network congestion");
        anomaly.setSeverity(2); // Medium severity
        anomaly.setProbability(0.05);
        return anomaly;
    }
    
    private Anomaly createCorruptionAnomaly(double corruptionRate) {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.CORRUPTION);
        anomaly.setCorruptionRate(corruptionRate);
        anomaly.setDescription("Packet corrupted during transmission due to electromagnetic interference");
        anomaly.setSeverity(3); // Medium-high severity
        anomaly.setProbability(0.01);
        return anomaly;
    }
    
    private Anomaly createWrongDeliveryAnomaly(String originalDestination) {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.WRONG_DELIVERY);
        anomaly.setWrongDestination("random-node-id"); // In real implementation, pick random node
        anomaly.setDescription("Packet delivered to wrong destination due to routing table error");
        anomaly.setSeverity(4); // High severity
        anomaly.setProbability(0.01);
        return anomaly;
    }
    
    private Anomaly createOutOfOrderAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.OUT_OF_ORDER);
        anomaly.setReorderPosition(random.nextInt(5) + 1); // Reorder by 1-5 positions
        anomaly.setDescription("Packet arrived out of order due to different routing paths");
        anomaly.setSeverity(2); // Medium severity
        anomaly.setProbability(0.02);
        return anomaly;
    }
    
    private Anomaly createDuplicationAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.DUPLICATION);
        anomaly.setDescription("Packet duplicated due to network equipment malfunction");
        anomaly.setSeverity(2); // Medium severity
        anomaly.setProbability(0.01);
        return anomaly;
    }
    
    private Anomaly createConnectionLostAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.CONNECTION_LOST);
        anomaly.setDescription("Connection lost due to physical link failure");
        anomaly.setSeverity(5); // Critical severity
        anomaly.setProbability(0.005);
        return anomaly;
    }
    
    private Anomaly createCongestionAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.CONGESTION);
        anomaly.setDescription("Network congestion causing increased delays and potential packet loss");
        anomaly.setSeverity(3); // Medium-high severity
        anomaly.setProbability(0.03);
        return anomaly;
    }
    
    private Anomaly createFragmentationAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.FRAGMENTATION);
        anomaly.setDescription("Packet fragmented due to MTU size limitations");
        anomaly.setSeverity(1); // Low severity (normal behavior)
        anomaly.setProbability(0.1);
        return anomaly;
    }
    
    private Anomaly createTimeoutAnomaly() {
        Anomaly anomaly = new Anomaly();
        anomaly.setType(Anomaly.AnomalyType.TIMEOUT);
        anomaly.setDescription("Transmission timeout - packet may need retransmission");
        anomaly.setSeverity(3); // Medium-high severity
        anomaly.setProbability(0.02);
        return anomaly;
    }
}