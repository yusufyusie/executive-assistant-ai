import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIRequest, AIResponse, AIAction, ActionType } from '../common/interfaces';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    const modelName = this.configService.get<string>('gemini.model');
    
    if (!apiKey) {
      this.logger.warn('Gemini API key not configured. AI features will be limited.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName || 'gemini-2.0-flash-exp' });
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      if (!this.model) {
        return this.getFallbackResponse(request);
      }

      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text, request);
    } catch (error) {
      this.logger.error('Error processing AI request:', error);
      return this.getFallbackResponse(request);
    }
  }

  private buildPrompt(request: AIRequest): string {
    const systemPrompt = `You are an intelligent Executive Assistant AI. Your role is to help busy executives and professionals manage their schedules, emails, tasks, and daily workflows efficiently.

Core Capabilities:
1. Calendar Management - Schedule meetings, check availability, manage conflicts
2. Email Automation - Send emails, create templates, manage follow-ups
3. Task Management - Create, prioritize, and track tasks and reminders
4. Proactive Assistance - Daily briefings, deadline alerts, workflow optimization

Response Format:
Always respond with a JSON object containing:
{
  "intent": "primary_action_category",
  "confidence": 0.0-1.0,
  "response": "natural_language_response_to_user",
  "actions": [
    {
      "type": "action_type",
      "parameters": { "key": "value" },
      "priority": 1-10
    }
  ],
  "context": { "additional_context": "value" }
}

Available Action Types:
- schedule_meeting: Schedule a new meeting
- send_email: Send an email
- create_task: Create a new task
- set_reminder: Set a reminder
- update_calendar: Update calendar events
- search_calendar: Search calendar for events
- generate_briefing: Generate daily briefing

Context: ${JSON.stringify(request.context || {})}
User Request: "${request.input}"

Analyze the request and provide appropriate actions:`;

    return systemPrompt;
  }

  private parseAIResponse(text: string, request: AIRequest): AIResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'general',
          confidence: parsed.confidence || 0.8,
          response: parsed.response || text,
          actions: parsed.actions || [],
          context: parsed.context || {},
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON, using fallback');
    }

    // Fallback: analyze text for common patterns
    return this.analyzeTextForActions(text, request);
  }

  private analyzeTextForActions(text: string, request: AIRequest): AIResponse {
    const input = request.input.toLowerCase();
    const actions: AIAction[] = [];
    let intent = 'general';
    let confidence = 0.6;

    // Meeting scheduling patterns
    if (input.includes('schedule') || input.includes('meeting') || input.includes('book')) {
      intent = 'schedule_meeting';
      confidence = 0.8;
      actions.push({
        type: ActionType.SCHEDULE_MEETING,
        parameters: this.extractMeetingParameters(request.input),
        priority: 1,
      });
    }

    // Email patterns
    if (input.includes('email') || input.includes('send') || input.includes('message')) {
      intent = 'send_email';
      confidence = 0.7;
      actions.push({
        type: ActionType.SEND_EMAIL,
        parameters: this.extractEmailParameters(request.input),
        priority: 1,
      });
    }

    // Task patterns
    if (input.includes('task') || input.includes('todo') || input.includes('remind')) {
      intent = 'create_task';
      confidence = 0.7;
      actions.push({
        type: ActionType.CREATE_TASK,
        parameters: this.extractTaskParameters(request.input),
        priority: 1,
      });
    }

    // Calendar search patterns
    if (input.includes('when') || input.includes('available') || input.includes('free')) {
      intent = 'search_calendar';
      confidence = 0.7;
      actions.push({
        type: ActionType.SEARCH_CALENDAR,
        parameters: this.extractSearchParameters(request.input),
        priority: 1,
      });
    }

    return {
      intent,
      confidence,
      response: text || 'I understand your request. Let me help you with that.',
      actions,
      context: { originalInput: request.input },
    };
  }

  private extractMeetingParameters(input: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract meeting title (simple pattern matching)
    const titleMatch = input.match(/(?:schedule|book|meeting with|meet with)\s+(.+?)(?:\s+(?:on|at|for|tomorrow|next|this)|\s*$)/i);
    if (titleMatch) {
      params.title = titleMatch[1].trim();
    }

    // Extract time patterns
    const timePatterns = [
      /(?:at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i,
    ];
    
    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) {
        params.time = match[1];
        break;
      }
    }

    // Extract date patterns
    const datePatterns = [
      /(tomorrow|today)/i,
      /(next\s+\w+)/i,
      /(this\s+\w+)/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
    ];

    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        params.date = match[1];
        break;
      }
    }

    // Extract duration
    const durationMatch = input.match(/(?:for|duration)\s*(\d+)\s*(hour|hours|minute|minutes|min)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      params.duration = unit.startsWith('hour') ? value * 60 : value;
    }

    return params;
  }

  private extractEmailParameters(input: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract email addresses
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = input.match(emailPattern);
    if (emails) {
      params.to = emails[0];
      if (emails.length > 1) {
        params.cc = emails.slice(1);
      }
    }

    // Extract subject (simple pattern)
    const subjectMatch = input.match(/(?:subject|about|regarding)\s+["']?([^"']+)["']?/i);
    if (subjectMatch) {
      params.subject = subjectMatch[1].trim();
    }

    return params;
  }

  private extractTaskParameters(input: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract task title
    const taskMatch = input.match(/(?:task|todo|remind me to)\s+(.+?)(?:\s+(?:by|before|on|at)|\s*$)/i);
    if (taskMatch) {
      params.title = taskMatch[1].trim();
    }

    // Extract priority
    if (input.includes('urgent') || input.includes('asap') || input.includes('immediately')) {
      params.priority = 'urgent';
    } else if (input.includes('high priority') || input.includes('important')) {
      params.priority = 'high';
    } else if (input.includes('low priority')) {
      params.priority = 'low';
    } else {
      params.priority = 'medium';
    }

    // Extract due date
    const dueDateMatch = input.match(/(?:by|before|due)\s+(tomorrow|today|next\s+\w+|this\s+\w+|\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dueDateMatch) {
      params.dueDate = dueDateMatch[1];
    }

    return params;
  }

  private extractSearchParameters(input: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract time range
    const timeRangeMatch = input.match(/(today|tomorrow|this week|next week|this month)/i);
    if (timeRangeMatch) {
      params.timeRange = timeRangeMatch[1].toLowerCase();
    }

    return params;
  }

  private getFallbackResponse(request: AIRequest): AIResponse {
    return {
      intent: 'general',
      confidence: 0.5,
      response: 'I understand you need assistance. Could you please provide more specific details about what you\'d like me to help you with?',
      actions: [],
      context: { fallback: true, originalInput: request.input },
    };
  }

  async generateDailyBriefing(context: Record<string, any>): Promise<string> {
    try {
      if (!this.model) {
        return this.generateFallbackBriefing(context);
      }

      const prompt = `Generate a concise daily briefing for an executive based on the following information:

Calendar Events: ${JSON.stringify(context.upcomingMeetings || [])}
Priority Tasks: ${JSON.stringify(context.priorityTasks || [])}
Important Emails: ${JSON.stringify(context.importantEmails || [])}
Date: ${context.date || new Date().toDateString()}

Create a professional, actionable briefing that includes:
1. Today's schedule overview
2. Priority tasks requiring attention
3. Important emails to review
4. Suggestions for optimizing the day

Keep it concise but informative.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error generating daily briefing:', error);
      return this.generateFallbackBriefing(context);
    }
  }

  private generateFallbackBriefing(context: Record<string, any>): string {
    const date = context.date || new Date().toDateString();
    const meetingCount = context.upcomingMeetings?.length || 0;
    const taskCount = context.priorityTasks?.length || 0;
    
    return `Daily Briefing for ${date}

📅 Schedule Overview:
- ${meetingCount} meetings scheduled today
- ${taskCount} priority tasks requiring attention

🎯 Key Focus Areas:
- Review and respond to priority emails
- Prepare for upcoming meetings
- Complete high-priority tasks

💡 Suggestions:
- Block time for deep work between meetings
- Review meeting agendas in advance
- Set reminders for important deadlines

Have a productive day!`;
  }
}
