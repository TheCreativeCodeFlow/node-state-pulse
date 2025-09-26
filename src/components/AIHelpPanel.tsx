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
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { geminiService } from '@/lib/gemini';

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
  logQuery?: string; // For analyzing specific log entries
  onLogQueryHandled?: () => void; // Callback when log query is processed
}

export const AIHelpPanel: React.FC<AIHelpPanelProps> = ({ 
  isExpanded, 
  onToggle, 
  className,
  logQuery,
  onLogQueryHandled
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! Ask me anything click on any log entry to get detailed analysis!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle log query when it changes
  React.useEffect(() => {
    if (logQuery && logQuery.trim()) {
      handleLogAnalysis(logQuery);
      onLogQueryHandled?.();
    }
  }, [logQuery, onLogQueryHandled]);

  const suggestions = [
    "How can I reduce packet loss?",
    "What's the best topology for redundancy?",
    "Explain routing protocols",
    "Help me debug connection issues"
  ];

  const handleLogAnalysis = async (logMessage: string) => {
    if (!logMessage.trim()) return;
    
    // Add user message for log analysis
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Analyze this log entry: "${logMessage}"`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const analysis = await geminiService.analyzeNetworkError(logMessage);
      
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: analysis,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error analyzing that log entry. Please make sure the Gemini API key is configured correctly.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await geminiService.getNetworkAdvice(currentInput);
      
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please make sure the Gemini API key is configured correctly.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
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
          <Bot className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="h-full flex flex-col glass-card">
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full glass-card flex items-center justify-center neon-glow">
                <Bot className="w-4 h-4 text-white" />
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
              <ChevronDown className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-border/50">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start text-xs glass-card text-white">
                <Lightbulb className="w-3 h-3 mr-1.5 text-white" />
                Tips
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs glass-card text-white">
                <HelpCircle className="w-3 h-3 mr-1.5 text-white" />
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
                disabled={!inputValue.trim() || isLoading}
                className="neon-glow-blue hover:scale-105 transition-all duration-300"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};