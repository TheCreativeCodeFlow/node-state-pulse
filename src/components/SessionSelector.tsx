import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useSession } from '@/hooks/useSession';
import { 
  Plus, 
  User, 
  Calendar, 
  Activity,
  Trash2,
  LogIn,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SessionSelectorProps {
  onSessionSelected: (sessionId: string) => void;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  onSessionSelected,
}) => {
  const {
    session,
    sessions,
    isLoading,
    error,
    createSession,
    switchSession,
    refreshSessions,
    deleteSession,
  } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentName.trim()) {
      toast.error('Please enter a student name');
      return;
    }

    const newSession = await createSession({
      student_name: newStudentName.trim(),
      metadata_json: {
        created_from: 'frontend',
        browser: navigator.userAgent,
      },
    });

    if (newSession) {
      setNewStudentName('');
      setIsCreateDialogOpen(false);
      onSessionSelected(newSession.id);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    await switchSession(sessionId);
    onSessionSelected(sessionId);
  };

  const handleDeleteSession = async (sessionId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete the session for ${studentName}?`)) {
      await deleteSession(sessionId);
      await refreshSessions();
    }
  };

  if (session) {
    return (
      <div className="flex items-center gap-4 p-4 glass-card rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neon-blue" />
          <span className="text-sm font-medium">{session.student_name}</span>
          <Badge variant="outline" className="text-xs">
            Active Session
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          className="ml-auto"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to NetLab Explorer
        </h2>
        <p className="text-muted-foreground">
          Select an existing session or create a new one to get started
        </p>
      </div>

      {/* Create New Session */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-12 neon-glow-blue">
            <UserPlus className="w-5 h-5 mr-2" />
            Create New Session
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Enter your name to create a new learning session
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Enter your name..."
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !newStudentName.trim()}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Existing Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Existing Sessions
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSessions}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {sessions.map((sessionItem) => (
              <Card
                key={sessionItem.id}
                className="p-4 glass-card hover:neon-glow cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-neon-blue" />
                      <span className="font-medium text-foreground">
                        {sessionItem.student_name}
                      </span>
                      {sessionItem.is_active && (
                        <Badge className="text-xs bg-status-success/20 text-status-success">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(sessionItem.created_at), { 
                          addSuffix: true 
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSessionSelect(sessionItem.id)}
                      disabled={isLoading}
                      className="h-8 px-3"
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSession(sessionItem.id, sessionItem.student_name)}
                      disabled={isLoading}
                      className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Connection Error</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {error}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure the backend server is running on localhost:8000
          </p>
        </Card>
      )}

      {/* No Sessions State */}
      {!isLoading && !error && sessions.length === 0 && (
        <Card className="p-6 text-center glass-card">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-2">No Sessions Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first session to start exploring network simulation
          </p>
        </Card>
      )}
    </div>
  );
};