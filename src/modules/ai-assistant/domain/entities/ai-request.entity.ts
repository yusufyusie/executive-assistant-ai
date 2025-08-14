/**
 * AI Request Domain Entity
 * Represents an AI processing request in the domain
 */

import { AggregateRoot, DomainEvent, ValueObject, DomainError } from '../../../../shared/domain/base/aggregate-root';
import { UUID } from '../../../../core/common/types';
import { v4 as uuidv4 } from 'uuid';

// Value Objects
export class RequestInput extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('Request input cannot be empty', 'INVALID_INPUT');
    }
    if (value.length > 10000) {
      throw new DomainError('Request input too long', 'INPUT_TOO_LONG');
    }
  }

  public static create(input: string): RequestInput {
    return new RequestInput(input.trim());
  }
}

export class RequestContext extends ValueObject<{
  userId?: string;
  sessionId?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}> {
  protected validate(value: any): void {
    if (value && typeof value !== 'object') {
      throw new DomainError('Request context must be an object', 'INVALID_CONTEXT');
    }
  }

  public static create(context: {
    userId?: string;
    sessionId?: string;
    timezone?: string;
    preferences?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): RequestContext {
    return new RequestContext(context);
  }

  public getUserId(): string | undefined {
    return this.value.userId;
  }

  public getSessionId(): string | undefined {
    return this.value.sessionId;
  }

  public getTimezone(): string {
    return this.value.timezone || 'UTC';
  }

  public getPreferences(): Record<string, unknown> {
    return this.value.preferences || {};
  }

  public getMetadata(): Record<string, unknown> {
    return this.value.metadata || {};
  }
}

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class AiResponse extends ValueObject<{
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
}> {
  protected validate(value: any): void {
    if (!value || typeof value !== 'object') {
      throw new DomainError('AI response must be an object', 'INVALID_RESPONSE');
    }
    if (!value.intent || typeof value.intent !== 'string') {
      throw new DomainError('AI response must have an intent', 'MISSING_INTENT');
    }
    if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
      throw new DomainError('AI response confidence must be between 0 and 1', 'INVALID_CONFIDENCE');
    }
    if (!value.response || typeof value.response !== 'string') {
      throw new DomainError('AI response must have a response text', 'MISSING_RESPONSE');
    }
    if (!Array.isArray(value.actions)) {
      throw new DomainError('AI response must have actions array', 'MISSING_ACTIONS');
    }
  }

  public static create(response: {
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
  }): AiResponse {
    return new AiResponse(response);
  }

  public getIntent(): string {
    return this.value.intent;
  }

  public getConfidence(): number {
    return this.value.confidence;
  }

  public getResponse(): string {
    return this.value.response;
  }

  public getActions(): Array<{ type: string; parameters: Record<string, unknown>; priority: number }> {
    return this.value.actions;
  }

  public getAlternatives(): Array<{ suggestion: string; confidence: number }> {
    return this.value.alternatives || [];
  }

  public getMetadata(): { processingTime: number; model: string; tokens: number } {
    return this.value.metadata;
  }

  public isHighConfidence(threshold: number = 0.8): boolean {
    return this.value.confidence >= threshold;
  }
}

// Domain Events
export class AiRequestCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: UUID,
    public readonly input: string,
    public readonly context: Record<string, unknown>,
    public readonly priority: RequestPriority
  ) {
    super(aggregateId, 'AiRequestCreated', { input, context, priority });
  }
}

export class AiRequestProcessingStartedEvent extends DomainEvent {
  constructor(
    aggregateId: UUID,
    public readonly startedAt: Date
  ) {
    super(aggregateId, 'AiRequestProcessingStarted', { startedAt });
  }
}

export class AiRequestCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: UUID,
    public readonly response: Record<string, unknown>,
    public readonly processingTime: number
  ) {
    super(aggregateId, 'AiRequestCompleted', { response, processingTime });
  }
}

export class AiRequestFailedEvent extends DomainEvent {
  constructor(
    aggregateId: UUID,
    public readonly error: string,
    public readonly errorCode: string
  ) {
    super(aggregateId, 'AiRequestFailed', { error, errorCode });
  }
}

// AI Request Aggregate Root
export class AiRequest extends AggregateRoot {
  private _input: RequestInput;
  private _context: RequestContext;
  private _status: RequestStatus;
  private _priority: RequestPriority;
  private _response?: AiResponse;
  private _error?: string;
  private _errorCode?: string;
  private _processingStartedAt?: Date;
  private _processingCompletedAt?: Date;
  private _retryCount: number;
  private _maxRetries: number;

  constructor(
    id: UUID,
    input: RequestInput,
    context: RequestContext,
    priority: RequestPriority = RequestPriority.NORMAL,
    maxRetries: number = 3
  ) {
    super(id);
    this._input = input;
    this._context = context;
    this._status = RequestStatus.PENDING;
    this._priority = priority;
    this._retryCount = 0;
    this._maxRetries = maxRetries;
    this.validate();

    // Raise domain event
    this.applyEvent(new AiRequestCreatedEvent(
      this.id,
      this._input.value,
      this._context.value,
      this._priority
    ));
  }

  // Factory method
  public static create(
    input: string,
    context: Record<string, unknown> = {},
    priority: RequestPriority = RequestPriority.NORMAL,
    maxRetries: number = 3
  ): AiRequest {
    const requestInput = RequestInput.create(input);
    const requestContext = RequestContext.create(context);
    return new AiRequest(uuidv4(), requestInput, requestContext, priority, maxRetries);
  }

  // Getters
  public get input(): RequestInput {
    return this._input;
  }

  public get context(): RequestContext {
    return this._context;
  }

  public get status(): RequestStatus {
    return this._status;
  }

  public get priority(): RequestPriority {
    return this._priority;
  }

  public get response(): AiResponse | undefined {
    return this._response;
  }

  public get error(): string | undefined {
    return this._error;
  }

  public get errorCode(): string | undefined {
    return this._errorCode;
  }

  public get processingStartedAt(): Date | undefined {
    return this._processingStartedAt;
  }

  public get processingCompletedAt(): Date | undefined {
    return this._processingCompletedAt;
  }

  public get retryCount(): number {
    return this._retryCount;
  }

  public get maxRetries(): number {
    return this._maxRetries;
  }

  // Business Methods
  public startProcessing(): void {
    this.checkInvariant(
      this._status === RequestStatus.PENDING || this._status === RequestStatus.FAILED,
      'Can only start processing pending or failed requests'
    );

    this._status = RequestStatus.PROCESSING;
    this._processingStartedAt = new Date();
    this._error = undefined;
    this._errorCode = undefined;
    this.markAsUpdated();

    this.applyEvent(new AiRequestProcessingStartedEvent(this.id, this._processingStartedAt));
  }

  public completeWithResponse(response: AiResponse): void {
    this.checkInvariant(
      this._status === RequestStatus.PROCESSING,
      'Can only complete processing requests'
    );

    this._status = RequestStatus.COMPLETED;
    this._response = response;
    this._processingCompletedAt = new Date();
    this.markAsUpdated();

    const processingTime = this._processingStartedAt 
      ? this._processingCompletedAt.getTime() - this._processingStartedAt.getTime()
      : 0;

    this.applyEvent(new AiRequestCompletedEvent(this.id, response.value, processingTime));
  }

  public failWithError(error: string, errorCode: string): void {
    this.checkInvariant(
      this._status === RequestStatus.PROCESSING,
      'Can only fail processing requests'
    );

    this._status = RequestStatus.FAILED;
    this._error = error;
    this._errorCode = errorCode;
    this._processingCompletedAt = new Date();
    this.markAsUpdated();

    this.applyEvent(new AiRequestFailedEvent(this.id, error, errorCode));
  }

  public retry(): void {
    this.checkInvariant(
      this._status === RequestStatus.FAILED,
      'Can only retry failed requests'
    );
    this.checkInvariant(
      this._retryCount < this._maxRetries,
      'Maximum retry attempts exceeded'
    );

    this._retryCount += 1;
    this._status = RequestStatus.PENDING;
    this._error = undefined;
    this._errorCode = undefined;
    this._processingStartedAt = undefined;
    this._processingCompletedAt = undefined;
    this.markAsUpdated();
  }

  public cancel(): void {
    this.checkInvariant(
      this._status === RequestStatus.PENDING || this._status === RequestStatus.PROCESSING,
      'Can only cancel pending or processing requests'
    );

    this._status = RequestStatus.CANCELLED;
    this._processingCompletedAt = new Date();
    this.markAsUpdated();
  }

  public canRetry(): boolean {
    return this._status === RequestStatus.FAILED && this._retryCount < this._maxRetries;
  }

  public isCompleted(): boolean {
    return this._status === RequestStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this._status === RequestStatus.FAILED;
  }

  public isProcessing(): boolean {
    return this._status === RequestStatus.PROCESSING;
  }

  public isPending(): boolean {
    return this._status === RequestStatus.PENDING;
  }

  public getProcessingDuration(): number | undefined {
    if (!this._processingStartedAt || !this._processingCompletedAt) {
      return undefined;
    }
    return this._processingCompletedAt.getTime() - this._processingStartedAt.getTime();
  }

  // Domain validation
  protected validate(): void {
    if (!this._input) {
      throw new DomainError('AI request must have input', 'MISSING_INPUT');
    }
    if (!this._context) {
      throw new DomainError('AI request must have context', 'MISSING_CONTEXT');
    }
    if (!Object.values(RequestStatus).includes(this._status)) {
      throw new DomainError('Invalid request status', 'INVALID_STATUS');
    }
    if (!Object.values(RequestPriority).includes(this._priority)) {
      throw new DomainError('Invalid request priority', 'INVALID_PRIORITY');
    }
    if (this._retryCount < 0 || this._retryCount > this._maxRetries) {
      throw new DomainError('Invalid retry count', 'INVALID_RETRY_COUNT');
    }
  }

  // Snapshot for persistence
  public toSnapshot(): Record<string, unknown> {
    return {
      ...this.toJSON(),
      input: this._input.value,
      context: this._context.value,
      status: this._status,
      priority: this._priority,
      response: this._response?.value,
      error: this._error,
      errorCode: this._errorCode,
      processingStartedAt: this._processingStartedAt?.toISOString(),
      processingCompletedAt: this._processingCompletedAt?.toISOString(),
      retryCount: this._retryCount,
      maxRetries: this._maxRetries
    };
  }

  public fromSnapshot(snapshot: Record<string, unknown>): void {
    this._input = RequestInput.create(snapshot.input as string);
    this._context = RequestContext.create(snapshot.context as Record<string, unknown>);
    this._status = snapshot.status as RequestStatus;
    this._priority = snapshot.priority as RequestPriority;
    this._response = snapshot.response ? AiResponse.create(snapshot.response as any) : undefined;
    this._error = snapshot.error as string;
    this._errorCode = snapshot.errorCode as string;
    this._processingStartedAt = snapshot.processingStartedAt ? new Date(snapshot.processingStartedAt as string) : undefined;
    this._processingCompletedAt = snapshot.processingCompletedAt ? new Date(snapshot.processingCompletedAt as string) : undefined;
    this._retryCount = snapshot.retryCount as number;
    this._maxRetries = snapshot.maxRetries as number;
  }
}
