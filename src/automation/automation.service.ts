import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AIService } from '../ai/ai.service';
import { CalendarService } from '../calendar/calendar.service';
import { EmailService } from '../email/email.service';
import { TasksService } from '../tasks/tasks.service';
import { DailyBriefing } from '../common/interfaces';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private configService: ConfigService,
    private aiService: AIService,
    private calendarService: CalendarService,
    private emailService: EmailService,
    private tasksService: TasksService,
  ) {}

  // Daily briefing at 8:00 AM
  @Cron('0 8 * * *')
  async generateDailyBriefing() {
    this.logger.log('Generating daily briefing');
    
    try {
      const briefing = await this.createDailyBriefing();
      
      // In a real implementation, this would send the briefing via email or notification
      this.logger.log('Daily briefing generated successfully');
      
      // Simulate sending briefing email
      await this.emailService.sendEmail(
        'executive@company.com',
        `Daily Briefing - ${new Date().toDateString()}`,
        this.formatBriefingAsHtml(briefing),
      );
      
      return briefing;
    } catch (error) {
      this.logger.error('Error generating daily briefing:', error);
    }
  }

  // Check for urgent tasks every 2 hours during business hours
  @Cron('0 9-17/2 * * 1-5')
  async checkUrgentTasks() {
    this.logger.log('Checking for urgent tasks');
    
    try {
      const urgentTasks = this.tasksService.getPriorityTasks(5);
      const overdueTasks = this.tasksService.getOverdueTasks();
      
      if (urgentTasks.length > 0 || overdueTasks.length > 0) {
        const alertMessage = this.createTaskAlert(urgentTasks, overdueTasks);
        
        // Send alert email
        await this.emailService.sendEmail(
          'executive@company.com',
          'Task Alert: Urgent Items Require Attention',
          alertMessage,
        );
        
        this.logger.log(`Task alert sent: ${urgentTasks.length} urgent, ${overdueTasks.length} overdue`);
      }
    } catch (error) {
      this.logger.error('Error checking urgent tasks:', error);
    }
  }

  // Weekly calendar optimization on Sunday at 6 PM
  @Cron('0 18 * * 0')
  async optimizeWeeklyCalendar() {
    this.logger.log('Optimizing weekly calendar');
    
    try {
      const nextWeekStart = new Date();
      nextWeekStart.setDate(nextWeekStart.getDate() + 1); // Monday
      nextWeekStart.setHours(0, 0, 0, 0);
      
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6); // Sunday
      nextWeekEnd.setHours(23, 59, 59, 999);
      
      const events = await this.calendarService.getUpcomingEvents(50, nextWeekStart, nextWeekEnd);
      const conflicts = await this.calendarService.getConflicts(
        nextWeekStart.toISOString(),
        nextWeekEnd.toISOString(),
      );
      
      if (conflicts.conflicts.length > 0) {
        const optimizationSuggestions = this.generateCalendarOptimizations(events, conflicts);
        
        await this.emailService.sendEmail(
          'executive@company.com',
          'Weekly Calendar Optimization Suggestions',
          optimizationSuggestions,
        );
        
        this.logger.log('Calendar optimization suggestions sent');
      }
    } catch (error) {
      this.logger.error('Error optimizing calendar:', error);
    }
  }

  // Follow-up reminder check every 4 hours
  @Cron('0 */4 * * *')
  async checkFollowUpReminders() {
    this.logger.log('Checking follow-up reminders');
    
    try {
      // In a real implementation, this would check for emails that need follow-up
      // For now, we'll simulate some follow-up logic
      
      const analytics = await this.emailService.getEmailAnalytics({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      });
      
      // If email response rate is low, suggest follow-ups
      const responseRate = analytics.sent > 0 ? (analytics.opened / analytics.sent) * 100 : 0;
      
      if (responseRate < 30 && analytics.sent > 5) {
        await this.emailService.sendEmail(
          'executive@company.com',
          'Follow-up Suggestion: Low Email Response Rate',
          `Your email response rate this week is ${responseRate.toFixed(1)}%. Consider following up on important emails that haven't received responses.`,
        );
        
        this.logger.log('Follow-up suggestion sent due to low response rate');
      }
    } catch (error) {
      this.logger.error('Error checking follow-up reminders:', error);
    }
  }

  // Proactive meeting preparation - 1 hour before meetings
  @Cron('*/15 * * * *') // Check every 15 minutes
  async prepareMeetings() {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      const upcomingEvents = await this.calendarService.getUpcomingEvents(10, now, oneHourFromNow);
      
      for (const event of upcomingEvents) {
        const eventStart = new Date(event.start.dateTime);
        const minutesUntilMeeting = (eventStart.getTime() - now.getTime()) / (1000 * 60);
        
        // Send preparation reminder 60 minutes before
        if (minutesUntilMeeting <= 60 && minutesUntilMeeting > 45) {
          await this.sendMeetingPreparationReminder(event);
        }
      }
    } catch (error) {
      this.logger.error('Error preparing meetings:', error);
    }
  }

  async createDailyBriefing(): Promise<DailyBriefing> {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Get today's events
    const upcomingMeetings = await this.calendarService.getUpcomingEvents(10, today, tomorrow);
    
    // Get priority tasks
    const priorityTasks = this.tasksService.getPriorityTasks(5);
    
    // Get important emails (simulated)
    const importantEmails = []; // In real implementation, would fetch from email service
    
    // Generate AI-powered suggestions
    const suggestions = await this.generateDailySuggestions(upcomingMeetings, priorityTasks);
    
    return {
      date: today,
      upcomingMeetings,
      priorityTasks,
      importantEmails,
      suggestions,
    };
  }

  async triggerProactiveAction(actionType: string, context: any): Promise<boolean> {
    this.logger.log(`Triggering proactive action: ${actionType}`);
    
    try {
      switch (actionType) {
        case 'daily_briefing':
          await this.generateDailyBriefing();
          break;
          
        case 'task_reminder':
          await this.checkUrgentTasks();
          break;
          
        case 'calendar_optimization':
          await this.optimizeWeeklyCalendar();
          break;
          
        case 'follow_up_check':
          await this.checkFollowUpReminders();
          break;
          
        default:
          this.logger.warn(`Unknown proactive action type: ${actionType}`);
          return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error triggering proactive action ${actionType}:`, error);
      return false;
    }
  }

  private async generateDailySuggestions(meetings: any[], tasks: any[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Meeting-based suggestions
    if (meetings.length > 5) {
      suggestions.push('Consider blocking time for deep work between meetings');
    }
    
    if (meetings.some(m => !m.description)) {
      suggestions.push('Add agendas to meetings without descriptions');
    }
    
    // Task-based suggestions
    if (tasks.length > 3) {
      suggestions.push('Consider delegating some high-priority tasks');
    }
    
    const overdueTasks = this.tasksService.getOverdueTasks();
    if (overdueTasks.length > 0) {
      suggestions.push(`Address ${overdueTasks.length} overdue tasks today`);
    }
    
    // Time management suggestions
    const now = new Date();
    if (now.getHours() < 10) {
      suggestions.push('Start with your most important task while energy is high');
    }
    
    return suggestions;
  }

  private createTaskAlert(urgentTasks: any[], overdueTasks: any[]): string {
    let html = '<h2>Task Alert</h2>';
    
    if (urgentTasks.length > 0) {
      html += '<h3>Urgent Tasks:</h3><ul>';
      urgentTasks.forEach(task => {
        html += `<li><strong>${task.title}</strong> - Due: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}</li>`;
      });
      html += '</ul>';
    }
    
    if (overdueTasks.length > 0) {
      html += '<h3>Overdue Tasks:</h3><ul>';
      overdueTasks.forEach(task => {
        html += `<li><strong>${task.title}</strong> - Was due: ${task.dueDate.toLocaleDateString()}</li>`;
      });
      html += '</ul>';
    }
    
    html += '<p>Please review and prioritize these tasks.</p>';
    return html;
  }

  private generateCalendarOptimizations(events: any[], conflicts: any): string {
    let html = '<h2>Weekly Calendar Optimization</h2>';
    
    if (conflicts.conflicts.length > 0) {
      html += '<h3>Scheduling Conflicts Detected:</h3><ul>';
      conflicts.conflicts.forEach(conflict => {
        html += `<li>${conflict.summary} - ${new Date(conflict.start.dateTime).toLocaleString()}</li>`;
      });
      html += '</ul>';
    }
    
    html += '<h3>Suggestions:</h3><ul>';
    conflicts.suggestions.forEach(suggestion => {
      html += `<li>${suggestion}</li>`;
    });
    html += '</ul>';
    
    return html;
  }

  private formatBriefingAsHtml(briefing: DailyBriefing): string {
    let html = `<h1>Daily Briefing - ${briefing.date.toDateString()}</h1>`;
    
    // Meetings section
    html += '<h2>📅 Today\'s Schedule</h2>';
    if (briefing.upcomingMeetings.length > 0) {
      html += '<ul>';
      briefing.upcomingMeetings.forEach(meeting => {
        const startTime = new Date(meeting.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `<li><strong>${startTime}</strong> - ${meeting.summary}</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p>No meetings scheduled for today.</p>';
    }
    
    // Tasks section
    html += '<h2>🎯 Priority Tasks</h2>';
    if (briefing.priorityTasks.length > 0) {
      html += '<ul>';
      briefing.priorityTasks.forEach(task => {
        html += `<li><strong>${task.title}</strong> (${task.priority}) - Due: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p>No priority tasks for today.</p>';
    }
    
    // Suggestions section
    html += '<h2>💡 Suggestions</h2>';
    if (briefing.suggestions.length > 0) {
      html += '<ul>';
      briefing.suggestions.forEach(suggestion => {
        html += `<li>${suggestion}</li>`;
      });
      html += '</ul>';
    }
    
    html += '<p>Have a productive day!</p>';
    return html;
  }

  private async sendMeetingPreparationReminder(event: any) {
    const reminderHtml = `
      <h2>Meeting Preparation Reminder</h2>
      <p>Your meeting "${event.summary}" starts in 1 hour.</p>
      <p><strong>Time:</strong> ${new Date(event.start.dateTime).toLocaleString()}</p>
      ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
      ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
      <p>Consider reviewing the agenda and preparing any necessary materials.</p>
    `;
    
    await this.emailService.sendEmail(
      'executive@company.com',
      `Meeting Reminder: ${event.summary}`,
      reminderHtml,
    );
    
    this.logger.log(`Meeting preparation reminder sent for: ${event.summary}`);
  }
}
