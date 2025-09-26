package com.netlab.networksimulator.repository;

import com.netlab.networksimulator.domain.Anomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnomalyRepository extends JpaRepository<Anomaly, String> {
    
    List<Anomaly> findByMessageIdOrderByCreatedAtDesc(String messageId);
    
    @Query("SELECT a FROM Anomaly a WHERE a.message.session.id = :sessionId ORDER BY a.createdAt DESC")
    List<Anomaly> findBySessionIdOrderByCreatedAtDesc(@Param("sessionId") String sessionId);
    
    List<Anomaly> findByTypeOrderByCreatedAtDesc(Anomaly.AnomalyType type);
    
    @Query("SELECT a FROM Anomaly a WHERE a.message.session.id = :sessionId AND a.type = :type")
    List<Anomaly> findBySessionIdAndType(@Param("sessionId") String sessionId, 
                                        @Param("type") Anomaly.AnomalyType type);
    
    @Query("SELECT a FROM Anomaly a WHERE a.message.session.id = :sessionId AND a.isApplied = :isApplied")
    List<Anomaly> findBySessionIdAndIsApplied(@Param("sessionId") String sessionId, 
                                             @Param("isApplied") Boolean isApplied);
    
    @Query("SELECT a FROM Anomaly a WHERE a.message.session.id = :sessionId AND a.severity >= :minSeverity")
    List<Anomaly> findHighSeverityAnomalies(@Param("sessionId") String sessionId, 
                                           @Param("minSeverity") Integer minSeverity);
    
    @Query("SELECT a FROM Anomaly a WHERE a.message.session.id = :sessionId AND " +
           "a.createdAt BETWEEN :startTime AND :endTime ORDER BY a.createdAt DESC")
    List<Anomaly> findAnomaliesInTimeRange(@Param("sessionId") String sessionId,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT COUNT(a) FROM Anomaly a WHERE a.message.session.id = :sessionId AND a.type = :type")
    Long countAnomaliesByType(@Param("sessionId") String sessionId, 
                             @Param("type") Anomaly.AnomalyType type);
    
    @Query("SELECT a.type, COUNT(a) FROM Anomaly a WHERE a.message.session.id = :sessionId GROUP BY a.type")
    List<Object[]> getAnomalyStatsBySession(@Param("sessionId") String sessionId);
    
    @Query("SELECT a FROM Anomaly a WHERE a.probability >= :minProbability AND a.isApplied = false")
    List<Anomaly> findPendingHighProbabilityAnomalies(@Param("minProbability") Double minProbability);
}