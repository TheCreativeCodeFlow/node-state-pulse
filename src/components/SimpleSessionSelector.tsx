import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Plus, 
  User, 
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SimpleSessionSelectorProps {
  onSessionSelected: (sessionId: string) => void;
}

export const SimpleSessionSelector: React.FC<SimpleSessionSelectorProps> = ({
  onSessionSelected,
}) => {
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      toast.error('Please enter a student name');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create a simple session ID for demo purposes
      const sessionId = `session_${Date.now()}`;
      
      // Store the session info locally
      localStorage.setItem('currentSessionId', sessionId);
      localStorage.setItem('currentStudentName', studentName.trim());
      
      toast.success(`Session created for ${studentName.trim()}`);
      onSessionSelected(sessionId);
    } catch (error) {
      toast.error('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to NetLab Explorer
        </h2>
        <p className="text-muted-foreground">
          Enter your name to start exploring network simulation
        </p>
      </div>

      {/* Create Session Form */}
      <Card className="p-6 glass-card">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="text-center mb-4">
            <UserPlus className="w-12 h-12 text-neon-blue mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">Create Session</h3>
          </div>
          
          <div>
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name..."
              className="mt-1"
              autoFocus
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !studentName.trim()}
            className="w-full h-12 neon-glow-blue"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Start Learning
              </div>
            )}
          </Button>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="p-4 glass-card border-info/50 bg-info/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">Quick Start Mode</p>
            <p className="text-muted-foreground">
              This creates a local session for immediate use. Your work will be saved locally in your browser.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};