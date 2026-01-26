/**
 * Gemini AI Service
 * 
 * Provides AI-powered assistance for network simulation.
 * Includes context-aware tutor functionality for educational guidance.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NetworkContext, formatContextForPrompt } from '../services/networkContext';
import { StudentLevel } from '../stores/useTutorStore';

// API Key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

// Debug: Log API key status (not the actual key)
console.log('Gemini API Status:', API_KEY && API_KEY !== 'YOUR_GEMINI_API_KEY' ? '✅ Configured' : '❌ Not configured');

// Initialize Gemini
const genAI = API_KEY && API_KEY !== 'YOUR_GEMINI_API_KEY' ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * System prompt for the intelligent tutor
 * Enhanced with persistent context awareness, conversational continuity, and session awareness
 */
const TUTOR_SYSTEM_PROMPT = `Act as a session-aware educational AI assistant integrated into a web-based computer network simulation platform.

SESSION AWARENESS (CRITICAL):
- The application operates using explicit user sessions with clearly defined start time, active duration, and end time
- You MUST recognize and respect session lifecycle boundaries at all times
- Use session timing information to understand the student's learning duration, interaction intensity, and progress context
- Reference session timing naturally when providing guidance (e.g., "You've been working for 45 minutes - great persistence!", "This is your third attempt in this session", "Since you just started, let's begin with...")
- When a session is ACTIVE, treat all chat history, logs, actions, and explanations as belonging strictly to that session
- When the student explicitly chooses to CLOSE the session using "End Session", immediately stop relying on that session's context
- Acknowledge session closure clearly (e.g., "Session ended. Great work today! Your progress has been saved.")
- Treat any subsequent interaction after session closure as part of a NEW session unless historical reference is explicitly requested
- NEVER leak or assume context across closed sessions unless the system explicitly provides summarized session memory
- Ensure responses remain aligned with the student's current activity window and session state

SESSION TIMING CONTEXT:
- Long sessions (>30 min): Recognize sustained effort, suggest breaks if student seems stuck
- Short sessions (<10 min): Provide quick, focused guidance for exploratory learning
- Repeated attempts in same session: Show encouragement, offer alternative approaches
- Fresh session start: Greet appropriately, establish baseline without assuming prior knowledge from closed sessions

CONVERSATIONAL CONTINUITY (WITHIN ACTIVE SESSION):
- Maintain and respect conversational continuity by using the provided chat history, past user questions, and your previous responses
- Treat the chat history as an ongoing learning session, NOT isolated messages
- AVOID repeating explanations or solutions that have already been given unless the student explicitly asks for repetition or clarification
- Continuously connect new questions to earlier discussion, previously identified mistakes, resolved issues, and progress milestones
- Assume the student remembers prior context and build upon it naturally, referencing earlier actions or conclusions where relevant
- If critical context from chat history or system logs is missing or unclear, ask a short clarifying question before providing guidance

YOUR ROLE:
- Help students learn networking concepts through their hands-on simulation experience
- Analyze the current network state, logs, and user actions to provide relevant guidance
- Be a long-term mentor who remembers what has been discussed within the active session and tracks progress over time
- Provide logically connected, non-redundant, and contextually accurate assistance throughout each session
- Respect time boundaries, support focused learning, and cleanly separate active work sessions from completed ones

RESPONSE RULES:
1. BE CONCISE by default - focus on identifying the root cause and suggesting the next actionable step
2. Keep responses SHORT (2-4 sentences) unless the student asks for detail
3. Only provide step-by-step explanations or deep theory when explicitly requested
4. Reference SPECIFIC devices, connections, and log entries by name (e.g., "ROUTER-001", "PC-234")
5. When explaining errors, use the logs as evidence
6. Guide with HINTS rather than direct answers when appropriate for learning
7. NEVER hallucinate network state - if information is missing, ask a clarifying question
8. Adapt language complexity to student level
9. Build upon previous responses and reference earlier conversation when relevant (within current session)
10. Ensure all responses remain consistent with prior advice, current simulation logs, session timing, and the student's learning trajectory
11. Reference session timing naturally when appropriate to provide encouragement or context

RESPONSE FORMAT:
- For errors: State what happened → Root cause → Next step (+ connection to prior issues if relevant + session timing context if helpful)
- For questions: Direct answer with context reference (+ relate to previous topics if applicable within session)
- For hints: Observation → Guiding question (+ reminder of related prior learning within session)
- For follow-up questions: Acknowledge the connection to previous discussion before answering
- For session start: Brief, welcoming greeting that establishes fresh context
- For session end: Clear acknowledgment, encouraging summary, confirmation that progress is saved

STUDENT LEVEL ADAPTATION:
- Beginner: Use simple terms, avoid jargon, explain concepts
- Intermediate: Use technical terms, assume basic knowledge`;

/**
 * Get system prompt adjusted for student level and detail mode
 */
const getSystemPrompt = (level: StudentLevel, wantsDetail: boolean): string => {
  let prompt = TUTOR_SYSTEM_PROMPT;

  if (level === 'beginner') {
    prompt += '\n\nCURRENT STUDENT LEVEL: Beginner - Use simple language, avoid jargon, explain terms.';
  } else {
    prompt += '\n\nCURRENT STUDENT LEVEL: Intermediate - Use technical terminology, assume networking basics.';
  }

  if (wantsDetail) {
    prompt += '\n\nDETAIL MODE: ON - Provide comprehensive explanations with theory and examples.';
  } else {
    prompt += '\n\nDETAIL MODE: OFF - Keep responses concise and action-focused.';
  }

  return prompt;
};

export class GeminiService {
  private model;
  private isEnabled: boolean;

  constructor() {
    // More robust API key check
    const hasValidKey = API_KEY &&
      API_KEY !== 'YOUR_GEMINI_API_KEY' &&
      API_KEY.length > 10;

    this.isEnabled = hasValidKey && genAI !== null;

    console.log('GeminiService initialized:', {
      hasKey: !!API_KEY,
      keyLength: API_KEY?.length || 0,
      isValid: hasValidKey,
      isEnabled: this.isEnabled
    });

    if (this.isEnabled && genAI) {
      // Try models in order of preference (newest to older stable versions)
      const modelsToTry = [
        'gemini-3-flash-preview',  // Latest Gemini 3 (if API key supports it)
        'gemini-2.5-flash',         // Current stable recommended model
        'gemini-1.5-flash',         // Older stable fallback
      ];

      let modelInitialized = false;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting to initialize model: ${modelName}`);
          this.model = genAI.getGenerativeModel({ model: modelName });
          console.log(`✅ Gemini model created successfully: ${modelName}`);
          modelInitialized = true;
          break; // Success! Stop trying
        } catch (e: any) {
          console.warn(`⚠️ Failed to create model ${modelName}:`, e.message);
          // Continue to next model
        }
      }

      if (!modelInitialized) {
        console.error('❌ Failed to initialize any Gemini model');
        this.isEnabled = false;
      }
    }
  }

  /**
   * Check if the service is enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Context-aware tutor response
   * Uses current network state to provide relevant educational guidance
   */
  async getTutorResponse(
    question: string,
    context: NetworkContext | null,
    studentLevel: StudentLevel = 'beginner',
    wantsDetail: boolean = false,
    conversationHistory: string = ''
  ): Promise<string> {
    console.log('getTutorResponse called:', { isEnabled: this.isEnabled, hasModel: !!this.model });

    if (!this.isEnabled || !this.model) {
      console.log('Using fallback response (API not enabled)');
      return this.getFallbackResponse(question, context);
    }

    try {
      const systemPrompt = getSystemPrompt(studentLevel, wantsDetail);

      let fullPrompt = systemPrompt + '\n\n';

      // Add network context if available
      if (context) {
        fullPrompt += formatContextForPrompt(context) + '\n\n';
      } else {
        fullPrompt += '=== NETWORK STATE ===\nNo network data available. The student may not have created any devices yet.\n\n';
      }

      // Add conversation history for context
      if (conversationHistory) {
        fullPrompt += '=== RECENT CONVERSATION ===\n' + conversationHistory + '\n\n';
      }

      // Add the student's question
      fullPrompt += `=== STUDENT QUESTION ===\n"${question}"\n\nProvide a helpful, educational response:`;

      console.log('Calling Gemini API...');
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      console.log('Gemini API response received');
      return response.text();
    } catch (error: any) {
      console.error('Gemini API Error:', error.message || error);
      return `I encountered an error: ${error.message || 'Unknown error'}. Please check your API key and try again.`;
    }

  }

  /**
   * Analyze a specific log entry for educational purposes
   */
  async analyzeLogEntry(
    logMessage: string,
    logType: string,
    context: NetworkContext | null,
    studentLevel: StudentLevel = 'beginner'
  ): Promise<string> {
    if (!this.isEnabled || !this.model) {
      return `This log shows: "${logMessage}". This is a ${logType} event in your network simulation.`;
    }

    try {
      const levelGuidance = studentLevel === 'beginner'
        ? 'Explain in simple terms suitable for a beginner.'
        : 'Use technical terminology appropriate for an intermediate student.';

      let prompt = `You are a network simulation tutor. Analyze this log entry for a student:

Log Entry: "${logMessage}"
Log Type: ${logType}

${levelGuidance}

`;

      if (context) {
        prompt += `Current Network Context:\n${formatContextForPrompt(context)}\n\n`;
      }

      prompt += `Provide:
1. What this log entry means (1 sentence)
2. Why it might have occurred (1-2 sentences)
3. What the student should check or do next (1 sentence)

Keep the total response under 100 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Log analysis error:', error);
      return `This log shows: "${logMessage}". This is a ${logType} event that may need attention.`;
    }
  }

  /**
   * Analyze the student's network topology
   */
  async analyzeTopology(
    context: NetworkContext,
    studentLevel: StudentLevel = 'beginner'
  ): Promise<string> {
    if (!this.isEnabled || !this.model) {
      const { totalDevices, totalConnections } = context.simulationState;
      return `Your network has ${totalDevices} device(s) and ${totalConnections} connection(s). For detailed AI analysis, please configure your Gemini API key.`;
    }

    try {
      const levelGuidance = studentLevel === 'beginner'
        ? 'Explain findings in simple, educational terms.'
        : 'Use technical terminology and assume networking knowledge.';

      const prompt = `You are a network simulation tutor. Analyze this student's network topology:

${formatContextForPrompt(context)}

${levelGuidance}

Provide a brief analysis covering:
1. Network Summary (what they've built)
2. What's working well (positive feedback)
3. Potential issues or improvements (constructive feedback)
4. One learning tip based on their current setup

Keep the response concise and encouraging. Use bullet points.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Topology analysis error:', error);
      return `Your network has ${context.simulationState.totalDevices} devices and ${context.simulationState.totalConnections} connections.`;
    }
  }

  /**
   * Get a proactive hint when an issue is detected
   */
  async getProactiveHint(
    issue: string,
    context: NetworkContext | null,
    studentLevel: StudentLevel = 'beginner'
  ): Promise<string> {
    if (!this.isEnabled || !this.model) {
      return `💡 Hint: There was an issue - "${issue}". Check your network configuration.`;
    }

    try {
      const prompt = `You are a network tutor. A student just encountered this issue:

Issue: "${issue}"

${context ? formatContextForPrompt(context) : 'No network context available.'}

Provide a brief, encouraging hint (NOT the full answer) that guides the student to discover the solution themselves. 
Format: 💡 [One short sentence hint] + [One guiding question]
Keep it under 40 words.
Student level: ${studentLevel}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return `💡 Hint: Check your network configuration related to: "${issue}"`;
    }
  }

  /**
   * Existing method: Analyze network error (kept for backwards compatibility)
   */
  async analyzeNetworkError(logMessage: string, context?: string): Promise<string> {
    if (!this.isEnabled || !this.model) {
      return `Analysis for "${logMessage}": This network event may need attention. For detailed AI analysis, configure VITE_GEMINI_API_KEY.`;
    }

    try {
      const prompt = `You are a network troubleshooting expert. Analyze this log entry briefly:

Log: "${logMessage}"
${context ? `Context: ${context}` : ''}

Provide: 1) What it means 2) Likely cause 3) Quick fix suggestion
Keep response under 80 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error:', error);
      return `Network event: "${logMessage}". Please check your configuration.`;
    }
  }

  /**
   * Existing method: Get network advice (kept for backwards compatibility)
   */
  async getNetworkAdvice(query: string): Promise<string> {
    if (!this.isEnabled || !this.model) {
      return `For "${query}": Configure VITE_GEMINI_API_KEY for detailed AI advice.`;
    }

    try {
      const prompt = `You are a network expert. Answer briefly:

Question: "${query}"

Provide practical, actionable advice. Keep response under 100 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error:', error);
      return `For network questions like "${query}", check documentation or consult your network team.`;
    }
  }

  /**
   * Fallback response when API is unavailable
   */
  private getFallbackResponse(question: string, context: NetworkContext | null): string {
    const q = question.toLowerCase();

    // Basic pattern matching for common questions
    if (q.includes('packet') && q.includes('lost')) {
      return `Packet loss can occur when there's no valid path between devices. Check that all devices are connected and links are active. ${context ? `Your network has ${context.simulationState.totalConnections} connection(s).` : ''}`;
    }

    if (q.includes('connect')) {
      return `To connect devices: 1) Select the connection tool 2) Click on the first device 3) Click on the second device. Make sure both devices are added to the canvas first.`;
    }

    if (q.includes('route') || q.includes('routing')) {
      return `Routing determines how packets travel through your network. Ensure routers are connected to create paths between different network segments.`;
    }

    return `I can help with your network simulation! ${context ? `I can see you have ${context.simulationState.totalDevices} device(s) and ${context.simulationState.totalConnections} connection(s).` : 'Add some devices to get started.'} For detailed AI responses, configure your Gemini API key (VITE_GEMINI_API_KEY) in .env.local.`;
  }
}

export const geminiService = new GeminiService();