import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { LogService } from '../services/logService';
import { CreateLogRequest, LogQueryParams } from '../types/logs';
import { getIO } from '../services/ioInstance';

const router = Router();

/**
 * Create a log entry (batched)
 * POST /api/logs
 */
router.post('/', authenticateUser, async (req: Request, res: Response) => {
    try {
        const logRequest: CreateLogRequest = req.body;

        if (!logRequest.sessionId || !logRequest.message || !logRequest.type) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: sessionId, message, type'
            });
            return;
        }

        const logEntry = await LogService.addLog(logRequest, getIO());

        res.status(201).json({
            success: true,
            data: logEntry,
            message: 'Log added to batch queue'
        });
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create log'
        });
    }
});

/**
 * Get logs for a session
 * GET /api/logs/:sessionId
 */
router.get('/:sessionId', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { limit, offset, type, category } = req.query;

        const params: LogQueryParams = {
            sessionId,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
            type: type as any,
            category: category as any
        };

        const logs = await LogService.getLogs(params);

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch logs'
        });
    }
});

/**
 * Clear logs for a session
 * DELETE /api/logs/:sessionId
 */
router.delete('/:sessionId', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        await LogService.clearSessionLogs(sessionId);

        res.json({
            success: true,
            message: 'Session logs cleared'
        });
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear logs'
        });
    }
});

export default router;
