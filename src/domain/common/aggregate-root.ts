/**
 * Aggregate Root - Domain Layer
 * Base class for domain aggregates that manage domain events
 */

import { BaseEntity } from './base-entity';
import { DomainEvent } from './domain-events';

export abstract class AggregateRoot extends BaseEntity {
  private _domainEvents: DomainEvent[] = [];

  constructor(id: string, createdAt?: Date) {
    super(id, createdAt);
  }

  get domainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this.markAsUpdated();
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }
}
