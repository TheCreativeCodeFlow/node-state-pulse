package com.netlab.networksimulator.dto;

import com.netlab.networksimulator.domain.Node;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NodeRequest {
    @NotBlank(message = "Node name is required")
    private String name;
    
    @NotNull(message = "Node type is required")
    private Node.NodeType type;
    
    @NotNull(message = "Position X is required")
    private Double positionX;
    
    @NotNull(message = "Position Y is required")
    private Double positionY;
    
    private String ipAddress;
    private String macAddress;
    private Integer processingDelay;
    private Integer bufferSize;
    private Boolean isActive = true;
    private String metadata;
}

@Data
class NodeResponse {
    private String id;
    private String name;
    private Node.NodeType type;
    private Double positionX;
    private Double positionY;
    private String ipAddress;
    private String macAddress;
    private Integer processingDelay;
    private Integer bufferSize;
    private Boolean isActive;
    private String metadata;
    private String sessionId;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}