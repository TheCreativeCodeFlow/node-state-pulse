package com.netlab.networksimulator.repository;

import com.netlab.networksimulator.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    
    List<Message> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    
    List<Message> findBySessionIdAndStatusOrderByCreatedAtDesc(String sessionId, Message.MessageStatus status);
    
    Optional<Message> findByIdAndSessionId(String id, String sessionId);
    
    Optional<Message> findByPacketIdAndSessionId(String packetId, String sessionId);
    
    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId AND " +
           "(m.sourceNode.id = :nodeId OR m.targetNode.id = :nodeId)")
    List<Message> findMessagesByNode(@Param("sessionId") String sessionId, 
                                    @Param("nodeId") String nodeId);
    
    List<Message> findBySessionIdAndSourceNodeIdOrderByCreatedAtDesc(String sessionId, String sourceNodeId);
    
    List<Message> findBySessionIdAndTargetNodeIdOrderByCreatedAtDesc(String sessionId, String targetNodeId);
    
    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId AND m.messageType = :messageType")
    List<Message> findBySessionIdAndMessageType(@Param("sessionId") String sessionId, 
                                               @Param("messageType") Message.MessageType messageType);
    
    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId AND " +
           "m.createdAt BETWEEN :startTime AND :endTime ORDER BY m.createdAt DESC")
    List<Message> findMessagesInTimeRange(@Param("sessionId") String sessionId,
                                         @Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId AND m.status = 'IN_TRANSIT'")
    List<Message> findActiveMessages(@Param("sessionId") String sessionId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.session.id = :sessionId AND m.status = :status")
    Long countMessagesByStatus(@Param("sessionId") String sessionId, 
                              @Param("status") Message.MessageStatus status);
    
    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId AND m.priority >= :minPriority ORDER BY m.priority DESC")
    List<Message> findHighPriorityMessages(@Param("sessionId") String sessionId, 
                                          @Param("minPriority") Integer minPriority);
    
    @Query("SELECT m FROM Message m WHERE m.session.id = :sessionId AND " +
           "m.estimatedDeliveryTime < :currentTime AND m.status = 'IN_TRANSIT'")
    List<Message> findOverdueMessages(@Param("sessionId") String sessionId, 
                                     @Param("currentTime") LocalDateTime currentTime);
}