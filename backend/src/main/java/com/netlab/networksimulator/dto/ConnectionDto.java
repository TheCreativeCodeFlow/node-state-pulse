package com.netlab.networksimulator.dto;

import com.netlab.networksimulator.domain.Connection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConnectionRequest {
    @NotBlank(message = "Source node ID is required")
    private String sourceNodeId;
    
    @NotBlank(message = "Target node ID is required")
    private String targetNodeId;
    
    @NotNull(message = "Connection type is required")
    private Connection.ConnectionType type;
    
    @NotNull(message = "Bandwidth is required")
    private Integer bandwidth;
    
    @NotNull(message = "Latency is required")
    private Integer latency;
    
    private Double packetLossRate = 0.0;
    private Integer jitter = 0;
    private Integer mtu = 1500;
    private Boolean isActive = true;
    private Boolean isBidirectional = true;
    private Integer cost = 1;
    private String metadata;
}

@Data
class ConnectionResponse {
    private String id;
    private String sourceNodeId;
    private String targetNodeId;
    private Connection.ConnectionType type;
    private Integer bandwidth;
    private Integer latency;
    private Double packetLossRate;
    private Integer jitter;
    private Integer mtu;
    private Boolean isActive;
    private Boolean isBidirectional;
    private Integer cost;
    private String metadata;
    private String sessionId;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}