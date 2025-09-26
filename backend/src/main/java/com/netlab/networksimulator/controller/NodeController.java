package com.netlab.networksimulator.controller;

import com.netlab.networksimulator.command.CommandManager;
import com.netlab.networksimulator.command.CreateNodeCommand;
import com.netlab.networksimulator.command.DeleteNodeCommand;
import com.netlab.networksimulator.command.UpdateNodeCommand;
import com.netlab.networksimulator.domain.Node;
import com.netlab.networksimulator.dto.NodeRequest;
import com.netlab.networksimulator.repository.NodeRepository;
import com.netlab.networksimulator.repository.SessionRepository;
import com.netlab.networksimulator.service.CommandServiceImpl;
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
@RequestMapping("/api/sessions/{sessionId}/nodes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Node Management", description = "APIs for managing network nodes")
@CrossOrigin(origins = "*")
public class NodeController {
    
    private final NodeRepository nodeRepository;
    private final SessionRepository sessionRepository;
    private final CommandManager commandManager;
    private final CommandServiceImpl commandService;
    
    @GetMapping
    @Operation(summary = "Get all nodes for a session")
    public ResponseEntity<List<Node>> getNodes(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        log.debug("GET nodes for session: {}", sessionId);
        List<Node> nodes = nodeRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        return ResponseEntity.ok(nodes);
    }
    
    @PostMapping
    @Operation(summary = "Create a new node")
    public ResponseEntity<Node> createNode(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @Valid @RequestBody NodeRequest request) {
        log.info("Creating node: {} for session: {}", request.getName(), sessionId);
        
        return sessionRepository.findById(sessionId)
            .map(session -> {
                Node node = new Node();
                node.setName(request.getName());
                node.setType(request.getType());
                node.setPositionX(request.getPositionX());
                node.setPositionY(request.getPositionY());
                node.setIpAddress(request.getIpAddress());
                node.setMacAddress(request.getMacAddress());
                node.setProcessingDelay(request.getProcessingDelay() != null ? request.getProcessingDelay() : 10);
                node.setBufferSize(request.getBufferSize() != null ? request.getBufferSize() : 100);
                node.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
                node.setMetadata(request.getMetadata());
                node.setSession(session);
                
                CreateNodeCommand command = new CreateNodeCommand(sessionId, node, commandService);
                commandManager.executeCommand(command);
                
                return ResponseEntity.status(HttpStatus.CREATED).body(node);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{nodeId}")
    @Operation(summary = "Get a specific node")
    public ResponseEntity<Node> getNode(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Node ID") @PathVariable String nodeId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        return nodeRepository.findByIdAndSessionId(nodeId, sessionId)
            .map(node -> ResponseEntity.ok(node))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{nodeId}")
    @Operation(summary = "Update a node")
    public ResponseEntity<Node> updateNode(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Node ID") @PathVariable String nodeId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @Valid @RequestBody NodeRequest request) {
        
        return nodeRepository.findByIdAndSessionId(nodeId, sessionId)
            .map(originalNode -> {
                // Create updated node
                Node updatedNode = new Node();
                updatedNode.setId(originalNode.getId());
                updatedNode.setName(request.getName());
                updatedNode.setType(request.getType());
                updatedNode.setPositionX(request.getPositionX());
                updatedNode.setPositionY(request.getPositionY());
                updatedNode.setIpAddress(request.getIpAddress());
                updatedNode.setMacAddress(request.getMacAddress());
                updatedNode.setProcessingDelay(request.getProcessingDelay() != null ? request.getProcessingDelay() : 10);
                updatedNode.setBufferSize(request.getBufferSize() != null ? request.getBufferSize() : 100);
                updatedNode.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
                updatedNode.setMetadata(request.getMetadata());
                updatedNode.setSession(originalNode.getSession());
                updatedNode.setCreatedAt(originalNode.getCreatedAt());
                
                UpdateNodeCommand command = new UpdateNodeCommand(sessionId, updatedNode, originalNode, commandService);
                commandManager.executeCommand(command);
                
                return ResponseEntity.ok(updatedNode);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{nodeId}")
    @Operation(summary = "Delete a node")
    public ResponseEntity<Void> deleteNode(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Node ID") @PathVariable String nodeId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        return nodeRepository.findByIdAndSessionId(nodeId, sessionId)
            .map(node -> {
                DeleteNodeCommand command = new DeleteNodeCommand(sessionId, node, commandService);
                commandManager.executeCommand(command);
                
                return ResponseEntity.<Void>noContent().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}