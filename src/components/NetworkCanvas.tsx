import React, { useRef } from 'react';
import { useNetworkStore, Device, Connection, Packet } from '../stores/useNetworkStore';
import { NetworkNode } from './NetworkNode';
import { NetworkEdge } from './NetworkEdge';
import { NetworkPacket } from './NetworkPacket';
import { motion } from 'framer-motion';

interface NetworkCanvasProps {
  nodes: Device[];
  edges: Connection[];
  packets: Packet[];
  onNodeUpdate: (node: Device) => void; // Kept for interface compatibility if needed
  onNodeCreate: (x: number, y: number) => void;
  onNodeClick?: (node: Device) => void;
  mode?: 'select' | 'add' | 'connect' | 'delete';
  connectingFromNode?: string | null;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  edges,
  packets,
  onNodeCreate,
  mode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    updateDevicePosition,
    selectDevice,
    selectedDeviceId,
    addConnection,
    setMode,
    activeMode
  } = useNetworkStore();

  // Local state for temporary connection line drawing
  const [tempConnection, setTempConnection] = React.useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [connectingNodeId, setConnectingNodeId] = React.useState<string | null>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeMode === 'add' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      onNodeCreate(e.clientX - rect.left, e.clientY - rect.top);
      setMode('select'); // Switch back to select after adding
    } else {
      selectDevice(null); // Deselect if clicking empty space
    }
  };

  const handleNodeClick = (clickedNode: Device) => {
    if (activeMode === 'connect') {
      if (!connectingNodeId) {
        setConnectingNodeId(clickedNode.id);
      } else {
        if (connectingNodeId !== clickedNode.id) {
          addConnection(connectingNodeId, clickedNode.id);
        }
        setConnectingNodeId(null);
        setTempConnection(null);
      }
    } else if (activeMode === 'delete') {
      // Handle delete
    } else {
      selectDevice(clickedNode.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeMode === 'connect' && connectingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const sourceNode = nodes.find(n => n.id === connectingNodeId);
      if (sourceNode) {
        setTempConnection({
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: e.clientX - rect.left,
          y2: e.clientY - rect.top
        });
      }
    }
  };

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full overflow-hidden bg-background ${activeMode === 'add' ? 'cursor-crosshair' : 'cursor-default'}`}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(#00d9ff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render Edges */}
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.sourceId);
          const target = nodes.find(n => n.id === edge.targetId);
          if (!source || (!target && edge.targetId !== 'temp')) return null;

          return (
            <NetworkEdge
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target?.x || 0}
              y2={target?.y || 0}
              type={edge.type}
              status={edge.status}
            />
          );
        })}

        {/* Temporary Connection Line */}
        {tempConnection && (
          <line
            x1={tempConnection.x1}
            y1={tempConnection.y1}
            x2={tempConnection.x2}
            y2={tempConnection.y2}
            stroke="#f59e0b" // Neon Yellow
            strokeWidth="2"
            strokeDasharray="5 5"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Render Packets */}
      {packets.map(packet => {
        let x = 0;
        let y = 0;

        if (packet.path && packet.path.length > 1) {
          // Multi-hop rendering
          const pathIds = packet.path;
          const totalSegments = pathIds.length - 1;

          // Linear Easing (Steady)
          const p = packet.progress;
          const t = p; // Linear

          // Map eased total progress to specific segment
          const segmentProgressTotal = t * totalSegments;
          const segmentIndex = Math.min(Math.floor(segmentProgressTotal), totalSegments - 1);
          const segmentT = segmentProgressTotal - segmentIndex;

          const currentId = pathIds[segmentIndex];
          const nextId = pathIds[segmentIndex + 1];

          const currentNode = nodes.find(n => n.id === currentId);
          const nextNode = nodes.find(n => n.id === nextId);

          if (!currentNode || !nextNode) return null;

          x = currentNode.x + (nextNode.x - currentNode.x) * segmentT;
          y = currentNode.y + (nextNode.y - currentNode.y) * segmentT;
        } else {
          // Direct rendering fallback
          const source = nodes.find(n => n.id === packet.sourceId);
          const target = nodes.find(n => n.id === packet.targetId);
          if (!source || !target) return null;

          // Linear Easing (Steady)
          const t = packet.progress;

          x = source.x + (target.x - source.x) * t;
          y = source.y + (target.y - source.y) * t;
        }

        return (
          <NetworkPacket
            key={packet.id}
            x={x}
            y={y}
            status={packet.status}
          />
        );
      })}

      {/* Render Nodes */}
      {nodes.map(node => (
        <NetworkNode
          key={node.id}
          node={node}
          updatePosition={(x, y) => updateDevicePosition(node.id, x, y)}
          onClick={() => handleNodeClick(node)}
          isSelected={node.id === selectedDeviceId}
          isConnecting={connectingNodeId === node.id}
          canConnectTo={activeMode === 'connect' && connectingNodeId !== null && connectingNodeId !== node.id}
        />
      ))}

    </div>
  );
};
