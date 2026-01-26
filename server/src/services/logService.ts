import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from '@google-cloud/firestore';
import { collections } from '../config/database';
import { LogEntry, CreateLogRequest, LogQueryParams } from '../types/logs';

/**
 * Log Service with Batching
 * 
 * Batches log writes to reduce Firestore costs
 */
export class LogService {
    private static logBuffer: LogEntry[] = [];
    private static batchSize = 50;
    private static flushInterval = 5000; // 5 seconds
    private static flushTimer: NodeJS.Timeout | null = null;

    /**
     * Initialize auto-flush timer
     */
    static initialize(): void {
        if (!this.flushTimer) {
            this.flushTimer = setInterval(() => {
                this.flush();
            }, this.flushInterval);
            console.log('✅ Log service initialized with auto-flush');
        }
    }

    /**
   * Add log to buffer (batched write)
   */
    static async addLog(request: CreateLogRequest, io?: any): Promise<LogEntry> {
        const logEntry: LogEntry = {
            id: uuidv4(),
            timestamp: Date.now(),
            sessionId: request.sessionId,
            type: request.type,
            category: request.category,
            message: request.message,
            metadata: request.metadata
        };

        // Add to buffer
        this.logBuffer.push(logEntry);

        // Emit via WebSocket for real-time updates
        if (io) {
            const { emitLogEvent } = require('./websocketService');
            emitLogEvent(io, request.sessionId, logEntry);
        }

        // Flush if buffer is full
        if (this.logBuffer.length >= this.batchSize) {
            await this.flush();
        }

        return logEntry;
    }

    /**
     * Flush buffered logs to Firestore
     */
    static async flush(): Promise<void> {
        if (this.logBuffer.length === 0) return;

        const logsToWrite = [...this.logBuffer];
        this.logBuffer = [];

        try {
            // Batch write to Firestore
            const batch = collections.sessions().firestore.batch();

            logsToWrite.forEach(log => {
                const sessionRef = collections.sessions().doc(log.sessionId);
                const logRef = sessionRef.collection('logs').doc(log.id);

                batch.set(logRef, {
                    ...log,
                    timestamp: Timestamp.fromMillis(log.timestamp)
                });
            });

            await batch.commit();
            console.log(`✅ Flushed ${logsToWrite.length} logs to Firestore`);
        } catch (error) {
            console.error('Failed to flush logs:', error);
            // Put logs back in buffer on failure
            this.logBuffer.unshift(...logsToWrite);
        }
    }

    /**
     * Query logs for a session
     */
    static async getLogs(params: LogQueryParams): Promise<LogEntry[]> {
        const {
            sessionId,
            limit = 50,
            offset = 0,
            type,
            category
        } = params;

        try {
            let query = collections.sessions()
                .doc(sessionId)
                .collection('logs')
                .orderBy('timestamp', 'desc')
                .limit(limit);

            if (offset > 0) {
                query = query.offset(offset);
            }

            if (type) {
                query = query.where('type', '==', type);
            }

            if (category) {
                query = query.where('category', '==', category);
            }

            const snapshot = await query.get();

            const logs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    timestamp: data.timestamp.toMillis()
                } as LogEntry;
            });

            return logs;
        } catch (error) {
            console.error('Failed to query logs:', error);
            return [];
        }
    }

    /**
     * Clear all logs for a session (cleanup)
     */
    static async clearSessionLogs(sessionId: string): Promise<void> {
        try {
            const snapshot = await collections.sessions()
                .doc(sessionId)
                .collection('logs')
                .get();

            const batch = collections.sessions().firestore.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`✅ Cleared logs for session: ${sessionId}`);
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }

    /**
     * Shutdown - flush remaining logs
     */
    static async shutdown(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        await this.flush();
        console.log('Log service shutdown');
    }
}

// Initialize on module load
LogService.initialize();

// Graceful shutdown on process exit
process.on('SIGINT', async () => {
    await LogService.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await LogService.shutdown();
    process.exit(0);
});
