import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AIModule } from '../ai/ai.module';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [AIModule, CalendarModule, EmailModule, TasksModule],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
