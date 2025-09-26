import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  Send, 
  MessageSquare, 
  ArrowRight, 
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  active: boolean;
  type: 'node';
  isSource?: boolean;
  isDestination?: boolean;
}

interface CustomMessage {
  id: string;
  sourceId: string;
  targetId: string;
  content: string;
  messageType: 'data' | 'control' | 'broadcast';
  priority: number;
  packetSize: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
}

interface CustomMessagePanelProps {
  nodes: Node[];
  onSendMessage: (message: Omit<CustomMessage, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  isLoading?: boolean;
}

export const CustomMessagePanel: React.FC<CustomMessagePanelProps> = ({
  nodes,
  onSendMessage,
  isLoading = false,
}) => {
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<'data' | 'control' | 'broadcast'>('data');
  const [priority, setPriority] = useState(1);
  const [packetSize, setPacketSize] = useState(1024);
  const [sentMessages, setSentMessages] = useState<CustomMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeNodes = nodes.filter(node => node.active);

  const handleSendMessage = async () => {
    if (!sourceId || !targetId || !content.trim()) {
      return;
    }

    const messageData = {
      sourceId,
      targetId,
      content: content.trim(),
      messageType,
      priority,
      packetSize,
    };

    try {
      await onSendMessage(messageData);
      
      // Add to local sent messages list
      const newMessage: CustomMessage = {
        ...messageData,
        id: `msg_${Date.now()}`,
        status: 'sent',
        createdAt: new Date(),
      };
      
      setSentMessages(prev => [newMessage, ...prev].slice(0, 10)); // Keep last 10 messages
      
      // Reset form
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const clearMessage = (messageId: string) => {
    setSentMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const getSourceNode = () => nodes.find(node => node.id === sourceId);
  const getTargetNode = () => nodes.find(node => node.id === targetId);

  const getStatusIcon = (status: CustomMessage['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-status-warning" />;
      case 'sent':
        return <ArrowRight className="w-3 h-3 text-neon-blue" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-status-success" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-status-error" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'data':
        return 'bg-neon-blue/20 text-neon-blue';
      case 'control':
        return 'bg-neon-purple/20 text-neon-purple';
      case 'broadcast':
        return 'bg-neon-green/20 text-neon-green';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="glass-card rounded-2xl">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-4 justify-start hover:bg-background/50 rounded-2xl"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <MessageSquare className="w-5 h-5 text-neon-blue" />
              <h3 className="font-semibold text-foreground">Custom Messages</h3>
              {activeNodes.length > 0 && (
                <Badge className="ml-auto text-xs bg-neon-blue/20 text-neon-blue">
                  {activeNodes.length} nodes
                </Badge>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-6 pb-6">
            {activeNodes.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Need at least 2 active nodes to send messages</p>
              </div>
            ) : (
              <div className="space-y-4">
          {/* Source and Destination Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source Node</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source node" />
                </SelectTrigger>
                <SelectContent>
                  {activeNodes.map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          node.isSource ? 'bg-neon-green' :
                          node.isDestination ? 'bg-neon-purple' :
                          'bg-neon-blue'
                        )} />
                        {node.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target">Destination Node</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select destination node" />
                </SelectTrigger>
                <SelectContent>
                  {activeNodes.filter(node => node.id !== sourceId).map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          node.isSource ? 'bg-neon-green' :
                          node.isDestination ? 'bg-neon-purple' :
                          'bg-neon-blue'
                        )} />
                        {node.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <Label htmlFor="content">Message Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your custom message..."
              className="mt-1 min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/500 characters
            </div>
          </div>

          {/* Message Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="messageType">Message Type</Label>
              <Select 
                value={messageType} 
                onValueChange={(value: 'data' | 'control' | 'broadcast') => setMessageType(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="control">Control</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-5)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="5"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="packetSize">Packet Size (bytes)</Label>
              <Input
                id="packetSize"
                type="number"
                min="64"
                max="65536"
                value={packetSize}
                onChange={(e) => setPacketSize(parseInt(e.target.value) || 1024)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Route Preview */}
          {sourceId && targetId && (
            <div className="glass p-3 rounded-lg border border-neon-blue/30">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Route:</span>
                <Badge className="bg-neon-blue/20 text-neon-blue text-xs">
                  {getSourceNode()?.label}
                </Badge>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <Badge className="bg-neon-green/20 text-neon-green text-xs">
                  {getTargetNode()?.label}
                </Badge>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!sourceId || !targetId || !content.trim() || isLoading}
            className="w-full h-12 glass-card neon-glow-blue hover:scale-[1.02] transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </div>
            )}
          </Button>
                
                {/* Recent Messages */}
                {sentMessages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neon-green" />
                      Recent Messages ({sentMessages.length})
                    </h4>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {sentMessages.map((message) => (
                        <div key={message.id} className="glass p-3 rounded-lg border border-border/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(message.status)}
                                <Badge className={cn("text-xs", getTypeColor(message.messageType))}>
                                  {message.messageType}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Priority: {message.priority}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <span className="text-neon-blue font-medium">
                                  {getSourceNode()?.label || message.sourceId}
                                </span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-neon-green font-medium">
                                  {getTargetNode()?.label || message.targetId}
                                </span>
                              </div>
                              
                              <p className="text-sm text-foreground truncate" title={message.content}>
                                {message.content}
                              </p>
                              
                              <div className="text-xs text-muted-foreground mt-1">
                                {message.createdAt.toLocaleTimeString()}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearMessage(message.id)}
                              className="p-1 h-auto hover:bg-destructive/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};