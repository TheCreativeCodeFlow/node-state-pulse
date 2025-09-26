package com.netlab.networksimulator.dto;

import com.netlab.networksimulator.domain.Session;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SessionRequest {
    @NotBlank(message = "Session name is required")
    private String sessionName;
    
    private String description;
}

@Data
class SessionResponse {
    private String id;
    private String studentId;
    private String sessionName;
    private String description;
    private Session.SessionStatus status;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private Long nodeCount;
    private Long connectionCount;
    private Long messageCount;
}