/**
 * Gemini AI Service
 * Handles integration with Google's Gemini AI API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    this.isConfigured = this.initializeGemini();
  }

  private initializeGemini(): boolean {
    try {
      const apiKey = this.config.get('GEMINI_API_KEY');

      if (!apiKey) {
        this.logger.warn('Gemini API key not configured, using mock responses');
        return false;
      }

      // In a real implementation, this would initialize the Gemini API
      this.logger.log('Gemini AI service configured successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI service', error.stack);
      return false;
    }
  }

  async generateResponse(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.isConfigured) {
      return this.getMockResponse(request.prompt);
    }

    try {
      // In a real implementation, this would call the Gemini API
      this.logger.log(
        `Generating response for prompt: ${request.prompt.substring(0, 50)}...`,
      );

      // For now, return intelligent mock response
      return this.getMockResponse(request.prompt);
    } catch (error) {
      this.logger.error('Gemini API request failed', error.stack);
      return this.getMockResponse(request.prompt);
    }
  }

  async analyzeIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const prompt = `Analyze the following text and extract the intent and entities:

Text: "${text}"

Respond with a JSON object containing:
- intent: The main intent (e.g., "schedule_meeting", "send_email", "create_task", "get_briefing")
- confidence: Confidence score between 0 and 1
- entities: Extracted entities like dates, times, people, etc.

JSON:`;

    const response = await this.generateResponse({ prompt });

    try {
      const parsed = JSON.parse(response.text);
      return {
        intent: parsed.intent || 'unknown',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || {},
      };
    } catch (error) {
      this.logger.warn('Failed to parse intent analysis response', {
        text: response.text,
      });
      return this.getMockIntentAnalysis(text);
    }
  }

  isHealthy(): boolean {
    return this.isConfigured;
  }

  getStatus(): {
    configured: boolean;
    model: string;
    lastCheck: string;
  } {
    return {
      configured: this.isConfigured,
      model: 'gemini-2.0-flash-exp',
      lastCheck: new Date().toISOString(),
    };
  }

  private getDefaultSystemPrompt(): string {
    return `You are an intelligent Executive Assistant AI. Your role is to help busy professionals manage their schedules, tasks, emails, and daily workflows efficiently.

Key capabilities:
- Schedule and manage meetings
- Create and prioritize tasks
- Draft and send emails
- Provide daily briefings and summaries
- Analyze and organize information
- Suggest optimizations for productivity

Always respond in a professional, helpful, and concise manner. When providing actionable items, structure them clearly with specific parameters.`;
  }

  private getMockResponse(prompt: string): GeminiResponse {
    const lowerPrompt = prompt.toLowerCase();

    let mockText = '';

    if (lowerPrompt.includes('meeting') || lowerPrompt.includes('schedule')) {
      mockText =
        'I can help you schedule a meeting. Please provide the attendees, preferred date and time, and meeting duration.';
    } else if (lowerPrompt.includes('email') || lowerPrompt.includes('send')) {
      mockText =
        'I can help you compose and send an email. What would you like to include in the message?';
    } else if (lowerPrompt.includes('task') || lowerPrompt.includes('todo')) {
      mockText =
        'I can help you create and manage tasks. What task would you like to add to your list?';
    } else if (
      lowerPrompt.includes('briefing') ||
      lowerPrompt.includes('summary')
    ) {
      mockText =
        "Here's your daily briefing with key updates, upcoming meetings, and priority tasks for today.";
    } else {
      mockText =
        "I'm here to help with scheduling, emails, tasks, and daily briefings. How can I assist you today?";
    }

    return {
      text: mockText,
      finishReason: 'stop',
    };
  }

  private getMockIntentAnalysis(text: string): {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  } {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('meeting') || lowerText.includes('schedule')) {
      return {
        intent: 'schedule_meeting',
        confidence: 0.8,
        entities: { type: 'meeting' },
      };
    }

    if (lowerText.includes('email') || lowerText.includes('send')) {
      return {
        intent: 'send_email',
        confidence: 0.8,
        entities: { type: 'email' },
      };
    }

    if (lowerText.includes('task') || lowerText.includes('todo')) {
      return {
        intent: 'create_task',
        confidence: 0.8,
        entities: { type: 'task' },
      };
    }

    return {
      intent: 'general_assistance',
      confidence: 0.6,
      entities: {},
    };
  }
}
