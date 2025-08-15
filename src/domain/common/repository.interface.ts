/**
 * Repository Interfaces - Domain Layer
 * Contracts for data persistence without implementation details
 */

import { AggregateRoot } from './aggregate-root';

export interface Repository<T extends AggregateRoot> {
  findById(id: string): Promise<T | null>;
  save(aggregate: T): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface QueryResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface ReadRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<QueryResult<T>>;
  count(filters?: Record<string, any>): Promise<number>;
  exists(id: string): Promise<boolean>;
}
