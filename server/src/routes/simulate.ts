import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { SessionService } from '../services/sessionService';
import { simulationEngine } from '../services/simulationEngine';
import { emitPacketEvents } from '../services/websocketService';
import { SimulatePacketRequest } from '../types/simulation';
import { getIO } from '../services/ioInstance';

const router = Router();

/**
 * Simulate packet sending
 * POST /api/simulate/packet
 * 
 * Protected route - requires valid session
 */
router.post('/packet', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { sessionId, sourceId, targetId, protocol, size }: SimulatePacketRequest & { protocol?: string; size?: number } = req.body;

        // Validate request
        if (!sessionId || !sourceId || !targetId) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: sessionId, sourceId, targetId'
            });
            return;
        }

        // Get session topology
        const session = await SessionService.getSession(sessionId);
        if (!session) {
            res.status(404).json({
                success: false,
                error: 'Session not found'
            });
            return;
        }

        // Run simulation
        const events = await simulationEngine.simulatePacket(
            { sessionId, sourceId, targetId, protocol, size },
            session.topology
        );

        // Emit events via WebSocket for real-time animation
        emitPacketEvents(getIO(), sessionId, events);

        res.json({
            success: true,
            data: {
                packetId: events[0]?.packetId,
                events,
                totalHops: events.length,
                delivered: events[events.length - 1]?.type === 'DELIVERED'
            }
        });
    } catch (error) {
        console.error('Error simulating packet:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to simulate packet'
        });
    }
});

/**
 * Get simulation configuration
 * GET /api/simulate/config
 */
router.get('/config', authenticateUser, (req: Request, res: Response) => {
    const config = simulationEngine.getConfig();
    res.json({
        success: true,
        data: config
    });
});

/**
 * Update simulation configuration
 * PATCH /api/simulate/config
 */
router.patch('/config', authenticateUser, (req: Request, res: Response) => {
    try {
        simulationEngine.updateConfig(req.body);
        const updatedConfig = simulationEngine.getConfig();

        res.json({
            success: true,
            data: updatedConfig,
            message: 'Simulation config updated'
        });
    } catch (error) {
        console.error('Error updating simulation config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update config'
        });
    }
});

export default router;
