import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { NetworkCanvas, Node, Edge, Packet } from './NetworkCanvas';
import { ControlPanel } from './ControlPanel';
import { LogPanel, LogEntry } from './LogPanel';
import { ModeSelector, SimulationMode } from './ModeSelector';
import { AIHelpPanel } from './AIHelpPanel';
import { AIChatbot } from './AIChatbot';
import { 
  ArrowLeft, 
  RotateCcw, 
  RotateCw, 
  Settings,
  PanelLeftOpen,
  PanelRightOpen,
  MessageCircle,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import { webSocketService } from '@/services/webSocketService';

interface SimulatorLayoutProps {
  onBackToDashboard: () => void;
}

export const SimulatorLayout: React.FC<SimulatorLayoutProps> = ({ 
  onBackToDashboard 
}) => {
  // Network state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // UI state
  const [mode, setMode] = useState<SimulationMode>('select');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [aiHelpExpanded, setAiHelpExpanded] = useState(false);
  const [aiChatbotOpen, setAiChatbotOpen] = useState(false);
  
  // Session and user state
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [studentId] = useState(() => `student-${Math.random().toString(36).substr(2, 9)}`);

  // Control panel state
  const [packetLoss, setPacketLoss] = useState(10);
  const [corruption, setCorruption] = useState(5);
  const [latency, setLatency] = useState(100);

  // History for undo/redo
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize session and WebSocket connection
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Create a new session
        const session = await apiService.createSession(studentId, {
          sessionName: `Network Lab - ${new Date().toLocaleString()}`,
          description: 'Interactive network simulation session'
        });
        
        addLog('packet_sent', `Session created: ${session.sessionName}`);
        
        // Connect to WebSocket
        await webSocketService.connect();
        
        // Subscribe to session events
        webSocketService.onPacketEvent(sessionId, (event) => {
          // Map event types to LogEntry types
          let logType: LogEntry['type'] = 'packet_sent';
          if (event.eventType === 'packet_sent') logType = 'packet_sent';
          else if (event.eventType === 'delivered') logType = 'packet_delivered';
          else if (event.eventType === 'packet_lost') logType = 'packet_lost';
          else if (event.eventType === 'packet_corrupted') logType = 'packet_corrupted';
          
          addLog(logType, event.description);
          
          // Update packets based on event
          if (event.eventType === 'packet_sent') {
            setPackets(prev => [...prev, {
              id: event.packetId,
              sourceId: event.sourceNodeId,
              targetId: event.targetNodeId,
              progress: 0,
              status: 'traveling'
            }]);
          } else if (event.eventType === 'delivered') {
            setPackets(prev => prev.map(p => 
              p.id === event.packetId ? { ...p, progress: 1, status: 'delivered' } : p
            ));
          } else if (event.eventType === 'packet_lost') {
            setPackets(prev => prev.map(p => 
              p.id === event.packetId ? { ...p, status: 'lost' } : p
            ));
          }
        });
        
        addLog('packet_sent', 'WebSocket connected - Ready for real-time updates');
        
      } catch (error) {
        console.error('Failed to initialize session:', error);
        addLog('node_failed', 'Failed to initialize session - using offline mode');
      }
    };
    
    initializeSession();
    saveToHistory();
    
    // Cleanup
    return () => {
      webSocketService.unsubscribeFromSession(sessionId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'v':
            setMode('select');
            break;
          case 'a':
            setMode('add');
            break;
          case 'c':
            setMode('connect');
            break;
          case 'd':
            setMode('delete');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history.length]);

  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes, edges });
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
      toast.success('Undone');
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
      toast.success('Redone');
    }
  }, [history, historyIndex]);

  const addLog = useCallback((
    type: LogEntry['type'], 
    message: string, 
    nodeId?: string, 
    packetId?: string
  ) => {
    const newLog: LogEntry = {
      id: generateId(),
      timestamp: new Date(),
      type,
      message,
      nodeId,
      packetId,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: Node) => {
    setNodes(prev => prev.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
  }, []);

  const handleNodeCreate = useCallback(async (x: number, y: number) => {
    if (mode !== 'add') return;

    try {
      const nodeTypes: Node['type'][] = ['server', 'client', 'router'];
      const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      
      // Map frontend types to backend types
      const backendType = randomType === 'server' ? 'SERVER' : 
                         randomType === 'client' ? 'HOST' : 'ROUTER';
      
      const nodeData = {
        name: `${randomType}_${nodes.length + 1}`,
        type: backendType as 'HOST' | 'ROUTER' | 'SWITCH' | 'HUB' | 'GATEWAY' | 'FIREWALL' | 'LOAD_BALANCER' | 'SERVER',
        positionX: x,
        positionY: y,
        processingDelay: 10,
        bufferSize: 100,
        isActive: true
      };
      
      const backendNode = await apiService.createNode(sessionId, studentId, nodeData);
      
      // Convert backend node to frontend format
      const newNode: Node = {
        id: backendNode.id,
        x: backendNode.positionX,
        y: backendNode.positionY,
        type: randomType,
        active: backendNode.isActive,
        label: backendNode.name,
      };

      setNodes(prev => [...prev, newNode]);
      
      // Auto-connect to nearest node if exists
      if (nodes.length > 0) {
        const nearestNode = nodes.reduce((nearest, node) => {
          const distance = Math.sqrt(
            Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
          );
          const nearestDistance = Math.sqrt(
            Math.pow(nearest.x - x, 2) + Math.pow(nearest.y - y, 2)
          );
          return distance < nearestDistance ? node : nearest;
        });

        // Create connection via backend
        try {
          const connectionData = {
            sourceNodeId: nearestNode.id,
            targetNodeId: newNode.id,
            type: 'ETHERNET' as const,
            bandwidth: 1000,
            latency: 10,
            packetLossRate: 0.01,
            jitter: 1,
            mtu: 1500,
            isActive: true,
            isBidirectional: true,
            cost: 1
          };
          
          await apiService.createConnection(sessionId, studentId, connectionData);
          
          const newEdge: Edge = {
            id: `edge_${generateId()}`,
            sourceId: nearestNode.id,
            targetId: newNode.id,
          };

          setEdges(prev => [...prev, newEdge]);
        } catch (error) {
          console.error('Failed to create connection:', error);
          addLog('node_failed', 'Failed to create connection between nodes');
        }
      }

      addLog('packet_sent', `Created new ${randomType} node: ${newNode.label}`, newNode.id);
      toast.success(`Created ${randomType} node`);
      saveToHistory();
    } catch (error) {
      console.error('Failed to create node:', error);
      addLog('node_failed', 'Failed to create node');
      toast.error('Failed to create node');
    }
  }, [nodes, addLog, mode, saveToHistory, sessionId, studentId]);

  const handleSendPacket = useCallback(async () => {
    if (nodes.length < 2) {
      toast.error('Need at least 2 nodes to send packets');
      return;
    }

    const activeNodes = nodes.filter(node => node.active);
    if (activeNodes.length < 2) {
      toast.error('Need at least 2 active nodes');
      return;
    }

    try {
      const sourceNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      let targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      
      while (targetNode.id === sourceNode.id && activeNodes.length > 1) {
        targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      }

      // Send packet via backend
      const packetData = {
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        size: 1500,
        payload: 'Hello World',
        priority: 1
      };

      const backendPacket = await apiService.sendPacket(sessionId, studentId, packetData);

      const newPacket: Packet = {
        id: backendPacket.id,
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        progress: 0,
        status: 'traveling',
      };

      setPackets(prev => [...prev, newPacket]);
      addLog('packet_sent', 
        `Packet sent from ${sourceNode.label} to ${targetNode.label}`, 
        sourceNode.id, 
        newPacket.id
      );

      // Simulate packet journey with enhanced animations
      const animatePacket = () => {
        setPackets(prev => prev.map(packet => {
          if (packet.id !== newPacket.id) return packet;

          const newProgress = packet.progress + 0.015;
          
          if (newProgress >= 1) {
            const random = Math.random() * 100;
            let status: Packet['status'] = 'delivered';
            let message = `Packet delivered successfully to ${targetNode.label}`;
            
            if (random < packetLoss) {
              status = 'lost';
              message = `Packet lost in transit to ${targetNode.label}`;
            } else if (random < packetLoss + corruption) {
              status = 'corrupted';
              message = `Packet corrupted during transmission to ${targetNode.label}`;
            } else if (!targetNode.active) {
              status = 'failed';
              message = `Packet failed - target node ${targetNode.label} is down`;
            }

            addLog(
              status === 'delivered' ? 'packet_delivered' :
              status === 'lost' ? 'packet_lost' :
              status === 'corrupted' ? 'packet_corrupted' : 'packet_lost',
              message,
              targetNode.id,
              packet.id
            );

            setTimeout(() => {
              setPackets(prev => prev.filter(p => p.id !== packet.id));
            }, 1500);

            return { ...packet, progress: 1, status };
          }

          return { ...packet, progress: newProgress };
        }));
      };

      const interval = setInterval(animatePacket, latency / 60);
      setTimeout(() => clearInterval(interval), latency + 1500);

      toast.success('Packet sent!');
    } catch (error) {
      console.error('Failed to send packet:', error);
      addLog('packet_lost', 'Failed to send packet');
      toast.error('Failed to send packet');
    }
  }, [nodes, packetLoss, corruption, latency, addLog, sessionId, studentId]);

  const handleToggleNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const newActiveState = !node.active;
        addLog(
          newActiveState ? 'node_recovered' : 'node_failed',
          `Node ${node.label} ${newActiveState ? 'recovered' : 'failed'}`,
          nodeId
        );
        return { ...node, active: newActiveState };
      }
      return node;
    }));
    saveToHistory();
  }, [addLog, saveToHistory]);

  const handleLogClick = useCallback((log: LogEntry) => {
    if (log.nodeId) {
      const node = nodes.find(n => n.id === log.nodeId);
      if (node) {
        // Highlight the node (could add visual feedback here)
        toast.info(`Highlighting ${node.label}`);
      }
    }
  }, [nodes]);

  return (
    <div className="h-screen w-full flex bg-background">
      {/* Left Panel - Controls */}
      <div className={cn(
        "border-r border-border/50 transition-all duration-300 flex flex-col",
        leftPanelCollapsed ? "w-16" : "w-80"
      )}>
        {/* Panel Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          {!leftPanelCollapsed && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDashboard}
                className="p-2 hover:bg-background/50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="font-semibold text-foreground">NetLab Explorer</h1>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="p-2 hover:bg-background/50"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {!leftPanelCollapsed ? (
            <div className="p-4 space-y-6">
              {/* Mode Selector */}
              <ModeSelector mode={mode} onModeChange={setMode} />
              
              {/* Control Panel */}
              <ControlPanel
                packetLoss={packetLoss}
                corruption={corruption}
                latency={latency}
                onPacketLossChange={setPacketLoss}
                onCorruptionChange={setCorruption}
                onLatencyChange={setLatency}
                onSendPacket={handleSendPacket}
                onToggleNode={handleToggleNode}
                activeNodes={nodes.map(node => node.id)}
              />

              {/* History Controls */}
              <div className="glass-card p-4 rounded-2xl">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  History
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex-1 glass-card"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex-1 glass-card"
                  >
                    <RotateCw className="w-3 h-3 mr-1" />
                    Redo
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDashboard}
                className="w-full p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel - Canvas */}
      <div className="flex-1 relative">
        <NetworkCanvas
          nodes={nodes}
          edges={edges}
          packets={packets}
          onNodeUpdate={handleNodeUpdate}
          onNodeCreate={handleNodeCreate}
          mode={mode}
        />
      </div>

      {/* Right Panel - Logs & AI */}
      <div className={cn(
        "border-l border-border/50 transition-all duration-300 flex flex-col",
        rightPanelCollapsed ? "w-16" : "w-96"
      )}>
        {/* Panel Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-2 hover:bg-background/50"
          >
            <PanelRightOpen className="w-4 h-4" />
          </Button>
          
          {!rightPanelCollapsed && (
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Activity & AI</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiChatbotOpen(true)}
                className="p-2 hover:bg-background/50 neon-glow-blue"
                title="Open AI Assistant"
              >
                <Brain className="w-4 h-4" />
                <MessageCircle className="w-3 h-3 -ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 flex flex-col">
          {!rightPanelCollapsed ? (
            <>
              {/* Logs Section */}
              <div className={cn(
                "transition-all duration-300",
                aiHelpExpanded ? "h-1/2" : "flex-1"
              )}>
                <LogPanel logs={logs} onLogClick={handleLogClick} />
              </div>

              {/* AI Help Section */}
              <div className={cn(
                "transition-all duration-300",
                aiHelpExpanded ? "h-1/2" : "h-auto"
              )}>
                <AIHelpPanel
                  isExpanded={aiHelpExpanded}
                  onToggle={() => setAiHelpExpanded(!aiHelpExpanded)}
                />
              </div>
            </>
          ) : (
            <AIHelpPanel
              isExpanded={false}
              onToggle={() => {
                setRightPanelCollapsed(false);
                setAiHelpExpanded(true);
              }}
            />
          )}
        </div>
      </div>

      {/* AI Chatbot */}
      <AIChatbot
        sessionId={sessionId}
        studentId={studentId}
        isOpen={aiChatbotOpen}
        onClose={() => setAiChatbotOpen(false)}
      />
    </div>
  );
};