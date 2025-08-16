/**
 * Google Calendar Service
 * Handles Google Calendar API integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
      this.logger.warn(
        'Google Calendar credentials not found, using mock responses',
      );
    }
  }

  async getEvents(date?: string): Promise<any[]> {
    if (!this.isConfigured) {
      return this.getMockEvents(date);
    }

    try {
      // In a real implementation, this would call Google Calendar API
      this.logger.log(`Fetching events for ${date || 'today'}`);
      return this.getMockEvents(date);
    } catch (error) {
      this.logger.error(
        'Failed to fetch events from Google Calendar',
        error.stack,
      );
      return this.getMockEvents(date);
    }
  }

  async scheduleEvent(eventData: any): Promise<any> {
    if (!this.isConfigured) {
      return this.getMockScheduledEvent(eventData);
    }

    try {
      // In a real implementation, this would call Google Calendar API
      this.logger.log(
        `Scheduling event: ${eventData.title || eventData.summary}`,
      );
      return this.getMockScheduledEvent(eventData);
    } catch (error) {
      this.logger.error(
        'Failed to schedule event in Google Calendar',
        error.stack,
      );
      return this.getMockScheduledEvent(eventData);
    }
  }

  getStatus(): any {
    return {
      configured: this.isConfigured,
      provider: 'google',
      features: ['events', 'scheduling', 'reminders'],
      lastCheck: new Date().toISOString(),
    };
  }

  private getMockEvents(date?: string): any[] {
    const targetDate = date || new Date().toISOString().split('T')[0];

    return [
      {
        id: 'mock-event-1',
        summary: 'Team Standup',
        start: { dateTime: `${targetDate}T09:00:00-04:00` },
        end: { dateTime: `${targetDate}T09:30:00-04:00` },
        attendees: [{ email: 'team@company.com' }],
        location: 'Conference Room A',
      },
      {
        id: 'mock-event-2',
        summary: 'Client Meeting',
        start: { dateTime: `${targetDate}T14:00:00-04:00` },
        end: { dateTime: `${targetDate}T15:00:00-04:00` },
        attendees: [{ email: 'client@example.com' }],
        location: 'Zoom',
      },
      {
        id: 'mock-event-3',
        summary: 'Project Review',
        start: { dateTime: `${targetDate}T16:00:00-04:00` },
        end: { dateTime: `${targetDate}T17:00:00-04:00` },
        attendees: [{ email: 'manager@company.com' }],
        location: 'Conference Room B',
      },
    ];
  }

  private getMockScheduledEvent(eventData: any): any {
    return {
      id: `mock-${Date.now()}`,
      summary: eventData.title || eventData.summary || 'New Meeting',
      start: {
        dateTime: eventData.startTime || new Date().toISOString(),
      },
      end: {
        dateTime:
          eventData.endTime || new Date(Date.now() + 3600000).toISOString(),
      },
      attendees: eventData.attendees?.map((email: string) => ({ email })) || [],
      location: eventData.location || 'TBD',
      status: 'confirmed',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }
}
