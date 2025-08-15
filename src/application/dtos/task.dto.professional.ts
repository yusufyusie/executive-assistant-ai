/**
 * Executive Assistant AI - Professional Task DTOs
 * Comprehensive data transfer objects with validation and documentation
 * 
 * @fileoverview Professional DTO system providing:
 * - Complete input validation
 * - OpenAPI documentation
 * - Type safety
 * - Security validation
 * - Business rule enforcement
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsValidPriority,
  IsValidTaskStatus,
  IsFutureDate,
  IsSafeString,
  IsTimezone,
} from '../../common/pipes/validation.pipe';

/**
 * Task priority enumeration
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task status enumeration
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Task dependency DTO
 */
export class TaskDependencyDto {
  @ApiProperty({
    description: 'ID of the dependent task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Task ID must be a valid UUID' })
  taskId: string;

  @ApiProperty({
    description: 'Type of dependency relationship',
    enum: ['blocks', 'blocked_by', 'related'],
    example: 'blocks',
  })
  @IsEnum(['blocks', 'blocked_by', 'related'])
  type: 'blocks' | 'blocked_by' | 'related';
}

/**
 * Create task DTO
 */
export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Prepare quarterly financial report',
    minLength: 1,
    maxLength: 200,
  })
  @IsString({ message: 'Title must be a string' })
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @IsSafeString({ message: 'Title contains unsafe content' })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed task description',
    example: 'Compile Q4 financial data, create presentation slides, and prepare executive summary',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  @IsSafeString({ message: 'Description contains unsafe content' })
  description?: string;

  @ApiProperty({
    description: 'Task priority level',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsEnum(TaskPriority, { message: 'Priority must be one of: low, medium, high, urgent' })
  priority: TaskPriority;

  @ApiPropertyOptional({
    description: 'Task due date in ISO format',
    example: '2025-08-20T17:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  @IsFutureDate({ message: 'Due date must be in the future' })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Email address of the task assignee',
    example: 'executive@company.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Assignee must be a valid email address' })
  assignee?: string;

  @ApiPropertyOptional({
    description: 'Task tags for categorization',
    example: ['finance', 'quarterly', 'reporting'],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @MaxLength(50, { each: true, message: 'Each tag cannot exceed 50 characters' })
  @Transform(({ value }) => value?.map((tag: string) => tag.toLowerCase().trim()))
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Estimated duration in minutes',
    example: 120,
    minimum: 1,
    maximum: 10080,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated duration must be a number' })
  @Min(1, { message: 'Estimated duration must be at least 1 minute' })
  @Max(10080, { message: 'Estimated duration cannot exceed 1 week (10080 minutes)' })
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Task dependencies',
    type: [TaskDependencyDto],
  })
  @IsOptional()
  @IsArray({ message: 'Dependencies must be an array' })
  @ArrayMaxSize(20, { message: 'Cannot have more than 20 dependencies' })
  @ValidateNested({ each: true })
  @Type(() => TaskDependencyDto)
  dependencies?: TaskDependencyDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata for the task',
    example: { project: 'Q4-2024', department: 'Finance' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Update task DTO
 */
export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Task title',
    example: 'Prepare quarterly financial report (Updated)',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @IsSafeString({ message: 'Title contains unsafe content' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed task description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  @IsSafeString({ message: 'Description contains unsafe content' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status must be one of: pending, in-progress, completed, cancelled' })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Task priority level',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Priority must be one of: low, medium, high, urgent' })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Task due date in ISO format',
    example: '2025-08-20T17:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Email address of the task assignee',
    example: 'executive@company.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Assignee must be a valid email address' })
  assignee?: string;

  @ApiPropertyOptional({
    description: 'Task tags for categorization',
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @MaxLength(50, { each: true, message: 'Each tag cannot exceed 50 characters' })
  @Transform(({ value }) => value?.map((tag: string) => tag.toLowerCase().trim()))
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Estimated duration in minutes',
    minimum: 1,
    maximum: 10080,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated duration must be a number' })
  @Min(1, { message: 'Estimated duration must be at least 1 minute' })
  @Max(10080, { message: 'Estimated duration cannot exceed 1 week (10080 minutes)' })
  estimatedDuration?: number;

  @ApiPropertyOptional({
    description: 'Task dependencies',
    type: [TaskDependencyDto],
  })
  @IsOptional()
  @IsArray({ message: 'Dependencies must be an array' })
  @ArrayMaxSize(20, { message: 'Cannot have more than 20 dependencies' })
  @ValidateNested({ each: true })
  @Type(() => TaskDependencyDto)
  dependencies?: TaskDependencyDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata for the task',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Task query parameters DTO
 */
export class TaskQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by task status',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status must be one of: pending, in-progress, completed, cancelled' })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filter by task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Priority must be one of: low, medium, high, urgent' })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Filter by assignee email',
    example: 'executive@company.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Assignee must be a valid email address' })
  assignee?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'finance,quarterly',
  })
  @IsOptional()
  @IsString({ message: 'Tags must be a string' })
  @Transform(({ value }) => value?.split(',').map((tag: string) => tag.trim().toLowerCase()))
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by due date from (ISO format)',
    example: '2025-08-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date from must be a valid ISO date string' })
  dueDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by due date to (ISO format)',
    example: '2025-08-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date to must be a valid ISO date string' })
  dueDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter overdue tasks only',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Is overdue must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Search in title and description',
    example: 'quarterly report',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @MaxLength(100, { message: 'Search query cannot exceed 100 characters' })
  @IsSafeString({ message: 'Search query contains unsafe content' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['title', 'createdAt', 'updatedAt', 'dueDate', 'priority', 'urgencyScore'],
    example: 'dueDate',
  })
  @IsOptional()
  @IsEnum(['title', 'createdAt', 'updatedAt', 'dueDate', 'priority', 'urgencyScore'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit?: number;
}

/**
 * Task prioritization request DTO
 */
export class PrioritizeTasksDto {
  @ApiPropertyOptional({
    description: 'Array of task IDs to prioritize',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-9f12-345678901234'],
  })
  @IsOptional()
  @IsArray({ message: 'Task IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one task ID is required' })
  @ArrayMaxSize(50, { message: 'Cannot prioritize more than 50 tasks at once' })
  @IsUUID(4, { each: true, message: 'Each task ID must be a valid UUID' })
  taskIds?: string[];

  @ApiPropertyOptional({
    description: 'Prioritization criteria weights',
    example: {
      urgencyWeight: 0.4,
      importanceWeight: 0.3,
      complexityWeight: 0.2,
      dependencyWeight: 0.1,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrioritizationCriteriaDto)
  criteria?: PrioritizationCriteriaDto;

  @ApiPropertyOptional({
    description: 'User timezone for date calculations',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  @IsTimezone({ message: 'Timezone must be a valid timezone identifier' })
  timezone?: string;
}

/**
 * Prioritization criteria DTO
 */
export class PrioritizationCriteriaDto {
  @ApiPropertyOptional({
    description: 'Weight for urgency factor (0-1)',
    example: 0.4,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Urgency weight must be a number' })
  @Min(0, { message: 'Urgency weight must be at least 0' })
  @Max(1, { message: 'Urgency weight cannot exceed 1' })
  urgencyWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight for importance factor (0-1)',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Importance weight must be a number' })
  @Min(0, { message: 'Importance weight must be at least 0' })
  @Max(1, { message: 'Importance weight cannot exceed 1' })
  importanceWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight for complexity factor (0-1)',
    example: 0.2,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Complexity weight must be a number' })
  @Min(0, { message: 'Complexity weight must be at least 0' })
  @Max(1, { message: 'Complexity weight cannot exceed 1' })
  complexityWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight for dependency factor (0-1)',
    example: 0.1,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Dependency weight must be a number' })
  @Min(0, { message: 'Dependency weight must be at least 0' })
  @Max(1, { message: 'Dependency weight cannot exceed 1' })
  dependencyWeight?: number;
}

/**
 * Task response DTO
 */
export class TaskResponseDto {
  @ApiProperty({
    description: 'Unique task identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Prepare quarterly financial report',
  })
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Compile Q4 financial data and create presentation',
  })
  description: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  priority: TaskPriority;

  @ApiProperty({
    description: 'Task due date',
    example: '2025-08-20T17:00:00Z',
  })
  dueDate: string;

  @ApiProperty({
    description: 'Task assignee email',
    example: 'executive@company.com',
  })
  assignee: string;

  @ApiProperty({
    description: 'Task tags',
    example: ['finance', 'quarterly'],
  })
  tags: string[];

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 120,
  })
  estimatedDuration: number;

  @ApiProperty({
    description: 'Task dependencies',
    type: [TaskDependencyDto],
  })
  dependencies: TaskDependencyDto[];

  @ApiProperty({
    description: 'Whether task is overdue',
    example: false,
  })
  isOverdue: boolean;

  @ApiProperty({
    description: 'Urgency score (0-100)',
    example: 85,
  })
  urgencyScore: number;

  @ApiProperty({
    description: 'Task creation timestamp',
    example: '2025-08-14T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Task last update timestamp',
    example: '2025-08-14T15:30:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Task completion timestamp',
    example: '2025-08-20T16:45:00Z',
  })
  completedAt?: string;

  @ApiProperty({
    description: 'Additional task metadata',
    example: { project: 'Q4-2024', department: 'Finance' },
  })
  metadata: Record<string, any>;
}

/**
 * Task list response DTO
 */
export class TaskListResponseDto {
  @ApiProperty({
    description: 'Array of tasks',
    type: [TaskResponseDto],
  })
  items: TaskResponseDto[];

  @ApiProperty({
    description: 'Total number of tasks',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there are more pages',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there are previous pages',
    example: false,
  })
  hasPrevious: boolean;
}

/**
 * Task prioritization response DTO
 */
export class TaskPrioritizationResponseDto {
  @ApiProperty({
    description: 'Prioritized tasks with scores',
    type: [TaskResponseDto],
  })
  prioritizedTasks: TaskResponseDto[];

  @ApiProperty({
    description: 'Prioritization summary',
    example: {
      totalTasks: 25,
      highPriority: 8,
      mediumPriority: 12,
      lowPriority: 5,
      averageUrgencyScore: 67.5,
    },
  })
  summary: {
    totalTasks: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    averageUrgencyScore: number;
  };

  @ApiProperty({
    description: 'AI-generated recommendations',
    example: [
      'Focus on 8 high-priority tasks first',
      '3 tasks are overdue and need immediate attention',
      'Consider delegating 5 low-priority tasks',
    ],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Prioritization criteria used',
    type: PrioritizationCriteriaDto,
  })
  criteria: PrioritizationCriteriaDto;
}

/**
 * Task analytics response DTO
 */
export class TaskAnalyticsResponseDto {
  @ApiProperty({
    description: 'Overall task statistics',
    example: {
      total: 150,
      completed: 120,
      pending: 25,
      inProgress: 5,
      overdue: 8,
      completionRate: 80,
      averageCompletionTime: 2.5,
    },
  })
  overview: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
    averageCompletionTime: number;
  };

  @ApiProperty({
    description: 'Tasks by priority distribution',
    example: {
      urgent: 5,
      high: 15,
      medium: 20,
      low: 10,
    },
  })
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };

  @ApiProperty({
    description: 'Tasks by status distribution',
    example: {
      pending: 25,
      inProgress: 5,
      completed: 120,
      cancelled: 0,
    },
  })
  byStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };

  @ApiProperty({
    description: 'Productivity trends over time',
    example: {
      thisWeek: { completed: 15, created: 12 },
      lastWeek: { completed: 18, created: 14 },
      thisMonth: { completed: 65, created: 58 },
      lastMonth: { completed: 72, created: 68 },
    },
  })
  trends: {
    thisWeek: { completed: number; created: number };
    lastWeek: { completed: number; created: number };
    thisMonth: { completed: number; created: number };
    lastMonth: { completed: number; created: number };
  };

  @ApiProperty({
    description: 'Performance insights and recommendations',
    example: [
      'Completion rate improved by 5% this month',
      'Average task completion time decreased by 0.3 days',
      'Consider breaking down complex tasks for better tracking',
    ],
  })
  insights: string[];
}
