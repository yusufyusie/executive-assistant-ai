/**
 * Calendar Controller
 * Handles calendar and scheduling operations
 */

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';

@Controller('api/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  async getEvents(@Query('date') date?: string) {
    return this.calendarService.getEvents(date);
  }

  @Post('schedule')
  async scheduleEvent(@Body() eventData: any) {
    return this.calendarService.scheduleEvent(eventData);
  }

  @Get('availability')
  async checkAvailability(
    @Query('date') date: string,
    @Query('duration') duration?: number,
  ) {
    return this.calendarService.checkAvailability(date, duration);
  }

  @Post('intelligent-schedule')
  async intelligentSchedule(@Body() request: any) {
    return this.calendarService.intelligentSchedule(request);
  }

  @Get('health')
  async getHealth() {
    return this.calendarService.getHealth();
  }
}
