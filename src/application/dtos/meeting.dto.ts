/**
 * Meeting DTOs - Application Layer
 * Data Transfer Objects for meeting operations
 */

export class CreateMeetingDto {
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  organizer: string; // email
  attendees: Array<{
    email: string;
    name: string;
    isRequired: boolean;
  }>;
  meetingType: 'in-person' | 'virtual' | 'hybrid';
  meetingUrl?: string;
  agenda?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export class UpdateMeetingDto {
  title?: string;
  description?: string;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  location?: string;
  attendees?: Array<{
    email: string;
    name: string;
    isRequired: boolean;
  }>;
  meetingType?: 'in-person' | 'virtual' | 'hybrid';
  meetingUrl?: string;
  agenda?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export class MeetingResponseDto {
  id: string;
  title: string;
  description?: string;
  dateRange: {
    startDate: string;
    endDate: string;
    durationInMinutes: number;
  };
  location?: string;
  organizer: {
    email: string;
  };
  attendees: Array<{
    email: { email: string };
    name: string;
    isRequired: boolean;
    responseStatus: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;
  meetingType: 'in-person' | 'virtual' | 'hybrid';
  meetingUrl?: string;
  agenda: string[];
  isRecurring: boolean;
  recurrencePattern?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  remindersSent: Array<{
    type: string;
    sentAt: string;
  }>;
  isUpcoming: boolean;
  isInProgress: boolean;
  createdAt: string;
  updatedAt: string;
}

export class MeetingFiltersDto {
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  organizer?: string;
  attendee?: string;
  meetingType?: 'in-person' | 'virtual' | 'hybrid';
  dateFrom?: string;
  dateTo?: string;
  isRecurring?: boolean;
}

export class MeetingQueryDto {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: MeetingFiltersDto;
}

export class ScheduleMeetingRequestDto {
  title: string;
  duration: number; // in minutes
  attendees: Array<{
    email: string;
    name: string;
    isRequired: boolean;
  }>;
  preferredTimes?: Array<{
    start: string; // ISO string
    end: string; // ISO string
  }>;
  earliestDate?: string; // ISO string
  latestDate?: string; // ISO string
  workingHours?: {
    start: string; // e.g., "09:00"
    end: string; // e.g., "17:00"
  };
  excludeWeekends?: boolean;
  bufferTime?: number; // minutes between meetings
  description?: string;
  location?: string;
  meetingType?: 'in-person' | 'virtual' | 'hybrid';
  meetingUrl?: string;
  agenda?: string[];
}

export class MeetingSchedulingSuggestionDto {
  timeSlot: {
    start: string;
    end: string;
    duration: number;
  };
  score: number;
  attendeeAvailability: Record<string, 'available' | 'busy' | 'unknown'>;
  conflicts: string[];
  reasons: string[];
}

export class MeetingSchedulingResponseDto {
  suggestions: MeetingSchedulingSuggestionDto[];
  bestSuggestion?: MeetingSchedulingSuggestionDto;
  conflicts: MeetingResponseDto[];
  summary: {
    totalSuggestions: number;
    optimalSlots: number;
    suboptimalSlots: number;
    conflictCount: number;
  };
}

export class AttendeeResponseDto {
  email: string;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export class MeetingAnalyticsResponseDto {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  averageDuration: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export class MeetingListResponseDto {
  items: MeetingResponseDto[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
}
