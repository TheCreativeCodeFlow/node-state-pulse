import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Link, 
  Trash2, 
  Hand, 
  MousePointer2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SimulationMode = 'select' | 'add' | 'connect' | 'delete';

interface ModeSelectorProps {
  mode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  className?: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  mode, 
  onModeChange, 
  className 
}) => {
  const modes = [
    {
      id: 'select' as const,
      icon: MousePointer2,
      label: 'Select',
      shortcut: 'V',
      color: 'neon-blue',
      description: 'Select and move nodes'
    },
    {
      id: 'add' as const,
      icon: Plus,
      label: 'Add Node',
      shortcut: 'A',
      color: 'neon-green',
      description: 'Click to create nodes'
    },
    {
      id: 'connect' as const,
      icon: Link,
      label: 'Connect',
      shortcut: 'C',
      color: 'neon-purple',
      description: 'Link nodes together'
    },
    {
      id: 'delete' as const,
      icon: Trash2,
      label: 'Delete',
      shortcut: 'D',
      color: 'status-error',
      description: 'Remove nodes or edges'
    }
  ];

  return (
    <div className={cn("glass-card p-4 rounded-2xl", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-neon-blue" />
        <h3 className="font-semibold text-foreground">Mode</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {modes.map((modeConfig) => {
          const IconComponent = modeConfig.icon;
          const isActive = mode === modeConfig.id;
          
          return (
            <Button
              key={modeConfig.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(modeConfig.id)}
              className={cn(
                "group flex flex-col items-center gap-2 h-auto p-3 transition-all duration-300",
                isActive 
                  ? "neon-glow border-0" 
                  : "glass-card border-border/30 hover:border-neon-blue/50 hover:scale-105"
              )}
              style={{
                backgroundColor: isActive 
                  ? `hsl(var(--${modeConfig.color}) / 0.2)` 
                  : undefined,
                borderColor: isActive 
                  ? `hsl(var(--${modeConfig.color}) / 0.5)` 
                  : undefined,
              }}
              title={modeConfig.description}
            >
              <div className="flex items-center gap-2">
                <IconComponent 
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                  style={{
                    color: isActive ? `hsl(var(--${modeConfig.color}))` : undefined
                  }}
                />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {modeConfig.label}
                </span>
              </div>
              
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] px-1.5 py-0.5 opacity-70",
                  isActive && "opacity-90"
                )}
              >
                {modeConfig.shortcut}
              </Badge>
            </Button>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 rounded-xl bg-background/50 border border-border/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {modes.find(m => m.id === mode)?.description}
        </p>
      </div>
    </div>
  );
};