import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

/**
 * Verify authentication token
 * POST /api/auth/verify
 * 
 * Protected route - requires valid Firebase ID token
 */
router.post('/verify', authenticateUser, (req: Request, res: Response) => {
    // If we reach here, authentication was successful
    res.json({
        success: true,
        user: {
            uid: req.user!.uid,
            email: req.user!.email,
            role: req.user!.role
        }
    });
});

/**
 * Get current user info
 * GET /api/auth/me
 * 
 * Protected route - returns current authenticated user info
 */
router.get('/me', authenticateUser, (req: Request, res: Response) => {
    res.json({
        uid: req.user!.uid,
        email: req.user!.email,
        role: req.user!.role
    });
});

export default router;
