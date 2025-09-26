import React from 'react';
import { Server, Monitor, Wifi } from 'lucide-react';
import { Node } from './NetworkCanvas';
import { cn } from '@/lib/utils';

interface NetworkNodeProps {
  node: Node;
  onDragStart: (event: React.MouseEvent) => void;
  onClick?: (node: Node) => void;
  isDragged: boolean;
  isConnecting?: boolean;
  canConnectTo?: boolean;
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  node,
  onDragStart,
  onClick,
  isDragged,
  isConnecting = false,
  canConnectTo = false,
}) => {
  const getNodeIcon = () => {
    return <div className="w-4 h-4 bg-current rounded-full" />;
  };

  const getNodeColor = () => {
    if (!node.active) return 'status-error';
    if (isConnecting) return 'neon-yellow';
    if (canConnectTo) return 'neon-cyan';
    if (node.isSource) return 'neon-green';
    if (node.isDestination) return 'neon-purple';
    return 'neon-blue';
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onClick) {
      onClick(node);
    }
  };

  return (
    <div
      className={cn(
        "absolute glass-card p-4 rounded-2xl cursor-move select-none transition-all duration-300 hover:scale-105 min-w-24 text-center",
        isDragged && "scale-110 neon-glow z-50",
        !node.active && "animate-pulse-red opacity-80",
        (node.isSource || node.isDestination) && "ring-2 ring-current",
        isConnecting && "ring-4 ring-neon-yellow animate-pulse",
        canConnectTo && "ring-2 ring-neon-cyan animate-bounce cursor-pointer"
      )}
      style={{
        left: node.x - 48,
        top: node.y - 48,
        color: `hsl(var(--${getNodeColor()}))`,
      }}
      onMouseDown={onDragStart}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center gap-2">
        <div 
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
            node.active ? "glass neon-glow" : "bg-status-error/20"
          )}
          style={{
            backgroundColor: node.active ? `hsl(var(--${getNodeColor()}) / 0.1)` : undefined,
            borderColor: `hsl(var(--${getNodeColor()}) / 0.3)`,
          }}
        >
          {getNodeIcon()}
        </div>
        <span className="text-xs font-medium text-foreground/80 truncate max-w-20">
          {node.label}
        </span>
        {isConnecting && (
          <div className="text-xs font-bold text-neon-yellow">CONNECTING</div>
        )}
        {canConnectTo && (
          <div className="text-xs font-bold text-neon-cyan">CONNECT TO</div>
        )}
        {node.isSource && (
          <div className="text-xs font-bold text-neon-green">SOURCE</div>
        )}
        {node.isDestination && (
          <div className="text-xs font-bold text-neon-purple">DEST</div>
        )}
      </div>

      {/* Connection points */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};