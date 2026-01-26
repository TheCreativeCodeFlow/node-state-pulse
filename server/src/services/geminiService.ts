import { GoogleGenerativeAI } from '@google/generative-ai';
import { SessionService } from './sessionService';
import { LogService } from './logService';

interface NetworkContext {
    devices: number;
    connections: number;
    recentErrors: string[];
    sessionDuration: number;
    activitiesSummary: string;
}

/**
 * Gemini AI Service - Backend Only
 * 
 * Centralized AI service with context grounding and short responses
 */
export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private maxOutputTokens = 150; // Force concise responses

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('⚠️  GEMINI_API_KEY not configured - AI features disabled');
            console.warn('   Get API key from: https://makersuite.google.com/app/apikey');
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            console.log('✅ Gemini AI service initialized');
        } catch (error) {
            console.error('❌ Gemini initialization failed:', error);
            console.warn('   AI features will be limited');
        }
    }

    /**
     * Check if AI is available
     */
    isAvailable(): boolean {
        return this.genAI !== null;
    }

    /**
     * Build grounded prompt with network context
     */
    private buildPrompt(message: string, context: NetworkContext): string {
        return `
You are a network simulation tutor. Be EXTREMELY CONCISE (2-3 sentences maximum).

Current Network State:
- Devices: ${context.devices}
- Connections: ${context.connections}
- Recent Errors: ${context.recentErrors.length > 0 ? context.recentErrors[0] : 'None'}
- Session Duration: ${Math.floor(context.sessionDuration / 1000)}s

Student Question: ${message}

Provide a SHORT, actionable answer based ONLY on the above context. Do not make assumptions about things not shown.
    `.trim();
    }

    /**
     * Extract network context from session
     */
    private async getNetworkContext(sessionId: string): Promise<NetworkContext> {
        try {
            const session = await SessionService.getSession(sessionId);

            if (!session) {
                return {
                    devices: 0,
                    connections: 0,
                    recentErrors: [],
                    sessionDuration: 0,
                    activitiesSummary: 'No active session'
                };
            }

            // Calculate duration
            const startTime = new Date(session.startTime).getTime();
            const now = Date.now();
            const duration = now - startTime;

            // Get recent errors from logs (if available)
            const logs = await LogService.getLogs({
                sessionId,
                limit: 10,
                type: 'error'
            });

            return {
                devices: session.topology.devices.length,
                connections: session.topology.connections.length,
                recentErrors: logs.map(log => log.message).slice(0, 3),
                sessionDuration: duration,
                activitiesSummary: `${session.topology.devices.length} devices, ${session.topology.connections.length} connections`
            };
        } catch (error) {
            console.error('Failed to get network context:', error);
            return {
                devices: 0,
                connections: 0,
                recentErrors: [],
                sessionDuration: 0,
                activitiesSummary: 'Context unavailable'
            };
        }
    }

    /**
     * Chat with Gemini AI
     */
    async chat(
        sessionId: string,
        message: string,
        studentLevel: 'beginner' | 'intermediate' = 'beginner'
    ): Promise<{ response: string; tokenCount: number }> {
        // Check if AI is available
        if (!this.genAI) {
            throw new Error('AI service not configured - GEMINI_API_KEY missing');
        }

        try {
            // Get grounded context
            const context = await this.getNetworkContext(sessionId);

            // Build prompt
            const prompt = this.buildPrompt(message, context);

            // Configure model for short responses
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-pro',
                generationConfig: {
                    maxOutputTokens: this.maxOutputTokens,
                    temperature: studentLevel === 'beginner' ? 0.7 : 0.8,
                    topP: 0.9,
                    topK: 40
                }
            });

            // Generate response
            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Estimate token count (rough approximation)
            const tokenCount = Math.ceil(response.length / 4);

            console.log(`✅ AI response generated: ${tokenCount} tokens`);

            return {
                response,
                tokenCount
            };
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Failed to generate AI response');
        }
    }

    /**
     * Validate message before sending to AI
     */
    validateMessage(message: string): { valid: boolean; error?: string } {
        if (!message || message.trim().length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        if (message.length > 500) {
            return { valid: false, error: 'Message too long (max 500 characters)' };
        }

        return { valid: true };
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
