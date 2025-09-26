package com.netlab.networksimulator.service;

import com.netlab.networksimulator.domain.Session;
import com.netlab.networksimulator.dto.SessionRequest;
import com.netlab.networksimulator.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SessionService {
    
    private final SessionRepository sessionRepository;
    private final LoggingService loggingService;
    
    public List<Session> getSessionsByStudent(String studentId) {
        log.debug("Fetching sessions for student: {}", studentId);
        return sessionRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }
    
    public Optional<Session> getSession(String sessionId, String studentId) {
        log.debug("Fetching session {} for student {}", sessionId, studentId);
        return sessionRepository.findByIdAndStudentId(sessionId, studentId);
    }
    
    public Session createSession(String studentId, SessionRequest request) {
        log.info("Creating new session for student: {}", studentId);
        
        Session session = new Session();
        session.setStudentId(studentId);
        session.setSessionName(request.getSessionName());
        session.setDescription(request.getDescription());
        session.setStatus(Session.SessionStatus.ACTIVE);
        
        Session savedSession = sessionRepository.save(session);
        
        // Log session creation
        loggingService.logSessionEvent(savedSession.getId(), 
            "SESSION_STARTED", 
            "New simulation session created: " + request.getSessionName());
        
        log.info("Created session {} for student {}", savedSession.getId(), studentId);
        return savedSession;
    }
    
    public Optional<Session> updateSession(String sessionId, String studentId, SessionRequest request) {
        log.debug("Updating session {} for student {}", sessionId, studentId);
        
        return sessionRepository.findByIdAndStudentId(sessionId, studentId)
            .map(session -> {
                session.setSessionName(request.getSessionName());
                session.setDescription(request.getDescription());
                
                Session updated = sessionRepository.save(session);
                
                loggingService.logSessionEvent(sessionId, 
                    "SESSION_UPDATED", 
                    "Session updated: " + request.getSessionName());
                
                return updated;
            });
    }
    
    public boolean deleteSession(String sessionId, String studentId) {
        log.info("Deleting session {} for student {}", sessionId, studentId);
        
        Optional<Session> session = sessionRepository.findByIdAndStudentId(sessionId, studentId);
        if (session.isPresent()) {
            sessionRepository.deleteByStudentIdAndId(studentId, sessionId);
            
            loggingService.logSessionEvent(sessionId, 
                "SESSION_DELETED", 
                "Session deleted");
            
            return true;
        }
        return false;
    }
    
    public Optional<Session> updateSessionStatus(String sessionId, String studentId, Session.SessionStatus status) {
        log.debug("Updating session {} status to {} for student {}", sessionId, status, studentId);
        
        return sessionRepository.findByIdAndStudentId(sessionId, studentId)
            .map(session -> {
                Session.SessionStatus oldStatus = session.getStatus();
                session.setStatus(status);
                
                Session updated = sessionRepository.save(session);
                
                loggingService.logSessionEvent(sessionId, 
                    getStatusEventType(status), 
                    String.format("Session status changed from %s to %s", oldStatus, status));
                
                return updated;
            });
    }
    
    private String getStatusEventType(Session.SessionStatus status) {
        return switch (status) {
            case ACTIVE -> "SESSION_RESUMED";
            case PAUSED -> "SESSION_PAUSED";
            case COMPLETED -> "SESSION_COMPLETED";
            case ARCHIVED -> "SESSION_ARCHIVED";
        };
    }
    
    public Long getActiveSessionCount(String studentId) {
        return sessionRepository.countActiveSessionsByStudent(studentId);
    }
}