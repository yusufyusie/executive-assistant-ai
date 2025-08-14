import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { DailyBriefing } from '../common/interfaces';

@Controller('api/automation')
export class AutomationController {
  private readonly logger = new Logger(AutomationController.name);

  constructor(private readonly automationService: AutomationService) {}

  @Get('briefing')
  async getDailyBriefing(@Query('date') date?: string): Promise<DailyBriefing> {
    this.logger.log('Generating daily briefing on demand');
    
    return await this.automationService.createDailyBriefing();
  }

  @Post('trigger')
  async triggerProactiveAction(
    @Body() body: { actionType: string; context?: any },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Triggering proactive action: ${body.actionType}`);
    
    const success = await this.automationService.triggerProactiveAction(
      body.actionType,
      body.context || {},
    );
    
    return {
      success,
      message: success 
        ? `Proactive action '${body.actionType}' triggered successfully`
        : `Failed to trigger proactive action '${body.actionType}'`,
    };
  }

  @Post('schedule-briefing')
  async scheduleDailyBriefing(
    @Body() body: { time: string; timezone?: string; enabled: boolean },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Scheduling daily briefing at ${body.time}`);
    
    // In a real implementation, this would configure GCP Cloud Scheduler
    // For now, we'll just return a success message
    
    return {
      success: true,
      message: body.enabled 
        ? `Daily briefing scheduled for ${body.time} ${body.timezone || 'UTC'}`
        : 'Daily briefing scheduling disabled',
    };
  }

  @Get('status')
  async getAutomationStatus(): Promise<{
    dailyBriefing: { enabled: boolean; nextRun: string };
    taskReminders: { enabled: boolean; nextRun: string };
    calendarOptimization: { enabled: boolean; nextRun: string };
    followUpChecks: { enabled: boolean; nextRun: string };
  }> {
    this.logger.log('Getting automation status');
    
    // In a real implementation, this would check actual scheduled jobs
    const now = new Date();
    
    return {
      dailyBriefing: {
        enabled: true,
        nextRun: this.getNextRunTime(8, 0), // 8:00 AM daily
      },
      taskReminders: {
        enabled: true,
        nextRun: this.getNextRunTime(9, 0), // Next business hour check
      },
      calendarOptimization: {
        enabled: true,
        nextRun: this.getNextSunday(18, 0), // Sunday 6 PM
      },
      followUpChecks: {
        enabled: true,
        nextRun: this.getNext4HourInterval(),
      },
    };
  }

  @Post('configure')
  async configureAutomation(
    @Body() body: {
      dailyBriefing?: { enabled: boolean; time: string };
      taskReminders?: { enabled: boolean; interval: number };
      calendarOptimization?: { enabled: boolean; day: string; time: string };
      followUpChecks?: { enabled: boolean; interval: number };
    },
  ): Promise<{ success: boolean; message: string; configuration: any }> {
    this.logger.log('Configuring automation settings');
    
    // In a real implementation, this would update GCP Cloud Scheduler jobs
    // For now, we'll just return the configuration
    
    return {
      success: true,
      message: 'Automation configuration updated successfully',
      configuration: body,
    };
  }

  @Get('analytics')
  async getAutomationAnalytics(
    @Query('period') period: string = 'week',
  ): Promise<{
    briefingsSent: number;
    taskAlertsSent: number;
    calendarOptimizations: number;
    followUpReminders: number;
    totalAutomatedActions: number;
    period: string;
  }> {
    this.logger.log(`Getting automation analytics for period: ${period}`);
    
    // In a real implementation, this would fetch actual metrics
    // For now, we'll return simulated data
    
    const multiplier = period === 'month' ? 4 : period === 'week' ? 1 : 0.14; // day
    
    const briefingsSent = Math.floor(7 * multiplier); // Daily briefings
    const taskAlertsSent = Math.floor(3 * multiplier); // Few task alerts
    const calendarOptimizations = Math.floor(1 * multiplier); // Weekly optimization
    const followUpReminders = Math.floor(5 * multiplier); // Several follow-ups
    
    return {
      briefingsSent,
      taskAlertsSent,
      calendarOptimizations,
      followUpReminders,
      totalAutomatedActions: briefingsSent + taskAlertsSent + calendarOptimizations + followUpReminders,
      period,
    };
  }

  @Post('test-automation')
  async testAutomation(
    @Body() body: { type: string },
  ): Promise<{ success: boolean; message: string; result?: any }> {
    this.logger.log(`Testing automation: ${body.type}`);
    
    try {
      let result;
      
      switch (body.type) {
        case 'daily_briefing':
          result = await this.automationService.generateDailyBriefing();
          break;
          
        case 'task_check':
          await this.automationService.checkUrgentTasks();
          result = 'Task check completed';
          break;
          
        case 'calendar_optimization':
          await this.automationService.optimizeWeeklyCalendar();
          result = 'Calendar optimization completed';
          break;
          
        case 'follow_up_check':
          await this.automationService.checkFollowUpReminders();
          result = 'Follow-up check completed';
          break;
          
        default:
          return {
            success: false,
            message: `Unknown automation type: ${body.type}`,
          };
      }
      
      return {
        success: true,
        message: `Automation test completed successfully`,
        result,
      };
    } catch (error) {
      this.logger.error(`Error testing automation ${body.type}:`, error);
      return {
        success: false,
        message: `Automation test failed: ${error.message}`,
      };
    }
  }

  @Get('health')
  async getAutomationHealth(): Promise<{
    status: string;
    scheduledJobs: number;
    lastBriefing: string;
    lastTaskCheck: string;
    issues: string[];
  }> {
    this.logger.log('Checking automation health');
    
    // In a real implementation, this would check actual job statuses
    return {
      status: 'healthy',
      scheduledJobs: 4, // Number of active scheduled jobs
      lastBriefing: new Date().toISOString(),
      lastTaskCheck: new Date().toISOString(),
      issues: [], // Any detected issues
    };
  }

  private getNextRunTime(hour: number, minute: number): string {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }

  private getNextSunday(hour: number, minute: number): string {
    const now = new Date();
    const next = new Date();
    
    // Calculate days until next Sunday (0 = Sunday)
    const daysUntilSunday = (7 - now.getDay()) % 7;
    next.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    next.setHours(hour, minute, 0, 0);
    
    return next.toISOString();
  }

  private getNext4HourInterval(): string {
    const now = new Date();
    const next = new Date();
    
    // Round up to next 4-hour interval
    const currentHour = now.getHours();
    const nextInterval = Math.ceil((currentHour + 1) / 4) * 4;
    
    next.setHours(nextInterval, 0, 0, 0);
    
    // If we've gone past midnight, it's tomorrow
    if (nextInterval >= 24) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    }
    
    return next.toISOString();
  }
}
