// Common interfaces for the Executive Assistant AI

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
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
        type: string;
      };
    };
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: EmailCategory;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmailCategory {
  MEETING_CONFIRMATION = 'meeting_confirmation',
  FOLLOW_UP = 'follow_up',
  REMINDER = 'reminder',
  STATUS_UPDATE = 'status_update',
  THANK_YOU = 'thank_you',
  GENERAL = 'general',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  reminders: TaskReminder[];
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface TaskReminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  message: string;
  sent: boolean;
  sentAt?: Date;
}

export interface AIRequest {
  input: string;
  context?: Record<string, any>;
  userId: string;
  timestamp: Date;
}

export interface AIResponse {
  intent: string;
  confidence: number;
  response: string;
  actions: AIAction[];
  context: Record<string, any>;
}

export interface AIAction {
  type: ActionType;
  parameters: Record<string, any>;
  priority: number;
}

export enum ActionType {
  SCHEDULE_MEETING = 'schedule_meeting',
  SEND_EMAIL = 'send_email',
  CREATE_TASK = 'create_task',
  SET_REMINDER = 'set_reminder',
  UPDATE_CALENDAR = 'update_calendar',
  SEARCH_CALENDAR = 'search_calendar',
  GENERATE_BRIEFING = 'generate_briefing',
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingEvents?: CalendarEvent[];
}

export interface MeetingRequest {
  title: string;
  description?: string;
  duration: number; // in minutes
  attendees: string[];
  preferredTimes?: Date[];
  location?: string;
  isOnline?: boolean;
  urgency: 'low' | 'medium' | 'high';
}

export interface DailyBriefing {
  date: Date;
  upcomingMeetings: CalendarEvent[];
  priorityTasks: Task[];
  importantEmails: any[];
  suggestions: string[];
  weatherInfo?: any;
  trafficAlerts?: any[];
}

export interface EmailAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface UserPreferences {
  userId: string;
  timezone: string;
  workingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    days: number[]; // 0-6, Sunday = 0
  };
  meetingPreferences: {
    defaultDuration: number;
    bufferTime: number;
    preferredMeetingTimes: string[];
    avoidTimes: string[];
  };
  emailPreferences: {
    autoReply: boolean;
    signatureTemplate: string;
    priorityKeywords: string[];
  };
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reminderAdvance: number; // hours
  };
}
