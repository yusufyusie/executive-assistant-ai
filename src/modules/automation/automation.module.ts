/**
 * Automation Module
 * Handles proactive automation and scheduling
 */

import { Module } from '@nestjs/common';
import { AutomationController } from './controllers/automation.controller';
import { AutomationService } from './services/automation.service';
import { AssistantModule } from '../assistant/assistant.module';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [AssistantModule, CalendarModule, EmailModule, TaskModule],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
