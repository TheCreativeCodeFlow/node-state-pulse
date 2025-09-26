package com.netlab.networksimulator.service;

import com.netlab.networksimulator.controller.AIController.AIQueryRequest;
import com.netlab.networksimulator.domain.Anomaly;
import com.netlab.networksimulator.domain.SessionLog;
import com.netlab.networksimulator.repository.AnomalyRepository;
import com.netlab.networksimulator.repository.SessionLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true")
public class AIService {
    
    private final WebClient.Builder webClientBuilder;
    private final SessionLogRepository sessionLogRepository;
    private final AnomalyRepository anomalyRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${app.ai.api.url}")
    private String aiApiUrl;
    
    @Value("${app.ai.api.key}")
    private String aiApiKey;
    
    @Value("${app.ai.model:gemini-pro}")
    private String aiModel;
    
    public Map<String, Object> processQuery(AIQueryRequest request, String studentId) {
        log.debug("Processing AI query: {} for session: {}", request.getQueryType(), request.getSessionId());
        
        try {
            // Gather context data
            String contextData = gatherContextData(request.getSessionId(), request.getQueryType());
            
            // Build AI prompt
            String prompt = buildPrompt(request, contextData);
            
            // Call AI API
            String aiResponse = callAIAPI(prompt);
            
            // Log the interaction
            logAIInteraction(request.getSessionId(), studentId, request.getQuestion(), aiResponse);
            
            return Map.of(
                "response", aiResponse,
                "timestamp", LocalDateTime.now().toString(),
                "queryType", request.getQueryType(),
                "sessionId", request.getSessionId()
            );
            
        } catch (Exception e) {
            log.error("Failed to process AI query: {}", e.getMessage());
            throw new RuntimeException("AI query processing failed: " + e.getMessage());
        }
    }
    
    public Map<String, Object> explainSessionLogs(String sessionId, String studentId, String focusArea) {
        log.debug("Explaining session logs for session: {}", sessionId);
        
        try {
            // Get recent logs
            List<SessionLog> logs = sessionLogRepository.findBySessionIdOrderByTimestampDesc(sessionId);
            List<SessionLog> recentLogs = logs.stream().limit(50).collect(Collectors.toList());
            
            // Format logs for AI
            String logsContext = formatLogsForAI(recentLogs, focusArea);
            
            String prompt = buildLogExplanationPrompt(logsContext, focusArea);
            String aiResponse = callAIAPI(prompt);
            
            logAIInteraction(sessionId, studentId, "Explain session logs", aiResponse);
            
            return Map.of(
                "explanation", aiResponse,
                "logCount", recentLogs.size(),
                "focusArea", focusArea != null ? focusArea : "general",
                "timestamp", LocalDateTime.now().toString()
            );
            
        } catch (Exception e) {
            log.error("Failed to explain session logs: {}", e.getMessage());
            throw new RuntimeException("Log explanation failed: " + e.getMessage());
        }
    }
    
    public Map<String, Object> analyzeAnomalies(String sessionId, String studentId) {
        log.debug("Analyzing anomalies for session: {}", sessionId);
        
        try {
            // Get anomalies
            List<Anomaly> anomalies = anomalyRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
            
            if (anomalies.isEmpty()) {
                return Map.of(
                    "analysis", "No anomalies detected in this simulation session.",
                    "anomalyCount", 0,
                    "timestamp", LocalDateTime.now().toString()
                );
            }
            
            // Analyze anomaly patterns
            String anomalyContext = formatAnomaliesForAI(anomalies);
            String prompt = buildAnomalyAnalysisPrompt(anomalyContext);
            String aiResponse = callAIAPI(prompt);
            
            logAIInteraction(sessionId, studentId, "Analyze network anomalies", aiResponse);
            
            return Map.of(
                "analysis", aiResponse,
                "anomalyCount", anomalies.size(),
                "anomalyTypes", getAnomalyTypeCounts(anomalies),
                "timestamp", LocalDateTime.now().toString()
            );
            
        } catch (Exception e) {
            log.error("Failed to analyze anomalies: {}", e.getMessage());
            throw new RuntimeException("Anomaly analysis failed: " + e.getMessage());
        }
    }
    
    public Map<String, Object> suggestNetworkImprovements(String sessionId, String studentId) {
        log.debug("Generating improvement suggestions for session: {}", sessionId);
        
        try {
            // Get simulation data
            List<SessionLog> logs = sessionLogRepository.findBySessionIdOrderByTimestampDesc(sessionId);
            List<Anomaly> anomalies = anomalyRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
            
            // Analyze performance metrics
            String performanceContext = analyzePerformanceMetrics(logs, anomalies);
            String prompt = buildImprovementSuggestionPrompt(performanceContext);
            String aiResponse = callAIAPI(prompt);
            
            logAIInteraction(sessionId, studentId, "Generate improvement suggestions", aiResponse);
            
            return Map.of(
                "suggestions", aiResponse,
                "basedOnLogs", logs.size(),
                "basedOnAnomalies", anomalies.size(),
                "timestamp", LocalDateTime.now().toString()
            );
            
        } catch (Exception e) {
            log.error("Failed to generate suggestions: {}", e.getMessage());
            throw new RuntimeException("Suggestion generation failed: " + e.getMessage());
        }
    }
    
    private String gatherContextData(String sessionId, String queryType) {
        StringBuilder context = new StringBuilder();
        
        try {
            // Get recent logs based on query type
            List<SessionLog> logs = sessionLogRepository.findBySessionIdOrderByTimestampDesc(sessionId);
            int logLimit = "troubleshoot".equals(queryType) ? 100 : 20;
            
            List<SessionLog> relevantLogs = logs.stream().limit(logLimit).collect(Collectors.toList());
            
            context.append("Recent simulation logs:\n");
            for (SessionLog log : relevantLogs) {
                context.append(String.format("[%s] %s: %s\n", 
                    log.getTimestamp(), log.getEventType(), log.getMessage()));
            }
            
            // Add anomaly data for troubleshooting
            if ("troubleshoot".equals(queryType) || "analyze".equals(queryType)) {
                List<Anomaly> anomalies = anomalyRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
                if (!anomalies.isEmpty()) {
                    context.append("\nNetwork anomalies detected:\n");
                    for (Anomaly anomaly : anomalies.stream().limit(10).collect(Collectors.toList())) {
                        context.append(String.format("- %s: %s (Severity: %d)\n", 
                            anomaly.getType(), anomaly.getDescription(), anomaly.getSeverity()));
                    }
                }
            }
            
        } catch (Exception e) {
            log.warn("Failed to gather context data: {}", e.getMessage());
            context.append("Limited context available due to data access issues.");
        }
        
        return context.toString();
    }
    
    private String buildPrompt(AIQueryRequest request, String contextData) {
        return String.format("""
            You are an expert network engineering instructor helping a student understand computer networking concepts.
            
            Context from their current simulation session:
            %s
            
            Student's question: %s
            Additional context: %s
            Query type: %s
            
            Please provide a clear, educational explanation that:
            1. Directly answers their question
            2. Explains relevant networking concepts
            3. References their simulation data when applicable
            4. Suggests next learning steps
            5. Uses appropriate technical terminology but explains it clearly
            
            Keep the response focused and practical for learning purposes.
            """, contextData, request.getQuestion(), 
            request.getContext() != null ? request.getContext() : "None provided", 
            request.getQueryType());
    }
    
    private String buildLogExplanationPrompt(String logsContext, String focusArea) {
        String focus = focusArea != null ? focusArea : "general network behavior";
        
        return String.format("""
            As a network engineering instructor, please explain the following simulation logs to a student.
            Focus area: %s
            
            Simulation logs:
            %s
            
            Please provide:
            1. A summary of what happened in the simulation
            2. Explanation of key events and their significance
            3. Any patterns or issues you notice
            4. Educational insights about network behavior
            5. Suggestions for what the student should investigate further
            
            Make the explanation educational and accessible for learning networking concepts.
            """, focus, logsContext);
    }
    
    private String buildAnomalyAnalysisPrompt(String anomalyContext) {
        return String.format("""
            As a network engineering instructor, analyze these network anomalies from a student's simulation:
            
            Detected anomalies:
            %s
            
            Please provide:
            1. Analysis of the anomaly patterns
            2. Likely causes and their educational significance
            3. Impact on network performance and reliability
            4. How these relate to real-world networking issues
            5. Recommendations for prevention or mitigation
            
            Focus on the educational value and help the student understand why these anomalies occur.
            """, anomalyContext);
    }
    
    private String buildImprovementSuggestionPrompt(String performanceContext) {
        return String.format("""
            As a network engineering instructor, analyze this network simulation performance data:
            
            Performance analysis:
            %s
            
            Please provide improvement suggestions that include:
            1. Identified performance bottlenecks or issues
            2. Specific recommendations for network optimization
            3. Educational explanation of why these improvements help
            4. Best practices for network design and configuration
            5. Trade-offs and considerations for each suggestion
            
            Make suggestions practical for learning and understanding network engineering principles.
            """, performanceContext);
    }
    
    private String callAIAPI(String prompt) {
        try {
            WebClient webClient = webClientBuilder
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
            
            // Gemini API request format
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "topK", 40,
                    "topP", 0.95,
                    "maxOutputTokens", 1000
                )
            );
            
            String url = aiApiUrl + "?key=" + aiApiKey;
            
            Map<String, Object> response = webClient.post()
                .uri(url)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            
            throw new RuntimeException("Invalid Gemini API response format: " + response);
            
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            throw new RuntimeException("Gemini API call failed: " + e.getMessage());
        }
    }
    
    private String formatLogsForAI(List<SessionLog> logs, String focusArea) {
        StringBuilder formatted = new StringBuilder();
        
        for (SessionLog log : logs) {
            // Filter logs based on focus area if specified
            if (focusArea != null && !isLogRelevantToFocus(log, focusArea)) {
                continue;
            }
            
            formatted.append(String.format("[%s] %s: %s\n", 
                log.getTimestamp(), log.getEventType(), log.getMessage()));
            
            if (log.getDetails() != null) {
                formatted.append("  Details: ").append(log.getDetails()).append("\n");
            }
        }
        
        return formatted.toString();
    }
    
    private boolean isLogRelevantToFocus(SessionLog log, String focusArea) {
        String eventType = log.getEventType().name().toLowerCase();
        String message = log.getMessage().toLowerCase();
        String focus = focusArea.toLowerCase();
        
        return eventType.contains(focus) || message.contains(focus);
    }
    
    private String formatAnomaliesForAI(List<Anomaly> anomalies) {
        StringBuilder formatted = new StringBuilder();
        
        for (Anomaly anomaly : anomalies) {
            formatted.append(String.format("- Type: %s, Severity: %d, Description: %s\n",
                anomaly.getType(), anomaly.getSeverity(), anomaly.getDescription()));
            
            if (anomaly.getDelayAmount() != null) {
                formatted.append("  Delay: ").append(anomaly.getDelayAmount()).append("ms\n");
            }
            if (anomaly.getCorruptionRate() != null) {
                formatted.append("  Corruption Rate: ").append(anomaly.getCorruptionRate()).append("\n");
            }
        }
        
        return formatted.toString();
    }
    
    private Map<String, Long> getAnomalyTypeCounts(List<Anomaly> anomalies) {
        return anomalies.stream()
            .collect(Collectors.groupingBy(
                a -> a.getType().name(),
                Collectors.counting()
            ));
    }
    
    private String analyzePerformanceMetrics(List<SessionLog> logs, List<Anomaly> anomalies) {
        StringBuilder analysis = new StringBuilder();
        
        // Count different event types
        Map<String, Long> eventCounts = logs.stream()
            .collect(Collectors.groupingBy(
                l -> l.getEventType().name(),
                Collectors.counting()
            ));
        
        analysis.append("Event statistics:\n");
        eventCounts.forEach((event, count) -> 
            analysis.append(String.format("- %s: %d occurrences\n", event, count)));
        
        // Anomaly statistics
        if (!anomalies.isEmpty()) {
            analysis.append("\nAnomaly statistics:\n");
            Map<String, Long> anomalyCounts = getAnomalyTypeCounts(anomalies);
            anomalyCounts.forEach((type, count) -> 
                analysis.append(String.format("- %s: %d occurrences\n", type, count)));
        }
        
        // Error rate
        long errorCount = logs.stream()
            .mapToLong(log -> log.getLogLevel().name().equals("ERROR") ? 1 : 0)
            .sum();
        
        double errorRate = logs.isEmpty() ? 0.0 : (double) errorCount / logs.size();
        analysis.append(String.format("\nError rate: %.2f%% (%d errors out of %d events)\n", 
            errorRate * 100, errorCount, logs.size()));
        
        return analysis.toString();
    }
    
    private void logAIInteraction(String sessionId, String studentId, String query, String response) {
        try {
            log.info("AI interaction - Session: {}, Student: {}, Query: {}", 
                sessionId, studentId, query.substring(0, Math.min(50, query.length())));
            
            // Could store AI interactions in database for analytics
            
        } catch (Exception e) {
            log.warn("Failed to log AI interaction: {}", e.getMessage());
        }
    }
}