package com.netlab.networksimulator.simulation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimulationConfig {
    private long messageInterval = 100; // milliseconds between messages
    private double packetLossRate = 0.02; // 2% default packet loss
    private double corruptionRate = 0.01; // 1% default corruption rate
    private int maxDelayMs = 1000; // maximum delay in milliseconds
    private double connectionFailureRate = 0.005; // 0.5% connection failure rate
    private boolean enableAnomalies = true;
    private boolean enableLogging = true;
    private int maxSimulationTimeMs = 300000; // 5 minutes max simulation time
    private String routingAlgorithm = "SHORTEST_PATH"; // SHORTEST_PATH, DIJKSTRA, FLOODING
    
    // Anomaly-specific configurations
    private double delayProbability = 0.05;
    private double wrongDeliveryProbability = 0.01;
    private double outOfOrderProbability = 0.02;
    private double duplicationProbability = 0.01;
    private double congestionThreshold = 0.8; // 80% buffer utilization
    
    public static SimulationConfig getDefault() {
        return new SimulationConfig();
    }
    
    public static SimulationConfig getHighAnomalyConfig() {
        SimulationConfig config = new SimulationConfig();
        config.setPacketLossRate(0.1); // 10% packet loss
        config.setCorruptionRate(0.05); // 5% corruption
        config.setConnectionFailureRate(0.02); // 2% connection failure
        config.setDelayProbability(0.15); // 15% delay probability
        config.setWrongDeliveryProbability(0.05); // 5% wrong delivery
        return config;
    }
    
    public static SimulationConfig getReliableConfig() {
        SimulationConfig config = new SimulationConfig();
        config.setPacketLossRate(0.001); // 0.1% packet loss
        config.setCorruptionRate(0.0005); // 0.05% corruption
        config.setConnectionFailureRate(0.0001); // 0.01% connection failure
        config.setDelayProbability(0.01); // 1% delay probability
        config.setWrongDeliveryProbability(0.001); // 0.1% wrong delivery
        return config;
    }
}