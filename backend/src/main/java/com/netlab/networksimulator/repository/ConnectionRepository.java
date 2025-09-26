package com.netlab.networksimulator.repository;

import com.netlab.networksimulator.domain.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, String> {
    
    List<Connection> findBySessionIdOrderByCreatedAtAsc(String sessionId);
    
    List<Connection> findBySessionIdAndIsActiveOrderByCreatedAtAsc(String sessionId, Boolean isActive);
    
    Optional<Connection> findByIdAndSessionId(String id, String sessionId);
    
    @Query("SELECT c FROM Connection c WHERE c.session.id = :sessionId AND " +
           "(c.sourceNode.id = :nodeId OR c.targetNode.id = :nodeId)")
    List<Connection> findConnectionsByNode(@Param("sessionId") String sessionId, 
                                          @Param("nodeId") String nodeId);
    
    @Query("SELECT c FROM Connection c WHERE c.session.id = :sessionId AND " +
           "c.sourceNode.id = :sourceNodeId AND c.targetNode.id = :targetNodeId")
    Optional<Connection> findBySessionIdAndNodes(@Param("sessionId") String sessionId,
                                               @Param("sourceNodeId") String sourceNodeId,
                                               @Param("targetNodeId") String targetNodeId);
    
    @Query("SELECT c FROM Connection c WHERE c.session.id = :sessionId AND " +
           "((c.sourceNode.id = :nodeId1 AND c.targetNode.id = :nodeId2) OR " +
           "(c.sourceNode.id = :nodeId2 AND c.targetNode.id = :nodeId1 AND c.isBidirectional = true))")
    List<Connection> findConnectionsBetweenNodes(@Param("sessionId") String sessionId,
                                               @Param("nodeId1") String nodeId1,
                                               @Param("nodeId2") String nodeId2);
    
    List<Connection> findBySessionIdAndType(String sessionId, Connection.ConnectionType type);
    
    @Query("SELECT c FROM Connection c WHERE c.session.id = :sessionId AND c.bandwidth >= :minBandwidth")
    List<Connection> findHighBandwidthConnections(@Param("sessionId") String sessionId, 
                                                 @Param("minBandwidth") Integer minBandwidth);
    
    @Query("SELECT COUNT(c) FROM Connection c WHERE c.session.id = :sessionId AND c.isActive = true")
    Long countActiveConnectionsBySession(@Param("sessionId") String sessionId);
    
    @Query("SELECT c FROM Connection c WHERE c.session.id = :sessionId AND c.packetLossRate > :threshold")
    List<Connection> findUnreliableConnections(@Param("sessionId") String sessionId, 
                                             @Param("threshold") Double threshold);
    
    void deleteByIdAndSessionId(String id, String sessionId);
}