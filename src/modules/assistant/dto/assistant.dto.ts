/**
 * Assistant DTOs
 * Data transfer objects for assistant operations
 */

import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessingOptions {
  @ApiPropertyOptional({
    description: 'AI model temperature (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number = 0.7;

  @ApiPropertyOptional({
    description: 'Maximum tokens to generate',
    minimum: 1,
    maximum: 2000,
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2000)
  maxTokens?: number = 1000;

  @ApiPropertyOptional({
    description: 'Whether to include reasoning in response',
    default: false,
  })
  @IsOptional()
  includeReasoning?: boolean = false;
}

export class ProcessRequestDto {
  @ApiProperty({
    description: 'The user input to process',
    example: 'Schedule a meeting with John next Tuesday at 2 PM',
  })
  @IsString()
  input: string;

  @ApiPropertyOptional({
    description: 'Additional context for the request',
    example: { userId: 'user123', timezone: 'America/New_York' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Processing options',
  })
  @IsOptional()
  @IsObject()
  options?: ProcessingOptions;
}

export class AssistantResponseDto {
  @ApiProperty({
    description: 'The detected intent',
    example: 'schedule_meeting',
  })
  intent: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.95,
  })
  confidence: number;

  @ApiProperty({
    description: 'Natural language response',
    example: "I'll schedule a meeting with John for next Tuesday at 2 PM.",
  })
  response: string;

  @ApiProperty({
    description: 'Actionable items extracted from the request',
    type: [Object],
  })
  actions: AssistantAction[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  metadata?: Record<string, any>;
}

export class AssistantAction {
  @ApiProperty({
    description: 'Type of action',
    example: 'schedule_meeting',
  })
  type: string;

  @ApiProperty({
    description: 'Action parameters',
    example: {
      title: 'Meeting with John',
      date: '2025-08-20',
      time: '14:00',
      attendees: ['john@example.com'],
    },
  })
  parameters: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Action priority',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string = 'medium';

  @ApiPropertyOptional({
    description: 'Estimated execution time in minutes',
  })
  estimatedDuration?: number;
}

export class AnalyzeRequestDto {
  @ApiProperty({
    description: 'Text to analyze',
    example: 'Can you help me organize my schedule for next week?',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Analysis type',
    enum: ['intent', 'sentiment', 'entities', 'full'],
    default: 'full',
  })
  @IsOptional()
  @IsEnum(['intent', 'sentiment', 'entities', 'full'])
  analysisType?: string = 'full';
}

export class BriefingRequestDto {
  @ApiPropertyOptional({
    description: 'Date for the briefing (ISO string)',
    example: '2025-08-14',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Briefing type',
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  type?: string = 'daily';

  @ApiPropertyOptional({
    description: 'Include specific sections',
    example: ['calendar', 'tasks', 'emails'],
  })
  @IsOptional()
  sections?: string[];
}
