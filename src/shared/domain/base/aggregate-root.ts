/**
 * Base Aggregate Root
 * Implements DDD aggregate root pattern with domain events
 */

import { BaseEntity, IDomainEvent, UUID } from '../../../core/common/types';
import { v4 as uuidv4 } from 'uuid';

export abstract class AggregateRoot extends BaseEntity {
  private _domainEvents: IDomainEvent[] = [];
  private _version: number = 1;

  constructor(id?: UUID) {
    super(id);
  }

  // Domain Events Management
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public getUncommittedEvents(): ReadonlyArray<IDomainEvent> {
    return [...this._domainEvents];
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  // Version Management for Optimistic Concurrency
  public get version(): number {
    return this._version;
  }

  protected incrementVersion(): void {
    this._version += 1;
  }

  // Abstract methods that must be implemented by concrete aggregates
  protected abstract validate(): void;
  public abstract toSnapshot(): Record<string, unknown>;
  public abstract fromSnapshot(snapshot: Record<string, unknown>): void;

  // Business invariant validation
  protected checkInvariant(condition: boolean, message: string): void {
    if (!condition) {
      throw new DomainInvariantViolationError(message);
    }
  }

  // Apply domain event and increment version
  protected applyEvent(event: IDomainEvent): void {
    this.addDomainEvent(event);
    this.incrementVersion();
    this.markAsUpdated();
  }
}

/**
 * Domain Event Base Class
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly id: UUID;
  public readonly occurredAt: Date;
  public readonly version: number;

  constructor(
    public readonly aggregateId: UUID,
    public readonly eventType: string,
    public readonly eventData: unknown,
    version: number = 1
  ) {
    this.id = uuidv4();
    this.occurredAt = new Date();
    this.version = version;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      eventData: this.eventData,
      occurredAt: this.occurredAt.toISOString(),
      version: this.version
    };
  }
}

/**
 * Domain Exception Classes
 */
export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class DomainInvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message, 'DOMAIN_INVARIANT_VIOLATION');
    this.name = 'DomainInvariantViolationError';
  }
}

export class AggregateNotFoundError extends DomainError {
  constructor(aggregateType: string, id: UUID) {
    super(`${aggregateType} with id ${id} not found`, 'AGGREGATE_NOT_FOUND');
    this.name = 'AggregateNotFoundError';
  }
}

export class ConcurrencyError extends DomainError {
  constructor(aggregateType: string, id: UUID, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for ${aggregateType} with id ${id}. Expected version ${expectedVersion}, but was ${actualVersion}`,
      'CONCURRENCY_ERROR'
    );
    this.name = 'ConcurrencyError';
  }
}

/**
 * Repository Interface for Aggregates
 */
export interface IAggregateRepository<T extends AggregateRoot> {
  findById(id: UUID): Promise<T | null>;
  save(aggregate: T): Promise<void>;
  delete(id: UUID): Promise<void>;
  exists(id: UUID): Promise<boolean>;
}

/**
 * Domain Service Base Class
 */
export abstract class DomainService {
  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected createDomainEvent<T>(
    aggregateId: UUID,
    eventType: string,
    eventData: T,
    version: number = 1
  ): DomainEvent {
    return new (class extends DomainEvent {
      constructor() {
        super(aggregateId, eventType, eventData, version);
      }
    })();
  }
}

/**
 * Value Object Base Class
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = Object.freeze(this.deepFreeze(value));
  }

  public get value(): T {
    return this._value;
  }

  // Equality based on value
  public equals(other: ValueObject<T>): boolean {
    if (!(other instanceof ValueObject)) {
      return false;
    }
    return this.deepEquals(this._value, other._value);
  }

  // Abstract validation method
  protected abstract validate(value: T): void;

  // Deep freeze for immutability
  private deepFreeze(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null && typeof obj[prop] === 'object') {
        this.deepFreeze(obj[prop]);
      }
    });

    return Object.freeze(obj);
  }

  // Deep equality check
  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEquals(a[key], b[key])) return false;
      }

      return true;
    }

    return false;
  }

  public toJSON(): T {
    return this._value;
  }

  public toString(): string {
    return JSON.stringify(this._value);
  }
}

/**
 * Entity Base Class (for entities that are not aggregate roots)
 */
export abstract class Entity {
  protected readonly _id: UUID;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id?: UUID) {
    this._id = id || uuidv4();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  public get id(): UUID {
    return this._id;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  public equals(other: Entity): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id === other._id;
  }

  protected abstract validate(): void;

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}

/**
 * Specification Pattern Base Class
 */
export abstract class Specification<T> {
  public abstract isSatisfiedBy(candidate: T): boolean;

  public and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  public or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  public not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  public isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  public isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private readonly specification: Specification<T>) {
    super();
  }

  public isSatisfiedBy(candidate: T): boolean {
    return !this.specification.isSatisfiedBy(candidate);
  }
}

/**
 * Domain Event Handler Interface
 */
export interface IDomainEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Event Bus Interface
 */
export interface IEventBus {
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: IDomainEvent[]): Promise<void>;
  subscribe<T extends IDomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void;
}

/**
 * Unit of Work Interface
 */
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  registerNew<T extends AggregateRoot>(aggregate: T): void;
  registerDirty<T extends AggregateRoot>(aggregate: T): void;
  registerDeleted<T extends AggregateRoot>(aggregate: T): void;
  isInTransaction(): boolean;
}
