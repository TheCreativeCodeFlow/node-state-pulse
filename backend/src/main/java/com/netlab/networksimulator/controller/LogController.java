package com.netlab.networksimulator.controller;

import com.netlab.networksimulator.domain.SessionLog;
import com.netlab.networksimulator.repository.SessionLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Log Management", description = "APIs for retrieving simulation logs")
@CrossOrigin(origins = "*")
public class LogController {
    
    private final SessionLogRepository sessionLogRepository;
    
    @GetMapping("/{sessionId}")
    @Operation(summary = "Get logs for a session")
    public ResponseEntity<Page<SessionLog>> getSessionLogs(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        log.debug("Getting logs for session: {} page: {} size: {}", sessionId, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<SessionLog> logs = sessionLogRepository.findBySessionIdOrderByTimestampDesc(sessionId, pageable);
        
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/{sessionId}/events/{eventType}")
    @Operation(summary = "Get logs by event type for a session")
    public ResponseEntity<List<SessionLog>> getLogsByEventType(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Event type") @PathVariable SessionLog.EventType eventType,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        List<SessionLog> logs = sessionLogRepository.findBySessionIdAndEventType(sessionId, eventType);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/{sessionId}/packet/{packetId}")
    @Operation(summary = "Get packet journey logs")
    public ResponseEntity<List<SessionLog>> getPacketJourney(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Packet ID") @PathVariable String packetId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        List<SessionLog> logs = sessionLogRepository.findPacketJourney(sessionId, packetId);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/{sessionId}/errors")
    @Operation(summary = "Get error logs for a session")
    public ResponseEntity<List<SessionLog>> getErrorLogs(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        List<SessionLog> logs = sessionLogRepository.findErrorLogs(sessionId);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/{sessionId}/search")
    @Operation(summary = "Search logs by keyword")
    public ResponseEntity<List<SessionLog>> searchLogs(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Search keyword") @RequestParam String keyword,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        List<SessionLog> logs = sessionLogRepository.searchLogsByKeyword(sessionId, keyword);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/{sessionId}/timerange")
    @Operation(summary = "Get logs within time range")
    public ResponseEntity<List<SessionLog>> getLogsInTimeRange(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Start time") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "End time") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        List<SessionLog> logs = sessionLogRepository.findLogsByTimeRange(sessionId, startTime, endTime);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/{sessionId}/stats")
    @Operation(summary = "Get log statistics for a session")
    public ResponseEntity<Object> getLogStats(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        List<Object[]> eventStats = sessionLogRepository.getEventStatsBySession(sessionId);
        Long errorCount = sessionLogRepository.countLogsByLevel(sessionId, SessionLog.LogLevel.ERROR);
        Long warnCount = sessionLogRepository.countLogsByLevel(sessionId, SessionLog.LogLevel.WARN);
        Long infoCount = sessionLogRepository.countLogsByLevel(sessionId, SessionLog.LogLevel.INFO);
        
        return ResponseEntity.ok(new Object() {
            public final List<Object[]> eventStatistics = eventStats;
            public final Long errorLogs = errorCount;
            public final Long warningLogs = warnCount;
            public final Long infoLogs = infoCount;
        });
    }
}