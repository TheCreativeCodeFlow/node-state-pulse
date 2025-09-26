import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Database,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isBackendConnected: boolean;
  isWebSocketConnected: boolean;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  sessionId?: string | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isBackendConnected,
  isWebSocketConnected,
  isLoading,
  error,
  onRetry,
  sessionId,
}) => {
  const hasError = !!error;
  const allConnected = isBackendConnected && isWebSocketConnected;

  return (
    <Card className={cn(
      "p-4 transition-all duration-300",
      hasError ? "border-destructive/50 bg-destructive/5" : 
      allConnected ? "border-status-success/50 bg-status-success/5" :
      "border-warning/50 bg-warning/5"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : hasError ? (
            <AlertCircle className="w-5 h-5 text-destructive" />
          ) : allConnected ? (
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-status-success" />
              <Wifi className="w-4 h-4 text-status-success" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isBackendConnected ? (
                <Database className="w-4 h-4 text-status-success" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              {isWebSocketConnected ? (
                <Wifi className="w-4 h-4 text-status-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive" />
              )}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isLoading ? 'Connecting...' :
                 hasError ? 'Connection Error' :
                 allConnected ? 'Connected' : 'Partial Connection'}
              </span>
              
              {allConnected && (
                <Badge className="text-xs bg-status-success/20 text-status-success">
                  Ready
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {hasError ? error :
               `Backend: ${isBackendConnected ? 'Connected' : 'Disconnected'} | 
                WebSocket: ${isWebSocketConnected ? 'Connected' : 'Disconnected'}`}
            </div>

            {sessionId && (
              <div className="text-xs text-muted-foreground mt-1">
                Session: {sessionId}
              </div>
            )}
          </div>
        </div>

        {(hasError || !allConnected) && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isLoading}
            className="h-8 px-3"
          >
            <RefreshCw className={cn(
              "w-3 h-3 mr-1",
              isLoading && "animate-spin"
            )} />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
};