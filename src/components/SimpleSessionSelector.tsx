import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Network, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleSessionSelectorProps {
  onSessionSelected: (sessionId: string) => void;
  className?: string;
}

// Mock session data
const mockSessions = [
  {
    id: 'session-1',
    name: 'Production Network',
    nodeCount: 12,
    status: 'active',
    lastActivity: '2 minutes ago',
    health: 98.5
  },
  {
    id: 'session-2', 
    name: 'Development Environment',
    nodeCount: 6,
    status: 'idle',
    lastActivity: '1 hour ago',
    health: 95.2
  },
  {
    id: 'session-3',
    name: 'Testing Lab',
    nodeCount: 8,
    status: 'warning',
    lastActivity: '5 minutes ago',
    health: 87.3
  }
];

export const SimpleSessionSelector: React.FC<SimpleSessionSelectorProps> = ({ 
  onSessionSelected,
  className 
}) => {
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = () => {
    if (newSessionName.trim()) {
      const newSessionId = `session-${Date.now()}`;
      onSessionSelected(newSessionId);
    }
  };

  const getStatusColor = (status: string, health: number) => {
    if (status === 'active' && health > 95) return 'text-green-400 border-green-400/50';
    if (status === 'warning' || health < 90) return 'text-yellow-400 border-yellow-400/50';
    return 'text-blue-400 border-blue-400/50';
  };

  const getHealthColor = (health: number) => {
    if (health > 95) return 'text-green-400';
    if (health > 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          Node State Pulse
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a session to monitor network health
        </p>
      </div>

      {/* Create New Session */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-neon-cyan" />
            <Label className="text-lg font-semibold text-foreground">
              Create New Session
            </Label>
          </div>
          
          {isCreating ? (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter session name..."
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                className="flex-1"
                autoFocus
              />
              <Button 
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                className="bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
              >
                Create
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewSessionName('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setIsCreating(true)}
              className="w-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 border-neon-cyan/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          )}
        </div>
      </Card>

      {/* Existing Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Network className="w-5 h-5 mr-2 text-neon-purple" />
          Active Sessions
        </h2>
        
        <div className="space-y-3">
          {mockSessions.map((session) => (
            <Card 
              key={session.id}
              className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/30 transition-all duration-200 cursor-pointer group"
              onClick={() => onSessionSelected(session.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-neon-cyan transition-colors">
                      {session.name}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(session.status, session.health))}
                    >
                      {session.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{session.nodeCount} nodes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{session.lastActivity}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    <span className={getHealthColor(session.health)}>
                      {session.health}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Health</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};