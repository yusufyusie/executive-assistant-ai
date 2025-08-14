import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { EmailTemplate, EmailCategory, EmailAnalytics } from '../common/interfaces';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templates: Map<string, EmailTemplate> = new Map();
  private readonly sentEmails: any[] = []; // In production, use a proper database

  constructor(private configService: ConfigService) {
    this.initializeSendGrid();
    this.loadDefaultTemplates();
  }

  private initializeSendGrid() {
    const apiKey = this.configService.get<string>('sendgrid.apiKey');
    
    if (!apiKey || apiKey === 'demo_sendgrid_key') {
      this.logger.warn('SendGrid API key not configured. Email features will be simulated.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.logger.log('SendGrid initialized successfully');
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    content: string,
    options?: {
      cc?: string[];
      bcc?: string[];
      templateId?: string;
      templateVariables?: Record<string, any>;
      attachments?: any[];
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const fromEmail = this.configService.get<string>('sendgrid.fromEmail');
      const fromName = this.configService.get<string>('sendgrid.fromName');

      if (!fromEmail || fromEmail === 'assistant@example.com') {
        // Simulate email sending
        const messageId = `mock-${Date.now()}`;
        this.sentEmails.push({
          to,
          subject,
          content,
          sentAt: new Date(),
          messageId,
          status: 'sent',
        });
        
        this.logger.log(`Mock email sent to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`);
        return { success: true, messageId };
      }

      const msg: any = {
        to: Array.isArray(to) ? to : [to],
        from: { email: fromEmail, name: fromName },
        subject,
        html: content,
        text: this.stripHtml(content),
      };

      if (options?.cc) msg.cc = options.cc;
      if (options?.bcc) msg.bcc = options.bcc;
      if (options?.attachments) msg.attachments = options.attachments;

      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'];

      // Store email record
      this.sentEmails.push({
        to,
        subject,
        content,
        sentAt: new Date(),
        messageId,
        status: 'sent',
      });

      this.logger.log(`Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
      return { success: true, messageId };
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTemplatedEmail(
    to: string | string[],
    templateId: string,
    variables: Record<string, any> = {},
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      let subject = template.subject;
      let content = template.htmlContent;

      // Replace template variables
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      }

      return await this.sendEmail(to, subject, content);
    } catch (error) {
      this.logger.error('Error sending templated email:', error);
      return { success: false, error: error.message };
    }
  }

  async scheduleFollowUp(
    originalEmailId: string,
    followUpTemplateId: string,
    delayHours: number,
    variables: Record<string, any> = {},
  ): Promise<{ success: boolean; scheduledId?: string }> {
    try {
      // In a real implementation, this would use a job queue or scheduler
      const scheduledTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);
      const scheduledId = `followup-${Date.now()}`;

      // Simulate scheduling
      setTimeout(async () => {
        const originalEmail = this.sentEmails.find(email => email.messageId === originalEmailId);
        if (originalEmail) {
          await this.sendTemplatedEmail(originalEmail.to, followUpTemplateId, variables);
          this.logger.log(`Follow-up email sent for ${originalEmailId}`);
        }
      }, delayHours * 60 * 60 * 1000);

      this.logger.log(`Follow-up scheduled for ${scheduledTime.toISOString()}`);
      return { success: true, scheduledId };
    } catch (error) {
      this.logger.error('Error scheduling follow-up:', error);
      return { success: false };
    }
  }

  createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    this.logger.log(`Email template created: ${newTemplate.name}`);
    
    return newTemplate;
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: EmailCategory): EmailTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  updateTemplate(templateId: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updatedTemplate);
    this.logger.log(`Email template updated: ${templateId}`);
    
    return updatedTemplate;
  }

  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.logger.log(`Email template deleted: ${templateId}`);
    }
    return deleted;
  }

  async getEmailAnalytics(period: { start: Date; end: Date }): Promise<EmailAnalytics> {
    const emailsInPeriod = this.sentEmails.filter(email => {
      const sentAt = new Date(email.sentAt);
      return sentAt >= period.start && sentAt <= period.end;
    });

    // In a real implementation, you would get actual delivery, open, click data from SendGrid
    const sent = emailsInPeriod.length;
    const delivered = Math.floor(sent * 0.95); // 95% delivery rate simulation
    const opened = Math.floor(sent * 0.25); // 25% open rate simulation
    const clicked = Math.floor(sent * 0.05); // 5% click rate simulation
    const bounced = sent - delivered;
    const unsubscribed = Math.floor(sent * 0.001); // 0.1% unsubscribe rate

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      period,
    };
  }

  async generateMeetingConfirmationEmail(
    attendeeEmail: string,
    meetingDetails: {
      title: string;
      startTime: string;
      endTime: string;
      location?: string;
      meetingLink?: string;
      organizer: string;
    },
  ): Promise<{ success: boolean; messageId?: string }> {
    const template = this.templates.get('meeting-confirmation');
    if (!template) {
      // Create a basic meeting confirmation email
      const subject = `Meeting Confirmation: ${meetingDetails.title}`;
      const content = `
        <h2>Meeting Confirmation</h2>
        <p>You have a meeting scheduled:</p>
        <ul>
          <li><strong>Title:</strong> ${meetingDetails.title}</li>
          <li><strong>Date & Time:</strong> ${new Date(meetingDetails.startTime).toLocaleString()}</li>
          <li><strong>Duration:</strong> ${this.calculateDuration(meetingDetails.startTime, meetingDetails.endTime)}</li>
          ${meetingDetails.location ? `<li><strong>Location:</strong> ${meetingDetails.location}</li>` : ''}
          ${meetingDetails.meetingLink ? `<li><strong>Join Link:</strong> <a href="${meetingDetails.meetingLink}">Click here to join</a></li>` : ''}
          <li><strong>Organizer:</strong> ${meetingDetails.organizer}</li>
        </ul>
        <p>Please let us know if you have any questions.</p>
      `;

      return await this.sendEmail(attendeeEmail, subject, content);
    }

    return await this.sendTemplatedEmail(attendeeEmail, 'meeting-confirmation', meetingDetails);
  }

  private loadDefaultTemplates() {
    // Meeting Confirmation Template
    this.createTemplate({
      name: 'Meeting Confirmation',
      subject: 'Meeting Confirmation: {{title}}',
      htmlContent: `
        <h2>Meeting Confirmation</h2>
        <p>Dear {{attendeeName}},</p>
        <p>You have a meeting scheduled:</p>
        <ul>
          <li><strong>Title:</strong> {{title}}</li>
          <li><strong>Date & Time:</strong> {{startTime}}</li>
          <li><strong>Duration:</strong> {{duration}}</li>
          <li><strong>Location:</strong> {{location}}</li>
          <li><strong>Organizer:</strong> {{organizer}}</li>
        </ul>
        <p>Please let us know if you have any questions.</p>
        <p>Best regards,<br>Executive Assistant AI</p>
      `,
      textContent: 'Meeting Confirmation: {{title}} on {{startTime}}',
      variables: ['attendeeName', 'title', 'startTime', 'duration', 'location', 'organizer'],
      category: EmailCategory.MEETING_CONFIRMATION,
    });

    // Follow-up Template
    this.createTemplate({
      name: 'General Follow-up',
      subject: 'Follow-up: {{subject}}',
      htmlContent: `
        <p>Hi {{recipientName}},</p>
        <p>I wanted to follow up on {{subject}}.</p>
        <p>{{message}}</p>
        <p>Please let me know if you need any additional information.</p>
        <p>Best regards,<br>{{senderName}}</p>
      `,
      textContent: 'Follow-up on {{subject}}',
      variables: ['recipientName', 'subject', 'message', 'senderName'],
      category: EmailCategory.FOLLOW_UP,
    });

    // Task Reminder Template
    this.createTemplate({
      name: 'Task Reminder',
      subject: 'Reminder: {{taskTitle}}',
      htmlContent: `
        <h2>Task Reminder</h2>
        <p>This is a reminder about the following task:</p>
        <ul>
          <li><strong>Task:</strong> {{taskTitle}}</li>
          <li><strong>Due Date:</strong> {{dueDate}}</li>
          <li><strong>Priority:</strong> {{priority}}</li>
        </ul>
        <p>{{description}}</p>
        <p>Please complete this task by the due date.</p>
      `,
      textContent: 'Reminder: {{taskTitle}} is due on {{dueDate}}',
      variables: ['taskTitle', 'dueDate', 'priority', 'description'],
      category: EmailCategory.REMINDER,
    });

    this.logger.log('Default email templates loaded');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
