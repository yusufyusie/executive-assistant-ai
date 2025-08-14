import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto, CreateEmailTemplateDto } from '../common/dto';
import { EmailTemplate, EmailCategory, EmailAnalytics } from '../common/interfaces';

@Controller('api/email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() dto: SendEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.logger.log(`Sending email to: ${dto.to}`);
    
    if (dto.templateId) {
      return await this.emailService.sendTemplatedEmail(
        dto.to,
        dto.templateId,
        dto.templateVariables || {},
      );
    }

    return await this.emailService.sendEmail(
      dto.to,
      dto.subject,
      dto.content,
      {
        cc: dto.cc,
        bcc: dto.bcc,
      },
    );
  }

  @Post('send-template')
  async sendTemplatedEmail(
    @Body() body: {
      to: string | string[];
      templateId: string;
      variables: Record<string, any>;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.logger.log(`Sending templated email using template: ${body.templateId}`);
    
    return await this.emailService.sendTemplatedEmail(
      body.to,
      body.templateId,
      body.variables,
    );
  }

  @Post('schedule-followup')
  async scheduleFollowUp(
    @Body() body: {
      originalEmailId: string;
      templateId: string;
      delayHours: number;
      variables?: Record<string, any>;
    },
  ): Promise<{ success: boolean; scheduledId?: string }> {
    this.logger.log(`Scheduling follow-up for email: ${body.originalEmailId}`);
    
    return await this.emailService.scheduleFollowUp(
      body.originalEmailId,
      body.templateId,
      body.delayHours,
      body.variables || {},
    );
  }

  @Post('meeting-confirmation')
  async sendMeetingConfirmation(
    @Body() body: {
      attendeeEmail: string;
      meetingDetails: {
        title: string;
        startTime: string;
        endTime: string;
        location?: string;
        meetingLink?: string;
        organizer: string;
      };
    },
  ): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`Sending meeting confirmation to: ${body.attendeeEmail}`);
    
    return await this.emailService.generateMeetingConfirmationEmail(
      body.attendeeEmail,
      body.meetingDetails,
    );
  }

  @Get('templates')
  async getTemplates(@Query('category') category?: EmailCategory): Promise<EmailTemplate[]> {
    this.logger.log('Fetching email templates');
    
    if (category) {
      return this.emailService.getTemplatesByCategory(category);
    }
    
    return this.emailService.getAllTemplates();
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') templateId: string): Promise<EmailTemplate | null> {
    this.logger.log(`Fetching email template: ${templateId}`);
    
    const template = this.emailService.getTemplate(templateId);
    return template || null;
  }

  @Post('templates')
  async createTemplate(@Body() dto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    this.logger.log(`Creating email template: ${dto.name}`);

    return this.emailService.createTemplate({
      ...dto,
      variables: dto.variables || [],
    });
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') templateId: string,
    @Body() updates: Partial<EmailTemplate>,
  ): Promise<EmailTemplate | null> {
    this.logger.log(`Updating email template: ${templateId}`);
    
    return this.emailService.updateTemplate(templateId, updates);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') templateId: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting email template: ${templateId}`);
    
    const success = this.emailService.deleteTemplate(templateId);
    return { success };
  }

  @Get('analytics')
  async getEmailAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<EmailAnalytics> {
    this.logger.log('Fetching email analytics');
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await this.emailService.getEmailAnalytics({ start, end });
  }

  @Post('bulk-send')
  async sendBulkEmails(
    @Body() body: {
      recipients: string[];
      subject: string;
      content: string;
      templateId?: string;
      variables?: Record<string, any>;
    },
  ): Promise<{
    totalSent: number;
    successful: number;
    failed: number;
    results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    this.logger.log(`Sending bulk emails to ${body.recipients.length} recipients`);
    
    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const recipient of body.recipients) {
      try {
        let result;
        
        if (body.templateId) {
          result = await this.emailService.sendTemplatedEmail(
            recipient,
            body.templateId,
            body.variables || {},
          );
        } else {
          result = await this.emailService.sendEmail(
            recipient,
            body.subject,
            body.content,
          );
        }

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        results.push({
          email: recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });
      } catch (error) {
        failed++;
        results.push({
          email: recipient,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      totalSent: body.recipients.length,
      successful,
      failed,
      results,
    };
  }

  @Get('health')
  async getHealthStatus(): Promise<{ status: string; emailEnabled: boolean }> {
    try {
      // Test email sending capability
      const testResult = await this.emailService.sendEmail(
        'test@example.com',
        'Health Check',
        'This is a health check email',
      );

      return {
        status: testResult.success ? 'healthy' : 'degraded',
        emailEnabled: testResult.success,
      };
    } catch (error) {
      this.logger.error('Email health check failed:', error);
      return {
        status: 'degraded',
        emailEnabled: false,
      };
    }
  }

  @Post('auto-reply')
  async setupAutoReply(
    @Body() body: {
      enabled: boolean;
      subject: string;
      message: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Setting up auto-reply: ${body.enabled ? 'enabled' : 'disabled'}`);
    
    // In a real implementation, this would configure auto-reply rules
    // For now, just return a success message
    
    return {
      success: true,
      message: body.enabled 
        ? 'Auto-reply has been enabled'
        : 'Auto-reply has been disabled',
    };
  }

  @Get('suggestions')
  async getEmailSuggestions(
    @Query('context') context?: string,
  ): Promise<{ suggestions: string[]; templates: EmailTemplate[] }> {
    this.logger.log('Generating email suggestions');
    
    const suggestions = [
      'Send a follow-up email for pending responses',
      'Schedule weekly team update emails',
      'Create a meeting recap template',
      'Set up automated thank you emails',
      'Configure deadline reminder emails',
    ];

    const relevantTemplates = this.emailService.getAllTemplates().slice(0, 3);

    return {
      suggestions,
      templates: relevantTemplates,
    };
  }
}
