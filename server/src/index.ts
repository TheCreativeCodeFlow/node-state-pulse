import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Load environment variables from .env file in same directory as package.json
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import sessionsRouter from './routes/sessions';
import simulateRouter from './routes/simulate';
import logsRouter from './routes/logs';
import aiRouter from './routes/ai';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
        credentials: true
    }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/logs', logsRouter);
app.use('/api/ai', aiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

import { initializeWebSocket } from './services/websocketService';
import { setIO } from './services/ioInstance';

// Socket.IO connection handling
initializeWebSocket(io);
setIO(io); // Make io available to other modules

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`
🚀 Server ready at http://localhost:${PORT}
📡 WebSocket ready at ws://localhost:${PORT}
🔥 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

// Export for testing (but not io to avoid circular dependency)
export { app };
