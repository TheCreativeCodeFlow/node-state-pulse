import React from 'react';
import { motion } from 'framer-motion';
import { Server, Monitor, Wifi, Router, Network, HardDrive } from 'lucide-react';
import { Device } from '../stores/useNetworkStore';
import { cn } from '@/lib/utils';

interface NetworkNodeProps {
  node: Device;
  onDragStart?: (event: React.MouseEvent) => void; // Kept for compatibility if needed, but motion handles drag
  isConnecting?: boolean;
  canConnectTo?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  updatePosition: (x: number, y: number) => void;
}

const nodeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  hover: { scale: 1.1, zIndex: 50, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
  drag: { scale: 1.1, zIndex: 100, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }
};

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  node,
  isConnecting,
  canConnectTo,
  isSelected,
  onClick,
  updatePosition
}) => {
  const getNodeIcon = () => {
    switch (node.type) {
      case 'ROUTER': return <Router className="w-6 h-6" />;
      case 'SWITCH': return <Network className="w-6 h-6" />;
      case 'SERVER': return <Server className="w-6 h-6" />;
      case 'PC': return <Monitor className="w-6 h-6" />;
      case 'WIRELESS': return <Wifi className="w-6 h-6" />;
      case 'HUB': return <HardDrive className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  const getStatusColor = () => {
    if (node.status === 'error') return 'text-neon-red border-neon-red shadow-neon-red/50';
    if (isSelected) return 'text-neon-cyan border-neon-cyan shadow-neon-cyan/50';
    if (isConnecting) return 'text-neon-yellow border-neon-yellow shadow-neon-yellow/50';
    if (canConnectTo) return 'text-neon-green border-neon-green shadow-neon-green/50';
    return 'text-slate-200 border-white/10 group-hover:border-neon-blue/50';
  };

  return (
    <motion.div
      variants={nodeVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        updatePosition(node.x + info.offset.x, node.y + info.offset.y);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "absolute flex flex-col items-center justify-center cursor-move",
        "w-24 h-24" // Touch target area
      )}
      style={{ x: node.x - 48, y: node.y - 48 }} // Center pivot
    >
      {/* Node Visual */}
      <div className={cn(
        "relative w-14 h-14 rounded-2xl glass-card flex items-center justify-center transition-colors duration-300",
        "border-2",
        getStatusColor(),
        isSelected && "neon-glow shadow-[0_0_15px_rgba(6,182,212,0.5)]",
        node.status === 'error' && "animate-pulse-red"
      )}>
        {/* Glow Background */}
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-20 transition-opacity duration-300",
          isSelected ? "bg-neon-cyan opacity-40" : "bg-gradient-to-br from-neon-blue to-neon-purple opacity-0 group-hover:opacity-20"
        )} />

        {/* Icon */}
        <div className="relative z-10 text-current">
          {getNodeIcon()}
        </div>

        {/* Status Dot */}
        <div className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900",
          node.status === 'active' ? "bg-neon-green shadow-[0_0_8px_#10b981]" : "bg-neon-red"
        )} />
      </div>

      {/* Label */}
      <motion.span
        className="mt-2 text-xs font-semibold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-sm truncate max-w-[120px]"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {node.name}
      </motion.span>

      {/* Connecting Indicator */}
      {isConnecting && (
        <motion.div
          className="absolute -top-8 text-xs font-bold text-neon-yellow animate-bounce"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          CONNECTING...
        </motion.div>
      )}
    </motion.div>
  );
};

