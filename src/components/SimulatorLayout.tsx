import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { NetworkCanvas, Node, Edge, Packet } from './NetworkCanvas';
import { ControlPanel } from './ControlPanel';
import { LogPanel, LogEntry } from './LogPanel';
import { ModeSelector, SimulationMode } from './ModeSelector';
import { AIHelpPanel } from './AIHelpPanel';
import { 
  ArrowLeft, 
  RotateCcw, 
  RotateCw, 
  Settings,
  PanelLeftOpen,
  PanelRightOpen,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNetworkSimulation } from '@/hooks/useNetworkSimulation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { CustomMessagePanel } from '@/components/CustomMessagePanel';
import { NodeResponse, ConnectionResponse } from '@/types/api';

interface SimulatorLayoutProps {
  sessionId: string | null;
  onBackToDashboard: () => void;
  onBackToSessions?: () => void;
}

export const SimulatorLayout: React.FC<SimulatorLayoutProps> = ({ 
  sessionId,
  onBackToDashboard,
  onBackToSessions
}) => {
  // Backend hooks
  const networkSim = useNetworkSimulation(sessionId);
  const webSocket = useWebSocket();

  // Local UI state
  const [packets, setPackets] = useState<Packet[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mode, setMode] = useState<SimulationMode>('select');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [aiHelpExpanded, setAiHelpExpanded] = useState(false);

  // Control panel state (for anomaly creation)
  const [packetLoss, setPacketLoss] = useState(10);
  const [corruption, setCorruption] = useState(5);
  const [latency, setLatency] = useState(100);

  // Convert backend data to UI format
  const nodes: Node[] = networkSim.nodes.map(node => ({
    id: node.id.toString(),
    x: node.x_position,
    y: node.y_position,
    type: node.node_type as Node['type'],
    active: node.status === 'active',
    label: node.name,
  }));

  const edges: Edge[] = networkSim.connections.map(conn => ({
    id: conn.id.toString(),
    sourceId: conn.source_node_id.toString(),
    targetId: conn.destination_node_id.toString(),
  }));

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Connect to WebSocket when sessionId changes
  useEffect(() => {
    if (sessionId && !webSocket.isConnected) {
      webSocket.connect(sessionId).catch(console.error);
    }

    return () => {
      if (webSocket.isConnected) {
        webSocket.disconnect();
      }
    };
  }, [sessionId, webSocket]);

  // Add initial welcome log
  useEffect(() => {
    if (sessionId) {
      addLog('packet_sent', 'NetLab Explorer connected to backend - Ready for simulation');
    }
  }, [sessionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // Backend handles undo/redo, we can implement later
        return;
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
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    const handlePacketEvent = (event: any) => {
      addLog(
        event.event_type as LogEntry['type'],
        event.data.message || `${event.event_type.replace('_', ' ')} event`,
        event.data.node_id?.toString(),
        event.data.packet_id?.toString()
      );

      // Handle packet visualization
      if (event.event_type === 'packet_sent' && event.data.packet) {
        const packet: Packet = {
          id: event.data.packet.id.toString(),
          sourceId: event.data.packet.source_node_id.toString(),
          targetId: event.data.packet.destination_node_id.toString(),
          progress: 0,
          status: 'traveling',
        };
        setPackets(prev => [...prev, packet]);
      }
    };

    const handleSimulationEvent = (event: any) => {
      addLog(
        event.event_type as LogEntry['type'],
        event.data.message || `Simulation ${event.event_type.replace('simulation_', '')}`,
      );
    };

    // Register packet event handlers
    webSocket.on('packet_sent', handlePacketEvent);
    webSocket.on('packet_delivered', handlePacketEvent);
    webSocket.on('packet_lost', handlePacketEvent);
    webSocket.on('packet_delayed', handlePacketEvent);
    webSocket.on('packet_failed', handlePacketEvent);
    
    // Register simulation event handlers
    webSocket.on('simulation_started', handleSimulationEvent);
    webSocket.on('simulation_completed', handleSimulationEvent);
    webSocket.on('simulation_error', handleSimulationEvent);
    
    // Register log event handlers
    webSocket.on('log_info', handlePacketEvent);
    webSocket.on('log_warning', handlePacketEvent);
    webSocket.on('log_error', handlePacketEvent);

    return () => {
      webSocket.off('packet_sent');
      webSocket.off('packet_delivered');
      webSocket.off('packet_lost');
      webSocket.off('packet_delayed');
      webSocket.off('packet_failed');
      webSocket.off('simulation_started');
      webSocket.off('simulation_completed');
      webSocket.off('simulation_error');
      webSocket.off('log_info');
      webSocket.off('log_warning');
      webSocket.off('log_error');
    };
  }, [webSocket]);

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

  const handleNodeUpdate = useCallback(async (updatedNode: Node) => {
    if (!sessionId) return;
    
    const nodeId = parseInt(updatedNode.id);
    await networkSim.updateNode(nodeId, {
      x_position: updatedNode.x,
      y_position: updatedNode.y,
      status: updatedNode.active ? 'active' : 'inactive',
    });
  }, [networkSim, sessionId]);

  const handleNodeCreate = useCallback(async (x: number, y: number) => {
    if (mode !== 'add' || !sessionId) return;

    const nodeTypes = ['router', 'switch', 'host', 'server'] as const;
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    
    const newNode = await networkSim.createNode({
      name: `${randomType}_${nodes.length + 1}`,
      node_type: randomType,
      x_position: x,
      y_position: y,
    });

    if (newNode) {
      addLog('packet_sent', `Created new ${randomType} node: ${newNode.name}`, newNode.id.toString());
      
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

        await networkSim.createConnection({
          source_node_id: parseInt(nearestNode.id),
          destination_node_id: newNode.id,
          bandwidth_mbps: 100,
          latency_ms: 10,
        });

        addLog('packet_sent', `Connected ${newNode.name} to ${nearestNode.label}`);
      }
    }
  }, [nodes, addLog, mode, networkSim, sessionId]);

  const handleSendPacket = useCallback(async () => {
    if (!sessionId || nodes.length < 2) {
      toast.error('Need at least 2 nodes to send packets');
      return;
    }

    const activeNodes = nodes.filter(node => node.active);
    if (activeNodes.length < 2) {
      toast.error('Need at least 2 active nodes');
      return;
    }

    const sourceNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    let targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    
    while (targetNode.id === sourceNode.id && activeNodes.length > 1) {
      targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    }

    // Create message via backend
    const message = await networkSim.createMessage({
      source_node_id: parseInt(sourceNode.id),
      destination_node_id: parseInt(targetNode.id),
      message_type: 'data',
      content: 'Test packet',
      packet_size_bytes: 1024,
    });

    if (message) {
      addLog('packet_sent', 
        `Message created from ${sourceNode.label} to ${targetNode.label}`, 
        sourceNode.id, 
        message.id.toString()
      );

      // Start simulation with the message
      await networkSim.startSimulation({
        message_ids: [message.id],
        enable_anomalies: true,
        speed_multiplier: 1.0,
      });

      toast.success('Message sent and simulation started!');
    }
  }, [nodes, networkSim, sessionId, addLog]);

  const handleToggleNode = useCallback(async (nodeId: string) => {
    if (!sessionId) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newStatus = node.active ? 'inactive' : 'active';
    
    await networkSim.updateNode(parseInt(nodeId), {
      status: newStatus as 'active' | 'inactive',
    });

    addLog(
      newStatus === 'active' ? 'node_recovered' : 'node_failed',
      `Node ${node.label} ${newStatus === 'active' ? 'recovered' : 'failed'}`,
      nodeId
    );
  }, [nodes, networkSim, sessionId, addLog]);

  const handleSendCustomMessage = useCallback(async (messageData: {
    sourceId: string;
    targetId: string;
    content: string;
    messageType: 'data' | 'control' | 'broadcast';
    priority: number;
    packetSize: number;
  }) => {
    if (!sessionId) return;

    const message = await networkSim.createMessage({
      source_node_id: parseInt(messageData.sourceId),
      destination_node_id: parseInt(messageData.targetId),
      message_type: messageData.messageType,
      content: messageData.content,
      packet_size_bytes: messageData.packetSize,
      priority: messageData.priority,
    });

    if (message) {
      const sourceNode = nodes.find(n => n.id === messageData.sourceId);
      const targetNode = nodes.find(n => n.id === messageData.targetId);
      
      addLog('packet_sent', 
        `Custom message sent from ${sourceNode?.label} to ${targetNode?.label}: "${messageData.content}"`, 
        messageData.sourceId, 
        message.id.toString()
      );

      // Start simulation with the custom message
      await networkSim.startSimulation({
        message_ids: [message.id],
        enable_anomalies: true,
        speed_multiplier: 1.0,
      });
    }
  }, [nodes, networkSim, sessionId, addLog]);

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
        "border-r border-border/50 transition-all duration-300 flex flex-col min-h-0",
        leftPanelCollapsed ? "w-16" : "w-96"
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
              {onBackToSessions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToSessions}
                  className="ml-auto text-xs"
                >
                  Change Session
                </Button>
              )}
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
        <div className="flex-1 overflow-y-auto min-h-0">
          {!leftPanelCollapsed ? (
            <div className="flex flex-col h-full">
              {/* Mode Selector - Fixed */}
              <div className="p-4 border-b border-border/50">
                <ModeSelector mode={mode} onModeChange={setMode} />
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
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

                  {/* Custom Message Panel */}
                  <CustomMessagePanel
                    nodes={nodes}
                    onSendMessage={handleSendCustomMessage}
                    isLoading={networkSim.isLoading}
                  />

                  {/* Connection Status */}
                  <ConnectionStatus
                    isBackendConnected={!networkSim.error}
                    isWebSocketConnected={webSocket.isConnected}
                    isLoading={networkSim.isLoading}
                    error={networkSim.error}
                    sessionId={sessionId}
                    onRetry={() => {
                      networkSim.refreshAll();
                      if (sessionId && !webSocket.isConnected) {
                        webSocket.connect(sessionId);
                      }
                    }}
                  />
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
        "border-l border-border/50 transition-all duration-300 flex flex-col min-h-0",
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
            <h2 className="font-semibold text-foreground">Activity & AI</h2>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {!rightPanelCollapsed ? (
            <>
              {/* Logs Section */}
              <div className={cn(
                "transition-all duration-300 min-h-0",
                aiHelpExpanded ? "h-1/2" : "flex-1"
              )}>
                <LogPanel logs={logs} onLogClick={handleLogClick} />
              </div>

              {/* AI Help Section */}
              <div className={cn(
                "transition-all duration-300 border-t border-border/50",
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
    </div>
  );
};