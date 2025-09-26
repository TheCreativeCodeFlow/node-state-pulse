package com.netlab.networksimulator.dto;

import com.netlab.networksimulator.domain.Anomaly;
import lombok.Data;

@Data
public class AnomalyRequest {
    private Anomaly.AnomalyType type;
    private String description;
    private Integer severity = 1;
    private Double probability = 0.1;
    private Integer delayAmount;
    private Double corruptionRate;
    private String wrongDestination;
    private Integer reorderPosition;
    private String metadata;
}

@Data
class AnomalyResponse {
    private String id;
    private Anomaly.AnomalyType type;
    private String description;
    private Integer severity;
    private Double probability;
    private Integer delayAmount;
    private Double corruptionRate;
    private String wrongDestination;
    private Integer reorderPosition;
    private String metadata;
    private Boolean isApplied;
    private java.time.LocalDateTime appliedAt;
    private java.time.LocalDateTime createdAt;
    private String messageId;
}