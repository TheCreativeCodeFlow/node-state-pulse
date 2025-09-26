package com.netlab.networksimulator.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "session_logs")
@Data
@EqualsAndHashCode(exclude = {"session"})
@ToString(exclude = {"session"})
public class SessionLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;
    
    @NotBlank
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Column(name = "details", columnDefinition = "TEXT")
    private String details; // JSON string with additional details
    
    @Column(name = "node_id")
    private String nodeId;
    
    @Column(name = "connection_id")
    private String connectionId;
    
    @Column(name = "message_id")
    private String messageId;
    
    @Column(name = "packet_id")
    private String packetId;
    
    @Column(name = "anomaly_id")
    private String anomalyId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "log_level", nullable = false)
    private LogLevel logLevel = LogLevel.INFO;
    
    @Column(name = "duration")
    private Long duration; // milliseconds
    
    @Column(name = "source_ip")
    private String sourceIp;
    
    @Column(name = "target_ip")
    private String targetIp;
    
    @Column(name = "protocol")
    private String protocol;
    
    @Column(name = "port")
    private Integer port;
    
    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private Session session;
    
    public enum EventType {
        // Node events
        NODE_CREATED, NODE_UPDATED, NODE_DELETED, NODE_ACTIVATED, NODE_DEACTIVATED,
        
        // Connection events
        CONNECTION_CREATED, CONNECTION_UPDATED, CONNECTION_DELETED, CONNECTION_ESTABLISHED, CONNECTION_LOST,
        
        // Message/Packet events
        PACKET_SENT, PACKET_RECEIVED, PACKET_FORWARDED, PACKET_DROPPED, PACKET_DELAYED,
        PACKET_CORRUPTED, PACKET_DUPLICATED, PACKET_OUT_OF_ORDER, PACKET_TIMEOUT,
        
        // Session events
        SESSION_STARTED, SESSION_PAUSED, SESSION_RESUMED, SESSION_STOPPED, SESSION_RESET,
        
        // Simulation events
        SIMULATION_STARTED, SIMULATION_COMPLETED, SIMULATION_ERROR,
        
        // Anomaly events
        ANOMALY_APPLIED, ANOMALY_DETECTED, ANOMALY_RESOLVED,
        
        // System events
        SYSTEM_ERROR, SYSTEM_WARNING, SYSTEM_INFO
    }
    
    public enum LogLevel {
        TRACE, DEBUG, INFO, WARN, ERROR, FATAL
    }
}