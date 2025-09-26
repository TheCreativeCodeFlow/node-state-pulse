package com.netlab.networksimulator.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "anomalies")
@Data
@EqualsAndHashCode(exclude = {"message"})
@ToString(exclude = {"message"})
public class Anomaly {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private AnomalyType type;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "severity")
    private Integer severity = 1; // 1 = low, 5 = critical
    
    @Column(name = "probability")
    private Double probability = 0.1; // 0.0 - 1.0
    
    @Column(name = "delay_amount")
    private Integer delayAmount; // milliseconds for delay anomalies
    
    @Column(name = "corruption_rate")
    private Double corruptionRate; // 0.0 - 1.0 for corruption anomalies
    
    @Column(name = "wrong_destination")
    private String wrongDestination; // node ID for wrong delivery
    
    @Column(name = "reorder_position")
    private Integer reorderPosition; // for out-of-order anomalies
    
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string for additional properties
    
    @Column(name = "is_applied")
    private Boolean isApplied = false;
    
    @Column(name = "applied_at")
    private LocalDateTime appliedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    @JsonIgnore
    private Message message;
    
    public enum AnomalyType {
        PACKET_LOSS,        // Packet is dropped
        DELAY,              // Packet is delayed
        WRONG_DELIVERY,     // Packet delivered to wrong destination
        OUT_OF_ORDER,       // Packet arrives out of sequence
        CORRUPTION,         // Packet content is corrupted
        DUPLICATION,        // Packet is duplicated
        CONNECTION_LOST,    // Connection fails during transmission
        CONGESTION,         // Network congestion causes delays
        FRAGMENTATION,      // Packet is fragmented
        TIMEOUT             // Transmission timeout
    }
}