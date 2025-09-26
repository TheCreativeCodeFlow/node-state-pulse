package com.netlab.networksimulator.repository;

import com.netlab.networksimulator.domain.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeRepository extends JpaRepository<Node, String> {
    
    List<Node> findBySessionIdOrderByCreatedAtAsc(String sessionId);
    
    List<Node> findBySessionIdAndIsActiveOrderByCreatedAtAsc(String sessionId, Boolean isActive);
    
    Optional<Node> findByIdAndSessionId(String id, String sessionId);
    
    List<Node> findBySessionIdAndType(String sessionId, Node.NodeType type);
    
    @Query("SELECT n FROM Node n WHERE n.session.id = :sessionId AND n.name LIKE %:name%")
    List<Node> findBySessionIdAndNameContaining(@Param("sessionId") String sessionId, 
                                               @Param("name") String name);
    
    @Query("SELECT n FROM Node n WHERE n.session.id = :sessionId AND " +
           "n.positionX BETWEEN :minX AND :maxX AND " +
           "n.positionY BETWEEN :minY AND :maxY")
    List<Node> findNodesInArea(@Param("sessionId") String sessionId,
                              @Param("minX") Double minX, @Param("maxX") Double maxX,
                              @Param("minY") Double minY, @Param("maxY") Double maxY);
    
    @Query("SELECT COUNT(n) FROM Node n WHERE n.session.id = :sessionId AND n.isActive = true")
    Long countActiveNodesBySession(@Param("sessionId") String sessionId);
    
    @Query("SELECT n FROM Node n WHERE n.session.id = :sessionId AND n.ipAddress = :ipAddress")
    Optional<Node> findBySessionIdAndIpAddress(@Param("sessionId") String sessionId, 
                                              @Param("ipAddress") String ipAddress);
    
    void deleteByIdAndSessionId(String id, String sessionId);
}