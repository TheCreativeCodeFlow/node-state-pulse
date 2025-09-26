import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  AlertTriangle,
  Lightbulb,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  queryType?: string;
}

interface AIChatbotProps {
  sessionId: string;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  sessionId,
  studentId,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryType, setQueryType] = useState<string>('explain');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = 'http://localhost:3001/api';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: '1',
        type: 'ai',
        content: `Hi! I'm your AI network engineering assistant. I can help you understand network concepts, analyze your simulation logs, explain anomalies, and suggest improvements. What would you like to learn about?`,
        timestamp: new Date(),
        queryType: 'welcome'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      queryType
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Student-Id': studentId
        },
        body: JSON.stringify({
          sessionId,
          question: inputValue,
          queryType,
          context: `Session: ${sessionId}`
        })
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(),
        queryType
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('AI query failed:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I\'m currently unavailable. This might be because the AI service is not configured or there\'s a connectivity issue. You can still use the simulation features!',
        timestamp: new Date(),
        queryType: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('AI assistant is currently unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    {
      label: 'Explain Logs',
      action: () => explainLogs(),
      icon: MessageCircle,
      description: 'Get explanation of simulation logs'
    },
    {
      label: 'Analyze Anomalies',
      action: () => analyzeAnomalies(),
      icon: AlertTriangle,
      description: 'Understand network anomalies'
    },
    {
      label: 'Suggest Improvements',
      action: () => suggestImprovements(),
      icon: Lightbulb,
      description: 'Get network optimization tips'
    }
  ];

  const explainLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/explain-logs/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Student-Id': studentId
        }
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.explanation,
          timestamp: new Date(),
          queryType: 'explain'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      toast.error('Failed to explain logs');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeAnomalies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/analyze-anomalies/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Student-Id': studentId
        }
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.analysis,
          timestamp: new Date(),
          queryType: 'analyze'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      toast.error('Failed to analyze anomalies');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestImprovements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/suggest-improvements/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Student-Id': studentId
        }
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.suggestions,
          timestamp: new Date(),
          queryType: 'suggest'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      toast.error('Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Network Learning Helper</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Query Type Selector */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex gap-1">
          {['explain', 'troubleshoot', 'learn', 'analyze'].map((type) => (
            <Button
              key={type}
              variant={queryType === type ? 'default' : 'ghost'}
              size="sm"
              className="text-xs capitalize"
              onClick={() => setQueryType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-green to-neon-blue flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                <Card className={`p-3 glass-card ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-card'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  {message.queryType && message.type === 'ai' && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {message.queryType}
                    </Badge>
                  )}
                </Card>
                <div className={`text-xs text-muted-foreground mt-1 ${
                  message.type === 'user' ? 'text-right' : ''
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-purple to-neon-orange flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-green to-neon-blue flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <Card className="p-3 glass-card bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse animation-delay-100"></div>
                    <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse animation-delay-200"></div>
                  </div>
                  AI is thinking...
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground mb-2">Quick Actions:</div>
        <div className="flex gap-1">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              className="text-xs flex-1"
              onClick={action.action}
              disabled={isLoading}
              title={action.description}
            >
              <action.icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Ask about ${queryType === 'explain' ? 'network concepts' : 
                         queryType === 'troubleshoot' ? 'network issues' : 
                         queryType === 'learn' ? 'learning topics' : 'network analysis'}...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3"
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
  );
};