/**
 * Executive Assistant AI - Professional Response Builder Utility
 * Standardized response construction following REST API best practices
 * 
 * @fileoverview Response builder utility providing:
 * - Consistent response formatting
 * - Automatic metadata generation
 * - Error response standardization
 * - Pagination support
 * - Performance tracking
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import { HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ValidationErrorResponse,
  ApiResponseMetadata,
  PaginationMetadata,
  ValidationErrorDetail,
  ApiErrorCode,
  API_STATUS_CODES,
  API_ERROR_CODES,
} from '../types/api-response.types';

/**
 * Response builder configuration
 */
interface ResponseBuilderConfig {
  /** Application version */
  version: string;
  /** Environment name */
  environment: string;
  /** Include stack traces in error responses */
  includeStackTrace: boolean;
}

/**
 * Professional response builder utility
 */
export class ResponseBuilder {
  private static config: ResponseBuilderConfig = {
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    includeStackTrace: process.env.NODE_ENV === 'development',
  };

  /**
   * Configure the response builder
   */
  static configure(config: Partial<ResponseBuilderConfig>): void {
    ResponseBuilder.config = { ...ResponseBuilder.config, ...config };
  }

  /**
   * Create success response
   */
  static success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: HttpStatus = HttpStatus.OK,
    pagination?: PaginationMetadata,
    requestStartTime?: number,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      meta: ResponseBuilder.createMetadata(requestStartTime),
      ...(pagination && { pagination }),
    };
  }

  /**
   * Create error response
   */
  static error(
    error: ApiErrorCode | string,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
    requestStartTime?: number,
    stack?: string,
  ): ApiErrorResponse {
    const response: ApiErrorResponse = {
      success: false,
      statusCode,
      error,
      message,
      meta: ResponseBuilder.createMetadata(requestStartTime),
    };

    if (details) {
      response.details = details;
    }

    if (stack && ResponseBuilder.config.includeStackTrace) {
      response.stack = stack;
    }

    return response;
  }

  /**
   * Create validation error response
   */
  static validationError(
    errors: ValidationErrorDetail[],
    message: string = 'Validation failed',
    requestStartTime?: number,
  ): ValidationErrorResponse {
    return {
      success: false,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: API_ERROR_CODES.VALIDATION_FAILED,
      message,
      details: {
        errors,
        count: errors.length,
      },
      meta: ResponseBuilder.createMetadata(requestStartTime),
    };
  }

  /**
   * Create not found response
   */
  static notFound(
    resource: string,
    identifier?: string,
    requestStartTime?: number,
  ): ApiErrorResponse {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    return ResponseBuilder.error(
      API_ERROR_CODES.RESOURCE_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
      undefined,
      requestStartTime,
    );
  }

  /**
   * Create unauthorized response
   */
  static unauthorized(
    message: string = 'Authentication required',
    requestStartTime?: number,
  ): ApiErrorResponse {
    return ResponseBuilder.error(
      API_ERROR_CODES.INVALID_CREDENTIALS,
      message,
      HttpStatus.UNAUTHORIZED,
      undefined,
      requestStartTime,
    );
  }

  /**
   * Create forbidden response
   */
  static forbidden(
    message: string = 'Insufficient permissions',
    requestStartTime?: number,
  ): ApiErrorResponse {
    return ResponseBuilder.error(
      API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      message,
      HttpStatus.FORBIDDEN,
      undefined,
      requestStartTime,
    );
  }

  /**
   * Create rate limit exceeded response
   */
  static rateLimitExceeded(
    resetTime: number,
    requestStartTime?: number,
  ): ApiErrorResponse {
    return ResponseBuilder.error(
      API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded. Please try again later.',
      HttpStatus.TOO_MANY_REQUESTS,
      {
        resetTime,
        resetDate: new Date(resetTime * 1000).toISOString(),
      },
      requestStartTime,
    );
  }

  /**
   * Create external service error response
   */
  static externalServiceError(
    serviceName: string,
    originalError?: any,
    requestStartTime?: number,
  ): ApiErrorResponse {
    return ResponseBuilder.error(
      API_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      `External service '${serviceName}' is currently unavailable`,
      HttpStatus.BAD_GATEWAY,
      {
        service: serviceName,
        originalError: originalError?.message || 'Unknown error',
      },
      requestStartTime,
    );
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully',
    requestStartTime?: number,
  ): ApiSuccessResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMetadata = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return ResponseBuilder.success(
      items,
      message,
      HttpStatus.OK,
      pagination,
      requestStartTime,
    );
  }

  /**
   * Create created response
   */
  static created<T>(
    data: T,
    message: string = 'Resource created successfully',
    requestStartTime?: number,
  ): ApiSuccessResponse<T> {
    return ResponseBuilder.success(
      data,
      message,
      HttpStatus.CREATED,
      undefined,
      requestStartTime,
    );
  }

  /**
   * Create accepted response
   */
  static accepted<T>(
    data: T,
    message: string = 'Request accepted for processing',
    requestStartTime?: number,
  ): ApiSuccessResponse<T> {
    return ResponseBuilder.success(
      data,
      message,
      HttpStatus.ACCEPTED,
      undefined,
      requestStartTime,
    );
  }

  /**
   * Create no content response
   */
  static noContent(
    message: string = 'Operation completed successfully',
    requestStartTime?: number,
  ): ApiSuccessResponse<null> {
    return ResponseBuilder.success(
      null,
      message,
      HttpStatus.NO_CONTENT,
      undefined,
      requestStartTime,
    );
  }

  /**
   * Create response metadata
   */
  private static createMetadata(requestStartTime?: number): ApiResponseMetadata {
    const now = Date.now();
    const responseTime = requestStartTime ? now - requestStartTime : 0;

    return {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
      version: ResponseBuilder.config.version,
      responseTime,
      environment: ResponseBuilder.config.environment,
    };
  }
}

/**
 * Validation error builder utility
 */
export class ValidationErrorBuilder {
  private errors: ValidationErrorDetail[] = [];

  /**
   * Add validation error
   */
  addError(
    field: string,
    value: any,
    constraint: string,
    message: string,
  ): ValidationErrorBuilder {
    this.errors.push({
      field,
      value,
      constraint,
      message,
    });
    return this;
  }

  /**
   * Add required field error
   */
  addRequiredError(field: string): ValidationErrorBuilder {
    return this.addError(
      field,
      undefined,
      'required',
      `${field} is required`,
    );
  }

  /**
   * Add invalid format error
   */
  addFormatError(
    field: string,
    value: any,
    expectedFormat: string,
  ): ValidationErrorBuilder {
    return this.addError(
      field,
      value,
      'format',
      `${field} must be a valid ${expectedFormat}`,
    );
  }

  /**
   * Add range error
   */
  addRangeError(
    field: string,
    value: any,
    min?: number,
    max?: number,
  ): ValidationErrorBuilder {
    let message = `${field} is out of range`;
    if (min !== undefined && max !== undefined) {
      message = `${field} must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      message = `${field} must be at least ${min}`;
    } else if (max !== undefined) {
      message = `${field} must be at most ${max}`;
    }

    return this.addError(field, value, 'range', message);
  }

  /**
   * Build validation error response
   */
  build(
    message: string = 'Validation failed',
    requestStartTime?: number,
  ): ValidationErrorResponse {
    return ResponseBuilder.validationError(
      this.errors,
      message,
      requestStartTime,
    );
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errors.length;
  }

  /**
   * Clear all errors
   */
  clear(): ValidationErrorBuilder {
    this.errors = [];
    return this;
  }
}
