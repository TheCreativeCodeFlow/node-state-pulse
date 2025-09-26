package com.netlab.networksimulator.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "messages")
@Data
@EqualsAndHashCode(exclude = {"session", "sourceNode", "targetNode", "connection", "anomalies"})
@ToString(exclude = {"session", "sourceNode", "targetNode", "connection", "anomalies"})
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotBlank
    @Column(name = "packet_id", nullable = false)
    private String packetId; // Unique identifier for tracking
    
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType;
    
    @NotNull
    @Column(name = "size", nullable = false)
    private Integer size; // bytes
    
    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;
    
    @Column(name = "headers", columnDefinition = "TEXT")
    private String headers; // JSON string
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MessageStatus status = MessageStatus.CREATED;
    
    @Column(name = "priority")
    private Integer priority = 0; // 0 = lowest, 10 = highest
    
    @Column(name = "ttl")
    private Integer ttl = 64; // time to live
    
    @Column(name = "sequence_number")
    private Long sequenceNumber;
    
    @Column(name = "acknowledgment_number")
    private Long acknowledgmentNumber;
    
    @Column(name = "window_size")
    private Integer windowSize;
    
    @Column(name = "checksum")
    private String checksum;
    
    @Column(name = "route_path", columnDefinition = "TEXT")
    private String routePath; // JSON array of node IDs
    
    @Column(name = "current_hop")
    private Integer currentHop = 0;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "received_at")
    private LocalDateTime receivedAt;
    
    @Column(name = "estimated_delivery_time")
    private LocalDateTime estimatedDeliveryTime;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private Session session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_node_id", nullable = false)
    private Node sourceNode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_node_id", nullable = false)
    private Node targetNode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id")
    private Connection connection; // Current connection being used
    
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Anomaly> anomalies = new HashSet<>();
    
    public enum MessageType {
        DATA, CONTROL, ACK, NACK, PING, PONG, BROADCAST, MULTICAST
    }
    
    public enum MessageStatus {
        CREATED, QUEUED, SENT, IN_TRANSIT, DELIVERED, FAILED, DROPPED, TIMEOUT
    }
}