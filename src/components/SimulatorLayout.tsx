import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { NetworkCanvas, Node, Edge, Packet } from './NetworkCanvas';
import { ControlPanel } from './ControlPanel';
import { LogPanel, LogEntry } from './LogPanel';
import { ModeSelector, SimulationMode } from './ModeSelector';
import { AIHelpPanel } from './AIHelpPanel';
import { AutomaticMode } from './AutomaticMode';
import { 
  ArrowLeft, 
  RotateCcw, 
  RotateCw, 
  Settings,
  PanelLeftOpen,
  PanelRightOpen,
  Grid3x3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulatorLayoutProps {
  onBackToDashboard: () => void;
}

export const SimulatorLayout: React.FC<SimulatorLayoutProps> = ({ 
  onBackToDashboard
}) => {
  // Local frontend-only state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // UI state
  const [mode, setMode] = useState<SimulationMode>('select');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [aiHelpExpanded, setAiHelpExpanded] = useState(false);

  // Control panel state
  const [packetLoss, setPacketLoss] = useState(10);
  const [corruption, setCorruption] = useState(5);
  const [latency, setLatency] = useState(100);

  // Source and destination selection
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [destinationNodeIds, setDestinationNodeIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  
  // App mode state
  const [appMode, setAppMode] = useState('playground');
  
  // Type guard to ensure proper mode values
  const isAutomaticMode = appMode === 'automatic';
  
  // Connect mode state
  const [connectingFromNode, setConnectingFromNode] = useState<string | null>(null);
  
  // AI query state
  const [aiLogQuery, setAiLogQuery] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add log entry
  const addLog = useCallback((type: LogEntry['type'], message: string, nodeId?: string, packetId?: string) => {
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

  // Node creation
  const handleNodeCreate = useCallback((x: number, y: number) => {
    if (mode !== 'add') return;

    const newNode: Node = {
      id: generateId(),
      x,
      y,
      type: 'node',
      active: true,
      label: `Node ${nodes.length + 1}`,
      isSource: false,
      isDestination: false
    };

    setNodes(prev => [...prev, newNode]);
    addLog('packet_sent', `Created new node: ${newNode.label}`, newNode.id);
    setMode('select'); // Switch back to select mode after creating node
  }, [nodes.length, addLog, mode]);

  // Node update (for dragging)
  const handleNodeUpdate = useCallback((updatedNode: Node) => {
    setNodes(prev => prev.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
  }, []);

  // Node click for selection or connection
  const handleNodeClick = useCallback((node: Node) => {
    if (mode === 'connect') {
      // Connect mode logic
      if (!connectingFromNode) {
        // Start connection
        setConnectingFromNode(node.id);
      } else if (connectingFromNode === node.id) {
        // Cancel connection
        setConnectingFromNode(null);
      } else {
        // Complete connection
        const fromNode = nodes.find(n => n.id === connectingFromNode);
        const toNode = node;
        
        // Check if edge already exists
        const edgeExists = edges.some(edge => 
          (edge.sourceId === connectingFromNode && edge.targetId === node.id) ||
          (edge.sourceId === node.id && edge.targetId === connectingFromNode)
        );
        
        if (edgeExists) {
          // Connection already exists - do nothing
        } else {
          // Create new edge
          const newEdge: Edge = {
            id: generateId(),
            sourceId: connectingFromNode,
            targetId: node.id
          };
          
          setEdges(prev => [...prev, newEdge]);
          addLog('packet_sent', `Connected ${fromNode?.label} to ${toNode.label}`);
        }
        
        setConnectingFromNode(null);
      }
      return;
    }

    if (mode !== 'select') return;

    // Update nodes to reflect selection state
    const updatedNodes = nodes.map(n => ({ 
      ...n, 
      isSource: false, 
      isDestination: false 
    }));

    // Toggle source/destination selection - one source, multiple destinations
    if (!sourceNodeId) {
      // Set as source (first click)
      setSourceNodeId(node.id);
      updatedNodes.forEach(n => {
        if (n.id === node.id) {
          n.isSource = true;
        }
      });
      setNodes(updatedNodes);
    } else if (node.id === sourceNodeId) {
      // Clicking source again resets everything
      setSourceNodeId(null);
      setDestinationNodeIds([]);
      setNodes(updatedNodes);
    } else {
      // Toggle destination (can select multiple)
      const isAlreadyDestination = destinationNodeIds.includes(node.id);
      
      if (isAlreadyDestination) {
        // Remove from destinations
        setDestinationNodeIds(prev => prev.filter(id => id !== node.id));
      } else {
        // Add to destinations
        setDestinationNodeIds(prev => [...prev, node.id]);
      }
      
      // Update visual state
      updatedNodes.forEach(n => {
        if (n.id === sourceNodeId) {
          n.isSource = true;
        } else if (isAlreadyDestination ? destinationNodeIds.filter(id => id !== node.id).includes(n.id) : [...destinationNodeIds, node.id].includes(n.id)) {
          n.isDestination = true;
        }
      });
      setNodes(updatedNodes);
    }
  }, [mode, sourceNodeId, destinationNodeIds, nodes, connectingFromNode, edges, addLog]);

  // Simple message sending
  const handleSimpleSendMessage = useCallback(() => {
    if (!sourceNodeId || destinationNodeIds.length === 0 || !customMessage.trim()) {
      return;
    }

    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    
    if (!sourceNode) {
      return;
    }

    // Send message to all selected destinations
    destinationNodeIds.forEach(destinationId => {
      const destNode = nodes.find(n => n.id === destinationId);
      
      if (!destNode) {
        return;
      }

      // Create a simple packet animation
      const newPacket: Packet = {
        id: generateId(),
        sourceId: sourceNodeId,
        targetId: destinationId,
        progress: 0,
        status: 'traveling'
      };

      // Add the packet and animate it
      setPackets(prev => [...prev, newPacket]);
      
      // Add log entry
      addLog('packet_sent', `Message sent from ${sourceNode.label} to ${destNode.label}: "${customMessage}"`, sourceNodeId);

      // Simulate packet travel with corruption/loss based on network conditions
      const travelTime = 100 + (latency * 10); // Base 100ms + latency factor
      const lossChance = packetLoss / 100;
      const corruptChance = corruption / 100;

      let currentProgress = 0;
      const animationInterval = setInterval(() => {
        currentProgress += 0.05; // 5% increment

        if (currentProgress >= 1) {
          clearInterval(animationInterval);
          
          // Determine final status based on network conditions
          const random = Math.random();
          let finalStatus: Packet['status'] = 'delivered';
          let finalMessage = customMessage;

          if (random < lossChance) {
            finalStatus = 'lost';
            addLog('packet_lost', `Message lost during transmission from ${sourceNode.label} to ${destNode.label}`, destNode.id);
          } else if (random < lossChance + corruptChance) {
            finalStatus = 'corrupted';
            // Corrupt the message
            finalMessage = customMessage.split('').map(char => 
              Math.random() < 0.3 ? '?' : char
            ).join('');
            addLog('packet_corrupted', `Message corrupted during transmission: "${finalMessage}"`, destNode.id);
          } else {
            addLog('packet_delivered', `Message delivered to ${destNode.label}: "${finalMessage}"`, destNode.id);
          }

          // Update packet status
          setPackets(prev => prev.map(p => 
            p.id === newPacket.id ? { ...p, progress: 1, status: finalStatus } : p
          ));

          // Remove packet after a short delay
          setTimeout(() => {
            setPackets(prev => prev.filter(p => p.id !== newPacket.id));
          }, 2000);
        } else {
          // Update progress
          setPackets(prev => prev.map(p => 
            p.id === newPacket.id ? { ...p, progress: currentProgress } : p
          ));
        }
      }, travelTime / 20); // 20 animation steps
    });

    // Clear message after sending to all destinations
    setCustomMessage('');
  }, [sourceNodeId, destinationNodeIds, customMessage, nodes, packetLoss, corruption, latency, addLog]);

  // Handle log click for AI analysis
  const handleLogClick = useCallback((logMessage: string) => {
    setAiLogQuery(logMessage);
    setAiHelpExpanded(true);
    setRightPanelCollapsed(false);
  }, []);

  // Handle AI query completion
  const handleAiQueryHandled = useCallback(() => {
    setAiLogQuery(null);
  }, []);

  // Send packet (legacy function for ControlPanel)
  const handleSendPacket = useCallback(() => {
    if (nodes.length < 2) {
      return;
    }

    const activeNodes = nodes.filter(node => node.active);
    if (activeNodes.length < 2) {
      return;
    }

    const sourceNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    let targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    
    while (targetNode.id === sourceNode.id && activeNodes.length > 1) {
      targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    }

    // Create packet
    const newPacket: Packet = {
      id: generateId(),
      sourceId: sourceNode.id,
      targetId: targetNode.id,
      progress: 0,
      status: 'traveling'
    };

    setPackets(prev => [...prev, newPacket]);
    addLog('packet_sent', `Random packet sent from ${sourceNode.label} to ${targetNode.label}`, sourceNode.id, newPacket.id);

    // Animate packet
    const animationInterval = setInterval(() => {
      setPackets(prev => prev.map(p => {
        if (p.id === newPacket.id) {
          const newProgress = p.progress + 0.05;
          if (newProgress >= 1) {
            clearInterval(animationInterval);
            addLog('packet_delivered', `Packet delivered to ${targetNode.label}`, targetNode.id, newPacket.id);
            setTimeout(() => {
              setPackets(prev => prev.filter(packet => packet.id !== newPacket.id));
            }, 1000);
            return { ...p, progress: 1, status: 'delivered' as const };
          }
          return { ...p, progress: newProgress };
        }
        return p;
      }));
    }, 50);
  }, [nodes, addLog]);

  // Toggle node active state
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
  }, [addLog]);

  // Node List View Component
  const NodeListView: React.FC = () => (
    <div className="flex-1 overflow-y-auto p-6 glass-card">
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-neon-blue mb-2">Network Nodes</h2>
          <p className="text-sm text-muted-foreground">
            {nodes.length} nodes • Click to select source/destination
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map(node => (
            <Card
              key={node.id}
              className={cn(
                "glass-card p-4 cursor-pointer transition-all duration-300 hover:scale-105",
                node.isSource && "ring-2 ring-neon-green",
                node.isDestination && "ring-2 ring-neon-purple",
                !node.active && "opacity-50"
              )}
              onClick={() => handleNodeClick(node)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{node.label}</h3>
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    node.active ? "bg-neon-green animate-pulse" : "bg-status-error"
                  )} />
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={node.active ? "text-neon-green" : "text-status-error"}>
                      {node.active ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span className="font-mono">
                      {Math.round(node.x)}, {Math.round(node.y)}
                    </span>
                  </div>
                  {node.isSource && (
                    <div className="text-neon-green font-semibold text-xs">
                      🟢 SOURCE NODE
                    </div>
                  )}
                  {node.isDestination && (
                    <div className="text-neon-purple font-semibold text-xs">
                      🟣 DESTINATION NODE
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/30">
                  <div className="text-xs text-muted-foreground">
                    Health: {node.active ? "100%" : "0%"}
                  </div>
                  <div className="w-full bg-background/20 rounded-full h-1 mt-1">
                    <div
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        node.active ? "bg-neon-green" : "bg-status-error"
                      )}
                      style={{ width: node.active ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="text-center py-12">
            <div className="glass-card p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No Nodes Found
              </h3>
              <p className="text-sm text-muted-foreground">
                Switch to canvas view and add some nodes to see them listed here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex bg-background relative">
      {/* Floating Mode Toggle - Always visible */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex items-center gap-1 glass-card rounded-lg p-1">
          <Button
            variant={appMode === 'playground' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAppMode('playground')}
            className={cn(
              "h-8 px-3 text-xs",
              appMode === 'playground' && "bg-neon-blue/20 text-neon-blue"
            )}
          >
            Playground
          </Button>
          <Button
            variant={appMode === 'automatic' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAppMode('automatic')}
            className={cn(
              "h-8 px-3 text-xs",
              appMode === 'automatic' && "bg-neon-green/20 text-neon-green"
            )}
          >
            Automatic
          </Button>
        </div>
      </div>

      {isAutomaticMode ? (
        <AutomaticMode onLogClick={handleLogClick} />
      ) : (
        <>
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
            <div className="flex flex-col h-full">
              {/* Mode Selector - Original Design */}
              <div className="p-4">
                <ModeSelector mode={mode} onModeChange={setMode} />
              </div>
              
              {/* View Toggle */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-1 glass-card rounded-lg p-1">
                  <Button
                    variant={viewMode === 'canvas' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('canvas')}
                    className={cn(
                      "h-8 px-2 text-xs flex-1",
                      viewMode === 'canvas' && "bg-neon-blue/20 text-neon-blue"
                    )}
                  >
                    <Grid3x3 className="w-3 h-3 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "h-8 px-2 text-xs flex-1",
                      viewMode === 'list' && "bg-neon-blue/20 text-neon-blue"
                    )}
                  >
                    <List className="w-3 h-3 mr-1" />
                    List
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="p-4 space-y-6">
                  {/* Message Sending Control */}
                  <Card className="glass-card p-4">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-neon-green mb-2">Send Message</h3>
                        <p className="text-xs text-muted-foreground">
                          Select source (1st click), then select multiple destinations
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Source:</span>
                          <span className="font-mono text-neon-green">
                            {sourceNodeId ? nodes.find(n => n.id === sourceNodeId)?.label : 'None'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span>Destinations:</span>
                          <div className="flex flex-col items-end gap-1">
                            {destinationNodeIds.length === 0 ? (
                              <span className="font-mono text-muted-foreground">None</span>
                            ) : (
                              destinationNodeIds.map(id => (
                                <span key={id} className="font-mono text-neon-purple text-xs">
                                  {nodes.find(n => n.id === id)?.label}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message-input" className="text-xs">Message Content:</Label>
                        <Input
                          id="message-input"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Enter your message..."
                          className="text-sm"
                        />
                      </div>

                      <Button
                        onClick={handleSimpleSendMessage}
                        disabled={!sourceNodeId || destinationNodeIds.length === 0 || !customMessage.trim()}
                        className="w-full glass neon-glow-green"
                        size="sm"
                      >
                        Send to {destinationNodeIds.length > 0 ? `${destinationNodeIds.length} Node${destinationNodeIds.length > 1 ? 's' : ''}` : 'All'}
                      </Button>
                    </div>
                  </Card>

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
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('add')}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel - Mode-specific content */}
      <div className="flex-1 relative">
        {appMode === 'automatic' ? (
          <AutomaticMode onLogClick={handleLogClick} />
        ) : (
          <>
            {viewMode === 'canvas' ? (
              <NetworkCanvas
                nodes={nodes}
                edges={edges}
                packets={packets}
                onNodeUpdate={handleNodeUpdate}
                onNodeCreate={handleNodeCreate}
                onNodeClick={handleNodeClick}
                mode={mode}
                connectingFromNode={connectingFromNode}
              />
            ) : (
              <NodeListView />
            )}
          </>
        )}
      </div>

      {/* Right Panel - Logs & AI */}
      <div className={cn(
        "border-l border-border/50 transition-all duration-300 flex flex-col min-h-0",
        rightPanelCollapsed ? "w-16" : "w-96"
      )}>
        {/* Panel Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          {!rightPanelCollapsed && (
            <h2 className="font-semibold text-foreground">Activity</h2>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-2 hover:bg-background/50"
          >
            <PanelRightOpen className="w-4 h-4" />
          </Button>
        </div>

        {/* Panel Content */}
        {!rightPanelCollapsed && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Logs Panel */}
            <div className="flex-1 min-h-0">
              <LogPanel logs={logs} />
            </div>
            
            {/* AI Help Panel */}
            <div className={cn(
              "border-t border-border/50 transition-all duration-300",
              aiHelpExpanded ? "h-80" : "h-12"
            )}>
              <AIHelpPanel 
                isExpanded={aiHelpExpanded}
                onToggle={() => setAiHelpExpanded(!aiHelpExpanded)}
                logQuery={aiLogQuery}
                onLogQueryHandled={handleAiQueryHandled}
              />
            </div>
          </div>
        )}

        {/* Collapsed state */}
        {rightPanelCollapsed && (
          <div className="p-4 space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};