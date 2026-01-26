import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
                role: 'student' | 'teacher';
            };
        }
    }
}

/**
 * Authentication middleware - validates Firebase ID tokens
 * 
 * Usage: Add to routes that require authentication
 * Example: router.get('/protected', authenticateUser, handler)
 */
export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Check if Firebase is initialized
        if (admin.apps.length === 0) {
            res.status(503).json({
                error: 'Authentication service unavailable',
                message: 'Firebase Admin SDK not initialized. Check server configuration.'
            });
            return;
        }

        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the token with Firebase
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Extract user info
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: (decodedToken.role as 'student' | 'teacher') || 'student' // Default to student
        };

        console.log(`✅ Authenticated user: ${req.user.uid} (${req.user.role})`);
        next();
    } catch (error) {
        console.error('❌ Authentication failed:', error);

        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            } else if (error.message.includes('invalid')) {
                res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
            } else {
                res.status(401).json({ error: 'Authentication failed' });
            }
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/**
 * Role-based authorization middleware
 * 
 * Usage: Add after authenticateUser
 * Example: router.delete('/admin', authenticateUser, requireRole('teacher'), handler)
 */
export const requireRole = (role: 'student' | 'teacher') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (req.user.role !== role) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: role,
                current: req.user.role
            });
            return;
        }

        next();
    };
};
