import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key - In production, this should be in environment variables
const API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with actual API key

const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async analyzeNetworkError(logMessage: string, context?: string): Promise<string> {
    try {
      const prompt = `
You are a network troubleshooting expert. Analyze this network log entry and provide helpful insights:

Log Entry: "${logMessage}"
${context ? `Additional Context: ${context}` : ''}

Please provide:
1. What this error/event means
2. Possible causes
3. Recommended solutions or next steps
4. Severity level (Low/Medium/High/Critical)

Keep your response concise but informative, formatted for a network engineer.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return `I'm having trouble analyzing this log right now. Here's what I can tell you about "${logMessage}": This appears to be a network event that may require attention. Please check your network configuration and connectivity.`;
    }
  }

  async getNetworkAdvice(query: string): Promise<string> {
    try {
      const prompt = `
You are a network engineering expert. Answer this network-related question:

Question: "${query}"

Provide practical, actionable advice for network troubleshooting, optimization, or best practices. Keep your response clear and technical but accessible.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return `I'm having trouble processing your request right now. For network-related questions like "${query}", I recommend checking your network documentation or consulting with your network team.`;
    }
  }
}

export const geminiService = new GeminiService();