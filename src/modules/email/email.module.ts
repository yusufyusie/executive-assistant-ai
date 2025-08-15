/**
 * Email Module
 * Handles email automation and templates
 */

import { Module } from '@nestjs/common';
import { EmailController } from './controllers/email.controller';
import { EmailService } from './services/email.service';
import { SendGridService } from './services/sendgrid.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, SendGridService],
  exports: [EmailService],
})
export class EmailModule {}
