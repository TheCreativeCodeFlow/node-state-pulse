import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// FSA States and Events
const STATES = ["OK", "WARN", "ERROR"] as const;
const EVENTS = ["ping_ok", "latency_high", "packet_loss_high", "ping_timeout", "suspicious_traffic"] as const;

type State = typeof STATES[number];
type Event = typeof EVENTS[number];

// FSA Transition Rules
const FSA_RULES: Record<State, Partial<Record<Event, State>>> = {
  OK: { 
    latency_high: "WARN", 
    packet_loss_high: "WARN", 
    suspicious_traffic: "ERROR", 
    ping_ok: "OK" 
  },
  WARN: { 
    ping_ok: "OK", 
    latency_high: "WARN", 
    packet_loss_high: "WARN", 
    suspicious_traffic: "ERROR", 
    ping_timeout: "ERROR" 
  },
  ERROR: { 
    ping_ok: "WARN", 
    latency_high: "ERROR", 
    packet_loss_high: "ERROR", 
    suspicious_traffic: "ERROR", 
    ping_timeout: "ERROR" 
  }
};

// Event probability distributions
const EVENT_DISTRIBUTIONS: Record<State, Record<Event, number>> = {
  OK: {
    ping_ok: 0.83,
    latency_high: 0.1,
    packet_loss_high: 0.05,
    ping_timeout: 0,
    suspicious_traffic: 0.02,
  },
  WARN: {
    ping_ok: 0.7,
    latency_high: 0.15,
    packet_loss_high: 0.1,
    ping_timeout: 0.04,
    suspicious_traffic: 0.01,
  },
  ERROR: {
    ping_ok: 0.2,
    latency_high: 0.1,
    packet_loss_high: 0.2,
    ping_timeout: 0.4,
    suspicious_traffic: 0.1,
  },
};

interface FSANode {
  id: string;
  state: State;
  lastEvent: Event | null;
  anomalies: string[];
  health: number;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  nodeId: string;
  message: string;
  hasAnomaly: boolean;
}

interface ChartPoint {
  timestamp: Date;
  count: number;
}

interface AutomaticModeProps {
  onLogClick?: (logMessage: string) => void;
}

export const AutomaticMode: React.FC<AutomaticModeProps> = ({ onLogClick }) => {
  const [nodes, setNodes] = useState<FSANode[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1000);
  const [numNodes, setNumNodes] = useState(10);
  
  // Statistics
  const [globalAnomalies, setGlobalAnomalies] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [anomalyTrend, setAnomalyTrend] = useState<ChartPoint[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize nodes when numNodes changes
  useEffect(() => {
    resetNodes(numNodes);
  }, [numNodes]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const resetNodes = (count: number) => {
    const newNodes: FSANode[] = Array.from({ length: count }, (_, i) => ({
      id: `node-${i + 1}`,
      state: "OK",
      lastEvent: null,
      anomalies: [],
      health: 100
    }));
    
    setNodes(newNodes);
    setLogs([]);
    setGlobalAnomalies(0);
    setTotalEvents(0);
    setAnomalyTrend([]);
  };

  const randomEvent = (state: State): Event => {
    const probs = EVENT_DISTRIBUTIONS[state];
    const r = Math.random();
    let acc = 0;

    for (const [event, p] of Object.entries(probs)) {
      acc += p;
      if (r <= acc) return event as Event;
    }

    // fallback
    return "ping_ok";
  };

  const detectAnomalies = (node: FSANode, newState: State, event: Event): string[] => {
    const anomalies: string[] = [];

    if (!FSA_RULES[node.state][event]) {
      anomalies.push("Forbidden transition");
    }
    if (event === "ping_timeout") {
      anomalies.push("Excessive timeouts");
    }
    if (event === "packet_loss_high") {
      anomalies.push("Packet loss storm");
    }
    if (event === "suspicious_traffic") {
      anomalies.push("DDoS suspicion");
    }
    if (node.state === "ERROR" && newState === "ERROR") {
      anomalies.push("Isolation risk");
    }

    return anomalies;
  };

  const simulateStep = () => {
    let anomaliesThisTick = 0;

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const event = randomEvent(node.state);
        const newState = FSA_RULES[node.state][event] || node.state;
        const anomalies = detectAnomalies(node, newState, event);
        const newHealth = Math.max(0, node.health - (anomalies.length > 0 ? 2 : 0));

        if (anomalies.length > 0) {
          anomaliesThisTick += anomalies.length;
        }

        // Add log entry
        const logEntry: LogEntry = {
          id: `${Date.now()}-${node.id}-${Math.random()}`,
          timestamp: new Date(),
          nodeId: node.id,
          message: `${event} (${node.state} → ${newState})${anomalies.length ? " ⚠️" : ""}`,
          hasAnomaly: anomalies.length > 0
        };

        setLogs((prev) => [logEntry, ...prev].slice(0, 100));

        return { 
          ...node, 
          state: newState, 
          lastEvent: event, 
          anomalies, 
          health: newHealth 
        };
      })
    );

    setGlobalAnomalies((prev) => prev + anomaliesThisTick);
    setTotalEvents((prev) => prev + 1);
    
    // Update chart
    setAnomalyTrend((prev) => [
      ...prev,
      { timestamp: new Date(), count: anomaliesThisTick }
    ].slice(-30));
  };

  const startSimulation = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(simulateStep, intervalMs);
  };

  const stopSimulation = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const getStateColor = (state: State) => {
    switch (state) {
      case "OK": return "neon-green";
      case "WARN": return "neon-orange";
      case "ERROR": return "status-error";
      default: return "neon-blue";
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header Controls */}
      <div className="p-6 border-b border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-neon-green">FSA Anomaly Lab</h2>
          </div>
        
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={running ? stopSimulation : startSimulation}
              className={cn(
                "glass neon-glow flex items-center gap-2 text-white",
                running ? "neon-glow-error" : "neon-glow-green"
              )}
              size="sm"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? "Stop" : "Start"}
            </Button>
            
            <Button
              onClick={() => resetNodes(numNodes)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Nodes:</Label>
              <Input
                type="number"
                value={numNodes}
                onChange={(e) => setNumNodes(parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                className="w-20"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Speed:</Label>
              <select 
                className="glass-card rounded px-2 py-1 text-sm bg-background border border-border"
                onChange={(e) => setIntervalMs(1000 / parseInt(e.target.value))}
                value={1000 / intervalMs}
              >
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
                <option value="8">8x</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="p-6 border-b border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card p-3 text-center">
            <h3 className="text-lg font-semibold text-neon-blue mb-1">Nodes</h3>
            <p className="text-2xl font-bold text-foreground">{nodes.length}</p>
          </Card>
          <Card className="glass-card p-3 text-center">
            <h3 className="text-lg font-semibold text-status-warning mb-1">Global Anomalies</h3>
            <p className="text-2xl font-bold text-foreground">{globalAnomalies}</p>
          </Card>
          <Card className="glass-card p-3 text-center">
            <h3 className="text-lg font-semibold text-neon-cyan mb-1">Total Events</h3>
            <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
          </Card>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 min-h-0">
        <div className="max-w-7xl mx-auto w-full flex gap-6">
          {/* Nodes Table */}
          <Card className="glass-card flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-lg font-semibold text-foreground">Node Status</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b border-border/50">
                <tr>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">State</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Last Event</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Anomalies</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Health</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id} className="border-b border-border/30 hover:bg-background/50">
                    <td className="p-2 text-sm font-mono">{node.id}</td>
                    <td className="p-2">
                      <span 
                        className={cn(
                          "px-2 py-1 rounded text-xs font-semibold",
                          `bg-${getStateColor(node.state)}/20 text-${getStateColor(node.state)}`
                        )}
                        style={{
                          backgroundColor: `hsl(var(--${getStateColor(node.state)}) / 0.2)`,
                          color: `hsl(var(--${getStateColor(node.state)}))`
                        }}
                      >
                        {node.state}
                      </span>
                    </td>
                    <td className="p-2 text-sm font-mono">{node.lastEvent || "-"}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {node.anomalies.map((anomaly, i) => (
                          <span 
                            key={i} 
                            className="px-1.5 py-0.5 rounded text-xs font-medium bg-status-error/20 text-status-error"
                          >
                            {anomaly}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-background/20 rounded-full h-1.5">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-500",
                              node.health > 70 ? "bg-neon-green" : 
                              node.health > 30 ? "bg-status-warning" : "bg-status-error"
                            )}
                            style={{ width: `${node.health}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {Math.round(node.health)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

          {/* Event Log */}
          <Card className="glass-card w-80 flex flex-col min-h-0">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-lg font-semibold text-foreground">Event Stream</h3>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="space-y-1">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "p-2 rounded text-xs font-mono transition-all duration-200",
                      log.hasAnomaly 
                        ? "bg-status-error/10 border border-status-error/20" 
                        : "bg-background/50",
                      onLogClick && "cursor-pointer hover:bg-primary/10 hover:border-neon-cyan/30"
                    )}
                    onClick={() => onLogClick?.(log.message)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-neon-cyan font-semibold">{log.nodeId}</span>
                      <span className="text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={cn(
                      "text-foreground",
                      log.hasAnomaly && "text-status-error"
                    )}>
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};