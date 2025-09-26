package com.netlab.networksimulator.dto;

import com.netlab.networksimulator.domain.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageRequest {
    @NotBlank(message = "Source node ID is required")
    private String sourceNodeId;
    
    @NotBlank(message = "Target node ID is required")
    private String targetNodeId;
    
    @NotNull(message = "Message type is required")
    private Message.MessageType messageType;
    
    @NotNull(message = "Message size is required")
    private Integer size;
    
    private String payload;
    private String headers;
    private Integer priority = 0;
    private Integer ttl = 64;
    private Long sequenceNumber;
    private Long acknowledgmentNumber;
    private Integer windowSize;
}

@Data
class MessageResponse {
    private String id;
    private String packetId;
    private String sourceNodeId;
    private String targetNodeId;
    private Message.MessageType messageType;
    private Integer size;
    private String payload;
    private String headers;
    private Message.MessageStatus status;
    private Integer priority;
    private Integer ttl;
    private Long sequenceNumber;
    private Long acknowledgmentNumber;
    private Integer windowSize;
    private String checksum;
    private String routePath;
    private Integer currentHop;
    private java.time.LocalDateTime sentAt;
    private java.time.LocalDateTime receivedAt;
    private java.time.LocalDateTime estimatedDeliveryTime;
    private java.time.LocalDateTime createdAt;
}