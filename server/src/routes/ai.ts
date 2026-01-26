import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { geminiService } from '../services/geminiService';
import { SessionService } from '../services/sessionService';

const router = Router();

/**
 * Chat with AI (context-grounded)
 * POST /api/ai/chat
 * 
 * Protected route - requires session and auth
 */
router.post('/chat', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { sessionId, message, studentLevel } = req.body;

        // Validate request
        if (!sessionId || !message) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: sessionId, message'
            });
            return;
        }

        // Validate message
        const validation = geminiService.validateMessage(message);
        if (!validation.valid) {
            res.status(400).json({
                success: false,
                error: validation.error
            });
            return;
        }

        // Verify session exists
        const session = await SessionService.getSession(sessionId);
        if (!session) {
            res.status(404).json({
                success: false,
                error: 'Session not found'
            });
            return;
        }

        // Generate AI response
        const result = await geminiService.chat(
            sessionId,
            message,
            studentLevel || 'beginner'
        );

        res.json({
            success: true,
            data: {
                response: result.response,
                tokenCount: result.tokenCount,
                contextUsed: true
            }
        });
    } catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate AI response'
        });
    }
});

/**
 * Get AI configuration
 * GET /api/ai/config
 */
router.get('/config', authenticateUser, (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            maxTokens: 150,
            models: ['gemini-pro'],
            supportedLevels: ['beginner', 'intermediate']
        }
    });
});

export default router;
