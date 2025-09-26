package com.netlab.networksimulator.controller;

import com.netlab.networksimulator.simulation.SimulationConfig;
import com.netlab.networksimulator.simulation.SimulationEngine;
import com.netlab.networksimulator.simulation.SimulationResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Simulation Engine", description = "APIs for controlling network simulation")
@CrossOrigin(origins = "*")
public class SimulationController {
    
    private final SimulationEngine simulationEngine;
    
    @PostMapping("/{sessionId}/start")
    @Operation(summary = "Start simulation for a session")
    public ResponseEntity<String> startSimulation(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId,
            @RequestBody(required = false) SimulationConfig config) {
        
        log.info("Starting simulation for session: {} by student: {}", sessionId, studentId);
        
        try {
            if (simulationEngine.isSimulationActive(sessionId)) {
                return ResponseEntity.badRequest().body("Simulation already active for session: " + sessionId);
            }
            
            SimulationConfig simConfig = config != null ? config : SimulationConfig.getDefault();
            
            CompletableFuture<SimulationResult> future = simulationEngine.startSimulation(sessionId, simConfig);
            
            return ResponseEntity.ok("Simulation started for session: " + sessionId);
            
        } catch (Exception e) {
            log.error("Failed to start simulation for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().body("Failed to start simulation: " + e.getMessage());
        }
    }
    
    @PostMapping("/{sessionId}/stop")
    @Operation(summary = "Stop simulation for a session")
    public ResponseEntity<String> stopSimulation(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        log.info("Stopping simulation for session: {} by student: {}", sessionId, studentId);
        
        boolean stopped = simulationEngine.stopSimulation(sessionId);
        
        if (stopped) {
            return ResponseEntity.ok("Simulation stopped for session: " + sessionId);
        } else {
            return ResponseEntity.badRequest().body("No active simulation found for session: " + sessionId);
        }
    }
    
    @GetMapping("/{sessionId}/status")
    @Operation(summary = "Get simulation status for a session")
    public ResponseEntity<Object> getSimulationStatus(
            @Parameter(description = "Session ID") @PathVariable String sessionId,
            @Parameter(description = "Student ID") @RequestHeader("X-Student-Id") String studentId) {
        
        boolean isActive = simulationEngine.isSimulationActive(sessionId);
        
        if (isActive) {
            return simulationEngine.getSimulationContext(sessionId)
                .map(context -> ResponseEntity.ok((Object) context))
                .orElse(ResponseEntity.notFound().build());
        } else {
            return ResponseEntity.ok("Simulation not active for session: " + sessionId);
        }
    }
    
    @GetMapping("/config/presets")
    @Operation(summary = "Get simulation configuration presets")
    public ResponseEntity<Object> getConfigPresets() {
        return ResponseEntity.ok(new Object() {
            public final SimulationConfig defaultConfig = SimulationConfig.getDefault();
            public final SimulationConfig highAnomalyConfig = SimulationConfig.getHighAnomalyConfig();
            public final SimulationConfig reliableConfig = SimulationConfig.getReliableConfig();
        });
    }
}