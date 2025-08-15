/**
 * Calendar Module
 * Handles calendar and scheduling functionality
 */

import { Module } from '@nestjs/common';
import { CalendarController } from './controllers/calendar.controller';
import { CalendarService } from './services/calendar.service';
import { GoogleCalendarService } from './services/google-calendar.service';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, GoogleCalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
