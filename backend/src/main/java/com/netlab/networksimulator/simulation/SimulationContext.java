package com.netlab.networksimulator.simulation;

import com.netlab.networksimulator.domain.Connection;
import com.netlab.networksimulator.domain.Node;
import lombok.Data;

import java.util.List;

@Data
public class SimulationContext {
    private final String sessionId;
    private final List<Node> nodes;
    private final List<Connection> connections;
    private final SimulationConfig config;
    private final long startTime;
    
    public SimulationContext(String sessionId, List<Node> nodes, List<Connection> connections, SimulationConfig config) {
        this.sessionId = sessionId;
        this.nodes = nodes;
        this.connections = connections;
        this.config = config;
        this.startTime = System.currentTimeMillis();
    }
}