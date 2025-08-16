/**
 * Calendar Service
 * Main service for calendar operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  async getEvents(date?: string): Promise<any[]> {
    try {
      return await this.googleCalendar.getEvents(date);
    } catch (error) {
      this.logger.error('Failed to get events', error.stack);
      throw error;
    }
  }

  async scheduleEvent(eventData: any): Promise<any> {
    try {
      return await this.googleCalendar.scheduleEvent(eventData);
    } catch (error) {
      this.logger.error('Failed to schedule event', error.stack);
      throw error;
    }
  }

  async checkAvailability(date: string, duration: number = 60): Promise<any> {
    try {
      const events = await this.getEvents(date);
      return this.calculateAvailability(events, date, duration);
    } catch (error) {
      this.logger.error('Failed to check availability', error.stack);
      throw error;
    }
  }

  async intelligentSchedule(request: any): Promise<any> {
    try {
      const suggestions: Array<{
        date: string;
        slots: any[];
        score: number;
      }> = [];
      const today = new Date();

      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + i);

        const availability = await this.checkAvailability(
          checkDate.toISOString().split('T')[0],
          request.duration || 60,
        );

        if (availability.availableSlots.length > 0) {
          suggestions.push({
            date: checkDate.toISOString().split('T')[0],
            slots: availability.availableSlots.slice(0, 3),
            score: this.calculateScore(availability.availableSlots, request),
          });
        }
      }

      suggestions.sort((a, b) => b.score - a.score);

      return {
        title: request.title,
        duration: request.duration || 60,
        suggestions: suggestions.slice(0, 5),
        recommendation: suggestions[0] || null,
      };
    } catch (error) {
      this.logger.error('Failed to generate intelligent schedule', error.stack);
      throw error;
    }
  }

  getHealth(): any {
    return {
      status: 'healthy',
      googleCalendar: this.googleCalendar.getStatus(),
      features: [
        'events',
        'scheduling',
        'availability',
        'intelligent-scheduling',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  private calculateAvailability(
    events: any[],
    date: string,
    duration: number,
  ): any {
    const workingHours = { start: 9, end: 17 };
    const availableSlots: Array<{
      start: string;
      end: string;
      duration: number;
    }> = [];
    const targetDate = new Date(date);

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const slotStart = new Date(targetDate);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      const isAvailable = !events.some((event) => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        const eventEnd = new Date(event.end?.dateTime || event.end?.date);
        return slotStart < eventEnd && slotEnd > eventStart;
      });

      if (isAvailable) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          duration,
        });
      }
    }

    return {
      date,
      availableSlots,
      totalSlots: availableSlots.length,
    };
  }

  private calculateScore(slots: any[], request: any): number {
    let score = slots.length * 10;

    if (request.preferredTimes) {
      slots.forEach((slot) => {
        const slotHour = new Date(slot.start).getHours();
        request.preferredTimes.forEach((preferredTime: string) => {
          const preferredHour = parseInt(preferredTime.split(':')[0]);
          if (Math.abs(slotHour - preferredHour) <= 1) {
            score += 20;
          }
        });
      });
    }

    if (request.priority === 'high') score *= 1.5;
    if (request.priority === 'low') score *= 0.8;

    return score;
  }
}
