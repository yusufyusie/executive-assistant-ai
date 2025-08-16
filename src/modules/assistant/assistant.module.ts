/**
 * Assistant Module - Presentation Layer
 * Handles AI assistant functionality with clean architecture
 */

import { Module } from '@nestjs/common';
import { AssistantController } from './controllers/assistant.controller';

// Application Services
import { ExecutiveAssistantService } from '../../application/services/executive-assistant.service';

// Infrastructure Services
import { GeminiService } from '../../infrastructure/external-services/gemini/gemini.service';
import { GoogleCalendarService } from '../../infrastructure/external-services/google-calendar/google-calendar.service';
import { SendGridService } from '../../infrastructure/external-services/sendgrid/sendgrid.service';

// Import Task Module for dependencies
import { TaskModule } from '../task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [AssistantController],
  providers: [
    ExecutiveAssistantService,
    GeminiService,
    GoogleCalendarService,
    SendGridService,
  ],
  exports: [
    ExecutiveAssistantService,
    GeminiService,
    GoogleCalendarService,
    SendGridService,
  ],
})
export class AssistantModule {}
