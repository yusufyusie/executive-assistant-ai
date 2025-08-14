/**
 * AI Assistant DTOs
 * Data Transfer Objects with comprehensive validation
 */

import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsObject, 
  IsEnum, 
  IsNumber, 
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
  Min,
  Max,
  IsUUID,
  IsDateString
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestPriority } from '../../domain/entities/ai-request.entity';
import { UUID } from '../../../../core/common/types';
import { TrimString, ToLowerCase } from '../../../../core/common/decorators';

/**
 * Process AI Request DTO
 */
export class ProcessAiRequestDto {
  @ApiProperty({
    description: 'Natural language input text to be processed by AI',
    example: 'Schedule a meeting with the executive team for next Tuesday at 2 PM',
    minLength: 1,
    maxLength: 10000
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  @TrimString()
  public readonly input: string;

  @ApiPropertyOptional({
    description: 'Optional context information for the AI request',
    type: ProcessAiRequestContextDto
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProcessAiRequestContextDto)
  public readonly context?: ProcessAiRequestContextDto;

  @ApiPropertyOptional({
    description: 'Priority level for the AI request',
    enum: RequestPriority,
    default: RequestPriority.NORMAL
  })
  @IsOptional()
  @IsEnum(RequestPriority)
  public readonly priority?: RequestPriority;

  @ApiPropertyOptional({
    description: 'Additional processing options',
    type: ProcessAiRequestOptionsDto
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProcessAiRequestOptionsDto)
  public readonly options?: ProcessAiRequestOptionsDto;

  constructor(
    input: string,
    context?: ProcessAiRequestContextDto,
    priority?: RequestPriority,
    options?: ProcessAiRequestOptionsDto
  ) {
    this.input = input;
    this.context = context;
    this.priority = priority;
    this.options = options;
  }
}

/**
 * Process AI Request Context DTO
 */
export class ProcessAiRequestContextDto {
  @ApiPropertyOptional({
    description: 'User ID making the request',
    example: 'user_123456789'
  })
  @IsOptional()
  @IsString()
  @TrimString()
  public readonly userId?: string;

  @ApiPropertyOptional({
    description: 'Session ID for request tracking',
    example: 'session_abcdef123456'
  })
  @IsOptional()
  @IsString()
  @TrimString()
  public readonly sessionId?: string;

  @ApiPropertyOptional({
    description: 'User timezone for date/time processing',
    example: 'America/New_York',
    default: 'UTC'
  })
  @IsOptional()
  @IsString()
  @TrimString()
  public readonly timezone?: string;

  @ApiPropertyOptional({
    description: 'User preferences and settings',
    example: { language: 'en', dateFormat: 'MM/DD/YYYY' }
  })
  @IsOptional()
  @IsObject()
  public readonly preferences?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Additional metadata for the request',
    example: { source: 'web', version: '1.0.0' }
  })
  @IsOptional()
  @IsObject()
  public readonly metadata?: Record<string, unknown>;
}

/**
 * Process AI Request Options DTO
 */
export class ProcessAiRequestOptionsDto {
  @ApiPropertyOptional({
    description: 'AI model to use for processing',
    example: 'gemini-2.0-flash-exp'
  })
  @IsOptional()
  @IsString()
  @TrimString()
  public readonly model?: string;

  @ApiPropertyOptional({
    description: 'Temperature for AI response creativity (0.0 - 2.0)',
    example: 0.7,
    minimum: 0.0,
    maximum: 2.0
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(2.0)
  public readonly temperature?: number;

  @ApiPropertyOptional({
    description: 'Maximum tokens for AI response',
    example: 2048,
    minimum: 1,
    maximum: 8192
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8192)
  public readonly maxTokens?: number;

  @ApiPropertyOptional({
    description: 'Include alternative suggestions in response',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  public readonly includeAlternatives?: boolean;

  @ApiPropertyOptional({
    description: 'Enable fallback mechanisms if primary AI fails',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  public readonly enableFallback?: boolean;

  @ApiPropertyOptional({
    description: 'Request timeout in milliseconds',
    example: 30000,
    minimum: 1000,
    maximum: 120000
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(120000)
  public readonly timeout?: number;
}

/**
 * Process AI Request Response DTO
 */
export class ProcessAiRequestResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the AI request',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  public readonly requestId: UUID;

  @ApiProperty({
    description: 'Processing status of the request',
    example: 'completed',
    enum: ['pending', 'processing', 'completed', 'failed']
  })
  @IsString()
  public readonly status: string;

  @ApiProperty({
    description: 'Detected intent from the input',
    example: 'schedule_meeting'
  })
  @IsString()
  public readonly intent: string;

  @ApiProperty({
    description: 'Confidence score for the intent detection (0.0 - 1.0)',
    example: 0.95,
    minimum: 0.0,
    maximum: 1.0
  })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  public readonly confidence: number;

  @ApiProperty({
    description: 'AI-generated response text',
    example: 'I\'ll schedule a meeting with the executive team for next Tuesday at 2 PM.'
  })
  @IsString()
  public readonly response: string;

  @ApiProperty({
    description: 'Actionable items extracted from the request',
    type: [AiActionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiActionDto)
  public readonly actions: AiActionDto[];

  @ApiPropertyOptional({
    description: 'Alternative suggestions if available',
    type: [AiAlternativeDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiAlternativeDto)
  public readonly alternatives?: AiAlternativeDto[];

  @ApiProperty({
    description: 'Processing metadata and metrics',
    type: AiResponseMetadataDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AiResponseMetadataDto)
  public readonly metadata: AiResponseMetadataDto;

  constructor(
    requestId: UUID,
    status: string,
    intent: string,
    confidence: number,
    response: string,
    actions: AiActionDto[],
    metadata: AiResponseMetadataDto,
    alternatives?: AiAlternativeDto[]
  ) {
    this.requestId = requestId;
    this.status = status;
    this.intent = intent;
    this.confidence = confidence;
    this.response = response;
    this.actions = actions;
    this.metadata = metadata;
    this.alternatives = alternatives;
  }
}

/**
 * AI Action DTO
 */
export class AiActionDto {
  @ApiProperty({
    description: 'Type of action to be performed',
    example: 'schedule_meeting'
  })
  @IsString()
  @IsNotEmpty()
  public readonly type: string;

  @ApiProperty({
    description: 'Parameters for the action',
    example: {
      title: 'Executive Team Meeting',
      startTime: '2025-08-20T14:00:00-04:00',
      attendees: ['exec-team@company.com']
    }
  })
  @IsObject()
  public readonly parameters: Record<string, unknown>;

  @ApiProperty({
    description: 'Priority level for action execution (1-10)',
    example: 1,
    minimum: 1,
    maximum: 10
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  public readonly priority: number;

  @ApiPropertyOptional({
    description: 'Estimated completion time in seconds',
    example: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  public readonly estimatedCompletion?: number;

  constructor(
    type: string,
    parameters: Record<string, unknown>,
    priority: number,
    estimatedCompletion?: number
  ) {
    this.type = type;
    this.parameters = parameters;
    this.priority = priority;
    this.estimatedCompletion = estimatedCompletion;
  }
}

/**
 * AI Alternative DTO
 */
export class AiAlternativeDto {
  @ApiProperty({
    description: 'Alternative suggestion text',
    example: 'Tuesday at 3 PM if 2 PM conflicts'
  })
  @IsString()
  @IsNotEmpty()
  public readonly suggestion: string;

  @ApiProperty({
    description: 'Confidence score for the alternative (0.0 - 1.0)',
    example: 0.8,
    minimum: 0.0,
    maximum: 1.0
  })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  public readonly confidence: number;

  constructor(suggestion: string, confidence: number) {
    this.suggestion = suggestion;
    this.confidence = confidence;
  }
}

/**
 * AI Response Metadata DTO
 */
export class AiResponseMetadataDto {
  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 1250
  })
  @IsNumber()
  @Min(0)
  public readonly processingTime: number;

  @ApiProperty({
    description: 'AI model used for processing',
    example: 'gemini-2.0-flash-exp'
  })
  @IsString()
  @IsNotEmpty()
  public readonly model: string;

  @ApiProperty({
    description: 'Number of tokens used in processing',
    example: 156
  })
  @IsNumber()
  @Min(0)
  public readonly tokens: number;

  @ApiPropertyOptional({
    description: 'Request timestamp',
    example: '2025-08-14T12:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  public readonly timestamp?: string;

  @ApiPropertyOptional({
    description: 'Additional processing metadata'
  })
  @IsOptional()
  @IsObject()
  public readonly additional?: Record<string, unknown>;

  constructor(
    processingTime: number,
    model: string,
    tokens: number,
    timestamp?: string,
    additional?: Record<string, unknown>
  ) {
    this.processingTime = processingTime;
    this.model = model;
    this.tokens = tokens;
    this.timestamp = timestamp;
    this.additional = additional;
  }
}

/**
 * AI Request Status DTO
 */
export class AiRequestStatusDto {
  @ApiProperty({
    description: 'Request identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  public readonly id: UUID;

  @ApiProperty({
    description: 'Current status of the request',
    example: 'completed',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
  })
  @IsString()
  public readonly status: string;

  @ApiProperty({
    description: 'Request creation timestamp',
    example: '2025-08-14T12:00:00.000Z'
  })
  @IsDateString()
  public readonly createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-08-14T12:01:15.000Z'
  })
  @IsDateString()
  public readonly updatedAt: string;

  @ApiPropertyOptional({
    description: 'Processing time in milliseconds',
    example: 1250
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  public readonly processingTime?: number;

  @ApiPropertyOptional({
    description: 'Error information if request failed'
  })
  @IsOptional()
  @IsObject()
  public readonly error?: {
    code: string;
    message: string;
    details?: unknown;
  };

  constructor(
    id: UUID,
    status: string,
    createdAt: string,
    updatedAt: string,
    processingTime?: number,
    error?: { code: string; message: string; details?: unknown }
  ) {
    this.id = id;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.processingTime = processingTime;
    this.error = error;
  }
}
