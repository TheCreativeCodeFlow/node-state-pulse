/**
 * AI Help Panel - Intelligent Tutor
 * 
 * Improved UI with better visibility and chat experience
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Bot,
  Send,
  Sparkles,
  MessageCircle,
  X,
  Lightbulb,
  HelpCircle,
  Loader2,
  Eye,
  Network,
  BookOpen,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { geminiService } from '@/lib/gemini';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useTutorStore, StudentLevel } from '@/stores/useTutorStore';
import { collectNetworkContext, NetworkContext } from '@/services/networkContext';

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  contextUsed?: boolean;
}

interface AIHelpPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  logQuery?: string;
  onLogQueryHandled?: () => void;
}

export const AIHelpPanel: React.FC<AIHelpPanelProps> = ({
  isExpanded,
  onToggle,
  className,
  logQuery,
  onLogQueryHandled
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Network state
  const devices = useNetworkStore(state => state.devices);
  const connections = useNetworkStore(state => state.connections);
  const packets = useNetworkStore(state => state.packets);
  const logs = useNetworkStore(state => state.logs);
  const isSimulating = useNetworkStore(state => state.isSimulating);

  // Tutor preferences
  const { studentLevel, setStudentLevel, detailMode } = useTutorStore();

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'ai',
        content: `👋 Hi! I'm your AI network tutor.\n\nI can see your network and help you learn. Try:\n• "Analyze my network"\n• "Why did my packet fail?"\n• Click any log entry\n\nMode: ${studentLevel === 'beginner' ? '🌱 Beginner' : '🚀 Intermediate'}`,
        timestamp: new Date(),
        contextUsed: false
      }]);
    }
  }, []);

  // Get current network context
  const getContext = (): NetworkContext | null => {
    if (devices.length === 0) return null;
    return collectNetworkContext(devices, connections, packets, logs, isSimulating);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle log query
  useEffect(() => {
    if (logQuery && logQuery.trim()) {
      handleLogAnalysis(logQuery);
      onLogQueryHandled?.();
    }
  }, [logQuery, onLogQueryHandled]);

  // Get suggestions
  const getSuggestions = () => {
    const hasDevices = devices.length > 0;
    const hasErrors = logs.some(l => l.type === 'error' || l.type === 'packet_lost');

    if (!hasDevices) {
      return ["How do I add devices?", "What topology should I use?"];
    }
    if (hasErrors) {
      return ["Why did my packet fail?", "Analyze my network"];
    }
    return ["Analyze my network", "Give me a tip"];
  };

  // Handle log analysis
  const handleLogAnalysis = async (logMessage: string) => {
    if (!logMessage.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `📋 "${logMessage}"`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const context = getContext();
      const logType = logs.find(l => l.message === logMessage)?.type || 'info';
      const analysis = await geminiService.analyzeLogEntry(logMessage, logType, context, studentLevel);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: analysis,
        timestamp: new Date(),
        contextUsed: true
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I had trouble analyzing that log.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending message
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
      const context = getContext();
      const lcInput = currentInput.toLowerCase();
      let response: string;

      if (lcInput.includes('analyze') && (lcInput.includes('network') || lcInput.includes('topology'))) {
        if (context) {
          response = await geminiService.analyzeTopology(context, studentLevel);
        } else {
          response = "Add some devices first, then I can analyze your network!";
        }
      } else {
        const conversationContext = messages
          .slice(-6)
          .map(m => `${m.type === 'user' ? 'Student' : 'Tutor'}: ${m.content.slice(0, 150)}`)
          .join('\n');

        response = await geminiService.getTutorResponse(
          currentInput,
          context,
          studentLevel,
          detailMode,
          conversationContext
        );
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        contextUsed: !!context
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      type: 'ai',
      content: `Chat cleared! Ask me anything about your network. 🔄`,
      timestamp: new Date()
    }]);
  };

  // Toggle student level
  const toggleLevel = () => {
    const newLevel: StudentLevel = studentLevel === 'beginner' ? 'intermediate' : 'beginner';
    setStudentLevel(newLevel);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'ai',
      content: `Switched to ${newLevel === 'beginner' ? '🌱 Beginner' : '🚀 Intermediate'} mode.`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className={cn("h-full", className)}>
      {/* Floating AI Button (when collapsed) */}
      {!isExpanded && (
        <Button
          onClick={onToggle}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple shadow-lg shadow-neon-blue/30 hover:scale-110 hover:shadow-xl hover:shadow-neon-blue/40 transition-all duration-300 z-50"
          size="icon"
        >
          <Bot className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700/50">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-800/50 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI Tutor</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>{devices.length} devices • {connections.length} links</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLevel}
                  className="h-8 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  {studentLevel === 'beginner' ? '🌱' : '🚀'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#475569 rgba(15, 23, 42, 0.5)',
              maxHeight: 'calc(100vh - 280px)'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] p-4 rounded-2xl shadow-lg",
                    message.type === 'user'
                      ? "bg-gradient-to-br from-neon-blue to-blue-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-slate-700/50"
                  )}
                >
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                      <Sparkles className="w-4 h-4 text-neon-cyan" />
                      <span className="text-xs font-medium text-neon-cyan">AI Tutor</span>
                      {message.contextUsed && (
                        <Badge className="text-[10px] py-0 px-1.5 bg-green-500/20 text-green-400 border-green-500/30">
                          <Eye className="w-2.5 h-2.5 mr-1" />
                          context
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div className="text-[10px] opacity-50 mt-2 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
                    <span className="text-sm text-slate-300">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
              <div className="flex flex-wrap gap-2">
                {getSuggestions().map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(suggestion)}
                    className="text-xs h-8 bg-slate-800/50 border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-700/50 hover:border-neon-blue/50"
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your network..."
                className="flex-1 bg-slate-900 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-neon-blue/50 focus:ring-neon-blue/20"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-neon-blue to-blue-600 hover:from-neon-blue hover:to-neon-purple text-white px-4 shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/30 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};