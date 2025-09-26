package com.netlab.networksimulator.controller;

import com.netlab.networksimulator.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Integration", description = "AI-powered educational assistance")
@CrossOrigin(origins = "*")
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true")
public class AIController {
    
    private final AIService aiService;
    
    @PostMapping("/query")
    @Operation(summary = "Query AI for educational explanations")
    public ResponseEntity<Map<String, Object>> queryAI(
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @RequestBody AIQueryRequest request) {
        
        log.debug("AI query from student: {} for session: {}", studentId, request.getSessionId());
        
        try {
            Map<String, Object> response = aiService.processQuery(request, studentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI query failed for student {}: {}", studentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "AI query failed",
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/explain-logs")
    @Operation(summary = "Get AI explanation of simulation logs")
    public ResponseEntity<Map<String, Object>> explainLogs(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @RequestParam(required = false) String focusArea) {
        
        log.debug("AI log explanation request for session: {} by student: {}", sessionId, studentId);
        
        try {
            Map<String, Object> response = aiService.explainSessionLogs(sessionId, studentId, focusArea);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI log explanation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to explain logs",
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/analyze-anomalies")
    @Operation(summary = "Get AI analysis of network anomalies")
    public ResponseEntity<Map<String, Object>> analyzeAnomalies(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        log.debug("AI anomaly analysis request for session: {} by student: {}", sessionId, studentId);
        
        try {
            Map<String, Object> response = aiService.analyzeAnomalies(sessionId, studentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI anomaly analysis failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to analyze anomalies",
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/suggest-improvements")
    @Operation(summary = "Get AI suggestions for network improvements")
    public ResponseEntity<Map<String, Object>> suggestImprovements(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        log.debug("AI improvement suggestions request for session: {} by student: {}", sessionId, studentId);
        
        try {
            Map<String, Object> response = aiService.suggestNetworkImprovements(sessionId, studentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI suggestions failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to generate suggestions",
                "message", e.getMessage()
            ));
        }
    }
    
    public static class AIQueryRequest {
        private String sessionId;
        private String question;
        private String context;
        private String queryType; // "explain", "troubleshoot", "learn", "analyze"
        
        // Getters and setters
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        
        public String getContext() { return context; }
        public void setContext(String context) { this.context = context; }
        
        public String getQueryType() { return queryType; }
        public void setQueryType(String queryType) { this.queryType = queryType; }
    }
}