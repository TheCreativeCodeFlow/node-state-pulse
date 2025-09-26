import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Network Analytics</h1>
        <Badge variant="outline" className="text-neon-cyan border-neon-cyan/50">
          Real-time Data
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Network Health */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Network Health</p>
              <p className="text-2xl font-bold text-foreground">98.5%</p>
            </div>
          </div>
        </Card>

        {/* Packet Loss */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Packet Loss</p>
              <p className="text-2xl font-bold text-foreground">1.2%</p>
            </div>
          </div>
        </Card>

        {/* Throughput */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Throughput</p>
              <p className="text-2xl font-bold text-foreground">1.2 Gbps</p>
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold text-foreground">247</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Network Traffic</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Traffic analytics chart would go here</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Error Rates</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Error rate analytics would go here</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};