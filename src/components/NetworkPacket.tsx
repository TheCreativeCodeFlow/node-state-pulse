import React from 'react';
import { cn } from '@/lib/utils';

interface NetworkPacketProps {
  x: number;
  y: number;
  status: 'traveling' | 'delivered' | 'lost' | 'corrupted' | 'failed';
}

export const NetworkPacket: React.FC<NetworkPacketProps> = ({ x, y, status }) => {
  const getPacketStyle = () => {
    switch (status) {
      case 'delivered':
        return 'bg-status-success neon-glow-green animate-bounce-in';
      case 'lost':
        return 'bg-muted animate-fade-out';
      case 'corrupted':
        return 'bg-status-warning animate-shake';
      case 'failed':
        return 'bg-status-error animate-disintegrate';
      default:
        return 'bg-primary neon-glow';
    }
  };

  return (
    <div
      className={cn(
        "absolute w-4 h-4 rounded-full pointer-events-none transform -translate-x-2 -translate-y-2 transition-all duration-300",
        getPacketStyle()
      )}
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />
      
      {/* Particle trail for traveling packets */}
      {status === 'traveling' && (
        <div className="absolute inset-0">
          <div className="absolute w-1 h-1 bg-white/50 rounded-full -top-2 -left-1 animate-ping" />
          <div className="absolute w-0.5 h-0.5 bg-white/30 rounded-full -top-4 left-0 animate-ping delay-100" />
        </div>
      )}
    </div>
  );
};