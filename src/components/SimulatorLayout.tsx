import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Settings,
  MessageSquare,
  Layout,
  Play,
  Share2,
  Save,
  Menu,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  PanelLeftOpen,
  PanelRightOpen,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { NetworkCanvas } from './NetworkCanvas';
import { ControlPanel } from './ControlPanel'; // To receive left panel content
import { LogPanel } from './LogPanel';
import { AIHelpPanel } from './AIHelpPanel';
import { CustomMessagePanel } from './CustomMessagePanel';
import { useNetworkStore, DeviceType, Packet } from '../stores/useNetworkStore';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, FileJson, Link, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeSelector } from './ModeSelector';
import { useAuth } from '../hooks/useAuth';

// Simulation Constants
const PACKET_SPEED = 0.005; // Progress per frame (approx 3-4 seconds to cross)


// Helper: BFS Pathfinding
const findPath = (
  nodes: { id: string }[],
  connections: { sourceId: string; targetId: string }[],
  startId: string,
  endId: string
): string[] | null => {
  const adjacency = new Map<string, string[]>();

  // Build graph
  connections.forEach(conn => {
    if (!adjacency.has(conn.sourceId)) adjacency.set(conn.sourceId, []);
    if (!adjacency.has(conn.targetId)) adjacency.set(conn.targetId, []);
    adjacency.get(conn.sourceId)?.push(conn.targetId);
    adjacency.get(conn.targetId)?.push(conn.sourceId);
  });

  const queue: [string, string[]][] = [[startId, [startId]]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const [currentId, path] = queue.shift()!;

    if (currentId === endId) return path;

    const neighbors = adjacency.get(currentId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return null;
};

export const SimulatorLayout = () => {
  const {
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    activeMode,
    setMode,
    devices,
    connections,
    packets,
    logs,
    addDevice,
    updateDevicePosition,
    addLog,
    addPacket,
    selectDevice,
    selectedDeviceId
  } = useNetworkStore();

  const [activeRightTab, setActiveRightTab] = useState<'logs' | 'ai'>('logs');
  const [activeLeftTab, setActiveLeftTab] = useState<'tools' | 'messages' | 'settings'>('tools');
  const [aiLogQuery, setAiLogQuery] = useState<string | null>(null);

  // Control Panel State (Local for now, could be in store)
  const [packetLoss, setPacketLoss] = useState(10);
  const [corruption, setCorruption] = useState(5);
  const [latency, setLatency] = useState(100);

  // Auth
  const { user, signOut: authSignOut } = useAuth();

  // Handle Log Click for AI
  const handleLogClick = useCallback((log: any) => {
    // Check if log is string or object (for safety)
    const message = typeof log === 'string' ? log : log.message;
    setAiLogQuery(message);
    setActiveRightTab('ai');
    if (!rightPanelOpen) toggleRightPanel();
  }, [rightPanelOpen, toggleRightPanel]);

  // Handlers
  const handleSave = () => {
    try {
      const state = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        devices,
        connections
      };
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `network-pulse-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Project saved", {
        description: "Network configuration downloaded successfully."
      });
    } catch (error) {
      toast.error("Save failed", { description: "Could not generate save file." });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied", {
        description: "Simulator URL copied to clipboard.",
        icon: <Link className="w-4 h-4" />
      });
    } catch (error) {
      toast.error("Share failed");
    }
  };

  const handleLogout = async () => {
    try {
      await authSignOut();
      toast.success("Logged out", {
        description: "You have been signed out successfully."
      });
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // Simulation Loop
  React.useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (packets.some(p => p.status === 'traveling')) {
        useNetworkStore.getState().updatePackets();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [packets]); // We depend on packets to start/stop, but updatePackets handles the state updates internal to store

  return (

    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">

      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-border bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <Network className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Node State Pulse
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-full p-1 px-2 border border-white/5">
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Play className="w-4 h-4 text-neon-green fill-current" />
            </button>
            <span className="text-xs font-mono text-slate-400 border-l border-white/10 pl-2">
              00:00:00
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Share Project"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Save Project"
          >
            <Save className="w-4 h-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {user && user.photoURL ? (
                <button className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden hover:border-neon-blue/50 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-neon-blue/50">
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <button className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-medium text-neon-cyan hover:bg-slate-700 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-neon-blue/50">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 text-slate-200">
              {/* User Info Header */}
              {user && (
                <>
                  <div className="px-2 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-10 h-10 rounded-full border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue font-semibold">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                </>
              )}

              <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-status-error focus:text-status-error"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Panel */}
        <AnimatePresence mode='wait'>
          {leftPanelOpen && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-80 border-r border-border bg-slate-900/30 backdrop-blur-sm z-40 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveLeftTab('tools')}
                    className={cn("px-3 py-1 rounded text-xs font-medium transition-colors", activeLeftTab === 'tools' ? "bg-neon-blue/20 text-neon-blue" : "text-slate-400 hover:text-white")}
                  >
                    Tools
                  </button>
                  <button
                    onClick={() => setActiveLeftTab('settings')}
                    className={cn("px-3 py-1 rounded text-xs font-medium transition-colors", activeLeftTab === 'settings' ? "bg-neon-blue/20 text-neon-blue" : "text-slate-400 hover:text-white")}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => setActiveLeftTab('messages')}
                    className={cn("px-3 py-1 rounded text-xs font-medium transition-colors", activeLeftTab === 'messages' ? "bg-neon-blue/20 text-neon-blue" : "text-slate-400 hover:text-white")}
                  >
                    Messages
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Mode Selector - Moved here for better alignment */}
                <ModeSelector mode={activeMode} onModeChange={setMode} />

                {activeLeftTab === 'tools' ? (
                  <div className="space-y-6">
                    {/* Device Library */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Add Devices</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['ROUTER', 'SWITCH', 'PC', 'SERVER', 'WIRELESS'].map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              addDevice(400, 300, type as DeviceType);
                              setMode('select');
                            }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-slate-800/20 hover:bg-slate-800/50 hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/10 transition-all group"
                          >
                            <div className="w-8 h-8 rounded mb-2 bg-slate-800 group-hover:bg-neon-blue/20 flex items-center justify-center transition-colors">
                              <Layout className="w-5 h-5 text-slate-400 group-hover:text-neon-blue" />
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-white capitalize">{type.toLowerCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Device Info (Placeholder) */}
                    <Card className="glass-card p-4">
                      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Selection</h3>
                      {selectedDeviceId ? (
                        <div className="text-sm">
                          <div className="text-neon-cyan mb-1 font-mono">ID: {selectedDeviceId.slice(0, 8)}...</div>
                          <div className="text-slate-400">Type: {devices.find(d => d.id === selectedDeviceId)?.type}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No device selected</div>
                      )}
                    </Card>
                  </div>
                ) : activeLeftTab === 'messages' ? (
                  <CustomMessagePanel
                    nodes={devices.map(d => ({ ...d, label: d.name, active: d.status === 'active', type: 'node' }))}
                    onSendMessage={async (msg) => {
                      // 1. Calculate Path
                      const path = findPath(devices, connections, msg.sourceId, msg.targetId);

                      // 2. Add packet with appropriate status
                      if (path) {
                        addPacket({
                          sourceId: msg.sourceId,
                          targetId: msg.targetId,
                          progress: 0,
                          status: 'traveling',
                          path // Pass the full path
                        });
                        addLog(`Message sent from ${msg.sourceId} to ${msg.targetId} (Hops: ${path.length - 1})`, 'info');
                      } else {
                        // Packet lost logic
                        addPacket({
                          sourceId: msg.sourceId,
                          targetId: msg.targetId,
                          progress: 0,
                          status: 'lost'
                        });
                        addLog(`Packet Lost: No path between ${msg.sourceId} and ${msg.targetId}`, 'error', msg.sourceId);
                      }
                    }}
                  />
                ) : (
                  <ControlPanel
                    packetLoss={packetLoss}
                    corruption={corruption}
                    latency={latency}
                    onPacketLossChange={setPacketLoss}
                    onCorruptionChange={setCorruption}
                    onLatencyChange={setLatency}
                    onSendPacket={() => { }}
                    onToggleNode={() => { }}
                    activeNodes={[]}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <main className="flex-1 relative bg-background overflow-hidden flex flex-col">
          {/* Toggle Buttons (Floating) */}
          <div className="absolute top-4 left-4 z-30">
            {!leftPanelOpen && (
              <button
                onClick={toggleLeftPanel}
                className="p-2 bg-slate-800/80 backdrop-blur rounded-lg border border-border/50 text-slate-400 hover:text-white shadow-lg"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
          </div>

          <NetworkCanvas
            nodes={devices}
            edges={connections}
            packets={packets}
            onNodeUpdate={(node) => updateDevicePosition(node.id, node.x, node.y)}
            onNodeCreate={(x, y) => addDevice(x, y, 'PC')}
            onNodeClick={(node) => selectDevice(node.id)}
            mode={activeMode}
          />
        </main>

        {/* Right Panel */}
        <AnimatePresence mode='wait'>
          {rightPanelOpen && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-96 border-l border-border bg-slate-900/30 backdrop-blur-sm z-40 flex flex-col"
            >
              {/* Tabs */}
              <div className="flex border-b border-border/50">
                <button
                  onClick={() => setActiveRightTab('logs')}
                  className={cn("flex-1 p-3 text-sm font-medium transition-colors", activeRightTab === 'logs' ? 'text-neon-blue border-b-2 border-neon-blue' : 'text-slate-500 hover:text-slate-300')}
                >
                  Logs
                </button>
                <button
                  onClick={() => setActiveRightTab('ai')}
                  className={cn("flex-1 p-3 text-sm font-medium transition-colors", activeRightTab === 'ai' ? 'text-neon-purple border-b-2 border-neon-purple' : 'text-slate-500 hover:text-slate-300')}
                >
                  AI Assistant
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative flex flex-col">
                {activeRightTab === 'logs' ? (
                  <div className="flex-1 min-h-0">
                    {/* Pass logs from store */}
                    <LogPanel logs={logs} onLogClick={handleLogClick} />
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <AIHelpPanel
                      isExpanded={true}
                      onToggle={() => { }}
                      logQuery={aiLogQuery}
                      onLogQueryHandled={() => setAiLogQuery(null)}
                    />
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* View Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-50 flex gap-2">
        {!rightPanelOpen && (
          <button
            onClick={toggleRightPanel}
            className="p-3 bg-slate-800/90 backdrop-blur rounded-full border border-border/50 text-slate-400 hover:text-neon-blue shadow-lg hover:shadow-neon-blue/20 transition-all"
          >
            <PanelRightOpen className="w-5 h-5" />
          </button>
        )}
      </div>

    </div>
  );
};