/**
 * Assistant Module - Presentation Layer
 * Handles AI assistant functionality with clean architecture
 */

import { Module } from '@nestjs/common';
import { AssistantController } from './controllers/assistant.controller';

// Application Services
import { AIAssistantService } from '../../application/services/ai-assistant.service';

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
    AIAssistantService,
    GeminiService,
    GoogleCalendarService,
    SendGridService,
  ],
  exports: [
    AIAssistantService,
    GeminiService,
    GoogleCalendarService,
    SendGridService,
  ],
})
export class AssistantModule {}
