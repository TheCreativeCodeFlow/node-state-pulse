import React, { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { SimulatorLayout } from '@/components/SimulatorLayout';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { SessionSelector } from '@/components/SessionSelector';
import { SimpleSessionSelector } from '@/components/SimpleSessionSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, FileText } from 'lucide-react';

const SimulatorPage = () => {
  const [currentView, setCurrentView] = useState<'session' | 'dashboard' | 'simulator' | 'tabs'>('simulator');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSessionSelected = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentView('dashboard');
  };

  const handleBackToSessions = () => {
    setCurrentView('session');
    setCurrentSessionId(null);
  };

  // Directly show simulator
  return (
    <SimulatorLayout />
  );
};

export default SimulatorPage;
