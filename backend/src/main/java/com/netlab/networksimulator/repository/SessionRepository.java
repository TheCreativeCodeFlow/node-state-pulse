package com.netlab.networksimulator.repository;

import com.netlab.networksimulator.domain.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
    
    List<Session> findByStudentIdOrderByCreatedAtDesc(String studentId);
    
    List<Session> findByStudentIdAndStatusOrderByCreatedAtDesc(String studentId, Session.SessionStatus status);
    
    Optional<Session> findByIdAndStudentId(String id, String studentId);
    
    @Query("SELECT s FROM Session s WHERE s.studentId = :studentId AND s.status = :status AND s.updatedAt > :since")
    List<Session> findActiveSessionsSince(@Param("studentId") String studentId, 
                                         @Param("status") Session.SessionStatus status,
                                         @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(s) FROM Session s WHERE s.studentId = :studentId AND s.status = 'ACTIVE'")
    Long countActiveSessionsByStudent(@Param("studentId") String studentId);
    
    @Query("SELECT s FROM Session s WHERE s.createdAt BETWEEN :startDate AND :endDate ORDER BY s.createdAt DESC")
    List<Session> findSessionsInDateRange(@Param("startDate") LocalDateTime startDate, 
                                         @Param("endDate") LocalDateTime endDate);
    
    void deleteByStudentIdAndId(String studentId, String id);
}