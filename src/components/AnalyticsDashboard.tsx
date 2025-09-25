import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogEntry } from './LogPanel';

interface AnalyticsDashboardProps {
  logs: LogEntry[];
}

interface KPI {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ logs }) => {
  const analytics = useMemo(() => {
    const packetLogs = logs.filter(log => 
      log.type.startsWith('packet_') && log.type !== 'packet_sent'
    );
    
    const delivered = logs.filter(log => log.type === 'packet_delivered').length;
    const lost = logs.filter(log => log.type === 'packet_lost').length;
    const corrupted = logs.filter(log => log.type === 'packet_corrupted').length;
    const total = delivered + lost + corrupted;
    
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    const lossRate = total > 0 ? ((lost + corrupted) / total) * 100 : 0;
    
    // Calculate average latency (simulated)
    const avgLatency = total > 0 ? Math.floor(Math.random() * 100) + 50 : 0;
    
    // Find most failing node
    const nodeFailures = logs
      .filter(log => log.type === 'node_failed' && log.nodeId)
      .reduce((acc, log) => {
        if (log.nodeId) {
          acc[log.nodeId] = (acc[log.nodeId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    
    const topFailingNode = Object.entries(nodeFailures)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
      deliveryRate,
      lossRate,
      avgLatency,
      topFailingNode,
      totalPackets: total,
      delivered,
      lost,
      corrupted,
    };
  }, [logs]);

  const kpis: KPI[] = [
    {
      label: 'Delivery Rate',
      value: `${analytics.deliveryRate.toFixed(1)}%`,
      change: analytics.deliveryRate - 85, // Compare to baseline
      trend: analytics.deliveryRate >= 90 ? 'up' : analytics.deliveryRate >= 70 ? 'neutral' : 'down',
      icon: CheckCircle,
      color: 'neon-green',
    },
    {
      label: 'Loss Rate',
      value: `${analytics.lossRate.toFixed(1)}%`,
      change: analytics.lossRate - 10, // Compare to baseline
      trend: analytics.lossRate <= 5 ? 'up' : analytics.lossRate <= 15 ? 'neutral' : 'down',
      icon: AlertCircle,
      color: 'status-error',
    },
    {
      label: 'Avg Latency',
      value: `${analytics.avgLatency}ms`,
      change: analytics.avgLatency - 100, // Compare to baseline
      trend: analytics.avgLatency <= 50 ? 'up' : analytics.avgLatency <= 150 ? 'neutral' : 'down',
      icon: Clock,
      color: 'neon-cyan',
    },
    {
      label: 'Total Packets',
      value: analytics.totalPackets.toString(),
      change: analytics.totalPackets - (logs.length > 10 ? 5 : 0),
      trend: 'up',
      icon: Activity,
      color: 'neon-blue',
    },
  ];

  const AnimatedCounter: React.FC<{ value: string; className?: string }> = ({ 
    value, 
    className 
  }) => {
    return (
      <span className={cn("font-bold text-2xl animate-spring", className)}>
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neon-purple mb-2">
          Network Analytics
        </h2>
        <p className="text-muted-foreground">
          Real-time performance insights and metrics
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card 
            key={kpi.label}
            className="glass-card p-6 hover:neon-glow transition-all duration-300 hover:scale-105"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-2 rounded-xl glass"
                style={{ 
                  backgroundColor: `hsl(var(--${kpi.color}) / 0.1)`,
                  borderColor: `hsl(var(--${kpi.color}) / 0.3)`,
                }}
              >
                <kpi.icon className="w-5 h-5" />
              </div>
              
              <div className="flex items-center gap-1">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-status-success" />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-status-error" />
                ) : (
                  <Activity className="w-4 h-4 text-muted-foreground" />
                )}
                <span 
                  className={cn(
                    "text-xs font-medium",
                    kpi.trend === 'up' && "text-status-success",
                    kpi.trend === 'down' && "text-status-error",
                    kpi.trend === 'neutral' && "text-muted-foreground"
                  )}
                >
                  {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}
                </span>
              </div>
            </div>
            
            <div>
              <AnimatedCounter value={kpi.value} className="block mb-1" />
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packet Breakdown */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold text-neon-green mb-4">
            Packet Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-success" />
                <span className="text-sm">Delivered</span>
              </div>
              <Badge variant="outline" className="bg-status-success/20 text-status-success">
                {analytics.delivered}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-error" />
                <span className="text-sm">Lost</span>
              </div>
              <Badge variant="outline" className="bg-status-error/20 text-status-error">
                {analytics.lost}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-warning" />
                <span className="text-sm">Corrupted</span>
              </div>
              <Badge variant="outline" className="bg-status-warning/20 text-status-warning">
                {analytics.corrupted}
              </Badge>
            </div>
          </div>
        </Card>

        {/* System Status */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold text-neon-orange mb-4">
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Network Health</span>
              <Badge 
                variant="outline" 
                className={cn(
                  analytics.deliveryRate >= 90 
                    ? "bg-status-success/20 text-status-success"
                    : analytics.deliveryRate >= 70
                    ? "bg-status-warning/20 text-status-warning"
                    : "bg-status-error/20 text-status-error"
                )}
              >
                {analytics.deliveryRate >= 90 ? 'Excellent' 
                  : analytics.deliveryRate >= 70 ? 'Good' 
                  : 'Poor'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Top Failing Node</span>
              <Badge variant="outline" className="bg-muted/20 text-muted-foreground">
                {analytics.topFailingNode}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">System Uptime</span>
              <Badge variant="outline" className="bg-neon-blue/20 text-neon-blue">
                99.9%
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};