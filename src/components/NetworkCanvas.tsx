import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NetworkNode } from './NetworkNode';
import { NetworkEdge } from './NetworkEdge';
import { NetworkPacket } from './NetworkPacket';

export interface Node {
  id: string;
  x: number;
  y: number;
  type: 'node';
  active: boolean;
  label: string;
  isSource?: boolean;
  isDestination?: boolean;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Packet {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number;
  status: 'traveling' | 'delivered' | 'lost' | 'corrupted' | 'failed';
}

interface NetworkCanvasProps {
  nodes: Node[];
  edges: Edge[];
  packets: Packet[];
  onNodeUpdate: (node: Node) => void;
  onNodeCreate: (x: number, y: number) => void;
  onNodeClick?: (node: Node) => void;
  mode?: 'select' | 'add' | 'connect' | 'delete';
  connectingFromNode?: string | null;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  edges,
  packets,
  onNodeUpdate,
  onNodeCreate,
  onNodeClick,
  mode = 'select',
  connectingFromNode,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleNodeDragStart = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: event.clientX - rect.left - node.x,
        y: event.clientY - rect.top - node.y,
      });
    }
  }, [nodes]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;

    const node = nodes.find(n => n.id === draggedNode);
    if (node) {
      onNodeUpdate({
        ...node,
        x: Math.max(50, Math.min(rect.width - 50, x)),
        y: Math.max(50, Math.min(rect.height - 50, y)),
      });
    }
  }, [draggedNode, dragOffset, nodes, onNodeUpdate]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleCanvasDoubleClick = useCallback((event: React.MouseEvent) => {
    if (mode !== 'add' || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    onNodeCreate(x, y);
  }, [onNodeCreate, mode]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (mode !== 'add' || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    onNodeCreate(x, y);
  }, [onNodeCreate, mode]);

  useEffect(() => {
    if (draggedNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNode, handleMouseMove, handleMouseUp]);

  const getCursorClass = () => {
    switch (mode) {
      case 'add': return 'cursor-copy';
      case 'connect': return 'cursor-crosshair';
      case 'delete': return 'cursor-not-allowed';
      default: return 'cursor-default';
    }
  };

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full glass-card overflow-hidden ${getCursorClass()}`}
      onClick={mode === 'add' ? handleCanvasClick : undefined}
    >
      {/* Circuit grid background */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--neon-blue)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--neon-blue)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Render edges first (behind nodes) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.sourceId);
          const targetNode = nodes.find(n => n.id === edge.targetId);
          if (!sourceNode || !targetNode) return null;

          return (
            <NetworkEdge
              key={edge.id}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
            />
          );
        })}
      </svg>

      {/* Render packets */}
      {packets.map(packet => {
        const sourceNode = nodes.find(n => n.id === packet.sourceId);
        const targetNode = nodes.find(n => n.id === packet.targetId);
        if (!sourceNode || !targetNode) return null;

        const x = sourceNode.x + (targetNode.x - sourceNode.x) * packet.progress;
        const y = sourceNode.y + (targetNode.y - sourceNode.y) * packet.progress;

        return (
          <NetworkPacket
            key={packet.id}
            x={x}
            y={y}
            status={packet.status}
          />
        );
      })}

      {/* Render nodes */}
      {nodes.map(node => (
        <NetworkNode
          key={node.id}
          node={node}
          onDragStart={(event) => handleNodeDragStart(node.id, event)}
          onClick={onNodeClick}
          isDragged={draggedNode === node.id}
          isConnecting={connectingFromNode === node.id}
          canConnectTo={mode === 'connect' && connectingFromNode && connectingFromNode !== node.id}
        />
      ))}

      {/* Canvas instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glass-card p-8 text-center max-w-md">
            <h3 className="text-xl font-semibold text-neon-blue mb-2">
              Network Canvas
            </h3>
            <p className="text-muted-foreground">
              Select 'Add Node' mode and click anywhere to create nodes, then drag to connect and position them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};