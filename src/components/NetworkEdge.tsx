import React from 'react';
import { motion } from 'framer-motion';

interface NetworkEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type?: 'ETHERNET' | 'WIFI' | 'FIBER';
  status?: 'active' | 'down' | 'congested';
}

export const NetworkEdge: React.FC<NetworkEdgeProps> = ({
  x1,
  y1,
  x2,
  y2,
  type = 'ETHERNET',
  status = 'active'
}) => {
  const isWifi = type === 'WIFI';

  return (
    <g>
      {/* Glow effect for active lines */}
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={status === 'active' ? (isWifi ? '#00d9ff' : '#00d9ff') : '#ef4444'}
        strokeWidth={isWifi ? 1 : 4}
        strokeOpacity={0.2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.2 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Main Connection Line */}
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={status === 'active' ? 'url(#gradient-line)' : '#ef4444'}
        strokeWidth={2}
        strokeDasharray={isWifi ? "5 5" : undefined}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Define Gradient */}
      <defs>
        <linearGradient id="gradient-line" gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00d9ff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </g>
  );
};