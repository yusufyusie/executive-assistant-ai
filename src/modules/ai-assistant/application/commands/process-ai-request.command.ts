/**
 * Process AI Request Command
 * CQRS Command for processing AI requests
 */

import { ICommand, UUID } from '../../../../core/common/types';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestPriority } from '../../domain/entities/ai-request.entity';

export class ProcessAiRequestCommand implements ICommand {
  public readonly commandId: UUID;
  public readonly timestamp: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  public readonly input: string;

  @IsOptional()
  @IsObject()
  public readonly context?: ProcessAiRequestContext;

  @IsOptional()
  @IsEnum(RequestPriority)
  public readonly priority?: RequestPriority;

  @IsOptional()
  @IsObject()
  public readonly options?: ProcessAiRequestOptions;

  constructor(
    input: string,
    context?: ProcessAiRequestContext,
    priority?: RequestPriority,
    options?: ProcessAiRequestOptions
  ) {
    this.commandId = require('uuid').v4();
    this.timestamp = new Date();
    this.input = input;
    this.context = context;
    this.priority = priority || RequestPriority.NORMAL;
    this.options = options;
  }
}

export class ProcessAiRequestContext {
  @IsOptional()
  @IsString()
  public readonly userId?: string;

  @IsOptional()
  @IsString()
  public readonly sessionId?: string;

  @IsOptional()
  @IsString()
  public readonly timezone?: string;

  @IsOptional()
  @IsObject()
  public readonly preferences?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  public readonly metadata?: Record<string, unknown>;

  constructor(
    userId?: string,
    sessionId?: string,
    timezone?: string,
    preferences?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.timezone = timezone;
    this.preferences = preferences;
    this.metadata = metadata;
  }
}

export class ProcessAiRequestOptions {
  @IsOptional()
  @IsString()
  public readonly model?: string;

  @IsOptional()
  public readonly temperature?: number;

  @IsOptional()
  public readonly maxTokens?: number;

  @IsOptional()
  public readonly includeAlternatives?: boolean;

  @IsOptional()
  public readonly enableFallback?: boolean;

  @IsOptional()
  public readonly timeout?: number;

  constructor(
    model?: string,
    temperature?: number,
    maxTokens?: number,
    includeAlternatives?: boolean,
    enableFallback?: boolean,
    timeout?: number
  ) {
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.includeAlternatives = includeAlternatives;
    this.enableFallback = enableFallback;
    this.timeout = timeout;
  }
}

/**
 * Command Result
 */
export class ProcessAiRequestResult {
  constructor(
    public readonly requestId: UUID,
    public readonly status: string,
    public readonly response?: {
      intent: string;
      confidence: number;
      response: string;
      actions: Array<{
        type: string;
        parameters: Record<string, unknown>;
        priority: number;
      }>;
      alternatives?: Array<{
        suggestion: string;
        confidence: number;
      }>;
      metadata: {
        processingTime: number;
        model: string;
        tokens: number;
      };
    },
    public readonly error?: {
      code: string;
      message: string;
      details?: unknown;
    }
  ) {}

  public isSuccess(): boolean {
    return this.status === 'completed' && !this.error;
  }

  public isFailure(): boolean {
    return this.status === 'failed' || !!this.error;
  }
}

/**
 * Command Handler Interface
 */
export interface IProcessAiRequestCommandHandler {
  handle(command: ProcessAiRequestCommand): Promise<ProcessAiRequestResult>;
}
