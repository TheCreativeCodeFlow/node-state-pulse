import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageCircle, 
  ChevronDown,
  ChevronUp,
  Lightbulb,
  HelpCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIHelpPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export const AIHelpPanel: React.FC<AIHelpPanelProps> = ({ 
  isExpanded, 
  onToggle, 
  className 
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI network assistant. Ask me anything about network topology, packet routing, or simulation strategies.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    "How can I reduce packet loss?",
    "What's the best topology for redundancy?",
    "Explain routing protocols",
    "Help me debug connection issues"
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're asking about "${inputValue}". Based on your current network setup, I recommend implementing proper error handling and considering redundant paths for better reliability.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Floating AI Button (when collapsed) */}
      {!isExpanded && (
        <Button
          onClick={onToggle}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full glass-card neon-glow-blue hover:scale-110 transition-all duration-300 z-50"
          size="icon"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="h-full flex flex-col glass-card">
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full glass-card flex items-center justify-center neon-glow">
                <Bot className="w-4 h-4 text-neon-blue" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Always ready to help</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-background/50"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-border/50">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start text-xs glass-card">
                <Lightbulb className="w-3 h-3 mr-1.5" />
                Tips
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs glass-card">
                <HelpCircle className="w-3 h-3 mr-1.5" />
                Help
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex animate-slide-up",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      message.type === 'user'
                        ? "bg-primary text-primary-foreground ml-4"
                        : "glass-card mr-4"
                    )}
                  >
                    {message.type === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3 h-3 text-neon-blue" />
                        <span className="text-xs font-medium text-neon-blue">AI Assistant</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3">Quick questions:</p>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(suggestion)}
                    className="w-full justify-start text-xs glass-card hover:neon-glow"
                  >
                    <MessageCircle className="w-3 h-3 mr-2" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="glass-card border-border/30 focus:border-neon-blue/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="neon-glow-blue hover:scale-105 transition-all duration-300"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};