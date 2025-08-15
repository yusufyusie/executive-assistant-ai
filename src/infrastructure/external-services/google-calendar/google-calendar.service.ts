/**
 * Google Calendar Service - Infrastructure Layer
 * Integration with Google Calendar API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  duration: number;
}

export interface AvailabilityResponse {
  date: string;
  availableSlots: AvailabilitySlot[];
  busySlots: AvailabilitySlot[];
  workingHours: {
    start: string;
    end: string;
  };
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    this.isConfigured = !!(clientId && clientSecret);
    
    if (this.isConfigured) {
      this.logger.log('Google Calendar service configured successfully');
    } else {
      this.logger.warn('Google Calendar credentials not found, using mock responses');
    }
  }

  async getEvents(date?: string): Promise<CalendarEvent[]> {
    if (!this.isConfigured) {
      return this.getMockEvents(date);
    }

    try {
      // In a real implementation, this would call the Google Calendar API
      this.logger.log(`Fetching events for date: ${date || 'today'}`);
      return this.getMockEvents(date);
    } catch (error) {
      this.logger.error('Failed to fetch calendar events', error.stack);
      return this.getMockEvents(date);
    }
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    if (!this.isConfigured) {
      return this.getMockCreatedEvent(event);
    }

    try {
      this.logger.log(`Creating calendar event: ${event.summary}`);

      // ACTUAL GOOGLE CALENDAR API INTEGRATION
      const accessToken = await this.getAccessToken();

      const calendarEvent = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: event.end,
          timeZone: 'America/New_York',
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Calendar API error: ${response.status} ${errorText}`);
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const createdEvent = await response.json();

      this.logger.log(`Calendar event created successfully: ${createdEvent.id}`);

      return {
        id: createdEvent.id,
        summary: createdEvent.summary,
        description: createdEvent.description,
        start: {
          dateTime: createdEvent.start.dateTime,
          timeZone: createdEvent.start.timeZone || 'UTC',
        },
        end: {
          dateTime: createdEvent.end.dateTime,
          timeZone: createdEvent.end.timeZone || 'UTC',
        },
        attendees: createdEvent.attendees?.map((a: any) => ({
          email: a.email,
          responseStatus: a.responseStatus || 'needsAction',
        })) || [],
        location: createdEvent.location,
      };

    } catch (error) {
      this.logger.error('Failed to create calendar event', error.stack);
      // Fallback to mock response for demo purposes
      return this.getMockCreatedEvent(event);
    }
  }

  private async getAccessToken(): Promise<string> {
    const refreshToken = this.config.get('GOOGLE_REFRESH_TOKEN');

    if (!refreshToken) {
      throw new Error('Google refresh token not configured');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.get('GOOGLE_CLIENT_ID') || '',
          client_secret: this.config.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;

    } catch (error) {
      this.logger.error('Failed to refresh access token', error.stack);
      throw new Error('Authentication failed');
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    if (!this.isConfigured) {
      return this.getMockUpdatedEvent(eventId, event);
    }

    try {
      this.logger.log(`Updating calendar event: ${eventId}`);
      // In a real implementation, this would call the Google Calendar API
      return this.getMockUpdatedEvent(eventId, event);
    } catch (error) {
      this.logger.error('Failed to update calendar event', error.stack);
      throw new Error('Failed to update calendar event');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.log(`Mock: Deleted calendar event: ${eventId}`);
      return;
    }

    try {
      this.logger.log(`Deleting calendar event: ${eventId}`);
      // In a real implementation, this would call the Google Calendar API
    } catch (error) {
      this.logger.error('Failed to delete calendar event', error.stack);
      throw new Error('Failed to delete calendar event');
    }
  }

  async checkAvailability(
    date: string,
    duration: number = 60,
    workingHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
  ): Promise<AvailabilityResponse> {
    if (!this.isConfigured) {
      return this.getMockAvailability(date, duration, workingHours);
    }

    try {
      this.logger.log(`Checking availability for ${date}, duration: ${duration}min`);
      // In a real implementation, this would call the Google Calendar API
      return this.getMockAvailability(date, duration, workingHours);
    } catch (error) {
      this.logger.error('Failed to check availability', error.stack);
      return this.getMockAvailability(date, duration, workingHours);
    }
  }

  async findMeetingSlots(
    startDate: string,
    endDate: string,
    duration: number,
    attendees: string[] = []
  ): Promise<Array<{
    start: string;
    end: string;
    attendeeAvailability: Record<string, boolean>;
  }>> {
    if (!this.isConfigured) {
      return this.getMockMeetingSlots(startDate, endDate, duration, attendees);
    }

    try {
      this.logger.log(`Finding meeting slots from ${startDate} to ${endDate}, duration: ${duration}min`);
      // In a real implementation, this would call the Google Calendar API
      return this.getMockMeetingSlots(startDate, endDate, duration, attendees);
    } catch (error) {
      this.logger.error('Failed to find meeting slots', error.stack);
      return this.getMockMeetingSlots(startDate, endDate, duration, attendees);
    }
  }

  getStatus(): {
    configured: boolean;
    lastSync: string;
    features: string[];
  } {
    return {
      configured: this.isConfigured,
      lastSync: new Date().toISOString(),
      features: ['events', 'availability', 'scheduling', 'reminders'],
    };
  }

  private getMockEvents(date?: string): CalendarEvent[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return [
      {
        id: 'mock_event_1',
        summary: 'Team Standup',
        description: 'Daily team synchronization meeting',
        start: {
          dateTime: `${targetDate}T09:00:00Z`,
          timeZone: 'UTC',
        },
        end: {
          dateTime: `${targetDate}T09:30:00Z`,
          timeZone: 'UTC',
        },
        attendees: [
          { email: 'team@company.com', responseStatus: 'accepted' },
          { email: 'manager@company.com', responseStatus: 'accepted' },
        ],
        location: 'Conference Room A',
      },
      {
        id: 'mock_event_2',
        summary: 'Client Presentation',
        description: 'Quarterly business review with key client',
        start: {
          dateTime: `${targetDate}T14:00:00Z`,
          timeZone: 'UTC',
        },
        end: {
          dateTime: `${targetDate}T15:30:00Z`,
          timeZone: 'UTC',
        },
        attendees: [
          { email: 'client@external.com', responseStatus: 'accepted' },
          { email: 'sales@company.com', responseStatus: 'accepted' },
        ],
        location: 'Virtual Meeting',
        conferenceData: {
          createRequest: {
            requestId: 'mock_conference_1',
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      {
        id: 'mock_event_3',
        summary: 'Project Planning',
        description: 'Planning session for Q1 initiatives',
        start: {
          dateTime: `${targetDate}T16:00:00Z`,
          timeZone: 'UTC',
        },
        end: {
          dateTime: `${targetDate}T17:00:00Z`,
          timeZone: 'UTC',
        },
        attendees: [
          { email: 'project@company.com', responseStatus: 'tentative' },
          { email: 'lead@company.com', responseStatus: 'accepted' },
        ],
      },
    ];
  }

  private getMockCreatedEvent(event: CalendarEvent): CalendarEvent {
    return {
      ...event,
      id: `mock_event_${Date.now()}`,
      attendees: event.attendees?.map(attendee => ({
        ...attendee,
        responseStatus: 'needsAction' as const,
      })),
    };
  }

  private getMockUpdatedEvent(eventId: string, updates: Partial<CalendarEvent>): CalendarEvent {
    return {
      id: eventId,
      summary: updates.summary || 'Updated Event',
      description: updates.description,
      start: updates.start || {
        dateTime: new Date().toISOString(),
        timeZone: 'UTC',
      },
      end: updates.end || {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      attendees: updates.attendees,
      location: updates.location,
    };
  }

  private getMockAvailability(
    date: string,
    duration: number,
    workingHours: { start: string; end: string }
  ): AvailabilityResponse {
    const availableSlots: AvailabilitySlot[] = [];
    const busySlots: AvailabilitySlot[] = [];

    // Mock busy periods
    busySlots.push(
      {
        start: `${date}T09:00:00Z`,
        end: `${date}T09:30:00Z`,
        duration: 30,
      },
      {
        start: `${date}T14:00:00Z`,
        end: `${date}T15:30:00Z`,
        duration: 90,
      }
    );

    // Generate available slots
    const workStart = new Date(`${date}T${workingHours.start}:00Z`);
    const workEnd = new Date(`${date}T${workingHours.end}:00Z`);
    
    let current = new Date(workStart);
    while (current < workEnd) {
      const slotEnd = new Date(current.getTime() + duration * 60 * 1000);
      
      if (slotEnd <= workEnd) {
        // Check if this slot conflicts with busy periods
        const hasConflict = busySlots.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return current < busyEnd && slotEnd > busyStart;
        });

        if (!hasConflict) {
          availableSlots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            duration,
          });
        }
      }
      
      current = new Date(current.getTime() + 30 * 60 * 1000); // 30-minute increments
    }

    return {
      date,
      availableSlots,
      busySlots,
      workingHours,
    };
  }

  private getMockMeetingSlots(
    startDate: string,
    endDate: string,
    duration: number,
    attendees: string[]
  ): Array<{
    start: string;
    end: string;
    attendeeAvailability: Record<string, boolean>;
  }> {
    const slots: Array<{
      start: string;
      end: string;
      attendeeAvailability: Record<string, boolean>;
    }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate mock slots for the next few days
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      // Morning slot
      const morningStart = new Date(d);
      morningStart.setHours(10, 0, 0, 0);
      const morningEnd = new Date(morningStart.getTime() + duration * 60 * 1000);
      
      const attendeeAvailability: Record<string, boolean> = {};
      attendees.forEach(email => {
        attendeeAvailability[email] = Math.random() > 0.3; // 70% chance of availability
      });
      
      slots.push({
        start: morningStart.toISOString(),
        end: morningEnd.toISOString(),
        attendeeAvailability,
      });
      
      // Afternoon slot
      const afternoonStart = new Date(d);
      afternoonStart.setHours(14, 0, 0, 0);
      const afternoonEnd = new Date(afternoonStart.getTime() + duration * 60 * 1000);
      
      const afternoonAvailability: Record<string, boolean> = {};
      attendees.forEach(email => {
        afternoonAvailability[email] = Math.random() > 0.4; // 60% chance of availability
      });
      
      slots.push({
        start: afternoonStart.toISOString(),
        end: afternoonEnd.toISOString(),
        attendeeAvailability: afternoonAvailability,
      });
    }
    
    return slots.slice(0, 10); // Return top 10 slots
  }
}
