import React from 'react';

interface NetworkEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const NetworkEdge: React.FC<NetworkEdgeProps> = ({ x1, y1, x2, y2 }) => {
  return (
    <g>
      {/* Glow effect */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--neon-blue))"
        strokeWidth="4"
        opacity="0.3"
        filter="blur(2px)"
      />
      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--neon-blue))"
        strokeWidth="2"
        opacity="0.8"
        strokeDasharray="5,3"
        className="animate-pulse"
      />
      {/* Animated pulse */}
      <circle
        r="3"
        fill="hsl(var(--neon-blue))"
        opacity="0.8"
      >
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={`M ${x1} ${y1} L ${x2} ${y2}`}
        />
      </circle>
    </g>
  );
};