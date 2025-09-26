package com.netlab.networksimulator.command;

import com.netlab.networksimulator.service.LoggingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommandManager {
    
    private final LoggingService loggingService;
    
    // Session-based command histories
    private final Map<String, CommandHistory> sessionHistories = new ConcurrentHashMap<>();
    
    public void executeCommand(Command command) {
        log.debug("Executing command: {} for session: {}", command.getDescription(), command.getSessionId());
        
        try {
            command.execute();
            
            // Add to history
            CommandHistory history = getOrCreateHistory(command.getSessionId());
            history.addCommand(command);
            
            loggingService.logSessionEvent(command.getSessionId(), "COMMAND_EXECUTED", 
                "Executed: " + command.getDescription());
            
        } catch (Exception e) {
            log.error("Failed to execute command: {}", command.getDescription(), e);
            loggingService.logError(command.getSessionId(), "COMMAND_ERROR", 
                "Failed to execute: " + command.getDescription(), e);
            throw e;
        }
    }
    
    public boolean undo(String sessionId) {
        CommandHistory history = sessionHistories.get(sessionId);
        if (history == null || !history.canUndo()) {
            log.debug("No commands to undo for session: {}", sessionId);
            return false;
        }
        
        try {
            Command command = history.undo();
            log.debug("Undoing command: {} for session: {}", command.getDescription(), sessionId);
            
            loggingService.logSessionEvent(sessionId, "COMMAND_UNDONE", 
                "Undone: " + command.getDescription());
            
            return true;
        } catch (Exception e) {
            log.error("Failed to undo command for session: {}", sessionId, e);
            loggingService.logError(sessionId, "UNDO_ERROR", "Failed to undo command", e);
            return false;
        }
    }
    
    public boolean redo(String sessionId) {
        CommandHistory history = sessionHistories.get(sessionId);
        if (history == null || !history.canRedo()) {
            log.debug("No commands to redo for session: {}", sessionId);
            return false;
        }
        
        try {
            Command command = history.redo();
            log.debug("Redoing command: {} for session: {}", command.getDescription(), sessionId);
            
            loggingService.logSessionEvent(sessionId, "COMMAND_REDONE", 
                "Redone: " + command.getDescription());
            
            return true;
        } catch (Exception e) {
            log.error("Failed to redo command for session: {}", sessionId, e);
            loggingService.logError(sessionId, "REDO_ERROR", "Failed to redo command", e);
            return false;
        }
    }
    
    public List<String> getCommandHistory(String sessionId) {
        CommandHistory history = sessionHistories.get(sessionId);
        if (history == null) {
            return Collections.emptyList();
        }
        
        return history.getCommandDescriptions();
    }
    
    public boolean canUndo(String sessionId) {
        CommandHistory history = sessionHistories.get(sessionId);
        return history != null && history.canUndo();
    }
    
    public boolean canRedo(String sessionId) {
        CommandHistory history = sessionHistories.get(sessionId);
        return history != null && history.canRedo();
    }
    
    public void clearHistory(String sessionId) {
        log.debug("Clearing command history for session: {}", sessionId);
        sessionHistories.remove(sessionId);
        
        loggingService.logSessionEvent(sessionId, "HISTORY_CLEARED", "Command history cleared");
    }
    
    private CommandHistory getOrCreateHistory(String sessionId) {
        return sessionHistories.computeIfAbsent(sessionId, k -> new CommandHistory());
    }
    
    private static class CommandHistory {
        private final List<Command> commands = new ArrayList<>();
        private int currentIndex = -1;
        private static final int MAX_HISTORY_SIZE = 100;
        
        public void addCommand(Command command) {
            // Remove any commands after current index (for when we add after undo)
            if (currentIndex < commands.size() - 1) {
                commands.subList(currentIndex + 1, commands.size()).clear();
            }
            
            commands.add(command);
            currentIndex++;
            
            // Limit history size
            if (commands.size() > MAX_HISTORY_SIZE) {
                commands.remove(0);
                currentIndex--;
            }
        }
        
        public Command undo() {
            if (!canUndo()) {
                throw new IllegalStateException("No commands to undo");
            }
            
            Command command = commands.get(currentIndex);
            command.undo();
            currentIndex--;
            return command;
        }
        
        public Command redo() {
            if (!canRedo()) {
                throw new IllegalStateException("No commands to redo");
            }
            
            currentIndex++;
            Command command = commands.get(currentIndex);
            command.execute();
            return command;
        }
        
        public boolean canUndo() {
            return currentIndex >= 0;
        }
        
        public boolean canRedo() {
            return currentIndex < commands.size() - 1;
        }
        
        public List<String> getCommandDescriptions() {
            List<String> descriptions = new ArrayList<>();
            for (int i = 0; i <= currentIndex; i++) {
                descriptions.add(commands.get(i).getDescription());
            }
            return descriptions;
        }
    }
}