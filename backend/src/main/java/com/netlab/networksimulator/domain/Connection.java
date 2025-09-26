package com.netlab.networksimulator.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "connections")
@Data
@EqualsAndHashCode(exclude = {"session", "sourceNode", "targetNode", "messages"})
@ToString(exclude = {"session", "sourceNode", "targetNode", "messages"})
public class Connection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ConnectionType type;
    
    @NotNull
    @Column(name = "bandwidth", nullable = false)
    private Integer bandwidth; // Mbps
    
    @NotNull
    @Column(name = "latency", nullable = false)
    private Integer latency; // milliseconds
    
    @Column(name = "packet_loss_rate")
    private Double packetLossRate = 0.0; // percentage (0.0 - 1.0)
    
    @Column(name = "jitter")
    private Integer jitter = 0; // milliseconds
    
    @Column(name = "mtu")
    private Integer mtu = 1500; // bytes
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "is_bidirectional")
    private Boolean isBidirectional = true;
    
    @Column(name = "cost")
    private Integer cost = 1; // for routing algorithms
    
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string for additional properties
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonBackReference("session-connections")
    private Session session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_node_id", nullable = false)
    private Node sourceNode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_node_id", nullable = false)
    private Node targetNode;
    
    @OneToMany(mappedBy = "connection", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Message> messages = new HashSet<>();
    
    public enum ConnectionType {
        ETHERNET, WIFI, FIBER, COAX, SERIAL, USB, BLUETOOTH, ZIGBEE, CELLULAR
    }
}