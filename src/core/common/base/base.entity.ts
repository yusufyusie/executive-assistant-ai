/**
 * Base Entity Class
 * Provides common functionality for all domain entities
 */

import { UUID, Timestamp, IDomainEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntity {
  private readonly _id: UUID;
  private readonly _createdAt: Timestamp;
  private _updatedAt: Timestamp;
  private _version: number;
  private _domainEvents: IDomainEvent[];

  constructor(id?: UUID) {
    this._id = id || uuidv4();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._version = 1;
    this._domainEvents = [];
  }

  // Getters
  public get id(): UUID {
    return this._id;
  }

  public get createdAt(): Timestamp {
    return this._createdAt;
  }

  public get updatedAt(): Timestamp {
    return this._updatedAt;
  }

  public get version(): number {
    return this._version;
  }

  public get domainEvents(): ReadonlyArray<IDomainEvent> {
    return [...this._domainEvents];
  }

  // Domain Event Management
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // Entity Management
  protected markAsUpdated(): void {
    this._updatedAt = new Date();
    this._version += 1;
  }

  // Equality
  public equals(other: BaseEntity): boolean {
    if (!(other instanceof BaseEntity)) {
      return false;
    }
    return this._id === other._id;
  }

  // Validation
  protected abstract validate(): void;

  // Serialization
  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      version: this._version
    };
  }
}

/**
 * Base Aggregate Root Class
 * Extends BaseEntity with aggregate-specific functionality
 */
export abstract class BaseAggregateRoot extends BaseEntity {
  constructor(id?: UUID) {
    super(id);
  }

  // Aggregate-specific methods can be added here
  public getUncommittedEvents(): ReadonlyArray<IDomainEvent> {
    return this.domainEvents;
  }

  public markEventsAsCommitted(): void {
    this.clearDomainEvents();
  }
}

/**
 * Base Value Object Class
 * Provides immutable value object functionality
 */
export abstract class BaseValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = Object.freeze(value);
  }

  public get value(): T {
    return this._value;
  }

  // Equality based on value
  public equals(other: BaseValueObject<T>): boolean {
    if (!(other instanceof BaseValueObject)) {
      return false;
    }
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }

  // Validation
  protected abstract validate(value: T): void;

  // Serialization
  public toJSON(): T {
    return this._value;
  }

  public toString(): string {
    return JSON.stringify(this._value);
  }
}

/**
 * Base Repository Interface
 * Defines common repository operations
 */
export interface IBaseRepository<TEntity extends BaseEntity, TId = UUID> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  save(entity: TEntity): Promise<TEntity>;
  update(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
  exists(id: TId): Promise<boolean>;
}

/**
 * Base Service Class
 * Provides common service functionality
 */
export abstract class BaseService {
  protected readonly logger: any; // Will be injected

  constructor(logger?: any) {
    this.logger = logger;
  }

  protected log(level: string, message: string, context?: any): void {
    if (this.logger) {
      this.logger[level](message, context);
    }
  }

  protected logInfo(message: string, context?: any): void {
    this.log('info', message, context);
  }

  protected logError(message: string, error?: Error, context?: any): void {
    this.log('error', message, { error: error?.message, stack: error?.stack, ...context });
  }

  protected logWarn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  protected logDebug(message: string, context?: any): void {
    this.log('debug', message, context);
  }
}

/**
 * Base Controller Class
 * Provides common controller functionality
 */
export abstract class BaseController {
  protected readonly logger: any; // Will be injected

  constructor(logger?: any) {
    this.logger = logger;
  }

  protected log(level: string, message: string, context?: any): void {
    if (this.logger) {
      this.logger[level](message, context);
    }
  }

  protected logInfo(message: string, context?: any): void {
    this.log('info', message, context);
  }

  protected logError(message: string, error?: Error, context?: any): void {
    this.log('error', message, { error: error?.message, stack: error?.stack, ...context });
  }
}

/**
 * Base Exception Class
 * Provides structured exception handling
 */
export abstract class BaseException extends Error {
  public readonly code: string;
  public readonly timestamp: Timestamp;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Domain Exception Classes
 */
export class DomainException extends BaseException {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

export class NotFoundExceptionDomain extends DomainException {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', { resource, id });
  }
}

export class ConflictException extends DomainException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', context);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized access', context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', context);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Forbidden access', context?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', context);
  }
}

/**
 * Application Exception Classes
 */
export class ApplicationException extends BaseException {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
  }
}

export class ExternalServiceException extends ApplicationException {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(`External service ${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', { service, ...context });
  }
}

export class ConfigurationException extends ApplicationException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', context);
  }
}
