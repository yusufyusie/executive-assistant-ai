/**
 * Email Controller
 * Handles email operations
 */

import { Controller, Post, Get, Body } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('api/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() emailData: any) {
    return this.emailService.sendEmail(emailData);
  }

  @Post('send-template')
  async sendTemplateEmail(@Body() templateData: any) {
    return this.emailService.sendTemplateEmail(templateData);
  }

  @Get('templates')
  async getTemplates() {
    return this.emailService.getTemplates();
  }

  @Get('health')
  async getHealth() {
    return this.emailService.getHealth();
  }
}
