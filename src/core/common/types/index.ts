/**
 * Core Type Definitions for Executive Assistant AI
 * Provides type-safe interfaces and types for the entire application
 */

// Base Types
export type UUID = string;
export type Timestamp = Date;
export type Email = string;
export type URL = string;

// Environment Types
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

// HTTP Status Codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

// API Response Types
export interface IApiResponse<TData = unknown> {
  readonly success: true;
  readonly data: TData;
  readonly metadata: IResponseMetadata;
}

export interface IApiErrorResponse {
  readonly success: false;
  readonly error: IErrorDetails;
  readonly metadata: IResponseMetadata;
}

export interface IResponseMetadata {
  readonly timestamp: string;
  readonly requestId: string;
  readonly version: string;
  readonly executionTime?: number;
  readonly pagination?: IPaginationMetadata;
}

export interface IErrorDetails {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly stack?: string;
  readonly path?: string;
}

// Pagination Types
export interface IPaginationMetadata {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

export interface IPaginationQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: SortOrder;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// Filter Types
export interface IFilterQuery {
  readonly search?: string;
  readonly filters?: Record<string, unknown>;
  readonly dateRange?: IDateRange;
}

export interface IDateRange {
  readonly startDate?: Date;
  readonly endDate?: Date;
}

// Configuration Types
export interface IBaseConfig {
  readonly name: string;
  readonly version: string;
  readonly environment: Environment;
  readonly debug: boolean;
}

// Database Types
export enum DatabaseType {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  MONGODB = 'mongodb'
}

export interface IDatabaseConfig {
  readonly type: DatabaseType;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly ssl: boolean;
  readonly synchronize: boolean;
  readonly logging: boolean;
  readonly maxConnections: number;
  readonly acquireTimeout: number;
  readonly timeout: number;
}

// Cache Types
export enum CacheType {
  MEMORY = 'memory',
  REDIS = 'redis'
}

export interface ICacheConfig {
  readonly type: CacheType;
  readonly ttl: number;
  readonly maxKeys: number;
  readonly redis?: IRedisConfig;
}

export interface IRedisConfig {
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly db: number;
  readonly keyPrefix: string;
  readonly maxRetriesPerRequest: number;
}

// Logging Types
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

export interface ILogConfig {
  readonly level: LogLevel;
  readonly format: string;
  readonly enableConsole: boolean;
  readonly enableFile: boolean;
  readonly filePath?: string;
  readonly maxFiles?: number;
  readonly maxSize?: string;
}

// Security Types
export interface ISecurityConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly bcryptRounds: number;
  readonly apiKey: string;
  readonly enableHelmet: boolean;
  readonly enableCors: boolean;
  readonly corsOrigins: string[];
}

// Rate Limiting Types
export interface IRateLimitConfig {
  readonly windowMs: number;
  readonly max: number;
  readonly skipSuccessfulRequests: boolean;
  readonly skipFailedRequests: boolean;
}

// Monitoring Types
export interface IMonitoringConfig {
  readonly enabled: boolean;
  readonly prometheus: IPrometheusConfig;
  readonly health: IHealthConfig;
}

export interface IPrometheusConfig {
  readonly enabled: boolean;
  readonly port: number;
  readonly path: string;
  readonly enableDefaultMetrics: boolean;
}

export interface IHealthConfig {
  readonly enabled: boolean;
  readonly path: string;
  readonly interval: number;
  readonly timeout: number;
}

// Event Types
export interface IDomainEvent {
  readonly id: UUID;
  readonly aggregateId: UUID;
  readonly eventType: string;
  readonly eventData: unknown;
  readonly occurredAt: Timestamp;
  readonly version: number;
}

export interface IEventHandler<TEvent extends IDomainEvent> {
  handle(event: TEvent): Promise<void>;
}

// Repository Types
export interface IRepository<TEntity, TId = UUID> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(query?: IFilterQuery & IPaginationQuery): Promise<TEntity[]>;
  save(entity: TEntity): Promise<TEntity>;
  update(id: TId, entity: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<void>;
  count(query?: IFilterQuery): Promise<number>;
}

// Use Case Types
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

export interface ICommand {
  readonly commandId: UUID;
  readonly timestamp: Timestamp;
}

export interface IQuery {
  readonly queryId: UUID;
  readonly timestamp: Timestamp;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export interface IQueryHandler<TQuery extends IQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

// Validation Types
export interface IValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly constraints?: Record<string, string>;
}

export interface IValidationResult {
  readonly isValid: boolean;
  readonly errors: IValidationError[];
}

// External Service Types
export interface IExternalServiceConfig {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

// AI Service Types
export interface IAiConfig {
  readonly provider: string;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly timeout: number;
  readonly rateLimit: IRateLimitConfig;
}

// Calendar Service Types
export interface ICalendarConfig {
  readonly provider: string;
  readonly defaultTimezone: string;
  readonly workingHours: IWorkingHours;
  readonly bufferTime: number;
  readonly maxLookahead: number;
}

export interface IWorkingHours {
  readonly start: string;
  readonly end: string;
  readonly days: number[];
}

// Email Service Types
export interface IEmailConfig {
  readonly provider: string;
  readonly fromEmail: string;
  readonly fromName: string;
  readonly trackOpens: boolean;
  readonly trackClicks: boolean;
  readonly rateLimit: IRateLimitConfig;
}

// Task Management Types
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Utility Types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NonEmptyArray<T> = [T, ...T[]];

// Result Type for Error Handling
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

// Factory function for Result type
export const Result = {
  success: <T>(data: T): Success<T> => ({ success: true, data }),
  failure: <E>(error: E): Failure<E> => ({ success: false, error })
};

// Type Guards
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => result.success;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success;
