import React from 'react';
import { Server, Monitor, Wifi } from 'lucide-react';
import { Node } from './NetworkCanvas';
import { cn } from '@/lib/utils';

interface NetworkNodeProps {
  node: Node;
  onDragStart: (event: React.MouseEvent) => void;
  isDragged: boolean;
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  node,
  onDragStart,
  isDragged,
}) => {
  const getNodeIcon = () => {
    switch (node.type) {
      case 'server':
        return <Server className="w-6 h-6" />;
      case 'client':
        return <Monitor className="w-6 h-6" />;
      case 'router':
        return <Wifi className="w-6 h-6" />;
      default:
        return <Server className="w-6 h-6" />;
    }
  };

  const getNodeColor = () => {
    if (!node.active) return 'status-error';
    switch (node.type) {
      case 'server':
        return 'neon-blue';
      case 'client':
        return 'neon-green';
      case 'router':
        return 'neon-purple';
      default:
        return 'neon-blue';
    }
  };

  return (
    <div
      className={cn(
        "absolute glass-card p-4 rounded-2xl cursor-move select-none transition-all duration-300 hover:scale-105 min-w-24 text-center",
        isDragged && "scale-110 neon-glow z-50",
        !node.active && "animate-pulse-red opacity-80"
      )}
      style={{
        left: node.x - 48,
        top: node.y - 48,
        color: `hsl(var(--${getNodeColor()}))`,
      }}
      onMouseDown={onDragStart}
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
      </div>

      {/* Connection points */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};