package com.netlab.networksimulator.controller;

import com.netlab.networksimulator.domain.Session;
import com.netlab.networksimulator.dto.SessionRequest;
import com.netlab.networksimulator.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Session Management", description = "APIs for managing simulation sessions")
@CrossOrigin(origins = "*")
public class SessionController {
    
    private final SessionService sessionService;
    
    @GetMapping
    @Operation(summary = "Get all sessions for a student")
    public ResponseEntity<List<Session>> getSessions(
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        log.debug("GET /api/sessions for student: {}", studentId);
        List<Session> sessions = sessionService.getSessionsByStudent(studentId);
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/{sessionId}")
    @Operation(summary = "Get a specific session")
    public ResponseEntity<Session> getSession(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        log.debug("GET /api/sessions/{} for student: {}", sessionId, studentId);
        
        return sessionService.getSession(sessionId, studentId)
                .map(session -> ResponseEntity.ok(session))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @Operation(summary = "Create a new session")
    public ResponseEntity<Session> createSession(
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @Valid @RequestBody SessionRequest request) {
        log.info("POST /api/sessions for student: {}", studentId);
        
        Session session = sessionService.createSession(studentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }
    
    @PutMapping("/{sessionId}")
    @Operation(summary = "Update an existing session")
    public ResponseEntity<Session> updateSession(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @Valid @RequestBody SessionRequest request) {
        log.debug("PUT /api/sessions/{} for student: {}", sessionId, studentId);
        
        return sessionService.updateSession(sessionId, studentId, request)
                .map(session -> ResponseEntity.ok(session))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Delete a session")
    public ResponseEntity<Void> deleteSession(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        log.info("DELETE /api/sessions/{} for student: {}", sessionId, studentId);
        
        boolean deleted = sessionService.deleteSession(sessionId, studentId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{sessionId}/status")
    @Operation(summary = "Update session status")
    public ResponseEntity<Session> updateSessionStatus(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @Parameter(description = "New status") @RequestParam Session.SessionStatus status) {
        log.debug("PATCH /api/sessions/{}/status to {} for student: {}", sessionId, status, studentId);
        
        return sessionService.updateSessionStatus(sessionId, studentId, status)
                .map(session -> ResponseEntity.ok(session))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/active/count")
    @Operation(summary = "Get count of active sessions for a student")
    public ResponseEntity<Long> getActiveSessionCount(
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        Long count = sessionService.getActiveSessionCount(studentId);
        return ResponseEntity.ok(count);
    }
}