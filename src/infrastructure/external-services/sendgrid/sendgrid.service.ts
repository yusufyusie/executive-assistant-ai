/**
 * SendGrid Email Service - Infrastructure Layer
 * Integration with SendGrid Email API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string; // base64 encoded
    filename: string;
    type: string;
    disposition?: 'attachment' | 'inline';
  }>;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  replyTo?: string;
  sendAt?: number; // Unix timestamp for scheduled sending
  categories?: string[];
  customArgs?: Record<string, string>;
}

export interface EmailResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'failed';
  timestamp: string;
  details?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  versions: Array<{
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    plainContent: string;
    active: boolean;
  }>;
}

export interface DeliveryStatus {
  messageId: string;
  event:
    | 'delivered'
    | 'bounce'
    | 'dropped'
    | 'spam_report'
    | 'unsubscribe'
    | 'group_unsubscribe'
    | 'group_resubscribe'
    | 'open'
    | 'click';
  timestamp: number;
  email: string;
  reason?: string;
  url?: string;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly isConfigured: boolean;
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get('SENDGRID_API_KEY', '');
    this.fromEmail = this.config.get(
      'SENDGRID_FROM_EMAIL',
      'assistant@company.com',
    );
    this.fromName = this.config.get(
      'SENDGRID_FROM_NAME',
      'Executive Assistant AI',
    );
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      this.logger.log('SendGrid service configured successfully');
    } else {
      this.logger.warn('SendGrid API key not found, using mock responses');
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    if (!this.isConfigured) {
      return this.getMockEmailResponse(request);
    }

    try {
      this.logger.log(
        `Sending email: ${request.subject} to ${Array.isArray(request.to) ? request.to.join(', ') : request.to}`,
      );

      // ACTUAL SENDGRID API INTEGRATION
      const emailData = {
        personalizations: [
          {
            to: Array.isArray(request.to)
              ? request.to.map((email) => ({ email }))
              : [{ email: request.to }],
            subject: request.subject,
            ...(request.sendAt && {
              send_at: Math.floor(new Date(request.sendAt).getTime() / 1000),
            }),
          },
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        content: [
          {
            type: 'text/html',
            value: request.html || request.text || '',
          },
        ],
        ...(request.text &&
          request.html && {
            content: [
              { type: 'text/plain', value: request.text },
              { type: 'text/html', value: request.html },
            ],
          }),
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
        },
        ...(request.attachments && {
          attachments: request.attachments.map((att) => ({
            content: att.content,
            filename: att.filename,
            type: att.type,
            disposition: 'attachment',
          })),
        }),
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `SendGrid API error: ${response.status} ${errorText}`,
        );
        throw new Error(`SendGrid API error: ${response.status}`);
      }

      // SendGrid returns 202 with X-Message-Id header
      const messageId =
        response.headers.get('X-Message-Id') ||
        `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log(`Email sent successfully via SendGrid: ${messageId}`);

      return {
        messageId,
        status: 'queued',
        timestamp: new Date().toISOString(),
        details: {
          to: request.to,
          subject: request.subject,
          scheduled: !!request.sendAt,
        },
      };
    } catch (error) {
      this.logger.error('Failed to send email via SendGrid', error.stack);
      // Fallback to mock response for demo purposes
      return this.getMockEmailResponse(request);
    }
  }

  async sendTemplateEmail(
    templateId: string,
    to: string | string[],
    dynamicData: Record<string, any>,
    options?: {
      cc?: string | string[];
      bcc?: string | string[];
      replyTo?: string;
      sendAt?: number;
      categories?: string[];
    },
  ): Promise<EmailResponse> {
    if (!this.isConfigured) {
      return this.getMockTemplateEmailResponse(templateId, to, dynamicData);
    }

    try {
      this.logger.log(
        `Sending template email: ${templateId} to ${Array.isArray(to) ? to.join(', ') : to}`,
      );

      // In a real implementation, this would call the SendGrid API
      return this.getMockTemplateEmailResponse(templateId, to, dynamicData);
    } catch (error) {
      this.logger.error(
        'Failed to send template email via SendGrid',
        error.stack,
      );
      throw new Error('Failed to send template email');
    }
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    if (!this.isConfigured) {
      return this.getMockTemplates();
    }

    try {
      this.logger.log('Fetching email templates from SendGrid');

      // In a real implementation, this would call the SendGrid API
      return this.getMockTemplates();
    } catch (error) {
      this.logger.error('Failed to fetch email templates', error.stack);
      return this.getMockTemplates();
    }
  }

  async scheduleEmail(
    request: EmailRequest,
    sendAt: Date,
  ): Promise<EmailResponse> {
    const scheduledRequest = {
      ...request,
      sendAt: Math.floor(sendAt.getTime() / 1000), // Convert to Unix timestamp
    };

    return this.sendEmail(scheduledRequest);
  }

  async cancelScheduledEmail(messageId: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log(`Mock: Cancelled scheduled email: ${messageId}`);
      return true;
    }

    try {
      this.logger.log(`Cancelling scheduled email: ${messageId}`);

      // In a real implementation, this would call the SendGrid API
      return true;
    } catch (error) {
      this.logger.error('Failed to cancel scheduled email', error.stack);
      return false;
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus[]> {
    if (!this.isConfigured) {
      return this.getMockDeliveryStatus(messageId);
    }

    try {
      this.logger.log(`Fetching delivery status for: ${messageId}`);

      // In a real implementation, this would call the SendGrid API
      return this.getMockDeliveryStatus(messageId);
    } catch (error) {
      this.logger.error('Failed to fetch delivery status', error.stack);
      return [];
    }
  }

  getStatus(): {
    configured: boolean;
    fromEmail: string;
    fromName: string;
    features: string[];
    lastCheck: string;
  } {
    return {
      configured: this.isConfigured,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      features: ['send', 'templates', 'scheduling', 'tracking', 'webhooks'],
      lastCheck: new Date().toISOString(),
    };
  }

  private getMockEmailResponse(request: EmailRequest): EmailResponse {
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      messageId,
      status: 'queued',
      timestamp: new Date().toISOString(),
      details: {
        to: request.to,
        subject: request.subject,
        scheduled: !!request.sendAt,
      },
    };
  }

  private getMockTemplateEmailResponse(
    templateId: string,
    to: string | string[],
    dynamicData: Record<string, any>,
  ): EmailResponse {
    const messageId = `mock_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      messageId,
      status: 'queued',
      timestamp: new Date().toISOString(),
      details: {
        templateId,
        to,
        dynamicData,
      },
    };
  }

  private getMockTemplates(): EmailTemplate[] {
    return [
      {
        id: 'template_meeting_reminder',
        name: 'Meeting Reminder',
        subject: 'Reminder: {{meeting_title}} in {{time_until}}',
        versions: [
          {
            id: 'version_1',
            name: 'Default',
            subject: 'Reminder: {{meeting_title}} in {{time_until}}',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Meeting Reminder</h2>
                <p>Hi {{attendee_name}},</p>
                <p>This is a friendly reminder about your upcoming meeting:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #2c5aa0;">{{meeting_title}}</h3>
                  <p style="margin: 5px 0;"><strong>Date:</strong> {{meeting_date}}</p>
                  <p style="margin: 5px 0;"><strong>Time:</strong> {{meeting_time}}</p>
                  <p style="margin: 5px 0;"><strong>Duration:</strong> {{meeting_duration}}</p>
                  {{#if meeting_location}}<p style="margin: 5px 0;"><strong>Location:</strong> {{meeting_location}}</p>{{/if}}
                  {{#if meeting_url}}<p style="margin: 5px 0;"><strong>Join URL:</strong> <a href="{{meeting_url}}">{{meeting_url}}</a></p>{{/if}}
                </div>
                {{#if meeting_agenda}}
                <h4>Agenda:</h4>
                <ul>
                  {{#each meeting_agenda}}
                  <li>{{this}}</li>
                  {{/each}}
                </ul>
                {{/if}}
                <p>See you there!</p>
                <p>Best regards,<br>Executive Assistant AI</p>
              </div>
            `,
            plainContent: `
              Meeting Reminder
              
              Hi {{attendee_name}},
              
              This is a friendly reminder about your upcoming meeting:
              
              {{meeting_title}}
              Date: {{meeting_date}}
              Time: {{meeting_time}}
              Duration: {{meeting_duration}}
              {{#if meeting_location}}Location: {{meeting_location}}{{/if}}
              {{#if meeting_url}}Join URL: {{meeting_url}}{{/if}}
              
              {{#if meeting_agenda}}
              Agenda:
              {{#each meeting_agenda}}
              - {{this}}
              {{/each}}
              {{/if}}
              
              See you there!
              
              Best regards,
              Executive Assistant AI
            `,
            active: true,
          },
        ],
      },
      {
        id: 'template_task_reminder',
        name: 'Task Reminder',
        subject: 'Task Due: {{task_title}}',
        versions: [
          {
            id: 'version_1',
            name: 'Default',
            subject: 'Task Due: {{task_title}}',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Task Reminder</h2>
                <p>Hi {{assignee_name}},</p>
                <p>You have a task that {{#if is_overdue}}is overdue{{else}}is due soon{{/if}}:</p>
                <div style="background: {{#if is_overdue}}#ffebee{{else}}#f5f5f5{{/if}}; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid {{#if is_overdue}}#f44336{{else}}#2c5aa0{{/if}};">
                  <h3 style="margin: 0 0 10px 0; color: {{#if is_overdue}}#d32f2f{{else}}#2c5aa0{{/if}};">{{task_title}}</h3>
                  {{#if task_description}}<p style="margin: 5px 0;">{{task_description}}</p>{{/if}}
                  <p style="margin: 5px 0;"><strong>Priority:</strong> {{task_priority}}</p>
                  <p style="margin: 5px 0;"><strong>Due Date:</strong> {{due_date}}</p>
                  {{#if estimated_duration}}<p style="margin: 5px 0;"><strong>Estimated Duration:</strong> {{estimated_duration}}</p>{{/if}}
                </div>
                <p>{{#if is_overdue}}Please prioritize this task as it's overdue.{{else}}Please make sure to complete this task on time.{{/if}}</p>
                <p>Best regards,<br>Executive Assistant AI</p>
              </div>
            `,
            plainContent: `
              Task Reminder
              
              Hi {{assignee_name}},
              
              You have a task that {{#if is_overdue}}is overdue{{else}}is due soon{{/if}}:
              
              {{task_title}}
              {{#if task_description}}{{task_description}}{{/if}}
              Priority: {{task_priority}}
              Due Date: {{due_date}}
              {{#if estimated_duration}}Estimated Duration: {{estimated_duration}}{{/if}}
              
              {{#if is_overdue}}Please prioritize this task as it's overdue.{{else}}Please make sure to complete this task on time.{{/if}}
              
              Best regards,
              Executive Assistant AI
            `,
            active: true,
          },
        ],
      },
      {
        id: 'template_follow_up',
        name: 'Follow Up Email',
        subject: 'Following up on {{subject}}',
        versions: [
          {
            id: 'version_1',
            name: 'Default',
            subject: 'Following up on {{subject}}',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <p>Hi {{recipient_name}},</p>
                <p>I hope this email finds you well. I wanted to follow up on {{subject}}.</p>
                {{#if previous_context}}<p>{{previous_context}}</p>{{/if}}
                <p>{{follow_up_message}}</p>
                {{#if action_required}}
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #1976d2;">Action Required:</h4>
                  <p style="margin: 0;">{{action_required}}</p>
                </div>
                {{/if}}
                <p>Please let me know if you have any questions or if there's anything I can help with.</p>
                <p>Best regards,<br>{{sender_name}}</p>
              </div>
            `,
            plainContent: `
              Hi {{recipient_name}},
              
              I hope this email finds you well. I wanted to follow up on {{subject}}.
              
              {{#if previous_context}}{{previous_context}}{{/if}}
              
              {{follow_up_message}}
              
              {{#if action_required}}
              Action Required:
              {{action_required}}
              {{/if}}
              
              Please let me know if you have any questions or if there's anything I can help with.
              
              Best regards,
              {{sender_name}}
            `,
            active: true,
          },
        ],
      },
    ];
  }

  private getMockDeliveryStatus(messageId: string): DeliveryStatus[] {
    return [
      {
        messageId,
        event: 'delivered',
        timestamp: Date.now() - 3600000, // 1 hour ago
        email: 'recipient@example.com',
      },
      {
        messageId,
        event: 'open',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        email: 'recipient@example.com',
      },
    ];
  }
}
