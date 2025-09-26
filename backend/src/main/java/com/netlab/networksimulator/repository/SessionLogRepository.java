package com.netlab.networksimulator.repository;

import com.netlab.networksimulator.domain.SessionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionLogRepository extends JpaRepository<SessionLog, String> {
    
    Page<SessionLog> findBySessionIdOrderByTimestampDesc(String sessionId, Pageable pageable);
    
    List<SessionLog> findBySessionIdOrderByTimestampDesc(String sessionId);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND sl.eventType = :eventType ORDER BY sl.timestamp DESC")
    List<SessionLog> findBySessionIdAndEventType(@Param("sessionId") String sessionId, 
                                                @Param("eventType") SessionLog.EventType eventType);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND sl.logLevel = :logLevel ORDER BY sl.timestamp DESC")
    List<SessionLog> findBySessionIdAndLogLevel(@Param("sessionId") String sessionId, 
                                               @Param("logLevel") SessionLog.LogLevel logLevel);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND " +
           "sl.timestamp BETWEEN :startTime AND :endTime ORDER BY sl.timestamp DESC")
    List<SessionLog> findLogsByTimeRange(@Param("sessionId") String sessionId,
                                        @Param("startTime") LocalDateTime startTime,
                                        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND sl.nodeId = :nodeId ORDER BY sl.timestamp DESC")
    List<SessionLog> findBySessionIdAndNodeId(@Param("sessionId") String sessionId, 
                                             @Param("nodeId") String nodeId);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND sl.packetId = :packetId ORDER BY sl.timestamp ASC")
    List<SessionLog> findPacketJourney(@Param("sessionId") String sessionId, 
                                      @Param("packetId") String packetId);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND sl.messageId = :messageId ORDER BY sl.timestamp ASC")
    List<SessionLog> findMessageLogs(@Param("sessionId") String sessionId, 
                                    @Param("messageId") String messageId);
    
    @Query("SELECT COUNT(sl) FROM SessionLog sl WHERE sl.session.id = :sessionId AND sl.logLevel = :logLevel")
    Long countLogsByLevel(@Param("sessionId") String sessionId, 
                         @Param("logLevel") SessionLog.LogLevel logLevel);
    
    @Query("SELECT sl.eventType, COUNT(sl) FROM SessionLog sl WHERE sl.session.id = :sessionId GROUP BY sl.eventType")
    List<Object[]> getEventStatsBySession(@Param("sessionId") String sessionId);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND " +
           "sl.logLevel IN ('ERROR', 'FATAL') ORDER BY sl.timestamp DESC")
    List<SessionLog> findErrorLogs(@Param("sessionId") String sessionId);
    
    @Query("SELECT sl FROM SessionLog sl WHERE sl.session.id = :sessionId AND " +
           "sl.message LIKE %:keyword% ORDER BY sl.timestamp DESC")
    List<SessionLog> searchLogsByKeyword(@Param("sessionId") String sessionId, 
                                        @Param("keyword") String keyword);
}