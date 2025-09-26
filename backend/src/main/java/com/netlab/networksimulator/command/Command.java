package com.netlab.networksimulator.command;

import com.netlab.networksimulator.domain.Node;
import com.netlab.networksimulator.domain.Connection;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = CreateNodeCommand.class, name = "CREATE_NODE"),
    @JsonSubTypes.Type(value = UpdateNodeCommand.class, name = "UPDATE_NODE"),
    @JsonSubTypes.Type(value = DeleteNodeCommand.class, name = "DELETE_NODE"),
    @JsonSubTypes.Type(value = CreateConnectionCommand.class, name = "CREATE_CONNECTION"),
    @JsonSubTypes.Type(value = DeleteConnectionCommand.class, name = "DELETE_CONNECTION")
})
public interface Command {
    void execute();
    void undo();
    String getDescription();
    String getSessionId();
}

// Node Commands
class CreateNodeCommand implements Command {
    private final String sessionId;
    private final Node node;
    private final NodeCommandService nodeService;
    
    public CreateNodeCommand(String sessionId, Node node, NodeCommandService nodeService) {
        this.sessionId = sessionId;
        this.node = node;
        this.nodeService = nodeService;
    }
    
    @Override
    public void execute() {
        nodeService.createNode(node);
    }
    
    @Override
    public void undo() {
        nodeService.deleteNode(node.getId());
    }
    
    @Override
    public String getDescription() {
        return "Create node: " + node.getName();
    }
    
    @Override
    public String getSessionId() {
        return sessionId;
    }
}

class UpdateNodeCommand implements Command {
    private final String sessionId;
    private final Node newNode;
    private final Node originalNode;
    private final NodeCommandService nodeService;
    
    public UpdateNodeCommand(String sessionId, Node newNode, Node originalNode, NodeCommandService nodeService) {
        this.sessionId = sessionId;
        this.newNode = newNode;
        this.originalNode = originalNode;
        this.nodeService = nodeService;
    }
    
    @Override
    public void execute() {
        nodeService.updateNode(newNode);
    }
    
    @Override
    public void undo() {
        nodeService.updateNode(originalNode);
    }
    
    @Override
    public String getDescription() {
        return "Update node: " + newNode.getName();
    }
    
    @Override
    public String getSessionId() {
        return sessionId;
    }
}

class DeleteNodeCommand implements Command {
    private final String sessionId;
    private final Node node;
    private final NodeCommandService nodeService;
    
    public DeleteNodeCommand(String sessionId, Node node, NodeCommandService nodeService) {
        this.sessionId = sessionId;
        this.node = node;
        this.nodeService = nodeService;
    }
    
    @Override
    public void execute() {
        nodeService.deleteNode(node.getId());
    }
    
    @Override
    public void undo() {
        nodeService.createNode(node);
    }
    
    @Override
    public String getDescription() {
        return "Delete node: " + node.getName();
    }
    
    @Override
    public String getSessionId() {
        return sessionId;
    }
}

// Connection Commands
class CreateConnectionCommand implements Command {
    private final String sessionId;
    private final Connection connection;
    private final ConnectionCommandService connectionService;
    
    public CreateConnectionCommand(String sessionId, Connection connection, ConnectionCommandService connectionService) {
        this.sessionId = sessionId;
        this.connection = connection;
        this.connectionService = connectionService;
    }
    
    @Override
    public void execute() {
        connectionService.createConnection(connection);
    }
    
    @Override
    public void undo() {
        connectionService.deleteConnection(connection.getId());
    }
    
    @Override
    public String getDescription() {
        return "Create connection between " + connection.getSourceNode().getName() + 
               " and " + connection.getTargetNode().getName();
    }
    
    @Override
    public String getSessionId() {
        return sessionId;
    }
}

class DeleteConnectionCommand implements Command {
    private final String sessionId;
    private final Connection connection;
    private final ConnectionCommandService connectionService;
    
    public DeleteConnectionCommand(String sessionId, Connection connection, ConnectionCommandService connectionService) {
        this.sessionId = sessionId;
        this.connection = connection;
        this.connectionService = connectionService;
    }
    
    @Override
    public void execute() {
        connectionService.deleteConnection(connection.getId());
    }
    
    @Override
    public void undo() {
        connectionService.createConnection(connection);
    }
    
    @Override
    public String getDescription() {
        return "Delete connection between " + connection.getSourceNode().getName() + 
               " and " + connection.getTargetNode().getName();
    }
    
    @Override
    public String getSessionId() {
        return sessionId;
    }
}

// Service interfaces for command execution
interface NodeCommandService {
    void createNode(Node node);
    void updateNode(Node node);
    void deleteNode(String nodeId);
}

interface ConnectionCommandService {
    void createConnection(Connection connection);
    void deleteConnection(String connectionId);
}