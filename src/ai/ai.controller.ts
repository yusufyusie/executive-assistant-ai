import { Controller, Post, Body, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIProcessRequestDto } from '../common/dto';
import { AIRequest, AIResponse } from '../common/interfaces';

@Controller('api/assistant')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly aiService: AIService) {}

  @Post('process')
  async processRequest(@Body() dto: AIProcessRequestDto): Promise<AIResponse> {
    this.logger.log(`Processing AI request: ${dto.input}`);
    
    const request: AIRequest = {
      input: dto.input,
      context: dto.context || {},
      userId: dto.userId || 'anonymous',
      timestamp: new Date(),
    };

    const response = await this.aiService.processRequest(request);
    
    this.logger.log(`AI response generated with intent: ${response.intent}, confidence: ${response.confidence}`);
    
    return response;
  }

  @Get('briefing')
  async getDailyBriefing(
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ): Promise<{ briefing: string; date: string }> {
    this.logger.log(`Generating daily briefing for user: ${userId || 'anonymous'}`);
    
    const briefingDate = date ? new Date(date) : new Date();
    
    // In a real implementation, you would fetch actual data from calendar, tasks, and email services
    const context = {
      date: briefingDate.toDateString(),
      upcomingMeetings: [
        {
          summary: 'Team Standup',
          start: { dateTime: '2024-01-15T09:00:00Z' },
          end: { dateTime: '2024-01-15T09:30:00Z' },
        },
        {
          summary: 'Client Review Meeting',
          start: { dateTime: '2024-01-15T14:00:00Z' },
          end: { dateTime: '2024-01-15T15:00:00Z' },
        },
      ],
      priorityTasks: [
        {
          title: 'Review Q4 Budget Proposal',
          priority: 'high',
          dueDate: briefingDate,
        },
        {
          title: 'Prepare presentation for board meeting',
          priority: 'urgent',
          dueDate: briefingDate,
        },
      ],
      importantEmails: [
        {
          subject: 'Urgent: Contract Review Required',
          from: 'legal@company.com',
          priority: 'high',
        },
      ],
    };

    const briefing = await this.aiService.generateDailyBriefing(context);
    
    return {
      briefing,
      date: briefingDate.toISOString(),
    };
  }

  @Post('analyze')
  async analyzeContent(
    @Body() body: { content: string; type: string; context?: any },
  ): Promise<{ analysis: string; suggestions: string[] }> {
    this.logger.log(`Analyzing content of type: ${body.type}`);
    
    // This would use AI to analyze emails, documents, or other content
    // For now, return a simple analysis
    const analysis = `Content analysis for ${body.type}: The content appears to be ${body.content.length > 100 ? 'detailed' : 'brief'} and ${body.content.includes('urgent') ? 'urgent' : 'standard priority'}.`;
    
    const suggestions = [
      'Consider setting up a follow-up reminder',
      'Add relevant stakeholders to the discussion',
      'Schedule a meeting to discuss next steps',
    ];

    return { analysis, suggestions };
  }

  @Get('health')
  async getHealthStatus(): Promise<{ status: string; aiEnabled: boolean }> {
    // Simple health check for the AI service
    try {
      const testRequest: AIRequest = {
        input: 'test',
        userId: 'health-check',
        timestamp: new Date(),
      };
      
      await this.aiService.processRequest(testRequest);
      
      return {
        status: 'healthy',
        aiEnabled: true,
      };
    } catch (error) {
      this.logger.error('AI health check failed:', error);
      return {
        status: 'degraded',
        aiEnabled: false,
      };
    }
  }
}
