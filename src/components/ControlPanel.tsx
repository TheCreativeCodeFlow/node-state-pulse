import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Send, Zap, AlertTriangle, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  packetLoss: number;
  corruption: number;
  latency: number;
  onPacketLossChange: (value: number) => void;
  onCorruptionChange: (value: number) => void;
  onLatencyChange: (value: number) => void;
  onSendPacket: () => void;
  onToggleNode: (nodeId: string) => void;
  activeNodes: string[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  packetLoss,
  corruption,
  latency,
  onPacketLossChange,
  onCorruptionChange,
  onLatencyChange,
  onSendPacket,
  onToggleNode,
  activeNodes,
}) => {
  return (
    <Card className="glass-card p-6 w-80 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-neon-blue mb-2">Network Control</h2>
          <p className="text-sm text-muted-foreground">Simulate network conditions</p>
        </div>

        {/* Send Packet Button */}
        <Button 
          onClick={onSendPacket}
          className={cn(
            "w-full h-14 glass text-primary-foreground font-semibold text-lg relative overflow-hidden group",
            "hover:neon-glow hover:scale-105 transition-all duration-300"
          )}
          style={{ backgroundColor: 'hsl(var(--neon-blue) / 0.8)' }}
        >
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5" />
            Send Packet
          </div>
          {/* Ripple effect */}
          <div className="absolute inset-0 -z-10 group-hover:animate-ping bg-neon-blue/30 rounded-xl" />
        </Button>

        {/* Network Parameters */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-status-error" />
              <Label className="text-sm font-medium">Packet Loss</Label>
              <span className="ml-auto text-xs text-muted-foreground">{packetLoss}%</span>
            </div>
            <Slider
              value={[packetLoss]}
              onValueChange={(value) => onPacketLossChange(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <Label className="text-sm font-medium">Corruption Rate</Label>
              <span className="ml-auto text-xs text-muted-foreground">{corruption}%</span>
            </div>
            <Slider
              value={[corruption]}
              onValueChange={(value) => onCorruptionChange(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-cyan" />
              <Label className="text-sm font-medium">Latency</Label>
              <span className="ml-auto text-xs text-muted-foreground">{latency}ms</span>
            </div>
            <Slider
              value={[latency]}
              onValueChange={(value) => onLatencyChange(value[0])}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>
        </div>

        {/* Node Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neon-green">Node Status</h3>
          {activeNodes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No nodes available</p>
          ) : (
            <div className="space-y-3">
              {activeNodes.map(nodeId => (
                <div key={nodeId} className="flex items-center justify-between">
                  <Label className="text-xs">{nodeId}</Label>
                  <Switch
                    checked={true}
                    onCheckedChange={(checked) => onToggleNode(nodeId)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neon-purple">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPacketLossChange(0);
                onCorruptionChange(0);
                onLatencyChange(10);
              }}
              className="glass text-xs"
            >
              Perfect
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPacketLossChange(5);
                onCorruptionChange(2);
                onLatencyChange(100);
              }}
              className="glass text-xs"
            >
              Typical
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPacketLossChange(20);
                onCorruptionChange(10);
                onLatencyChange(500);
              }}
              className="glass text-xs"
            >
              Poor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPacketLossChange(50);
                onCorruptionChange(25);
                onLatencyChange(1000);
              }}
              className="glass text-xs"
            >
              Critical
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};