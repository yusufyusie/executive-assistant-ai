/**
 * Executive Assistant AI - Professional API Response Types
 * Standardized response formats following REST API best practices
 * 
 * @fileoverview Comprehensive API response type system supporting:
 * - Consistent response formats
 * - Proper HTTP status codes
 * - Error handling standards
 * - Pagination support
 * - Metadata inclusion
 * - Type safety
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import { HttpStatus } from '@nestjs/common';

/**
 * Standard API response metadata
 */
export interface ApiResponseMetadata {
  /** Request timestamp in ISO format */
  timestamp: string;
  /** Request ID for tracing */
  requestId: string;
  /** API version */
  version: string;
  /** Response time in milliseconds */
  responseTime: number;
  /** Environment (development, staging, production) */
  environment: string;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetadata {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more items */
  hasNext: boolean;
  /** Whether there are previous items */
  hasPrevious: boolean;
}

/**
 * Standard success response format
 */
export interface ApiSuccessResponse<T = any> {
  /** Success indicator */
  success: true;
  /** HTTP status code */
  statusCode: HttpStatus;
  /** Human-readable message */
  message: string;
  /** Response data */
  data: T;
  /** Response metadata */
  meta: ApiResponseMetadata;
  /** Pagination info (for list responses) */
  pagination?: PaginationMetadata;
}

/**
 * Standard error response format
 */
export interface ApiErrorResponse {
  /** Success indicator */
  success: false;
  /** HTTP status code */
  statusCode: HttpStatus;
  /** Error type/code */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Detailed error information */
  details?: any;
  /** Response metadata */
  meta: ApiResponseMetadata;
  /** Stack trace (development only) */
  stack?: string;
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  /** Field name that failed validation */
  field: string;
  /** Value that was provided */
  value: any;
  /** Validation constraint that failed */
  constraint: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  /** Validation error details */
  details: {
    /** List of validation errors */
    errors: ValidationErrorDetail[];
    /** Total number of validation errors */
    count: number;
  };
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  /** Maximum requests allowed */
  limit: number;
  /** Remaining requests */
  remaining: number;
  /** Reset time in seconds */
  resetTime: number;
  /** Reset time as ISO string */
  resetDate: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp of check */
  timestamp: string;
  /** Application uptime in seconds */
  uptime: number;
  /** Memory usage information */
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  /** Service dependencies status */
  dependencies: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime?: number;
      lastCheck: string;
      error?: string;
    };
  };
  /** Feature flags status */
  features: {
    [featureName: string]: boolean;
  };
}

/**
 * API documentation response
 */
export interface ApiDocumentationResponse {
  /** API title */
  title: string;
  /** API version */
  version: string;
  /** API description */
  description: string;
  /** Base URL */
  baseUrl: string;
  /** Available endpoints */
  endpoints: {
    [category: string]: {
      [endpoint: string]: {
        method: string;
        description: string;
        parameters?: any;
        responses?: any;
        examples?: any;
      };
    };
  };
  /** Authentication information */
  authentication: {
    type: string;
    description: string;
    examples?: any;
  };
  /** Rate limiting information */
  rateLimiting: {
    enabled: boolean;
    limits: {
      [endpoint: string]: {
        requests: number;
        window: string;
      };
    };
  };
}

/**
 * Metrics response
 */
export interface MetricsResponse {
  /** Application metrics */
  application: {
    /** Total requests processed */
    totalRequests: number;
    /** Requests per minute */
    requestsPerMinute: number;
    /** Average response time */
    averageResponseTime: number;
    /** Error rate percentage */
    errorRate: number;
  };
  /** AI service metrics */
  aiServices: {
    /** Gemini API usage */
    gemini: {
      requestsToday: number;
      remainingQuota: number;
      averageResponseTime: number;
      successRate: number;
    };
  };
  /** External service metrics */
  externalServices: {
    /** Google Calendar API */
    googleCalendar: {
      requestsToday: number;
      successRate: number;
      averageResponseTime: number;
    };
    /** SendGrid API */
    sendgrid: {
      emailsSentToday: number;
      deliveryRate: number;
      bounceRate: number;
    };
  };
  /** Performance metrics */
  performance: {
    /** CPU usage percentage */
    cpuUsage: number;
    /** Memory usage percentage */
    memoryUsage: number;
    /** Active connections */
    activeConnections: number;
  };
}

/**
 * Standard HTTP status codes used in the API
 */
export const API_STATUS_CODES = {
  // Success
  OK: HttpStatus.OK,
  CREATED: HttpStatus.CREATED,
  ACCEPTED: HttpStatus.ACCEPTED,
  NO_CONTENT: HttpStatus.NO_CONTENT,
  
  // Client Errors
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  METHOD_NOT_ALLOWED: HttpStatus.METHOD_NOT_ALLOWED,
  CONFLICT: HttpStatus.CONFLICT,
  UNPROCESSABLE_ENTITY: HttpStatus.UNPROCESSABLE_ENTITY,
  TOO_MANY_REQUESTS: HttpStatus.TOO_MANY_REQUESTS,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  BAD_GATEWAY: HttpStatus.BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
} as const;

/**
 * Standard error codes used in the API
 */
export const API_ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business Logic
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

/**
 * Type for API error codes
 */
export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

/**
 * Type for API status codes
 */
export type ApiStatusCode = typeof API_STATUS_CODES[keyof typeof API_STATUS_CODES];
