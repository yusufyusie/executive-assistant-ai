/**
 * Assistant Service
 * Main service for AI assistant functionality
 */

import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import {
  ProcessRequestDto,
  AssistantResponseDto,
  AssistantAction,
  AnalyzeRequestDto,
  BriefingRequestDto,
} from '../dto/assistant.dto';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(private readonly gemini: GeminiService) {}

  async processRequest(
    request: ProcessRequestDto,
  ): Promise<AssistantResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Processing assistant request', {
        inputLength: request.input.length,
        hasContext: !!request.context,
      });

      // Analyze intent first
      const intentAnalysis = await this.gemini.analyzeIntent(request.input);

      // Generate detailed response
      const prompt = this.buildProcessingPrompt(request, intentAnalysis);
      const geminiResponse = await this.gemini.generateResponse({
        prompt,
        temperature: request.options?.temperature,
        maxTokens: request.options?.maxTokens,
      });

      // Parse and structure the response
      const assistantResponse = this.parseAssistantResponse(
        geminiResponse.text,
        intentAnalysis,
        request.input,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Assistant request processed successfully in ${duration}ms`,
        {
          intent: assistantResponse.intent,
          confidence: assistantResponse.confidence,
          actionsCount: assistantResponse.actions.length,
        },
      );

      return assistantResponse;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `Failed to process assistant request in ${duration}ms`,
        error.stack,
      );

      // Return fallback response
      return this.getFallbackResponse(request.input);
    }
  }

  async analyzeText(request: AnalyzeRequestDto): Promise<any> {
    try {
      const analysis = await this.gemini.analyzeIntent(request.text);

      return {
        intent: analysis.intent,
        confidence: analysis.confidence,
        entities: analysis.entities,
        sentiment: this.analyzeSentiment(request.text),
        complexity: this.analyzeComplexity(request.text),
        suggestions: this.generateSuggestions(analysis.intent),
      };
    } catch (error) {
      this.logger.error('Failed to analyze text', error.stack);
      throw error;
    }
  }

  async generateBriefing(request: BriefingRequestDto): Promise<any> {
    try {
      const date = request.date || new Date().toISOString().split('T')[0];

      const prompt = `Generate a ${request.type} briefing for ${date}. Include:
${request.sections?.join(', ') || 'calendar, tasks, priorities, recommendations'}

Format as a structured briefing with clear sections and actionable insights.`;

      const response = await this.gemini.generateResponse({ prompt });

      return {
        date,
        type: request.type,
        content: response.text,
        sections: request.sections || [
          'calendar',
          'tasks',
          'priorities',
          'recommendations',
        ],
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate briefing', error.stack);
      throw error;
    }
  }

  getHealth(): any {
    return {
      status: 'healthy',
      gemini: this.gemini.getStatus(),
      features: [
        'process_requests',
        'analyze_text',
        'generate_briefings',
        'intent_recognition',
        'action_extraction',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  private buildProcessingPrompt(
    request: ProcessRequestDto,
    intentAnalysis: any,
  ): string {
    return `Process this executive assistant request and provide a structured response:

User Input: "${request.input}"
Detected Intent: ${intentAnalysis.intent}
Context: ${JSON.stringify(request.context || {})}

Provide a JSON response with:
{
  "response": "Natural language response to the user",
  "actions": [
    {
      "type": "action_type",
      "parameters": { "key": "value" },
      "priority": "medium",
      "estimatedDuration": 30
    }
  ],
  "metadata": {
    "reasoning": "Brief explanation of the approach",
    "confidence": 0.95
  }
}

Focus on actionable items and be specific with parameters.`;
  }

  private parseAssistantResponse(
    responseText: string,
    intentAnalysis: any,
    originalInput: string,
  ): AssistantResponseDto {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          intent: intentAnalysis.intent,
          confidence: parsed.metadata?.confidence || intentAnalysis.confidence,
          response: parsed.response || responseText,
          actions: parsed.actions || [],
          metadata: {
            ...parsed.metadata,
            entities: intentAnalysis.entities,
            originalInput,
          },
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse structured response, using fallback');
    }

    // Fallback to simple response
    return {
      intent: intentAnalysis.intent,
      confidence: intentAnalysis.confidence,
      response: responseText,
      actions: this.extractActionsFromIntent(
        intentAnalysis.intent,
        originalInput,
      ),
      metadata: {
        entities: intentAnalysis.entities,
        originalInput,
        fallback: true,
      },
    };
  }

  private extractActionsFromIntent(
    intent: string,
    input: string,
  ): AssistantAction[] {
    const actions: AssistantAction[] = [];

    switch (intent) {
      case 'schedule_meeting':
        actions.push({
          type: 'schedule_meeting',
          parameters: {
            title: 'Meeting',
            status: 'pending_details',
            source: input,
          },
          priority: 'medium',
          estimatedDuration: 60,
        });
        break;

      case 'send_email':
        actions.push({
          type: 'compose_email',
          parameters: {
            status: 'draft',
            source: input,
          },
          priority: 'medium',
          estimatedDuration: 15,
        });
        break;

      case 'create_task':
        actions.push({
          type: 'create_task',
          parameters: {
            title: input,
            priority: 'medium',
            status: 'pending',
          },
          priority: 'medium',
          estimatedDuration: 5,
        });
        break;

      case 'get_briefing':
        actions.push({
          type: 'generate_briefing',
          parameters: {
            type: 'daily',
            date: new Date().toISOString().split('T')[0],
          },
          priority: 'low',
          estimatedDuration: 10,
        });
        break;
    }

    return actions;
  }

  private getFallbackResponse(input: string): AssistantResponseDto {
    return {
      intent: 'general_assistance',
      confidence: 0.5,
      response:
        "I understand you need assistance. Could you please provide more specific details about what you'd like me to help you with?",
      actions: [
        {
          type: 'request_clarification',
          parameters: {
            originalInput: input,
            suggestions: [
              'Schedule a meeting',
              'Send an email',
              'Create a task',
              'Get daily briefing',
            ],
          },
          priority: 'low',
        },
      ],
      metadata: {
        fallback: true,
        originalInput: input,
      },
    };
  }

  private analyzeSentiment(text: string): string {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'please', 'thank'];
    const negativeWords = ['urgent', 'asap', 'problem', 'issue', 'cancel'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter((word) =>
      positiveWords.includes(word),
    ).length;
    const negativeCount = words.filter((word) =>
      negativeWords.includes(word),
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private analyzeComplexity(text: string): string {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;

    if (wordCount > 50 || sentenceCount > 3) return 'high';
    if (wordCount > 20 || sentenceCount > 1) return 'medium';
    return 'low';
  }

  private generateSuggestions(intent: string): string[] {
    const suggestions: Record<string, string[]> = {
      schedule_meeting: [
        'Include meeting agenda',
        'Add calendar reminders',
        'Send meeting invites',
      ],
      send_email: [
        'Use email templates',
        'Schedule email delivery',
        'Add follow-up reminders',
      ],
      create_task: [
        'Set due dates',
        'Assign priority levels',
        'Break into subtasks',
      ],
      get_briefing: [
        'Customize briefing sections',
        'Set recurring briefings',
        'Include metrics',
      ],
    };

    return (
      suggestions[intent] || [
        'Be more specific',
        'Provide additional context',
        'Try a different approach',
      ]
    );
  }
}
