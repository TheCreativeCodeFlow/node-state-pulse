package com.netlab.networksimulator.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
@Table(name = "nodes")
@Data
@EqualsAndHashCode(exclude = {"session", "sourceConnections", "targetConnections", "sentMessages", "receivedMessages"})
@ToString(exclude = {"session", "sourceConnections", "targetConnections", "sentMessages", "receivedMessages"})
public class Node {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotBlank
    @Column(name = "name", nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NodeType type;
    
    @NotNull
    @Column(name = "position_x", nullable = false)
    private Double positionX;
    
    @NotNull
    @Column(name = "position_y", nullable = false)
    private Double positionY;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "mac_address")
    private String macAddress;
    
    @Column(name = "processing_delay")
    private Integer processingDelay = 10; // milliseconds
    
    @Column(name = "buffer_size")
    private Integer bufferSize = 100; // packets
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
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
    @JsonBackReference("session-nodes")
    private Session session;
    
    @OneToMany(mappedBy = "sourceNode", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Connection> sourceConnections = new HashSet<>();
    
    @OneToMany(mappedBy = "targetNode", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Connection> targetConnections = new HashSet<>();
    
    @OneToMany(mappedBy = "sourceNode", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Message> sentMessages = new HashSet<>();
    
    @OneToMany(mappedBy = "targetNode", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Message> receivedMessages = new HashSet<>();
    
    public enum NodeType {
        HOST, ROUTER, SWITCH, HUB, GATEWAY, FIREWALL, LOAD_BALANCER, SERVER
    }
}