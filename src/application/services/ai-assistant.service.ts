/**
 * AI Assistant Service - Application Layer
 * Orchestrates AI-powered executive assistant functionality
 */

import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../infrastructure/external-services/gemini/gemini.service';
import { TaskApplicationService } from './task-application.service';
import { GoogleCalendarService } from '../../infrastructure/external-services/google-calendar/google-calendar.service';
import { SendGridService } from '../../infrastructure/external-services/sendgrid/sendgrid.service';
import { Result, success, failure } from '../common/result';

export interface AssistantRequest {
  input: string;
  context?: {
    userId?: string;
    timezone?: string;
    preferences?: Record<string, any>;
  };
}

export interface AssistantResponse {
  intent: string;
  confidence: number;
  response: string;
  actions: AssistantAction[];
  suggestions: string[];
  metadata: {
    processingTime: number;
    model: string;
    timestamp: string;
  };
}

export interface AssistantAction {
  type: 'create_task' | 'schedule_meeting' | 'send_email' | 'set_reminder' | 'search_calendar' | 'prioritize_tasks';
  parameters: Record<string, any>;
  confidence: number;
  status: 'pending' | 'executed' | 'failed';
  result?: any;
  error?: string;
}

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly taskService: TaskApplicationService,
    private readonly calendarService: GoogleCalendarService,
    private readonly emailService: SendGridService,
  ) {}

  async processRequest(request: AssistantRequest): Promise<Result<AssistantResponse, string>> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing assistant request: ${request.input.substring(0, 100)}...`);

      // Step 1: Analyze intent using Gemini
      const intentAnalysis = await this.geminiService.analyzeIntent(request.input);
      
      // Step 2: Generate initial response
      const geminiResponse = await this.geminiService.generateResponse({
        prompt: request.input,
        systemPrompt: this.getSystemPrompt(),
        context: request.context,
      });

      // Step 3: Execute actions based on intent
      const actions = await this.executeActions(intentAnalysis.actions, request.context);

      // Step 4: Generate suggestions
      const suggestions = await this.generateSuggestions(intentAnalysis.intent, request.context);

      // Step 5: Build response
      const response: AssistantResponse = {
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        response: geminiResponse.text,
        actions,
        suggestions,
        metadata: {
          processingTime: Date.now() - startTime,
          model: 'gemini-2.0-flash-exp',
          timestamp: new Date().toISOString(),
        },
      };

      this.logger.log(`Assistant request processed successfully in ${response.metadata.processingTime}ms`);
      return success(response);

    } catch (error) {
      this.logger.error('Failed to process assistant request', error.stack);
      return failure('Failed to process your request. Please try again.');
    }
  }

  async generateDailyBriefing(date?: string): Promise<Result<any, string>> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      this.logger.log(`Generating daily briefing for ${targetDate}`);

      // Get calendar events
      const events = await this.calendarService.getEvents(targetDate);
      
      // Get tasks
      const tasksResult = await this.taskService.getTasks({
        filters: {
          status: 'pending',
        },
        limit: 20,
      });

      if (tasksResult.isFailure) {
        return failure('Failed to retrieve tasks for briefing');
      }

      const tasks = tasksResult.value.items;
      const urgentTasks = tasks.filter(task => task.priority.priority === 'urgent' || task.priority.priority === 'high');

      // Generate briefing using AI
      const briefingPrompt = this.buildBriefingPrompt(targetDate, events, tasks, urgentTasks);
      const aiResponse = await this.geminiService.generateResponse({
        prompt: briefingPrompt,
        systemPrompt: 'You are an executive assistant providing a daily briefing. Be concise, professional, and actionable.',
      });

      const briefing = {
        date: targetDate,
        summary: {
          totalMeetings: events.length,
          urgentTasks: urgentTasks.length,
          totalTasks: tasks.length,
          estimatedWorkload: this.calculateWorkload(events, tasks),
        },
        schedule: {
          meetings: events.slice(0, 5),
          conflicts: this.detectConflicts(events),
          suggestions: this.generateScheduleSuggestions(events),
        },
        tasks: {
          urgent: urgentTasks.slice(0, 3),
          important: tasks.filter(t => t.priority.priority === 'medium').slice(0, 3),
        },
        insights: {
          aiSummary: aiResponse.text,
          productivity: this.getProductivityInsights(events, tasks),
          alerts: this.generateAlerts(events, tasks),
        },
        generatedAt: new Date().toISOString(),
      };

      return success(briefing);

    } catch (error) {
      this.logger.error('Failed to generate daily briefing', error.stack);
      return failure('Failed to generate daily briefing');
    }
  }

  async getCapabilities(): Promise<{
    features: string[];
    integrations: string[];
    status: Record<string, any>;
  }> {
    const geminiStatus = this.geminiService.getStatus();
    const calendarStatus = this.calendarService.getStatus();
    const emailStatus = this.emailService.getStatus();

    return {
      features: [
        'Natural Language Processing',
        'Task Management',
        'Calendar Scheduling',
        'Email Automation',
        'Proactive Reminders',
        'Smart Prioritization',
        'Daily Briefings',
        'Intent Recognition',
      ],
      integrations: [
        'Google Gemini AI',
        'Google Calendar',
        'SendGrid Email',
        'Cloud Scheduler',
      ],
      status: {
        gemini: geminiStatus,
        calendar: calendarStatus,
        email: emailStatus,
        overall: 'operational',
      },
    };
  }

  private async executeActions(actions: any[], context?: any): Promise<AssistantAction[]> {
    const executedActions: AssistantAction[] = [];

    for (const action of actions) {
      const assistantAction: AssistantAction = {
        type: action.type,
        parameters: action.parameters,
        confidence: action.confidence,
        status: 'pending',
      };

      try {
        switch (action.type) {
          case 'create_task':
            const taskResult = await this.taskService.createTask(action.parameters);
            if (taskResult.isSuccess) {
              assistantAction.status = 'executed';
              assistantAction.result = taskResult.value;
            } else {
              assistantAction.status = 'failed';
              assistantAction.error = taskResult.error;
            }
            break;

          case 'schedule_meeting':
            const meetingResult = await this.calendarService.createEvent(action.parameters);
            assistantAction.status = 'executed';
            assistantAction.result = meetingResult;
            break;

          case 'send_email':
            const emailResult = await this.emailService.sendEmail(action.parameters);
            assistantAction.status = 'executed';
            assistantAction.result = emailResult;
            break;

          case 'prioritize_tasks':
            const prioritizeResult = await this.taskService.prioritizeTasks(action.parameters);
            if (prioritizeResult.isSuccess) {
              assistantAction.status = 'executed';
              assistantAction.result = prioritizeResult.value;
            } else {
              assistantAction.status = 'failed';
              assistantAction.error = prioritizeResult.error;
            }
            break;

          default:
            assistantAction.status = 'failed';
            assistantAction.error = `Unknown action type: ${action.type}`;
        }
      } catch (error) {
        assistantAction.status = 'failed';
        assistantAction.error = error.message;
      }

      executedActions.push(assistantAction);
    }

    return executedActions;
  }

  private async generateSuggestions(intent: string, context?: any): Promise<string[]> {
    const suggestions: string[] = [];

    switch (intent) {
      case 'create_task':
        suggestions.push('Set a due date for better prioritization');
        suggestions.push('Add tags to organize related tasks');
        suggestions.push('Estimate duration for time management');
        break;

      case 'schedule_meeting':
        suggestions.push('Check attendee availability first');
        suggestions.push('Add an agenda for more productive meetings');
        suggestions.push('Set up automatic reminders');
        break;

      case 'send_email':
        suggestions.push('Use templates for common communications');
        suggestions.push('Schedule emails for optimal delivery times');
        suggestions.push('Add follow-up reminders');
        break;

      default:
        suggestions.push('Try asking me to create tasks, schedule meetings, or send emails');
        suggestions.push('I can help prioritize your workload');
        suggestions.push('Ask for a daily briefing to stay organized');
    }

    return suggestions;
  }

  private getSystemPrompt(): string {
    return `You are an intelligent Executive Assistant AI. Your role is to help busy professionals manage their schedules, tasks, emails, and daily workflows efficiently.

Key capabilities:
- Schedule and manage meetings intelligently
- Create and prioritize tasks based on urgency and importance
- Draft and send professional emails
- Provide daily briefings and summaries
- Analyze and organize information proactively
- Suggest optimizations for productivity

Communication style:
- Professional but friendly
- Concise and actionable
- Structured and clear
- Proactive in offering suggestions

When providing actionable items, structure them clearly with specific parameters. Always consider the user's context and preferences.`;
  }

  private buildBriefingPrompt(date: string, events: any[], tasks: any[], urgentTasks: any[]): string {
    return `Generate a professional daily briefing for ${date}.

Calendar Events (${events.length}):
${events.map(e => `- ${e.summary} (${e.start?.dateTime || e.start?.date})`).join('\n')}

Tasks (${tasks.length} total, ${urgentTasks.length} urgent):
${urgentTasks.map(t => `- [${t.priority.priority.toUpperCase()}] ${t.title}`).join('\n')}

Please provide:
1. A brief overview of the day
2. Key priorities and focus areas
3. Potential scheduling conflicts or concerns
4. Productivity recommendations
5. Any proactive suggestions

Keep it concise but comprehensive.`;
  }

  private calculateWorkload(events: any[], tasks: any[]): string {
    const meetingHours = events.length * 1; // Assume 1 hour per meeting
    const taskHours = tasks.length * 0.5; // Assume 30 minutes per task
    const totalHours = meetingHours + taskHours;
    return `${totalHours.toFixed(1)} hours estimated`;
  }

  private detectConflicts(events: any[]): string[] {
    const conflicts: string[] = [];
    
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      const currentEnd = new Date(current.end?.dateTime || current.end?.date);
      const nextStart = new Date(next.start?.dateTime || next.start?.date);
      
      if (currentEnd > nextStart) {
        conflicts.push(`Conflict between "${current.summary}" and "${next.summary}"`);
      }
    }
    
    return conflicts;
  }

  private generateScheduleSuggestions(events: any[]): string[] {
    const suggestions: string[] = [];
    
    if (events.length > 6) {
      suggestions.push('Heavy meeting day - consider rescheduling non-critical meetings');
    }
    
    if (events.length === 0) {
      suggestions.push('Light meeting day - good opportunity for focused work');
    }
    
    suggestions.push('Block 10-11 AM for deep work if possible');
    suggestions.push('Schedule lunch break at 12:30 PM');
    
    return suggestions;
  }

  private getProductivityInsights(events: any[], tasks: any[]): string {
    if (events.length > 5) {
      return 'High meeting load today - focus on preparation and follow-ups';
    }
    
    if (tasks.filter(t => t.priority.priority === 'urgent').length > 3) {
      return 'Multiple urgent tasks - consider delegating or rescheduling non-critical items';
    }
    
    return 'Balanced workload - good opportunity for strategic work';
  }

  private generateAlerts(events: any[], tasks: any[]): string[] {
    const alerts: string[] = [];
    
    const overdueTasks = tasks.filter(task => task.isOverdue);
    if (overdueTasks.length > 0) {
      alerts.push(`${overdueTasks.length} task(s) are overdue`);
    }
    
    if (events.length > 6) {
      alerts.push('Heavy meeting day - consider rescheduling non-critical meetings');
    }
    
    return alerts;
  }
}
