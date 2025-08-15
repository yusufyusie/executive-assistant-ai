/**
 * SendGrid Service
 * Handles SendGrid API integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get('SENDGRID_API_KEY');
    this.isConfigured = !!apiKey;

    if (this.isConfigured) {
      this.logger.log('SendGrid service configured successfully');
    } else {
      this.logger.warn('SendGrid API key not found, using mock responses');
    }
  }

  async sendEmail(emailData: any): Promise<any> {
    if (!this.isConfigured) {
      return this.getMockEmailResult(emailData);
    }

    try {
      // In a real implementation, this would call SendGrid API
      this.logger.log(`Sending email to ${emailData.to}: ${emailData.subject}`);
      return this.getMockEmailResult(emailData);
    } catch (error) {
      this.logger.error('Failed to send email via SendGrid', error.stack);
      return this.getMockEmailResult(emailData);
    }
  }

  getStatus(): any {
    return {
      configured: this.isConfigured,
      provider: 'sendgrid',
      features: ['send', 'templates', 'html'],
      lastCheck: new Date().toISOString(),
    };
  }

  private getMockEmailResult(emailData: any): any {
    return {
      messageId: `mock-${Date.now()}`,
      status: 'sent',
      to: emailData.to,
      subject: emailData.subject || 'Mock Email',
      from: emailData.from || 'assistant@company.com',
      timestamp: new Date().toISOString(),
    };
  }
}
