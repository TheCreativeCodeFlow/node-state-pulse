import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NetworkCanvas, Node, Edge, Packet } from '@/components/NetworkCanvas';
import { ControlPanel } from '@/components/ControlPanel';
import { LogPanel, LogEntry } from '@/components/LogPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Activity, BarChart3, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  // Network state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Control panel state
  const [packetLoss, setPacketLoss] = useState(10);
  const [corruption, setCorruption] = useState(5);
  const [latency, setLatency] = useState(100);

  // Generate unique IDs
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add initial welcome log
  useEffect(() => {
    addLog('packet_sent', 'Network simulator initialized - Ready for simulation');
  }, []);

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

  const handleNodeCreate = useCallback((x: number, y: number) => {
    const nodeTypes: Node['type'][] = ['server', 'client', 'router'];
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    
    const newNode: Node = {
      id: `node_${generateId()}`,
      x,
      y,
      type: randomType,
      active: true,
      label: `${randomType}_${nodes.length + 1}`,
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

      const newEdge: Edge = {
        id: `edge_${generateId()}`,
        sourceId: nearestNode.id,
        targetId: newNode.id,
      };

      setEdges(prev => [...prev, newEdge]);
    }

    addLog('packet_sent', `Created new ${randomType} node: ${newNode.label}`, newNode.id);
    toast.success(`Created ${randomType} node`);
  }, [nodes, addLog]);

  const handleSendPacket = useCallback(() => {
    if (nodes.length < 2) {
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
    
    // Ensure different source and target
    while (targetNode.id === sourceNode.id && activeNodes.length > 1) {
      targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    }

    const newPacket: Packet = {
      id: `packet_${generateId()}`,
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

    // Simulate packet journey
    const animatePacket = () => {
      setPackets(prev => prev.map(packet => {
        if (packet.id !== newPacket.id) return packet;

        const newProgress = packet.progress + 0.02;
        
        if (newProgress >= 1) {
          // Determine packet outcome based on network conditions
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

          // Remove packet after animation
          setTimeout(() => {
            setPackets(prev => prev.filter(p => p.id !== packet.id));
          }, 1000);

          return { ...packet, progress: 1, status };
        }

        return { ...packet, progress: newProgress };
      }));
    };

    const interval = setInterval(animatePacket, latency / 50);
    setTimeout(() => clearInterval(interval), latency + 1000);

    toast.success('Packet sent!');
  }, [nodes, packetLoss, corruption, latency, addLog]);

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

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <Tabs defaultValue="simulator" className="flex-1 flex flex-col">
        {/* Bottom Tab Navigation */}
        <div className="order-2 p-4 border-t border-border/50">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="simulator" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Simulator
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content */}
        <div className="order-1 flex-1 overflow-hidden">
          <TabsContent value="simulator" className="h-full m-0 p-0">
            <div className="h-full flex">
              {/* Canvas Area */}
              <div className="flex-1 p-4">
                <NetworkCanvas
                  nodes={nodes}
                  edges={edges}
                  packets={packets}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeCreate={handleNodeCreate}
                />
              </div>
              
              {/* Control Panel */}
              <div className="w-80 p-4 border-l border-border/50">
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
          </TabsContent>

          <TabsContent value="logs" className="h-full m-0 p-4">
            <LogPanel logs={logs} />
          </TabsContent>

          <TabsContent value="analytics" className="h-full m-0 overflow-y-auto">
            <AnalyticsDashboard logs={logs} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Index;