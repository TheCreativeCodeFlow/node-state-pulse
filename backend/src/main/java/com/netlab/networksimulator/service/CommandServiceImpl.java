package com.netlab.networksimulator.service;

import com.netlab.networksimulator.command.ConnectionCommandService;
import com.netlab.networksimulator.command.NodeCommandService;
import com.netlab.networksimulator.domain.Connection;
import com.netlab.networksimulator.domain.Node;
import com.netlab.networksimulator.repository.ConnectionRepository;
import com.netlab.networksimulator.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CommandServiceImpl implements NodeCommandService, ConnectionCommandService {
    
    private final NodeRepository nodeRepository;
    private final ConnectionRepository connectionRepository;
    private final LoggingService loggingService;
    
    @Override
    public void createNode(Node node) {
        log.debug("Creating node: {}", node.getName());
        nodeRepository.save(node);
        loggingService.logNodeEvent(node.getSession().getId(), "NODE_CREATED", 
            "Node created: " + node.getName(), node.getId());
    }
    
    @Override
    public void updateNode(Node node) {
        log.debug("Updating node: {}", node.getId());
        nodeRepository.save(node);
        loggingService.logNodeEvent(node.getSession().getId(), "NODE_UPDATED", 
            "Node updated: " + node.getName(), node.getId());
    }
    
    @Override
    public void deleteNode(String nodeId) {
        log.debug("Deleting node: {}", nodeId);
        nodeRepository.findById(nodeId).ifPresent(node -> {
            nodeRepository.delete(node);
            loggingService.logNodeEvent(node.getSession().getId(), "NODE_DELETED", 
                "Node deleted: " + node.getName(), node.getId());
        });
    }
    
    @Override
    public void createConnection(Connection connection) {
        log.debug("Creating connection between {} and {}", 
            connection.getSourceNode().getId(), connection.getTargetNode().getId());
        connectionRepository.save(connection);
        loggingService.logConnectionEvent(connection.getSession().getId(), "CONNECTION_CREATED", 
            "Connection created between " + connection.getSourceNode().getName() + 
            " and " + connection.getTargetNode().getName(), connection.getId());
    }
    
    @Override
    public void deleteConnection(String connectionId) {
        log.debug("Deleting connection: {}", connectionId);
        connectionRepository.findById(connectionId).ifPresent(connection -> {
            connectionRepository.delete(connection);
            loggingService.logConnectionEvent(connection.getSession().getId(), "CONNECTION_DELETED", 
                "Connection deleted between " + connection.getSourceNode().getName() + 
                " and " + connection.getTargetNode().getName(), connection.getId());
        });
    }
}