import { useState, useEffect, useCallback } from 'react';
import { sessionAPI } from '@/services/api';
import { SessionResponse, SessionCreate } from '@/types/api';
import { toast } from 'sonner';

interface UseSessionReturn {
  session: SessionResponse | null;
  sessions: SessionResponse[];
  isLoading: boolean;
  error: string | null;
  createSession: (data: SessionCreate) => Promise<SessionResponse | null>;
  switchSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (data: SessionCreate): Promise<SessionResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newSession = await sessionAPI.create(data);
      setSession(newSession);
      setSessions(prev => [...prev, newSession]);
      
      // Store current session in localStorage
      localStorage.setItem('currentSessionId', newSession.id);
      
      toast.success(`Session created for ${data.student_name}`);
      return newSession;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create session';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchSession = useCallback(async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionData = await sessionAPI.getById(sessionId);
      setSession(sessionData);
      localStorage.setItem('currentSessionId', sessionId);
      toast.success(`Switched to session: ${sessionData.student_name}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to switch session';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSessions = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allSessions = await sessionAPI.getAll();
      setSessions(allSessions);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch sessions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sessionAPI.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If we're deleting the current session, clear it
      if (session?.id === sessionId) {
        setSession(null);
        localStorage.removeItem('currentSessionId');
      }
      
      toast.success('Session deleted');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete session';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Load sessions and restore current session on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      try {
        // Load all sessions
        const allSessions = await sessionAPI.getAll();
        setSessions(allSessions);
        
        // Try to restore current session from localStorage
        const currentSessionId = localStorage.getItem('currentSessionId');
        if (currentSessionId) {
          try {
            const currentSession = await sessionAPI.getById(currentSessionId);
            setSession(currentSession);
          } catch (err) {
            // If current session doesn't exist, remove from localStorage
            localStorage.removeItem('currentSessionId');
          }
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Backend server not available. Please ensure it\'s running on localhost:8000';
        setError(errorMessage);
        console.warn('Backend connection failed:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to avoid immediate backend calls on app start
    const timeoutId = setTimeout(loadInitialData, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  return {
    session,
    sessions,
    isLoading,
    error,
    createSession,
    switchSession,
    refreshSessions,
    deleteSession,
  };
};