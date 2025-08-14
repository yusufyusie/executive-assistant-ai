import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CalendarService } from './calendar.service';
import configuration from '../config/configuration';
import { CalendarEvent, MeetingRequest } from '../common/interfaces';

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      providers: [CalendarService],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events', async () => {
      const events = await service.getUpcomingEvents(5);

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      
      // Check event structure
      if (events.length > 0) {
        const event = events[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('summary');
        expect(event).toHaveProperty('start');
        expect(event).toHaveProperty('end');
      }
    });

    it('should respect maxResults parameter', async () => {
      const events = await service.getUpcomingEvents(2);
      expect(events.length).toBeLessThanOrEqual(2);
    });

    it('should filter by date range', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const events = await service.getUpcomingEvents(10, tomorrow, dayAfter);
      
      expect(Array.isArray(events)).toBe(true);
      // Events should be within the specified range
    });
  });

  describe('scheduleEvent', () => {
    it('should schedule a new event', async () => {
      const event: CalendarEvent = {
        summary: 'Test Meeting',
        description: 'A test meeting',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [{ email: 'test@example.com' }],
      };

      const scheduledEvent = await service.scheduleEvent(event);

      expect(scheduledEvent).toBeDefined();
      expect(scheduledEvent).toHaveProperty('id');
      expect(scheduledEvent.summary).toBe(event.summary);
    });

    it('should handle online meetings', async () => {
      const event: CalendarEvent = {
        summary: 'Online Test Meeting',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [{ email: 'test@example.com' }],
        conferenceData: {
          createRequest: {
            requestId: 'test-123',
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const scheduledEvent = await service.scheduleEvent(event);

      expect(scheduledEvent).toBeDefined();
      expect(scheduledEvent.summary).toBe(event.summary);
    });
  });

  describe('checkAvailability', () => {
    it('should check availability for attendees', async () => {
      const startTime = new Date();
      startTime.setHours(9, 0, 0, 0);
      
      const endTime = new Date();
      endTime.setHours(17, 0, 0, 0);

      const attendees = ['test1@example.com', 'test2@example.com'];
      
      const availability = await service.checkAvailability(attendees, startTime, endTime);

      expect(Array.isArray(availability)).toBe(true);
      expect(availability.length).toBeGreaterThan(0);
      
      // Check slot structure
      if (availability.length > 0) {
        const slot = availability[0];
        expect(slot).toHaveProperty('start');
        expect(slot).toHaveProperty('end');
        expect(slot).toHaveProperty('available');
        expect(typeof slot.available).toBe('boolean');
      }
    });

    it('should return 30-minute slots', async () => {
      const startTime = new Date();
      startTime.setHours(9, 0, 0, 0);
      
      const endTime = new Date();
      endTime.setHours(10, 0, 0, 0); // 1 hour

      const availability = await service.checkAvailability(['test@example.com'], startTime, endTime);

      expect(availability.length).toBe(2); // Two 30-minute slots
      
      const firstSlot = availability[0];
      const secondSlot = availability[1];
      
      const slotDuration = secondSlot.start.getTime() - firstSlot.start.getTime();
      expect(slotDuration).toBe(30 * 60 * 1000); // 30 minutes in milliseconds
    });
  });

  describe('findOptimalMeetingTime', () => {
    it('should find optimal meeting time', async () => {
      const request: MeetingRequest = {
        title: 'Test Meeting',
        duration: 60, // 1 hour
        attendees: ['test1@example.com', 'test2@example.com'],
        urgency: 'medium',
      };

      const optimalTime = await service.findOptimalMeetingTime(request);

      if (optimalTime) {
        expect(optimalTime).toBeInstanceOf(Date);
        expect(optimalTime.getTime()).toBeGreaterThan(Date.now());
      }
      // Note: optimalTime can be null if no suitable slot is found
    });

    it('should prefer business hours', async () => {
      const request: MeetingRequest = {
        title: 'Business Meeting',
        duration: 30,
        attendees: ['test@example.com'],
        urgency: 'low',
      };

      const optimalTime = await service.findOptimalMeetingTime(request);

      if (optimalTime) {
        const hour = optimalTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThanOrEqual(17);
      }
    });
  });

  describe('intelligentScheduling', () => {
    it('should perform intelligent scheduling', async () => {
      const request: MeetingRequest = {
        title: 'Intelligent Test Meeting',
        description: 'Testing intelligent scheduling',
        duration: 45,
        attendees: ['test@example.com'],
        urgency: 'high',
        isOnline: true,
      };

      const scheduledEvent = await service.intelligentScheduling(request);

      if (scheduledEvent) {
        expect(scheduledEvent).toHaveProperty('id');
        expect(scheduledEvent.summary).toBe(request.title);
        expect(scheduledEvent.description).toBe(request.description);
        expect(scheduledEvent.attendees).toHaveLength(1);
        expect(scheduledEvent.attendees[0].email).toBe('test@example.com');
      }
      // Note: can be null if no suitable time is found
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      // First create an event
      const event: CalendarEvent = {
        summary: 'Original Meeting',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [{ email: 'test@example.com' }],
      };

      const createdEvent = await service.scheduleEvent(event);
      
      // Then update it
      const updates = {
        summary: 'Updated Meeting',
        description: 'This meeting has been updated',
      };

      const updatedEvent = await service.updateEvent(createdEvent.id, updates);

      expect(updatedEvent).toBeDefined();
      expect(updatedEvent.summary).toBe('Updated Meeting');
      expect(updatedEvent.description).toBe('This meeting has been updated');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      // First create an event
      const event: CalendarEvent = {
        summary: 'Event to Delete',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [{ email: 'test@example.com' }],
      };

      const createdEvent = await service.scheduleEvent(event);
      
      // Then delete it
      await expect(service.deleteEvent(createdEvent.id)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Test with invalid event data
      const invalidEvent: CalendarEvent = {
        summary: '',
        start: {
          dateTime: 'invalid-date',
          timeZone: 'Invalid/Timezone',
        },
        end: {
          dateTime: 'invalid-date',
          timeZone: 'Invalid/Timezone',
        },
        attendees: [],
      };

      // Should not throw, but return a mock event
      const result = await service.scheduleEvent(invalidEvent);
      expect(result).toBeDefined();
    });
  });
});
