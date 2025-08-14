import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { CalendarEvent, AvailabilitySlot, MeetingRequest } from '../common/interfaces';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private calendar: any;
  private auth: any;

  constructor(private configService: ConfigService) {
    this.initializeGoogleAuth();
  }

  private initializeGoogleAuth() {
    try {
      const clientId = this.configService.get<string>('google.clientId');
      const clientSecret = this.configService.get<string>('google.clientSecret');
      const redirectUri = this.configService.get<string>('google.redirectUri');
      const refreshToken = this.configService.get<string>('google.refreshToken');

      if (!clientId || !clientSecret) {
        this.logger.warn('Google Calendar credentials not configured. Calendar features will be limited.');
        return;
      }

      this.auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      
      if (refreshToken) {
        this.auth.setCredentials({ refresh_token: refreshToken });
      }

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      this.logger.log('Google Calendar API initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Calendar API:', error);
    }
  }

  async getUpcomingEvents(
    maxResults: number = 10,
    timeMin?: Date,
    timeMax?: Date,
  ): Promise<CalendarEvent[]> {
    try {
      if (!this.calendar) {
        return this.getMockEvents();
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: (timeMin || new Date()).toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items.map(this.mapGoogleEventToCalendarEvent);
    } catch (error) {
      this.logger.error('Error fetching calendar events:', error);
      return this.getMockEvents();
    }
  }

  async scheduleEvent(event: CalendarEvent): Promise<CalendarEvent> {
    try {
      if (!this.calendar) {
        return this.createMockEvent(event);
      }

      const googleEvent = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.dateTime,
          timeZone: event.start.timeZone,
        },
        end: {
          dateTime: event.end.dateTime,
          timeZone: event.end.timeZone,
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.displayName,
        })),
        location: event.location,
        conferenceData: event.conferenceData,
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent,
        conferenceDataVersion: event.conferenceData ? 1 : 0,
        sendUpdates: 'all',
      });

      this.logger.log(`Event scheduled successfully: ${response.data.id}`);
      return this.mapGoogleEventToCalendarEvent(response.data);
    } catch (error) {
      this.logger.error('Error scheduling event:', error);
      return this.createMockEvent(event);
    }
  }

  async intelligentScheduling(request: MeetingRequest): Promise<CalendarEvent | null> {
    try {
      // Find optimal time
      const optimalTime = await this.findOptimalMeetingTime(request);
      if (!optimalTime) {
        this.logger.warn('No suitable time slot found for meeting request');
        return null;
      }

      // Create the event
      const endTime = new Date(optimalTime.getTime() + request.duration * 60 * 1000);
      const event: CalendarEvent = {
        summary: request.title,
        description: request.description,
        start: {
          dateTime: optimalTime.toISOString(),
          timeZone: this.configService.get<string>('application.defaultTimezone') || 'America/New_York',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: this.configService.get<string>('application.defaultTimezone') || 'America/New_York',
        },
        attendees: request.attendees.map(email => ({ email })),
        location: request.location,
        conferenceData: request.isOnline ? {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        } : undefined,
      };

      return await this.scheduleEvent(event);
    } catch (error) {
      this.logger.error('Error in intelligent scheduling:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      if (!this.calendar) {
        return this.createMockEvent(updates as CalendarEvent);
      }

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        resource: updates,
        sendUpdates: 'all',
      });

      this.logger.log(`Event updated successfully: ${eventId}`);
      return this.mapGoogleEventToCalendarEvent(response.data);
    } catch (error) {
      this.logger.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      if (!this.calendar) {
        this.logger.log(`Mock: Event ${eventId} would be deleted`);
        return;
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });

      this.logger.log(`Event deleted successfully: ${eventId}`);
    } catch (error) {
      this.logger.error('Error deleting event:', error);
      throw error;
    }
  }

  async checkAvailability(
    attendees: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<AvailabilitySlot[]> {
    try {
      if (!this.calendar) {
        return this.getMockAvailability(startTime, endTime);
      }

      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: attendees.map(email => ({ id: email })),
        },
      });

      const slots: AvailabilitySlot[] = [];
      const busyTimes = response.data.calendars;

      // Generate 30-minute slots and check availability
      const current = new Date(startTime);
      while (current < endTime) {
        const slotEnd = new Date(current.getTime() + 30 * 60 * 1000);
        const isAvailable = this.isSlotAvailable(current, slotEnd, busyTimes, attendees);
        
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          available: isAvailable,
          conflictingEvents: isAvailable ? [] : [],
        });

        current.setTime(current.getTime() + 30 * 60 * 1000);
      }

      return slots;
    } catch (error) {
      this.logger.error('Error checking availability:', error);
      return this.getMockAvailability(startTime, endTime);
    }
  }

  async findOptimalMeetingTime(request: MeetingRequest): Promise<Date | null> {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

      const availability = await this.checkAvailability(
        request.attendees,
        startDate,
        endDate,
      );

      // Filter available slots that match the duration
      const suitableSlots = availability.filter(slot => {
        const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
        return slot.available && slotDuration >= request.duration;
      });

      if (suitableSlots.length === 0) {
        return null;
      }

      // Prefer slots during business hours (9 AM - 5 PM)
      const businessHourSlots = suitableSlots.filter(slot => {
        const hour = slot.start.getHours();
        return hour >= 9 && hour <= 17;
      });

      const preferredSlots = businessHourSlots.length > 0 ? businessHourSlots : suitableSlots;

      // Return the earliest available slot
      return preferredSlots[0].start;
    } catch (error) {
      this.logger.error('Error finding optimal meeting time:', error);
      return null;
    }
  }

  private isSlotAvailable(
    slotStart: Date,
    slotEnd: Date,
    busyTimes: any,
    attendees: string[],
  ): boolean {
    for (const attendee of attendees) {
      const attendeeBusy = busyTimes[attendee]?.busy || [];
      
      for (const busyPeriod of attendeeBusy) {
        const busyStart = new Date(busyPeriod.start);
        const busyEnd = new Date(busyPeriod.end);
        
        // Check if slot overlaps with busy period
        if (slotStart < busyEnd && slotEnd > busyStart) {
          return false;
        }
      }
    }
    
    return true;
  }

  private mapGoogleEventToCalendarEvent(googleEvent: any): CalendarEvent {
    return {
      id: googleEvent.id,
      summary: googleEvent.summary,
      description: googleEvent.description,
      start: {
        dateTime: googleEvent.start.dateTime || googleEvent.start.date,
        timeZone: googleEvent.start.timeZone || 'UTC',
      },
      end: {
        dateTime: googleEvent.end.dateTime || googleEvent.end.date,
        timeZone: googleEvent.end.timeZone || 'UTC',
      },
      attendees: googleEvent.attendees?.map((attendee: any) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus,
      })) || [],
      location: googleEvent.location,
      conferenceData: googleEvent.conferenceData,
    };
  }

  private getMockEvents(): CalendarEvent[] {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'mock-1',
        summary: 'Team Standup',
        description: 'Daily team synchronization meeting',
        start: {
          dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: 'team@company.com', displayName: 'Development Team' },
        ],
      },
      {
        id: 'mock-2',
        summary: 'Client Review Meeting',
        description: 'Quarterly business review with key client',
        start: {
          dateTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: 'client@example.com', displayName: 'Client Representative' },
        ],
      },
    ];
  }

  private createMockEvent(event: CalendarEvent): CalendarEvent {
    return {
      ...event,
      id: `mock-${Date.now()}`,
    };
  }

  private getMockAvailability(startTime: Date, endTime: Date): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const current = new Date(startTime);

    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + 30 * 60 * 1000);
      const hour = current.getHours();

      // Mock some busy times during lunch (12-1 PM) and after hours
      const isAvailable = !(hour === 12 || hour < 9 || hour > 17);

      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: isAvailable,
        conflictingEvents: [],
      });

      current.setTime(current.getTime() + 30 * 60 * 1000);
    }

    return slots;
  }

  async getConflicts(startDate: string, endDate: string): Promise<{ conflicts: CalendarEvent[]; suggestions: string[] }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const events = await this.getUpcomingEvents(50, start, end);

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
}
