import React, { useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Zap, 
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'packet_sent' | 'packet_delivered' | 'packet_lost' | 'packet_corrupted' | 'node_failed' | 'node_recovered';
  message: string;
  nodeId?: string;
  packetId?: string;
}

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'packet_delivered':
        return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'packet_lost':
        return <XCircle className="w-4 h-4 text-status-error" />;
      case 'packet_corrupted':
        return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      case 'node_failed':
        return <Zap className="w-4 h-4 text-status-error" />;
      case 'node_recovered':
        return <CheckCircle className="w-4 h-4 text-status-success" />;
      default:
        return <Clock className="w-4 h-4 text-neon-blue" />;
    }
  };

  const getLogBadgeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'packet_delivered':
      case 'node_recovered':
        return 'bg-status-success/20 text-status-success';
      case 'packet_lost':
      case 'node_failed':
        return 'bg-status-error/20 text-status-error';
      case 'packet_corrupted':
        return 'bg-status-warning/20 text-status-warning';
      default:
        return 'bg-neon-blue/20 text-neon-blue';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + timestamp.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <Card className="glass-card h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-neon-green">Network Logs</h2>
        <p className="text-sm text-muted-foreground">
          Real-time system events • {logs.length} entries
        </p>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Clock className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No events yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Network activity will appear here
            </p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={cn(
                "glass-card p-3 rounded-xl animate-slide-up transition-all duration-300 hover:scale-[1.02]",
                index === logs.length - 1 && "neon-glow"
              )}
              style={{
                animationDelay: `${Math.min(index * 50, 500)}ms`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs px-2 py-0.5 border-0",
                        getLogBadgeColor(log.type)
                      )}
                    >
                      {log.type.replace('_', ' ')}
                    </Badge>
                    
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground leading-relaxed">
                    {log.message}
                  </p>
                  
                  {(log.nodeId || log.packetId) && (
                    <div className="flex gap-2 mt-2">
                      {log.nodeId && (
                        <Badge variant="secondary" className="text-xs">
                          Node: {log.nodeId}
                        </Badge>
                      )}
                      {log.packetId && (
                        <Badge variant="secondary" className="text-xs">
                          Packet: {log.packetId.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};