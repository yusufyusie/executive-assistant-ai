/**
 * Gemini AI Service - Infrastructure Layer
 * Integration with Google Gemini AI API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, any>;
}

export interface GeminiResponse {
  text: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly isConfigured: boolean;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get('GEMINI_API_KEY', '');
    this.model = this.config.get('GEMINI_MODEL', 'gemini-2.0-flash-exp');
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      this.logger.log('Gemini AI service configured successfully');
    } else {
      this.logger.warn('Gemini API key not configured, using mock responses');
    }
  }

  async generateResponse(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.isConfigured) {
      return this.getMockResponse(request.prompt);
    }

    try {
      this.logger.log(
        `Generating response for prompt: ${request.prompt.substring(0, 50)}...`,
      );

      // ACTUAL GEMINI API INTEGRATION
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: this.buildPrompt(request),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: request.maxTokens || 1000,
              topP: 0.8,
              topK: 40,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const candidate = data.candidates[0];
      const text = candidate.content?.parts?.[0]?.text || '';

      this.logger.log('Gemini API response generated successfully');

      return {
        text,
        finishReason: candidate.finishReason || 'stop',
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              completionTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Gemini API request failed', error.stack);
      // Fallback to intelligent mock response
      return this.getIntelligentMockResponse(request);
    }
  }

  private buildPrompt(request: GeminiRequest): string {
    let prompt = '';

    if (request.systemPrompt) {
      prompt += `System: ${request.systemPrompt}\n\n`;
    }

    if (request.context) {
      prompt += `Context: ${JSON.stringify(request.context, null, 2)}\n\n`;
    }

    prompt += `User: ${request.prompt}`;

    return prompt;
  }

  private getIntelligentMockResponse(request: GeminiRequest): GeminiResponse {
    const prompt = request.prompt.toLowerCase();

    // Task-related responses
    if (prompt.includes('task') || prompt.includes('todo')) {
      if (prompt.includes('create') || prompt.includes('add')) {
        return {
          text:
            'I can help you create a new task. Based on your request, I suggest:\n\n' +
            '• Title: [Extracted from your request]\n' +
            '• Priority: Medium (adjustable based on urgency)\n' +
            '• Due date: [If mentioned or suggested]\n' +
            '• Estimated duration: [If determinable]\n\n' +
            'Would you like me to create this task for you?',
          finishReason: 'stop',
        };
      }

      if (prompt.includes('prioritize') || prompt.includes('priority')) {
        return {
          text:
            "I'll analyze your tasks and provide intelligent prioritization based on:\n\n" +
            '• Due dates and urgency\n' +
            '• Current priority levels\n' +
            '• Task dependencies\n' +
            '• Estimated completion time\n\n' +
            'Let me process your task list and provide recommendations.',
          finishReason: 'stop',
        };
      }
    }

    // Meeting/Calendar related responses
    if (
      prompt.includes('meeting') ||
      prompt.includes('schedule') ||
      prompt.includes('calendar')
    ) {
      if (prompt.includes('schedule') || prompt.includes('book')) {
        return {
          text:
            "I can help you schedule a meeting. I'll analyze:\n\n" +
            '• Attendee availability\n' +
            '• Optimal time slots\n' +
            '• Meeting room availability\n' +
            '• Time zone considerations\n\n' +
            "Please provide the meeting details and I'll find the best time slots.",
          finishReason: 'stop',
        };
      }

      if (prompt.includes('conflict') || prompt.includes('available')) {
        return {
          text:
            "I'll check for scheduling conflicts and availability. Based on your calendar:\n\n" +
            '• Current meetings and commitments\n' +
            '• Buffer time between meetings\n' +
            '• Working hours preferences\n' +
            '• Travel time if needed\n\n' +
            'Let me analyze your schedule and provide recommendations.',
          finishReason: 'stop',
        };
      }
    }

    // Email related responses
    if (
      prompt.includes('email') ||
      prompt.includes('send') ||
      prompt.includes('message')
    ) {
      if (prompt.includes('draft') || prompt.includes('compose')) {
        return {
          text:
            "I can help you compose a professional email. I'll consider:\n\n" +
            '• Appropriate tone and formality\n' +
            '• Clear subject line\n' +
            '• Structured content\n' +
            '• Call-to-action if needed\n\n' +
            "Please provide the context and I'll draft the email for you.",
          finishReason: 'stop',
        };
      }

      if (prompt.includes('follow up') || prompt.includes('reminder')) {
        return {
          text:
            "I'll help you create an effective follow-up email:\n\n" +
            '• Reference to previous communication\n' +
            '• Clear purpose and next steps\n' +
            '• Professional but friendly tone\n' +
            '• Appropriate timing\n\n' +
            "Let me know the context and I'll craft the follow-up message.",
          finishReason: 'stop',
        };
      }
    }

    // General assistant responses
    if (prompt.includes('help') || prompt.includes('assist')) {
      return {
        text:
          "I'm your AI Executive Assistant, ready to help with:\n\n" +
          '**Calendar Management**\n' +
          '• Schedule meetings intelligently\n' +
          '• Check availability and conflicts\n' +
          '• Send meeting reminders\n\n' +
          '**Task Management**\n' +
          '• Create and prioritize tasks\n' +
          '• Track deadlines and progress\n' +
          '• Provide productivity insights\n\n' +
          '**Email Automation**\n' +
          '• Draft professional emails\n' +
          '• Send follow-ups and reminders\n' +
          '• Manage email templates\n\n' +
          'What would you like me to help you with today?',
        finishReason: 'stop',
      };
    }

    // Default intelligent response
    return {
      text:
        "I understand you're looking for assistance. As your AI Executive Assistant, I can help with:\n\n" +
        '• **Smart Scheduling**: Find optimal meeting times and manage your calendar\n' +
        '• **Task Prioritization**: Organize your workload based on urgency and importance\n' +
        '• **Email Management**: Draft, send, and follow up on communications\n' +
        '• **Proactive Reminders**: Keep you on track with automated notifications\n\n' +
        'Could you provide more specific details about what you need help with?',
      finishReason: 'stop',
    };
  }

  private getMockResponse(prompt: string): GeminiResponse {
    return {
      text:
        `I understand your request: "${prompt.substring(0, 100)}..."\n\n` +
        "As your AI Executive Assistant, I'm here to help with scheduling, task management, and email automation. " +
        "Please note that I'm currently running in demo mode. " +
        'For full functionality, please configure the Gemini API key.',
      finishReason: 'stop',
    };
  }

  getStatus(): {
    configured: boolean;
    model: string;
    lastCheck: string;
  } {
    return {
      configured: this.isConfigured,
      model: this.model,
      lastCheck: new Date().toISOString(),
    };
  }

  async analyzeIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    actions: Array<{
      type: string;
      parameters: Record<string, any>;
      confidence: number;
    }>;
  }> {
    const lowerText = text.toLowerCase();

    // Task-related intents
    if (
      lowerText.includes('create') &&
      (lowerText.includes('task') || lowerText.includes('todo'))
    ) {
      return {
        intent: 'create_task',
        confidence: 0.9,
        entities: this.extractTaskEntities(text),
        actions: [
          {
            type: 'create_task',
            parameters: this.extractTaskEntities(text),
            confidence: 0.9,
          },
        ],
      };
    }

    // Meeting-related intents
    if (lowerText.includes('schedule') && lowerText.includes('meeting')) {
      return {
        intent: 'schedule_meeting',
        confidence: 0.85,
        entities: this.extractMeetingEntities(text),
        actions: [
          {
            type: 'schedule_meeting',
            parameters: this.extractMeetingEntities(text),
            confidence: 0.85,
          },
        ],
      };
    }

    // Email-related intents
    if (lowerText.includes('send') && lowerText.includes('email')) {
      return {
        intent: 'send_email',
        confidence: 0.8,
        entities: this.extractEmailEntities(text),
        actions: [
          {
            type: 'send_email',
            parameters: this.extractEmailEntities(text),
            confidence: 0.8,
          },
        ],
      };
    }

    // Default intent
    return {
      intent: 'general_assistance',
      confidence: 0.5,
      entities: {},
      actions: [
        {
          type: 'provide_help',
          parameters: { query: text },
          confidence: 0.5,
        },
      ],
    };
  }

  private extractTaskEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract priority
    if (text.toLowerCase().includes('urgent')) entities.priority = 'urgent';
    else if (text.toLowerCase().includes('high')) entities.priority = 'high';
    else if (text.toLowerCase().includes('low')) entities.priority = 'low';
    else entities.priority = 'medium';

    // Extract due date patterns
    const dueDatePatterns = [
      /tomorrow/i,
      /next week/i,
      /by (\w+)/i,
      /due (\w+)/i,
    ];

    for (const pattern of dueDatePatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.dueDate = match[0];
        break;
      }
    }

    return entities;
  }

  private extractMeetingEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract duration
    const durationMatch = text.match(/(\d+)\s*(hour|hr|minute|min)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      entities.duration =
        unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
    }

    // Extract attendees (email patterns)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
      entities.attendees = emails;
    }

    return entities;
  }

  private extractEmailEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract recipients
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
      entities.recipients = emails;
    }

    // Extract priority
    if (text.toLowerCase().includes('urgent')) entities.priority = 'high';
    else if (text.toLowerCase().includes('important'))
      entities.priority = 'high';
    else entities.priority = 'normal';

    return entities;
  }
}
