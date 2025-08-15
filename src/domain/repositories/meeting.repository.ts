/**
 * Meeting Repository Interface - Domain Layer
 * Contract for meeting data persistence
 */

import { Repository, ReadRepository, QueryOptions, QueryResult } from '../common/repository.interface';
import { Meeting } from '../entities/meeting.entity';
import { DateRange } from '../common/value-objects';

export interface MeetingFilters {
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  organizer?: string;
  attendee?: string;
  meetingType?: 'in-person' | 'virtual' | 'hybrid';
  dateFrom?: Date;
  dateTo?: Date;
  isRecurring?: boolean;
}

export interface MeetingQueryOptions extends QueryOptions {
  filters?: MeetingFilters;
}

export interface MeetingRepository extends Repository<Meeting> {
  findByDateRange(dateRange: DateRange): Promise<Meeting[]>;
  findByOrganizer(organizerEmail: string): Promise<Meeting[]>;
  findByAttendee(attendeeEmail: string): Promise<Meeting[]>;
  findUpcomingMeetings(days?: number): Promise<Meeting[]>;
  findConflictingMeetings(dateRange: DateRange, excludeMeetingId?: string): Promise<Meeting[]>;
  findByStatus(status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'): Promise<Meeting[]>;
  findRecurringMeetings(): Promise<Meeting[]>;
  findMany(options?: MeetingQueryOptions): Promise<QueryResult<Meeting>>;
  getMeetingAnalytics(): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    averageDuration: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
}

export interface MeetingReadRepository extends ReadRepository<Meeting> {
  findByDateRange(dateRange: DateRange): Promise<Meeting[]>;
  findByOrganizer(organizerEmail: string): Promise<Meeting[]>;
  findByAttendee(attendeeEmail: string): Promise<Meeting[]>;
  findUpcomingMeetings(days?: number): Promise<Meeting[]>;
  findConflictingMeetings(dateRange: DateRange, excludeMeetingId?: string): Promise<Meeting[]>;
  searchMeetings(query: string): Promise<Meeting[]>;
}
