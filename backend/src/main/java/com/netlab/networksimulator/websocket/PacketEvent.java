package com.netlab.networksimulator.websocket;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PacketEvent {
    private String eventType;
    private String sessionId;
    private String packetId;
    private String messageId;
    private String sourceNodeId;
    private String targetNodeId;
    private String currentNodeId;
    private String connectionId;
    private EventStatus status;
    private String description;
    private Map<String, Object> metadata;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime timestamp;
    
    private Integer sequenceNumber;
    private Integer totalHops;
    private Integer currentHop;
    private String routePath;
    private Long duration; // milliseconds
    private String anomalyType;
    private Double progress; // 0.0 to 1.0
    
    public enum EventStatus {
        SUCCESS, FAILED, WARNING, INFO, ERROR
    }
    
    // Event type constants
    public static final String PACKET_SENT = "packet_sent";
    public static final String PACKET_ARRIVED = "packet_arrived";
    public static final String PACKET_FORWARDED = "packet_forwarded";
    public static final String PACKET_LOST = "packet_lost";
    public static final String PACKET_DELAYED = "packet_delayed";
    public static final String PACKET_CORRUPTED = "packet_corrupted";
    public static final String PACKET_DUPLICATED = "packet_duplicated";
    public static final String PACKET_OUT_OF_ORDER = "packet_out_of_order";
    public static final String PACKET_DELIVERED = "delivered";
    public static final String CONNECTION_LOST = "connection_lost";
    public static final String NODE_CONGESTION = "node_congestion";
    public static final String SIMULATION_STARTED = "simulation_started";
    public static final String SIMULATION_COMPLETED = "simulation_completed";
    public static final String ANOMALY_APPLIED = "anomaly_applied";
}