import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsArray, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { TaskPriority, TaskStatus, EmailCategory, ActionType } from '../interfaces';

export class ScheduleMeetingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsArray()
  @IsEmail({}, { each: true })
  attendees: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  templateVariables?: Record<string, any>;
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AIProcessRequestDto {
  @IsString()
  input: string;

  @IsOptional()
  context?: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class CheckAvailabilityDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @IsEmail({}, { each: true })
  attendees: string[];

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number; // in minutes
}

export class CreateEmailTemplateDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsString()
  textContent: string;

  @IsEnum(EmailCategory)
  category: EmailCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}

export class ScheduleReminderDto {
  @IsString()
  taskId: string;

  @IsDateString()
  reminderTime: string;

  @IsString()
  message: string;
}

export class GetCalendarEventsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number;
}

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  workingHours?: {
    start: string;
    end: string;
    days: number[];
  };

  @IsOptional()
  meetingPreferences?: {
    defaultDuration: number;
    bufferTime: number;
    preferredMeetingTimes: string[];
    avoidTimes: string[];
  };

  @IsOptional()
  emailPreferences?: {
    autoReply: boolean;
    signatureTemplate: string;
    priorityKeywords: string[];
  };

  @IsOptional()
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reminderAdvance: number;
  };
}
