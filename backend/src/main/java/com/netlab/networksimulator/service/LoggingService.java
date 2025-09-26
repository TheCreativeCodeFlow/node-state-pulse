package com.netlab.networksimulator.service;

import com.netlab.networksimulator.domain.SessionLog;
import com.netlab.networksimulator.repository.SessionLogRepository;
import com.netlab.networksimulator.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LoggingService {
    
    private final SessionLogRepository sessionLogRepository;
    private final SessionRepository sessionRepository;
    
    public void logSessionEvent(String sessionId, String eventType, String message) {
        logEvent(sessionId, eventType, message, null, null, null, null, null, SessionLog.LogLevel.INFO);
    }
    
    public void logNodeEvent(String sessionId, String eventType, String message, String nodeId) {
        logEvent(sessionId, eventType, message, nodeId, null, null, null, null, SessionLog.LogLevel.INFO);
    }
    
    public void logConnectionEvent(String sessionId, String eventType, String message, String connectionId) {
        logEvent(sessionId, eventType, message, null, connectionId, null, null, null, SessionLog.LogLevel.INFO);
    }
    
    public void logPacketEvent(String sessionId, String eventType, String message, 
                              String messageId, String packetId, String nodeId) {
        logEvent(sessionId, eventType, message, nodeId, null, messageId, packetId, null, SessionLog.LogLevel.INFO);
    }
    
    public void logAnomalyEvent(String sessionId, String eventType, String message, 
                               String anomalyId, String messageId, String packetId) {
        logEvent(sessionId, eventType, message, null, null, messageId, packetId, anomalyId, SessionLog.LogLevel.WARN);
    }
    
    public void logError(String sessionId, String eventType, String message, Exception exception) {
        String errorMessage = message + (exception != null ? ": " + exception.getMessage() : "");
        logEvent(sessionId, eventType, errorMessage, null, null, null, null, null, SessionLog.LogLevel.ERROR);
    }
    
    private void logEvent(String sessionId, String eventType, String message, 
                         String nodeId, String connectionId, String messageId, 
                         String packetId, String anomalyId, SessionLog.LogLevel logLevel) {
        try {
            SessionLog sessionLog = new SessionLog();
            sessionLog.setEventType(SessionLog.EventType.valueOf(eventType));
            sessionLog.setMessage(message);
            sessionLog.setNodeId(nodeId);
            sessionLog.setConnectionId(connectionId);
            sessionLog.setMessageId(messageId);
            sessionLog.setPacketId(packetId);
            sessionLog.setAnomalyId(anomalyId);
            sessionLog.setLogLevel(logLevel);
            sessionLog.setTimestamp(LocalDateTime.now());
            
            // Set session reference
            sessionRepository.findById(sessionId).ifPresent(sessionLog::setSession);
            
            sessionLogRepository.save(sessionLog);
            
            log.debug("Logged event: {} for session: {}", eventType, sessionId);
        } catch (Exception e) {
            log.error("Failed to log event {} for session {}: {}", eventType, sessionId, e.getMessage());
        }
    }
}