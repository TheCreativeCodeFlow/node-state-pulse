import React, { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { SimulatorLayout } from '@/components/SimulatorLayout';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { SessionSelector } from '@/components/SessionSelector';
import { SimpleSessionSelector } from '@/components/SimpleSessionSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, FileText } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'session' | 'dashboard' | 'simulator' | 'tabs'>('session');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSessionSelected = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentView('dashboard');
  };

  const handleBackToSessions = () => {
    setCurrentView('session');
    setCurrentSessionId(null);
  };

  if (currentView === 'session') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <SimpleSessionSelector onSessionSelected={handleSessionSelected} />
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return <Dashboard onStartSimulation={() => setCurrentView('simulator')} onBackToSessions={handleBackToSessions} />;
  }

  if (currentView === 'simulator') {
    return (
      <SimulatorLayout 
        sessionId={currentSessionId} 
        onBackToDashboard={() => setCurrentView('dashboard')} 
        onBackToSessions={handleBackToSessions}
      />
    );
  }

  // Legacy tab-based view (kept for reference)
  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <Tabs defaultValue="analytics" className="flex-1 flex flex-col">
        <div className="order-2 p-4 border-t border-border/50">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-2" onClick={() => setCurrentView('simulator')}>
              <Activity className="w-4 h-4" />
              Go to Simulator
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="order-1 flex-1 overflow-hidden">
          <TabsContent value="analytics" className="h-full m-0 overflow-y-auto">
            <AnalyticsDashboard logs={[]} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Index;