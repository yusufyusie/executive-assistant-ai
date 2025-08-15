/**
 * Executive Assistant AI - Professional Assistant DTOs
 * Comprehensive data transfer objects for AI assistant functionality
 * 
 * @fileoverview Professional DTO system for AI assistant providing:
 * - Natural language processing requests
 * - Intent recognition responses
 * - Action execution tracking
 * - Context management
 * - Performance metrics
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsSafeString, IsTimezone } from '../../common/pipes/validation.pipe';

/**
 * AI assistant intent enumeration
 */
export enum AssistantIntent {
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  SCHEDULE_MEETING = 'schedule_meeting',
  SEND_EMAIL = 'send_email',
  GET_BRIEFING = 'get_briefing',
  PRIORITIZE_TASKS = 'prioritize_tasks',
  SEARCH_CALENDAR = 'search_calendar',
  SET_REMINDER = 'set_reminder',
  ANALYZE_WORKLOAD = 'analyze_workload',
  GENERAL_ASSISTANCE = 'general_assistance',
}

/**
 * Action execution status enumeration
 */
export enum ActionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * User context DTO
 */
export class UserContextDto {
  @ApiPropertyOptional({
    description: 'User identifier',
    example: 'user_123',
  })
  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  @MaxLength(100, { message: 'User ID cannot exceed 100 characters' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  @IsTimezone({ message: 'Timezone must be a valid timezone identifier' })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'User preferences',
    example: {
      workingHours: { start: '09:00', end: '17:00' },
      reminderAdvance: 30,
      emailSignature: 'Best regards, John Doe',
    },
  })
  @IsOptional()
  @IsObject({ message: 'Preferences must be an object' })
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Current session context',
    example: {
      lastAction: 'create_task',
      conversationId: 'conv_456',
      activeProject: 'Q4-2024',
    },
  })
  @IsOptional()
  @IsObject({ message: 'Session context must be an object' })
  sessionContext?: Record<string, any>;
}

/**
 * Process assistant request DTO
 */
export class ProcessAssistantRequestDto {
  @ApiProperty({
    description: 'Natural language input from user',
    example: 'Schedule a meeting with the team for next Tuesday at 2 PM to discuss the quarterly report',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString({ message: 'Input must be a string' })
  @MinLength(1, { message: 'Input cannot be empty' })
  @MaxLength(2000, { message: 'Input cannot exceed 2000 characters' })
  @IsSafeString({ message: 'Input contains unsafe content' })
  input: string;

  @ApiPropertyOptional({
    description: 'User context information',
    type: UserContextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserContextDto)
  context?: UserContextDto;

  @ApiPropertyOptional({
    description: 'Expected response format',
    enum: ['detailed', 'summary', 'actions_only'],
    example: 'detailed',
  })
  @IsOptional()
  @IsEnum(['detailed', 'summary', 'actions_only'])
  responseFormat?: 'detailed' | 'summary' | 'actions_only';

  @ApiPropertyOptional({
    description: 'Maximum number of actions to execute',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Max actions must be a number' })
  @Min(1, { message: 'Max actions must be at least 1' })
  @Max(10, { message: 'Max actions cannot exceed 10' })
  maxActions?: number;

  @ApiPropertyOptional({
    description: 'Whether to execute actions automatically',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Auto execute must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  autoExecute?: boolean;
}

/**
 * Assistant action DTO
 */
export class AssistantActionDto {
  @ApiProperty({
    description: 'Action type',
    enum: AssistantIntent,
    example: AssistantIntent.CREATE_TASK,
  })
  type: AssistantIntent;

  @ApiProperty({
    description: 'Action parameters',
    example: {
      title: 'Prepare quarterly report',
      priority: 'high',
      dueDate: '2025-08-20T17:00:00Z',
    },
  })
  parameters: Record<string, any>;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  confidence: number;

  @ApiProperty({
    description: 'Action execution status',
    enum: ActionStatus,
    example: ActionStatus.COMPLETED,
  })
  status: ActionStatus;

  @ApiPropertyOptional({
    description: 'Action execution result',
    example: {
      taskId: '123e4567-e89b-12d3-a456-426614174000',
      message: 'Task created successfully',
    },
  })
  @IsOptional()
  result?: any;

  @ApiPropertyOptional({
    description: 'Error message if action failed',
    example: 'Failed to create task: Invalid due date',
  })
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({
    description: 'Action execution time in milliseconds',
    example: 250,
  })
  @IsOptional()
  executionTime?: number;
}

/**
 * Assistant response DTO
 */
export class AssistantResponseDto {
  @ApiProperty({
    description: 'Recognized intent',
    enum: AssistantIntent,
    example: AssistantIntent.CREATE_TASK,
  })
  intent: AssistantIntent;

  @ApiProperty({
    description: 'Intent recognition confidence (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  confidence: number;

  @ApiProperty({
    description: 'AI-generated response text',
    example: 'I\'ve created a high-priority task to prepare the quarterly report with a due date of August 20th. The task has been assigned to you and I\'ve added relevant tags for easy tracking.',
  })
  response: string;

  @ApiProperty({
    description: 'Actions executed or planned',
    type: [AssistantActionDto],
  })
  actions: AssistantActionDto[];

  @ApiProperty({
    description: 'AI-generated suggestions',
    example: [
      'Consider setting a reminder 24 hours before the due date',
      'Add team members as collaborators for this task',
      'Break down the task into smaller subtasks for better tracking',
    ],
  })
  suggestions: string[];

  @ApiProperty({
    description: 'Response metadata',
    example: {
      processingTime: 1250,
      model: 'gemini-2.0-flash-exp',
      timestamp: '2025-08-14T15:30:00Z',
      tokensUsed: 150,
    },
  })
  metadata: {
    processingTime: number;
    model: string;
    timestamp: string;
    tokensUsed?: number;
    requestId?: string;
  };

  @ApiPropertyOptional({
    description: 'Follow-up questions or clarifications needed',
    example: [
      'Would you like me to invite specific team members to this meeting?',
      'Should I set up a recurring reminder for similar tasks?',
    ],
  })
  @IsOptional()
  followUpQuestions?: string[];

  @ApiPropertyOptional({
    description: 'Context for next interaction',
    example: {
      lastCreatedTaskId: '123e4567-e89b-12d3-a456-426614174000',
      pendingActions: ['send_reminder'],
      conversationState: 'task_created',
    },
  })
  @IsOptional()
  nextContext?: Record<string, any>;
}

/**
 * Daily briefing request DTO
 */
export class DailyBriefingRequestDto {
  @ApiPropertyOptional({
    description: 'Date for briefing (ISO format)',
    example: '2025-08-14',
  })
  @IsOptional()
  @IsString({ message: 'Date must be a string' })
  @Transform(({ value }) => {
    if (value && !value.includes('T')) {
      return `${value}T00:00:00Z`;
    }
    return value;
  })
  date?: string;

  @ApiPropertyOptional({
    description: 'User context for personalized briefing',
    type: UserContextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserContextDto)
  context?: UserContextDto;

  @ApiPropertyOptional({
    description: 'Briefing sections to include',
    example: ['schedule', 'tasks', 'priorities', 'insights'],
  })
  @IsOptional()
  @IsArray({ message: 'Sections must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot include more than 10 sections' })
  @IsString({ each: true, message: 'Each section must be a string' })
  sections?: string[];

  @ApiPropertyOptional({
    description: 'Briefing detail level',
    enum: ['summary', 'detailed', 'comprehensive'],
    example: 'detailed',
  })
  @IsOptional()
  @IsEnum(['summary', 'detailed', 'comprehensive'])
  detailLevel?: 'summary' | 'detailed' | 'comprehensive';
}

/**
 * Daily briefing response DTO
 */
export class DailyBriefingResponseDto {
  @ApiProperty({
    description: 'Briefing date',
    example: '2025-08-14',
  })
  date: string;

  @ApiProperty({
    description: 'Executive summary',
    example: 'You have a productive day ahead with 3 meetings and 8 pending tasks. Focus on the quarterly report preparation as it\'s due in 6 days.',
  })
  summary: string;

  @ApiProperty({
    description: 'Schedule overview',
    example: {
      totalMeetings: 3,
      totalDuration: 180,
      conflicts: 0,
      freeTime: 300,
      meetings: [
        {
          title: 'Team Standup',
          time: '09:00',
          duration: 30,
          attendees: 5,
        },
      ],
    },
  })
  schedule: {
    totalMeetings: number;
    totalDuration: number;
    conflicts: number;
    freeTime: number;
    meetings: Array<{
      title: string;
      time: string;
      duration: number;
      attendees?: number;
      location?: string;
    }>;
  };

  @ApiProperty({
    description: 'Task overview',
    example: {
      total: 25,
      urgent: 3,
      overdue: 1,
      dueToday: 2,
      estimated: 480,
      topPriorities: [
        {
          title: 'Prepare quarterly report',
          priority: 'urgent',
          dueDate: '2025-08-20',
        },
      ],
    },
  })
  tasks: {
    total: number;
    urgent: number;
    overdue: number;
    dueToday: number;
    estimatedMinutes: number;
    topPriorities: Array<{
      title: string;
      priority: string;
      dueDate: string;
    }>;
  };

  @ApiProperty({
    description: 'AI-generated insights and recommendations',
    example: [
      'Your workload is 20% higher than usual this week',
      'Consider rescheduling the 4 PM meeting to create a focused work block',
      'The quarterly report task is critical - allocate 3 hours today',
    ],
  })
  insights: string[];

  @ApiProperty({
    description: 'Proactive suggestions',
    example: [
      'Prepare agenda for team standup meeting',
      'Block calendar for quarterly report work',
      'Send reminder to team about project deadline',
    ],
  })
  suggestions: string[];

  @ApiProperty({
    description: 'Weather and external factors',
    example: {
      weather: 'Sunny, 72°F',
      traffic: 'Light traffic expected',
      alerts: ['No major disruptions expected'],
    },
  })
  external: {
    weather?: string;
    traffic?: string;
    alerts: string[];
  };

  @ApiProperty({
    description: 'Briefing generation metadata',
    example: {
      generatedAt: '2025-08-14T06:00:00Z',
      processingTime: 2500,
      dataFreshness: '5 minutes',
      version: '2.0.0',
    },
  })
  metadata: {
    generatedAt: string;
    processingTime: number;
    dataFreshness: string;
    version: string;
  };
}
