import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getApiInfo(): any {
    return {
      name: this.configService.get<string>('app.name'),
      version: '1.0.0',
      description: 'AI-powered Executive Assistant automation platform',
      environment: this.configService.get<string>('app.environment'),
      documentation: {
        swagger: '/api/docs',
        postman: '/api/postman',
      },
      endpoints: {
        ai: '/api/assistant',
        calendar: '/api/calendar',
        email: '/api/email',
        tasks: '/api/tasks',
        automation: '/api/automation',
      },
      features: [
        'Natural Language Processing with Gemini AI',
        'Google Calendar Integration',
        'SendGrid Email Automation',
        'Intelligent Task Management',
        'Proactive Automation & Scheduling',
        'Daily Briefings & Analytics',
      ],
      status: 'operational',
      uptime: process.uptime(),
    };
  }

  getHealthStatus(): any {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: this.configService.get<string>('app.environment'),
      services: {
        ai: 'operational',
        calendar: 'operational',
        email: 'operational',
        tasks: 'operational',
        automation: 'operational',
      },
    };
  }

  getFeatures(): any {
    return {
      aiAssistant: {
        description: 'Natural language processing for executive tasks',
        capabilities: [
          'Meeting scheduling',
          'Email composition',
          'Task creation and management',
          'Calendar optimization',
          'Daily briefing generation',
        ],
        endpoints: [
          'POST /api/assistant/process',
          'GET /api/assistant/briefing',
          'POST /api/assistant/analyze',
        ],
      },
      calendarManagement: {
        description: 'Intelligent calendar and meeting management',
        capabilities: [
          'Meeting scheduling and rescheduling',
          'Availability checking',
          'Conflict resolution',
          'Calendar analytics',
          'Meeting preparation reminders',
        ],
        endpoints: [
          'GET /api/calendar/events',
          'POST /api/calendar/schedule',
          'POST /api/calendar/intelligent-schedule',
          'POST /api/calendar/availability',
        ],
      },
      emailAutomation: {
        description: 'Automated email management and templates',
        capabilities: [
          'Template-based email sending',
          'Follow-up automation',
          'Email analytics',
          'Bulk email operations',
          'Meeting confirmations',
        ],
        endpoints: [
          'POST /api/email/send',
          'POST /api/email/send-template',
          'GET /api/email/templates',
          'POST /api/email/schedule-followup',
        ],
      },
      taskManagement: {
        description: 'Comprehensive task and reminder system',
        capabilities: [
          'Priority-based task organization',
          'Automated reminders',
          'Task analytics',
          'Smart prioritization',
          'Deadline tracking',
        ],
        endpoints: [
          'GET /api/tasks',
          'POST /api/tasks',
          'GET /api/tasks/priority',
          'POST /api/tasks/smart-prioritize',
        ],
      },
      proactiveAutomation: {
        description: 'Scheduled automation and proactive assistance',
        capabilities: [
          'Daily briefings',
          'Task alerts',
          'Calendar optimization',
          'Follow-up reminders',
          'Meeting preparation',
        ],
        endpoints: [
          'GET /api/automation/briefing',
          'POST /api/automation/trigger',
          'GET /api/automation/status',
          'POST /api/automation/configure',
        ],
      },
    };
  }

  getMetrics(): any {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      application: {
        name: 'Executive Assistant AI',
        version: '2.0.0',
        uptime: process.uptime(),
        environment: this.configService.get<string>('NODE_ENV', 'development'),
      },
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          unit: 'MB',
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        process: {
          pid: process.pid,
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
