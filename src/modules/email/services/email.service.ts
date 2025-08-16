/**
 * Email Service
 * Main service for email operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { SendGridService } from './sendgrid.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly sendGrid: SendGridService) {}

  async sendEmail(emailData: any): Promise<any> {
    try {
      return await this.sendGrid.sendEmail(emailData);
    } catch (error) {
      this.logger.error('Failed to send email', error.stack);
      throw error;
    }
  }

  async sendTemplateEmail(templateData: any): Promise<any> {
    try {
      const template = this.getEmailTemplate(templateData.templateName);

      if (!template) {
        throw new Error(`Template '${templateData.templateName}' not found`);
      }

      const processedTemplate = this.processTemplate(
        template,
        templateData.variables || {},
      );

      const emailData = {
        to: templateData.to,
        from: templateData.from,
        subject: processedTemplate.subject,
        text: processedTemplate.text,
        html: processedTemplate.html,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      this.logger.error('Failed to send template email', error.stack);
      throw error;
    }
  }

  async getTemplates(): Promise<any[]> {
    return [
      {
        name: 'meeting_reminder',
        subject: 'Meeting Reminder: {{meetingTitle}}',
        description: 'Reminder for upcoming meetings',
      },
      {
        name: 'follow_up',
        subject: 'Follow-up: {{subject}}',
        description: 'Follow-up email template',
      },
      {
        name: 'task_assignment',
        subject: 'New Task Assigned: {{taskTitle}}',
        description: 'Task assignment notification',
      },
      {
        name: 'daily_briefing',
        subject: 'Daily Briefing - {{date}}',
        description: 'Daily briefing summary',
      },
    ];
  }

  getHealth(): any {
    return {
      status: 'healthy',
      sendGrid: this.sendGrid.getStatus(),
      features: ['send', 'templates', 'html'],
      timestamp: new Date().toISOString(),
    };
  }

  private getEmailTemplate(templateName: string): any {
    const templates: Record<string, any> = {
      meeting_reminder: {
        subject: 'Meeting Reminder: {{meetingTitle}}',
        text: `Hi {{recipientName}},\n\nThis is a reminder about your upcoming meeting:\n\nMeeting: {{meetingTitle}}\nDate: {{meetingDate}}\nTime: {{meetingTime}}\nLocation: {{meetingLocation}}\n\nBest regards,\nExecutive Assistant AI`,
        html: `<h2>Meeting Reminder</h2><p>Hi {{recipientName}},</p><p>This is a reminder about your upcoming meeting:</p><ul><li><strong>Meeting:</strong> {{meetingTitle}}</li><li><strong>Date:</strong> {{meetingDate}}</li><li><strong>Time:</strong> {{meetingTime}}</li><li><strong>Location:</strong> {{meetingLocation}}</li></ul><p>Best regards,<br>Executive Assistant AI</p>`,
      },
      follow_up: {
        subject: 'Follow-up: {{subject}}',
        text: `Hi {{recipientName}},\n\nI wanted to follow up on {{subject}}.\n\n{{message}}\n\nBest regards,\nExecutive Assistant AI`,
        html: `<h2>Follow-up</h2><p>Hi {{recipientName}},</p><p>I wanted to follow up on {{subject}}.</p><p>{{message}}</p><p>Best regards,<br>Executive Assistant AI</p>`,
      },
    };

    return templates[templateName];
  }

  private processTemplate(template: any, variables: any): any {
    let processedSubject = template.subject;
    let processedText = template.text;
    let processedHtml = template.html;

    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`;
      const value = variables[key] || '';

      processedSubject = processedSubject.replace(
        new RegExp(placeholder, 'g'),
        value,
      );
      processedText = processedText.replace(
        new RegExp(placeholder, 'g'),
        value,
      );
      processedHtml = processedHtml.replace(
        new RegExp(placeholder, 'g'),
        value,
      );
    });

    return {
      subject: processedSubject,
      text: processedText,
      html: processedHtml,
    };
  }
}
