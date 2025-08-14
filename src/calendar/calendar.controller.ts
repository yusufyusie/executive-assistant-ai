import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { ScheduleMeetingDto, CheckAvailabilityDto, GetCalendarEventsDto } from '../common/dto';
import type { CalendarEvent, AvailabilitySlot, MeetingRequest } from '../common/interfaces';

@Controller('api/calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  async getEvents(@Query() query: GetCalendarEventsDto): Promise<CalendarEvent[]> {
    this.logger.log('Fetching calendar events');
    
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const endDate = query.endDate ? new Date(query.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const maxResults = query.maxResults || 10;

    return await this.calendarService.getUpcomingEvents(maxResults, startDate, endDate);
  }

  @Get('upcoming')
  async getUpcomingEvents(@Query('limit') limit?: string): Promise<CalendarEvent[]> {
    this.logger.log('Fetching upcoming events');
    
    const maxResults = limit ? parseInt(limit, 10) : 5;
    return await this.calendarService.getUpcomingEvents(maxResults);
  }

  @Post('schedule')
  async scheduleEvent(@Body() dto: ScheduleMeetingDto): Promise<CalendarEvent> {
    this.logger.log(`Scheduling event: ${dto.title}`);
    
    const event: CalendarEvent = {
      summary: dto.title,
      description: dto.description,
      start: {
        dateTime: dto.startTime,
        timeZone: 'America/New_York', // Default timezone, should be configurable
      },
      end: {
        dateTime: dto.endTime,
        timeZone: 'America/New_York',
      },
      attendees: dto.attendees.map(email => ({ email })),
      location: dto.location,
      conferenceData: dto.isOnline ? {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      } : undefined,
    };

    return await this.calendarService.scheduleEvent(event);
  }

  @Post('intelligent-schedule')
  async intelligentSchedule(@Body() request: MeetingRequest): Promise<CalendarEvent | null> {
    this.logger.log(`Intelligent scheduling for: ${request.title}`);
    
    return await this.calendarService.intelligentScheduling(request);
  }

  @Put('events/:id')
  async updateEvent(
    @Param('id') eventId: string,
    @Body() updates: Partial<CalendarEvent>,
  ): Promise<CalendarEvent> {
    this.logger.log(`Updating event: ${eventId}`);
    
    return await this.calendarService.updateEvent(eventId, updates);
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') eventId: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting event: ${eventId}`);
    
    await this.calendarService.deleteEvent(eventId);
    return { success: true };
  }

  @Post('availability')
  async checkAvailability(@Body() dto: CheckAvailabilityDto): Promise<AvailabilitySlot[]> {
    this.logger.log(`Checking availability for ${dto.attendees.length} attendees`);
    
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    return await this.calendarService.checkAvailability(dto.attendees, startDate, endDate);
  }

  @Post('find-time')
  async findOptimalTime(@Body() request: MeetingRequest): Promise<{ optimalTime: Date | null }> {
    this.logger.log(`Finding optimal time for: ${request.title}`);
    
    const optimalTime = await this.calendarService.findOptimalMeetingTime(request);
    return { optimalTime };
  }

  @Get('conflicts')
  async getConflicts(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ conflicts: CalendarEvent[]; suggestions: string[] }> {
    this.logger.log('Checking for calendar conflicts');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const events = await this.calendarService.getUpcomingEvents(50, start, end);
    
    // Simple conflict detection - events that are too close together
    const conflicts: CalendarEvent[] = [];
    const suggestions: string[] = [];
    
    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      
      const currentEnd = new Date(currentEvent.end.dateTime);
      const nextStart = new Date(nextEvent.start.dateTime);
      
      // Check if there's less than 15 minutes between events
      const timeDiff = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (timeDiff < 15 && timeDiff > 0) {
        conflicts.push(currentEvent, nextEvent);
        suggestions.push(`Consider adding buffer time between "${currentEvent.summary}" and "${nextEvent.summary}"`);
      }
    }
    
    return { conflicts, suggestions };
  }

  @Get('analytics')
  async getCalendarAnalytics(
    @Query('period') period: string = 'week',
  ): Promise<{
    totalMeetings: number;
    totalHours: number;
    averageMeetingDuration: number;
    busyDays: string[];
    recommendations: string[];
  }> {
    this.logger.log(`Generating calendar analytics for period: ${period}`);
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const events = await this.calendarService.getUpcomingEvents(100, startDate, now);
    
    const totalMeetings = events.length;
    let totalMinutes = 0;
    const dailyMeetings: Record<string, number> = {};
    
    events.forEach(event => {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      
      totalMinutes += duration;
      
      const day = start.toDateString();
      dailyMeetings[day] = (dailyMeetings[day] || 0) + 1;
    });
    
    const totalHours = totalMinutes / 60;
    const averageMeetingDuration = totalMeetings > 0 ? totalMinutes / totalMeetings : 0;
    
    const busyDays = Object.entries(dailyMeetings)
      .filter(([_, count]) => count >= 5)
      .map(([day, _]) => day);
    
    const recommendations = [
      totalHours > 20 ? 'Consider blocking time for deep work' : '',
      averageMeetingDuration > 60 ? 'Try to keep meetings under 60 minutes' : '',
      busyDays.length > 2 ? 'Consider spreading meetings more evenly' : '',
    ].filter(Boolean);
    
    return {
      totalMeetings,
      totalHours: Math.round(totalHours * 100) / 100,
      averageMeetingDuration: Math.round(averageMeetingDuration),
      busyDays,
      recommendations,
    };
  }
}
