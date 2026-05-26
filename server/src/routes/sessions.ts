import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { SessionService } from '../services/sessionService';
import { CreateSessionRequest, UpdateSessionRequest } from '../types/session';

const router = Router();

/**
 * Create a new session
 * POST /api/sessions
 * 
 * TEMPORARY: Auth bypass for testing when Firebase is not configured
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        // TEMPORARY: If Firebase not initialized, use test user
        let userId: string;

        if (req.user?.uid) {
            userId = req.user.uid;
        } else {
            // Fallback to test user when Firebase auth isn't working
            console.warn('⚠️ Using test user - Firebase auth not available');
            userId = 'test-user-123';
        }

        const data: CreateSessionRequest = req.body;

        // Validate required name field
        if (!data.name || !data.name.trim()) {
            res.status(400).json({
                success: false,
                error: 'Session name is required'
            });
            return;
        }

        const session = await SessionService.createSession(userId, data);

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create session'
        });
    }
});

/**
 * Get session by ID
 * GET /api/sessions/:id
 */
router.get('/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const session = await SessionService.getSession(id);

        if (!session) {
            res.status(404).json({
                success: false,
                error: 'Session not found'
            });
            return;
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch session'
        });
    }
});

/**
 * Update session (debounced topology updates, config changes)
 * PATCH /api/sessions/:id
 */
router.patch('/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates: UpdateSessionRequest = req.body;

        const session = await SessionService.updateSession(id, updates);

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update session'
        });
    }
});

/**
 * End a session
 * POST /api/sessions/:id/end
 */
router.post('/:id/end', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const session = await SessionService.endSession(id);

        res.json({
            success: true,
            data: session,
            message: 'Session ended successfully'
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session'
        });
    }
});

/**
 * Join a collaborative session
 * POST /api/sessions/:id/join
 */
router.post('/:id/join', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.uid;
        const { role, displayName } = req.body;

        const session = await SessionService.joinSession(id, userId, role || 'student', displayName);

        res.json({
            success: true,
            data: session,
            message: 'Joined session successfully'
        });
    } catch (error) {
        console.error('Error joining session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to join session'
        });
    }
});

/**
 * Get all sessions for current user
 * GET /api/sessions
 */
router.get('/', authenticateUser, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.uid;
        const sessions = await SessionService.getUserSessions(userId);

        res.json({
            success: true,
            data: sessions,
            count: sessions.length
        });
    } catch (error) {
        console.error('Error fetching user sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sessions'
        });
    }
});

/**
 * Delete a session (admin/cleanup)
 * DELETE /api/sessions/:id
 */
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await SessionService.deleteSession(id);

        res.json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete session'
        });
    }
});

export default router;
